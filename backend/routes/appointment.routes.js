const express = require('express')
const router  = express.Router()
const crypto  = require('crypto')
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')
const {
  createAppointmentRules,
  adminCreateAppointmentRules,
  assignAppointmentRules,
} = require('../middleware/validate')
const emailService = require('../services/email.service')

// Helper: insert a notification for a user
async function notify(userId, title, message, type = 'info') {
  try {
    const id = crypto.randomBytes(16).toString('hex')
    await db.query(
      'INSERT INTO notifications (id,user_id,title,message,type) VALUES (?,?,?,?,?)',
      [id, userId, title, message, type]
    )
  } catch (_) { /* non-fatal */ }
}

const genTracking = () => 'AC-' + Math.floor(1000 + Math.random() * 9000)

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     tags:
 *       - Appointments
 *     summary: Get all appointments (Admin only)
 *     description: Retrieve all appointments with customer, vehicle, service, and technician details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
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

/**
 * @swagger
 * /api/appointments/my:
 *   get:
 *     tags:
 *       - Appointments
 *     summary: Get my appointments (Customer only)
 *     description: Retrieve all appointments for the authenticated customer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customer's appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// GET my appointments (customer)
router.get('/my', authenticate, authorize('customer'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT a.*, v.make, v.model, v.registration_number, s.name as service_name,
        t.name as technician_name, jc.progress, jc.status as job_status, jc.estimated_cost,
        i.status as inspection_status, i.advisor_signature as inspection_advisor_sig
      FROM appointments a
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN users t ON a.technician_id = t.id
      LEFT JOIN job_cards jc ON jc.appointment_id = a.id
      LEFT JOIN inspections i ON i.appointment_id = a.id
      WHERE a.customer_id = ?
      ORDER BY a.created_at DESC
    `, [req.user.id])
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

// POST create (customer)
router.post('/', authenticate, authorize('customer'), createAppointmentRules, async (req, res) => {
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

// POST create on behalf of customer (admin)
router.post('/admin', authenticate, authorize('admin'), adminCreateAppointmentRules, async (req, res) => {
  try {
    const { customer_id, vehicle_id, service_id, preferred_date, problem_description } = req.body
    if (!customer_id) return res.status(400).json({ success:false, message:'customer_id is required' })
    if (!preferred_date) return res.status(400).json({ success:false, message:'preferred_date is required' })
    const id = crypto.randomBytes(16).toString('hex')
    const tracking = genTracking()
    await db.query(
      'INSERT INTO appointments (id,tracking_number,customer_id,vehicle_id,service_id,preferred_date,problem_description) VALUES (?,?,?,?,?,?,?)',
      [id, tracking, customer_id, vehicle_id||null, service_id||null, preferred_date, problem_description||null]
    )
    const r = await db.query(`
      SELECT a.*, u.name as customer_name, u.phone as customer_phone,
        v.make, v.model, v.registration_number,
        s.name as service_name
      FROM appointments a
      LEFT JOIN users u ON a.customer_id = u.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.id = ?
    `, [id])
    res.status(201).json({ success:true, data:r.rows[0] })
  } catch (err) { res.status(400).json({ success:false, message:err.message }) }
})

// PATCH accept & assign technician (admin)
router.patch('/:id/assign', authenticate, authorize('admin'), assignAppointmentRules, async (req, res) => {
  try {
    const { technician_id, status } = req.body
    await db.query(
      'UPDATE appointments SET technician_id=?, status=?, updated_at=? WHERE id=?',
      [technician_id, status||'confirmed', new Date().toISOString(), req.params.id]
    )
    // Create job card + pending inspection when confirming
    if (status === 'confirmed' && technician_id) {
      const jcExists = await db.query('SELECT id FROM job_cards WHERE appointment_id = ?', [req.params.id])
      if (!jcExists.rows.length) {
        const jcId = crypto.randomBytes(16).toString('hex')
        await db.query(
          'INSERT INTO job_cards (id,appointment_id,technician_id,progress,status) VALUES (?,?,?,0,?)',
          [jcId, req.params.id, technician_id, 'pending']
        )
        
        // Notify technician about new job assignment
        try {
          const apptInfo = await db.query(`
            SELECT a.tracking_number, v.make, v.model, v.registration_number, s.name as service_name
            FROM appointments a
            LEFT JOIN vehicles v ON a.vehicle_id = v.id
            LEFT JOIN services s ON a.service_id = s.id
            WHERE a.id = ?
          `, [req.params.id])
          
          if (apptInfo.rows.length) {
            const vehicle = apptInfo.rows[0].make && apptInfo.rows[0].model
              ? `${apptInfo.rows[0].make} ${apptInfo.rows[0].model} (${apptInfo.rows[0].registration_number})`
              : apptInfo.rows[0].registration_number
            const service = apptInfo.rows[0].service_name || 'Repair Service'
            
            // In-app notification
            await notify(
              technician_id,
              '🔧 New Job Card Assigned',
              `You have been assigned a new job: ${service} for ${vehicle}. Ref: ${apptInfo.rows[0].tracking_number}`,
              'info'
            )
            
            // Email notification
            const techRow = await db.query('SELECT name, email FROM users WHERE id = ?', [technician_id])
            if (techRow.rows.length && techRow.rows[0].email) {
              emailService.sendJobAssigned({
                name:     techRow.rows[0].name,
                email:    techRow.rows[0].email,
                tracking: apptInfo.rows[0].tracking_number,
                vehicle:  vehicle,
                service:  service,
              }).catch(() => {})
            }
          }
        } catch (e) {
          console.error('Failed to send technician notification:', e)
        }
      }

      // Auto-create inspection record so technician can start immediately
      const apptDetail = await db.query(
        'SELECT customer_id, vehicle_id FROM appointments WHERE id = ?',
        [req.params.id]
      )
      if (apptDetail.rows.length) {
        const { customer_id, vehicle_id } = apptDetail.rows[0]
        const inspExists = await db.query(
          'SELECT id FROM inspections WHERE appointment_id = ?',
          [req.params.id]
        )
        if (!inspExists.rows.length) {
          const inspId  = crypto.randomBytes(16).toString('hex')
          const inspRef = 'INS-' + Math.floor(1000 + Math.random() * 9000)
          await db.query(
            `INSERT INTO inspections (id,reference_number,appointment_id,vehicle_id,customer_id,advisor_id,status)
             VALUES (?,?,?,?,?,?,?)`,
            [inspId, inspRef, req.params.id, vehicle_id, customer_id, req.user.id, 'pending']
          )
        }
      }
    }
    const r = await db.query('SELECT * FROM appointments WHERE id = ?', [req.params.id])
    const appt = r.rows[0]

    // Notify customer
    if (appt.customer_id) {
      const statusLabels = {
        confirmed:   'Your appointment has been confirmed',
        cancelled:   'Your appointment has been cancelled',
        in_progress: 'Your vehicle repair has started',
        completed:   'Your vehicle is ready for collection',
      }
      const label = statusLabels[status || 'confirmed']
      if (label) {
        await notify(
          appt.customer_id,
          label,
          `Booking ${appt.tracking_number} — ${label.toLowerCase()}.`,
          status === 'cancelled' ? 'warning' : 'info'
        )
      }

      // Send confirmation email when appointment is confirmed with technician assigned
      if ((status === 'confirmed' || !status) && technician_id) {
        try {
          const custRow  = await db.query('SELECT name, email FROM users WHERE id = ?', [appt.customer_id])
          const techRow  = await db.query('SELECT name FROM users WHERE id = ?', [technician_id])
          const vehRow   = await db.query('SELECT make, model, registration_number FROM vehicles WHERE id = ?', [appt.vehicle_id])
          const svcRow   = await db.query('SELECT name FROM services WHERE id = ?', [appt.service_id])
          if (custRow.rows.length && custRow.rows[0].email) {
            emailService.sendAppointmentConfirmed({
              name:           custRow.rows[0].name,
              email:          custRow.rows[0].email,
              tracking:       appt.tracking_number,
              date:           appt.preferred_date,
              vehicle:        vehRow.rows.length ? `${vehRow.rows[0].make} ${vehRow.rows[0].model} (${vehRow.rows[0].registration_number})` : 'Your vehicle',
              service:        svcRow.rows.length ? svcRow.rows[0].name : 'General Service',
              technicianName: techRow.rows.length ? techRow.rows[0].name : null,
            }).catch(() => {})
          }
        } catch (_) { /* email errors are non-fatal */ }
      }
    }

    res.json({ success:true, data:appt })
  } catch (err) { res.status(400).json({ success:false, message:err.message }) }
})
router.patch('/:id/status', authenticate, authorize('admin','technician'), async (req, res) => {
  try {
    const { status } = req.body
    await db.query('UPDATE appointments SET status=?,updated_at=? WHERE id=?',
      [status, new Date().toISOString(), req.params.id])

    // Notify customer of status change
    const r = await db.query('SELECT customer_id, tracking_number FROM appointments WHERE id=?', [req.params.id])
    if (r.rows.length && r.rows[0].customer_id) {
      const { customer_id, tracking_number } = r.rows[0]
      const statusLabels = {
        in_progress: 'Your vehicle repair has started',
        completed:   'Your vehicle is ready for collection',
        cancelled:   'Your appointment has been cancelled',
      }
      const label = statusLabels[status]
      if (label) {
        await notify(customer_id, label, `Booking ${tracking_number} — ${label.toLowerCase()}.`,
          status === 'cancelled' ? 'warning' : 'info')
      }
    }

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
