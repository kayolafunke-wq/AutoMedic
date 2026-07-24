# ⚡ RUN THIS NOW - Fix Login Issue

## What's the Problem?
Your PostgreSQL database on Railway is empty (no users). That's why you're getting "Invalid email or password".

## Quick Fix (Choose ONE method):

---

## 🎯 METHOD 1: Railway Dashboard (EASIEST - No CLI needed)

1. **Open your Railway project**: https://railway.app/dashboard

2. **Find your backend service** in the dashboard

3. **Click the "..." menu** (three dots) → Select **"Shell"**

4. **Wait for terminal to load**, then type this command:
   ```bash
   npm run db:seed:postgres
   ```

5. **Press Enter** and wait ~10 seconds

6. **You should see**:
   ```
   ✅ Users seeded successfully!
   ```

7. **Done!** Try logging in again with:
   - Email: `admin@automedic.mw`
   - Password: `automedic2024`

---

## 🎯 METHOD 2: Railway CLI (If you prefer terminal)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login
```bash
railway login
```

### Step 3: Link Project
```bash
cd backend
railway link
```
(Select your AutoMedic project when prompted)

### Step 4: Run Seeder
```bash
railway run npm run db:seed:postgres
```

### Step 5: Verify
```bash
railway logs --tail 50
```

---

## 🔑 Login After Seeding

Try these credentials on your site:
- **URL**: https://empowering-perception-production-6586.up.railway.app/login
- **Email**: `admin@automedic.mw`
- **Password**: `automedic2024`

Other accounts available:
- `peter@automedic.mw` / `automedic2024` (Technician)
- `stockkeeper@automedic.mw` / `automedic2024` (Stock Keeper)
- `john@example.com` / `automedic2024` (Customer)

---

## ⚠️ IMPORTANT: After First Login

1. Login as admin
2. Go to your profile/settings
3. **Change the password immediately!**
4. Update other user passwords

---

## 🎉 What Gets Created

The seeder creates:
- ✅ 6 users (admin, technicians, stockkeeper, customer)
- ✅ 22 services (oil change, brakes, tyres, etc.)
- ✅ 19 products (oils, filters, batteries, etc.)

---

## ❌ If It Doesn't Work

### Check 1: Is Railway deploying?
- Go to your Railway dashboard
- Check if the latest deployment is complete
- Look for any error messages

### Check 2: Database connected?
In Railway shell, run:
```bash
node -e "console.log(process.env.DATABASE_URL ? 'DB Connected' : 'No DATABASE_URL')"
```

### Check 3: Tables exist?
The seeder assumes tables already exist from your migration. If not, run migration first:
```bash
railway run npm run db:migrate:postgres
```

Then run the seeder again.

---

## 🆘 Still Having Issues?

1. **Check Railway logs**:
   - Dashboard → Your backend service → "Logs" tab
   - Look for database connection errors

2. **Verify environment variables**:
   - Dashboard → Your backend service → "Variables" tab
   - Make sure `DATABASE_URL` is set (Railway does this automatically)

3. **Check if PostgreSQL is running**:
   - Dashboard → Look for PostgreSQL service
   - Should show "Active"

4. **Manual check - List users**:
   ```bash
   railway run node -e "const db = require('./config/db'); db.query('SELECT email, role FROM users').then(r => { console.log(r.rows); process.exit(0); })"
   ```

---

## 📞 Need Help?

Share the error message or screenshot and I'll help debug!

