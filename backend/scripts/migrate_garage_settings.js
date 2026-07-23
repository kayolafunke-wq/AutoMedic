const Database = require('better-sqlite3')
const path = require('path')

// Connect to database
const dbPath = path.resolve(__dirname, '../automedic.db')
const db = new Database(dbPath)

console.log('🗄️  Creating garage_settings table...')

try {
  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Create garage_settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS garage_settings (
      id            INTEGER PRIMARY KEY DEFAULT 1,
      garage_name   TEXT NOT NULL DEFAULT 'AutoMedic Garage',
      phone         TEXT DEFAULT '+265 999 000 000',
      address       TEXT DEFAULT 'Area 47, Lilongwe, Malawi',
      whatsapp      TEXT DEFAULT '+265999000000',
      working_hours TEXT DEFAULT 'Mon–Sat: 7am – 6pm',
      email         TEXT DEFAULT 'info@automedic.mw',
      vat_rate      REAL DEFAULT 16.5,
      currency      TEXT DEFAULT 'MK',
      created_at    TEXT DEFAULT (datetime('now')),
      updated_at    TEXT DEFAULT (datetime('now'))
    )
  `)

  // Insert default settings if table is empty
  const existing = db.prepare('SELECT COUNT(*) as count FROM garage_settings').get()
  
  if (existing.count === 0) {
    console.log('📝 Inserting default garage settings...')
    
    db.prepare(`
      INSERT INTO garage_settings (
        garage_name, phone, address, whatsapp, working_hours, email, vat_rate, currency
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'AutoMedic Garage',
      '+265 999 000 000',
      'Area 47, Lilongwe, Malawi',
      '+265999000000',
      'Mon–Sat: 7am – 6pm',
      'info@automedic.mw',
      16.5,
      'MK'
    )
    
    console.log('✅ Default settings inserted')
  } else {
    console.log('ℹ️  Garage settings table already contains data')
  }

  console.log('✅ garage_settings table migration completed')

} catch (error) {
  console.error('❌ Migration failed:', error)
  process.exit(1)
} finally {
  db.close()
}