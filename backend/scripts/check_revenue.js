const db = require('../config/db')

async function run() {
  console.log('\n=== INVOICES (with paid_at) ===')
  const inv = await db.query('SELECT invoice_number, status, total, paid_at, updated_at, created_at FROM invoices')
  console.table(inv.rows)

  console.log('\n=== NEW REVENUE QUERY (paid invoices this month) ===')
  const dash = await db.query(`
    SELECT
      COALESCE(SUM(total), 0) AS monthly_revenue,
      COUNT(*) AS paid_invoices
    FROM invoices
    WHERE status = 'paid'
      AND strftime('%Y-%m', COALESCE(paid_at, updated_at, created_at)) = strftime('%Y-%m', 'now')
  `)
  console.table(dash.rows)

  console.log('\n=== NEW MONTHLY REVENUE BREAKDOWN (paid invoices) ===')
  const monthly = await db.query(`
    SELECT
      strftime('%Y-%m', COALESCE(paid_at, updated_at, created_at)) AS month,
      COALESCE(SUM(total), 0) AS total_revenue,
      COUNT(*) AS paid_invoices
    FROM invoices
    WHERE status = 'paid'
    GROUP BY month
    ORDER BY month DESC
  `)
  console.table(monthly.rows)

  console.log('\n=== UNPAID INVOICES (not counted as revenue) ===')
  const unpaid = await db.query("SELECT invoice_number, status, total FROM invoices WHERE status != 'paid'")
  console.table(unpaid.rows.length ? unpaid.rows : [{ result: 'none' }])
}

run().catch(console.error)
