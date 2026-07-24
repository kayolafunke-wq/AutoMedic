const express = require('express')
const router  = express.Router()
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')

// ── DASHBOARD SUMMARY ─────────────────────────────────────────────────────────
router.get('/dashboard', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [customers, todayAppts, activeRepairs, invoiceRevRow] = await Promise.all([
      db.query("SELECT COUNT(*)::int as cnt FROM users WHERE role='customer'"),
      db.query("SELECT COUNT(*)::int as cnt FROM appointments WHERE DATE(created_at) = CURRENT_DATE"),
      db.query("SELECT COUNT(*) ::int as cnt FROM job_cards WHERE status NOT IN ('completed','ready')"),

      // Revenue from PAID invoices this month
      db.query(`
        SELECT
          COALESCE(SUM(total), 0)::numeric AS monthly_revenue,
          COUNT(*)::int                    AS paid_invoices
        FROM invoices
        WHERE status = 'paid'
          AND TO_CHAR(COALESCE(paid_at, updated_at, created_at), 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
      `),
    ])

    const completedJobs = await db.query(
      "SELECT COUNT(*)::int as cnt FROM job_cards WHERE status = 'completed' AND TO_CHAR(updated_at, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')"
    )

    const monthly_revenue = Number(invoiceRevRow.rows[0].monthly_revenue || 0)

    res.json({
      success: true,
      data: {
        total_customers:     parseInt(customers.rows[0].cnt) || 0,
        todays_appointments: parseInt(todayAppts.rows[0].cnt) || 0,
        active_repairs:      parseInt(activeRepairs.rows[0].cnt) || 0,
        monthly_revenue:     monthly_revenue,
        completed_jobs:      parseInt(completedJobs.rows[0].cnt) || 0,
      }
    })
  } catch (err) { 
    console.error('Dashboard stats error:', err)
    res.status(500).json({ success:false, message:err.message }) 
  }
})

// ── MONTHLY REVENUE (last 12 months) — invoices only ───────────
router.get('/revenue', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Paid invoices grouped by month
    const invoiceRows = await db.query(`
      SELECT
        TO_CHAR(COALESCE(paid_at, updated_at, created_at), 'YYYY-MM') AS month,
        COUNT(DISTINCT appointment_id)                                AS appointments,
        COALESCE(SUM(total), 0)                                       AS invoice_revenue,
        COUNT(id)                                                     AS paid_invoices,
        COALESCE(SUM(total), 0)                                       AS total_revenue
      FROM invoices
      WHERE status = 'paid'
      GROUP BY TO_CHAR(COALESCE(paid_at, updated_at, created_at), 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `)

    const data = invoiceRows.rows.map(r => ({
      month:           r.month,
      appointments:    r.appointments,
      invoice_revenue: r.invoice_revenue,
      walkin_revenue:  0,
      walkin_sales:    0,
      paid_invoices:   r.paid_invoices,
      total_revenue:   r.total_revenue,
    }))

    res.json({ success:true, data })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

// ── MONTHLY DRILL-DOWN: paid invoices for a specific month ─────────
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
        AND TO_CHAR(COALESCE(inv.paid_at, inv.updated_at, inv.created_at), 'YYYY-MM') = $1
      ORDER BY COALESCE(inv.paid_at, inv.created_at) DESC
    `, [month])

    res.json({ success:true, data: invoices.rows })
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
// Note: Requires stock_checkouts table - returning empty data for now
router.get('/product-movement', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Fetch all active products
    const products = await db.query(
      'SELECT id, name, category, cost_price, price as selling_price, stock_quantity FROM products WHERE is_active = 1'
    )

    const result = products.rows.map(p => ({
      product_id:     p.id,
      name:           p.name,
      category:       p.category,
      cost_price:     p.cost_price,
      selling_price:  p.selling_price,
      stock_quantity: p.stock_quantity,
      total_qty_sold: 0,
      total_revenue:  0,
      transactions:   0,
      margin:         p.cost_price != null && p.selling_price != null
                        ? Number(p.selling_price) - Number(p.cost_price) : null,
    }))

    res.json({ success: true, data: { fast_moving: [], slow_moving: result.slice(0, 20), all: result } })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// ── TECHNICIAN MONTHLY REVENUE ────────────────────────────────────────────────
router.get('/technician-revenue', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Get current month's revenue per technician from completed job cards
    // Include all technicians even if they have no completed jobs
    const techRevenue = await db.query(`
      SELECT 
        t.name AS technician_name,
        t.id AS technician_id,
        COUNT(DISTINCT jc.id) AS jobs_completed,
        COALESCE(SUM(CASE 
          WHEN jc.final_cost IS NOT NULL AND jc.final_cost > 0 THEN jc.final_cost
          ELSE jc.estimated_cost
        END), 0) AS total_revenue
      FROM users t
      LEFT JOIN job_cards jc ON jc.technician_id = t.id 
        AND jc.status = 'completed'
        AND TO_CHAR(jc.updated_at, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
      WHERE t.role = 'technician'
      GROUP BY t.id, t.name
      ORDER BY total_revenue DESC, t.name
    `)

    res.json({ success: true, data: techRevenue.rows })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── TECHNICIAN HISTORICAL REVENUE (Last 6 months) ──────────────────────────────
router.get('/technician-revenue-history', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Get last 6 months of data per technician
    const historyQuery = await db.query(`
      SELECT 
        t.name AS technician_name,
        t.id AS technician_id,
        TO_CHAR(jc.updated_at, 'YYYY-MM') AS month,
        COUNT(DISTINCT jc.id) AS jobs_completed,
        COALESCE(SUM(CASE 
          WHEN jc.final_cost IS NOT NULL AND jc.final_cost > 0 THEN jc.final_cost
          ELSE jc.estimated_cost
        END), 0) AS total_revenue
      FROM users t
      LEFT JOIN job_cards jc ON jc.technician_id = t.id 
        AND jc.status = 'completed'
        AND jc.updated_at >= CURRENT_DATE - INTERVAL '6 months'
      WHERE t.role = 'technician'
        AND jc.id IS NOT NULL
      GROUP BY t.id, t.name, TO_CHAR(jc.updated_at, 'YYYY-MM')
      ORDER BY month DESC, t.name
    `)

    res.json({ success: true, data: historyQuery.rows })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── TECHNICIAN REVENUE FOR SPECIFIC MONTH ──────────────────────────────────────
router.get('/technician-revenue/:month', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { month } = req.params // Format: YYYY-MM
    
    // Get technician revenue for the specified month
    // Include all technicians even if they have no completed jobs that month
    const techRevenue = await db.query(`
      SELECT 
        t.name AS technician_name,
        t.id AS technician_id,
        COUNT(DISTINCT jc.id) AS jobs_completed,
        COALESCE(SUM(CASE 
          WHEN jc.final_cost IS NOT NULL AND jc.final_cost > 0 THEN jc.final_cost
          ELSE jc.estimated_cost
        END), 0) AS total_revenue
      FROM users t
      LEFT JOIN job_cards jc ON jc.technician_id = t.id 
        AND jc.status = 'completed'
        AND TO_CHAR(jc.updated_at, 'YYYY-MM') = $1
      WHERE t.role = 'technician'
      GROUP BY t.id, t.name
      ORDER BY total_revenue DESC, t.name
    `, [month])

    res.json({ success: true, data: techRevenue.rows })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
