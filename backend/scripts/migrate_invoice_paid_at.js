/**
 * Migration: add paid_at and updated_at columns to invoices table
 * Safe to run multiple times — checks if column exists first.
 */
const Database = require('better-sqlite3')
const path     = require('path')

const db = new Database(path.join(__dirname, '../automedic.db'))

function columnExists(table, col) {
  const info = db.prepare(`PRAGMA table_info(${table})`).all()
  return info.some(c => c.name === col)
}

if (!columnExists('invoices', 'paid_at')) {
  db.prepare('ALTER TABLE invoices ADD COLUMN paid_at TEXT').run()
  console.log('✓ Added paid_at column to invoices')
} else {
  console.log('  paid_at already exists')
}

if (!columnExists('invoices', 'updated_at')) {
  db.prepare('ALTER TABLE invoices ADD COLUMN updated_at TEXT').run()
  console.log('✓ Added updated_at column to invoices')
} else {
  console.log('  updated_at already exists')
}

// Backfill: for invoices already marked 'paid', set paid_at = created_at as a safe default
const updated = db.prepare(
  "UPDATE invoices SET paid_at = created_at WHERE status = 'paid' AND paid_at IS NULL"
).run()
console.log(`✓ Backfilled paid_at for ${updated.changes} existing paid invoice(s)`)

// Show current invoices
const rows = db.prepare('SELECT invoice_number, status, total, paid_at, created_at FROM invoices').all()
console.log('\nInvoices after migration:')
console.table(rows)

db.close()
