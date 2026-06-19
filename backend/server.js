const express    = require('express')
const http       = require('http')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')
const path       = require('path')
const passport   = require('./config/passport')
require('dotenv').config()

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

const app    = express()
const server = http.createServer(app)

// Socket.IO
initSocket(server)

// â”€â”€â”€ MIDDLEWARE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({
  origin: (origin, callback) => {
    // Allow all localhost origins in development
    if (!origin || origin.match(/^http:\/\/localhost:\d+$/)) {
      callback(null, true)
    } else if (origin === process.env.FRONTEND_URL) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
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

// â”€â”€â”€ ROUTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ HEALTH CHECK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'AutoMedic API', version: '2.0.0', time: new Date() })
})

// â”€â”€â”€ ERROR HANDLER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use((err, req, res, next) => {
  console.error('âŒ', err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  })
})

// â”€â”€â”€ START â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log('')
  console.log(`ðŸš€ AutoMedic API running on http://localhost:${PORT}`)
  console.log(`ðŸ“¦ Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log('')
})

