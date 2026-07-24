/**
 * Quick check of Firebase environment variables in Railway
 */

console.log('\n🔍 Firebase Environment Variables Check\n')
console.log('=' .repeat(60))

const vars = {
  'FIREBASE_PROJECT_ID': process.env.FIREBASE_PROJECT_ID,
  'FIREBASE_CLIENT_EMAIL': process.env.FIREBASE_CLIENT_EMAIL,
  'FIREBASE_PRIVATE_KEY': process.env.FIREBASE_PRIVATE_KEY
}

let allSet = true

for (const [key, value] of Object.entries(vars)) {
  if (value) {
    console.log(`✅ ${key}: SET`)
    if (key === 'FIREBASE_PRIVATE_KEY') {
      console.log(`   Length: ${value.length} chars`)
      console.log(`   Starts: ${value.substring(0, 30)}...`)
      console.log(`   Has quotes: ${value.startsWith('"') ? 'YES' : 'NO'}`)
    } else {
      console.log(`   Value: ${value}`)
    }
  } else {
    console.log(`❌ ${key}: NOT SET`)
    allSet = false
  }
}

console.log('=' .repeat(60))

if (allSet) {
  console.log('\n✅ All Firebase variables are set!\n')
  console.log('Now testing Firebase Admin initialization...\n')
  
  try {
    const { isConfigured } = require('./config/firebase-admin')
    if (isConfigured()) {
      console.log('🎉 Firebase Admin SDK is configured and ready!')
      console.log('   Google Sign-In should work via /api/auth/firebase-sync\n')
    } else {
      console.log('❌ Firebase Admin SDK failed to initialize')
      console.log('   Check the startup logs for errors\n')
    }
  } catch (err) {
    console.error('❌ Error checking Firebase Admin:', err.message, '\n')
  }
} else {
  console.log('\n❌ Some Firebase variables are missing!')
  console.log('   Set them in Railway Dashboard → Backend → Variables\n')
}
