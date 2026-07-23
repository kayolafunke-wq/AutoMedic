const express = require('express')
const router  = express.Router()
const crypto  = require('crypto')
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')
const { createServiceRules } = require('../middleware/validate')

// GET all active (public — used in booking form)
router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM services WHERE is_active = 1 ORDER BY category, name')
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

// GET all including inactive (admin only)
router.get('/all', authenticate, authorize('admin'), async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM services ORDER BY category, name')
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

// POST create
router.post('/', authenticate, authorize('admin'), createServiceRules, async (req, res) => {
  try {
    const { name, description, category, base_price, duration_hours, image_url } = req.body
    if (!name) return res.status(400).json({ success:false, message:'Service name is required' })
    const id = crypto.randomBytes(16).toString('hex')
    await db.query(
      'INSERT INTO services (id,name,description,category,base_price,duration_hours,image_url) VALUES (?,?,?,?,?,?,?)',
      [id, name, description||null, category||'general', base_price||null, duration_hours||null, image_url||null]
    )
    const r = await db.query('SELECT * FROM services WHERE id = ?', [id])
    res.status(201).json({ success:true, data:r.rows[0] })
  } catch (err) { res.status(400).json({ success:false, message:err.message }) }
})

// PATCH update
router.patch('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, description, category, base_price, duration_hours, image_url, is_active } = req.body
    const r = await db.query('SELECT * FROM services WHERE id = ?', [req.params.id])
    if (!r.rows.length) return res.status(404).json({ success:false, message:'Not found' })
    const s = r.rows[0]
    await db.query(
      'UPDATE services SET name=?,description=?,category=?,base_price=?,duration_hours=?,image_url=?,is_active=? WHERE id=?',
      [
        name            || s.name,
        description     !== undefined ? description     : s.description,
        category        || s.category,
        base_price      !== undefined ? base_price      : s.base_price,
        duration_hours  !== undefined ? duration_hours  : s.duration_hours,
        image_url       !== undefined ? image_url       : s.image_url,
        is_active       !== undefined ? (is_active ? 1 : 0) : s.is_active,
        req.params.id,
      ]
    )
    const updated = await db.query('SELECT * FROM services WHERE id = ?', [req.params.id])
    res.json({ success:true, data:updated.rows[0] })
  } catch (err) { res.status(400).json({ success:false, message:err.message }) }
})

// DELETE permanently (only if no appointments reference it)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Check if any appointments use this service
    const used = await db.query('SELECT COUNT(*) as cnt FROM appointments WHERE service_id = ?', [req.params.id])
    if (used.rows[0].cnt > 0) {
      // Soft-delete instead — preserve referential integrity
      await db.query('UPDATE services SET is_active = 0 WHERE id = ?', [req.params.id])
      return res.json({ success:true, soft: true, message: `Service deactivated (used in ${used.rows[0].cnt} appointment(s) — cannot hard delete)` })
    }
    await db.query('DELETE FROM services WHERE id = ?', [req.params.id])
    res.json({ success:true, soft: false, message: 'Service permanently deleted' })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

module.exports = router
