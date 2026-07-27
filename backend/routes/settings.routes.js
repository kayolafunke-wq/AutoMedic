const express = require('express')
const router  = express.Router()
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')

// ── Ensure garage_settings table + all columns exist (handles both old & new schemas) ──
async function ensureGarageSettings () {
  // Create table if missing — union of old and new column names
  await db.query(`
    CREATE TABLE IF NOT EXISTS garage_settings (
      id              VARCHAR(255) PRIMARY KEY,
      garage_name     VARCHAR(255) DEFAULT 'AutoMedic Garage',
      garage_email    VARCHAR(255) DEFAULT 'info@automedic.mw',
      garage_phone    VARCHAR(50)  DEFAULT '+265994040900',
      garage_address  TEXT        DEFAULT 'Area 47, Lilongwe, Malawi',
      garage_whatsapp VARCHAR(50)  DEFAULT '+265994040900',
      garage_hours    TEXT        DEFAULT 'Mon-Sat: 7am-6pm',
      tax_rate        NUMERIC     DEFAULT 16.5,
      currency        VARCHAR(10) DEFAULT 'MWK',
      created_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(() => {})

  // Add any missing columns from either naming scheme
  const cols = [
    `ALTER TABLE garage_settings ADD COLUMN IF NOT EXISTS garage_name     VARCHAR(255) DEFAULT 'AutoMedic Garage'`,
    `ALTER TABLE garage_settings ADD COLUMN IF NOT EXISTS garage_email    VARCHAR(255) DEFAULT 'info@automedic.mw'`,
    `ALTER TABLE garage_settings ADD COLUMN IF NOT EXISTS garage_phone    VARCHAR(50)  DEFAULT '+265994040900'`,
    `ALTER TABLE garage_settings ADD COLUMN IF NOT EXISTS garage_address  TEXT        DEFAULT 'Area 47, Lilongwe, Malawi'`,
    `ALTER TABLE garage_settings ADD COLUMN IF NOT EXISTS garage_whatsapp VARCHAR(50)  DEFAULT '+265994040900'`,
    `ALTER TABLE garage_settings ADD COLUMN IF NOT EXISTS garage_hours    TEXT        DEFAULT 'Mon-Sat: 7am-6pm'`,
    `ALTER TABLE garage_settings ADD COLUMN IF NOT EXISTS tax_rate        NUMERIC     DEFAULT 16.5`,
    `ALTER TABLE garage_settings ADD COLUMN IF NOT EXISTS currency        VARCHAR(10) DEFAULT 'MWK'`,
    `ALTER TABLE garage_settings ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP`,
  ]
  for (const col of cols) { await db.query(col).catch(() => {}) }

  // Seed default row if empty
  await db.query(`
    INSERT INTO garage_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING
  `).catch(() => {})
}

// ── Normalize row: map old column names → unified field names ────────────────
function normalizeSettings (row) {
  if (!row) return {}
  return {
    id:           row.id,
    garage_name:  row.garage_name || 'AutoMedic Garage',
    // phone: prefer new column, fall back to old
    phone:        row.phone        || row.garage_phone    || '+265994040900',
    address:      row.address      || row.garage_address  || 'Area 47, Lilongwe, Malawi',
    whatsapp:     row.whatsapp     || row.garage_whatsapp || '+265994040900',
    working_hours:row.working_hours|| row.garage_hours    || 'Mon-Sat: 7am-6pm',
    email:        row.email        || row.garage_email    || 'info@automedic.mw',
    vat_rate:     Number(row.vat_rate || row.tax_rate     || 16.5),
    currency:     row.currency || 'MWK',
  }
}

// ── GET garage settings (public — used by website footer) ───────────────────
router.get('/garage', async (req, res) => {
  try {
    await ensureGarageSettings()
    const result = await db.query('SELECT * FROM garage_settings WHERE id = $1', ['default'])
    const data = result.rows.length ? normalizeSettings(result.rows[0]) : normalizeSettings({})
    res.json({ success: true, data })
  } catch (err) {
    console.error('Error fetching garage settings:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── PUT update garage settings (admin only) ──────────────────────────────────
router.put('/garage', authenticate, authorize('admin'), async (req, res) => {
  try {
    await ensureGarageSettings()

    const {
      garage_name,
      phone, address, whatsapp, working_hours, email, vat_rate, currency
    } = req.body

    if (!garage_name || !phone || !address || !email) {
      return res.status(400).json({
        success: false,
        message: 'Garage name, phone, address and email are required'
      })
    }

    // Upsert — write to BOTH old and new column names so either schema works
    const existing = await db.query('SELECT id FROM garage_settings WHERE id = $1', ['default'])

    if (existing.rows.length) {
      await db.query(`
        UPDATE garage_settings SET
          garage_name     = $1,
          garage_email    = $2,
          garage_phone    = $3,
          garage_address  = $4,
          garage_whatsapp = $5,
          garage_hours    = $6,
          tax_rate        = $7,
          currency        = $8,
          updated_at      = CURRENT_TIMESTAMP
        WHERE id = $9
      `, [
        garage_name, email, phone, address, whatsapp || phone,
        working_hours, parseFloat(vat_rate) || 16.5, currency || 'MWK', 'default'
      ])
    } else {
      await db.query(`
        INSERT INTO garage_settings
          (id, garage_name, garage_email, garage_phone, garage_address, garage_whatsapp, garage_hours, tax_rate, currency)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `, [
        'default', garage_name, email, phone, address,
        whatsapp || phone, working_hours, parseFloat(vat_rate) || 16.5, currency || 'MWK'
      ])
    }

    const updated = await db.query('SELECT * FROM garage_settings WHERE id = $1', ['default'])
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: normalizeSettings(updated.rows[0])
    })
  } catch (err) {
    console.error('Error updating garage settings:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router