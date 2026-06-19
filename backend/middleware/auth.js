const jwt = require('jsonwebtoken')
require('dotenv').config()

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ success:false, message:'No token provided' })

  const token = header.split(' ')[1]

  // Try our own JWT first
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    return next()
  } catch {}

  // Try Firebase ID token (for direct Firebase calls)
  try {
    const parts   = token.split('.')
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1] + '==', 'base64').toString())
      // Firebase tokens have 'iss' containing googleapis.com
      if (payload.iss && payload.iss.includes('googleapis.com')) {
        const db = require('../config/db')
        const uid = payload.sub || payload.uid
        const r   = await db.query('SELECT * FROM users WHERE google_id = ?', [uid])
        if (r.rows.length) {
          req.user = r.rows[0]
          return next()
        }
        // User exists by email
        if (payload.email) {
          const r2 = await db.query('SELECT * FROM users WHERE email = ?', [payload.email])
          if (r2.rows.length) {
            req.user = r2.rows[0]
            return next()
          }
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
