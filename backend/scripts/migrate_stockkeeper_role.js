/**
 * Migration: Add 'stockkeeper' to the users.role CHECK constraint.
 * SQLite does not support ALTER COLUMN, so we must recreate the table.
 * This migration is safe to run — it preserves all existing data.
 */
const Database = require('better-sqlite3')
const path     = require('path')
const db       = new Database(path.join(__dirname, '../automedic.db'))

console.log('Migrating users table to support stockkeeper role...\n')

// Disable foreign key enforcement for the duration of the migration
db.pragma('foreign_keys = OFF')

// Wrap everything in a transaction so it's atomic
const migrate = db.transaction(() => {
  // 1. Rename old table
  db.prepare('ALTER TABLE users RENAME TO users_old').run()
  console.log('  ✓ Renamed users → users_old')

  // 2. Create new table with updated CHECK constraint
  db.prepare(`
    CREATE TABLE users (
      id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name          TEXT NOT NULL,
      email         TEXT UNIQUE NOT NULL,
      phone         TEXT,
      password_hash TEXT,
      google_id     TEXT UNIQUE,
      avatar_url    TEXT,
      role          TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','technician','admin','stockkeeper')),
      is_active     INTEGER DEFAULT 1,
      last_login    TEXT,
      created_at    TEXT DEFAULT (datetime('now')),
      updated_at    TEXT DEFAULT (datetime('now'))
    )
  `).run()
  console.log('  ✓ Created new users table with stockkeeper role support')

  // 3. Copy all data from old table
  db.prepare(`
    INSERT INTO users
      (id, name, email, phone, password_hash, google_id, avatar_url, role, is_active, last_login, created_at, updated_at)
    SELECT
      id, name, email, phone, password_hash, google_id, avatar_url, role, is_active, last_login, created_at, updated_at
    FROM users_old
  `).run()
  console.log('  ✓ All existing user data copied')

  // 4. Drop the old table (safe — foreign key enforcement is OFF)
  db.prepare('DROP TABLE users_old').run()
  console.log('  ✓ Dropped users_old table')
})

migrate()

// Re-enable foreign key enforcement
db.pragma('foreign_keys = ON')

// Verify the new schema
const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get()
const hasStockkeeper = schema.sql.includes('stockkeeper')
console.log(`\n  ✓ Schema CHECK constraint includes stockkeeper: ${hasStockkeeper}`)

// Show current user roles
const roles = db.prepare("SELECT role, COUNT(*) as cnt FROM users GROUP BY role").all()
console.log('\nCurrent user roles in DB:')
roles.forEach(r => console.log(`  ${r.role}: ${r.cnt} user(s)`))

console.log('\n✓ Migration complete — stockkeeper role is now allowed in the users table.')
db.close()
