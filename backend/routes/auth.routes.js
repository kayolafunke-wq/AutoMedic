const express  = require('express')
const router   = express.Router()
const bcrypt   = require('bcryptjs')
const crypto   = require('crypto')
const jwt      = require('jsonwebtoken')
const passport = require('passport')
const db       = require('../config/db')
const { authenticate } = require('../middleware/auth')
const { registerRules, loginRules, changePasswordRules } = require('../middleware/validate')
const { body, validationResult } = require('express-validator')
const emailService = require('../services/email.service')

// In-memory store for reset tokens: { token -> { userId, expires } }
// For a production app swap this for a DB table; fine for SQLite single-server use.
const resetTokens = new Map()

const sign = (user) => jwt.sign(
  { id: user.id, role: user.role, name: user.name, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
)

// REGISTER
router.post('/register', registerRules, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body
    if (!name || !email || !password)
      return res.status(400).json({ success:false, message:'Name, email and password required' })

    const exists = await db.query('SELECT id FROM users WHERE email = ?', [email])
    if (exists.rows.length)
      return res.status(409).json({ success:false, message:'Email already registered' })

    const hash = bcrypt.hashSync(password, 12)
    const id   = require('crypto').randomBytes(16).toString('hex')
    await db.query(
      'INSERT INTO users (id,name,email,phone,password_hash,role) VALUES (?,?,?,?,?,?)',
      [id, name, email, phone||null, hash, 'customer']
    )
    const user = { id, name, email, phone, role:'customer' }
    // Send welcome email (non-blocking)
    emailService.sendWelcome({ name, email }).catch(() => {})
    res.status(201).json({ success:true, user, token: sign(user) })
  } catch (err) {
    res.status(500).json({ success:false, message:err.message })
  }
})

// LOGIN
router.post('/login', loginRules, async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ success:false, message:'Email and password required' })

    const result = await db.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email])
    if (!result.rows.length)
      return res.status(401).json({ success:false, message:'Invalid credentials' })

    const user = result.rows[0]
    if (!user.password_hash) {
      // Firebase/Google account with no password set
      return res.status(401).json({
        success: false,
        message: 'This account was created with Google. Please use "Continue with Google" to sign in, or contact admin to set a password.',
        google_account: true,
      })
    }

    const valid = bcrypt.compareSync(password, user.password_hash)
    if (!valid)
      return res.status(401).json({ success:false, message:'Invalid credentials' })

    await db.query('UPDATE users SET last_login = ? WHERE id = ?', [new Date().toISOString(), user.id])
    const { password_hash, ...safe } = user
    res.json({ success:true, user:safe, token: sign(safe) })
  } catch (err) {
    res.status(500).json({ success:false, message:err.message })
  }
})

// GET ME
router.get('/me', authenticate, async (req, res) => {
  try {
    const r = await db.query(
      'SELECT id,name,email,phone,role,avatar_url,created_at FROM users WHERE id = ?',
      [req.user.id]
    )
    if (!r.rows.length) return res.status(404).json({ success:false, message:'User not found' })
    res.json({ success:true, user:r.rows[0] })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

// CHANGE PASSWORD
router.post('/change-password', authenticate, changePasswordRules, async (req, res) => {
  try {
    const { current_password, new_password } = req.body
    const r = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id])
    const user = r.rows[0]
    if (user.password_hash && !bcrypt.compareSync(current_password, user.password_hash))
      return res.status(401).json({ success:false, message:'Current password incorrect' })
    const hash = bcrypt.hashSync(new_password, 12)
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id])
    res.json({ success:true, message:'Password updated' })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

// FIREBASE SYNC — called after Firebase auth on frontend
router.post('/firebase-sync', async (req, res) => {
  try {
    const { idToken, phone, name: displayName } = req.body
    if (!idToken) return res.status(400).json({ success:false, message:'idToken required' })

    // Verify token via the centralized firebase-admin module
    const { verifyIdToken } = require('../config/firebase-admin')
    let decoded
    try {
      decoded = await verifyIdToken(idToken)
    } catch (verifyErr) {
      return res.status(401).json({ success: false, message: 'Invalid or expired Firebase token' })
    }

    const uid    = decoded.uid || decoded.sub
    const email  = decoded.email
    const uname  = displayName || decoded.name || decoded.email?.split('@')[0]
    const avatar = decoded.picture || null

    // Find or create user
    let result = await db.query('SELECT * FROM users WHERE google_id = ?', [uid])
    if (!result.rows.length && email) {
      result = await db.query('SELECT * FROM users WHERE email = ?', [email])
    }

    let user
    if (result.rows.length) {
      user = result.rows[0]
      // Update google_id, avatar — also set password_hash if provided and not already set
      const updateFields = [uid, avatar, new Date().toISOString(), user.id]
      let updateSql = 'UPDATE users SET google_id=?,avatar_url=?,last_login=? WHERE id=?'
      if (req.body.password && !user.password_hash) {
        const bcrypt = require('bcryptjs')
        const hash = bcrypt.hashSync(req.body.password, 12)
        updateSql = 'UPDATE users SET google_id=?,avatar_url=?,last_login=?,password_hash=? WHERE id=?'
        updateFields.splice(3, 0, hash) // insert hash before user.id
      }
      await db.query(updateSql, updateFields)
    } else {
      // New user
      const id = require('crypto').randomBytes(16).toString('hex')
      let pwHash = null
      if (req.body.password) {
        const bcrypt = require('bcryptjs')
        pwHash = bcrypt.hashSync(req.body.password, 12)
      }
      await db.query(
        'INSERT INTO users (id,name,email,phone,google_id,avatar_url,password_hash,role) VALUES (?,?,?,?,?,?,?,?)',
        [id, uname, email, phone||null, uid, avatar, pwHash, 'customer']
      )
      result = await db.query('SELECT * FROM users WHERE id = ?', [id])
      user = result.rows[0]
    }

    // Update phone if provided
    if (phone && !user.phone) {
      await db.query('UPDATE users SET phone=? WHERE id=?', [phone, user.id])
    }

    const { password_hash, ...safe } = user
    const token = sign({ ...safe, id: user.id })
    res.json({ success:true, user:safe, token })
  } catch (err) {
    console.error('Firebase sync error:', err.message)
    res.status(500).json({ success:false, message:err.message })
  }
})
// FORGOT PASSWORD — works for ALL roles (backend + Firebase users)
// Sends a 1-hour reset token via email
router.post('/forgot-password',
  [body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail()],
  async (req, res) => {
    // Always return the same response to prevent email enumeration
    const generic = { success: true, message: 'If that email exists, a reset link has been sent.' }

    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(422).json({ success: false, message: 'Valid email required' })

    try {
      const { email } = req.body
      const result = await db.query('SELECT id, name, email, role FROM users WHERE email = ? AND is_active = 1', [email])
      if (!result.rows.length) return res.json(generic) // don't reveal non-existence

      const user  = result.rows[0]
      const token = crypto.randomBytes(32).toString('hex')
      const expires = Date.now() + 60 * 60 * 1000 // 1 hour

      // Invalidate any previous token for this user
      for (const [k, v] of resetTokens.entries()) {
        if (v.userId === user.id) resetTokens.delete(k)
      }
      resetTokens.set(token, { userId: user.id, expires })

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`
      emailService.sendPasswordReset({ name: user.name, email: user.email, resetUrl, role: user.role }).catch(() => {})

      res.json(generic)
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  }
)

// RESET PASSWORD — validates token and sets new password
router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('new_password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: errors.array()[0].msg })
    }

    const { token, new_password } = req.body
    const entry = resetTokens.get(token)

    if (!entry || entry.expires < Date.now()) {
      resetTokens.delete(token)
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired. Please request a new one.' })
    }

    try {
      const hash = bcrypt.hashSync(new_password, 12)
      await db.query('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [hash, new Date().toISOString(), entry.userId])
      resetTokens.delete(token) // token is single-use
      res.json({ success: true, message: 'Password reset successfully. You can now log in.' })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  }
)

router.get('/google/callback',
  passport.authenticate('google', { session:false, failureRedirect:`${process.env.FRONTEND_URL}/login?error=google_failed` }),
  (req, res) => {
    const token = sign(req.user)
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&role=${req.user.role}`)
  }
)

module.exports = router
