# 🔧 Quick Fix: Login Issue on Railway

## Problem
You're getting "Invalid email or password" when trying to login because the PostgreSQL database on Railway has no users yet.

## Solution: Seed the Database

### Option 1: Using Railway CLI (Recommended)

1. **Install Railway CLI** (if not already installed):
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Link to your project**:
   ```bash
   cd backend
   railway link
   ```
   Select your AutoMedic project when prompted.

4. **Run the seeder**:
   ```bash
   railway run npm run db:seed:postgres
   ```

   This will create:
   - 6 users (admin, technicians, stockkeeper, customer)
   - 22 services
   - 19 products

### Option 2: Using Railway Dashboard

1. Go to your Railway project: https://railway.app/dashboard
2. Click on your **backend service**
3. Click the **"..."** menu → **"Shell"**
4. In the terminal that opens, run:
   ```bash
   npm run db:seed:postgres
   ```

### Option 3: Just Seed Users (Faster)

If you only need users to login (no services/products yet):

```bash
railway run npm run db:seed:users
```

---

## 🔑 Login Credentials After Seeding

Once seeded, you can login with any of these:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@automedic.mw | automedic2024 |
| **Technician** | peter@automedic.mw | automedic2024 |
| **Technician** | charles@automedic.mw | automedic2024 |
| **Technician** | eric@automedic.mw | automedic2024 |
| **Stock Keeper** | stockkeeper@automedic.mw | automedic2024 |
| **Customer** | john@example.com | automedic2024 |

---

## ⚠️ Security Note

**IMPORTANT**: After your first login as admin, immediately:

1. Login as: `admin@automedic.mw` / `automedic2024`
2. Go to Settings or Profile
3. Change the password to something secure
4. Do the same for other staff accounts

---

## 🔍 Verify Seed Worked

After running the seed, check Railway logs to confirm:

```bash
railway logs
```

You should see:
```
✅ Users seeded successfully!
✅ Services seeded...
✅ Products seeded...
```

---

## 🐛 Troubleshooting

### "Cannot connect to database"
- Make sure your `DATABASE_URL` environment variable is set in Railway
- Check that PostgreSQL service is running

### "Email already exists"
- The seed script uses `ON CONFLICT` so it's safe to run multiple times
- It will update existing users with the default password

### "Module not found"
- Make sure you've pushed the latest code to Railway
- Check that `package.json` has been updated with the new scripts

### Still can't login?
Run this in Railway shell to check if users exist:

```bash
railway run node -e "const db = require('./config/db'); db.query('SELECT email, role FROM users').then(r => console.log(r.rows))"
```

---

## 📝 What the Seed Does

### Users Table
- Creates 6 default users with different roles
- All passwords are hashed using bcrypt
- Sets `is_active = 1` for all users
- Uses `ON CONFLICT` to safely update if user exists

### Services Table
- Creates 22 common automotive services
- Prices in MWK (Malawi Kwacha)
- Categories: wash, maintenance, tyres, mechanical, electrical, etc.

### Products Table
- Creates 19 common auto parts/products
- Includes cost price and selling price
- Initial stock quantities
- Categories: tyres, batteries, oils, filters, brakes, parts

---

## 🎯 Next Steps After Login

1. ✅ Login with admin credentials
2. ✅ Change admin password
3. ✅ Verify services and products are loaded
4. ✅ Create test appointment
5. ✅ Test critical workflows
6. ✅ Update garage information in settings

---

## Need More Help?

If you're still having issues:

1. Check Railway logs: `railway logs --tail 100`
2. Verify environment variables: `railway variables`
3. Test database connection manually
4. Check if tables exist in PostgreSQL

