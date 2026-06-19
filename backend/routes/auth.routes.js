const express  = require('express')
const router   = express.Router()
const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')
const passport = require('passport')
const db       = require('../config/db')
const { authenticate } = require('../middleware/auth')

const sign = (user) => jwt.sign(
  { id: user.id, role: user.role, name: user.name, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
)

// REGISTER
router.post('/register', async (req, res) => {
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
    res.status(201).json({ success:true, user, token: sign(user) })
  } catch (err) {
    res.status(500).json({ success:false, message:err.message })
  }
})

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ success:false, message:'Email and password required' })

    const result = await db.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email])
    if (!result.rows.length)
      return res.status(401).json({ success:false, message:'Invalid credentials' })

    const user = result.rows[0]
    if (!user.password_hash)
      return res.status(401).json({ success:false, message:'Please sign in with Google' })

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
router.post('/change-password', authenticate, async (req, res) => {
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

    // Verify token with firebase-admin if available
    let decoded
    try {
      const admin = require('firebase-admin')
      decoded = await admin.auth().verifyIdToken(idToken)
    } catch {
      // firebase-admin not configured — decode manually for dev
      const parts  = idToken.split('.')
      decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString())
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
      await db.query(
        'UPDATE users SET google_id=?,avatar_url=?,last_login=? WHERE id=?',
        [uid, avatar, new Date().toISOString(), user.id]
      )
    } else {
      // New user
      const id = require('crypto').randomBytes(16).toString('hex')
      await db.query(
        'INSERT INTO users (id,name,email,phone,google_id,avatar_url,role) VALUES (?,?,?,?,?,?,?)',
        [id, uname, email, phone||null, uid, avatar, 'customer']
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
router.get('/google/callback',
  passport.authenticate('google', { session:false, failureRedirect:`${process.env.FRONTEND_URL}/login?error=google_failed` }),
  (req, res) => {
    const token = sign(req.user)
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&role=${req.user.role}`)
  }
)

module.exports = router
