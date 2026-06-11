const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category
      ? 'SELECT * FROM products WHERE is_active = true AND category = $1 ORDER BY name'
      : 'SELECT * FROM products WHERE is_active = true ORDER BY name';
    const result = await db.query(query, category ? [category] : []);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, description, category, price, stock_quantity } = req.body;
    const result = await db.query(
      'INSERT INTO products (name, description, category, price, stock_quantity) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, description, category, price, stock_quantity]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.patch('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, description, category, price, stock_quantity, is_active } = req.body;
    const result = await db.query(
      'UPDATE products SET name=COALESCE($1,name), description=COALESCE($2,description), category=COALESCE($3,category), price=COALESCE($4,price), stock_quantity=COALESCE($5,stock_quantity), is_active=COALESCE($6,is_active) WHERE id=$7 RETURNING *',
      [name, description, category, price, stock_quantity, is_active, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
