const db = require('./config/db')

async function testImageUpload() {
  console.log('\n=== Testing Image Upload Flow ===\n')
  
  // 1. Check if test product exists
  console.log('1. Checking test product...')
  let result = await db.query('SELECT * FROM products WHERE id = ?', ['test123'])
  
  if (!result.rows.length) {
    console.log('   Creating test product...')
    await db.query(
      'INSERT INTO products (id, name, description, category, price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)',
      ['test123', 'Test Product', 'A test product', 'other', 100, 5]
    )
    console.log('   ✓ Test product created')
  } else {
    console.log('   ✓ Test product exists')
  }
  
  // 2. Simulate image upload by setting image_url
  console.log('\n2. Simulating image upload...')
  const testImageUrl = '/uploads/product-photos/test-image.jpg'
  await db.query('UPDATE products SET image_url = ? WHERE id = ?', [testImageUrl, 'test123'])
  console.log('   ✓ Image URL set to:', testImageUrl)
  
  // 3. Verify image was saved
  console.log('\n3. Verifying image was saved...')
  result = await db.query('SELECT id, name, image_url FROM products WHERE id = ?', ['test123'])
  if (result.rows[0].image_url) {
    console.log('   ✓ SUCCESS! Image URL:', result.rows[0].image_url)
  } else {
    console.log('   ✗ FAILED! Image URL is still NULL')
  }
  
  // 4. Test PATCH update (simulating frontend save)
  console.log('\n4. Testing PATCH update...')
  const product = result.rows[0]
  await db.query(
    'UPDATE products SET name=?,description=?,category=?,price=?,stock_quantity=?,image_url=? WHERE id=?',
    ['Test Product Updated', 'Updated description', 'other', 150, 10, product.image_url, 'test123']
  )
  console.log('   ✓ PATCH update executed')
  
  // 5. Verify image_url persisted after PATCH
  console.log('\n5. Verifying image persisted after PATCH...')
  result = await db.query('SELECT id, name, image_url FROM products WHERE id = ?', ['test123'])
  if (result.rows[0].image_url === testImageUrl) {
    console.log('   ✓ SUCCESS! Image URL persisted:', result.rows[0].image_url)
  } else {
    console.log('   ✗ FAILED! Image URL was lost. Current value:', result.rows[0].image_url)
  }
  
  console.log('\n=== Test Complete ===\n')
  process.exit(0)
}

testImageUpload().catch(err => {
  console.error('Test failed:', err)
  process.exit(1)
})
