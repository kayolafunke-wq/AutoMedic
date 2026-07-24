# Firebase Authentication Fix Instructions

## ✅ FIXED: Package Lock File Issue

**Problem:** Railway was failing because package-lock.json had firebase-admin v14, but package.json had v13.

**Solution:** Regenerated package-lock.json locally with `npm install` and pushed it.

**Status:** Code is now pushed. Railway is building with the correct dependencies.

---

## What We Fixed

### 1. **Pinned Firebase Admin to v13.0.0**
   - Changed `firebase-admin: "^13.0.0"` to `firebase-admin: "13.0.0"` in package.json
   - This ensures Railway always installs v13, which is compatible with Node.js 20
   - v14 requires Node.js 22+ and was causing the error

### 2. **Enhanced Test Script**
   - Added better error detection in `test-firebase-config.js`
   - Now checks if firebase-admin module loaded correctly
   - Shows the installed version
   - Detects if `admin.credential` is undefined

### 3. **Improved Firebase Config**
   - Updated `config/firebase-admin.js` to handle quotes around private key
   - Railway might add quotes when storing the variable
   - Now removes outer quotes before processing

### 4. **Clean Installation**
   - Updated `nixpacks.toml` to delete node_modules before install
   - Ensures a fresh install with the correct version

## What to Do Next

### Step 1: Wait for Railway Deployment
The changes are now pushed to GitHub. Railway will automatically:
1. Pull the latest code
2. Delete old node_modules
3. Install firebase-admin v13.0.0 (exact version)
4. Deploy the backend

**Wait 2-3 minutes** for the deployment to complete.

### Step 2: Check Deployment Status
Go to Railway Dashboard and check:
- ✅ Deployment should show "Success" (not "Failed")
- ✅ Logs should show: "🔐 Firebase Admin: initialized via environment variables"
- ❌ If it shows: "Google OAuth not configured" - environment variables are wrong

### Step 3: Test Firebase in Railway Console
Once deployed successfully, open Railway backend console and run:

```bash
npm run test:firebase
```

**Expected Output (SUCCESS):**
```
✅ All required variables are set!
✓ firebase-admin module loaded
  Version: 13.0.0
✅ Firebase Admin SDK initialized successfully!
   Google Sign-In should now work!
```

**If you still see errors:**

#### Error: "Cannot read properties of undefined (reading 'cert')"
**Cause:** firebase-admin v14 was installed instead of v13
**Fix:** In Railway console, run:
```bash
npm uninstall firebase-admin
npm install firebase-admin@13.0.0
npm run test:firebase
```

#### Error: "Failed to parse private key: DECODER routines::unsupported"
**Cause:** The private key format is wrong
**Fix:** 
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Open it and copy the ENTIRE `private_key` value (including quotes)
5. Go to Railway → Backend Variables
6. **Delete** the old FIREBASE_PRIVATE_KEY variable
7. **Create new** FIREBASE_PRIVATE_KEY variable
8. Paste the value **exactly as it appears** in the JSON (with quotes)

### Step 4: Test Google Sign-In
Once the test script shows success:

1. Open your frontend: `https://empowering-perception-production-6586.up.railway.app`
2. Click "Sign in with Google"
3. Choose your Google account
4. You should be logged in successfully

### Step 5: Verify in Database
After logging in with Google, check the database:

In Railway backend console:
```bash
node -e "require('dotenv').config(); const {Pool} = require('pg'); const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}}); pool.query('SELECT id, email, full_name, role FROM users WHERE firebase_uid IS NOT NULL').then(r => console.log(r.rows)).then(() => pool.end())"
```

You should see your Google account in the users table.

## Environment Variables (Double Check)

Make sure these are set in Railway → Backend → Variables:

```
FIREBASE_PROJECT_ID=automedic-90499
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@automedic-90499.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...[1700 chars]...\n-----END PRIVATE KEY-----\n"
```

**Important Notes:**
- FIREBASE_PRIVATE_KEY should have quotes around it
- It should have `\n` characters (not actual newlines)
- It should be 1700-1750 characters long
- It should start with `"-----BEGIN PRIVATE KEY-----\n`
- It should end with `\n-----END PRIVATE KEY-----\n"`

## Troubleshooting

### Issue: Deployment keeps failing
**Check:** Railway build logs for syntax errors
**Fix:** Look at the error message and fix the file mentioned

### Issue: Google Sign-In shows "popup closed by user"
**Check:** Make sure frontend has correct Firebase config
**Fix:** Verify `frontend/src/config/firebase.js` has the right API keys

### Issue: Backend shows "Google OAuth not configured"
**Check:** Environment variables in Railway
**Fix:** Make sure all 3 Firebase variables are set correctly

### Issue: Users created but can't do anything
**Check:** SQL syntax errors in other routes
**Fix:** We still need to fix SQL syntax in other route files (appointments, inventory, etc.)

## Next Steps After Firebase Works

Once Google authentication is working, we need to:

1. **Fix remaining SQL syntax errors** in:
   - appointment.routes.js
   - inspection.routes.js
   - inventory.routes.js
   - invoice.routes.js
   - jobcard.routes.js
   - vehicle.routes.js
   - customer.routes.js
   - technician.routes.js
   - product.routes.js
   - service.routes.js
   - report.routes.js
   - notification.routes.js

2. **Test all major features:**
   - Creating appointments
   - Adding vehicles
   - Creating job cards
   - Managing inventory
   - Generating invoices

3. **Performance optimization:**
   - Add database indexes
   - Optimize slow queries
   - Add caching if needed

---

**Current Status:** ✅ Code pushed, waiting for Railway deployment
**Next Action:** Check Railway dashboard for deployment status
