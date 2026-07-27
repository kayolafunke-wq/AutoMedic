const express  = require('express')
const router   = express.Router()
const crypto   = require('crypto')
const db       = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')
const inventorySvc = require('../services/inventory.service')

// ── Shared helper: guarantee inventory_logs table + all columns exist ────────
async function ensureInventoryLogs () {
  // Create table if missing — no FK constraints for resilience
  await db.query(`
    CREATE TABLE IF NOT EXISTS inventory_logs (
      id                VARCHAR(255) PRIMARY KEY,
      product_id        VARCHAR(255),
      type              VARCHAR(50)  DEFAULT 'stock_out',
      quantity_change   INTEGER      DEFAULT 0,
      quantity_before   INTEGER      DEFAULT 0,
      quantity_after    INTEGER      DEFAULT 0,
      qty_change        INTEGER      DEFAULT 0,
      qty_before        INTEGER      DEFAULT 0,
      qty_after         INTEGER      DEFAULT 0,
      reason            TEXT,
      reference         TEXT,
      job_card_id       VARCHAR(255),
      created_by        VARCHAR(255),
      created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(() => {})

  // Add missing columns — old migration uses quantity_*, new code uses qty_*
  // We add BOTH so both old and new rows work. No NOT NULL to avoid ALTER TABLE failures.
  const cols = [
    `ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS quantity_change INTEGER DEFAULT 0`,
    `ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS quantity_before INTEGER DEFAULT 0`,
    `ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS quantity_after  INTEGER DEFAULT 0`,
    `ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS qty_change      INTEGER DEFAULT 0`,
    `ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS qty_before      INTEGER DEFAULT 0`,
    `ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS qty_after       INTEGER DEFAULT 0`,
    `ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS reference       TEXT`,
    `ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS reason          TEXT`,
    `ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS job_card_id     VARCHAR(255)`,
    `ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS created_by      VARCHAR(255)`,
    `ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
  ]
  for (const col of cols) {
    await db.query(col).catch(() => {})
  }
}

// ── Shared helper: backfill inventory_logs from stock_checkouts ──────────────
async function backfillFromCheckouts () {
  try {
    const scRows = await db.query('SELECT id, items, created_by, created_at FROM stock_checkouts')
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
          const qty = Math.abs(Number(item.qty || 1))
          await db.query(
            `INSERT INTO inventory_logs
               (id, product_id, type, qty_change, qty_before, qty_after, reason, reference, created_by, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [
              crypto.randomBytes(16).toString('hex'),
              item.product_id,
              'stock_out',
              -qty,
              qty,
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
  } catch (e) {
    console.warn('[inventory] backfill skip:', e.message)
  }
}

// ── GET all inventory logs (filterable) ──────────────────────────────────────
router.get('/logs', authenticate, authorize('admin', 'stockkeeper'), async (req, res) => {
  try {
    await ensureInventoryLogs()
    await backfillFromCheckouts()

    const { product_id, type, from, to, limit = 500 } = req.query
    // COALESCE both old (quantity_*) and new (qty_*) column names for compatibility
    let sql = `
      SELECT
        il.id, il.product_id, il.type, il.reason, il.reference, il.created_by, il.created_at,
        COALESCE(il.qty_change,  il.quantity_change, 0) AS qty_change,
        COALESCE(il.qty_before,  il.quantity_before, 0) AS qty_before,
        COALESCE(il.qty_after,   il.quantity_after,  0) AS qty_after,
        p.name     AS product_name,
        p.category AS product_category,
        u.name     AS created_by_name
      FROM inventory_logs il
      LEFT JOIN products p ON il.product_id = p.id
      LEFT JOIN users u    ON il.created_by  = u.id
      WHERE 1=1
    `
    const params = []
    let i = 1
    if (product_id) { sql += ` AND il.product_id = $${i++}`; params.push(product_id) }
    if (type && type !== 'all') { sql += ` AND il.type = $${i++}`; params.push(type) }
    if (from) { sql += ` AND il.created_at >= $${i++}`; params.push(from) }
    if (to)   { sql += ` AND il.created_at <= $${i++}`; params.push(to + 'T23:59:59') }
    sql += ` ORDER BY il.created_at DESC LIMIT $${i++}`
    params.push(Number(limit))

    const r = await db.query(sql, params)
    res.json({ success: true, data: r.rows })
  } catch (err) {
    console.error('[GET /inventory/logs]', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── GET summary per product ───────────────────────────────────────────────────
router.get('/summary', authenticate, authorize('admin', 'stockkeeper'), async (req, res) => {
  try {
    await ensureInventoryLogs()

    const r = await db.query(`
      SELECT
        p.id, p.name, p.category, p.stock_quantity,
        COALESCE(p.cost_price, 0) AS cost_price,
        COALESCE(p.price, 0) AS price,
        COALESCE(SUM(CASE WHEN il.type='stock_in'   THEN  COALESCE(il.qty_change, il.quantity_change, 0) ELSE 0 END), 0) AS total_in,
        COALESCE(SUM(CASE WHEN il.type='stock_out'  THEN -COALESCE(il.qty_change, il.quantity_change, 0) ELSE 0 END), 0) AS total_out,
        COALESCE(SUM(CASE WHEN il.type='adjustment' THEN  COALESCE(il.qty_change, il.quantity_change, 0) ELSE 0 END), 0) AS total_adjusted,
        COUNT(il.id)       AS total_movements,
        MAX(il.created_at) AS last_movement
      FROM products p
      LEFT JOIN inventory_logs il ON il.product_id = p.id
      WHERE p.is_active = 1
      GROUP BY p.id, p.name, p.category, p.stock_quantity, p.cost_price, p.price
      ORDER BY last_movement DESC NULLS LAST
    `)
    res.json({ success: true, data: r.rows })
  } catch (err) {
    console.error('[GET /inventory/summary]', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── GET logs for a single product ────────────────────────────────────────────
router.get('/logs/:product_id', authenticate, authorize('admin', 'stockkeeper'), async (req, res) => {
  try {
    await ensureInventoryLogs()
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
    await ensureInventoryLogs()
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
