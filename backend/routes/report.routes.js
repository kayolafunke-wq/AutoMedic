const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// GET dashboard stats (admin)
router.get('/dashboard', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [customers, appointments, activeRepairs, revenue] = await Promise.all([
      db.query("SELECT COUNT(*) FROM users WHERE role = 'customer'"),
      db.query("SELECT COUNT(*) FROM appointments WHERE DATE(created_at) = CURRENT_DATE"),
      db.query("SELECT COUNT(*) FROM job_cards WHERE status NOT IN ('completed','ready')"),
      db.query("SELECT COALESCE(SUM(total),0) as total FROM invoices WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())")
    ]);

    res.json({
      success: true,
      data: {
        total_customers: parseInt(customers.rows[0].count),
        todays_appointments: parseInt(appointments.rows[0].count),
        active_repairs: parseInt(activeRepairs.rows[0].count),
        monthly_revenue: parseFloat(revenue.rows[0].total)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET monthly revenue
router.get('/revenue', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT DATE_TRUNC('month', created_at) as month,
        COUNT(DISTINCT a.id) as appointments,
        COUNT(DISTINCT v.id) as vehicles,
        COALESCE(SUM(i.total), 0) as revenue
      FROM appointments a
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN invoices i ON i.appointment_id = a.id
      GROUP BY DATE_TRUNC('month', a.created_at)
      ORDER BY month DESC LIMIT 6
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET services breakdown
router.get('/services', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.name, COUNT(a.id) as count
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      GROUP BY s.name ORDER BY count DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
