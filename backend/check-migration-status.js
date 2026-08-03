/**
 * Check migration status and database columns
 */

require('dotenv').config();
const db = require('./config/db');

async function checkMigrations() {
  try {
    console.log('\n=== MIGRATION STATUS CHECK ===\n');

    // 1. Check what migrations have been run
    console.log('1️⃣  Migrations already run:');
    const migrations = await db.query(`
      SELECT name, run_on 
      FROM pgmigrations 
      ORDER BY run_on DESC
    `);

    if (migrations.rows.length === 0) {
      console.log('   ⚠️  No migrations found in pgmigrations table!');
    } else {
      migrations.rows.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.name}`);
        console.log(`      Run on: ${m.run_on}`);
      });
    }

    // 2. Check if inspections table has required columns
    console.log('\n2️⃣  Inspections table columns:');
    const columns = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'inspections'
      ORDER BY ordinal_position
    `);

    const requiredCols = ['fuel_level', 'odometer_reading', 'reference_number', 'vehicle_id', 'customer_id'];
    
    columns.rows.forEach(col => {
      const isRequired = requiredCols.includes(col.column_name);
      const marker = isRequired ? '✅' : '  ';
      console.log(`   ${marker} ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // 3. Check for missing columns
    console.log('\n3️⃣  Missing required columns:');
    const existingColNames = columns.rows.map(c => c.column_name);
    const missing = requiredCols.filter(col => !existingColNames.includes(col));

    if (missing.length === 0) {
      console.log('   ✅ All required columns exist!');
    } else {
      console.log(`   ❌ Missing ${missing.length} columns:`);
      missing.forEach(col => {
        console.log(`      - ${col}`);
      });
    }

    // 4. Test query - fetch latest inspection
    console.log('\n4️⃣  Testing inspection query:');
    const testInsp = await db.query(`
      SELECT 
        id, 
        reference_number, 
        fuel_level, 
        odometer_reading,
        created_at
      FROM inspections 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    if (testInsp.rows.length === 0) {
      console.log('   No inspections in database yet');
    } else {
      const insp = testInsp.rows[0];
      console.log(`   Latest inspection: ${insp.reference_number || insp.id}`);
      console.log(`   Fuel Level: ${insp.fuel_level || 'NULL'}`);
      console.log(`   Odometer: ${insp.odometer_reading || 'NULL'}`);
      console.log(`   Created: ${insp.created_at}`);
    }

    // 5. Check migration files in migrations folder
    console.log('\n5️⃣  Available migration files:');
    const fs = require('fs');
    const path = require('path');
    const migrationsDir = path.join(__dirname, 'migrations');
    
    try {
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.js'));
      console.log(`   Found ${files.length} migration files:`);
      files.forEach((file, i) => {
        console.log(`   ${i + 1}. ${file}`);
      });
    } catch (err) {
      console.log('   ⚠️  Could not read migrations folder:', err.message);
    }

    console.log('\n=== STATUS COMPLETE ===\n');
    
    // Summary
    if (missing.length === 0) {
      console.log('✅ DATABASE IS UP TO DATE');
      console.log('   All required columns exist.');
      console.log('   Fuel/odometer fix should work now!');
    } else {
      console.log('❌ DATABASE NEEDS UPDATE');
      console.log(`   Missing ${missing.length} columns: ${missing.join(', ')}`);
      console.log('   Migration needs to run or columns need to be added manually.');
    }

    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

checkMigrations();
