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
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
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
server.listen(PORT, () => {
  console.log('')
  console.log(`🚀 AutoMedic API running on http://localhost:${PORT}`)
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log('')
})
