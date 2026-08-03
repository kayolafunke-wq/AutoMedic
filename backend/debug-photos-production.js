/**
 * DEBUG SCRIPT FOR RAILWAY PRODUCTION
 * 
 * Run this on Railway to check inspection photos issue
 * 
 * Usage:
 * 1. SSH into Railway: railway shell
 * 2. Run: node debug-photos-production.js
 */

require('dotenv').config();
const db = require('./config/db');

async function debugPhotos() {
  try {
    console.log('\n=== AUTOMEDIC PHOTO DEBUG (Production) ===\n');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Connected ✓' : 'NOT SET ✗');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('\n');

    // 1. Check if inspection_photos table exists
    console.log('1️⃣  Checking if inspection_photos table exists...');
    const tableCheck = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'inspection_photos'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('   ❌ ERROR: inspection_photos table does NOT exist!');
      console.log('   Solution: Run migration or create table manually.');
      process.exit(1);
    }
    console.log('   ✅ Table exists');

    // 2. Check table structure
    console.log('\n2️⃣  Table structure:');
    const columns = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'inspection_photos'
      ORDER BY ordinal_position
    `);
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name.padEnd(20)} ${col.data_type.padEnd(15)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // 3. Count total photos
    console.log('\n3️⃣  Total photos in database:');
    const count = await db.query('SELECT COUNT(*) as count FROM inspection_photos');
    console.log(`   ${count.rows[0].count} photos found`);

    if (count.rows[0].count === '0') {
      console.log('   ⚠️  WARNING: No photos in database!');
      console.log('   This means photos are NOT being uploaded successfully.');
    }

    // 4. Get recent photos
    console.log('\n4️⃣  Recent photos (last 5):');
    const recentPhotos = await db.query(`
      SELECT 
        ip.id,
        ip.inspection_id,
        ip.photo_type,
        LENGTH(ip.file_url) as url_length,
        SUBSTRING(ip.file_url, 1, 50) as url_preview,
        ip.file_name,
        ip.created_at
      FROM inspection_photos ip
      ORDER BY ip.created_at DESC
      LIMIT 5
    `);

    if (recentPhotos.rows.length === 0) {
      console.log('   No photos found');
    } else {
      recentPhotos.rows.forEach((photo, i) => {
        console.log(`\n   Photo ${i + 1}:`);
        console.log(`     ID: ${photo.id}`);
        console.log(`     Inspection ID: ${photo.inspection_id}`);
        console.log(`     Type: ${photo.photo_type}`);
        console.log(`     URL Length: ${photo.url_length} chars`);
        console.log(`     URL Preview: ${photo.url_preview}...`);
        console.log(`     File Name: ${photo.file_name || 'N/A'}`);
        console.log(`     Created: ${photo.created_at}`);
      });
    }

    // 5. Check inspections and their photo counts
    console.log('\n5️⃣  Inspections with photo counts:');
    const inspections = await db.query(`
      SELECT 
        i.id,
        i.reference_number,
        i.status,
        i.created_at,
        COUNT(ip.id) as photo_count
      FROM inspections i
      LEFT JOIN inspection_photos ip ON i.id = ip.inspection_id
      GROUP BY i.id, i.reference_number, i.status, i.created_at
      ORDER BY i.created_at DESC
      LIMIT 10
    `);

    if (inspections.rows.length === 0) {
      console.log('   No inspections found');
    } else {
      inspections.rows.forEach((insp, i) => {
        const hasPhotos = parseInt(insp.photo_count) > 0;
        console.log(`\n   ${i + 1}. ${insp.reference_number} (${insp.status})`);
        console.log(`      Created: ${insp.created_at}`);
        console.log(`      Photos: ${insp.photo_count} ${hasPhotos ? '✅' : '❌'}`);
        if (!hasPhotos) {
          console.log(`      ⚠️  No photos attached to this inspection!`);
        }
      });
    }

    // 6. Test a specific inspection (if you know one that should have photos)
    console.log('\n6️⃣  Testing GET /inspections/:id simulation:');
    if (inspections.rows.length > 0) {
      const testId = inspections.rows[0].id;
      console.log(`   Testing inspection: ${inspections.rows[0].reference_number}`);
      
      const photosRes = await db.query(
        'SELECT * FROM inspection_photos WHERE inspection_id = $1',
        [testId]
      );
      
      console.log(`   Query returned: ${photosRes.rows.length} photos`);
      if (photosRes.rows.length > 0) {
        console.log('   ✅ Photos ARE being retrieved correctly!');
        console.log('   Issue might be in frontend display logic.');
      } else {
        console.log('   ❌ No photos found for this inspection.');
        console.log('   Issue: Photos are not being saved to this inspection.');
      }
    }

    console.log('\n\n=== DEBUG COMPLETE ===\n');
    console.log('📊 Summary:');
    console.log(`   - Total photos in DB: ${count.rows[0].count}`);
    console.log(`   - Total inspections: ${inspections.rows.length}`);
    console.log(`   - Table structure: OK`);
    console.log('\n💡 Next steps:');
    if (count.rows[0].count === '0') {
      console.log('   1. Photos are NOT being uploaded - check upload endpoint');
      console.log('   2. Test photo upload manually via Postman/curl');
      console.log('   3. Check Railway logs for upload errors');
    } else {
      console.log('   1. Photos ARE in database');
      console.log('   2. Check if inspection_id matches correctly');
      console.log('   3. Verify frontend is calling GET /inspections/:id correctly');
      console.log('   4. Check browser console for errors');
    }
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

debugPhotos();
