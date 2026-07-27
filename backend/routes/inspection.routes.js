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
      'INSERT INTO notifications (id,user_id,title,message,type) VALUES ($1,$2,$3,$4,$5)',
      [id, userId, title, message, type]
    )
  } catch (_) { /* non-fatal */ }
}

// GET inspections for assigned technician
router.get('/assigned', authenticate, authorize('technician'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT i.*, a.tracking_number, a.vehicle_id, v.make, v.model, v.registration_number
      FROM inspections i
      JOIN appointments a ON i.appointment_id = a.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      WHERE i.technician_id = $1
      ORDER BY i.created_at DESC
    `, [req.user.id])
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

router.get('/my', authenticate, authorize('customer'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT i.*, a.tracking_number, a.vehicle_id, a.customer_id, v.make, v.model, v.registration_number
      FROM inspections i
      LEFT JOIN appointments a ON i.appointment_id = a.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      WHERE a.customer_id = $1 ORDER BY i.created_at DESC
    `, [req.user.id])
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT i.*, a.tracking_number, a.vehicle_id, a.customer_id, 
             u.name as customer_name, v.make, v.model, v.registration_number
      FROM inspections i
      LEFT JOIN appointments a ON i.appointment_id = a.id
      LEFT JOIN users u ON a.customer_id = u.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      ORDER BY i.created_at DESC
    `)
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

// GET single inspection by ID (customer or technician)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const r = await db.query(`
      SELECT i.*, a.tracking_number, a.service_id, a.vehicle_id, a.customer_id,
             v.make, v.model, v.registration_number, v.year, v.color, v.chassis_number,
             u.name as customer_name, u.phone as customer_phone,
             s.name as service_name
      FROM inspections i
      LEFT JOIN appointments a ON i.appointment_id = a.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN users u ON a.customer_id = u.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE i.id = $1
    `, [req.params.id])
    if (!r.rows.length) return res.status(404).json({ success: false, message: 'Not found' })
    const insp = r.rows[0]
    
    // Fetch photos
    const photosRes = await db.query('SELECT * FROM inspection_photos WHERE inspection_id = $1', [req.params.id])
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
    const { 
      appointment_id, 
      // Frontend sends these:
      fuel_level, odometer_reading, damage_notes, checklist, accessories, valuables_notes,
      // Backend schema fields:
      under_hood, under_vehicle, photos, recommendations, advisor_notes 
    } = req.body

    // Map frontend to backend schema
    const underHoodData = checklist || under_hood || null
    const underVehicleData = accessories ? JSON.stringify({ accessories, valuables_notes }) : (under_vehicle || null)
    const recommendationsData = damage_notes || recommendations || null
    const advisorNotesData = advisor_notes || (fuel_level || odometer_reading ? 
      `Fuel: ${fuel_level || 'N/A'}, Odometer: ${odometer_reading || 'N/A'}` : null)

    const id  = crypto.randomBytes(16).toString('hex')
    await db.query(
      `INSERT INTO inspections (id, appointment_id, technician_id, vehicle_health, under_hood, under_vehicle, photos, recommendations, advisor_notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, appointment_id||null, req.user.id, null, 
       typeof underHoodData === 'object' ? JSON.stringify(underHoodData) : underHoodData,
       underVehicleData,
       JSON.stringify(photos||[]), 
       typeof recommendationsData === 'object' ? JSON.stringify(recommendationsData) : recommendationsData,
       advisorNotesData, 
       'pending']
    )
    const r = await db.query('SELECT * FROM inspections WHERE id = $1', [id])
    res.status(201).json({ success:true, data:r.rows[0] })
  } catch (err) { res.status(400).json({ success:false, message:err.message }) }
})

router.patch('/:id/sign', authenticate, authorize('customer'), signInspectionRules, async (req, res) => {
  try {
    const { customer_signature } = req.body
    const now = new Date().toISOString()

    // Fetch inspection to get info for notification
    const existing = await db.query(`
      SELECT i.*, a.customer_id, a.vehicle_id, v.make, v.model, u.name as customer_name
      FROM inspections i
      LEFT JOIN appointments a ON i.appointment_id = a.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN users u ON a.customer_id = u.id
      WHERE i.id = $1 AND a.customer_id = $2
    `, [req.params.id, req.user.id])

    if (!existing.rows.length) return res.status(404).json({ success: false, message: 'Inspection not found or not yours' })
    const insp = existing.rows[0]

    await db.query(
      'UPDATE inspections SET advisor_signature=$1, status=$2, updated_at=$3 WHERE id=$4',
      [customer_signature, 'customer_signed', now, req.params.id]
    )

    // Notify the technician that the customer has signed
    if (insp.technician_id) {
      const vehicleLabel = (insp.make && insp.model) ? `${insp.make} ${insp.model}` : 'the vehicle'
      const customerLabel = insp.customer_name || 'The customer'
      await notify(
        insp.technician_id,
        'Customer signed inspection report ✓',
        `${customerLabel} has reviewed and signed the inspection report for ${vehicleLabel}. You can now begin repair work.`,
        'success'
      )
    }

    res.json({ success: true })
  } catch (err) { res.status(400).json({ success: false, message: err.message }) }
})

// PATCH complete inspection (technician — marks ready for customer review)
router.patch('/:id/complete', authenticate, authorize('technician','admin'), async (req, res) => {
  try {
    const {
      // Frontend fields:
      fuel_level, odometer_reading, damage_notes, checklist, accessories, valuables_notes,
      advisor_signature, status,
      // Backend fields:
      vehicle_health, under_hood, under_vehicle, photos, recommendations, advisor_notes
    } = req.body

    const existing = await db.query('SELECT * FROM inspections WHERE id = $1', [req.params.id])
    if (!existing.rows.length) return res.status(404).json({ success: false, message: 'Not found' })

    const insp = existing.rows[0]
    const newStatus = status || (advisor_signature ? 'pending' : insp.status)

    // Map frontend to backend
    const underHoodData = checklist || under_hood || insp.under_hood
    const underVehicleData = accessories ? JSON.stringify({ accessories, valuables_notes }) : (under_vehicle || insp.under_vehicle)
    const recommendationsData = damage_notes || recommendations || insp.recommendations
    const advisorNotesData = advisor_notes || (fuel_level || odometer_reading ? 
      `Fuel: ${fuel_level || 'N/A'}, Odometer: ${odometer_reading || 'N/A'}` : insp.advisor_notes)

    await db.query(
      `UPDATE inspections SET
        vehicle_health=$1, under_hood=$2, under_vehicle=$3, photos=$4,
        recommendations=$5, advisor_notes=$6, advisor_signature=$7, status=$8, updated_at=$9
       WHERE id=$10`,
      [
        vehicle_health ?? insp.vehicle_health,
        typeof underHoodData === 'object' ? JSON.stringify(underHoodData) : underHoodData,
        underVehicleData,
        photos ? JSON.stringify(photos) : insp.photos,
        typeof recommendationsData === 'object' ? JSON.stringify(recommendationsData) : recommendationsData,
        advisorNotesData,
        advisor_signature ?? insp.advisor_signature,
        newStatus,
        new Date().toISOString(),
        req.params.id,
      ]
    )

    // Notify customer if inspection is ready
    if (newStatus === 'pending') {
      const apptInfo = await db.query(`
        SELECT a.customer_id, a.tracking_number, v.make, v.model, v.registration_number
        FROM appointments a
        LEFT JOIN vehicles v ON a.vehicle_id = v.id
        WHERE a.id = $1
      `, [insp.appointment_id])

      if (apptInfo.rows.length && apptInfo.rows[0].customer_id) {
        const { customer_id, tracking_number, make, model, registration_number } = apptInfo.rows[0]
        const vehicleLabel = (make && model) ? `your ${make} ${model} (${registration_number})` : 'your vehicle'

        await notify(
          customer_id,
          '🔍 Vehicle Inspection Ready — Your Signature Needed',
          `AutoMedic has completed the inspection of ${vehicleLabel}. Please review the inspection report on your dashboard and sign digitally to authorise repair work. Ref: ${tracking_number}`,
          'warning'
        )

        // Send email
        try {
          const custRow = await db.query('SELECT name, email FROM users WHERE id = $1', [customer_id])
          if (custRow.rows.length && custRow.rows[0].email) {
            emailService.sendInspectionReady({
              name:          custRow.rows[0].name,
              email:         custRow.rows[0].email,
              vehicle:       vehicleLabel,
              tracking:      tracking_number,
              inspectionRef: tracking_number,
            }).catch(() => {})
          }
        } catch (_) {}
      }
    }

    const r = await db.query('SELECT * FROM inspections WHERE id = $1', [req.params.id])
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
        'INSERT INTO inspection_photos (id,inspection_id,photo_type,file_url,uploaded_by) VALUES ($1,$2,$3,$4,$5)',
        [id, req.params.id, photo_type||'before', url, req.user.id]
      )
      inserted.push({ id, file_url:url, photo_type })
    }
    res.status(201).json({ success:true, data:inserted })
  } catch (err) { res.status(400).json({ success:false, message:err.message }) }
})

module.exports = router
