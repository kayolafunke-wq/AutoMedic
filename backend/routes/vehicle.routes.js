const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// GET my vehicles
router.get('/my', authenticate, authorize('customer'), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM vehicles WHERE customer_id = $1', [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all vehicles (admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT v.*, u.name as owner_name, u.phone as owner_phone
      FROM vehicles v LEFT JOIN users u ON v.customer_id = u.id
      ORDER BY v.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST add vehicle
router.post('/', authenticate, authorize('customer', 'admin'), async (req, res) => {
  try {
    const { make, model, year, color, registration_number, chassis_number, customer_id } = req.body;
    const owner = customer_id || req.user.id;
    const result = await db.query(
      'INSERT INTO vehicles (customer_id, make, model, year, color, registration_number, chassis_number) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [owner, make, model, year, color, registration_number, chassis_number]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
