/**
 * Fix backfill inventory log timestamps so they sort correctly.
 * Assigns each log the timestamp of its source record.
 */
const Database = require('better-sqlite3')
const path     = require('path')
const db       = new Database(path.join(__dirname, '../automedic.db'))

// 1. Give initial stock_in logs the product's created_at
const r1 = db.prepare(`
  UPDATE inventory_logs
  SET created_at = (
    SELECT p.created_at FROM products p WHERE p.id = inventory_logs.product_id
  )
  WHERE reason = 'Initial stock (backfill)'
`).run()
console.log(`✓ Fixed ${r1.changes} initial stock_in timestamps`)

// 2. Give stock_out backfill logs the checkout's created_at
const r2 = db.prepare(`
  UPDATE inventory_logs
  SET created_at = (
    SELECT sc.created_at FROM stock_checkouts sc WHERE sc.id = inventory_logs.reference
  )
  WHERE reason = 'Stock out — checkout (backfill)'
  AND reference IS NOT NULL
`).run()
console.log(`✓ Fixed ${r2.changes} stock_out backfill timestamps`)

// 3. Show the latest 8 logs to confirm ordering
const rows = db.prepare(`
  SELECT il.type, il.qty_change, il.reason, il.created_at, p.name as product
  FROM inventory_logs il
  LEFT JOIN products p ON il.product_id = p.id
  ORDER BY il.created_at DESC
  LIMIT 8
`).all()
console.log('\nLatest 8 logs (newest first):')
rows.forEach(r => console.log(`  [${r.created_at}] ${r.type.padEnd(10)} ${r.product} (${r.qty_change > 0 ? '+' : ''}${r.qty_change})`))

console.log('\n✓ Done.')
db.close()
