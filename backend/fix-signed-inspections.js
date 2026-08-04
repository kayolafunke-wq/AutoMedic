const db = require('./config/db')

async function fixSignedInspections() {
  console.log('=== FIXING SIGNED INSPECTIONS ===')
  console.log('Setting customer_signed_at for inspections with status=customer_signed but missing timestamp...\n')

  try {
    // Find inspections that are signed but missing customer_signed_at
    const result = await db.query(`
      SELECT id, reference_number, status, customer_signed_at, updated_at, created_at
      FROM inspections 
      WHERE status = 'customer_signed' 
      AND customer_signed_at IS NULL
    `)

    if (result.rows.length === 0) {
      console.log('✅ No inspections need fixing - all signed inspections have timestamps!')
      process.exit(0)
    }

    console.log(`Found ${result.rows.length} inspections that need fixing:\n`)
    result.rows.forEach(row => {
      console.log(`  - ${row.reference_number} (ID: ${row.id})`)
      console.log(`    Status: ${row.status}, customer_signed_at: ${row.customer_signed_at}`)
      console.log(`    Will use updated_at: ${row.updated_at}\n`)
    })

    // Update them to use updated_at as customer_signed_at
    const updateResult = await db.query(`
      UPDATE inspections 
      SET customer_signed_at = updated_at
      WHERE status = 'customer_signed' 
      AND customer_signed_at IS NULL
    `)

    console.log(`✅ Fixed ${updateResult.rowCount} inspections!`)
    console.log('\n=== VERIFICATION ===')

    // Verify the fix
    const verify = await db.query(`
      SELECT id, reference_number, status, customer_signed_at
      FROM inspections 
      WHERE status = 'customer_signed'
    `)

    console.log(`All customer_signed inspections now have timestamps:\n`)
    verify.rows.forEach(row => {
      console.log(`  ✓ ${row.reference_number}: ${row.customer_signed_at}`)
    })

    console.log('\n=== FIX COMPLETE ===')
    console.log('Customers can now view their signed inspection reports!')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error fixing inspections:', error)
    process.exit(1)
  }
}

fixSignedInspections()
