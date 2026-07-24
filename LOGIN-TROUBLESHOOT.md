# 🔧 Login Troubleshooting - FOUND THE ISSUE!

## ✅ What We Confirmed:
1. **Users exist** in PostgreSQL ✅
2. **Passwords are set** correctly (bcrypt hash length 60) ✅  
3. **Backend login endpoint** uses correct PostgreSQL syntax ✅
4. **admin@automedic.mw** exists with `is_active=1` ✅

## ❌ The REAL Problem:

**Frontend can't reach backend** - they're on different Railway services!

- **Frontend URL**: `https://empowering-perception-production-6586.up.railway.app`
- **Backend URL** (from .env.production): `https://automedic-production-aa75.up.railway.app`

The frontend `api.js` was hardcoded to use `/api`, which only works in development (Vite proxy). In production, it needs the full backend URL.

---

## 🔧 Fix Applied:

Updated `frontend/src/services/api.js` to use environment variable:

```javascript
const baseURL = import.meta.env.VITE_API_URL || '/api'
```

---

## ✅ Next Steps:

### 1. Verify Backend URL

In Railway dashboard, find your **backend service** and copy its public URL. It should look like:
```
https://automedic-production-aa75.up.railway.app
```

### 2. Update Frontend Environment Variable

In Railway → **Frontend service** → **Variables** tab:

Add/Update:
```
VITE_API_URL=https://YOUR-BACKEND-URL.up.railway.app/api
```

**Important**: Include `/api` at the end!

### 3. Redeploy Frontend

After updating the environment variable, Railway should auto-redeploy. If not:
- Click "Deploy" → "Redeploy"

### 4. Test Login

Once redeployed, try logging in with:
- **Email**: `admin@automedic.mw`
- **Password**: `automedic2024`

---

## 🔍 How to Check Backend URL:

1. Go to Railway dashboard
2. Click your **backend service** (not frontend)
3. Look for "Settings" → "Domains"
4. Copy the Railway-provided domain (e.g., `xxx-production-xxx.up.railway.app`)

---

## 📋 Full Credentials (After Fix):

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@automedic.mw | automedic2024 |
| Technician | peter@automedic.mw | automedic2024 |
| Technician | charles@automedic.mw | automedic2024 |
| Technician | eric@automedic.mw | automedic2024 |
| Stock Keeper | stockkeeper@automedic.mw | automedic2024 |
| Customer | john@example.com | automedic2024 |

---

## 🧪 Test Backend Directly:

To verify backend is working, test with curl:

```bash
curl -X POST https://YOUR-BACKEND-URL.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@automedic.mw","password":"automedic2024"}'
```

Should return:
```json
{
  "success": true,
  "user": { ... },
  "token": "..."
}
```

---

## ⚠️ Common Mistakes:

1. **Missing `/api` in VITE_API_URL**
   - ❌ Wrong: `https://backend.railway.app`
   - ✅ Right: `https://backend.railway.app/api`

2. **Frontend URL instead of Backend URL**
   - Make sure you're using the BACKEND service URL, not frontend!

3. **Environment variable not set**
   - Must be set in Railway dashboard, not just in local `.env.production`

4. **Frontend not rebuilt after env change**
   - Environment variables are baked into the frontend build
   - Must redeploy frontend after changing `VITE_API_URL`

---

## ✅ Success Check:

After the fix, you should see in browser DevTools → Network tab:
- Request going to: `https://YOUR-BACKEND-URL.up.railway.app/api/auth/login`
- Response: `200 OK` with user data and token

If you see `401 Unauthorized` but request reaches backend, that's a different issue. But `net::ERR_FAILED` or connection errors mean the frontend still can't reach backend.

