const express = require('express')
const router  = express.Router()
const crypto  = require('crypto')
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')
const { jobCardCheckoutRules, walkinCheckoutRules, restockRules } = require('../middleware/validate')

// Both stockkeeper and admin can do checkouts
const checkoutAuth = authorize('stockkeeper', 'admin')

// ── helper: deduct stock (throws if insufficient) ────────────────────────────
async function deductStock(productId, qty, checkQty = true) {
  const p = await db.query('SELECT id, name, stock_quantity FROM products WHERE id = ? AND is_active = 1', [productId])
  if (!p.rows.length) throw new Error(`Product not found: ${productId}`)
  const product = p.rows[0]
  if (checkQty && product.stock_quantity < qty) {
    throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, requested: ${qty}`)
  }
  await db.query(
    'UPDATE products SET stock_quantity = MAX(0, stock_quantity - ?) WHERE id = ?',
    [qty, productId]
  )
  return product
}

// ── helper: create/update invoice with parts (+optional labour) ──────────────
async function attachToInvoice(appointmentId, customerId, checkoutItems, checkoutId, labourCost) {
  if (!appointmentId || !customerId) return null

  // Find existing invoice for this appointment
  let inv = await db.query('SELECT * FROM invoices WHERE appointment_id = ?', [appointmentId])

  const partsTotal  = checkoutItems.reduce((s, i) => s + (Number(i.unit_price || 0) * Number(i.qty || 1)), 0)
  // Build item list: parts rows + optional labour row
  const labourAmt   = Number(labourCost || 0)
  const allNewItems = [
    ...checkoutItems.map(i => ({
      description: `[Parts] ${i.name}`,
      qty:         i.qty,
      unit_price:  i.unit_price,
    }))
  ]
  if (labourAmt > 0) {
    allNewItems.push({ description: '[Labour] Repair / Service Charges', qty: 1, unit_price: labourAmt })
  }

  if (inv.rows.length) {
    // Append new items to existing invoice items
    // Strip any previous [Labour] line so we don't double-count if re-running
    const existingItems = JSON.parse(inv.rows[0].items || '[]')
      .filter(i => !(i.description || '').startsWith('[Labour]'))
    const mergedItems = [...existingItems, ...allNewItems]
    const newSubtotal = mergedItems.reduce((s, i) => s + (Number(i.unit_price || 0) * Number(i.qty || 1)), 0)
    const newTax      = Math.round(newSubtotal * 0.165)
    const newTotal    = newSubtotal + newTax
    await db.query(
      'UPDATE invoices SET items = ?, subtotal = ?, tax = ?, total = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(mergedItems), newSubtotal, newTax, newTotal, new Date().toISOString(), inv.rows[0].id]
    )
    return inv.rows[0].id
  } else {
    // Create new invoice
    const invId  = crypto.randomBytes(16).toString('hex')
    const invNum = 'INV-' + Date.now().toString().slice(-6)
    const subtotal = allNewItems.reduce((s, i) => s + (Number(i.unit_price || 0) * Number(i.qty || 1)), 0)
    const tax      = Math.round(subtotal * 0.165)
    const total    = subtotal + tax
    await db.query(
      'INSERT INTO invoices (id,invoice_number,appointment_id,customer_id,items,subtotal,tax,total,status) VALUES (?,?,?,?,?,?,?,?,?)',
      [invId, invNum, appointmentId, customerId, JSON.stringify(allNewItems), subtotal, tax, total, 'unpaid']
    )
    return invId
  }
}

// ── GET all checkouts (admin = all, stockkeeper = own) ───────────────────────
router.get('/', authenticate, authorize('admin', 'stockkeeper'), async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin'
    const sql = `
      SELECT sc.*,
        u.name  AS created_by_name,
        cu.name AS customer_display_name,
        a.tracking_number
      FROM stock_checkouts sc
      LEFT JOIN users u  ON sc.created_by    = u.id
      LEFT JOIN users cu ON sc.customer_id   = cu.id
      LEFT JOIN appointments a ON sc.appointment_id = a.id
      ${isAdmin ? '' : 'WHERE sc.created_by = ?'}
      ORDER BY sc.created_at DESC
      LIMIT 200
    `
    const params = isAdmin ? [] : [req.user.id]
    const r = await db.query(sql, params)
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// ── GET active job cards for checkout selection ──────────────────────────────
router.get('/job-cards', authenticate, authorize('admin', 'stockkeeper'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT jc.id, jc.status, jc.appointment_id,
        a.tracking_number, a.customer_id, a.preferred_date,
        u.name  AS customer_name, u.phone AS customer_phone,
        v.make, v.model, v.registration_number,
        s.name  AS service_name,
        t.name  AS technician_name
      FROM job_cards jc
      LEFT JOIN appointments a ON jc.appointment_id = a.id
      LEFT JOIN users u        ON a.customer_id = u.id
      LEFT JOIN vehicles v     ON a.vehicle_id  = v.id
      LEFT JOIN services s     ON a.service_id  = s.id
      LEFT JOIN users t        ON jc.technician_id = t.id
      WHERE jc.status NOT IN ('completed')
      ORDER BY jc.created_at DESC
    `)
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// ── GET customers list for walk-in ──────────────────────────────────────────
router.get('/customers', authenticate, authorize('admin', 'stockkeeper'), async (req, res) => {
  try {
    const r = await db.query(
      "SELECT id, name, email, phone FROM users WHERE role = 'customer' AND is_active = 1 ORDER BY name"
    )
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// ── GET available products with stock ────────────────────────────────────────
router.get('/products', authenticate, authorize('admin', 'stockkeeper'), async (req, res) => {
  try {
    const r = await db.query(
      'SELECT id, name, category, price, stock_quantity FROM products WHERE is_active = 1 ORDER BY name'
    )
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// ── POST job-card checkout ────────────────────────────────────────────────────
router.post('/job-card', authenticate, checkoutAuth, jobCardCheckoutRules, async (req, res) => {
  try {
    const { job_card_id, items, notes } = req.body
    if (!job_card_id || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'job_card_id and items are required' })
    }

    // Get job card + appointment info
    const jcRow = await db.query(`
      SELECT jc.*, a.customer_id, a.id AS appt_id, a.tracking_number,
        u.name AS customer_name
      FROM job_cards jc
      LEFT JOIN appointments a ON jc.appointment_id = a.id
      LEFT JOIN users u ON a.customer_id = u.id
      WHERE jc.id = ?
    `, [job_card_id])
    if (!jcRow.rows.length) return res.status(404).json({ success: false, message: 'Job card not found' })
    const jc = jcRow.rows[0]

    // Deduct stock for each item
    const resolvedItems = []
    for (const item of items) {
      const product = await deductStock(item.product_id, Number(item.qty))
      resolvedItems.push({
        product_id: item.product_id,
        name:       product.name,
        qty:        Number(item.qty),
        unit_price: Number(item.unit_price || 0),
      })
    }

    const subtotal = resolvedItems.reduce((s, i) => s + i.unit_price * i.qty, 0)
    const tax      = Math.round(subtotal * 0.165)
    const total    = subtotal + tax

    // Attach to invoice — include final_cost (labour) if tech has already set it
    const invoiceId = await attachToInvoice(jc.appt_id, jc.customer_id, resolvedItems, null, jc.final_cost || 0)

    // Record checkout
    const id = crypto.randomBytes(16).toString('hex')
    await db.query(
      `INSERT INTO stock_checkouts
        (id,type,job_card_id,appointment_id,customer_id,customer_name,items,subtotal,tax,total,invoice_id,notes,created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, 'job_card', job_card_id, jc.appt_id, jc.customer_id, jc.customer_name,
       JSON.stringify(resolvedItems), subtotal, tax, total, invoiceId, notes || null, req.user.id]
    )

    const result = await db.query('SELECT * FROM stock_checkouts WHERE id = ?', [id])
    res.status(201).json({
      success: true,
      data: result.rows[0],
      invoice_id: invoiceId,
      message: `Checkout complete. ${resolvedItems.length} item(s) deducted from stock.`
    })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// ── POST walk-in sale checkout ────────────────────────────────────────────────
router.post('/walkin', authenticate, checkoutAuth, walkinCheckoutRules, async (req, res) => {
  try {
    const { customer_id, customer_name, items, notes } = req.body
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'items are required' })
    }

    // Deduct stock for each item
    const resolvedItems = []
    for (const item of items) {
      const product = await deductStock(item.product_id, Number(item.qty))
      resolvedItems.push({
        product_id: item.product_id,
        name:       product.name,
        qty:        Number(item.qty),
        unit_price: Number(item.unit_price || 0),
      })
    }

    const subtotal = resolvedItems.reduce((s, i) => s + i.unit_price * i.qty, 0)
    const tax      = Math.round(subtotal * 0.165)
    const total    = subtotal + tax

    // Generate standalone invoice for walk-in
    let invoiceId = null
    const custId  = customer_id || null
    const custName = customer_name || 'Walk-in Customer'

    if (custId || custName) {
      const invId  = crypto.randomBytes(16).toString('hex')
      const invNum = 'INV-' + Date.now().toString().slice(-6)
      const invItems = resolvedItems.map(i => ({
        description: i.name,
        qty:         i.qty,
        unit_price:  i.unit_price,
      }))
      await db.query(
        'INSERT INTO invoices (id,invoice_number,appointment_id,customer_id,items,subtotal,tax,total,status) VALUES (?,?,?,?,?,?,?,?,?)',
        [invId, invNum, null, custId, JSON.stringify(invItems), subtotal, tax, total, 'unpaid']
      )
      invoiceId = invId
    }

    // Record checkout
    const id = crypto.randomBytes(16).toString('hex')
    await db.query(
      `INSERT INTO stock_checkouts
        (id,type,job_card_id,appointment_id,customer_id,customer_name,items,subtotal,tax,total,invoice_id,notes,created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, 'walkin', null, null, custId, custName,
       JSON.stringify(resolvedItems), subtotal, tax, total, invoiceId, notes || null, req.user.id]
    )

    const result = await db.query('SELECT * FROM stock_checkouts WHERE id = ?', [id])
    res.status(201).json({
      success: true,
      data: result.rows[0],
      invoice_id: invoiceId,
      message: `Walk-in sale complete. Invoice generated.`
    })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// ── PATCH restock — admin/stockkeeper adds stock ──────────────────────────────
router.patch('/restock/:product_id', authenticate, authorize('admin', 'stockkeeper'), restockRules, async (req, res) => {
  try {
    const { qty, notes } = req.body
    if (!qty || Number(qty) <= 0) return res.status(400).json({ success: false, message: 'qty must be > 0' })
    const p = await db.query('SELECT id, name, stock_quantity FROM products WHERE id = ?', [req.params.product_id])
    if (!p.rows.length) return res.status(404).json({ success: false, message: 'Product not found' })
    const newQty = p.rows[0].stock_quantity + Number(qty)
    await db.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [newQty, req.params.product_id])
    res.json({
      success: true,
      message: `Restocked "${p.rows[0].name}" by ${qty}. New qty: ${newQty}`,
      new_quantity: newQty
    })
  } catch (err) { res.status(400).json({ success: false, message: err.message }) }
})

module.exports = router
