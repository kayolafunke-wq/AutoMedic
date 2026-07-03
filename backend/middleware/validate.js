/**
 * Validation middleware using express-validator.
 * Provides reusable rule sets for every route.
 */
const { body, param, query, validationResult } = require('express-validator')

// ── Run result check — attach as the LAST item in any validator array ─────────
const check = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors:  errors.array().map(e => ({ field: e.path, message: e.msg })),
    })
  }
  next()
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name too long'),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional({ nullable: true }).isMobilePhone('any').withMessage('Invalid phone number'),
  check,
]

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  check,
]

const changePasswordRules = [
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  check,
]

const resetPasswordRules = [
  body('new_password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  check,
]

// ── USERS ─────────────────────────────────────────────────────────────────────
const createUserRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['customer', 'technician', 'admin', 'stockkeeper']).withMessage('Invalid role'),
  body('phone').optional({ nullable: true }).isMobilePhone('any').withMessage('Invalid phone number'),
  check,
]

const updateUserRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 100 }),
  body('email').optional().trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('role').optional().isIn(['customer', 'technician', 'admin', 'stockkeeper']).withMessage('Invalid role'),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean'),
  check,
]

// ── APPOINTMENTS ──────────────────────────────────────────────────────────────
const createAppointmentRules = [
  body('preferred_date').notEmpty().withMessage('Preferred date is required').isISO8601().withMessage('preferred_date must be a valid date (YYYY-MM-DD)'),
  body('vehicle_id').optional({ nullable: true }).isString(),
  body('service_id').optional({ nullable: true }).isString(),
  body('problem_description').optional({ nullable: true }).isLength({ max: 1000 }).withMessage('Description too long'),
  check,
]

const adminCreateAppointmentRules = [
  body('customer_id').notEmpty().withMessage('customer_id is required'),
  body('preferred_date').notEmpty().withMessage('Preferred date is required').isISO8601().withMessage('preferred_date must be a valid date (YYYY-MM-DD)'),
  body('vehicle_id').optional({ nullable: true }).isString(),
  body('service_id').optional({ nullable: true }).isString(),
  check,
]

const assignAppointmentRules = [
  body('technician_id').optional({ nullable: true }).isString(),
  body('status').optional().isIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  check,
]

// ── VEHICLES ──────────────────────────────────────────────────────────────────
const createVehicleRules = [
  body('make').trim().notEmpty().withMessage('Make is required').isLength({ max: 60 }),
  body('model').trim().notEmpty().withMessage('Model is required').isLength({ max: 60 }),
  body('registration_number').trim().notEmpty().withMessage('Registration number is required').isLength({ max: 20 }),
  body('year').optional({ nullable: true }).isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Invalid year'),
  check,
]

// ── SERVICES ──────────────────────────────────────────────────────────────────
const createServiceRules = [
  body('name').trim().notEmpty().withMessage('Service name is required').isLength({ max: 120 }),
  body('category').optional().isLength({ max: 60 }),
  body('base_price').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('duration_hours').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Duration must be a positive number'),
  check,
]

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
const createProductRules = [
  body('name').trim().notEmpty().withMessage('Product name is required').isLength({ max: 120 }),
  body('price').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
  check,
]

// ── INVOICES ──────────────────────────────────────────────────────────────────
const createInvoiceRules = [
  body('appointment_id').notEmpty().withMessage('appointment_id is required'),
  body('customer_id').notEmpty().withMessage('customer_id is required'),
  body('items').optional().isArray().withMessage('items must be an array'),
  check,
]

const updateInvoiceStatusRules = [
  body('status').isIn(['unpaid', 'paid', 'partial']).withMessage('status must be unpaid, paid, or partial'),
  check,
]

// ── JOB CARDS ────────────────────────────────────────────────────────────────
const updateProgressRules = [
  body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
  body('status').optional().isString().withMessage('status must be a string'),
  body('estimated_cost').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('estimated_cost must be a positive number'),
  body('final_cost').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('final_cost must be a positive number'),
  check,
]

// ── CHECKOUT ──────────────────────────────────────────────────────────────────
const jobCardCheckoutRules = [
  body('job_card_id').notEmpty().withMessage('job_card_id is required'),
  body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
  body('items.*.product_id').notEmpty().withMessage('Each item must have a product_id'),
  body('items.*.qty').isInt({ min: 1 }).withMessage('Each item qty must be at least 1'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Each item must have a valid unit_price'),
  check,
]

const walkinCheckoutRules = [
  body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
  body('items.*.product_id').notEmpty().withMessage('Each item must have a product_id'),
  body('items.*.qty').isInt({ min: 1 }).withMessage('Each item qty must be at least 1'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Each item must have a valid unit_price'),
  check,
]

const restockRules = [
  body('qty').isInt({ min: 1 }).withMessage('qty must be a positive integer'),
  check,
]

// ── INSPECTIONS ───────────────────────────────────────────────────────────────
const createInspectionRules = [
  body('appointment_id').optional({ nullable: true }).isString(),
  body('vehicle_id').optional({ nullable: true }).isString(),
  body('customer_id').optional({ nullable: true }).isString(),
  body('odometer_reading').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Odometer must be a non-negative integer'),
  check,
]

const signInspectionRules = [
  body('customer_signature').notEmpty().withMessage('customer_signature is required'),
  check,
]

// ── PARAMS ────────────────────────────────────────────────────────────────────
const idParam = [
  param('id').notEmpty().withMessage('ID parameter is required'),
  check,
]

module.exports = {
  check,
  // auth
  registerRules,
  loginRules,
  changePasswordRules,
  resetPasswordRules,
  // users
  createUserRules,
  updateUserRules,
  // appointments
  createAppointmentRules,
  adminCreateAppointmentRules,
  assignAppointmentRules,
  // vehicles
  createVehicleRules,
  // services
  createServiceRules,
  // products
  createProductRules,
  // invoices
  createInvoiceRules,
  updateInvoiceStatusRules,
  // job cards
  updateProgressRules,
  // checkout
  jobCardCheckoutRules,
  walkinCheckoutRules,
  restockRules,
  // inspections
  createInspectionRules,
  signInspectionRules,
  // params
  idParam,
}
