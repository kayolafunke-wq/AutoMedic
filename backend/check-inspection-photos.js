// Debug script to check inspection photos
const db = require('./config/db');

async function checkInspectionPhotos() {
  try {
    console.log('=== CHECKING INSPECTION PHOTOS ===\n');
    
    // Check if table exists
    const tableCheck = await db.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='inspection_photos'
    `);
    console.log('Table exists:', tableCheck.rows.length > 0);
    
    // Get table schema
    const schemaCheck = await db.query(`PRAGMA table_info(inspection_photos)`);
    console.log('\nTable schema:');
    schemaCheck.rows.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
    
    // Count total photos
    const countRes = await db.query('SELECT COUNT(*) as count FROM inspection_photos');
    console.log('\nTotal photos in DB:', countRes.rows[0].count);
    
    // Get all photos with inspection details
    const photosRes = await db.query(`
      SELECT 
        ip.*,
        i.reference_number,
        i.status as inspection_status
      FROM inspection_photos ip
      LEFT JOIN inspections i ON ip.inspection_id = i.id
      ORDER BY ip.created_at DESC
      LIMIT 10
    `);
    
    console.log(`\nRecent photos (last 10):`);
    if (photosRes.rows.length === 0) {
      console.log('  No photos found in database!');
    } else {
      photosRes.rows.forEach(photo => {
        console.log(`\n  Photo ID: ${photo.id}`);
        console.log(`    Inspection: ${photo.reference_number || 'N/A'} (${photo.inspection_status})`);
        console.log(`    Type: ${photo.photo_type}`);
        console.log(`    File URL: ${photo.file_url?.substring(0, 50)}...`);
        console.log(`    Uploaded: ${photo.created_at}`);
      });
    }
    
    // Check inspections with photos
    const inspWithPhotos = await db.query(`
      SELECT 
        i.id,
        i.reference_number,
        i.status,
        COUNT(ip.id) as photo_count
      FROM inspections i
      LEFT JOIN inspection_photos ip ON i.id = ip.inspection_id
      GROUP BY i.id
      HAVING photo_count > 0
      ORDER BY i.created_at DESC
    `);
    
    console.log(`\n\nInspections with photos:`);
    if (inspWithPhotos.rows.length === 0) {
      console.log('  No inspections have photos attached!');
    } else {
      inspWithPhotos.rows.forEach(insp => {
        console.log(`  - ${insp.reference_number}: ${insp.photo_count} photo(s)`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}

checkInspectionPhotos();
