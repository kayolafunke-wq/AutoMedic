-- AutoMedic Database Schema
-- PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS (all roles)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'technician', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- VEHICLES
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INTEGER,
  color VARCHAR(30),
  registration_number VARCHAR(20) UNIQUE NOT NULL,
  chassis_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- SERVICES
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2),
  duration_hours DECIMAL(4,1),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PRODUCTS
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  image_url VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- APPOINTMENTS
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID REFERENCES users(id),
  vehicle_id UUID REFERENCES vehicles(id),
  service_id UUID REFERENCES services(id),
  technician_id UUID REFERENCES users(id),
  preferred_date DATE NOT NULL,
  problem_description TEXT,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- INSPECTIONS
CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_number VARCHAR(20) UNIQUE NOT NULL,
  appointment_id UUID REFERENCES appointments(id),
  vehicle_id UUID REFERENCES vehicles(id),
  customer_id UUID REFERENCES users(id),
  advisor_id UUID REFERENCES users(id),
  odometer_reading INTEGER,
  fuel_level VARCHAR(10),
  damage_notes JSONB DEFAULT '[]',
  checklist JSONB DEFAULT '{}',
  accessories JSONB DEFAULT '{}',
  valuables_notes TEXT,
  customer_signature TEXT,
  advisor_signature TEXT,
  customer_signed_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','customer_signed','completed')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- INSPECTION PHOTOS
CREATE TABLE inspection_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
  photo_type VARCHAR(30) CHECK (photo_type IN ('before','during','after','damage','dashboard')),
  file_url VARCHAR(255) NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- JOB CARDS
CREATE TABLE job_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id),
  technician_id UUID REFERENCES users(id),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending','diagnosis','parts_ordered','in_progress','quality_check','ready','completed')),
  technician_notes TEXT,
  parts_used JSONB DEFAULT '[]',
  estimated_cost DECIMAL(10,2),
  final_cost DECIMAL(10,2),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- REPAIR UPDATES (timeline)
CREATE TABLE repair_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_card_id UUID REFERENCES job_cards(id) ON DELETE CASCADE,
  updated_by UUID REFERENCES users(id),
  status VARCHAR(50) NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- INVOICES
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(20) UNIQUE NOT NULL,
  appointment_id UUID REFERENCES appointments(id),
  customer_id UUID REFERENCES users(id),
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  total DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','partial')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_job_cards_technician ON job_cards(technician_id);
CREATE INDEX idx_job_cards_status ON job_cards(status);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_vehicles_customer ON vehicles(customer_id);
