const express = require('express')
const router = express.Router()
const db = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')

// Get garage settings
router.get('/garage', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM garage_settings 
      WHERE id = $1
    `, ['default'])

    if (!result.rows.length) {
      // Return default settings if none exist
      const defaults = {
        garage_name: 'AutoMedic Garage',
        phone: '+265 999 000 000',
        address: 'Area 47, Lilongwe, Malawi',
        whatsapp: '+265999000000',
        working_hours: 'Mon–Sat: 7am – 6pm',
        email: 'info@automedic.mw',
        vat_rate: 16.5,
        currency: 'MK'
      }
      
      res.json({ success: true, data: defaults })
      return
    }

    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    console.error('Error fetching garage settings:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch settings' })
  }
})

// Update garage settings (admin only)
router.put('/garage', authenticate, authorize('admin'), async (req, res) => {
  try {
    const {
      garage_name,
      phone,
      address,
      whatsapp,
      working_hours,
      email,
      vat_rate,
      currency
    } = req.body

    // Validate required fields
    if (!garage_name || !phone || !address || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Garage name, phone, address, and email are required' 
      })
    }

    // Check if settings exist
    const existing = await db.query(`
      SELECT id FROM garage_settings WHERE id = $1
    `, ['default'])

    if (existing.rows.length) {
      // Update existing settings
      await db.query(`
        UPDATE garage_settings SET
          garage_name = $1,
          phone = $2,
          address = $3,
          whatsapp = $4,
          working_hours = $5,
          email = $6,
          vat_rate = $7,
          currency = $8,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
      `, [
        garage_name,
        phone,
        address,
        whatsapp,
        working_hours,
        email,
        parseFloat(vat_rate) || 16.5,
        currency,
        'default'
      ])
    } else {
      // Insert new settings
      await db.query(`
        INSERT INTO garage_settings (
          id, garage_name, phone, address, whatsapp, 
          working_hours, email, vat_rate, currency
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        'default',
        garage_name,
        phone,
        address,
        whatsapp,
        working_hours,
        email,
        parseFloat(vat_rate) || 16.5,
        currency
      ])
    }

    // Fetch updated settings
    const updated = await db.query(`
      SELECT * FROM garage_settings WHERE id = $1
    `, ['default'])

    res.json({ 
      success: true, 
      message: 'Settings updated successfully', 
      data: updated.rows[0]
    })
  } catch (err) {
    console.error('Error updating garage settings:', err)
    res.status(500).json({ success: false, message: 'Failed to update settings' })
  }
})

module.exports = router