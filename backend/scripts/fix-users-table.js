/**
 * Fix users table - add missing columns
 * Run this in Railway console: npm run db:fix-users
 */

require('dotenv').config()
const db = require('../config/db')

async function fixUsersTable() {
  try {
    console.log('\n🔧 Fixing users table schema...\n')

    // Add last_login column if missing
    try {
      await db.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS last_login TIMESTAMP
      `)
      console.log('✅ Added last_login column')
    } catch (err) {
      console.log('⚠️  last_login column may already exist:', err.message)
    }

    // Add avatar_url column if missing
    try {
      await db.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS avatar_url TEXT
      `)
      console.log('✅ Added avatar_url column')
    } catch (err) {
      console.log('⚠️  avatar_url column may already exist:', err.message)
    }

    // Check if profile_image_url exists and rename it to avatar_url
    try {
      const checkCol = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='profile_image_url'
      `)
      
      if (checkCol.rows.length > 0) {
        // Copy data from profile_image_url to avatar_url
        await db.query(`
          UPDATE users 
          SET avatar_url = profile_image_url 
          WHERE profile_image_url IS NOT NULL AND avatar_url IS NULL
        `)
        console.log('✅ Migrated profile_image_url data to avatar_url')
        
        // Drop old column
        await db.query(`
          ALTER TABLE users 
          DROP COLUMN IF EXISTS profile_image_url
        `)
        console.log('✅ Removed old profile_image_url column')
      }
    } catch (err) {
      console.log('ℹ️  profile_image_url migration:', err.message)
    }

    // Verify the columns exist now
    console.log('\n📋 Verifying users table structure...')
    const result = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `)
    
    console.log('\nUsers table columns:')
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name.padEnd(20)} | ${row.data_type}`)
    })

    // Check for required columns
    const columnNames = result.rows.map(r => r.column_name)
    const requiredColumns = ['id', 'name', 'email', 'password_hash', 'role', 'last_login', 'avatar_url', 'google_id', 'is_active']
    const missing = requiredColumns.filter(col => !columnNames.includes(col))
    
    if (missing.length > 0) {
      console.log('\n⚠️  Still missing columns:', missing.join(', '))
      console.log('   You may need to run the full migration first.')
    } else {
      console.log('\n✅ All required columns are present!')
    }

    console.log('\n🎉 Users table fix complete!\n')
    process.exit(0)
    
  } catch (error) {
    console.error('\n❌ Error fixing users table:', error.message)
    console.error(error)
    process.exit(1)
  }
}

fixUsersTable()
