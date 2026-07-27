const express = require('express')
const router = express.Router()
const db = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')

// GET cleanup duplicate job cards
router.get('/cleanup-duplicate-jobs', authenticate, authorize('admin'), async (req, res) => {
  try {
    const regFilter = req.query.registration || req.query.reg || 'JK 2345'
    
    // Find duplicate job cards
    let duplicates
    if (regFilter) {
      duplicates = await db.query(`
        SELECT jc.id, jc.created_at
        FROM job_cards jc
        LEFT JOIN appointments a ON jc.appointment_id = a.id
        LEFT JOIN vehicles v ON a.vehicle_id = v.id
        WHERE (v.registration_number = $1 OR $1 IS NULL)
          AND jc.id NOT IN (
            SELECT id FROM (
              SELECT jc2.id, ROW_NUMBER() OVER (PARTITION BY jc2.appointment_id ORDER BY jc2.created_at ASC) as rn
              FROM job_cards jc2
              LEFT JOIN appointments a2 ON jc2.appointment_id = a2.id
              LEFT JOIN vehicles v2 ON a2.vehicle_id = v2.id
              WHERE v2.registration_number = $1
            ) sub WHERE sub.rn = 1
          )
      `, [regFilter])
    } else {
      duplicates = await db.query(`
        SELECT jc.id, jc.created_at
        FROM job_cards jc
        WHERE jc.id NOT IN (
          SELECT id FROM (
            SELECT jc2.id, ROW_NUMBER() OVER (PARTITION BY jc2.appointment_id ORDER BY jc2.created_at ASC) as rn
            FROM job_cards jc2
          ) sub WHERE sub.rn = 1
        )
      `)
    }

    if (!duplicates.rows || duplicates.rows.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No duplicate job cards found',
        deleted: 0 
      })
    }

    const dupIds = duplicates.rows.map(r => r.id)
    const placeholders = dupIds.map((_, i) => `$${i + 1}`).join(',')

    // Delete repair updates for duplicates
    await db.query(`DELETE FROM repair_updates WHERE job_card_id IN (${placeholders})`, dupIds)

    // Delete duplicate job cards
    await db.query(`DELETE FROM job_cards WHERE id IN (${placeholders})`, dupIds)

    res.json({ 
      success: true, 
      message: `Deleted ${dupIds.length} duplicate job card(s)`,
      deleted: dupIds.length,
      duplicateIds: dupIds
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
