const db = require('../config/db')
const bcrypt = require('bcryptjs')

async function run() {
  const email = 'panda@test.com'

  const r = await db.query(
    'SELECT id, name, email, role, google_id, password_hash, is_active FROM users WHERE email = ?',
    [email]
  )

  if (!r.rows.length) {
    console.log('User not found:', email)
    return
  }

  const u = r.rows[0]
  console.log('User:')
  console.log('  name:         ', u.name)
  console.log('  email:        ', u.email)
  console.log('  role:         ', u.role)
  console.log('  is_active:    ', u.is_active)
  console.log('  google_id:    ', u.google_id || '(none)')
  console.log('  password_hash:', u.password_hash ? '(SET)' : '(NOT SET)')

  if (u.password_hash) {
    const valid = bcrypt.compareSync('automedic2024', u.password_hash)
    console.log('  password "automedic2024" matches:', valid)
  } else {
    // No password — set one so they can log in
    const hash = bcrypt.hashSync('automedic2024', 12)
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, u.id])
    console.log('  → No password found. Set to: automedic2024')
  }
}

run().catch(console.error)
