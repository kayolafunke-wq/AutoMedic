# 🚀 AutoMedic Railway Deployment Guide

## ✅ Backend Already Deployed!

Your backend is live at: `https://automedic-production-aa75.up.railway.app`

---

## 📋 Task 3: Add Initial Services and Products

### Run the Seed Script in Railway Console:

1. Go to Railway Dashboard
2. Click on **AutoMedic** service (backend)
3. Click **Console** tab
4. Run this command:

```bash
node scripts/seed-initial-data.js
```

### What This Script Does:

**Creates 8 Services:**
- Oil Change (MWK 15,000 - 30 min)
- Brake Service (MWK 35,000 - 60 min)
- Tire Rotation (MWK 8,000 - 20 min)
- Engine Diagnostic (MWK 12,000 - 45 min)
- Battery Replacement (MWK 25,000 - 30 min)
- Air Conditioning Service (MWK 45,000 - 90 min)
- Wheel Alignment (MWK 18,000 - 45 min)
- Transmission Service (MWK 40,000 - 90 min)

**Creates 10 Products:**
- Engine Oil 5W-30 (MWK 12,000 - Stock: 50)
- Oil Filter (MWK 2,500 - Stock: 100)
- Brake Pads Front (MWK 18,000 - Stock: 30)
- Brake Pads Rear (MWK 16,000 - Stock: 30)
- Car Battery 12V (MWK 35,000 - Stock: 15)
- Air Filter (MWK 3,500 - Stock: 60)
- Spark Plugs Set (MWK 8,000 - Stock: 40)
- Windshield Wipers (MWK 4,500 - Stock: 50)
- Coolant 5L (MWK 6,500 - Stock: 40)
- Brake Fluid (MWK 3,000 - Stock: 35)

---

## 🎯 Task 1: Deploy Frontend to Railway

### Step 1: Create New Service in Railway

1. Go to your Railway Dashboard
2. Click **"+ New"** button (top right)
3. Select **"GitHub Repo"**
4. Choose **"kayolafunke-wq/AutoMedic"** repository
5. Click **"Add Service"**

### Step 2: Configure Frontend Service

Once the service is created:

#### A. Set Root Directory:
1. Click on the new service
2. Go to **Settings** tab
3. Scroll to **"Source"** section
4. Click **"Configure"** next to "Root Directory"
5. Set to: `frontend`
6. Click **"Save"**

#### B. Set Environment Variables:
1. Click **"Variables"** tab
2. Add this variable:
   - **Key:** `NODE_ENV`
   - **Value:** `production`

The API URL is already configured in `frontend/.env.production`

#### C. Configure Build Settings:

Railway will automatically detect the build from `frontend/nixpacks.toml`, but verify:

- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npx serve -s dist -l $PORT`
- **Node Version:** 20.x (from nixpacks.toml)

### Step 3: Deploy

1. Railway will automatically start deploying
2. Wait for build to complete (usually 2-5 minutes)
3. Check deployment logs for any errors

### Step 4: Generate Public Domain

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Your frontend URL will be something like:
   ```
   automedic-frontend-production-xxxx.up.railway.app
   ```

### Step 5: Test Frontend

1. Visit your frontend URL
2. You should see the AutoMedic login page
3. Try logging in with your admin credentials:
   - **Email:** kayolafunke@gmail.com
   - **Password:** panda@2026

---

## 🔧 Troubleshooting

### Frontend Build Fails:

**Check Node Version:**
- Railway should use Node 20.x from nixpacks.toml
- If not, add to Settings → Deploy → Custom Build Command

**Check Environment Variables:**
- Ensure `NODE_ENV=production` is set
- The API URL is in `.env.production` and will be bundled during build

**Missing Dependencies:**
- Railway should run `npm ci` automatically
- Check logs for missing packages

### Frontend Shows "Cannot Connect to API":

**CORS Issue:**
1. In Railway, go to backend service
2. Click **Variables** tab
3. Verify `FRONTEND_URL` is set to your frontend domain
4. Update if needed:
   ```
   FRONTEND_URL=https://your-frontend-url.up.railway.app
   ```
5. Backend will auto-redeploy

**Wrong API URL:**
1. Check `frontend/.env.production` has correct backend URL
2. Rebuild frontend if you changed it

### Frontend Shows 404 on Refresh:

This is expected with SPAs. You need a redirect rule:

**Option 1: Create _redirects file:**
```bash
# In frontend/public/_redirects
/*    /index.html   200
```

**Option 2: Use serve with -s flag** (already configured in nixpacks.toml)

---

## 📊 Complete Deployment Architecture

```
┌─────────────────────────────────────────────┐
│           Railway Project                    │
├─────────────────────────────────────────────┤
│                                              │
│  ┌────────────────┐      ┌────────────────┐│
│  │   Frontend     │      │    Backend     ││
│  │   (Vite/React) │─────→│   (Node.js)    ││
│  │                │      │                ││
│  │  Port: Auto    │      │  Port: 8080    ││
│  └────────────────┘      └────────┬───────┘│
│                                   │         │
│                                   ↓         │
│                          ┌────────────────┐ │
│                          │   PostgreSQL   │ │
│                          │   (Database)   │ │
│                          └────────────────┘ │
│                                              │
└─────────────────────────────────────────────┘
```

**Public URLs:**
- Frontend: `https://automedic-frontend-production-xxxx.up.railway.app`
- Backend: `https://automedic-production-aa75.up.railway.app`
- API Docs: `https://automedic-production-aa75.up.railway.app/api-docs`

---

## ✅ Final Checklist

### Backend (Already Complete):
- [x] Deployed to Railway
- [x] PostgreSQL connected
- [x] Migrations run (23/23 tables)
- [x] Admin user created
- [x] Health check working
- [x] Swagger docs accessible
- [ ] Run seed script for initial data

### Frontend (To Do):
- [ ] Create new service in Railway
- [ ] Set root directory to `frontend`
- [ ] Configure environment variables
- [ ] Deploy and generate domain
- [ ] Test login with admin credentials
- [ ] Verify API connectivity
- [ ] Update CORS in backend if needed

---

## 🎉 Once Complete

You'll have a fully deployed AutoMedic system:

1. **Admin Portal** - Manage garage operations
2. **Customer Portal** - Book appointments, view vehicles
3. **API Backend** - RESTful API with documentation
4. **PostgreSQL Database** - Persistent data storage
5. **Real-time Updates** - WebSocket support for live tracking

---

## 📞 Need Help?

- **Railway Docs:** https://docs.railway.app
- **Check Logs:** Railway Dashboard → Service → Deploy Logs
- **API Testing:** Use `/api-docs` for interactive testing

---

## 💰 Cost Estimate

**Current Usage (Railway Hobby Plan - $5/month):**
- Backend Service: ~$2-3/month
- Frontend Service: ~$1-2/month
- PostgreSQL: ~$1-2/month

**Total: $5/month** for complete deployment

If traffic grows, upgrade to Pro Plan ($20/month) for unlimited resources.

