const express = require('express')
const router  = express.Router()
const crypto  = require('crypto')
const multer  = require('multer')
const path    = require('path')
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')

// ── STORAGE CONFIGS ───────────────────────────────────────────────────────────
const makeStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, `../uploads/${folder}`)),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname)
    const name = `${folder.replace('-photos','')}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`
    cb(null, name)
  },
})

const repairUpload   = multer({ storage: makeStorage('repair-photos'),   limits: { fileSize: 10 * 1024 * 1024 } })
const vehicleUpload  = multer({ storage: makeStorage('vehicle-photos'),  limits: { fileSize: 10 * 1024 * 1024 } })
const serviceUpload  = multer({ storage: makeStorage('service-photos'),  limits: { fileSize: 5 * 1024 * 1024 } })
const productUpload  = multer({ storage: makeStorage('product-photos'),  limits: { fileSize: 5 * 1024 * 1024 } })

// ── REPAIR PHOTOS ─────────────────────────────────────────────────────────────
// POST /api/upload/repair/:job_card_id
router.post('/repair/:job_card_id', authenticate, authorize('technician', 'admin'), repairUpload.array('photos', 10), async (req, res) => {
  try {
    const { job_card_id } = req.params
    const { photo_type = 'during' } = req.body

    // Verify job card exists
    const jc = await db.query('SELECT id FROM job_cards WHERE id = ?', [job_card_id])
    if (!jc.rows.length) return res.status(404).json({ success: false, message: 'Job card not found' })

    // Store in inspection_photos table under a 'repair' photo_type
    // (re-using the same table since repair photos are also linked to an inspection chain)
    const inserted = []
    for (const f of req.files) {
      const id  = crypto.randomBytes(16).toString('hex')
      const url = `/uploads/repair-photos/${f.filename}`
      // Store in a simple JSON column on the job card, or use inspection_photos with type
      // We'll store as inspection_photos linked to the appointment's inspection
      const apptRow = await db.query('SELECT appointment_id FROM job_cards WHERE id = ?', [job_card_id])
      if (apptRow.rows.length) {
        const inspRow = await db.query('SELECT id FROM inspections WHERE appointment_id = ?', [apptRow.rows[0].appointment_id])
        if (inspRow.rows.length) {
          await db.query(
            'INSERT INTO inspection_photos (id,inspection_id,photo_type,file_url,uploaded_by) VALUES (?,?,?,?,?)',
            [id, inspRow.rows[0].id, photo_type === 'after' ? 'after' : 'during', url, req.user.id]
          )
        }
      }
      inserted.push({ id, file_url: url, photo_type })
    }

    res.status(201).json({ success: true, data: inserted, count: inserted.length })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// ── VEHICLE PHOTOS ────────────────────────────────────────────────────────────
// POST /api/upload/vehicle/:vehicle_id
router.post('/vehicle/:vehicle_id', authenticate, vehicleUpload.array('photos', 5), async (req, res) => {
  try {
    const { vehicle_id } = req.params

    const veh = await db.query('SELECT id FROM vehicles WHERE id = ?', [vehicle_id])
    if (!veh.rows.length) return res.status(404).json({ success: false, message: 'Vehicle not found' })

    const uploaded = req.files.map(f => ({
      id:       crypto.randomBytes(16).toString('hex'),
      file_url: `/uploads/vehicle-photos/${f.filename}`,
    }))

    res.status(201).json({ success: true, data: uploaded, count: uploaded.length })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// ── SERVICE PHOTOS ────────────────────────────────────────────────────────────
// POST /api/upload/service/:service_id
router.post('/service/:service_id', authenticate, authorize('admin'), serviceUpload.single('image'), async (req, res) => {
  try {
    const { service_id } = req.params

    // Verify service exists
    const service = await db.query('SELECT id, image_url FROM services WHERE id = ?', [service_id])
    if (!service.rows.length) return res.status(404).json({ success: false, message: 'Service not found' })

    const imageUrl = `/uploads/service-photos/${req.file.filename}`
    
    // DON'T update database here - let frontend handle it
    // await db.query('UPDATE services SET image_url = ? WHERE id = ?', [imageUrl, service_id])

    res.status(201).json({ 
      success: true, 
      data: { 
        service_id,
        image_url: imageUrl,
        filename: req.file.filename
      }
    })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// ── PRODUCT PHOTOS ────────────────────────────────────────────────────────────
// POST /api/upload/product/:product_id
router.post('/product/:product_id', authenticate, authorize('admin'), productUpload.single('image'), async (req, res) => {
  try {
    const { product_id } = req.params

    // Verify product exists
    const product = await db.query('SELECT id, image_url FROM products WHERE id = ?', [product_id])
    if (!product.rows.length) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }

    const imageUrl = `/uploads/product-photos/${req.file.filename}`
    
    // DON'T update database here - let frontend handle it
    // await db.query('UPDATE products SET image_url = ? WHERE id = ?', [imageUrl, product_id])

    const response = { 
      success: true, 
      data: { 
        product_id,
        image_url: imageUrl,
        filename: req.file.filename
      }
    }
    res.status(201).json(response)
  } catch (err) {
    console.error('Upload error:', err)
    res.status(400).json({ success: false, message: err.message })
  }
})

module.exports = router
