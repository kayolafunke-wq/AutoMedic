const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.name, u.email, u.phone,
        COUNT(DISTINCT jc.id) FILTER (WHERE jc.status != 'completed') as active_jobs,
        COUNT(DISTINCT jc.id) FILTER (WHERE jc.status = 'completed') as completed_jobs
      FROM users u
      LEFT JOIN job_cards jc ON jc.technician_id = u.id
      WHERE u.role = 'technician' AND u.is_active = true
      GROUP BY u.id ORDER BY u.name
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
