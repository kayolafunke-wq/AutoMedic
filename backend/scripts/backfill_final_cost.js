/**
 * One-time script: backfill final_cost on completed job cards
 * that have a linked invoice but no final_cost set.
 *
 * Priority:
 *   1. Use invoice.subtotal (pre-tax amount) as the base cost
 *   2. Fall back to estimated_cost
 */
const db = require('../config/db')

async function run() {
  // Find completed job cards with no final_cost
  const jobs = await db.query(`
    SELECT jc.id, jc.appointment_id, jc.estimated_cost, jc.final_cost
    FROM job_cards jc
    WHERE jc.status = 'completed' AND (jc.final_cost IS NULL OR jc.final_cost = 0)
  `)

  console.log(`Found ${jobs.rows.length} completed job(s) with no final_cost`)

  let updated = 0

  for (const job of jobs.rows) {
    // Try to get invoice total for this appointment
    const inv = await db.query(
      'SELECT subtotal, total FROM invoices WHERE appointment_id = ? LIMIT 1',
      [job.appointment_id]
    )

    let cost = null

    if (inv.rows.length && inv.rows[0].subtotal > 0) {
      cost = inv.rows[0].subtotal   // use pre-tax subtotal as the job cost
    } else if (job.estimated_cost) {
      cost = job.estimated_cost      // fall back to estimate
    }

    if (cost) {
      await db.query(
        'UPDATE job_cards SET final_cost = ? WHERE id = ?',
        [cost, job.id]
      )
      console.log(`  ✓ job ${job.id} → final_cost = ${cost} (from ${inv.rows.length ? 'invoice' : 'estimated_cost'})`)
      updated++
    } else {
      console.log(`  ⚠ job ${job.id} → no cost found, skipped`)
    }
  }

  console.log(`\nDone. Updated ${updated} job card(s).`)

  // Show result
  const check = await db.query(`
    SELECT id, status, estimated_cost, final_cost FROM job_cards WHERE status = 'completed'
  `)
  console.log('\nCompleted jobs after backfill:')
  console.table(check.rows)
}

run().catch(console.error)
