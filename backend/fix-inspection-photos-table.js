/**
 * Fix inspection_photos table - add missing file_name column
 */

require('dotenv').config();
const db = require('./config/db');

async function fixTable() {
  try {
    console.log('\n=== FIXING INSPECTION_PHOTOS TABLE ===\n');

    // 1. Check current table structure
    console.log('1️⃣  Current table structure:');
    const columns = await db.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'inspection_photos'
      ORDER BY ordinal_position
    `);

    console.log('   Existing columns:');
    columns.rows.forEach(col => {
      console.log(`     - ${col.column_name} (${col.data_type})`);
    });

    const hasFileName = columns.rows.some(col => col.column_name === 'file_name');

    // 2. Add missing column if needed
    if (!hasFileName) {
      console.log('\n2️⃣  Adding missing file_name column...');
      await db.query(`
        ALTER TABLE inspection_photos 
        ADD COLUMN file_name TEXT
      `);
      console.log('   ✅ file_name column added successfully!');
    } else {
      console.log('\n2️⃣  file_name column already exists ✅');
    }

    // 3. Verify the fix
    console.log('\n3️⃣  Verifying table structure:');
    const newColumns = await db.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'inspection_photos'
      ORDER BY ordinal_position
    `);

    console.log('   Updated columns:');
    newColumns.rows.forEach(col => {
      const marker = col.column_name === 'file_name' ? '✅' : '  ';
      console.log(`   ${marker} - ${col.column_name} (${col.data_type})`);
    });

    console.log('\n=== FIX COMPLETE ===\n');
    console.log('✅ Table is now ready for photo uploads!');
    console.log('   You can now upload photos successfully.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

fixTable();
