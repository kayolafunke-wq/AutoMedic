const passport       = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const crypto         = require('crypto')
const db             = require('./db')
require('dotenv').config()

// Only initialize Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email     = profile.emails[0].value
      const name      = profile.displayName
      const avatarUrl = profile.photos[0]?.value || null
      const googleId  = profile.id

      // Check existing user by google_id first
      let result = await db.query('SELECT * FROM users WHERE google_id = $1', [googleId])

      if (!result.rows.length) {
        // Try by email
        result = await db.query('SELECT * FROM users WHERE email = $1', [email])
      }

      if (result.rows.length) {
        // Existing user — update google_id + avatar
        const user = result.rows[0]
        await db.query(
          'UPDATE users SET google_id=$1, avatar_url=$2, last_login=$3 WHERE id=$4',
          [googleId, avatarUrl, new Date().toISOString(), user.id]
        )
        return done(null, { ...user, google_id: googleId, avatar_url: avatarUrl })
      }

      // New user — create customer account
      const id = crypto.randomBytes(16).toString('hex')
      await db.query(
        'INSERT INTO users (id,name,email,google_id,avatar_url,role,password_hash) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [id, name, email, googleId, avatarUrl, 'customer', null]
      )
      const newUser = { id, name, email, google_id: googleId, avatar_url: avatarUrl, role: 'customer', is_active: 1 }
      return done(null, newUser)

    } catch (err) {
      return done(err, null)
    }
  }))
} else {
  console.log('Google OAuth not configured - skipping Google authentication')
}

module.exports = passport
