require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function checkDuplicates() {
  try {
    console.log('🔍 Checking for duplicate job cards for BFK...\n')
    
    // Check job cards
    const jobs = await pool.query(`
      SELECT jc.id, jc.appointment_id, jc.status, jc.created_at,
             a.tracking_number, a.customer_id,
             u.name as customer_name,
             v.make, v.model, v.registration_number
      FROM job_cards jc
      LEFT JOIN appointments a ON jc.appointment_id = a.id
      LEFT JOIN users u ON a.customer_id = u.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      WHERE u.name ILIKE '%BFK%' OR v.registration_number ILIKE '%2345%'
      ORDER BY jc.created_at DESC
    `)
    
    console.log('📋 Job cards for BFK:')
    console.table(jobs.rows)
    
    // Check appointments
    const appts = await pool.query(`
      SELECT a.id, a.tracking_number, a.status, a.created_at,
             u.name as customer_name,
             v.make, v.model, v.registration_number
      FROM appointments a
      LEFT JOIN users u ON a.customer_id = u.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      WHERE u.name ILIKE '%BFK%' OR v.registration_number ILIKE '%2345%'
      ORDER BY a.created_at DESC
    `)
    
    console.log('\n📅 Appointments for BFK:')
    console.table(appts.rows)
    
    await pool.end()
  } catch (err) {
    console.error('❌ Error:', err.message)
    await pool.end()
  }
}

checkDuplicates()
