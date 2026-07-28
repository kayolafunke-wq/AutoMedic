/**
 * Fetch the current VAT rate as a decimal (e.g. 0.175 for 17.5%)
 * from garage_settings. Falls back to 0.165 if not set.
 */
const db = require('../config/db')

async function getVatRate () {
  try {
    const r = await db.query('SELECT tax_rate FROM garage_settings WHERE id = $1', ['default'])
    const raw = r.rows[0]?.tax_rate
    if (raw != null && !isNaN(Number(raw))) {
      return Number(raw) / 100
    }
  } catch {}
  return 0.165 // safe fallback
}

module.exports = { getVatRate }
