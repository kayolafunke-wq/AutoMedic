# AutoMedic — Garage Management Platform

A full-stack workshop management system for AutoMedic Garage (Lilongwe, Malawi). Customers book services and track repairs; admins assign jobs and view revenue; technicians run inspections and update progress.

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Socket.IO client, Firebase Auth (customers)
- **Backend:** Express.js, SQLite (`better-sqlite3`), JWT auth, Socket.IO
- **Database:** SQLite file at `backend/automedic.db` (auto-created on migrate)

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
npm install
npm run db:migrate    # Creates SQLite database and all tables
npm run db:seed       # Seeds demo users, services, and products
npm run dev           # Starts API on http://localhost:5000
```

Optional: copy `backend/.env.example` to `backend/.env` and set `JWT_SECRET`, `FRONTEND_URL`, and Firebase credentials if needed.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev           # Starts frontend on http://localhost:3000
```

The Vite dev server proxies `/api` and `/socket.io` to the backend automatically.

### 3. Google / Firebase Auth (customers)

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Email/Password and Google sign-in
3. Add your Firebase config to `frontend/src/config/firebase.js`
4. Set `FIREBASE_*` env vars in `backend/.env` for token verification

Admin and technician accounts use **backend login only** (no Firebase required).

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
- Live tracking: Socket.IO on `/socket.io` (proxied in dev)

## Workflow Overview

1. **Customer** signs up → books appointment → receives tracking number
2. **Admin** accepts booking → assigns technician → job card + inspection record created
3. **Technician** completes vehicle inspection → customer signs off (on-site or via dashboard)
4. **Technician** updates repair progress → customer sees live updates via Socket.IO
5. **Admin** marks job complete → generates invoice → revenue tracked on Revenue page
