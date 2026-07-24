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
  
  // Try to parse and show the actual key after processing
  console.log('\n    Attempting to process the key...')
  try {
    // Remove outer quotes if present
    let processedKey = key
    if (processedKey.startsWith('"') && processedKey.endsWith('"')) {
      processedKey = processedKey.slice(1, -1)
      console.log(`    ✓ Removed outer quotes`)
    }
    
    // Replace \\n with actual newlines
    processedKey = processedKey.replace(/\\n/g, '\n')
    console.log(`    ✓ Converted \\n to newlines`)
    console.log(`    ✓ Processed key length: ${processedKey.length}`)
    console.log(`    ✓ Processed key starts with: ${processedKey.substring(0, 30)}`)
    console.log(`    ✓ First line: ${processedKey.split('\n')[0]}`)
    console.log(`    ✓ Last line: ${processedKey.split('\n').pop()}`)
  } catch (err) {
    console.log(`    ✗ Error processing: ${err.message}`)
  }
}

console.log('\n' + '='.repeat(60) + '\n')

if (hasProjectId && hasClientEmail && hasPrivateKey) {
  console.log('✅ All required variables are set!')
  console.log('\nTrying to initialize Firebase Admin SDK...\n')
  
  try {
    // Check if firebase-admin is installed
    let admin
    try {
      admin = require('firebase-admin')
      console.log('✓ firebase-admin module loaded')
      console.log(`  Version: ${require('firebase-admin/package.json').version}`)
    } catch (reqError) {
      console.error('❌ Failed to load firebase-admin module')
      console.error(`   Error: ${reqError.message}`)
      console.log('\n💡 Run: npm install firebase-admin@13.0.0')
      process.exit(1)
    }
    
    // Check if admin.credential exists
    if (!admin.credential) {
      console.error('❌ admin.credential is undefined!')
      console.error('   This usually means firebase-admin is not installed correctly.')
      console.log('\n💡 Try:')
      console.log('   1. npm uninstall firebase-admin')
      console.log('   2. npm install firebase-admin@13.0.0')
      process.exit(1)
    }
    
    if (admin.apps && admin.apps.length) {
      console.log('✅ Firebase Admin already initialized')
    } else {
      // Parse the private key - remove outer quotes and handle \n
      let privateKey = process.env.FIREBASE_PRIVATE_KEY
      
      // Remove outer quotes if present
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1)
      }
      
      // Replace \\n with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n')
      
      console.log('Initializing with:')
      console.log(`  Project ID: ${process.env.FIREBASE_PROJECT_ID}`)
      console.log(`  Client Email: ${process.env.FIREBASE_CLIENT_EMAIL}`)
      console.log(`  Private Key (first 50 chars): ${privateKey.substring(0, 50)}...`)
      
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
    console.error(`   Stack: ${error.stack}`)
    
    if (error.message.includes('private_key') || error.message.includes('DECODER')) {
      console.log('\n💡 HINT: The FIREBASE_PRIVATE_KEY format is wrong.')
      console.log('   The key should be a valid RSA private key.')
      console.log('   Make sure you copied the ENTIRE private_key value from the JSON file.')
      console.log('   Including: "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"')
    }
  }
} else {
  console.log('❌ Some variables are missing!')
  console.log('\nTo fix:')
  console.log('1. Go to Railway Dashboard → Backend Service → Variables')
  console.log('2. Make sure all 3 variables are set correctly')
}

console.log('\n')
