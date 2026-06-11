const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');

// Multer config for inspection photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/inspection-photos'));
  },
  filename: (req, file, cb) => {
    cb(null, `insp-${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const genRef = () => 'INS-' + Math.floor(1000 + Math.random() * 9000);

// GET all inspections (admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT i.*, u.name as customer_name, v.make, v.model, v.registration_number
      FROM inspections i
      LEFT JOIN users u ON i.customer_id = u.id
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      ORDER BY i.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET my pending inspections (customer)
router.get('/my', authenticate, authorize('customer'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT i.*, v.make, v.model, v.registration_number,
        array_agg(ip.file_url) as photos
      FROM inspections i
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      LEFT JOIN inspection_photos ip ON ip.inspection_id = i.id
      WHERE i.customer_id = $1
      GROUP BY i.id, v.make, v.model, v.registration_number
      ORDER BY i.created_at DESC
    `, [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create inspection (admin/technician)
router.post('/', authenticate, authorize('admin', 'technician'), async (req, res) => {
  try {
    const { appointment_id, vehicle_id, customer_id, odometer_reading, fuel_level, damage_notes, checklist, accessories, valuables_notes } = req.body;
    const reference_number = genRef();
    const result = await db.query(
      `INSERT INTO inspections (reference_number, appointment_id, vehicle_id, customer_id, advisor_id, odometer_reading, fuel_level, damage_notes, checklist, accessories, valuables_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [reference_number, appointment_id, vehicle_id, customer_id, req.user.id, odometer_reading, fuel_level,
       JSON.stringify(damage_notes || []), JSON.stringify(checklist || {}), JSON.stringify(accessories || {}), valuables_notes]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH customer sign-off
router.patch('/:id/sign', authenticate, authorize('customer'), async (req, res) => {
  try {
    const { customer_signature } = req.body;
    const result = await db.query(
      `UPDATE inspections SET customer_signature = $1, customer_signed_at = NOW(), status = 'customer_signed'
       WHERE id = $2 AND customer_id = $3 RETURNING *`,
      [customer_signature, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Inspection not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST upload photos
router.post('/:id/photos', authenticate, upload.array('photos', 10), async (req, res) => {
  try {
    const { photo_type } = req.body;
    const photos = req.files.map(f => ({
      inspection_id: req.params.id,
      photo_type,
      file_url: `/uploads/inspection-photos/${f.filename}`,
      uploaded_by: req.user.id
    }));
    const inserted = [];
    for (const p of photos) {
      const r = await db.query(
        'INSERT INTO inspection_photos (inspection_id, photo_type, file_url, uploaded_by) VALUES ($1,$2,$3,$4) RETURNING *',
        [p.inspection_id, p.photo_type, p.file_url, p.uploaded_by]
      );
      inserted.push(r.rows[0]);
    }
    res.status(201).json({ success: true, data: inserted });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
