const Database = require('better-sqlite3')
const bcrypt   = require('bcryptjs')
const crypto   = require('crypto')
const path     = require('path')

const db = new Database(path.join(__dirname, '../automedic.db'))
// Disable FK checks during seeding to avoid order issues
db.pragma('foreign_keys = OFF')
db.pragma('journal_mode = WAL')

const uid  = () => crypto.randomBytes(16).toString('hex')
const hash = bcrypt.hashSync('automedic2024', 12)

console.log('🌱 Seeding database...')

// USERS
const insUser = db.prepare('INSERT OR IGNORE INTO users (id,name,email,phone,password_hash,role) VALUES (?,?,?,?,?,?)')
const users = [
  { id:uid(), name:'Admin User',    email:'admin@automedic.mw',   phone:'+265 999 000 000', role:'admin' },
  { id:uid(), name:'Peter Nkosi',   email:'peter@automedic.mw',   phone:'+265 999 001 001', role:'technician' },
  { id:uid(), name:'Charles Banda', email:'charles@automedic.mw', phone:'+265 999 001 002', role:'technician' },
  { id:uid(), name:'Eric Phiri',    email:'eric@automedic.mw',    phone:'+265 999 001 003', role:'technician' },
  { id:uid(), name:'John Banda',    email:'john@example.com',     phone:'+265 999 002 001', role:'customer' },
]
users.forEach(u => insUser.run(u.id, u.name, u.email, u.phone, hash, u.role))
console.log('✅ Users seeded')

// SERVICES
const insService = db.prepare('INSERT OR IGNORE INTO services (id,name,description,category,base_price,duration_hours) VALUES (?,?,?,?,?,?)')
const services = [
  ['Car Wash',                 'Standard exterior car wash',                             'wash',        1500, 0.5],
  ['Premium Wash',             'Full exterior & interior premium wash with vacuum',       'wash',        5000, 1.5],
  ['Engine Wash',              'Professional engine bay cleaning',                       'wash',        8000, 1.0],
  ['Body Wash',                'Complete body wash with wax finish',                     'wash',        3000, 1.0],
  ['Chassis Lubrication',      'Full chassis lubrication & propeller shaft greasing',    'maintenance', 4000, 1.0],
  ['Tyre Pressure Check',      'Check and adjust tyre pressure on all 4 tyres',          'tyres',        500, 0.25],
  ['Wheel Balancing',          'Professional wheel balancing on all 4 wheels',           'tyres',       6000, 1.0],
  ['Tyre Rotation',            'Rotate tyres to ensure even wear',                       'tyres',       3000, 0.5],
  ['Suspension Overhaul',      'Complete suspension system overhaul and replacement',    'mechanical', 35000, 5.0],
  ['Exhaust Replacement',      'Exhaust system inspection and replacement',               'mechanical', 18000, 3.0],
  ['Car Polishing',            'Machine polishing to restore paint shine',               'detailing',  12000, 3.0],
  ['Brake System Maintenance', 'Full brake system maintenance and repair',               'mechanical', 12000, 3.0],
  ['Electrical Repairs',       'Diagnosis and repair of all electrical faults',          'electrical',  8000, 2.0],
  ['General Diagnostic',       'Full vehicle electronic diagnostic scan',                'diagnostic',  7000, 1.5],
  ['Window Tinting',           'Professional window tinting — all windows',              'detailing',  15000, 4.0],
  ['Upholstery Repair',        'Seat and interior upholstery repair',                    'interior',   10000, 3.0],
  ['Upholstery Replacement',   'Complete interior upholstery replacement',               'interior',   45000, 8.0],
  ['Oil Change',               'Engine oil and filter change using premium oil',         'maintenance', 5000, 1.0],
  ['Engine Repair',            'Complete engine diagnostics and repair',                 'mechanical', 25000, 24.0],
  ['Battery Replacement',      'Battery testing and replacement',                        'electrical', 15000, 0.5],
  ['Air Conditioning Service', 'AC regas, leak detection and full service',              'mechanical', 10000, 2.0],
  ['Wheel Alignment',          'Precision 4-wheel alignment and balancing',              'tyres',       8000, 1.5],
]
services.forEach(([n,d,c,p,h]) => insService.run(uid(), n, d, c, p, h))
console.log(`✅ Services seeded (${services.length})`)

// PRODUCTS
const insProd = db.prepare('INSERT OR IGNORE INTO products (id,name,description,category,price,stock_quantity) VALUES (?,?,?,?,?,?)')
const products = [
  ['Bridgestone Tyres 185/65R15',  'All-season performance tyre',                'tyres',     45000, 20],
  ['Michelin SUV 265/65R17',       'All-terrain tyre for SUVs and 4x4',          'tyres',     78000,  5],
  ['Exide 60Ah Car Battery',       'Maintenance-free battery, 24-month warranty','batteries', 95000, 10],
  ['Castrol EDGE 5W-30 4L',        'Full synthetic engine oil',                  'oils',      28000, 30],
  ['Shell Helix HX7 10W-40 4L',   'Semi-synthetic engine oil',                  'oils',      20000, 25],
  ['Mann Oil Filter Toyota/Nissan','OEM-quality oil filter',                     'filters',    4500, 40],
  ['Brembo Brake Pads Front Set',  'High-performance ceramic brake pads',        'brakes',    18000, 15],
  ['NGK Spark Plugs Set of 4',     'Premium iridium spark plugs',                'parts',     12000, 25],
  ['Gates Timing Belt Kit',        'Complete timing belt kit with tensioner',    'parts',     35000,  8],
]
products.forEach(([n,d,c,p,q]) => insProd.run(uid(), n, d, c, p, q))
console.log('✅ Products seeded')

// Re-enable FK
db.pragma('foreign_keys = ON')

console.log('')
console.log('🎉 Database ready!')
console.log('   Admin:      admin@automedic.mw / automedic2024')
console.log('   Technician: peter@automedic.mw / automedic2024')
console.log('   Customer:   john@example.com / automedic2024')
process.exit(0)
