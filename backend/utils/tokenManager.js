const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const db = require('../config/db')

/**
 * Generate access token (short-lived: 15 minutes)
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  )
}

/**
 * Generate refresh token (long-lived: 7 days)
 */
const generateRefreshToken = async (user) => {
  const token = jwt.sign(
    { id: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  )

  // Store refresh token in database
  const id = crypto.randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  try {
    // Clean up expired tokens for this user
    await db.query(
      'DELETE FROM refresh_tokens WHERE user_id = $1 AND expires_at < NOW()',
      [user.id]
    )

    // Insert new refresh token
    await db.query(
      'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
      [id, user.id, token, expiresAt]
    )
  } catch (err) {
    console.error('Error storing refresh token:', err.message)
    // Non-fatal - token will still work, just won't be tracked
  }

  return token
}

/**
 * Generate both access and refresh tokens
 */
const generateTokens = async (user) => {
  const accessToken = generateAccessToken(user)
  const refreshToken = await generateRefreshToken(user)
  return { accessToken, refreshToken }
}

/**
 * Verify and decode refresh token
 */
const verifyRefreshToken = async (token) => {
  try {
    // Verify JWT signature
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    )

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type')
    }

    // Check if token exists in database and hasn't been revoked
    const result = await db.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    )

    if (!result.rows.length) {
      throw new Error('Refresh token not found or expired')
    }

    return decoded
  } catch (err) {
    throw new Error('Invalid or expired refresh token')
  }
}

/**
 * Revoke refresh token (logout)
 */
const revokeRefreshToken = async (token) => {
  try {
    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [token])
    return true
  } catch (err) {
    console.error('Error revoking refresh token:', err.message)
    return false
  }
}

/**
 * Revoke all refresh tokens for a user (logout all devices)
 */
const revokeAllRefreshTokens = async (userId) => {
  try {
    await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId])
    return true
  } catch (err) {
    console.error('Error revoking all refresh tokens:', err.message)
    return false
  }
}

/**
 * Clean up expired tokens (should be run periodically)
 */
const cleanupExpiredTokens = async () => {
  try {
    const result = await db.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()')
    console.log(`🧹 Cleaned up ${result.rowCount || 0} expired refresh tokens`)
    return result.rowCount || 0
  } catch (err) {
    console.error('Error cleaning up expired tokens:', err.message)
    return 0
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  cleanupExpiredTokens,
}
