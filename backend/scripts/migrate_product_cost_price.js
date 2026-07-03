/**
 * Migration: add cost_price column to products table.
 * Also adds chassis_number (VIN) to vehicles if missing.
 * Safe to run multiple times.
 */
const Database = require('better-sqlite3')
const path     = require('path')
const db       = new Database(path.join(__dirname, '../automedic.db'))

console.log('Running migrations...\n')

// 1. Add cost_price to products
try {
  db.prepare('ALTER TABLE products ADD COLUMN cost_price REAL').run()
  console.log('✓ products.cost_price column added')
} catch (e) {
  if (e.message.includes('duplicate column')) console.log('✓ products.cost_price already exists')
  else console.warn('  products.cost_price:', e.message)
}

// 2. Ensure vehicles.chassis_number exists (VIN field — may already be there)
try {
  db.prepare('ALTER TABLE vehicles ADD COLUMN chassis_number TEXT').run()
  console.log('✓ vehicles.chassis_number column added')
} catch (e) {
  if (e.message.includes('duplicate column')) console.log('✓ vehicles.chassis_number already exists')
  else console.warn('  vehicles.chassis_number:', e.message)
}

console.log('\n✓ Migration complete.')
db.close()
