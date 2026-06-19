# AutoMedic — Garage Management Platform

## Setup Instructions

### 1. PostgreSQL Setup
1. Open pgAdmin or psql
2. Create database: `CREATE DATABASE automedic_db;`
3. Update `backend/.env` with your PostgreSQL password

### 2. Backend Setup
```bash
cd backend
npm install

# Update .env with your DB password first, then:
npm run db:migrate    # Creates all tables
npm run db:seed       # Seeds demo data
npm run dev           # Starts backend on port 5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev           # Starts frontend on port 3000
```

### 4. Google OAuth Setup (optional)
1. Go to https://console.cloud.google.com
2. Create OAuth 2.0 credentials
3. Add `http://localhost:5000/api/auth/google/callback` as redirect URI
4. Copy Client ID and Secret to `backend/.env`

## Default Credentials (after seeding)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@automedic.mw | automedic2024 |
| Technician | peter@automedic.mw | automedic2024 |
| Customer | john@example.com | automedic2024 |

## URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- API Health: http://localhost:5000/api/health
