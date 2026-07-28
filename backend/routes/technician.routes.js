const express = require('express')
const router  = express.Router()
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT u.id, u.name, u.email, u.phone,
        COUNT(jc.id)                                                          AS total_jobs,
        COUNT(CASE WHEN jc.status IN ('pending','in_progress','open') THEN 1 END) AS active_jobs,
        COUNT(CASE WHEN jc.status = 'completed' THEN 1 END)                  AS completed_jobs
      FROM users u
      LEFT JOIN job_cards jc ON jc.technician_id = u.id
      WHERE u.role = 'technician' AND u.is_active = true
      GROUP BY u.id ORDER BY u.name
    `)
    res.json({ success: true, data: r.rows })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

module.exports = router
