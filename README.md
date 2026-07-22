# 🚗 AutoMedic - Garage Management System

A comprehensive full-stack web application for managing automotive garage operations, appointments, inventory, and customer relationships.

## ✨ Features

### Customer Features
- 📱 **Online Booking** - Schedule service appointments
- 🚗 **Vehicle Management** - Track multiple vehicles
- 📊 **Real-time Tracking** - Monitor repair progress with live updates
- 📧 **Email Notifications** - Get updates on appointment status
- 💳 **Online Invoicing** - View and download invoices
- 📋 **Service History** - Access complete vehicle service records
- 🛒 **Products Catalog** - Browse and inquire about parts

### Technician Features
- 📝 **Digital Inspections** - Complete vehicle inspections with photo upload
- 📸 **Progress Photos** - Document repair process
- ⚙️ **Job Cards** - Manage assigned work with progress tracking
- 📱 **Mobile-Friendly** - Access on phones and tablets
- 🔔 **Task Notifications** - Get notified of new assignments

### Admin Features
- 👥 **User Management** - Manage customers, technicians, and staff
- 📅 **Appointment Management** - Schedule and assign technicians
- 📦 **Inventory Control** - Track parts, stock levels, and reordering
- 💰 **Financial Reports** - Revenue, technician performance, expenses
- 📊 **Analytics Dashboard** - Business insights and KPIs
- ⚙️ **Garage Settings** - Configure business info, pricing, and branding
- 📄 **Invoice Generation** - Create and manage invoices

### Stockkeeper Features
- 📦 **Stock Management** - Add, update, and track inventory
- 🔄 **Stock Movements** - Record stock in/out transactions
- ⚠️ **Low Stock Alerts** - Visual indicators for reorder levels
- 📊 **Inventory Reports** - Fast-moving items, stock health

## 🛠️ Tech Stack

### Frontend
- **React** 18.3 with Vite
- **TailwindCSS** - Responsive styling
- **React Router** - Navigation
- **Axios** - API communication
- **Lucide React** - Icons
- **Context API** - State management

### Backend
- **Node.js** with Express
- **SQLite** (development) / **PostgreSQL** (production)
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Multer** - File uploads
- **Nodemailer** - Email notifications
- **Socket.IO** - Real-time updates
- **Firebase Admin** - Push notifications (optional)
- **Passport.js** - OAuth (Google)

### DevOps & Monitoring
- **Sentry** - Error tracking
- **Swagger** - API documentation
- **Jest** - Unit testing
- **Railway** - Deployment (recommended)

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Git

### Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure .env file with your settings
# (See .env.example for all required variables)

# Run database migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed

# Start development server
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000" > .env

# Start development server
npm run dev
```

Frontend runs on `http://localhost:3000`

### Default Login Credentials

After seeding the database:

- **Admin:** `admin@automedic.mw` / `automedic2024`
- **Technician:** `tech@automedic.mw` / `tech2024`
- **Customer:** `customer@automedic.mw` / `customer2024`

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI:** `http://localhost:5000/api-docs`
- **JSON Spec:** `http://localhost:5000/api-docs.json`

## 🧪 Testing

### Run Unit Tests
```bash
cd backend
npm test
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

**Quick Start:**
1. Push code to GitHub
2. Create Railway project
3. Connect GitHub repo
4. Add PostgreSQL database
5. Configure environment variables
6. Deploy!

## 📁 Project Structure

```
AutoMedic/
├── backend/
│   ├── config/          # Configuration files (DB, Passport, Sentry, Swagger)
│   ├── middleware/      # Auth, validation middleware
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic (email, inventory)
│   ├── scripts/         # Utilities (migrations, backups, seeds)
│   ├── database/        # Schema and migrations
│   ├── uploads/         # File uploads (inspection photos, etc.)
│   ├── tests/           # Unit tests
│   └── server.js        # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React Context providers
│   │   ├── pages/       # Page components
│   │   ├── utils/       # Utilities (API client, helpers)
│   │   ├── App.jsx      # Main app component
│   │   └── main.jsx     # Entry point
│   ├── public/          # Static assets (images, icons)
│   └── index.html
│
├── DEPLOYMENT.md        # Deployment guide
└── README.md           # This file
```

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ HTTP-only cookies for tokens
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ Input validation and sanitization
- ✅ Rate limiting (ready for production)
- ✅ Environment variable protection

## 🔧 Maintenance

### Database Backups
```bash
# Create backup
npm run db:backup

# Restore from backup
npm run db:restore
```

### Health Check
```bash
curl http://localhost:5000/api/health
```

## 📊 Features in Detail

### Real-time Tracking
Customers can track their vehicle's repair progress in real-time using WebSocket connections. Updates are pushed instantly when technicians update job cards.

### Digital Inspections
Technicians perform comprehensive vehicle inspections with:
- Pre-service condition assessment
- Photo documentation (before/during/after)
- Customer signature capture
- Digital checklist (lights, brakes, fluids, etc.)

### Inventory Management
- Automatic stock level tracking
- Low stock warnings (color-coded)
- Fast-moving items analysis
- Cost/profit tracking
- Inventory audit logs

### Email Notifications
Automated emails sent for:
- Appointment confirmations
- Job assignments (technicians)
- Repair updates
- Invoice generation
- Appointment reminders

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 📞 Support

- **Email:** support@automedic.mw
- **WhatsApp:** +265 994 040 900
- **Location:** Area 47, Lilongwe, Malawi

## 🎯 Roadmap

### Completed ✅
- Core booking system
- User authentication & authorization
- Vehicle inspections with photos
- Job card management
- Inventory tracking
- Financial reporting
- Real-time repair tracking
- Email notifications
- Responsive design
- Error logging (Sentry)
- API documentation (Swagger)
- Automated backups
- Unit tests

### Planned 🚧
- SMS notifications (Twilio)
- Advanced analytics (charts, trends)
- Customer feedback system
- Loyalty/rewards program
- Integration with accounting software
- Mobile apps (iOS/Android)
- Multi-language support
- Advanced reporting (PDF export)

## 🙏 Acknowledgments

- Icons by [Lucide](https://lucide.dev/)
- UI inspiration from modern SaaS platforms
- Built with passion for the automotive industry

---

**Made with ❤️ for AutoMedic Garage**
