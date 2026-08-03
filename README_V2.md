# 🚗 AutoMedic v2.0 - Garage Management System

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/yourusername/automedic)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Railway](https://img.shields.io/badge/deployed-Railway-blueviolet.svg)](https://railway.app)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)

**Professional garage management system** for vehicle repairs, appointments, inventory, and customer tracking. Built with modern web technologies and deployed on Railway.

---

## ✨ Features

### 🎯 Core Functionality
- ✅ **Customer Portal** - Book appointments, track repairs in real-time
- ✅ **Technician Dashboard** - Manage job cards, update progress, upload inspection photos
- ✅ **Admin Dashboard** - Complete oversight, analytics, user management
- ✅ **Stock Keeper** - Inventory management, checkout logs, adjustments
- ✅ **Real-time Tracking** - WebSocket-powered live repair progress
- ✅ **Email Notifications** - 8 professional templates (welcome, confirmation, invoice, etc.)
- ✅ **Digital Inspections** - Photo uploads, dual-signature workflow
- ✅ **Automated Invoicing** - Auto-generate from completed jobs with VAT
- ✅ **Revenue Analytics** - Charts, reports, financial insights

### 🔒 Security (v2.0)
- ✅ **Token Refresh System** - Short-lived access tokens (15 min)
- ✅ **Revokable Sessions** - Logout from all devices
- ✅ **Dual Authentication** - JWT (staff) + Firebase (customers)
- ✅ **Input Validation** - Client & server-side (Zod)
- ✅ **Rate Limiting** - Protect against brute force
- ✅ **Helmet Security** - XSS, clickjacking protection

### 🚀 Performance (v2.0)
- ✅ **Code Splitting** - 52% faster admin dashboard load
- ✅ **Cloud Storage** - Cloudinary integration with fallback
- ✅ **Database Migrations** - Versioned with rollback support
- ✅ **Optimized Images** - Automatic compression & CDN

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js 4.21
- **Database:** PostgreSQL (Railway)
- **Auth:** JWT + Firebase Admin SDK
- **Real-time:** Socket.IO 4.8
- **Email:** Nodemailer (SMTP)
- **Storage:** Cloudinary (optional)
- **Monitoring:** Sentry
- **API Docs:** Swagger/OpenAPI

### Frontend
- **Framework:** React 18.3
- **Build Tool:** Vite 5.4
- **Styling:** Tailwind CSS 3.4
- **Routing:** React Router 6.26
- **Charts:** Recharts 2.12
- **Validation:** Zod
- **Auth:** Firebase 12.15

---

## 📦 Installation

### Prerequisites
- Node.js 20+
- PostgreSQL (or Railway account)
- Gmail account (for emails)
- Cloudinary account (optional)

### Local Development

```bash
# Clone repository
git clone https://github.com/yourusername/automedic.git
cd automedic

# Install backend dependencies
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials

# Run migrations
npm run db:migrate:new
npm run db:seed:postgres

# Start backend
npm run dev

# Install frontend dependencies (new terminal)
cd ../frontend
npm install
cp .env.example .env

# Start frontend
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Docs: http://localhost:5000/api-docs

---

## 🚀 Deployment (Railway)

### Quick Deploy

```bash
# Push to GitHub
git push origin main

# Add environment variables in Railway
# See .env.production.example

# Run migration (one-time)
railway run npm run db:migrate:new
```

**Full Guide:** See `DEPLOYMENT.md`

---

## 📚 Documentation

| File | Description |
|------|-------------|
| `DEPLOYMENT.md` | Full deployment guide (Railway/Render) |
| `UPGRADE_GUIDE.md` | Upgrade from v1.0 → v2.0 |
| `QUICK_DEPLOY.md` | 10-minute deployment guide |
| `CHANGELOG.md` | Version history & changes |
| `IMPROVEMENTS_SUMMARY.md` | v2.0 improvements detailed |

---

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
# Database
DATABASE_URL=postgresql://...

# JWT Secrets (32+ chars)
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# Email (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=app_password

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Firebase Admin
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN..."
```

**Frontend (.env):**
```env
VITE_API_URL=https://your-backend.railway.app/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
```

Full templates: See `.env.production.example` files

---

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

**Test Coverage:** ~70% (routes, services, middleware)

---

## 📊 API Documentation

Interactive API documentation available at:
- **Local:** http://localhost:5000/api-docs
- **Production:** https://your-app.railway.app/api-docs

**Endpoints:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Book appointment
- `PATCH /api/job-cards/:id/progress` - Update repair progress
- `POST /api/invoices/generate/:id` - Generate invoice
- ... (130+ endpoints total)

---

## 🎨 Screenshots

### Customer Dashboard
![Customer Dashboard](docs/screenshots/customer-dashboard.png)

### Admin Analytics
![Admin Analytics](docs/screenshots/admin-analytics.png)

### Real-time Tracking
![Tracking](docs/screenshots/tracking.png)

---

## 🗺️ Roadmap

### v2.1.0 (Q1 2025)
- [ ] SMS notifications (Twilio)
- [ ] Payment gateway (Malawi providers)
- [ ] Advanced analytics
- [ ] Customer feedback system

### v3.0.0 (Q2 2025)
- [ ] Mobile app (React Native)
- [ ] Multi-garage support
- [ ] Supplier management
- [ ] Accounting software integration

---

## 🤝 Contributing

This is a private/proprietary project. If you have access:

1. Create feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push branch (`git push origin feature/amazing-feature`)
4. Open Pull Request

---

## 📄 License

Proprietary - All Rights Reserved  
© 2024 AutoMedic. Not for public distribution.

---

## 📞 Support

- **Email:** support@automedic.mw
- **Phone:** +265 994 040 900
- **WhatsApp:** +265 994 040 900
- **Issues:** GitHub Issues (if you have access)

---

## 🙏 Acknowledgments

- Built with ❤️ for Malawian garages
- Deployed on [Railway](https://railway.app)
- UI inspired by modern SaaS dashboards
- Email templates based on Tailwind Email Templates

---

## 📈 Project Stats

- **Lines of Code:** ~25,000
- **Components:** 50+
- **API Endpoints:** 130+
- **Database Tables:** 15
- **Email Templates:** 8
- **Test Coverage:** 70%
- **Uptime:** 99.9% (Railway)

---

## 🔄 Version History

| Version | Date | Status | Highlights |
|---------|------|--------|------------|
| 2.0.0 | Dec 2024 | **Latest** | Security & performance improvements |
| 1.0.0 | Nov 2024 | Stable | Initial production release |

See `CHANGELOG.md` for detailed history.

---

**Built with 💪 by the AutoMedic Team**

🚗 Making garage management easier, one repair at a time.
