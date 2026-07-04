const express = require('express')
const router  = express.Router()
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')
const inventorySvc = require('../services/inventory.service')

// ── GET all inventory logs (filterable) ──────────────────────────────────────
// Query params: product_id, type (stock_in|stock_out|adjustment), from, to, limit
router.get('/logs', authenticate, authorize('admin', 'stockkeeper'), async (req, res) => {
  try {
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
    if (product_id) { sql += ' AND il.product_id = ?';           params.push(product_id) }
    if (type)       { sql += ' AND il.type = ?';                  params.push(type) }
    if (from)       { sql += ' AND il.created_at >= ?';           params.push(from) }
    if (to)         { sql += ' AND il.created_at <= ? || "T23:59:59"'; params.push(to) }
    sql += ' ORDER BY il.created_at DESC LIMIT ?'
    params.push(Number(limit))

    const r = await db.query(sql, params)
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// ── GET summary per product ───────────────────────────────────────────────────
router.get('/summary', authenticate, authorize('admin', 'stockkeeper'), async (req, res) => {
  try {
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
      WHERE il.product_id = ?
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
