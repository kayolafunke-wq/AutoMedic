const db = require('../config/db')

const migrate = async () => {
  console.log('🔄 Adding image_url field to services table...')
  try {
    // Add image_url column to services table
    await db.query('ALTER TABLE services ADD COLUMN image_url TEXT')
    console.log('✅ Successfully added image_url field to services table')
  } catch (err) {
    if (err.message.includes('duplicate column')) {
      console.log('ℹ️  image_url column already exists in services table')
    } else {
      console.error('❌ Error:', err.message)
      process.exit(1)
    }
  } finally {
    process.exit(0)
  }
}

migrate()