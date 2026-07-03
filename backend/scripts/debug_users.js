const db = require('../config/db')

async function run() {
  const users = await db.query("SELECT id, name, email, role, is_active FROM users LIMIT 5")
  const testUser = users.rows.find(u => u.role !== 'admin') || users.rows[0]
  if (!testUser) return console.log('No users found')

  console.log('Test user:', testUser.name, '| is_active:', testUser.is_active)

  // Apply the FIXED logic (same as updated route handler)
  const boolFromFrontend = !testUser.is_active  // JS boolean
  const activeVal = boolFromFrontend !== undefined ? (boolFromFrontend ? 1 : 0) : testUser.is_active
  console.log('Boolean from frontend:', boolFromFrontend, '→ converted to:', activeVal, typeof activeVal)

  try {
    await db.query(
      'UPDATE users SET name=?,email=?,phone=?,role=?,is_active=? WHERE id=?',
      [testUser.name, testUser.email, testUser.phone || null, testUser.role, activeVal, testUser.id]
    )
    const after = await db.query('SELECT id, name, is_active FROM users WHERE id = ?', [testUser.id])
    console.log('✓ UPDATE succeeded — is_active is now:', after.rows[0].is_active)

    // Restore
    await db.query('UPDATE users SET is_active=? WHERE id=?', [testUser.is_active, testUser.id])
    console.log('✓ Restored to:', testUser.is_active)
  } catch(err) {
    console.log('✗ FAILED:', err.message)
  }
}

run().catch(console.error)
