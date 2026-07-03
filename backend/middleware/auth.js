const jwt = require('jsonwebtoken')
require('dotenv').config()

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ success:false, message:'No token provided' })

  const token = header.split(' ')[1]

  // 1. Try our own JWT first (admin / technician / stockkeeper / backend customers)
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    return next()
  } catch {}

  // 2. Try Firebase ID token (customers who logged in via Firebase directly)
  try {
    const parts = token.split('.')
    if (parts.length === 3) {
      const padding = parts[1].length % 4
      const padded  = padding ? parts[1] + '='.repeat(4 - padding) : parts[1]
      const payload = JSON.parse(Buffer.from(padded, 'base64url').toString())

      // Firebase tokens have 'iss' containing googleapis.com
      if (payload.iss && payload.iss.includes('googleapis.com')) {
        // Verify with firebase-admin when configured
        const { verifyIdToken } = require('./firebase-admin')
        let verified
        try {
          verified = await verifyIdToken(token)
        } catch {
          return res.status(401).json({ success: false, message: 'Invalid or expired token' })
        }

        const db  = require('../config/db')
        const uid = verified.uid || verified.sub
        let r     = await db.query('SELECT * FROM users WHERE google_id = ?', [uid])
        if (!r.rows.length && verified.email) {
          r = await db.query('SELECT * FROM users WHERE email = ?', [verified.email])
        }
        if (r.rows.length) {
          req.user = r.rows[0]
          return next()
        }
      }
    }
  } catch {}

  return res.status(401).json({ success:false, message:'Invalid or expired token' })
}

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role))
    return res.status(403).json({ success:false, message:'Access denied' })
  next()
}

module.exports = { authenticate, authorize }
