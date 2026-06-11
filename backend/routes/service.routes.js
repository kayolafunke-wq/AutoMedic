const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM services WHERE is_active = true ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, description, base_price, duration_hours } = req.body;
    const result = await db.query(
      'INSERT INTO services (name, description, base_price, duration_hours) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, description, base_price, duration_hours]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.patch('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, description, base_price, duration_hours, is_active } = req.body;
    const result = await db.query(
      'UPDATE services SET name=COALESCE($1,name), description=COALESCE($2,description), base_price=COALESCE($3,base_price), duration_hours=COALESCE($4,duration_hours), is_active=COALESCE($5,is_active) WHERE id=$6 RETURNING *',
      [name, description, base_price, duration_hours, is_active, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
