const crypto = require('crypto')
const db = require('../config/db')

async function seedInitialData() {
  try {
    console.log('\n🌱 Seeding initial data...\n')

    // ===== SERVICES =====
    console.log('📋 Creating Services...')
    
    const services = [
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Oil Change',
        description: 'Complete engine oil and filter replacement service',
        price: 15000,
        duration: 30,
        category: 'maintenance',
        is_active: 1
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Brake Service',
        description: 'Brake pad replacement and brake system inspection',
        price: 35000,
        duration: 60,
        category: 'repair',
        is_active: 1
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Tire Rotation',
        description: 'Rotate all four tires for even wear',
        price: 8000,
        duration: 20,
        category: 'maintenance',
        is_active: 1
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Engine Diagnostic',
        description: 'Complete engine diagnostic scan and report',
        price: 12000,
        duration: 45,
        category: 'inspection',
        is_active: 1
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Battery Replacement',
        description: 'Replace car battery with testing',
        price: 25000,
        duration: 30,
        category: 'repair',
        is_active: 1
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Air Conditioning Service',
        description: 'AC system check, regas and repair',
        price: 45000,
        duration: 90,
        category: 'repair',
        is_active: 1
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Wheel Alignment',
        description: 'Four-wheel alignment and balancing',
        price: 18000,
        duration: 45,
        category: 'maintenance',
        is_active: 1
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Transmission Service',
        description: 'Transmission fluid change and inspection',
        price: 40000,
        duration: 90,
        category: 'maintenance',
        is_active: 1
      }
    ]

    for (const service of services) {
      await db.query(
        `INSERT INTO services (id, name, description, price, duration, category, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [service.id, service.name, service.description, service.price, service.duration, 
         service.category, service.is_active, new Date().toISOString()]
      )
      console.log(`  ✅ ${service.name} - MWK ${service.price.toLocaleString()}`)
    }

    // ===== PRODUCTS =====
    console.log('\n🔧 Creating Products...')
    
    const products = [
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Engine Oil 5W-30',
        description: 'Synthetic engine oil 5W-30, 4L',
        unit_price: 12000,
        quantity: 50,
        reorder_level: 10,
        category: 'oil',
        sku: 'OIL-5W30-4L'
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Oil Filter',
        description: 'Universal oil filter for most vehicles',
        unit_price: 2500,
        quantity: 100,
        reorder_level: 20,
        category: 'filter',
        sku: 'FILTER-OIL-001'
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Brake Pads (Front)',
        description: 'Front brake pads - ceramic',
        unit_price: 18000,
        quantity: 30,
        reorder_level: 8,
        category: 'brakes',
        sku: 'BRAKE-PAD-F-001'
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Brake Pads (Rear)',
        description: 'Rear brake pads - ceramic',
        unit_price: 16000,
        quantity: 30,
        reorder_level: 8,
        category: 'brakes',
        sku: 'BRAKE-PAD-R-001'
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Car Battery 12V 70Ah',
        description: 'Maintenance-free car battery',
        unit_price: 35000,
        quantity: 15,
        reorder_level: 5,
        category: 'electrical',
        sku: 'BATTERY-12V-70AH'
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Air Filter',
        description: 'Engine air filter - universal fit',
        unit_price: 3500,
        quantity: 60,
        reorder_level: 15,
        category: 'filter',
        sku: 'FILTER-AIR-001'
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Spark Plugs (Set of 4)',
        description: 'Iridium spark plugs',
        unit_price: 8000,
        quantity: 40,
        reorder_level: 10,
        category: 'electrical',
        sku: 'SPARK-PLUG-4SET'
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Windshield Wipers',
        description: 'Universal windshield wiper blades (pair)',
        unit_price: 4500,
        quantity: 50,
        reorder_level: 12,
        category: 'accessories',
        sku: 'WIPER-BLADE-PAIR'
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Coolant 5L',
        description: 'Engine coolant/antifreeze 5L',
        unit_price: 6500,
        quantity: 40,
        reorder_level: 10,
        category: 'fluid',
        sku: 'COOLANT-5L'
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Brake Fluid',
        description: 'DOT 4 brake fluid 1L',
        unit_price: 3000,
        quantity: 35,
        reorder_level: 10,
        category: 'fluid',
        sku: 'BRAKE-FLUID-1L'
      }
    ]

    for (const product of products) {
      await db.query(
        `INSERT INTO products (id, name, description, unit_price, quantity, reorder_level, category, sku, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [product.id, product.name, product.description, product.unit_price, product.quantity,
         product.reorder_level, product.category, product.sku, new Date().toISOString()]
      )
      console.log(`  ✅ ${product.name} - MWK ${product.unit_price.toLocaleString()} (Stock: ${product.quantity})`)
    }

    console.log('\n✅ Initial data seeded successfully!')
    console.log(`\n📊 Summary:`)
    console.log(`   - ${services.length} services created`)
    console.log(`   - ${products.length} products created`)
    console.log(`\n🎉 Your garage is ready to start taking appointments!\n`)

    process.exit(0)

  } catch (error) {
    console.error('❌ Error seeding data:', error.message)
    process.exit(1)
  }
}

seedInitialData()
