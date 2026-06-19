const express = require('express')
const router  = express.Router()
const crypto  = require('crypto')
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')

router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM services WHERE is_active = 1 ORDER BY category, name')
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, description, category, base_price, duration_hours } = req.body
    const id = crypto.randomBytes(16).toString('hex')
    await db.query(
      'INSERT INTO services (id,name,description,category,base_price,duration_hours) VALUES (?,?,?,?,?,?)',
      [id, name, description||null, category||'general', base_price||null, duration_hours||null]
    )
    const r = await db.query('SELECT * FROM services WHERE id = ?', [id])
    res.status(201).json({ success:true, data:r.rows[0] })
  } catch (err) { res.status(400).json({ success:false, message:err.message }) }
})

router.patch('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, description, base_price, duration_hours, is_active } = req.body
    const r = await db.query('SELECT * FROM services WHERE id = ?', [req.params.id])
    if (!r.rows.length) return res.status(404).json({ success:false, message:'Not found' })
    const s = r.rows[0]
    await db.query(
      'UPDATE services SET name=?,description=?,base_price=?,duration_hours=?,is_active=? WHERE id=?',
      [name||s.name, description||s.description, base_price||s.base_price, duration_hours||s.duration_hours, is_active!==undefined?is_active:s.is_active, req.params.id]
    )
    res.json({ success:true })
  } catch (err) { res.status(400).json({ success:false, message:err.message }) }
})

module.exports = router
