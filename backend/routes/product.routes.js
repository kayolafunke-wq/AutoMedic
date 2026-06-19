const express = require('express')
const router  = express.Router()
const crypto  = require('crypto')
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')

router.get('/', async (req, res) => {
  try {
    const { category } = req.query
    const sql = category
      ? 'SELECT * FROM products WHERE is_active=1 AND category=? ORDER BY name'
      : 'SELECT * FROM products WHERE is_active=1 ORDER BY name'
    const r = await db.query(sql, category ? [category] : [])
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, description, category, price, stock_quantity } = req.body
    const id = crypto.randomBytes(16).toString('hex')
    await db.query(
      'INSERT INTO products (id,name,description,category,price,stock_quantity) VALUES (?,?,?,?,?,?)',
      [id, name, description||null, category||null, price||null, stock_quantity||0]
    )
    const r = await db.query('SELECT * FROM products WHERE id = ?', [id])
    res.status(201).json({ success:true, data:r.rows[0] })
  } catch (err) { res.status(400).json({ success:false, message:err.message }) }
})

router.patch('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, description, category, price, stock_quantity, is_active } = req.body
    const r = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id])
    if (!r.rows.length) return res.status(404).json({ success:false, message:'Not found' })
    const p = r.rows[0]
    await db.query(
      'UPDATE products SET name=?,description=?,category=?,price=?,stock_quantity=?,is_active=? WHERE id=?',
      [name||p.name, description||p.description, category||p.category, price||p.price, stock_quantity??p.stock_quantity, is_active!==undefined?is_active:p.is_active, req.params.id]
    )
    res.json({ success:true })
  } catch (err) { res.status(400).json({ success:false, message:err.message }) }
})

module.exports = router
