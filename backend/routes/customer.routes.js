const express = require('express')
const router  = express.Router()
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const r = await db.query(`
      SELECT u.id, u.name, u.email, u.phone, u.created_at,
        COUNT(DISTINCT v.id) as vehicle_count,
        COUNT(DISTINCT a.id) as total_services,
        MAX(a.created_at) as last_visit
      FROM users u
      LEFT JOIN vehicles v ON v.customer_id = u.id
      LEFT JOIN appointments a ON a.customer_id = u.id
      WHERE u.role='customer' AND u.is_active=1
      GROUP BY u.id ORDER BY u.created_at DESC
    `)
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

module.exports = router
