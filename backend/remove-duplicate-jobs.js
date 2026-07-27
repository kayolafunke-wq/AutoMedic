require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

async function removeDuplicates() {
  try {
    console.log('🔍 Finding duplicate job cards for BFK toyota vitz...\n')
    
    // Find all job cards for BFK's toyota vitz (registration JK 2345)
    const jobs = await pool.query(`
      SELECT jc.id, jc.appointment_id, jc.status, jc.created_at,
             a.tracking_number,
             u.name as customer_name,
             v.make, v.model, v.registration_number
      FROM job_cards jc
      LEFT JOIN appointments a ON jc.appointment_id = a.id
      LEFT JOIN users u ON a.customer_id = u.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      WHERE v.registration_number = 'JK 2345'
      ORDER BY jc.created_at ASC
    `)
    
    if (jobs.rows.length === 0) {
      console.log('❌ No job cards found for JK 2345')
      await pool.end()
      return
    }
    
    console.log(`📋 Found ${jobs.rows.length} job card(s) for JK 2345:`)
    console.table(jobs.rows)
    
    if (jobs.rows.length > 1) {
      // Keep the oldest one, delete the newer duplicates
      const keepJob = jobs.rows[0]
      const deleteJobs = jobs.rows.slice(1)
      
      console.log(`\n✅ Keeping job card: ${keepJob.id} (created: ${keepJob.created_at})`)
      console.log(`❌ Deleting ${deleteJobs.length} duplicate(s):\n`)
      
      for (const job of deleteJobs) {
        console.log(`   Deleting job card: ${job.id} (created: ${job.created_at})`)
        
        // Delete associated repair updates
        await pool.query('DELETE FROM repair_updates WHERE job_card_id = $1', [job.id])
        
        // Delete the job card
        await pool.query('DELETE FROM job_cards WHERE id = $1', [job.id])
        
        console.log(`   ✓ Deleted job card ${job.id}`)
      }
      
      console.log('\n✅ Cleanup complete!')
    } else {
      console.log('\n✅ No duplicates found - only 1 job card exists')
    }
    
    // Show final state
    const final = await pool.query(`
      SELECT jc.id, jc.appointment_id, jc.status,
             a.tracking_number,
             u.name as customer_name,
             v.make, v.model, v.registration_number
      FROM job_cards jc
      LEFT JOIN appointments a ON jc.appointment_id = a.id
      LEFT JOIN users u ON a.customer_id = u.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      WHERE v.registration_number = 'JK 2345'
    `)
    
    console.log('\n📋 Final job cards for JK 2345:')
    console.table(final.rows)
    
    await pool.end()
  } catch (err) {
    console.error('❌ Error:', err.message)
    await pool.end()
  }
}

removeDuplicates()
