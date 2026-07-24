const express = require('express')
const router  = express.Router()
const bcrypt  = require('bcryptjs')
const crypto  = require('crypto')
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')
const { createUserRules, updateUserRules, resetPasswordRules } = require('../middleware/validate')
const emailService = require('../services/email.service')

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.query
    const sql = role
      ? 'SELECT id,name,email,phone,role,is_active,avatar_url,last_login,created_at FROM users WHERE role=$1 ORDER BY created_at DESC'
      : 'SELECT id,name,email,phone,role,is_active,avatar_url,last_login,created_at FROM users ORDER BY created_at DESC'
    const r = await db.query(sql, role ? [role] : [])
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

router.post('/', authenticate, authorize('admin'), createUserRules, async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body
    if (!name||!email||!password||!role)
      return res.status(400).json({ success:false, message:'Name, email, password and role required' })
    if (!['technician','admin','customer','stockkeeper'].includes(role))
      return res.status(400).json({ success:false, message:'Invalid role' })
    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email])
    if (exists.rows.length)
      return res.status(409).json({ success:false, message:'Email already exists' })
    const hash = bcrypt.hashSync(password, 12)
    const id   = crypto.randomBytes(16).toString('hex')
    await db.query(
      'INSERT INTO users (id,name,email,phone,password_hash,role) VALUES ($1,$2,$3,$4,$5,$6)',
      [id, name, email, phone||null, hash, role]
    )
    const r = await db.query('SELECT id,name,email,phone,role,is_active,created_at FROM users WHERE id = $1', [id])
    // Email new user their credentials
    emailService.sendNewAccountCredentials({ name, email, password, role }).catch(() => {})
    res.status(201).json({ success:true, data:r.rows[0] })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

router.patch('/:id', authenticate, authorize('admin'), updateUserRules, async (req, res) => {
  try {
    const { name, email, phone, role, is_active } = req.body
    const r = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id])
    if (!r.rows.length) return res.status(404).json({ success:false, message:'User not found' })
    const u = r.rows[0]
    // Convert is_active to integer (SQLite cannot bind JS booleans)
    const activeVal = is_active !== undefined ? (is_active ? 1 : 0) : u.is_active
    await db.query(
      'UPDATE users SET name=$1,email=$2,phone=$3,role=$4,is_active=$5 WHERE id=$6',
      [name||u.name, email||u.email, phone||u.phone, role||u.role, activeVal, req.params.id]
    )
    const updated = await db.query('SELECT id,name,email,phone,role,is_active FROM users WHERE id = $1', [req.params.id])
    res.json({ success:true, data:updated.rows[0] })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

router.post('/:id/reset-password', authenticate, authorize('admin'), resetPasswordRules, async (req, res) => {
  try {
    const { new_password } = req.body
    if (!new_password||new_password.length < 6)
      return res.status(400).json({ success:false, message:'Password must be at least 6 characters' })
    const hash = bcrypt.hashSync(new_password, 12)
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.params.id])
    res.json({ success:true, message:'Password reset successfully' })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await db.query('UPDATE users SET is_active = 0 WHERE id = $1', [req.params.id])
    res.json({ success:true, message:'User deactivated' })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

// DELETE permanently (hard delete) — also removes vehicles, appointments, notifications
router.delete('/:id/permanent', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params

    // Prevent deleting yourself
    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' })
    }

    const userRow = await db.query('SELECT id, name, role FROM users WHERE id = $1', [id])
    if (!userRow.rows.length) return res.status(404).json({ success: false, message: 'User not found' })

    const user = userRow.rows[0]

    // Count related records so the response can inform the caller
    const [appts, vehicles, invoices, notifications] = await Promise.all([
      db.query('SELECT COUNT(*) as cnt FROM appointments WHERE customer_id = $1', [id]),
      db.query('SELECT COUNT(*) as cnt FROM vehicles WHERE customer_id = $1', [id]),
      db.query('SELECT COUNT(*) as cnt FROM invoices WHERE customer_id = $1', [id]),
      db.query('SELECT COUNT(*) as cnt FROM notifications WHERE user_id = $1', [id]),
    ])

    // Cascade delete — order matters (children before parents)
    // Notifications
    await db.query('DELETE FROM notifications WHERE user_id = $1', [id])

    // Invoices (for customers)
    await db.query('DELETE FROM invoices WHERE customer_id = $1', [id])

    // Job cards assigned to this technician — nullify, don't delete (preserve history)
    await db.query("UPDATE job_cards SET technician_id = NULL WHERE technician_id = $1", [id])

    // Appointments & their related records
    const userAppts = await db.query('SELECT id FROM appointments WHERE customer_id = $1', [id])
    for (const a of userAppts.rows) {
      // repair_updates → job_cards → inspections → inspection_photos
      const jcRows = await db.query('SELECT id FROM job_cards WHERE appointment_id = $1', [a.id])
      for (const jc of jcRows.rows) {
        await db.query('DELETE FROM repair_updates WHERE job_card_id = $1', [jc.id])
      }
      await db.query('DELETE FROM job_cards WHERE appointment_id = $1', [a.id])

      const inspRows = await db.query('SELECT id FROM inspections WHERE appointment_id = $1', [a.id])
      for (const insp of inspRows.rows) {
        await db.query('DELETE FROM inspection_photos WHERE inspection_id = $1', [insp.id])
      }
      await db.query('DELETE FROM inspections WHERE appointment_id = $1', [a.id])
    }
    await db.query('DELETE FROM appointments WHERE customer_id = $1', [id])

    // Vehicles
    await db.query('DELETE FROM vehicles WHERE customer_id = $1', [id])

    // Finally delete the user
    await db.query('DELETE FROM users WHERE id = $1', [id])

    res.json({
      success: true,
      message: `${user.name} has been permanently deleted.`,
      deleted: {
        user: user.name,
        appointments: appts.rows[0].cnt,
        vehicles:     vehicles.rows[0].cnt,
        invoices:     invoices.rows[0].cnt,
        notifications:notifications.rows[0].cnt,
      }
    })
  } catch (err) {
    console.error('Permanent delete error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
