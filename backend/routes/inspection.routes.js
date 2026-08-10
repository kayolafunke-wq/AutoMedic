const express = require('express')
const router  = express.Router()
const crypto  = require('crypto')
const multer  = require('multer')
const path    = require('path')
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')
const emailService = require('../services/email.service')
const { createInspectionRules, signInspectionRules } = require('../middleware/validate')

const fs = require('fs')

const uploadDir = path.join(__dirname, '../uploads/inspection-photos')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => cb(null, `insp-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`)
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
      SELECT DISTINCT ON (i.id) i.*, a.tracking_number, a.vehicle_id, a.customer_id, v.make, v.model, v.registration_number
      FROM inspections i
      LEFT JOIN appointments a ON i.appointment_id = a.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      WHERE a.customer_id = $1 
      ORDER BY i.id, i.created_at DESC
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
    
    // Debug logging (remove in production after fixing)
    console.log(`📸 Inspection ${req.params.id} - Found ${photosRes.rows.length} photos`)

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
      vehicle_id,
      customer_id,
      // Frontend sends these:
      fuel_level, odometer_reading, damage_notes, checklist, accessories, valuables_notes,
      // Backend schema fields:
      under_hood, under_vehicle, photos, recommendations, advisor_notes 
    } = req.body

    console.log(`📝 Creating inspection - Fuel: ${fuel_level}, Odometer: ${odometer_reading}`)

    // Map frontend to backend schema
    const underHoodData = checklist || under_hood || null
    const underVehicleData = accessories ? JSON.stringify({ accessories, valuables_notes }) : (under_vehicle || null)
    const recommendationsData = damage_notes || recommendations || null
    const advisorNotesData = advisor_notes || null

    const id = crypto.randomBytes(16).toString('hex')
    const refNum = 'INS-' + Math.floor(1000 + Math.random() * 9000)
    
    await db.query(
      `INSERT INTO inspections (
        id, reference_number, appointment_id, vehicle_id, customer_id, technician_id, 
        fuel_level, odometer_reading, damage_notes, checklist, accessories, valuables_notes,
        vehicle_health, under_hood, under_vehicle, photos, recommendations, advisor_notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        id, 
        refNum,
        appointment_id || null, 
        vehicle_id || null,
        customer_id || null,
        req.user.id, 
        fuel_level || null,
        odometer_reading ? parseInt(odometer_reading) : null,
        typeof damage_notes === 'object' ? JSON.stringify(damage_notes) : (damage_notes || '[]'),
        typeof checklist === 'object' ? JSON.stringify(checklist) : (checklist || '{}'),
        typeof accessories === 'object' ? JSON.stringify(accessories) : (accessories || '{}'),
        valuables_notes || null,
        null, // vehicle_health
        typeof underHoodData === 'object' ? JSON.stringify(underHoodData) : underHoodData,
        underVehicleData,
        JSON.stringify(photos || []), 
        typeof recommendationsData === 'object' ? JSON.stringify(recommendationsData) : recommendationsData,
        advisorNotesData, 
        req.body.status || 'draft'
      ]
    )
    
    const r = await db.query('SELECT * FROM inspections WHERE id = $1', [id])
    console.log(`✅ Inspection created: ${refNum}`)
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) { 
    console.error(`❌ Inspection creation error:`, err.message)
    res.status(400).json({ success: false, message: err.message }) 
  }
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
      'UPDATE inspections SET customer_signature=$1, customer_signed_at=$2, status=$3, updated_at=$4 WHERE id=$5',
      [customer_signature, now, 'customer_signed', now, req.params.id]
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

    console.log(`📝 Updating inspection ${req.params.id} - Fuel: ${fuel_level}, Odometer: ${odometer_reading}`)

    const existing = await db.query('SELECT * FROM inspections WHERE id = $1', [req.params.id])
    if (!existing.rows.length) return res.status(404).json({ success: false, message: 'Not found' })

    const insp = existing.rows[0]
    
    // Validate signature if trying to set status to 'pending'
    const requestedStatus = status || insp.status
    if (requestedStatus === 'pending') {
      const techSigned = advisor_signature && advisor_signature !== 'null' && advisor_signature !== '' && advisor_signature.length > 50
      if (!techSigned && !insp.advisor_signature) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot submit inspection to customer without technician signature. Please sign the inspection report before submitting.' 
        })
      }
    }
    
    // Only set to 'pending' if technician actually signed (not just sent advisor_signature field)
    const techSigned = advisor_signature && advisor_signature !== 'null' && advisor_signature !== '' && advisor_signature.length > 50
    const newStatus = status || (techSigned ? 'pending' : insp.status)

    // Map frontend to backend
    const underHoodData = checklist || under_hood || insp.under_hood
    const underVehicleData = accessories ? JSON.stringify({ accessories, valuables_notes }) : (under_vehicle || insp.under_vehicle)
    const recommendationsData = damage_notes || recommendations || insp.recommendations
    const advisorNotesData = advisor_notes || insp.advisor_notes

    await db.query(
      `UPDATE inspections SET
        fuel_level=$1,
        odometer_reading=$2,
        damage_notes=$3,
        checklist=$4,
        accessories=$5,
        valuables_notes=$6,
        vehicle_health=$7, 
        under_hood=$8, 
        under_vehicle=$9, 
        photos=$10,
        recommendations=$11, 
        advisor_notes=$12, 
        advisor_signature=$13, 
        status=$14, 
        updated_at=$15
       WHERE id=$16`,
      [
        fuel_level || insp.fuel_level,
        odometer_reading ? parseInt(odometer_reading) : insp.odometer_reading,
        typeof damage_notes === 'object' ? JSON.stringify(damage_notes) : (damage_notes || insp.damage_notes),
        typeof checklist === 'object' ? JSON.stringify(checklist) : (checklist || insp.checklist),
        typeof accessories === 'object' ? JSON.stringify(accessories) : (accessories || insp.accessories),
        valuables_notes !== undefined ? valuables_notes : insp.valuables_notes,
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

    console.log(`✅ Inspection ${req.params.id} updated to status: ${newStatus}`)

    // Notify customer if inspection is ready
    if (newStatus === 'pending') {
      console.log(`[INSPECT] Status is 'pending' — looking up customer for appointment_id: ${insp.appointment_id}`)

      let customer_id = insp.customer_id
      let tracking_number = insp.reference_number
      let vehicleLabel = 'your vehicle'

      // Try to get full info from appointment
      if (insp.appointment_id) {
        const apptInfo = await db.query(`
          SELECT a.customer_id, a.tracking_number, v.make, v.model, v.registration_number
          FROM appointments a
          LEFT JOIN vehicles v ON a.vehicle_id = v.id
          WHERE a.id = $1
        `, [insp.appointment_id])

        if (apptInfo.rows.length && apptInfo.rows[0].customer_id) {
          customer_id     = apptInfo.rows[0].customer_id
          tracking_number = apptInfo.rows[0].tracking_number || tracking_number
          const { make, model, registration_number } = apptInfo.rows[0]
          vehicleLabel = (make && model) ? `your ${make} ${model} (${registration_number})` : 'your vehicle'
          console.log(`[INSPECT] Found appointment — customer_id: ${customer_id}, tracking: ${tracking_number}`)
        } else {
          console.warn(`[INSPECT] No appointment rows found for appointment_id: ${insp.appointment_id}`)
        }
      } else {
        console.warn(`[INSPECT] Inspection has no appointment_id — using inspection.customer_id: ${customer_id}`)
      }

      if (customer_id) {
        // Send in-app notification
        await notify(
          customer_id,
          '🔍 Vehicle Inspection Ready — Your Signature Needed',
          `AutoMedic has completed the inspection of ${vehicleLabel}. Please review the inspection report on your dashboard and sign digitally to authorise repair work. Ref: ${tracking_number}`,
          'warning'
        )
        console.log(`[INSPECT] In-app notification sent to customer_id: ${customer_id}`)

        // Send email notification
        try {
          const custRow = await db.query('SELECT name, email FROM users WHERE id = $1', [customer_id])
          console.log(`[INSPECT] Customer lookup result: ${JSON.stringify(custRow.rows[0] || null)}`)
          if (custRow.rows.length && custRow.rows[0].email) {
            const { name, email } = custRow.rows[0]
            console.log(`[INSPECT] Sending inspection email to: ${email}`)
            emailService.sendInspectionReady({
              name,
              email,
              vehicle:       vehicleLabel,
              tracking:      tracking_number,
              inspectionRef: tracking_number,
            }).then((result) => {
              console.log(`[INSPECT] Email result for ${email}:`, JSON.stringify(result))
            }).catch((err) => {
              console.error(`[INSPECT] Email FAILED for ${email}:`, err.message)
            })
          } else {
            console.warn(`[INSPECT] Customer has no email address — skipping email`)
          }
        } catch (emailErr) {
          console.error(`[INSPECT] Error looking up customer email:`, emailErr.message)
        }
      } else {
        console.warn(`[INSPECT] Cannot notify — no customer_id found for inspection ${req.params.id}`)
      }
    }

    const r = await db.query('SELECT * FROM inspections WHERE id = $1', [req.params.id])
    res.json({ success: true, data: r.rows[0] })
  } catch (err) { 
    console.error(`❌ Inspection update error:`, err.message)
    res.status(400).json({ success: false, message: err.message }) 
  }
})

router.post('/:id/photos', authenticate, async (req, res) => {
  try {
    const { photo_type, file_url, file_name } = req.body

    console.log(`📸 Photo upload request for inspection ${req.params.id}`)
    console.log(`   Type: ${photo_type}, File: ${file_name}, URL length: ${file_url?.length}`)
    console.log(`   User: ${req.user?.id}, Role: ${req.user?.role}`)

    if (!file_url) {
      console.log(`   ❌ Rejected: No file_url provided`)
      return res.status(400).json({ success: false, message: 'No photo data provided' })
    }

    // Ensure inspection_photos table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS inspection_photos (
        id VARCHAR(255) PRIMARY KEY,
        inspection_id VARCHAR(255) REFERENCES inspections(id) ON DELETE CASCADE,
        photo_type VARCHAR(50) DEFAULT 'before',
        file_url TEXT NOT NULL,
        file_name TEXT,
        uploaded_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {})

    const id = crypto.randomBytes(16).toString('hex')
    await db.query(
      'INSERT INTO inspection_photos (id, inspection_id, photo_type, file_url, file_name, uploaded_by) VALUES ($1,$2,$3,$4,$5,$6)',
      [id, req.params.id, photo_type || 'before', file_url, file_name || null, req.user.id]
    )

    console.log(`✅ Photo saved successfully: ${id}`)
    res.status(201).json({ success: true, data: { id, file_url: 'saved', photo_type } })
  } catch (err) { 
    console.error(`❌ Photo upload error:`, err.message)
    console.error(`   Stack:`, err.stack)
    res.status(400).json({ success: false, message: err.message, error: err.toString() }) 
  }
})

module.exports = router
