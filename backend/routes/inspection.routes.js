const express = require('express')
const router  = express.Router()
const crypto  = require('crypto')
const multer  = require('multer')
const path    = require('path')
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')
const emailService = require('../services/email.service')
const { createInspectionRules, signInspectionRules } = require('../middleware/validate')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/inspection-photos')),
  filename:    (req, file, cb) => cb(null, `insp-${Date.now()}-${file.originalname}`)
})
const upload = multer({ storage, limits:{ fileSize: 10*1024*1024 } })

const genRef = () => 'INS-' + Math.floor(1000 + Math.random() * 9000)

async function notify(userId, title, message, type = 'info') {
  try {
    const id = crypto.randomBytes(16).toString('hex')
    await db.query(
      'INSERT INTO notifications (id,user_id,title,message,type) VALUES (?,?,?,?,?)',
      [id, userId, title, message, type]
    )
  } catch (_) { /* non-fatal */ }
}

// GET inspections for assigned technician
router.get('/assigned', authenticate, authorize('technician'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT i.*, v.make, v.model, v.registration_number, a.tracking_number
      FROM inspections i
      JOIN appointments a ON i.appointment_id = a.id
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      WHERE a.technician_id = ?
      ORDER BY i.created_at DESC
    `, [req.user.id])
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

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

// GET single inspection by ID (customer or technician)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const r = await db.query(`
      SELECT i.*, v.make, v.model, v.registration_number, v.year, v.color,
             u.name as customer_name, u.phone as customer_phone,
             a.tracking_number, a.service_id, s.name as service_name
      FROM inspections i
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      LEFT JOIN users u ON i.customer_id = u.id
      LEFT JOIN appointments a ON i.appointment_id = a.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE i.id = ?
    `, [req.params.id])
    if (!r.rows.length) return res.status(404).json({ success: false, message: 'Not found' })
    const insp = r.rows[0]
    
    // Fetch photos
    const photosRes = await db.query('SELECT * FROM inspection_photos WHERE inspection_id = ?', [req.params.id])
    insp.photos = photosRes.rows

    // Customers can only view their own inspections
    if (req.user.role === 'customer' && insp.customer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }
    res.json({ success: true, data: insp })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

router.post('/', authenticate, authorize('admin','technician'), createInspectionRules, async (req, res) => {
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

router.patch('/:id/sign', authenticate, authorize('customer'), signInspectionRules, async (req, res) => {
  try {
    const { customer_signature } = req.body
    const now = new Date().toISOString()

    // Fetch inspection to get the advisor_id for notification
    const existing = await db.query(`
      SELECT i.*, v.make, v.model, u.name as customer_name
      FROM inspections i
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      LEFT JOIN users u ON i.customer_id = u.id
      WHERE i.id = ? AND i.customer_id = ?
    `, [req.params.id, req.user.id])

    if (!existing.rows.length) return res.status(404).json({ success: false, message: 'Inspection not found or not yours' })
    const insp = existing.rows[0]

    await db.query(
      'UPDATE inspections SET customer_signature=?,customer_signed_at=?,status=? WHERE id=? AND customer_id=?',
      [customer_signature, now, 'customer_signed', req.params.id, req.user.id]
    )

    // Notify the advisor/technician that the customer has signed
    if (insp.advisor_id) {
      const vehicleLabel = (insp.make && insp.model) ? `${insp.make} ${insp.model}` : 'the vehicle'
      const customerLabel = insp.customer_name || 'The customer'
      await notify(
        insp.advisor_id,
        'Customer signed inspection report ✓',
        `${customerLabel} has reviewed and signed the inspection report for ${vehicleLabel}. You can now begin repair work.`,
        'success'
      )
    }

    res.json({ success: true })
  } catch (err) { res.status(400).json({ success: false, message: err.message }) }
})

// PATCH complete inspection (technician — marks ready for repair / customer sign-off)
router.patch('/:id/complete', authenticate, authorize('technician','admin'), async (req, res) => {
  try {
    const {
      odometer_reading, fuel_level, damage_notes, checklist, accessories,
      valuables_notes, advisor_signature, customer_signature, status,
    } = req.body

    const existing = await db.query('SELECT * FROM inspections WHERE id = ?', [req.params.id])
    if (!existing.rows.length) return res.status(404).json({ success: false, message: 'Not found' })

    const insp = existing.rows[0]
    const newStatus = status || (customer_signature ? 'customer_signed' : 'pending')
    const signedAt  = customer_signature ? new Date().toISOString() : insp.customer_signed_at

    await db.query(
      `UPDATE inspections SET
        odometer_reading=?, fuel_level=?, damage_notes=?, checklist=?, accessories=?,
        valuables_notes=?, advisor_signature=?, customer_signature=?,
        customer_signed_at=?, status=?
       WHERE id=?`,
      [
        odometer_reading ?? insp.odometer_reading,
        fuel_level ?? insp.fuel_level,
        JSON.stringify(damage_notes ?? JSON.parse(insp.damage_notes || '[]')),
        JSON.stringify(checklist ?? JSON.parse(insp.checklist || '{}')),
        JSON.stringify(accessories ?? JSON.parse(insp.accessories || '{}')),
        valuables_notes ?? insp.valuables_notes,
        advisor_signature ?? insp.advisor_signature,
        customer_signature ?? insp.customer_signature,
        signedAt,
        newStatus,
        req.params.id,
      ]
    )

    if (insp.customer_id && newStatus === 'pending') {
      // Fetch vehicle info for a better notification message
      let vehicleLabel = 'your vehicle'
      try {
        if (insp.vehicle_id) {
          const vr = await db.query('SELECT make, model, registration_number FROM vehicles WHERE id = ?', [insp.vehicle_id])
          if (vr.rows.length) {
            const v = vr.rows[0]
            vehicleLabel = `your ${v.make} ${v.model} (${v.registration_number})`
          }
        }
      } catch (_) {}

      await notify(
        insp.customer_id,
        '🔍 Vehicle Inspection Ready — Your Signature Needed',
        `AutoMedic has completed the inspection of ${vehicleLabel}. Please review the inspection report on your dashboard and sign digitally to authorise repair work. Ref: ${insp.reference_number}`,
        'warning'
      )

      // Send email notification
      try {
        const custRow = await db.query('SELECT name, email FROM users WHERE id = ?', [insp.customer_id])
        const apptRow = await db.query('SELECT tracking_number FROM appointments WHERE id = ?', [insp.appointment_id])
        if (custRow.rows.length && custRow.rows[0].email) {
          emailService.sendInspectionReady({
            name:          custRow.rows[0].name,
            email:         custRow.rows[0].email,
            vehicle:       vehicleLabel,
            tracking:      apptRow.rows.length ? apptRow.rows[0].tracking_number : 'N/A',
            inspectionRef: insp.reference_number,
          }).catch(() => {})
        }
      } catch (_) { /* email errors are non-fatal */ }
    }

    const r = await db.query('SELECT * FROM inspections WHERE id = ?', [req.params.id])
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(400).json({ success: false, message: err.message }) }
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
