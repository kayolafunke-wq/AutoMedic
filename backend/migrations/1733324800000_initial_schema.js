/* eslint-disable camelcase */

exports.up = (pgm) => {
  // This migration ensures all columns exist without breaking existing data
  // Uses IF NOT EXISTS to be idempotent (safe to run multiple times)

  // Job cards enhancements
  pgm.addColumns('job_cards', {
    technician_notes: { type: 'text', ifNotExists: true },
    parts_used: { type: 'text', default: "'[]'", ifNotExists: true },
    estimated_cost: { type: 'numeric', ifNotExists: true },
    final_cost: { type: 'numeric', ifNotExists: true },
    started_at: { type: 'timestamp', ifNotExists: true },
    completed_at: { type: 'timestamp', ifNotExists: true },
  }, { ifNotExists: true })

  // Invoices enhancements
  pgm.addColumns('invoices', {
    items: { type: 'text', default: "'[]'", notNull: true, ifNotExists: true },
    subtotal: { type: 'numeric', default: 0, ifNotExists: true },
    tax: { type: 'numeric', default: 0, ifNotExists: true },
    total: { type: 'numeric', default: 0, ifNotExists: true },
    status: { type: 'text', default: "'unpaid'", ifNotExists: true },
    paid_at: { type: 'timestamp', ifNotExists: true },
    updated_at: { type: 'timestamp', ifNotExists: true },
  }, { ifNotExists: true })

  // Create stock_checkouts table if not exists
  pgm.createTable('stock_checkouts', {
    id: { type: 'varchar(255)', primaryKey: true },
    type: { type: 'text', notNull: true, default: "'job_card'" },
    job_card_id: { type: 'varchar(255)' },
    appointment_id: { type: 'varchar(255)' },
    customer_id: { type: 'varchar(255)' },
    customer_name: { type: 'text' },
    items: { type: 'text', notNull: true, default: "'[]'" },
    subtotal: { type: 'numeric', default: 0 },
    tax: { type: 'numeric', default: 0 },
    total: { type: 'numeric', default: 0 },
    invoice_id: { type: 'varchar(255)' },
    notes: { type: 'text' },
    created_by: { type: 'varchar(255)' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  }, { ifNotExists: true })

  // Create inventory_logs table if not exists
  pgm.createTable('inventory_logs', {
    id: { type: 'varchar(255)', primaryKey: true },
    product_id: { type: 'varchar(255)', notNull: true },
    type: { type: 'varchar(50)', notNull: true, default: "'stock_out'" },
    qty_change: { type: 'integer', notNull: true, default: 0 },
    qty_before: { type: 'integer', notNull: true, default: 0 },
    qty_after: { type: 'integer', notNull: true, default: 0 },
    reason: { type: 'text' },
    reference: { type: 'text' },
    created_by: { type: 'varchar(255)' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  }, { ifNotExists: true })

  // Create repair_updates table if not exists
  pgm.createTable('repair_updates', {
    id: { type: 'varchar(255)', primaryKey: true },
    job_card_id: { type: 'varchar(255)', notNull: true },
    updated_by: { type: 'varchar(255)' },
    status: { type: 'text', notNull: true },
    note: { type: 'text' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  }, { ifNotExists: true })

  // Create inspection_photos table if not exists
  pgm.createTable('inspection_photos', {
    id: { type: 'varchar(255)', primaryKey: true },
    inspection_id: { type: 'varchar(255)', notNull: true },
    photo_type: { type: 'varchar(50)', default: "'before'" },
    file_url: { type: 'text', notNull: true },
    file_name: { type: 'text' },
    uploaded_by: { type: 'varchar(255)' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  }, { ifNotExists: true })

  // Create garage_settings table if not exists
  pgm.createTable('garage_settings', {
    id: { type: 'varchar(255)', primaryKey: true },
    key: { type: 'varchar(255)', unique: true, notNull: true },
    value: { type: 'text' },
    updated_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  }, { ifNotExists: true })

  // Create refresh_tokens table for secure token management
  pgm.createTable('refresh_tokens', {
    id: { type: 'varchar(255)', primaryKey: true },
    user_id: { type: 'varchar(255)', notNull: true },
    token: { type: 'text', notNull: true, unique: true },
    expires_at: { type: 'timestamp', notNull: true },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  }, { ifNotExists: true })

  // Add indexes for performance
  pgm.createIndex('inventory_logs', 'product_id', { ifNotExists: true })
  pgm.createIndex('inventory_logs', 'type', { ifNotExists: true })
  pgm.createIndex('inventory_logs', 'created_at', { ifNotExists: true })
  pgm.createIndex('refresh_tokens', 'user_id', { ifNotExists: true })
  pgm.createIndex('refresh_tokens', 'expires_at', { ifNotExists: true })
}

exports.down = (pgm) => {
  // Rollback - remove only what this migration added
  pgm.dropTable('refresh_tokens', { ifExists: true })
  pgm.dropTable('garage_settings', { ifExists: true })
  pgm.dropTable('inspection_photos', { ifExists: true })
  pgm.dropTable('repair_updates', { ifExists: true })
  pgm.dropTable('inventory_logs', { ifExists: true })
  pgm.dropTable('stock_checkouts', { ifExists: true })
}
