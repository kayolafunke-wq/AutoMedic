const express = require('express')
const router  = express.Router()
const crypto  = require('crypto')
const multer  = require('multer')
const path    = require('path')
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/inspection-photos')),
  filename:    (req, file, cb) => cb(null, `insp-${Date.now()}-${file.originalname}`)
})
const upload = multer({ storage, limits:{ fileSize: 10*1024*1024 } })

const genRef = () => 'INS-' + Math.floor(1000 + Math.random() * 9000)

router.get('/my', authenticate, authorize('customer'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT i.*, v.make, v.model, v.registration_number
      FROM inspections i
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      WHERE i.customer_id = ? ORDER BY i.created_at DESC
    `, [req.user.id])
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT i.*, u.name as customer_name, v.make, v.model, v.registration_number
      FROM inspections i
      LEFT JOIN users u ON i.customer_id = u.id
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      ORDER BY i.created_at DESC
    `)
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

router.post('/', authenticate, authorize('admin','technician'), async (req, res) => {
  try {
    const { appointment_id, vehicle_id, customer_id, odometer_reading, fuel_level, damage_notes, checklist, accessories, valuables_notes } = req.body
    const id  = crypto.randomBytes(16).toString('hex')
    const ref = genRef()
    await db.query(
      `INSERT INTO inspections (id,reference_number,appointment_id,vehicle_id,customer_id,advisor_id,odometer_reading,fuel_level,damage_notes,checklist,accessories,valuables_notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, ref, appointment_id||null, vehicle_id||null, customer_id||null, req.user.id, odometer_reading||null, fuel_level||null,
       JSON.stringify(damage_notes||[]), JSON.stringify(checklist||{}), JSON.stringify(accessories||{}), valuables_notes||null]
    )
    const r = await db.query('SELECT * FROM inspections WHERE id = ?', [id])
    res.status(201).json({ success:true, data:r.rows[0] })
  } catch (err) { res.status(400).json({ success:false, message:err.message }) }
})

router.patch('/:id/sign', authenticate, authorize('customer'), async (req, res) => {
  try {
    const { customer_signature } = req.body
    const now = new Date().toISOString()
    await db.query(
      'UPDATE inspections SET customer_signature=?,customer_signed_at=?,status=? WHERE id=? AND customer_id=?',
      [customer_signature, now, 'customer_signed', req.params.id, req.user.id]
    )
    res.json({ success:true })
  } catch (err) { res.status(400).json({ success:false, message:err.message }) }
})

router.post('/:id/photos', authenticate, upload.array('photos', 10), async (req, res) => {
  try {
    const { photo_type } = req.body
    const inserted = []
    for (const f of req.files) {
      const id = crypto.randomBytes(16).toString('hex')
      const url = `/uploads/inspection-photos/${f.filename}`
      await db.query(
        'INSERT INTO inspection_photos (id,inspection_id,photo_type,file_url,uploaded_by) VALUES (?,?,?,?,?)',
        [id, req.params.id, photo_type||'before', url, req.user.id]
      )
      inserted.push({ id, file_url:url, photo_type })
    }
    res.status(201).json({ success:true, data:inserted })
  } catch (err) { res.status(400).json({ success:false, message:err.message }) }
})

module.exports = router
