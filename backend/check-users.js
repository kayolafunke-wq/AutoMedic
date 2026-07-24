// Quick diagnostic script to check if users exist in database
require('dotenv').config()
const db = require('./config/db')

async function checkUsers() {
  try {
    console.log('\n🔍 Checking database users...\n')
    
    // Check if users table exists
    const result = await db.query('SELECT email, role, is_active, password_hash IS NOT NULL as has_password FROM users ORDER BY role')
    
    if (result.rows.length === 0) {
      console.log('❌ No users found in database!')
      console.log('   Run: npm run db:seed:postgres')
    } else {
      console.log(`✅ Found ${result.rows.length} users:\n`)
      result.rows.forEach(user => {
        console.log(`  ${user.email.padEnd(35)} | ${user.role.padEnd(12)} | Active: ${user.is_active} | Password: ${user.has_password ? 'Yes' : 'No'}`)
      })
      
      // Check specific admin user
      console.log('\n🔍 Checking admin@automedic.mw specifically:')
      const adminResult = await db.query('SELECT * FROM users WHERE email = $1', ['admin@automedic.mw'])
      if (adminResult.rows.length > 0) {
        const admin = adminResult.rows[0]
        console.log(`  ✅ Found: ${admin.email}`)
        console.log(`  Role: ${admin.role}`)
        console.log(`  Active: ${admin.is_active}`)
        console.log(`  Has password: ${admin.password_hash ? 'Yes' : 'No'}`)
        console.log(`  Password hash length: ${admin.password_hash ? admin.password_hash.length : 0}`)
      } else {
        console.log('  ❌ admin@automedic.mw NOT FOUND!')
      }
    }
    
    console.log('\n✅ Check complete!')
    process.exit(0)
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error(error)
    process.exit(1)
  }
}

checkUsers()
