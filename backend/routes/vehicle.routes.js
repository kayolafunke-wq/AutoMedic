const express = require('express')
const router  = express.Router()
const crypto  = require('crypto')
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')
const { createVehicleRules } = require('../middleware/validate')

router.get('/my', authenticate, authorize('customer'), async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM vehicles WHERE customer_id = ?', [req.user.id])
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT v.*, u.name as owner_name, u.phone as owner_phone
      FROM vehicles v LEFT JOIN users u ON v.customer_id = u.id
      ORDER BY v.created_at DESC
    `)
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

router.post('/', authenticate, createVehicleRules, async (req, res) => {
  try {
    const { make, model, year, color, registration_number, chassis_number, customer_id } = req.body
    const owner = customer_id || req.user.id
    const exists = await db.query('SELECT id FROM vehicles WHERE registration_number = ?', [registration_number])
    if (exists.rows.length) {
      return res.json({ success:true, data:exists.rows[0] }) // return existing
    }
    const id = crypto.randomBytes(16).toString('hex')
    await db.query(
      'INSERT INTO vehicles (id,customer_id,make,model,year,color,registration_number,chassis_number) VALUES (?,?,?,?,?,?,?,?)',
      [id, owner, make, model, year||null, color||null, registration_number, chassis_number||null]
    )
    const r = await db.query('SELECT * FROM vehicles WHERE id = ?', [id])
    res.status(201).json({ success:true, data:r.rows[0] })
  } catch (err) { res.status(400).json({ success:false, message:err.message }) }
})

module.exports = router
