const express = require('express')
const router  = express.Router()
const crypto  = require('crypto')
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')

const genTracking = () => 'AC-' + Math.floor(1000 + Math.random() * 9000)

// GET all (admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT a.*, u.name as customer_name, u.phone as customer_phone,
        v.make, v.model, v.registration_number,
        s.name as service_name, t.name as technician_name
      FROM appointments a
      LEFT JOIN users u ON a.customer_id = u.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN users t ON a.technician_id = t.id
      ORDER BY a.created_at DESC
    `)
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

// GET my appointments (customer)
router.get('/my', authenticate, authorize('customer'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT a.*, v.make, v.model, v.registration_number, s.name as service_name,
        t.name as technician_name, jc.progress, jc.status as job_status, jc.estimated_cost
      FROM appointments a
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN users t ON a.technician_id = t.id
      LEFT JOIN job_cards jc ON jc.appointment_id = a.id
      WHERE a.customer_id = ?
      ORDER BY a.created_at DESC
    `, [req.user.id])
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

// POST create (customer)
router.post('/', authenticate, authorize('customer'), async (req, res) => {
  try {
    const { vehicle_id, service_id, preferred_date, problem_description } = req.body
    const id = crypto.randomBytes(16).toString('hex')
    const tracking = genTracking()
    await db.query(
      'INSERT INTO appointments (id,tracking_number,customer_id,vehicle_id,service_id,preferred_date,problem_description) VALUES (?,?,?,?,?,?,?)',
      [id, tracking, req.user.id, vehicle_id||null, service_id||null, preferred_date, problem_description||null]
    )
    const r = await db.query('SELECT * FROM appointments WHERE id = ?', [id])
    res.status(201).json({ success:true, data:r.rows[0] })
  } catch (err) { res.status(400).json({ success:false, message:err.message }) }
})

// PATCH accept & assign technician (admin)
router.patch('/:id/assign', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { technician_id, status } = req.body
    await db.query(
      'UPDATE appointments SET technician_id=?, status=?, updated_at=? WHERE id=?',
      [technician_id, status||'confirmed', new Date().toISOString(), req.params.id]
    )
    // Create job card if confirming
    if (status === 'confirmed' && technician_id) {
      const jcExists = await db.query('SELECT id FROM job_cards WHERE appointment_id = ?', [req.params.id])
      if (!jcExists.rows.length) {
        const jcId = crypto.randomBytes(16).toString('hex')
        await db.query(
          'INSERT INTO job_cards (id,appointment_id,technician_id,progress,status) VALUES (?,?,?,0,?)',
          [jcId, req.params.id, technician_id, 'pending']
        )
      }
    }
    const r = await db.query('SELECT * FROM appointments WHERE id = ?', [req.params.id])
    res.json({ success:true, data:r.rows[0] })
  } catch (err) { res.status(400).json({ success:false, message:err.message }) }
})

// PATCH update status
router.patch('/:id/status', authenticate, authorize('admin','technician'), async (req, res) => {
  try {
    const { status } = req.body
    await db.query('UPDATE appointments SET status=?,updated_at=? WHERE id=?',
      [status, new Date().toISOString(), req.params.id])
    res.json({ success:true })
  } catch (err) { res.status(400).json({ success:false, message:err.message }) }
})

// GET by tracking number (public)
router.get('/track/:ref', async (req, res) => {
  try {
    const r = await db.query(`
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
      WHERE a.tracking_number = ?
    `, [req.params.ref.toUpperCase()])
    if (!r.rows.length) return res.status(404).json({ success:false, message:'Vehicle not found' })
    res.json({ success:true, data:r.rows[0] })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

module.exports = router
