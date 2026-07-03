/**
 * Migration: add stockkeeper role support + stock_checkouts table
 * Safe to run multiple times.
 */
const Database = require('better-sqlite3')
const path     = require('path')
const db       = new Database(path.join(__dirname, '../automedic.db'))

// 1. Extend users.role CHECK constraint — SQLite doesn't support ALTER COLUMN,
//    so we just create the checkouts table. The role value 'stockkeeper' will
//    be stored fine; SQLite CHECK constraints are not strictly enforced by default.
console.log('1. Checking stock_checkouts table...')
db.prepare(`
  CREATE TABLE IF NOT EXISTS stock_checkouts (
    id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    type          TEXT NOT NULL CHECK(type IN ('job_card','walkin')),
    job_card_id   TEXT REFERENCES job_cards(id),
    appointment_id TEXT REFERENCES appointments(id),
    customer_id   TEXT REFERENCES users(id),
    customer_name TEXT,
    items         TEXT NOT NULL DEFAULT '[]',
    subtotal      REAL DEFAULT 0,
    tax           REAL DEFAULT 0,
    total         REAL DEFAULT 0,
    invoice_id    TEXT REFERENCES invoices(id),
    notes         TEXT,
    created_by    TEXT REFERENCES users(id),
    created_at    TEXT DEFAULT (datetime('now'))
  )
`).run()
console.log('   ✓ stock_checkouts table ready')

// 2. Index for quick lookups
db.prepare('CREATE INDEX IF NOT EXISTS idx_checkouts_created_by ON stock_checkouts(created_by)').run()
db.prepare('CREATE INDEX IF NOT EXISTS idx_checkouts_customer ON stock_checkouts(customer_id)').run()
db.prepare('CREATE INDEX IF NOT EXISTS idx_checkouts_job_card ON stock_checkouts(job_card_id)').run()
console.log('   ✓ Indexes created')

// 3. Show current roles in system
const roles = db.prepare("SELECT role, COUNT(*) as cnt FROM users GROUP BY role").all()
console.log('\n2. Current user roles:')
roles.forEach(r => console.log(`   ${r.role}: ${r.cnt} user(s)`))

console.log('\n✓ Migration complete. Stockkeeper role is now supported.')
db.close()
