require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function checkSchema() {
  try {
    console.log('🔍 Checking inspections table schema...\n')
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'inspections'
      ORDER BY ordinal_position
    `)
    
    console.log('📋 Columns in inspections table:')
    console.table(result.rows)
    
    await pool.end()
  } catch (err) {
    console.error('❌ Error:', err.message)
    await pool.end()
  }
}

checkSchema()
