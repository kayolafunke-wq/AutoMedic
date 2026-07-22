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
        base_price: 15000,
        duration_hours: 0.5,
        category: 'maintenance',
        is_active: 1
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Brake Service',
        description: 'Brake pad replacement and brake system inspection',
        base_price: 35000,
        duration_hours: 1.0,
        category: 'repair',
        is_active: 1
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Tire Rotation',
        description: 'Rotate all four tires for even wear',
        base_price: 8000,
        duration_hours: 0.33,
        category: 'maintenance',
        is_active: 1
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Engine Diagnostic',
        description: 'Complete engine diagnostic scan and report',
        base_price: 12000,
        duration_hours: 0.75,
        category: 'inspection',
        is_active: 1
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Battery Replacement',
        description: 'Replace car battery with testing',
        base_price: 25000,
        duration_hours: 0.5,
        category: 'repair',
        is_active: 1
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Air Conditioning Service',
        description: 'AC system check, regas and repair',
        base_price: 45000,
        duration_hours: 1.5,
        category: 'repair',
        is_active: 1
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Wheel Alignment',
        description: 'Four-wheel alignment and balancing',
        base_price: 18000,
        duration_hours: 0.75,
        category: 'maintenance',
        is_active: 1
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Transmission Service',
        description: 'Transmission fluid change and inspection',
        base_price: 40000,
        duration_hours: 1.5,
        category: 'maintenance',
        is_active: 1
      }
    ]

    for (const service of services) {
      await db.query(
        `INSERT INTO services (id, name, description, base_price, duration_hours, category, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [service.id, service.name, service.description, service.base_price, service.duration_hours, 
         service.category, service.is_active, new Date().toISOString()]
      )
      console.log(`  ✅ ${service.name} - MWK ${service.base_price.toLocaleString()}`)
    }

    // ===== PRODUCTS =====
    console.log('\n🔧 Creating Products...')
    
    const products = [
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Engine Oil 5W-30',
        description: 'Synthetic engine oil 5W-30, 4L',
        cost_price: 10000,
        price: 12000,
        stock_quantity: 50,
        reorder_point: 10,
        category: 'oil',
        sku: 'OIL-5W30-4L'
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Oil Filter',
        description: 'Universal oil filter for most vehicles',
        cost_price: 2000,
        price: 2500,
        stock_quantity: 100,
        reorder_point: 20,
        category: 'filter',
        sku: 'FILTER-OIL-001'
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Brake Pads (Front)',
        description: 'Front brake pads - ceramic',
        cost_price: 15000,
        price: 18000,
        stock_quantity: 30,
        reorder_point: 8,
        category: 'brakes',
        sku: 'BRAKE-PAD-F-001'
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Brake Pads (Rear)',
        description: 'Rear brake pads - ceramic',
        cost_price: 13000,
        price: 16000,
        stock_quantity: 30,
        reorder_point: 8,
        category: 'brakes',
        sku: 'BRAKE-PAD-R-001'
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Car Battery 12V 70Ah',
        description: 'Maintenance-free car battery',
        cost_price: 30000,
        price: 35000,
        stock_quantity: 15,
        reorder_point: 5,
        category: 'electrical',
        sku: 'BATTERY-12V-70AH'
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Air Filter',
        description: 'Engine air filter - universal fit',
        cost_price: 3000,
        price: 3500,
        stock_quantity: 60,
        reorder_point: 15,
        category: 'filter',
        sku: 'FILTER-AIR-001'
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Spark Plugs (Set of 4)',
        description: 'Iridium spark plugs',
        cost_price: 6500,
        price: 8000,
        stock_quantity: 40,
        reorder_point: 10,
        category: 'electrical',
        sku: 'SPARK-PLUG-4SET'
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Windshield Wipers',
        description: 'Universal windshield wiper blades (pair)',
        cost_price: 3500,
        price: 4500,
        stock_quantity: 50,
        reorder_point: 12,
        category: 'accessories',
        sku: 'WIPER-BLADE-PAIR'
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Coolant 5L',
        description: 'Engine coolant/antifreeze 5L',
        cost_price: 5500,
        price: 6500,
        stock_quantity: 40,
        reorder_point: 10,
        category: 'fluid',
        sku: 'COOLANT-5L'
      },
      {
        id: crypto.randomBytes(16).toString('hex'),
        name: 'Brake Fluid',
        description: 'DOT 4 brake fluid 1L',
        cost_price: 2500,
        price: 3000,
        stock_quantity: 35,
        reorder_point: 10,
        category: 'fluid',
        sku: 'BRAKE-FLUID-1L'
      }
    ]

    for (const product of products) {
      await db.query(
        `INSERT INTO products (id, name, description, cost_price, price, stock_quantity, reorder_point, category, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [product.id, product.name, product.description, product.cost_price, product.price, 
         product.stock_quantity, product.reorder_point, product.category, new Date().toISOString()]
      )
      console.log(`  ✅ ${product.name} - MWK ${product.price.toLocaleString()} (Stock: ${product.stock_quantity})`)
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
