const db = require('../config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  console.log('Seeding database...');

  // Seed users
  const hash = await bcrypt.hash('password123', 10);
  await db.query(`
    INSERT INTO users (name, email, phone, password_hash, role) VALUES
    ('Admin User', 'admin@automedic.mw', '+265999000000', $1, 'admin'),
    ('John Banda', 'john@example.com', '+265999001234', $1, 'customer'),
    ('Peter Nkosi', 'peter@automedic.mw', '+265999002345', $1, 'technician'),
    ('Charles Banda', 'charles@automedic.mw', '+265999003456', $1, 'technician')
    ON CONFLICT (email) DO NOTHING
  `, [hash]);

  // Seed services
  await db.query(`
    INSERT INTO services (name, description, base_price, duration_hours) VALUES
    ('Engine Repair', 'Complete engine diagnostics and repair services', 25000, 24),
    ('Brake Repair', 'Full brake system inspection and replacement', 12000, 3),
    ('Oil Change', 'Engine oil and filter change', 5000, 1),
    ('Wheel Alignment', 'Precision wheel alignment and balancing', 8000, 1.5),
    ('Car Diagnostics', 'Advanced electronic diagnostics', 7000, 1.5),
    ('Battery Replacement', 'Battery testing and replacement', 15000, 0.5),
    ('Suspension Repair', 'Full suspension overhaul', 18000, 3),
    ('Air Conditioning Service', 'AC regas and full service', 10000, 2)
    ON CONFLICT DO NOTHING
  `);

  // Seed products
  await db.query(`
    INSERT INTO products (name, description, category, price, stock_quantity) VALUES
    ('Bridgestone Tyres 185/65R15', 'All-season performance tyre', 'tyres', 45000, 20),
    ('Exide 60Ah Car Battery', 'Maintenance-free battery, 24-month warranty', 'batteries', 95000, 10),
    ('Castrol EDGE 5W-30 4L', 'Full synthetic engine oil', 'oils', 28000, 30),
    ('Brembo Brake Pads Front Set', 'High-performance ceramic brake pads', 'brakes', 18000, 15),
    ('NGK Spark Plugs Set of 4', 'Premium iridium spark plugs', 'parts', 12000, 25),
    ('Gates Timing Belt Kit', 'Complete timing belt kit', 'parts', 35000, 8)
    ON CONFLICT DO NOTHING
  `);

  console.log('Database seeded successfully');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
