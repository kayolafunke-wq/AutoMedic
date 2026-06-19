const express = require('express')
const router  = express.Router()
const crypto  = require('crypto')
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')
const { getIO } = require('../websocket/tracking.socket')

router.get('/my', authenticate, authorize('technician'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT jc.*, a.tracking_number, a.preferred_date, a.problem_description,
        u.name as customer_name, u.phone as customer_phone,
        v.make, v.model, v.registration_number, v.color,
        s.name as service_name
      FROM job_cards jc
      LEFT JOIN appointments a ON jc.appointment_id = a.id
      LEFT JOIN users u ON a.customer_id = u.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE jc.technician_id = ? AND jc.status != 'completed'
      ORDER BY jc.created_at DESC
    `, [req.user.id])
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT jc.*, a.tracking_number, t.name as technician_name,
        u.name as customer_name, v.make, v.model, v.registration_number
      FROM job_cards jc
      LEFT JOIN appointments a ON jc.appointment_id = a.id
      LEFT JOIN users t ON jc.technician_id = t.id
      LEFT JOIN users u ON a.customer_id = u.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      ORDER BY jc.created_at DESC
    `)
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

router.patch('/:id/progress', authenticate, authorize('technician','admin'), async (req, res) => {
  try {
    const { progress, status, technician_notes, estimated_cost } = req.body
    const now = new Date().toISOString()
    const r   = await db.query('SELECT * FROM job_cards WHERE id = ?', [req.params.id])
    if (!r.rows.length) return res.status(404).json({ success:false, message:'Not found' })
    const jc = r.rows[0]

    await db.query(
      'UPDATE job_cards SET progress=?,status=?,technician_notes=?,estimated_cost=?,updated_at=? WHERE id=?',
      [progress??jc.progress, status||jc.status, technician_notes||jc.technician_notes, estimated_cost||jc.estimated_cost, now, req.params.id]
    )

    // Log repair update
    const updId = crypto.randomBytes(16).toString('hex')
    await db.query(
      'INSERT INTO repair_updates (id,job_card_id,updated_by,status,note) VALUES (?,?,?,?,?)',
      [updId, req.params.id, req.user.id, status||jc.status, technician_notes||null]
    )

    // Notify customer via socket
    try {
      const io = getIO()
      const appt = await db.query('SELECT tracking_number, customer_id FROM appointments WHERE id = ?', [jc.appointment_id])
      if (appt.rows.length) {
        io.to(`customer_${appt.rows[0].customer_id}`).emit('progress_update', {
          tracking: appt.rows[0].tracking_number,
          progress: progress??jc.progress,
          status:   status||jc.status,
        })
      }
    } catch {}

    const updated = await db.query('SELECT * FROM job_cards WHERE id = ?', [req.params.id])
    res.json({ success:true, data:updated.rows[0] })
  } catch (err) { res.status(400).json({ success:false, message:err.message }) }
})

router.get('/:id/timeline', authenticate, async (req, res) => {
  try {
    const r = await db.query(`
      SELECT ru.*, u.name as updated_by_name
      FROM repair_updates ru
      LEFT JOIN users u ON ru.updated_by = u.id
      WHERE ru.job_card_id = ? ORDER BY ru.created_at ASC
    `, [req.params.id])
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

module.exports = router
