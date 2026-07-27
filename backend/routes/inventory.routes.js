const express = require('express')
const router  = express.Router()
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')
const inventorySvc = require('../services/inventory.service')

// ── GET all inventory logs (filterable) ──────────────────────────────────────
// Query params: product_id, type (stock_in|stock_out|adjustment), from, to, limit
router.get('/logs', authenticate, authorize('admin', 'stockkeeper'), async (req, res) => {
  try {
    // Ensure table exists — self-heals on first request
    await db.query(`
      CREATE TABLE IF NOT EXISTS inventory_logs (
        id          VARCHAR(255) PRIMARY KEY,
        product_id  VARCHAR(255) REFERENCES products(id) ON DELETE CASCADE,
        type        VARCHAR(50) NOT NULL,
        qty_change  INTEGER NOT NULL,
        qty_before  INTEGER NOT NULL,
        qty_after   INTEGER NOT NULL,
        reason      TEXT,
        reference   TEXT,
        created_by  VARCHAR(255),
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {})

    const { product_id, type, from, to, limit = 500 } = req.query
    let sql = `
      SELECT il.*,
        p.name  AS product_name,
        p.category AS product_category,
        u.name  AS created_by_name
      FROM inventory_logs il
      LEFT JOIN products p ON il.product_id = p.id
      LEFT JOIN users u    ON il.created_by  = u.id
      WHERE 1=1
    `
    const params = []
    let paramIndex = 1
    if (product_id) { sql += ` AND il.product_id = $${paramIndex++}`;  params.push(product_id) }
    if (type)       { sql += ` AND il.type = $${paramIndex++}`;         params.push(type) }
    if (from)       { sql += ` AND il.created_at >= $${paramIndex++}`;  params.push(from) }
    if (to)         { sql += ` AND il.created_at <= $${paramIndex++}`;  params.push(to + 'T23:59:59') }
    sql += ` ORDER BY il.created_at DESC LIMIT $${paramIndex++}`
    params.push(Number(limit))

    // Backfill inventory_logs for existing stock_checkouts (runs quickly, skips already logged items)
    try {
      const crypto2 = require('crypto')
      const scRows = await db.query('SELECT * FROM stock_checkouts ORDER BY created_at ASC')
      for (const sc of (scRows.rows || [])) {
        let items = []
        try { items = typeof sc.items === 'string' ? JSON.parse(sc.items) : (sc.items || []) } catch {}
        for (const item of items) {
          if (!item.product_id) continue
          const exists = await db.query(
            'SELECT id FROM inventory_logs WHERE reference = $1 AND product_id = $2',
            [sc.id, item.product_id]
          )
          if (!exists.rows.length) {
            await db.query(
              `INSERT INTO inventory_logs (id, product_id, type, qty_change, qty_before, qty_after, reason, reference, created_by, created_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
              [
                crypto2.randomBytes(16).toString('hex'),
                item.product_id,
                'stock_out',
                -Math.abs(Number(item.qty || 1)),
                Number(item.qty || 1),
                0,
                'Stock out — checkout (backfilled)',
                sc.id,
                sc.created_by || null,
                sc.created_at || new Date()
              ]
            )
          }
        }
      }
    } catch (bfErr) { console.warn('backfill skip:', bfErr.message) }

    const r = await db.query(sql, params)
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// ── GET summary per product ───────────────────────────────────────────────────
router.get('/summary', authenticate, authorize('admin', 'stockkeeper'), async (req, res) => {
  try {
    // Ensure table exists — self-heals on first request
    await db.query(`
      CREATE TABLE IF NOT EXISTS inventory_logs (
        id          VARCHAR(255) PRIMARY KEY,
        product_id  VARCHAR(255) REFERENCES products(id) ON DELETE CASCADE,
        type        VARCHAR(50) NOT NULL,
        qty_change  INTEGER NOT NULL,
        qty_before  INTEGER NOT NULL,
        qty_after   INTEGER NOT NULL,
        reason      TEXT,
        reference   TEXT,
        created_by  VARCHAR(255),
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {})

    const r = await db.query(`
      SELECT
        p.id, p.name, p.category, p.stock_quantity, p.cost_price, p.price,
        COALESCE(SUM(CASE WHEN il.type='stock_in'   THEN il.qty_change ELSE 0 END), 0) AS total_in,
        COALESCE(SUM(CASE WHEN il.type='stock_out'  THEN ABS(il.qty_change) ELSE 0 END), 0) AS total_out,
        COALESCE(SUM(CASE WHEN il.type='adjustment' THEN il.qty_change ELSE 0 END), 0) AS total_adjusted,
        COUNT(il.id) AS total_movements,
        MAX(il.created_at) AS last_movement
      FROM products p
      LEFT JOIN inventory_logs il ON il.product_id = p.id
      WHERE p.is_active = 1
      GROUP BY p.id
      ORDER BY last_movement DESC NULLS LAST
    `)
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// ── GET logs for a single product ────────────────────────────────────────────
router.get('/logs/:product_id', authenticate, authorize('admin', 'stockkeeper'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT il.*, u.name AS created_by_name
      FROM inventory_logs il
      LEFT JOIN users u ON il.created_by = u.id
      WHERE il.product_id = $1
      ORDER BY il.created_at DESC
      LIMIT 100
    `, [req.params.product_id])
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// ── POST manual adjustment ────────────────────────────────────────────────────
router.post('/adjust', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { product_id, new_quantity, reason } = req.body
    if (!product_id || new_quantity === undefined)
      return res.status(400).json({ success: false, message: 'product_id and new_quantity are required' })
    if (Number(new_quantity) < 0)
      return res.status(400).json({ success: false, message: 'new_quantity cannot be negative' })

    const result = await inventorySvc.adjustStock(product_id, Number(new_quantity), reason, req.user.id)
    res.json({
      success: true,
      message: `Stock adjusted from ${result.qtyBefore} to ${result.qtyAfter}`,
      qty_before: result.qtyBefore,
      qty_after:  result.qtyAfter,
    })
  } catch (err) { res.status(400).json({ success: false, message: err.message }) }
})

module.exports = router
