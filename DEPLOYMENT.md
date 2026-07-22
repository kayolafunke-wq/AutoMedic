# AutoMedic Deployment Guide

## 🚀 Deployment Options

### Recommended: Railway (All-in-One)
**Why Railway?**
- ✅ Single platform for frontend, backend, and PostgreSQL
- ✅ No cold starts (always-on)
- ✅ Simpler setup and maintenance
- ✅ Better for monorepo structure
- ✅ Cost: $5-20/month
- ✅ Automatic HTTPS and custom domains
- ✅ Built-in metrics and logs

### Alternative: Render + Supabase
- Frontend: Render (Static Site)
- Backend: Render (Web Service)
- Database: Supabase (PostgreSQL)
- Cost: $7-14/month (Render) + $0-25/month (Supabase)
- More complex setup (3 separate services)
- Render free tier has cold starts (slower)

---

## 📋 Pre-Deployment Checklist

### ✅ High Priority Items (COMPLETED)

- [x] **Sentry Error Tracking**: Configured in `backend/config/sentry.js`
- [x] **API Documentation**: Swagger UI at `/api-docs` (configured in `backend/config/swagger.js`)
- [x] **Database Backups**: Script at `backend/scripts/backup_database.js`
- [x] **Environment Variables**: `.env.example` documented
- [x] **Unit Tests**: Basic tests for auth, appointments, inventory, health checks
- [x] **.gitignore**: `.env` already excluded (verified)

### 🔧 Before Deployment Tasks

1. **Set up automated backups** (if using Railway PostgreSQL):
   ```bash
   # Add to cron or Railway scheduled job
   npm run db:backup
   ```

2. **Configure environment variables** (see below)

3. **Run tests**:
   ```bash
   cd backend
   npm test
   ```

4. **Build frontend**:
   ```bash
   cd frontend
   npm run build
   ```

---

## 🛠️ Railway Deployment (Recommended)

### Step 1: Prepare Your Project

1. **Install Railway CLI** (optional but helpful):
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Update Database Configuration**

   Create `backend/config/db-production.js`:
   ```javascript
   const { Pool } = require('pg');
   
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
   });
   
   module.exports = pool;
   ```

3. **Update `backend/config/db.js`** to use PostgreSQL in production:
   ```javascript
   const isProduction = process.env.NODE_ENV === 'production';
   
   if (isProduction) {
     module.exports = require('./db-production');
   } else {
     // Keep existing SQLite code for development
     const Database = require('better-sqlite3');
     // ... existing code
   }
   ```

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Choose "Deploy from GitHub repo"
4. Select your AutoMedic repository

### Step 3: Add PostgreSQL Database

1. In Railway dashboard, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will create database and set `DATABASE_URL` automatically

### Step 4: Configure Environment Variables

Click on your service → "Variables" tab and add:

```env
# Required
NODE_ENV=production
PORT=5000
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your_production_secret_min_32_chars_random_string
FRONTEND_URL=https://your-app.railway.app

# Email (required for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=AutoMedic <noreply@automedic.mw>

# Garage Info
GARAGE_NAME=AutoMedic Garage
GARAGE_PHONE=+265 994 040 900
GARAGE_ADDRESS=Area 47, Lilongwe, Malawi
GARAGE_WHATSAPP=+265994040900
GARAGE_EMAIL=info@automedic.mw
GARAGE_HOURS=Mon–Sat: 7am – 6pm

# Sentry (optional but recommended)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Firebase Admin SDK (for customer mobile app auth)
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### Step 5: Configure Build Settings

**Backend Service:**
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `node server.js`
- Port: 5000

**Frontend Service:**
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Start Command: `npx serve -s dist -l 3000`
- Port: 3000

### Step 6: Deploy

1. Railway will automatically deploy on git push
2. Or manually trigger: Click "Deploy" button
3. Check deployment logs for errors

### Step 7: Run Database Migrations

After first deployment:

```bash
# Using Railway CLI
railway run npm run db:migrate

# Or via Railway shell (click "..." → "Shell" in dashboard)
cd backend && npm run db:migrate
```

### Step 8: Set Up Custom Domain (Optional)

1. In Railway dashboard → "Settings" → "Domains"
2. Add custom domain or use Railway subdomain
3. Update `FRONTEND_URL` environment variable

---

## 🔐 Security Checklist

- [ ] Change `JWT_SECRET` to strong random string (min 32 chars)
- [ ] Enable HTTPS (Railway does this automatically)
- [ ] Configure CORS properly (update `backend/server.js`)
- [ ] Set up Sentry error tracking
- [ ] Enable rate limiting (already configured)
- [ ] Review and update garage WhatsApp number
- [ ] Set up Firebase Admin SDK for mobile auth
- [ ] Enable database backups (Railway auto-backups included)

---

## 📊 Post-Deployment

### Monitor Your App

1. **Railway Dashboard**: View logs, metrics, and deployment history
2. **Sentry**: Track errors and performance at [sentry.io](https://sentry.io)
3. **API Docs**: Access at `https://your-app.railway.app/api-docs`

### Test Critical Paths

1. ✅ User registration and login
2. ✅ Book appointment as customer
3. ✅ Admin dashboard access
4. ✅ Create/edit services and products
5. ✅ Technician job assignment
6. ✅ Email notifications
7. ✅ Image uploads
8. ✅ Invoice generation

### Database Backups

**Automatic Railway Backups**:
- Railway includes automatic daily backups
- Access via: Dashboard → PostgreSQL → Backups

**Manual Backup Script**:
```bash
# Update for PostgreSQL in backend/scripts/backup_database.js
npm run db:backup
```

**Schedule Backups** (optional):
1. Create new service in Railway
2. Use cron job or Railway's scheduled tasks
3. Run: `npm run db:backup` daily

---

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Fails**
```bash
# Check DATABASE_URL is set
railway variables

# Test connection
railway run node -e "console.log(process.env.DATABASE_URL)"
```

**2. Build Fails**
- Check Node version (use 18.x or 20.x)
- Verify `package.json` scripts
- Check build logs for missing dependencies

**3. CORS Errors**
- Update `FRONTEND_URL` in environment variables
- Check `backend/server.js` CORS configuration

**4. Email Not Sending**
- Verify Gmail app password (not regular password)
- Check email credentials in environment variables
- Test with: `node backend/services/email.service.js`

**5. Images Not Loading**
- For Railway: Use cloud storage (Cloudinary, AWS S3)
- Update image upload to use CDN URLs
- Check `backend/uploads` directory permissions

---

## 💰 Cost Estimates

### Railway (Recommended)
- **Hobby Plan**: $5/month
  - 500 hours execution time
  - 5GB PostgreSQL storage
  - Good for small to medium traffic

- **Pro Plan**: $20/month
  - Unlimited execution time
  - More resources and features
  - Better for production

### Render + Supabase (Alternative)
- **Render**: $7-14/month (Web Service)
- **Supabase**: $0-25/month (free tier available)
- **Total**: $7-39/month

---

## 📈 Scaling Considerations

### When to Scale Up

**Current Setup Good For**:
- ✅ Up to 1,000 appointments/month
- ✅ 50-100 concurrent users
- ✅ Small to medium garage (5-20 technicians)

**Scale Up When**:
- More than 2,000 appointments/month
- 100+ concurrent users
- Multiple garage locations
- Heavy image/file uploads

### Scaling Options

1. **Upgrade Railway Plan**: More CPU/RAM
2. **Add Redis**: Cache frequently accessed data
3. **CDN for Images**: Cloudinary or AWS S3
4. **Load Balancer**: Distribute traffic
5. **Read Replicas**: For database queries

---

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      
      - name: Deploy Backend
        run: railway up --service backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
      
      - name: Run Tests
        run: |
          cd backend
          npm test
```

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [PostgreSQL Migration Guide](https://railway.app/help/postgresql)
- [Sentry Documentation](https://docs.sentry.io)
- [Swagger Documentation](https://swagger.io/docs/)

---

## 🎯 Next Steps After Deployment

1. **Test thoroughly** in production environment
2. **Set up monitoring** (Sentry + Railway metrics)
3. **Configure automated backups**
4. **Add custom domain**
5. **Enable SSL/HTTPS** (automatic on Railway)
6. **Train staff** on using the system
7. **Gather user feedback**
8. **Plan future improvements** (see roadmap below)

---

## 🚀 Future Improvements (Post-Deployment)

### Medium Priority
- [ ] SMS notifications (Twilio integration)
- [ ] Payment gateway (Malawi payment options)
- [ ] Mobile app (React Native)
- [ ] Customer feedback system
- [ ] Advanced analytics dashboard
- [ ] Inventory forecasting
- [ ] Multi-garage support

### Low Priority
- [ ] Integration with accounting software
- [ ] Supplier management
- [ ] Loyalty program
- [ ] Marketing campaigns
- [ ] Mobile technician app

---

## ✅ Deployment Complete!

Your AutoMedic application is now live! 🎉

**Access Points:**
- Frontend: `https://your-app.railway.app`
- API: `https://your-app.railway.app/api`
- API Docs: `https://your-app.railway.app/api-docs`
- Admin Dashboard: `https://your-app.railway.app/admin`

**Default Admin Credentials:**
- Email: (created during seed)
- Password: (check `backend/scripts/seed.js`)

**⚠️ IMPORTANT**: Change default admin password immediately after first login!

---

## 📞 Support

For issues or questions:
- Check `/api-docs` for API reference
- Review Sentry for error logs
- Check Railway logs for deployment issues
- Email: support@automedic.mw
- WhatsApp: +265 994 040 900
