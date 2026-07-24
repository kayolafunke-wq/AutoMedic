const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const db = require('../../config/db')

const uid = () => crypto.randomBytes(16).toString('hex')
const hash = bcrypt.hashSync('automedic2024', 12)

async function seedUsers() {
  try {
    console.log('\n🌱 Seeding users into PostgreSQL...\n')

    const users = [
      { id: uid(), name: 'Admin User', email: 'admin@automedic.mw', phone: '+265 999 000 000', role: 'admin' },
      { id: uid(), name: 'Peter Nkosi', email: 'peter@automedic.mw', phone: '+265 999 001 001', role: 'technician' },
      { id: uid(), name: 'Charles Banda', email: 'charles@automedic.mw', phone: '+265 999 001 002', role: 'technician' },
      { id: uid(), name: 'Eric Phiri', email: 'eric@automedic.mw', phone: '+265 999 001 003', role: 'technician' },
      { id: uid(), name: 'Stock Keeper', email: 'stockkeeper@automedic.mw', phone: '+265 999 002 000', role: 'stockkeeper' },
      { id: uid(), name: 'John Banda', email: 'john@example.com', phone: '+265 999 002 001', role: 'customer' },
    ]

    for (const user of users) {
      await db.query(
        `INSERT INTO users (id, name, email, phone, password_hash, role, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           updated_at = $8`,
        [user.id, user.name, user.email, user.phone, hash, user.role, 1, new Date().toISOString()]
      )
      console.log(`✅ ${user.name.padEnd(20)} | ${user.email.padEnd(30)} | ${user.role}`)
    }

    console.log('\n🎉 Users seeded successfully!')
    console.log('\n📋 Login Credentials:')
    console.log('   Email: admin@automedic.mw')
    console.log('   Email: peter@automedic.mw')
    console.log('   Email: stockkeeper@automedic.mw')
    console.log('   Email: john@example.com')
    console.log('   Password for all: automedic2024')
    console.log('\n⚠️  IMPORTANT: Change admin password after first login!\n')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding users:', error.message)
    console.error(error)
    process.exit(1)
  }
}

seedUsers()
