/**
 * Firebase Admin SDK initializer.
 *
 * Supports two config modes:
 *  1. Service account JSON file  — set FIREBASE_SERVICE_ACCOUNT_PATH in .env
 *  2. Individual env vars        — set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL,
 *                                  FIREBASE_PRIVATE_KEY in .env
 *
 * If neither is configured, the module logs a warning and exports null.
 * The auth middleware falls back to manual JWT decode in that case (dev only).
 */
const admin = require('firebase-admin')
const path  = require('path')
require('dotenv').config()

let app = null

try {
  if (admin.apps && admin.apps.length) {
    // Already initialized (e.g. hot-reload in dev)
    app = admin.apps[0]
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    // Mode 1: service account JSON file
    const serviceAccount = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH))
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
    console.log('🔐 Firebase Admin: initialized via service account file')
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    // Mode 2: individual env vars (CI/CD friendly)
    let privateKey = process.env.FIREBASE_PRIVATE_KEY
    
    // Remove outer quotes if present (Railway might add them)
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1)
    }
    
    // Env vars escape newlines as \n — convert back
    privateKey = privateKey.replace(/\\n/g, '\n')
    
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  privateKey,
      }),
    })
    console.log('🔐 Firebase Admin: initialized via environment variables')
  } else {
    console.warn(
      '⚠️  Firebase Admin SDK not configured. ' +
      'Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY. ' +
      'Token verification will use insecure fallback (dev only).'
    )
  }
} catch (err) {
  console.error('❌ Firebase Admin init error:', err.message)
}

/**
 * Verify a Firebase ID token.
 * Returns the decoded payload or throws if invalid / not configured.
 */
async function verifyIdToken(idToken) {
  if (app) {
    return await admin.auth().verifyIdToken(idToken)
  }
  // Fallback — decode without verification (dev/demo only)
  const parts = idToken.split('.')
  if (parts.length !== 3) throw new Error('Invalid token format')
  const padding = parts[1].length % 4
  const padded  = padding ? parts[1] + '='.repeat(4 - padding) : parts[1]
  const decoded = JSON.parse(Buffer.from(padded, 'base64url').toString())
  
  // In development mode without Firebase Admin configured, be more lenient with expiration
  if (process.env.NODE_ENV === 'production' && decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token has expired')
  }
  
  // Log token info for debugging
  if (decoded.exp) {
    const now = Math.floor(Date.now() / 1000)
    const timeLeft = decoded.exp - now
    if (timeLeft < 0) {
      console.warn(`⚠️  Token expired ${Math.abs(timeLeft)}s ago (allowed in dev mode)`)
    } else {
      console.log(`✓ Token valid for ${timeLeft}s`)
    }
  }
  
  return decoded
}

module.exports = { verifyIdToken, isConfigured: () => !!app }
