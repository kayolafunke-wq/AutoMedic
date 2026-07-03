-- AutoMedic SQLite Schema

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT,
  password_hash TEXT,
  google_id     TEXT UNIQUE,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','technician','admin','stockkeeper')),
  is_active     INTEGER DEFAULT 1,
  last_login    TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vehicles (
  id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  customer_id         TEXT REFERENCES users(id) ON DELETE CASCADE,
  make                TEXT NOT NULL,
  model               TEXT NOT NULL,
  year                INTEGER,
  color               TEXT,
  registration_number TEXT UNIQUE NOT NULL,
  chassis_number      TEXT,
  created_at          TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS services (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name           TEXT NOT NULL,
  description    TEXT,
  category       TEXT DEFAULT 'general',
  base_price     REAL,
  duration_hours REAL,
  is_active      INTEGER DEFAULT 1,
  created_at     TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name           TEXT NOT NULL,
  description    TEXT,
  category       TEXT,
  price          REAL,
  stock_quantity INTEGER DEFAULT 0,
  image_url      TEXT,
  is_active      INTEGER DEFAULT 1,
  created_at     TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS appointments (
  id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tracking_number     TEXT UNIQUE NOT NULL,
  customer_id         TEXT REFERENCES users(id),
  vehicle_id          TEXT REFERENCES vehicles(id),
  service_id          TEXT REFERENCES services(id),
  technician_id       TEXT REFERENCES users(id),
  preferred_date      TEXT NOT NULL,
  problem_description TEXT,
  status              TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','in_progress','completed','cancelled')),
  created_at          TEXT DEFAULT (datetime('now')),
  updated_at          TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inspections (
  id                 TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  reference_number   TEXT UNIQUE NOT NULL,
  appointment_id     TEXT REFERENCES appointments(id),
  vehicle_id         TEXT REFERENCES vehicles(id),
  customer_id        TEXT REFERENCES users(id),
  advisor_id         TEXT REFERENCES users(id),
  odometer_reading   INTEGER,
  fuel_level         TEXT,
  damage_notes       TEXT DEFAULT '[]',
  checklist          TEXT DEFAULT '{}',
  accessories        TEXT DEFAULT '{}',
  valuables_notes    TEXT,
  customer_signature TEXT,
  advisor_signature  TEXT,
  customer_signed_at TEXT,
  status             TEXT DEFAULT 'pending' CHECK(status IN ('pending','customer_signed','completed')),
  created_at         TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inspection_photos (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  inspection_id TEXT REFERENCES inspections(id) ON DELETE CASCADE,
  photo_type    TEXT CHECK(photo_type IN ('before','during','after','damage','dashboard')),
  file_url      TEXT NOT NULL,
  uploaded_by   TEXT REFERENCES users(id),
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS job_cards (
  id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  appointment_id   TEXT REFERENCES appointments(id),
  technician_id    TEXT REFERENCES users(id),
  progress         INTEGER DEFAULT 0,
  status           TEXT DEFAULT 'pending',
  technician_notes TEXT,
  parts_used       TEXT DEFAULT '[]',
  estimated_cost   REAL,
  final_cost       REAL,
  started_at       TEXT,
  completed_at     TEXT,
  created_at       TEXT DEFAULT (datetime('now')),
  updated_at       TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS repair_updates (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  job_card_id TEXT REFERENCES job_cards(id) ON DELETE CASCADE,
  updated_by  TEXT REFERENCES users(id),
  status      TEXT NOT NULL,
  note        TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT,
  is_read    INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  invoice_number TEXT UNIQUE NOT NULL,
  appointment_id TEXT REFERENCES appointments(id),
  customer_id    TEXT REFERENCES users(id),
  items          TEXT NOT NULL DEFAULT '[]',
  subtotal       REAL DEFAULT 0,
  tax            REAL DEFAULT 0,
  total          REAL DEFAULT 0,
  status         TEXT DEFAULT 'unpaid' CHECK(status IN ('unpaid','paid','partial')),
  paid_at        TEXT,
  updated_at     TEXT,
  created_at     TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stock_checkouts (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  type           TEXT NOT NULL CHECK(type IN ('job_card','walkin')),
  job_card_id    TEXT REFERENCES job_cards(id),
  appointment_id TEXT REFERENCES appointments(id),
  customer_id    TEXT REFERENCES users(id),
  customer_name  TEXT,
  items          TEXT NOT NULL DEFAULT '[]',
  subtotal       REAL DEFAULT 0,
  tax            REAL DEFAULT 0,
  total          REAL DEFAULT 0,
  invoice_id     TEXT REFERENCES invoices(id),
  notes          TEXT,
  created_by     TEXT REFERENCES users(id),
  created_at     TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email         ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role          ON users(role);
CREATE INDEX IF NOT EXISTS idx_appts_customer      ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appts_tracking      ON appointments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_appts_status        ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_jc_tech             ON job_cards(technician_id);
CREATE INDEX IF NOT EXISTS idx_notifs_user         ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_reg        ON vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_checkouts_created_by ON stock_checkouts(created_by);
CREATE INDEX IF NOT EXISTS idx_checkouts_customer  ON stock_checkouts(customer_id);
CREATE INDEX IF NOT EXISTS idx_checkouts_job_card  ON stock_checkouts(job_card_id);
