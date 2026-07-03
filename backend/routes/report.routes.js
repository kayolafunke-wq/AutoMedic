const express = require('express')
const router  = express.Router()
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')

// ── DASHBOARD SUMMARY ─────────────────────────────────────────────────────────
router.get('/dashboard', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [customers, todayAppts, activeRepairs, invoiceRevRow, walkinRevRow] = await Promise.all([
      db.query("SELECT COUNT(*) as cnt FROM users WHERE role='customer'"),
      db.query("SELECT COUNT(*) as cnt FROM appointments WHERE date(created_at)=date('now')"),
      db.query("SELECT COUNT(*) as cnt FROM job_cards WHERE status NOT IN ('completed','ready')"),

      // Revenue from PAID invoices this month
      db.query(`
        SELECT
          COALESCE(SUM(total), 0) AS monthly_revenue,
          COUNT(*)                AS paid_invoices
        FROM invoices
        WHERE status = 'paid'
          AND strftime('%Y-%m', COALESCE(paid_at, updated_at, created_at)) = strftime('%Y-%m', 'now')
      `),

      // Revenue from walk-in stock checkouts this month (not linked to an invoice)
      db.query(`
        SELECT COALESCE(SUM(sc.total), 0) AS walkin_revenue
        FROM stock_checkouts sc
        WHERE sc.type = 'walkin'
          AND sc.invoice_id IS NOT NULL
          AND strftime('%Y-%m', sc.created_at) = strftime('%Y-%m', 'now')
          AND NOT EXISTS (
            SELECT 1 FROM invoices inv
            WHERE inv.id = sc.invoice_id AND inv.status = 'paid'
          )
      `),
    ])

    const completedJobs = await db.query(
      "SELECT COUNT(*) as cnt FROM job_cards WHERE status = 'completed' AND strftime('%Y-%m', updated_at) = strftime('%Y-%m', 'now')"
    )

    const monthly_revenue =
      Number(invoiceRevRow.rows[0].monthly_revenue || 0) +
      Number(walkinRevRow.rows[0].walkin_revenue   || 0)

    res.json({
      success: true,
      data: {
        total_customers:     customers.rows[0].cnt,
        todays_appointments: todayAppts.rows[0].cnt,
        active_repairs:      activeRepairs.rows[0].cnt,
        monthly_revenue,
        completed_jobs:      completedJobs.rows[0].cnt || 0,
      }
    })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

// ── MONTHLY REVENUE (last 12 months) — invoices + walk-in checkouts ───────────
router.get('/revenue', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Paid invoices grouped by month
    const invoiceRows = await db.query(`
      SELECT
        strftime('%Y-%m', COALESCE(paid_at, updated_at, created_at)) AS month,
        COUNT(DISTINCT appointment_id)                                AS appointments,
        COALESCE(SUM(total), 0)                                       AS invoice_revenue,
        COUNT(id)                                                     AS paid_invoices
      FROM invoices
      WHERE status = 'paid'
      GROUP BY strftime('%Y-%m', COALESCE(paid_at, updated_at, created_at))
    `)

    // Walk-in checkout totals grouped by month
    const walkinRows = await db.query(`
      SELECT
        strftime('%Y-%m', created_at) AS month,
        COALESCE(SUM(total), 0)       AS walkin_revenue,
        COUNT(id)                     AS walkin_sales
      FROM stock_checkouts
      WHERE type = 'walkin'
      GROUP BY strftime('%Y-%m', created_at)
    `)

    // Merge by month
    const map = {}
    for (const r of invoiceRows.rows) {
      map[r.month] = {
        month:           r.month,
        appointments:    r.appointments,
        invoice_revenue: r.invoice_revenue,
        walkin_revenue:  0,
        walkin_sales:    0,
        paid_invoices:   r.paid_invoices,
        total_revenue:   r.invoice_revenue,
      }
    }
    for (const r of walkinRows.rows) {
      if (map[r.month]) {
        map[r.month].walkin_revenue = r.walkin_revenue
        map[r.month].walkin_sales   = r.walkin_sales
        map[r.month].total_revenue += r.walkin_revenue
      } else {
        map[r.month] = {
          month:           r.month,
          appointments:    0,
          invoice_revenue: 0,
          walkin_revenue:  r.walkin_revenue,
          walkin_sales:    r.walkin_sales,
          paid_invoices:   0,
          total_revenue:   r.walkin_revenue,
        }
      }
    }

    const data = Object.values(map)
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12)

    res.json({ success:true, data })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

// ── MONTHLY DRILL-DOWN: paid invoices + walk-ins for a specific month ─────────
router.get('/revenue/:month', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { month } = req.params   // format: YYYY-MM

    const invoices = await db.query(`
      SELECT
        inv.id              AS invoice_id,
        inv.invoice_number,
        inv.total           AS final_cost,
        inv.subtotal        AS estimated_cost,
        inv.status,
        inv.created_at,
        inv.paid_at,
        'invoice'           AS record_type,
        a.tracking_number,
        a.preferred_date,
        a.problem_description,
        jc.technician_notes,
        jc.progress,
        u.name   AS customer_name,
        u.phone  AS customer_phone,
        v.make, v.model, v.registration_number,
        s.name   AS service_name,
        t.name   AS technician_name
      FROM invoices inv
      LEFT JOIN appointments a  ON inv.appointment_id  = a.id
      LEFT JOIN job_cards jc    ON jc.appointment_id   = a.id
      LEFT JOIN users u         ON inv.customer_id     = u.id
      LEFT JOIN vehicles v      ON a.vehicle_id        = v.id
      LEFT JOIN services s      ON a.service_id        = s.id
      LEFT JOIN users t         ON jc.technician_id    = t.id
      WHERE inv.status = 'paid'
        AND strftime('%Y-%m', COALESCE(inv.paid_at, inv.updated_at, inv.created_at)) = ?
      ORDER BY COALESCE(inv.paid_at, inv.created_at) DESC
    `, [month])

    const walkins = await db.query(`
      SELECT
        sc.id               AS invoice_id,
        NULL                AS invoice_number,
        sc.total            AS final_cost,
        sc.subtotal         AS estimated_cost,
        'walkin'            AS status,
        sc.created_at,
        sc.created_at       AS paid_at,
        'walkin'            AS record_type,
        NULL                AS tracking_number,
        NULL                AS preferred_date,
        sc.notes            AS problem_description,
        NULL                AS technician_notes,
        NULL                AS progress,
        sc.customer_name,
        NULL                AS customer_phone,
        NULL AS make, NULL AS model, NULL AS registration_number,
        'Walk-in Sale'      AS service_name,
        u.name              AS technician_name
      FROM stock_checkouts sc
      LEFT JOIN users u ON sc.created_by = u.id
      WHERE sc.type = 'walkin'
        AND strftime('%Y-%m', sc.created_at) = ?
      ORDER BY sc.created_at DESC
    `, [month])

    res.json({ success:true, data: [...invoices.rows, ...walkins.rows] })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

// ── SERVICES BREAKDOWN ────────────────────────────────────────────────────────
router.get('/services', authenticate, authorize('admin'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT s.name, COUNT(a.id) as count
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      GROUP BY s.name
      ORDER BY count DESC
    `)
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

// ── PRODUCT MOVEMENT REPORT ────────────────────────────────────────────────────
// Fast-moving: products with highest total qty sold in last 90 days
// Slow-moving: active products with low or zero sales in last 90 days
router.get('/product-movement', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Aggregate qty sold per product from stock_checkout items (JSON array)
    // We join to products for current stock + price info
    const checkouts = await db.query(`
      SELECT items, created_at FROM stock_checkouts
      WHERE created_at >= date('now', '-90 days')
    `)

    // Parse JSON items and aggregate per product_id
    const movement = {}
    for (const row of checkouts.rows) {
      let items = []
      try { items = JSON.parse(row.items || '[]') } catch { continue }
      for (const item of items) {
        if (!item.product_id) continue
        if (!movement[item.product_id]) {
          movement[item.product_id] = { product_id: item.product_id, name: item.name || '', total_qty: 0, total_revenue: 0, transactions: 0 }
        }
        movement[item.product_id].total_qty      += Number(item.qty || 0)
        movement[item.product_id].total_revenue  += Number(item.qty || 0) * Number(item.unit_price || 0)
        movement[item.product_id].transactions   += 1
      }
    }

    // Fetch all active products
    const products = await db.query(
      'SELECT id, name, category, cost_price, price as selling_price, stock_quantity FROM products WHERE is_active = 1'
    )

    const result = products.rows.map(p => {
      const m = movement[p.id] || { total_qty: 0, total_revenue: 0, transactions: 0 }
      return {
        product_id:    p.id,
        name:          p.name,
        category:      p.category,
        cost_price:    p.cost_price,
        selling_price: p.selling_price,
        stock_quantity:p.stock_quantity,
        total_qty_sold:m.total_qty,
        total_revenue: m.total_revenue,
        transactions:  m.transactions,
        // margin per unit
        margin:        p.cost_price != null && p.selling_price != null
                         ? Number(p.selling_price) - Number(p.cost_price) : null,
      }
    })

    // Sort by qty sold descending
    result.sort((a, b) => b.total_qty_sold - a.total_qty_sold)

    const fast = result.filter(p => p.total_qty_sold > 0).slice(0, 10)
    const slow = result.filter(p => p.total_qty_sold === 0 || p.total_qty_sold <= 2)
                       .sort((a, b) => a.total_qty_sold - b.total_qty_sold)
                       .slice(0, 20)

    res.json({ success: true, data: { fast_moving: fast, slow_moving: slow, all: result } })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

module.exports = router
