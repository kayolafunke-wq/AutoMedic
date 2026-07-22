/**
 * PostgreSQL Database Migration Script
 * Run this script ONCE after deploying to Railway/production
 * 
 * Usage: node scripts/migrate-postgresql.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const migrations = [
  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash TEXT,
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'technician', 'admin', 'stockkeeper')),
    profile_image_url TEXT,
    google_id VARCHAR(255),
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Create index on email
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
  `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`,

  // Vehicles table
  `CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER,
    color VARCHAR(50),
    registration_number VARCHAR(50),
    chassis_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  `CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles(customer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_vehicles_reg ON vehicles(registration_number)`,

  // Services table
  `CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    base_price DECIMAL(10,2),
    duration_hours DECIMAL(5,2),
    image_url TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Products table
  `CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    cost_price DECIMAL(10,2),
    price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    reorder_point INTEGER DEFAULT 5,
    image_url TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`,

  // Appointments table
  `CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(255) PRIMARY KEY,
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(255) NOT NULL,
    vehicle_id VARCHAR(255) NOT NULL,
    service_id VARCHAR(255),
    technician_id VARCHAR(255),
    preferred_date DATE,
    preferred_time VARCHAR(20),
    problem_description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(customer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_tracking ON appointments(tracking_number)`,

  // Inspections table
  `CREATE TABLE IF NOT EXISTS inspections (
    id VARCHAR(255) PRIMARY KEY,
    appointment_id VARCHAR(255) NOT NULL,
    technician_id VARCHAR(255) NOT NULL,
    vehicle_health JSONB,
    exterior_check JSONB,
    under_hood JSONB,
    under_vehicle JSONB,
    road_test JSONB,
    photos JSONB,
    recommendations TEXT,
    advisor_notes TEXT,
    advisor_signature TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  // Job Cards table
  `CREATE TABLE IF NOT EXISTS job_cards (
    id VARCHAR(255) PRIMARY KEY,
    appointment_id VARCHAR(255) NOT NULL,
    technician_id VARCHAR(255),
    service_items JSONB,
    parts_used JSONB,
    labor_hours DECIMAL(5,2),
    labor_cost DECIMAL(10,2),
    parts_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    estimated_cost DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'draft',
    progress INTEGER DEFAULT 0,
    notes TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL
  )`,

  // Invoices table
  `CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(255) PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    appointment_id VARCHAR(255) NOT NULL,
    customer_id VARCHAR(255) NOT NULL,
    subtotal DECIMAL(10,2),
    tax DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending',
    paid_at TIMESTAMP,
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  // Notifications table
  `CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info',
    is_read INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read)`,

  // Inventory Logs table
  `CREATE TABLE IF NOT EXISTS inventory_logs (
    id VARCHAR(255) PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    quantity_change INTEGER NOT NULL,
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    reason TEXT,
    job_card_id VARCHAR(255),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id)`,

  // Garage Settings table
  `CREATE TABLE IF NOT EXISTS garage_settings (
    id VARCHAR(255) PRIMARY KEY,
    garage_name VARCHAR(255),
    garage_email VARCHAR(255),
    garage_phone VARCHAR(50),
    garage_address TEXT,
    garage_whatsapp VARCHAR(50),
    garage_hours TEXT,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'MWK',
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Insert default garage settings
  `INSERT INTO garage_settings (id, garage_name, garage_email, garage_phone, garage_address, garage_whatsapp, garage_hours)
   VALUES ('default', 'AutoMedic Garage', 'info@automedic.mw', '+265994040900', 'Area 47, Lilongwe, Malawi', '+265994040900', 'Mon–Sat: 7am – 6pm')
   ON CONFLICT (id) DO NOTHING`,
];

async function runMigrations() {
  let client;
  
  try {
    console.log('🔄 Connecting to PostgreSQL database...');
    client = await pool.connect();
    console.log('✅ Connected to database');

    console.log('\n📝 Running migrations...\n');

    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      const previewText = migration.substring(0, 60).replace(/\n/g, ' ');
      
      try {
        await client.query(migration);
        console.log(`✅ Migration ${i + 1}/${migrations.length}: ${previewText}...`);
      } catch (error) {
        console.error(`❌ Migration ${i + 1} failed: ${error.message}`);
        throw error;
      }
    }

    console.log('\n✅ All migrations completed successfully!');
    console.log('\n🎉 Database is ready for use');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
