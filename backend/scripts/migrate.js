const Database = require('better-sqlite3')
const fs       = require('fs')
const path     = require('path')

const dbPath = path.join(__dirname, '../automedic.db')
const db     = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

try {
  const schema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8')
  // Execute each statement separately
  const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'))
  statements.forEach(stmt => {
    try { db.prepare(stmt).run() } catch (e) { /* ignore already exists */ }
  })
  console.log('✅ Migration complete — automedic.db created')
  process.exit(0)
} catch (err) {
  console.error('❌ Migration failed:', err.message)
  process.exit(1)
}
