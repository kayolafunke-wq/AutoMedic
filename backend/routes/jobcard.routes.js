const express = require('express')
const router  = express.Router()
const crypto  = require('crypto')
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')
const { getIO } = require('../websocket/tracking.socket')
const emailService = require('../services/email.service')
const { updateProgressRules } = require('../middleware/validate')

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

router.get('/my', authenticate, authorize('technician'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT jc.*, a.tracking_number, a.preferred_date, a.problem_description,
        a.customer_id, a.vehicle_id,
        u.name as customer_name, u.phone as customer_phone,
        v.make, v.model, v.registration_number, v.color, v.chassis_number,
        s.name as service_name,
        i.status as inspection_status, i.advisor_signature as inspection_advisor_sig
      FROM job_cards jc
      LEFT JOIN appointments a ON jc.appointment_id = a.id
      LEFT JOIN users u ON a.customer_id = u.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN inspections i ON i.appointment_id = a.id
      WHERE jc.technician_id = ?
      ORDER BY jc.updated_at DESC
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

router.patch('/:id/progress', authenticate, authorize('technician','admin'), updateProgressRules, async (req, res) => {
  try {
    const { progress, status, technician_notes, estimated_cost, final_cost, parts_used } = req.body
    const now = new Date().toISOString()
    const r   = await db.query('SELECT * FROM job_cards WHERE id = ?', [req.params.id])
    if (!r.rows.length) return res.status(404).json({ success:false, message:'Not found' })
    const jc = r.rows[0]

    // ── INSPECTION GATE ─────────────────────────────────────────────────────
    const newStatus = status || jc.status
    if (newStatus !== 'pending' && jc.status === 'pending') {
      const insp = await db.query(
        `SELECT id, status, advisor_signature FROM inspections WHERE appointment_id = ? LIMIT 1`,
        [jc.appointment_id]
      )
      if (!insp.rows.length || !insp.rows[0].advisor_signature) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle inspection must be completed and submitted first.'
        })
      }
      if (insp.rows[0].status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Vehicle inspection must be signed off by the customer before starting repair work.'
        })
      }
    }

    // ── Serialise parts_used ─────────────────────────────────────────────────
    let partsJson = jc.parts_used || '[]'
    if (parts_used !== undefined) {
      // Accept either a string (comma-separated) or an array
      const partsArray = Array.isArray(parts_used)
        ? parts_used
        : String(parts_used).split(',').map(p => p.trim()).filter(Boolean)
      partsJson = JSON.stringify(partsArray)
    }

    // ── Auto-set final_cost when job completes ───────────────────────────────
    const targetStatus  = status || jc.status
    const isCompleting  = targetStatus === 'completed' && jc.status !== 'completed'
    const resolvedFinal = final_cost != null ? Number(final_cost) :
                          (isCompleting ? (estimated_cost || jc.estimated_cost || null) : jc.final_cost)

    await db.query(
      `UPDATE job_cards SET
        progress=?, status=?, technician_notes=?, estimated_cost=?,
        final_cost=?, parts_used=?, updated_at=?,
        started_at=CASE WHEN started_at IS NULL AND ?!='pending' THEN ? ELSE started_at END,
        completed_at=CASE WHEN ?='completed' AND completed_at IS NULL THEN ? ELSE completed_at END
       WHERE id=?`,
      [
        progress ?? jc.progress,
        targetStatus,
        technician_notes || jc.technician_notes,
        estimated_cost != null ? Number(estimated_cost) : jc.estimated_cost,
        resolvedFinal,
        partsJson,
        now,
        targetStatus, now,   // started_at CASE params
        targetStatus, now,   // completed_at CASE params
        req.params.id,
      ]
    )

    // Automatically update/create invoice and update appointment status when job is completed
    if (isCompleting) {
      try {
        await db.query('UPDATE appointments SET status=?, updated_at=? WHERE id=?', ['completed', now, jc.appointment_id])

        const labourAmt = Number(resolvedFinal || 0)
        const invExists = await db.query('SELECT * FROM invoices WHERE appointment_id = ?', [jc.appointment_id])

        if (invExists.rows.length) {
          // ── Invoice already exists (stock keeper ran checkout) ─────────────
          // Merge or replace the [Labour] line with the technician's final_cost
          if (labourAmt > 0) {
            const existingItems = JSON.parse(invExists.rows[0].items || '[]')
              .filter(i => !(i.description || '').startsWith('[Labour]'))  // remove old labour line
            existingItems.push({ description: '[Labour] Repair / Service Charges', qty: 1, unit_price: labourAmt })
            const newSubtotal = existingItems.reduce((s, i) => s + (Number(i.unit_price || 0) * Number(i.qty || 1)), 0)
            const newTax      = Math.round(newSubtotal * 0.165)
            const newTotal    = newSubtotal + newTax
            await db.query(
              'UPDATE invoices SET items=?, subtotal=?, tax=?, total=?, updated_at=? WHERE id=?',
              [JSON.stringify(existingItems), newSubtotal, newTax, newTotal, now, invExists.rows[0].id]
            )
          }
        } else {
          // ── No invoice yet — create one from scratch ───────────────────────
          const appt = await db.query(`
            SELECT a.customer_id, s.name as service_name, s.base_price,
                   v.make, v.model, v.registration_number, a.tracking_number
            FROM appointments a
            LEFT JOIN services s ON a.service_id = s.id
            LEFT JOIN vehicles v ON a.vehicle_id = v.id
            WHERE a.id = ?
          `, [jc.appointment_id])

          if (appt.rows.length) {
            const a = appt.rows[0]
            const items = [
              { description: a.service_name || 'Repair Service', qty: 1, unit_price: labourAmt },
            ]
            const subtotal  = labourAmt
            const tax       = Math.round(subtotal * 0.165)
            const total     = subtotal + tax

            const invId  = crypto.randomBytes(16).toString('hex')
            const invNum = 'INV-' + Date.now().toString().slice(-6)
            await db.query(
              'INSERT INTO invoices (id,invoice_number,appointment_id,customer_id,items,subtotal,tax,total,status) VALUES (?,?,?,?,?,?,?,?,?)',
              [invId, invNum, jc.appointment_id, a.customer_id, JSON.stringify(items), subtotal, tax, total, 'unpaid']
            )

            // In-app notification
            await notify(
              a.customer_id,
              '📄 Invoice Generated for your Service',
              `An invoice of MK ${total.toLocaleString()} has been generated for your service. Ref: ${invNum}`,
              'info'
            )

            // Email notification
            try {
              const custRow = await db.query('SELECT name, email FROM users WHERE id = ?', [a.customer_id])
              if (custRow.rows.length && custRow.rows[0].email) {
                const vehicleLabel = (a.make && a.model)
                  ? `${a.make} ${a.model} (${a.registration_number})`
                  : 'your vehicle'
                emailService.sendInvoiceReady({
                  name:          custRow.rows[0].name,
                  email:         custRow.rows[0].email,
                  tracking:      a.tracking_number,
                  vehicle:       vehicleLabel,
                  invoiceNumber: invNum,
                  total,
                }).catch(() => {})
              }
            } catch (_) {}
          }
        }
      } catch (e) {
        console.error('Failed to auto-generate/update invoice:', e)
      }
    }

    // Log repair update
    const updId = crypto.randomBytes(16).toString('hex')
    await db.query(
      'INSERT INTO repair_updates (id,job_card_id,updated_by,status,note) VALUES (?,?,?,?,?)',
      [updId, req.params.id, req.user.id, status||jc.status, technician_notes||null]
    )

    // Notify customer via socket + notification
    try {
      const io = getIO()
      const appt = await db.query(
        'SELECT tracking_number, customer_id FROM appointments WHERE id = ?',
        [jc.appointment_id]
      )
      if (appt.rows.length) {
        const { tracking_number, customer_id } = appt.rows[0]

        // Real-time socket push
        io.to(`customer_${customer_id}`).emit('progress_update', {
          tracking: tracking_number,
          progress: progress ?? jc.progress,
          status:   status || jc.status,
        })
        io.to(`track_${tracking_number}`).emit('progress_update', {
          tracking: tracking_number,
          progress: progress ?? jc.progress,
          status:   status || jc.status,
        })

        // Persisted notification for meaningful status transitions
        const statusLabels = {
          diagnosis:     'Diagnosis in progress on your vehicle',
          parts_ordered: 'Parts have been ordered for your vehicle',
          in_progress:   'Your vehicle repair is now in progress',
          quality_check: 'Your vehicle is undergoing quality check',
          ready:         'Your vehicle is ready for collection! 🎉',
          completed:     'Service completed. Thank you for choosing AutoMedic!',
        }
        const newStatus = status || jc.status
        if (statusLabels[newStatus] && newStatus !== jc.status) {
          await notify(
            customer_id,
            statusLabels[newStatus],
            `Job ${tracking_number} — ${statusLabels[newStatus].toLowerCase()}`,
            newStatus === 'ready' || newStatus === 'completed' ? 'success' : 'info'
          )

          // Email for key status transitions
          try {
            const custRow = await db.query('SELECT name, email FROM users WHERE id = ?', [customer_id])
            const vehRow  = await db.query(`
              SELECT v.make, v.model, v.registration_number
              FROM appointments a LEFT JOIN vehicles v ON a.vehicle_id = v.id
              WHERE a.id = ?
            `, [jc.appointment_id])
            if (custRow.rows.length && custRow.rows[0].email) {
              const vehicleLabel = vehRow.rows.length
                ? `${vehRow.rows[0].make} ${vehRow.rows[0].model} (${vehRow.rows[0].registration_number})`
                : 'your vehicle'
              emailService.sendRepairUpdate({
                name:     custRow.rows[0].name,
                email:    custRow.rows[0].email,
                tracking: tracking_number,
                vehicle:  vehicleLabel,
                status:   newStatus,
                progress: progress ?? jc.progress,
              }).catch(() => {})
            }
          } catch (_) {}
        }
      }
    } catch (_) { /* socket errors are non-fatal */ }

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
