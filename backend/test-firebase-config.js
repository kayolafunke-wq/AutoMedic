/**
 * Test Firebase Admin SDK configuration
 * Run this in Railway console: node test-firebase-config.js
 */

require('dotenv').config()

console.log('\n🔍 Checking Firebase Admin SDK configuration...\n')

// Check if environment variables are set
const hasProjectId = !!process.env.FIREBASE_PROJECT_ID
const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL
const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY

console.log('Environment Variables:')
console.log(`  FIREBASE_PROJECT_ID: ${hasProjectId ? '✅ SET' : '❌ NOT SET'}`)
if (hasProjectId) console.log(`    Value: ${process.env.FIREBASE_PROJECT_ID}`)

console.log(`  FIREBASE_CLIENT_EMAIL: ${hasClientEmail ? '✅ SET' : '❌ NOT SET'}`)
if (hasClientEmail) console.log(`    Value: ${process.env.FIREBASE_CLIENT_EMAIL}`)

console.log(`  FIREBASE_PRIVATE_KEY: ${hasPrivateKey ? '✅ SET' : '❌ NOT SET'}`)
if (hasPrivateKey) {
  const key = process.env.FIREBASE_PRIVATE_KEY
  console.log(`    Length: ${key.length} characters`)
  console.log(`    Starts with: ${key.substring(0, 30)}...`)
  console.log(`    Has quotes: ${key.startsWith('"') ? '✅ YES' : '❌ NO (needs quotes!)'}`)
  console.log(`    Has \\n characters: ${key.includes('\\n') ? '✅ YES' : '❌ NO (needs \\n!)'}`)
  console.log(`    Ends with: ...${key.substring(key.length - 30)}`)
}

console.log('\n' + '='.repeat(60) + '\n')

if (hasProjectId && hasClientEmail && hasPrivateKey) {
  console.log('✅ All required variables are set!')
  console.log('\nTrying to initialize Firebase Admin SDK...\n')
  
  try {
    const admin = require('firebase-admin')
    
    if (admin.apps && admin.apps.length) {
      console.log('✅ Firebase Admin already initialized')
    } else {
      // Parse the private key (handle \n)
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      })
      
      console.log('✅ Firebase Admin SDK initialized successfully!')
      console.log('   Google Sign-In should now work!')
    }
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:')
    console.error(`   Error: ${error.message}`)
    
    if (error.message.includes('private_key')) {
      console.log('\n💡 HINT: The FIREBASE_PRIVATE_KEY format is wrong.')
      console.log('   Make sure it:')
      console.log('   1. Starts with a QUOTE: "-----BEGIN PRIVATE KEY-----')
      console.log('   2. Has \\n (backslash-n) NOT actual line breaks')
      console.log('   3. Ends with a QUOTE: -----END PRIVATE KEY-----\\n"')
    }
  }
} else {
  console.log('❌ Some variables are missing!')
  console.log('\nTo fix:')
  console.log('1. Go to Railway Dashboard → Backend Service → Variables')
  console.log('2. Make sure all 3 variables are set correctly')
}

console.log('\n')
