/**
 * Check for duplicate appointments or wrong vehicle associations
 */

require('dotenv').config();
const db = require('./config/db');

async function checkDuplicates() {
  try {
    console.log('\n=== CHECKING APPOINTMENT DUPLICATES ===\n');

    // 1. Find appointments with same customer_id
    console.log('1️⃣  Customers with multiple appointments:');
    const multiAppts = await db.query(`
      SELECT 
        u.name as customer_name,
        u.id as customer_id,
        COUNT(a.id) as appointment_count
      FROM users u
      LEFT JOIN appointments a ON u.id = a.customer_id
      WHERE u.role = 'customer'
      GROUP BY u.id, u.name
      HAVING COUNT(a.id) > 1
      ORDER BY appointment_count DESC
    `);

    if (multiAppts.rows.length === 0) {
      console.log('   No customers with multiple appointments');
    } else {
      multiAppts.rows.forEach(row => {
        console.log(`   - ${row.customer_name}: ${row.appointment_count} appointments`);
      });
    }

    // 2. Check for appointments with same tracking number (TRUE duplicates)
    console.log('\n2️⃣  Duplicate tracking numbers:');
    const dupTracking = await db.query(`
      SELECT tracking_number, COUNT(*) as count
      FROM appointments
      GROUP BY tracking_number
      HAVING COUNT(*) > 1
    `);

    if (dupTracking.rows.length === 0) {
      console.log('   ✅ No duplicate tracking numbers found');
    } else {
      console.log(`   ❌ Found ${dupTracking.rows.length} duplicate tracking numbers!`);
      dupTracking.rows.forEach(row => {
        console.log(`     - ${row.tracking_number}: ${row.count} appointments`);
      });
    }

    // 3. For customers with multiple appointments, show their appointments
    console.log('\n3️⃣  Detailed appointment list (customers with >1 appointment):');
    
    for (const customer of multiAppts.rows) {
      console.log(`\n   Customer: ${customer.customer_name} (${customer.customer_id})`);
      
      const appts = await db.query(`
        SELECT 
          a.id,
          a.tracking_number,
          a.status,
          a.vehicle_id,
          v.make,
          v.model,
          v.registration_number,
          a.created_at
        FROM appointments a
        LEFT JOIN vehicles v ON a.vehicle_id = v.id
        WHERE a.customer_id = $1
        ORDER BY a.created_at DESC
      `, [customer.customer_id]);

      appts.rows.forEach((appt, i) => {
        console.log(`     ${i + 1}. ${appt.tracking_number} - ${appt.status}`);
        console.log(`        Vehicle: ${appt.make || '?'} ${appt.model || '?'} (${appt.registration_number || 'N/A'})`);
        console.log(`        Vehicle ID: ${appt.vehicle_id || 'NULL'}`);
        console.log(`        Created: ${appt.created_at}`);
      });
    }

    // 4. Check if customer has multiple appointments pointing to SAME vehicle
    console.log('\n4️⃣  Multiple appointments for SAME vehicle:');
    const sameVehicle = await db.query(`
      SELECT 
        a.vehicle_id,
        v.make,
        v.model,
        v.registration_number,
        COUNT(a.id) as appointment_count,
        STRING_AGG(a.tracking_number, ', ') as tracking_numbers
      FROM appointments a
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      WHERE a.vehicle_id IS NOT NULL
      GROUP BY a.vehicle_id, v.make, v.model, v.registration_number
      HAVING COUNT(a.id) > 1
    `);

    if (sameVehicle.rows.length === 0) {
      console.log('   No vehicles with multiple appointments');
    } else {
      sameVehicle.rows.forEach(row => {
        console.log(`   - ${row.make} ${row.model} (${row.registration_number})`);
        console.log(`     ${row.appointment_count} appointments: ${row.tracking_numbers}`);
      });
    }

    // 5. Check for appointments with NULL vehicle_id
    console.log('\n5️⃣  Appointments without vehicle:');
    const noVehicle = await db.query(`
      SELECT 
        a.id,
        a.tracking_number,
        a.customer_id,
        u.name as customer_name,
        a.vehicle_id
      FROM appointments a
      LEFT JOIN users u ON a.customer_id = u.id
      WHERE a.vehicle_id IS NULL
    `);

    if (noVehicle.rows.length === 0) {
      console.log('   ✅ All appointments have vehicles assigned');
    } else {
      console.log(`   ⚠️  Found ${noVehicle.rows.length} appointments without vehicles:`);
      noVehicle.rows.forEach(row => {
        console.log(`     - ${row.tracking_number} (Customer: ${row.customer_name})`);
      });
    }

    console.log('\n=== DEBUG COMPLETE ===\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

checkDuplicates();
