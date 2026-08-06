/**
 * Migration: Add missing job_cards columns
 * 
 * These columns were being added via ALTER TABLE on EVERY progress update
 * (lines 45-50 in jobcard.routes.js), causing 3-5 second delays.
 * 
 * Run this ONCE on Railway, then remove those ALTER TABLE lines from the route.
 */

const db = require('./config/db')

async function addJobCardColumns() {
  console.log('=== ADDING JOB CARD COLUMNS ===\n')

  const columns = [
    { name: 'technician_notes', type: 'TEXT' },
    { name: 'parts_used', type: 'TEXT DEFAULT \'[]\'', check: () => true },
    { name: 'estimated_cost', type: 'NUMERIC' },
    { name: 'final_cost', type: 'NUMERIC' },
    { name: 'started_at', type: 'TIMESTAMP' },
    { name: 'completed_at', type: 'TIMESTAMP' }
  ]

  for (const col of columns) {
    try {
      console.log(`Checking column: ${col.name}...`)
      
      // Check if column exists
      const check = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='job_cards' AND column_name=$1
      `, [col.name])

      if (check.rows.length > 0) {
        console.log(`✓ Column ${col.name} already exists`)
      } else {
        console.log(`Adding column ${col.name}...`)
        await db.query(`ALTER TABLE job_cards ADD COLUMN ${col.name} ${col.type}`)
        console.log(`✅ Added column ${col.name}`)
      }
    } catch (err) {
      console.error(`❌ Error with column ${col.name}:`, err.message)
    }
  }

  // Verify all columns
  console.log('\n=== VERIFICATION ===')
  const finalCheck = await db.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name='job_cards' 
    AND column_name IN ('technician_notes', 'parts_used', 'estimated_cost', 'final_cost', 'started_at', 'completed_at')
    ORDER BY column_name
  `)

  if (finalCheck.rows.length === 6) {
    console.log('\n✅ All 6 columns exist:')
    finalCheck.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`)
    })
    console.log('\n✅ MIGRATION COMPLETE!')
    console.log('Now remove lines 45-50 from backend/routes/jobcard.routes.js')
  } else {
    console.log(`\n⚠️  Only ${finalCheck.rows.length}/6 columns found:`)
    finalCheck.rows.forEach(row => {
      console.log(`   - ${row.column_name}`)
    })
  }

  process.exit(0)
}

addJobCardColumns().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
