const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '../automedic.db'));

console.log('Starting migration to fix foreign key references pointing to users_old...');

// Disable foreign key enforcement for the duration of the schema changes
db.pragma('foreign_keys = OFF');

const runMigration = db.transaction(() => {
  // 1. Rebuild vehicles
  db.prepare('ALTER TABLE vehicles RENAME TO vehicles_old').run();
  db.prepare(`
    CREATE TABLE vehicles (
      id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      customer_id         TEXT REFERENCES users(id) ON DELETE CASCADE,
      make                TEXT NOT NULL,
      model               TEXT NOT NULL,
      year                INTEGER,
      color               TEXT,
      registration_number TEXT UNIQUE NOT NULL,
      chassis_number      TEXT,
      created_at          TEXT DEFAULT (datetime('now'))
    )
  `).run();
  db.prepare(`
    INSERT INTO vehicles (id, customer_id, make, model, year, color, registration_number, chassis_number, created_at)
    SELECT id, customer_id, make, model, year, color, registration_number, chassis_number, created_at FROM vehicles_old
  `).run();
  db.prepare('DROP TABLE vehicles_old').run();
  console.log('  ✓ Rebuilt vehicles table successfully');

  // 2. Rebuild appointments
  db.prepare('ALTER TABLE appointments RENAME TO appointments_old').run();
  db.prepare(`
    CREATE TABLE appointments (
      id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tracking_number     TEXT UNIQUE NOT NULL,
      customer_id         TEXT REFERENCES users(id) ON DELETE CASCADE,
      vehicle_id          TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
      service_id          TEXT REFERENCES services(id) ON DELETE SET NULL,
      technician_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
      preferred_date      TEXT NOT NULL,
      problem_description TEXT,
      status              TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','in_progress','completed','cancelled')),
      created_at          TEXT DEFAULT (datetime('now')),
      updated_at          TEXT DEFAULT (datetime('now'))
    )
  `).run();
  db.prepare(`
    INSERT INTO appointments (id, tracking_number, customer_id, vehicle_id, service_id, technician_id, preferred_date, problem_description, status, created_at, updated_at)
    SELECT id, tracking_number, customer_id, vehicle_id, service_id, technician_id, preferred_date, problem_description, status, created_at, updated_at FROM appointments_old
  `).run();
  db.prepare('DROP TABLE appointments_old').run();
  console.log('  ✓ Rebuilt appointments table successfully');

  // 3. Rebuild inspections
  db.prepare('ALTER TABLE inspections RENAME TO inspections_old').run();
  db.prepare(`
    CREATE TABLE inspections (
      id                 TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      reference_number   TEXT UNIQUE NOT NULL,
      appointment_id     TEXT REFERENCES appointments(id) ON DELETE CASCADE,
      vehicle_id         TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
      customer_id        TEXT REFERENCES users(id) ON DELETE CASCADE,
      advisor_id         TEXT REFERENCES users(id) ON DELETE SET NULL,
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
    )
  `).run();
  db.prepare(`
    INSERT INTO inspections (id, reference_number, appointment_id, vehicle_id, customer_id, advisor_id, odometer_reading, fuel_level, damage_notes, checklist, accessories, valuables_notes, customer_signature, advisor_signature, customer_signed_at, status, created_at)
    SELECT id, reference_number, appointment_id, vehicle_id, customer_id, advisor_id, odometer_reading, fuel_level, damage_notes, checklist, accessories, valuables_notes, customer_signature, advisor_signature, customer_signed_at, status, created_at FROM inspections_old
  `).run();
  db.prepare('DROP TABLE inspections_old').run();
  console.log('  ✓ Rebuilt inspections table successfully');

  // 4. Rebuild inspection_photos
  db.prepare('ALTER TABLE inspection_photos RENAME TO inspection_photos_old').run();
  db.prepare(`
    CREATE TABLE inspection_photos (
      id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      inspection_id TEXT REFERENCES inspections(id) ON DELETE CASCADE,
      photo_type    TEXT CHECK(photo_type IN ('before','during','after','damage','dashboard')),
      file_url      TEXT NOT NULL,
      uploaded_by   TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at    TEXT DEFAULT (datetime('now'))
    )
  `).run();
  db.prepare(`
    INSERT INTO inspection_photos (id, inspection_id, photo_type, file_url, uploaded_by, created_at)
    SELECT id, inspection_id, photo_type, file_url, uploaded_by, created_at FROM inspection_photos_old
  `).run();
  db.prepare('DROP TABLE inspection_photos_old').run();
  console.log('  ✓ Rebuilt inspection_photos table successfully');

  // 5. Rebuild job_cards
  db.prepare('ALTER TABLE job_cards RENAME TO job_cards_old').run();
  db.prepare(`
    CREATE TABLE job_cards (
      id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      appointment_id   TEXT REFERENCES appointments(id) ON DELETE CASCADE,
      technician_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
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
    )
  `).run();
  db.prepare(`
    INSERT INTO job_cards (id, appointment_id, technician_id, progress, status, technician_notes, parts_used, estimated_cost, final_cost, started_at, completed_at, created_at, updated_at)
    SELECT id, appointment_id, technician_id, progress, status, technician_notes, parts_used, estimated_cost, final_cost, started_at, completed_at, created_at, updated_at FROM job_cards_old
  `).run();
  db.prepare('DROP TABLE job_cards_old').run();
  console.log('  ✓ Rebuilt job_cards table successfully');

  // 6. Rebuild repair_updates
  db.prepare('ALTER TABLE repair_updates RENAME TO repair_updates_old').run();
  db.prepare(`
    CREATE TABLE repair_updates (
      id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      job_card_id TEXT REFERENCES job_cards(id) ON DELETE CASCADE,
      updated_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
      status      TEXT NOT NULL,
      note        TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    )
  `).run();
  db.prepare(`
    INSERT INTO repair_updates (id, job_card_id, updated_by, status, note, created_at)
    SELECT id, job_card_id, updated_by, status, note, created_at FROM repair_updates_old
  `).run();
  db.prepare('DROP TABLE repair_updates_old').run();
  console.log('  ✓ Rebuilt repair_updates table successfully');

  // 7. Rebuild notifications
  db.prepare('ALTER TABLE notifications RENAME TO notifications_old').run();
  db.prepare(`
    CREATE TABLE notifications (
      id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
      title      TEXT NOT NULL,
      message    TEXT NOT NULL,
      type       TEXT,
      is_read    INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
    SELECT id, user_id, title, message, type, is_read, created_at FROM notifications_old
  `).run();
  db.prepare('DROP TABLE notifications_old').run();
  console.log('  ✓ Rebuilt notifications table successfully');

  // 8. Rebuild invoices
  db.prepare('ALTER TABLE invoices RENAME TO invoices_old').run();
  db.prepare(`
    CREATE TABLE invoices (
      id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      invoice_number TEXT UNIQUE NOT NULL,
      appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
      customer_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
      items          TEXT NOT NULL DEFAULT '[]',
      subtotal       REAL DEFAULT 0,
      tax            REAL DEFAULT 0,
      total          REAL DEFAULT 0,
      status         TEXT DEFAULT 'unpaid' CHECK(status IN ('unpaid','paid','partial')),
      created_at     TEXT DEFAULT (datetime('now')),
      paid_at        TEXT,
      updated_at     TEXT
    )
  `).run();
  db.prepare(`
    INSERT INTO invoices (id, invoice_number, appointment_id, customer_id, items, subtotal, tax, total, status, created_at, paid_at, updated_at)
    SELECT id, invoice_number, appointment_id, customer_id, items, subtotal, tax, total, status, created_at, paid_at, updated_at FROM invoices_old
  `).run();
  db.prepare('DROP TABLE invoices_old').run();
  console.log('  ✓ Rebuilt invoices table successfully');

  // 9. Rebuild stock_checkouts
  db.prepare('ALTER TABLE stock_checkouts RENAME TO stock_checkouts_old').run();
  db.prepare(`
    CREATE TABLE stock_checkouts (
      id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      type          TEXT NOT NULL CHECK(type IN ('job_card','walkin')),
      job_card_id   TEXT REFERENCES job_cards(id) ON DELETE SET NULL,
      appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
      customer_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
      customer_name TEXT,
      items         TEXT NOT NULL DEFAULT '[]',
      subtotal      REAL DEFAULT 0,
      tax           REAL DEFAULT 0,
      total         REAL DEFAULT 0,
      invoice_id    TEXT REFERENCES invoices(id) ON DELETE SET NULL,
      notes         TEXT,
      created_by    TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at    TEXT DEFAULT (datetime('now'))
    )
  `).run();
  db.prepare(`
    INSERT INTO stock_checkouts (id, type, job_card_id, appointment_id, customer_id, customer_name, items, subtotal, tax, total, invoice_id, notes, created_by, created_at)
    SELECT id, type, job_card_id, appointment_id, customer_id, customer_name, items, subtotal, tax, total, invoice_id, notes, created_by, created_at FROM stock_checkouts_old
  `).run();
  db.prepare('DROP TABLE stock_checkouts_old').run();
  console.log('  ✓ Rebuilt stock_checkouts table successfully');
});

try {
  runMigration();
  console.log('\nMigration completed successfully!');
} catch (err) {
  console.error('\nMigration failed!', err);
  db.close();
  process.exit(1);
}

// Re-enable foreign key enforcement
db.pragma('foreign_keys = ON');

// Verify foreign keys database-wide
console.log('Running final foreign key check...');
const fkErrors = db.pragma('foreign_key_check');
if (fkErrors.length > 0) {
  console.error('\n⚠️ Foreign key validation check failed! Broken references remain:', fkErrors);
  db.close();
  process.exit(1);
} else {
  console.log('\n✓ Schema validation complete. All foreign key references are valid and healthy!');
}

db.close();
