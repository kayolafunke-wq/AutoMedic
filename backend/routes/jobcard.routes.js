const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { getIO } = require('../websocket/tracking.socket');

// GET my jobs (technician)
router.get('/my', authenticate, authorize('technician'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT jc.*, a.tracking_number, a.preferred_date, a.problem_description,
        u.name as customer_name, u.phone as customer_phone,
        v.make, v.model, v.registration_number, v.color,
        s.name as service_name
      FROM job_cards jc
      LEFT JOIN appointments a ON jc.appointment_id = a.id
      LEFT JOIN users u ON a.customer_id = u.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE jc.technician_id = $1 AND jc.status != 'completed'
      ORDER BY jc.created_at DESC
    `, [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all job cards (admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT jc.*, a.tracking_number, t.name as technician_name,
        u.name as customer_name, v.make, v.model, v.registration_number
      FROM job_cards jc
      LEFT JOIN appointments a ON jc.appointment_id = a.id
      LEFT JOIN users t ON jc.technician_id = t.id
      LEFT JOIN users u ON a.customer_id = u.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      ORDER BY jc.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH update progress + status (technician)
router.patch('/:id/progress', authenticate, authorize('technician', 'admin'), async (req, res) => {
  try {
    const { progress, status, technician_notes, parts_used, estimated_cost } = req.body;
    const result = await db.query(
      `UPDATE job_cards SET progress = COALESCE($1, progress), status = COALESCE($2, status),
       technician_notes = COALESCE($3, technician_notes), parts_used = COALESCE($4, parts_used),
       estimated_cost = COALESCE($5, estimated_cost), updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [progress, status, technician_notes, parts_used ? JSON.stringify(parts_used) : null, estimated_cost, req.params.id]
    );
    const job = result.rows[0];

    // Emit real-time update via Socket.IO
    try {
      const io = getIO();
      const appt = await db.query('SELECT tracking_number, customer_id FROM appointments WHERE id = $1', [job.appointment_id]);
      if (appt.rows.length) {
        io.to(`customer_${appt.rows[0].customer_id}`).emit('progress_update', {
          tracking: appt.rows[0].tracking_number,
          progress: job.progress,
          status: job.status
        });
      }
    } catch (e) { /* socket not critical */ }

    // Log repair update
    await db.query(
      'INSERT INTO repair_updates (job_card_id, updated_by, status, note) VALUES ($1,$2,$3,$4)',
      [job.id, req.user.id, status || job.status, technician_notes]
    );

    res.json({ success: true, data: job });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET repair timeline
router.get('/:id/timeline', authenticate, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT ru.*, u.name as updated_by_name
      FROM repair_updates ru
      LEFT JOIN users u ON ru.updated_by = u.id
      WHERE ru.job_card_id = $1
      ORDER BY ru.created_at ASC
    `, [req.params.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
