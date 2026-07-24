const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const db = require('../../config/db')

const uid = () => crypto.randomBytes(16).toString('hex')
const hash = bcrypt.hashSync('automedic2024', 12)

async function seedAll() {
  try {
    console.log('\n🌱 Seeding AutoMedic PostgreSQL Database...\n')

    // ===== USERS =====
    console.log('👥 Seeding Users...')
    const users = [
      { id: uid(), name: 'Admin User', email: 'admin@automedic.mw', phone: '+265 999 000 000', role: 'admin' },
      { id: uid(), name: 'Peter Nkosi', email: 'peter@automedic.mw', phone: '+265 999 001 001', role: 'technician' },
      { id: uid(), name: 'Charles Banda', email: 'charles@automedic.mw', phone: '+265 999 001 002', role: 'technician' },
      { id: uid(), name: 'Eric Phiri', email: 'eric@automedic.mw', phone: '+265 999 001 003', role: 'technician' },
      { id: uid(), name: 'Stock Keeper', email: 'stockkeeper@automedic.mw', phone: '+265 999 002 000', role: 'stockkeeper' },
      { id: uid(), name: 'John Banda', email: 'john@example.com', phone: '+265 999 002 001', role: 'customer' },
    ]

    for (const user of users) {
      await db.query(
        `INSERT INTO users (id, name, email, phone, password_hash, role, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           updated_at = $8`,
        [user.id, user.name, user.email, user.phone, hash, user.role, 1, new Date().toISOString()]
      )
      console.log(`  ✅ ${user.email.padEnd(30)} | ${user.role}`)
    }

    // ===== SERVICES =====
    console.log('\n🔧 Seeding Services...')
    const services = [
      { name: 'Car Wash', description: 'Standard exterior car wash', category: 'wash', base_price: 1500, duration_hours: 0.5 },
      { name: 'Premium Wash', description: 'Full exterior & interior premium wash with vacuum', category: 'wash', base_price: 5000, duration_hours: 1.5 },
      { name: 'Engine Wash', description: 'Professional engine bay cleaning', category: 'wash', base_price: 8000, duration_hours: 1.0 },
      { name: 'Body Wash', description: 'Complete body wash with wax finish', category: 'wash', base_price: 3000, duration_hours: 1.0 },
      { name: 'Chassis Lubrication', description: 'Full chassis lubrication & propeller shaft greasing', category: 'maintenance', base_price: 4000, duration_hours: 1.0 },
      { name: 'Tyre Pressure Check', description: 'Check and adjust tyre pressure on all 4 tyres', category: 'tyres', base_price: 500, duration_hours: 0.25 },
      { name: 'Wheel Balancing', description: 'Professional wheel balancing on all 4 wheels', category: 'tyres', base_price: 6000, duration_hours: 1.0 },
      { name: 'Tyre Rotation', description: 'Rotate tyres to ensure even wear', category: 'tyres', base_price: 3000, duration_hours: 0.5 },
      { name: 'Suspension Overhaul', description: 'Complete suspension system overhaul and replacement', category: 'mechanical', base_price: 35000, duration_hours: 5.0 },
      { name: 'Exhaust Replacement', description: 'Exhaust system inspection and replacement', category: 'mechanical', base_price: 18000, duration_hours: 3.0 },
      { name: 'Car Polishing', description: 'Machine polishing to restore paint shine', category: 'detailing', base_price: 12000, duration_hours: 3.0 },
      { name: 'Brake System Maintenance', description: 'Full brake system maintenance and repair', category: 'mechanical', base_price: 12000, duration_hours: 3.0 },
      { name: 'Electrical Repairs', description: 'Diagnosis and repair of all electrical faults', category: 'electrical', base_price: 8000, duration_hours: 2.0 },
      { name: 'General Diagnostic', description: 'Full vehicle electronic diagnostic scan', category: 'diagnostic', base_price: 7000, duration_hours: 1.5 },
      { name: 'Window Tinting', description: 'Professional window tinting — all windows', category: 'detailing', base_price: 15000, duration_hours: 4.0 },
      { name: 'Upholstery Repair', description: 'Seat and interior upholstery repair', category: 'interior', base_price: 10000, duration_hours: 3.0 },
      { name: 'Upholstery Replacement', description: 'Complete interior upholstery replacement', category: 'interior', base_price: 45000, duration_hours: 8.0 },
      { name: 'Oil Change', description: 'Engine oil and filter change using premium oil', category: 'maintenance', base_price: 5000, duration_hours: 1.0 },
      { name: 'Engine Repair', description: 'Complete engine diagnostics and repair', category: 'mechanical', base_price: 25000, duration_hours: 24.0 },
      { name: 'Battery Replacement', description: 'Battery testing and replacement', category: 'electrical', base_price: 15000, duration_hours: 0.5 },
      { name: 'Air Conditioning Service', description: 'AC regas, leak detection and full service', category: 'mechanical', base_price: 10000, duration_hours: 2.0 },
      { name: 'Wheel Alignment', description: 'Precision 4-wheel alignment and balancing', category: 'tyres', base_price: 8000, duration_hours: 1.5 },
    ]

    for (const service of services) {
      await db.query(
        `INSERT INTO services (id, name, description, category, base_price, duration_hours, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [uid(), service.name, service.description, service.category, service.base_price, service.duration_hours, 1, new Date().toISOString()]
      )
      console.log(`  ✅ ${service.name.padEnd(30)} | MWK ${service.base_price.toLocaleString()}`)
    }

    // ===== PRODUCTS =====
    console.log('\n📦 Seeding Products...')
    const products = [
      { name: 'Bridgestone Tyres 185/65R15', description: 'All-season performance tyre', category: 'tyres', cost_price: 40000, price: 45000, stock_quantity: 20 },
      { name: 'Michelin SUV 265/65R17', description: 'All-terrain tyre for SUVs and 4x4', category: 'tyres', cost_price: 70000, price: 78000, stock_quantity: 5 },
      { name: 'Exide 60Ah Car Battery', description: 'Maintenance-free battery, 24-month warranty', category: 'batteries', cost_price: 85000, price: 95000, stock_quantity: 10 },
      { name: 'Castrol EDGE 5W-30 4L', description: 'Full synthetic engine oil', category: 'oils', cost_price: 25000, price: 28000, stock_quantity: 30 },
      { name: 'Shell Helix HX7 10W-40 4L', description: 'Semi-synthetic engine oil', category: 'oils', cost_price: 18000, price: 20000, stock_quantity: 25 },
      { name: 'Mann Oil Filter Toyota/Nissan', description: 'OEM-quality oil filter', category: 'filters', cost_price: 4000, price: 4500, stock_quantity: 40 },
      { name: 'Brembo Brake Pads Front Set', description: 'High-performance ceramic brake pads', category: 'brakes', cost_price: 16000, price: 18000, stock_quantity: 15 },
      { name: 'NGK Spark Plugs Set of 4', description: 'Premium iridium spark plugs', category: 'parts', cost_price: 10000, price: 12000, stock_quantity: 25 },
      { name: 'Gates Timing Belt Kit', description: 'Complete timing belt kit with tensioner', category: 'parts', cost_price: 30000, price: 35000, stock_quantity: 8 },
      { name: 'Engine Oil 5W-30', description: 'Synthetic engine oil 5W-30, 4L', category: 'oil', cost_price: 10000, price: 12000, stock_quantity: 50 },
      { name: 'Oil Filter', description: 'Universal oil filter for most vehicles', category: 'filter', cost_price: 2000, price: 2500, stock_quantity: 100 },
      { name: 'Brake Pads (Front)', description: 'Front brake pads - ceramic', category: 'brakes', cost_price: 15000, price: 18000, stock_quantity: 30 },
      { name: 'Brake Pads (Rear)', description: 'Rear brake pads - ceramic', category: 'brakes', cost_price: 13000, price: 16000, stock_quantity: 30 },
      { name: 'Car Battery 12V 70Ah', description: 'Maintenance-free car battery', category: 'electrical', cost_price: 30000, price: 35000, stock_quantity: 15 },
      { name: 'Air Filter', description: 'Engine air filter - universal fit', category: 'filter', cost_price: 3000, price: 3500, stock_quantity: 60 },
      { name: 'Spark Plugs (Set of 4)', description: 'Iridium spark plugs', category: 'electrical', cost_price: 6500, price: 8000, stock_quantity: 40 },
      { name: 'Windshield Wipers', description: 'Universal windshield wiper blades (pair)', category: 'accessories', cost_price: 3500, price: 4500, stock_quantity: 50 },
      { name: 'Coolant 5L', description: 'Engine coolant/antifreeze 5L', category: 'fluid', cost_price: 5500, price: 6500, stock_quantity: 40 },
      { name: 'Brake Fluid', description: 'DOT 4 brake fluid 1L', category: 'fluid', cost_price: 2500, price: 3000, stock_quantity: 35 },
    ]

    for (const product of products) {
      await db.query(
        `INSERT INTO products (id, name, description, category, cost_price, price, stock_quantity, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT DO NOTHING`,
        [uid(), product.name, product.description, product.category, product.cost_price, product.price, product.stock_quantity, 1, new Date().toISOString()]
      )
      console.log(`  ✅ ${product.name.padEnd(35)} | Stock: ${product.stock_quantity}`)
    }

    console.log('\n✅ Database seeded successfully!')
    console.log('\n📋 Login Credentials:')
    console.log('   Admin:       admin@automedic.mw       / automedic2024')
    console.log('   Technician:  peter@automedic.mw       / automedic2024')
    console.log('   StockKeeper: stockkeeper@automedic.mw / automedic2024')
    console.log('   Customer:    john@example.com         / automedic2024')
    console.log('\n⚠️  IMPORTANT: Change admin password after first login!\n')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error seeding database:', error.message)
    console.error(error)
    process.exit(1)
  }
}

seedAll()
