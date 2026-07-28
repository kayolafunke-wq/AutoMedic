const express    = require('express')
const http       = require('http')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')
const path       = require('path')
const passport   = require('./config/passport')
require('dotenv').config()

// Initialize Sentry and Swagger
const { initSentry, getSentryErrorHandler } = require('./config/sentry')
const { setupSwagger } = require('./config/swagger')
const { initSocket } = require('./websocket/tracking.socket')

// Routes
const authRoutes         = require('./routes/auth.routes')
const usersRoutes        = require('./routes/users.routes')
const customerRoutes     = require('./routes/customer.routes')
const appointmentRoutes  = require('./routes/appointment.routes')
const vehicleRoutes      = require('./routes/vehicle.routes')
const inspectionRoutes   = require('./routes/inspection.routes')
const jobCardRoutes      = require('./routes/jobcard.routes')
const technicianRoutes   = require('./routes/technician.routes')
const serviceRoutes      = require('./routes/service.routes')
const productRoutes      = require('./routes/product.routes')
const reportRoutes       = require('./routes/report.routes')
const notificationRoutes = require('./routes/notification.routes')
const invoiceRoutes      = require('./routes/invoice.routes')
const uploadRoutes       = require('./routes/upload.routes')
const checkoutRoutes     = require('./routes/checkout.routes')
const inventoryRoutes    = require('./routes/inventory.routes')
const settingsRoutes     = require('./routes/settings.routes')
const adminRoutes        = require('./routes/admin.routes')

const app    = express()
const server = http.createServer(app)

// Initialize Sentry FIRST (before other middleware)
initSentry(app)

// Socket.IO
initSocket(server)

// ——————————————————————————————————————————————————————
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({
  origin: (origin, callback) => {
    // Allow all localhost origins in development
    if (!origin || origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true)
    }
    // Allow LAN access — other devices on the same local network
    if (origin.match(/^http:\/\/172\.20\.10\.\d+:\d+$/)) {
      return callback(null, true)
    }
    // Allow configured frontend URL (for production)
    if (origin === process.env.FRONTEND_URL) {
      return callback(null, true)
    }
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
}))
app.use(morgan('dev'))
app.use(express.json({ limit: '15mb' }))
app.use(express.urlencoded({ extended: true, limit: '15mb' }))

app.use(passport.initialize())

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Setup Swagger API Documentation
setupSwagger(app)

// ─── ROUTES ────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: API health check
 *     description: Returns the API status and version
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 app:
 *                   type: string
 *                   example: AutoMedic API
 *                 version:
 *                   type: string
 *                   example: 2.0.0
 *                 time:
 *                   type: string
 *                   format: date-time
 */
app.use('/api/auth',          authRoutes)
app.use('/api/users',         usersRoutes)
app.use('/api/customers',     customerRoutes)
app.use('/api/appointments',  appointmentRoutes)
app.use('/api/vehicles',      vehicleRoutes)
app.use('/api/inspections',   inspectionRoutes)
app.use('/api/job-cards',     jobCardRoutes)
app.use('/api/technicians',   technicianRoutes)
app.use('/api/services',      serviceRoutes)
app.use('/api/products',      productRoutes)
app.use('/api/reports',       reportRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/invoices',      invoiceRoutes)
app.use('/api/upload',        uploadRoutes)
app.use('/api/checkout',      checkoutRoutes)
app.use('/api/inventory',     inventoryRoutes)
app.use('/api/settings',      settingsRoutes)
app.use('/api/admin',         adminRoutes)

// ─── HEALTH CHECK ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'AutoMedic API', version: '2.0.0', time: new Date() })
})

// ─── SENTRY ERROR HANDLER (must be before other error handlers) ────
app.use(getSentryErrorHandler())

// ─── ERROR HANDLER ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌', err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  })
})

// ─── START ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
server.listen(PORT, async () => {
  console.log('')
  console.log(`🚀 AutoMedic API running on http://localhost:${PORT}`)
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log('')

  // Ensure critical DB tables and columns exist automatically on boot
  try {
    const db = require('./config/db')
    await db.query(`
      CREATE TABLE IF NOT EXISTS inspection_photos (
        id VARCHAR(255) PRIMARY KEY,
        inspection_id VARCHAR(255) REFERENCES inspections(id) ON DELETE CASCADE,
        photo_type VARCHAR(50) DEFAULT 'before',
        file_url TEXT NOT NULL,
        file_name TEXT,
        uploaded_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await db.query(`ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS technician_notes TEXT;`).catch(() => {})
    await db.query(`ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS parts_used TEXT DEFAULT '[]';`).catch(() => {})
    await db.query(`ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC;`).catch(() => {})
    await db.query(`ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS final_cost NUMERIC;`).catch(() => {})
    await db.query(`ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;`).catch(() => {})
    await db.query(`ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;`).catch(() => {})
    await db.query(`
      CREATE TABLE IF NOT EXISTS repair_updates (
        id          VARCHAR(255) PRIMARY KEY,
        job_card_id VARCHAR(255) REFERENCES job_cards(id) ON DELETE CASCADE,
        updated_by  VARCHAR(255),
        status      TEXT NOT NULL,
        note        TEXT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {})
    // invoices: ensure items + paid_at + updated_at columns exist
    await db.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS items TEXT NOT NULL DEFAULT '[]'`).catch(() => {})
    await db.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0`).catch(() => {})
    await db.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax NUMERIC DEFAULT 0`).catch(() => {})
    await db.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0`).catch(() => {})
    await db.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unpaid'`).catch(() => {})
    await db.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP`).catch(() => {})
    await db.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP`).catch(() => {})
    // stock_checkouts: ensure table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS stock_checkouts (
        id             VARCHAR(255) PRIMARY KEY,
        type           TEXT NOT NULL DEFAULT 'job_card',
        job_card_id    VARCHAR(255),
        appointment_id VARCHAR(255),
        customer_id    VARCHAR(255),
        customer_name  TEXT,
        items          TEXT NOT NULL DEFAULT '[]',
        subtotal       NUMERIC DEFAULT 0,
        tax            NUMERIC DEFAULT 0,
        total          NUMERIC DEFAULT 0,
        invoice_id     VARCHAR(255),
        notes          TEXT,
        created_by     VARCHAR(255),
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {})
    // inventory_logs: ensure table + ALL columns exist (no FK, for resilience)
    await db.query(`
      CREATE TABLE IF NOT EXISTS inventory_logs (
        id         VARCHAR(255) PRIMARY KEY,
        product_id VARCHAR(255),
        type       VARCHAR(50)  NOT NULL DEFAULT 'stock_out',
        qty_change INTEGER      NOT NULL DEFAULT 0,
        qty_before INTEGER      NOT NULL DEFAULT 0,
        qty_after  INTEGER      NOT NULL DEFAULT 0,
        reason     TEXT,
        reference  TEXT,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {})
    // Add any missing columns from an older version of inventory_logs
    const invCols = [
      `ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS product_id  VARCHAR(255)`,
      `ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS type        VARCHAR(50)  NOT NULL DEFAULT 'stock_out'`,
      `ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS qty_change  INTEGER      NOT NULL DEFAULT 0`,
      `ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS qty_before  INTEGER      NOT NULL DEFAULT 0`,
      `ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS qty_after   INTEGER      NOT NULL DEFAULT 0`,
      `ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS reason      TEXT`,
      `ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS reference   TEXT`,
      `ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS created_by  VARCHAR(255)`,
      `ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    ]
    for (const col of invCols) { await db.query(col).catch(() => {}) }

    // Auto-backfill inventory_logs for existing stock_checkouts if logs are missing
    try {
      const checkouts = await db.query('SELECT * FROM stock_checkouts')
      const cryptoMod = require('crypto')
      for (const sc of (checkouts.rows || [])) {
        let items = []
        try { items = typeof sc.items === 'string' ? JSON.parse(sc.items) : sc.items } catch {}
        for (const item of (items || [])) {
          if (item.product_id) {
            const exists = await db.query(
              'SELECT id FROM inventory_logs WHERE reference = $1 AND product_id = $2',
              [sc.id, item.product_id]
            )
            if (!exists.rows.length) {
              const logId = cryptoMod.randomBytes(16).toString('hex')
              await db.query(
                `INSERT INTO inventory_logs (id, product_id, type, qty_change, qty_before, qty_after, reason, reference, created_by, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                  logId,
                  item.product_id,
                  'stock_out',
                  -Math.abs(Number(item.qty || 1)),
                  0,
                  0,
                  'Stock out — checkout',
                  sc.id,
                  sc.created_by || null,
                  sc.created_at || new Date().toISOString()
                ]
              )
            }
          }
        }
      }
    } catch (bfErr) {
      console.warn('⚠️ inventory_logs backfill skipped:', bfErr.message)
    }

    console.log('✅ Guaranteed DB tables, inventory_logs & columns checked/created')
  } catch (err) {
    console.warn('⚠️ DB table check warning:', err.message)
  }
})
