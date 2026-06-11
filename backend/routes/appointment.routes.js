const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// Generate tracking number
const genTracking = () => 'AC-' + Math.floor(1000 + Math.random() * 9000);

// GET all appointments (admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, u.name as customer_name, u.phone as customer_phone,
        v.make, v.model, v.registration_number,
        s.name as service_name, t.name as technician_name
      FROM appointments a
      LEFT JOIN users u ON a.customer_id = u.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN users t ON a.technician_id = t.id
      ORDER BY a.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET my appointments (customer)
router.get('/my', authenticate, authorize('customer'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, v.make, v.model, v.registration_number, s.name as service_name
      FROM appointments a
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.customer_id = $1
      ORDER BY a.created_at DESC
    `, [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create appointment (customer)
router.post('/', authenticate, authorize('customer'), async (req, res) => {
  try {
    const { vehicle_id, service_id, preferred_date, problem_description } = req.body;
    const tracking_number = genTracking();
    const result = await db.query(
      'INSERT INTO appointments (tracking_number, customer_id, vehicle_id, service_id, preferred_date, problem_description) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [tracking_number, req.user.id, vehicle_id, service_id, preferred_date, problem_description]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH update status (admin/technician)
router.patch('/:id/status', authenticate, authorize('admin', 'technician'), async (req, res) => {
  try {
    const { status } = req.body;
    const result = await db.query(
      'UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET by tracking number (public)
router.get('/track/:ref', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, u.name as customer_name,
        v.make, v.model, v.registration_number, v.color,
        s.name as service_name, t.name as technician_name,
        jc.progress, jc.status as job_status, jc.estimated_cost
      FROM appointments a
      LEFT JOIN users u ON a.customer_id = u.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN users t ON a.technician_id = t.id
      LEFT JOIN job_cards jc ON jc.appointment_id = a.id
      WHERE a.tracking_number = $1
    `, [req.params.ref]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
