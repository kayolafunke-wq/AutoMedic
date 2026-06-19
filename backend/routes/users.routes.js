const express = require('express')
const router  = express.Router()
const bcrypt  = require('bcryptjs')
const crypto  = require('crypto')
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.query
    const sql = role
      ? 'SELECT id,name,email,phone,role,is_active,avatar_url,last_login,created_at FROM users WHERE role=? ORDER BY created_at DESC'
      : 'SELECT id,name,email,phone,role,is_active,avatar_url,last_login,created_at FROM users ORDER BY created_at DESC'
    const r = await db.query(sql, role ? [role] : [])
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body
    if (!name||!email||!password||!role)
      return res.status(400).json({ success:false, message:'Name, email, password and role required' })
    if (!['technician','admin','customer'].includes(role))
      return res.status(400).json({ success:false, message:'Invalid role' })
    const exists = await db.query('SELECT id FROM users WHERE email = ?', [email])
    if (exists.rows.length)
      return res.status(409).json({ success:false, message:'Email already exists' })
    const hash = bcrypt.hashSync(password, 12)
    const id   = crypto.randomBytes(16).toString('hex')
    await db.query(
      'INSERT INTO users (id,name,email,phone,password_hash,role) VALUES (?,?,?,?,?,?)',
      [id, name, email, phone||null, hash, role]
    )
    const r = await db.query('SELECT id,name,email,phone,role,is_active,created_at FROM users WHERE id = ?', [id])
    res.status(201).json({ success:true, data:r.rows[0] })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

router.patch('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, email, phone, role, is_active } = req.body
    const r = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id])
    if (!r.rows.length) return res.status(404).json({ success:false, message:'User not found' })
    const u = r.rows[0]
    await db.query(
      'UPDATE users SET name=?,email=?,phone=?,role=?,is_active=? WHERE id=?',
      [name||u.name, email||u.email, phone||u.phone, role||u.role, is_active!==undefined?is_active:u.is_active, req.params.id]
    )
    const updated = await db.query('SELECT id,name,email,phone,role,is_active FROM users WHERE id = ?', [req.params.id])
    res.json({ success:true, data:updated.rows[0] })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

router.post('/:id/reset-password', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { new_password } = req.body
    if (!new_password||new_password.length < 6)
      return res.status(400).json({ success:false, message:'Password must be at least 6 characters' })
    const hash = bcrypt.hashSync(new_password, 12)
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.params.id])
    res.json({ success:true, message:'Password reset successfully' })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await db.query('UPDATE users SET is_active = 0 WHERE id = ?', [req.params.id])
    res.json({ success:true, message:'User deactivated' })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

module.exports = router
