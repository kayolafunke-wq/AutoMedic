const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const db = require('../config/db')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function createAdmin() {
  try {
    console.log('\n🔐 Create Admin User\n')
    
    const name = await question('Admin Name: ')
    const email = await question('Admin Email: ')
    const password = await question('Admin Password (min 6 chars): ')
    
    if (!name || !email || !password) {
      console.error('❌ All fields are required!')
      rl.close()
      process.exit(1)
    }
    
    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters!')
      rl.close()
      process.exit(1)
    }
    
    // Check if user already exists
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email])
    
    if (existingUser.rows.length > 0) {
      console.error('❌ User with this email already exists!')
      rl.close()
      process.exit(1)
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)
    
    // Generate user ID
    const id = crypto.randomBytes(16).toString('hex')
    
    // Insert admin user
    await db.query(
      `INSERT INTO users (id, name, email, password_hash, role, is_active, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, name, email, passwordHash, 'admin', 1, new Date().toISOString()]
    )
    
    console.log('\n✅ Admin user created successfully!')
    console.log(`\n📧 Email: ${email}`)
    console.log(`👤 Name: ${name}`)
    console.log(`🔑 Role: admin`)
    console.log(`\n🎉 You can now login at: https://automedic-production-aa75.up.railway.app/api/auth/login\n`)
    
    rl.close()
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
    rl.close()
    process.exit(1)
  }
}

createAdmin()
