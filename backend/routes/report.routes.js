const express = require('express')
const router  = express.Router()
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')

router.get('/dashboard', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [customers, todayAppts, activeRepairs] = await Promise.all([
      db.query("SELECT COUNT(*) as cnt FROM users WHERE role='customer'"),
      db.query("SELECT COUNT(*) as cnt FROM appointments WHERE date(created_at)=date('now')"),
      db.query("SELECT COUNT(*) as cnt FROM job_cards WHERE status NOT IN ('completed','ready')"),
    ])
    res.json({
      success: true,
      data: {
        total_customers:      customers.rows[0].cnt,
        todays_appointments:  todayAppts.rows[0].cnt,
        active_repairs:       activeRepairs.rows[0].cnt,
        monthly_revenue:      4200000, // placeholder until invoices are used
      }
    })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

router.get('/revenue', authenticate, authorize('admin'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT strftime('%Y-%m', created_at) as month,
        COUNT(*) as appointments
      FROM appointments
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC LIMIT 6
    `)
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

router.get('/services', authenticate, authorize('admin'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT s.name, COUNT(a.id) as count
      FROM appointments a LEFT JOIN services s ON a.service_id = s.id
      GROUP BY s.name ORDER BY count DESC
    `)
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

module.exports = router
