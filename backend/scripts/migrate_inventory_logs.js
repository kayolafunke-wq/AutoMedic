/**
 * Migration: create inventory_logs table for stock-in / stock-out tracking.
 * Safe to run multiple times.
 */
const Database = require('better-sqlite3')
const path     = require('path')
const db       = new Database(path.join(__dirname, '../automedic.db'))

db.pragma('foreign_keys = ON')

db.prepare(`
  CREATE TABLE IF NOT EXISTS inventory_logs (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type        TEXT NOT NULL CHECK(type IN ('stock_in','stock_out','adjustment')),
    qty_change  INTEGER NOT NULL,
    qty_before  INTEGER NOT NULL,
    qty_after   INTEGER NOT NULL,
    reason      TEXT,
    reference   TEXT,
    created_by  TEXT REFERENCES users(id),
    created_at  TEXT DEFAULT (datetime('now'))
  )
`).run()
console.log('✓ inventory_logs table ready')

db.prepare('CREATE INDEX IF NOT EXISTS idx_inv_logs_product ON inventory_logs(product_id)').run()
db.prepare('CREATE INDEX IF NOT EXISTS idx_inv_logs_type    ON inventory_logs(type)').run()
db.prepare('CREATE INDEX IF NOT EXISTS idx_inv_logs_date    ON inventory_logs(created_at)').run()
console.log('✓ indexes created')

// Backfill: create stock_in log for every existing product that has stock
const products = db.prepare('SELECT id, name, stock_quantity FROM products WHERE stock_quantity > 0').all()
const insert   = db.prepare(`
  INSERT OR IGNORE INTO inventory_logs (id, product_id, type, qty_change, qty_before, qty_after, reason, created_at)
  VALUES (lower(hex(randomblob(16))), ?, 'stock_in', ?, 0, ?, 'Initial stock (backfill)', datetime('now'))
`)
let backfilled = 0
for (const p of products) {
  insert.run(p.id, p.stock_quantity, p.stock_quantity)
  backfilled++
}
console.log(`✓ backfilled ${backfilled} product(s) with initial stock_in log`)

// Backfill stock_out logs from existing stock_checkouts
const checkouts = db.prepare('SELECT id, items, created_by, created_at FROM stock_checkouts').all()
const insertOut = db.prepare(`
  INSERT OR IGNORE INTO inventory_logs (id, product_id, type, qty_change, qty_before, qty_after, reason, reference, created_by, created_at)
  VALUES (lower(hex(randomblob(16))), ?, 'stock_out', ?, 0, 0, ?, ?, ?, ?)
`)
let outBackfilled = 0
for (const co of checkouts) {
  let items = []
  try { items = JSON.parse(co.items || '[]') } catch { continue }
  for (const item of items) {
    if (!item.product_id || !item.qty) continue
    insertOut.run(
      item.product_id,
      -Math.abs(Number(item.qty)),
      `Stock out — checkout (backfill)`,
      co.id,
      co.created_by,
      co.created_at
    )
    outBackfilled++
  }
}
console.log(`✓ backfilled ${outBackfilled} stock_out log(s) from existing checkouts`)
console.log('\n✓ Migration complete.')
db.close()
