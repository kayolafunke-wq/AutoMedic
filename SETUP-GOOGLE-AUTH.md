# 🔐 Setup Google Authentication

## Current Status:
- ✅ Frontend Firebase is configured (automedic-90499 project)
- ❌ Backend Firebase Admin SDK needs credentials

## Steps to Fix Google Sign-In:

### Step 1: Get Firebase Admin Credentials

1. **Go to Firebase Console**:
   - Visit: https://console.firebase.google.com
   - Select project: **automedic-90499**

2. **Generate Service Account Key**:
   - Click ⚙️ (Settings) → **Project settings**
   - Go to **"Service accounts"** tab
   - Click **"Generate new private key"**
   - Click **"Generate key"** in the dialog
   - A JSON file will download (e.g., `automedic-90499-firebase-adminsdk-xxxxx.json`)
   - **KEEP THIS FILE SECURE!** It has full admin access

3. **Extract the Required Values**:
   Open the downloaded JSON file and find these fields:
   ```json
   {
     "project_id": "automedic-90499",
     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANB...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@automedic-90499.iam.gserviceaccount.com"
   }
   ```

### Step 2: Add Environment Variables to Railway (Backend)

1. Go to Railway dashboard
2. Click your **BACKEND service** (automedic-production-aa75)
3. Go to **"Variables"** tab
4. Add these three variables:

```env
FIREBASE_PROJECT_ID=automedic-90499

FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@automedic-90499.iam.gserviceaccount.com

FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
...
...
-----END PRIVATE KEY-----"
```

**IMPORTANT NOTES:**
- Replace the values with your actual credentials from the JSON file
- For `FIREBASE_PRIVATE_KEY`: 
  - **Include the quotes** around the entire key
  - **Keep the `\n` characters** (they represent line breaks)
  - The key should start with `"-----BEGIN PRIVATE KEY-----\n` and end with `\n-----END PRIVATE KEY-----\n"`
  - Railway will handle the escaping automatically

### Step 3: Verify Google OAuth Settings

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Make sure **Google** is enabled
3. Check **Authorized domains**:
   - Should include: `empowering-perception-production-6586.up.railway.app` (your frontend)
   - Should include: `automedic-production-aa75.up.railway.app` (your backend)
   
   **If not listed, add them:**
   - Click **"Add domain"**
   - Add both Railway domains

### Step 4: Update Backend Google Callback URL

The backend has a Google OAuth callback endpoint. We need to make sure it's configured correctly.

1. Check if you have Google OAuth credentials for backend
2. If yes, update the authorized redirect URI in Google Cloud Console:
   - Go to: https://console.cloud.google.com/apis/credentials
   - Select your OAuth 2.0 Client ID
   - Add authorized redirect URI:
     ```
     https://automedic-production-aa75.up.railway.app/api/auth/google/callback
     ```

### Step 5: Test

After adding the environment variables:
1. Railway will automatically redeploy backend
2. Wait ~30 seconds
3. Go to login page
4. Click **"Continue with Google"**
5. Should work! ✅

---

## 🧪 Troubleshooting:

### Error: "Google sign-in failed"
**Check:**
- Backend logs in Railway (look for Firebase Admin init message)
- Browser console for detailed error
- Make sure `FIREBASE_PRIVATE_KEY` includes the quotes and `\n` characters

### Error: "Invalid token" or "Token verification failed"
**Check:**
- All three environment variables are set correctly
- `FIREBASE_CLIENT_EMAIL` matches the one in JSON file
- Private key has proper newline characters (`\n`)

### Backend logs show: "Firebase Admin SDK not configured"
**Solution:**
- Double-check all three env variables are set
- Redeploy backend manually if auto-deploy didn't trigger

### Google popup closes immediately
**Check:**
- Authorized domains in Firebase Console
- Pop-up blocker settings in browser

---

## 📋 Environment Variables Checklist:

**Backend (Railway):**
- [ ] `FIREBASE_PROJECT_ID` = automedic-90499
- [ ] `FIREBASE_CLIENT_EMAIL` = firebase-adminsdk-...@automedic-90499.iam.gserviceaccount.com
- [ ] `FIREBASE_PRIVATE_KEY` = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

**Frontend (Already Configured):**
- ✅ Firebase config in `src/config/firebase.js`

**Firebase Console:**
- [ ] Google sign-in method enabled
- [ ] Authorized domains include both Railway URLs

---

## ⚠️ Security Notes:

1. **Never commit** the service account JSON file to git
2. **Never expose** private keys in frontend code
3. **Only backend** needs Firebase Admin SDK credentials
4. **Frontend** uses the public Firebase config (already setup)

---

## 🎯 Quick Copy-Paste Template:

After downloading the JSON file, you can use this format for Railway:

```
FIREBASE_PROJECT_ID
automedic-90499

FIREBASE_CLIENT_EMAIL
[paste client_email value from JSON]

FIREBASE_PRIVATE_KEY
[paste entire private_key value from JSON including quotes and \n characters]
```

**Example of what the private key should look like in Railway:**
```
"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...[many lines]...\n-----END PRIVATE KEY-----\n"
```

