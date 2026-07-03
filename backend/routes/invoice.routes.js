const express = require('express')
const router  = express.Router()
const crypto  = require('crypto')
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')
const { createInvoiceRules, updateInvoiceStatusRules } = require('../middleware/validate')

const genInvoiceNum = () => 'INV-' + Date.now().toString().slice(-6)

// GET all invoices (admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT inv.*, u.name as customer_name, u.phone as customer_phone,
        a.tracking_number, v.make, v.model, v.registration_number, s.name as service_name
      FROM invoices inv
      LEFT JOIN appointments a ON inv.appointment_id = a.id
      LEFT JOIN users u ON inv.customer_id = u.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN services s ON a.service_id = s.id
      ORDER BY inv.created_at DESC
    `)
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// GET my invoices (customer)
router.get('/my', authenticate, authorize('customer'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT inv.*, a.tracking_number, v.make, v.model, v.registration_number, s.name as service_name
      FROM invoices inv
      LEFT JOIN appointments a ON inv.appointment_id = a.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE inv.customer_id = ?
      ORDER BY inv.created_at DESC
    `, [req.user.id])
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// GET single invoice by id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const r = await db.query(`
      SELECT inv.*, u.name as customer_name, u.phone as customer_phone,
        a.tracking_number, a.preferred_date,
        v.make, v.model, v.registration_number, s.name as service_name
      FROM invoices inv
      LEFT JOIN appointments a ON inv.appointment_id = a.id
      LEFT JOIN users u ON inv.customer_id = u.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE inv.id = ?
    `, [req.params.id])
    if (!r.rows.length) return res.status(404).json({ success: false, message: 'Invoice not found' })
    // Customers can only view their own
    const inv = r.rows[0]
    if (req.user.role === 'customer' && inv.customer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }
    res.json({ success: true, data: inv })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// POST create invoice (admin)
router.post('/', authenticate, authorize('admin'), createInvoiceRules, async (req, res) => {
  try {
    const { appointment_id, customer_id, items, tax_rate = 0.165 } = req.body
    if (!appointment_id || !customer_id) {
      return res.status(400).json({ success: false, message: 'appointment_id and customer_id are required' })
    }
    const lineItems = Array.isArray(items) ? items : []
    const subtotal  = lineItems.reduce((sum, i) => sum + (Number(i.qty || 1) * Number(i.unit_price || 0)), 0)
    const tax       = Math.round(subtotal * tax_rate)
    const total     = subtotal + tax

    const id  = crypto.randomBytes(16).toString('hex')
    const num = genInvoiceNum()
    await db.query(
      'INSERT INTO invoices (id,invoice_number,appointment_id,customer_id,items,subtotal,tax,total,status) VALUES (?,?,?,?,?,?,?,?,?)',
      [id, num, appointment_id, customer_id, JSON.stringify(lineItems), subtotal, tax, total, 'unpaid']
    )
    const r = await db.query(`
      SELECT inv.*, u.name as customer_name, a.tracking_number,
        v.make, v.model, v.registration_number, s.name as service_name
      FROM invoices inv
      LEFT JOIN appointments a ON inv.appointment_id = a.id
      LEFT JOIN users u ON inv.customer_id = u.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE inv.id = ?
    `, [id])
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(400).json({ success: false, message: err.message }) }
})

// PATCH update invoice status (admin)
router.patch('/:id/status', authenticate, authorize('admin'), updateInvoiceStatusRules, async (req, res) => {
  try {
    const { status } = req.body
    if (!['unpaid', 'paid', 'partial'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' })
    }
    const now = new Date().toISOString()
    // Stamp paid_at when marking as paid; clear it if reverting
    const paidAt = status === 'paid' ? now : null
    await db.query(
      'UPDATE invoices SET status = ?, paid_at = ?, updated_at = ? WHERE id = ?',
      [status, paidAt, now, req.params.id]
    )
    res.json({ success: true, paid_at: paidAt })
  } catch (err) { res.status(400).json({ success: false, message: err.message }) }
})

// POST generate invoice automatically from a completed appointment (admin)
router.post('/generate/:appointment_id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const apptId = req.params.appointment_id

    // Check not already invoiced
    const existing = await db.query('SELECT id FROM invoices WHERE appointment_id = ?', [apptId])
    if (existing.rows.length) {
      return res.json({ success: true, data: existing.rows[0], message: 'Invoice already exists' })
    }

    const appt = await db.query(`
      SELECT a.*, jc.estimated_cost, jc.final_cost, s.name as service_name, s.base_price
      FROM appointments a
      LEFT JOIN job_cards jc ON jc.appointment_id = a.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.id = ?
    `, [apptId])
    if (!appt.rows.length) return res.status(404).json({ success: false, message: 'Appointment not found' })

    const a         = appt.rows[0]
    const baseAmt   = Number(a.final_cost || a.estimated_cost || a.base_price || 0)
    const labour    = Math.round(baseAmt * 0.30)
    const parts     = Math.round(baseAmt * 0.70)
    const items     = [
      { description: a.service_name || 'Repair Service', qty: 1, unit_price: parts },
      { description: 'Labour Charges',                   qty: 1, unit_price: labour },
    ]
    const subtotal  = baseAmt
    const tax       = Math.round(subtotal * 0.165)
    const total     = subtotal + tax

    const id  = crypto.randomBytes(16).toString('hex')
    const num = genInvoiceNum()
    await db.query(
      'INSERT INTO invoices (id,invoice_number,appointment_id,customer_id,items,subtotal,tax,total,status) VALUES (?,?,?,?,?,?,?,?,?)',
      [id, num, apptId, a.customer_id, JSON.stringify(items), subtotal, tax, total, 'unpaid']
    )
    const r = await db.query(`
      SELECT inv.*, u.name as customer_name, a.tracking_number, a.preferred_date,
        v.make, v.model, v.registration_number, s.name as service_name
      FROM invoices inv
      LEFT JOIN appointments a ON inv.appointment_id = a.id
      LEFT JOIN users u ON inv.customer_id = u.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE inv.id = ?
    `, [id])
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) { res.status(400).json({ success: false, message: err.message }) }
})

module.exports = router
