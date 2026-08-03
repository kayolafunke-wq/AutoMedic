import { z } from 'zod'

// ─── AUTH SCHEMAS ────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

// ─── APPOINTMENT SCHEMAS ─────────────────────────────────────────────────────
export const appointmentSchema = z.object({
  vehicle_id: z.string().min(1, 'Please select a vehicle'),
  service_id: z.string().min(1, 'Please select a service'),
  preferred_date: z.string().min(1, 'Please select a date')
    .refine((date) => {
      const selectedDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return selectedDate >= today
    }, 'Date cannot be in the past'),
  problem_description: z.string().max(500, 'Description must be less than 500 characters').optional(),
})

// ─── VEHICLE SCHEMAS ─────────────────────────────────────────────────────────
export const vehicleSchema = z.object({
  make: z.string().min(2, 'Make must be at least 2 characters'),
  model: z.string().min(1, 'Model is required'),
  year: z.number()
    .min(1900, 'Invalid year')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future')
    .optional(),
  color: z.string().optional(),
  registration_number: z.string()
    .min(3, 'Registration number must be at least 3 characters')
    .regex(/^[A-Z0-9\s-]+$/i, 'Invalid registration format'),
  chassis_number: z.string().optional(),
})

// ─── SERVICE SCHEMAS ─────────────────────────────────────────────────────────
export const serviceSchema = z.object({
  name: z.string().min(3, 'Service name must be at least 3 characters'),
  description: z.string().optional(),
  category: z.string().optional(),
  base_price: z.number()
    .min(0, 'Price cannot be negative')
    .max(10000000, 'Price exceeds maximum')
    .optional(),
  duration_hours: z.number()
    .min(0, 'Duration cannot be negative')
    .max(168, 'Duration exceeds 1 week')
    .optional(),
})

// ─── PRODUCT/INVENTORY SCHEMAS ───────────────────────────────────────────────
export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().optional(),
  category: z.string().optional(),
  cost_price: z.number()
    .min(0, 'Cost price cannot be negative')
    .optional(),
  price: z.number()
    .min(0, 'Selling price cannot be negative')
    .optional(),
  stock_quantity: z.number()
    .int('Quantity must be a whole number')
    .min(0, 'Stock quantity cannot be negative')
    .optional(),
})

export const stockCheckoutSchema = z.object({
  type: z.enum(['job_card', 'walkin'], { 
    errorMap: () => ({ message: 'Type must be job_card or walkin' }) 
  }),
  job_card_id: z.string().optional(),
  customer_id: z.string().optional(),
  customer_name: z.string().min(2, 'Customer name is required for walk-in').optional(),
  items: z.array(z.object({
    product_id: z.string().min(1, 'Product is required'),
    qty: z.number()
      .int('Quantity must be a whole number')
      .min(1, 'Quantity must be at least 1')
      .max(1000, 'Quantity exceeds maximum'),
    unit_price: z.number().min(0, 'Price cannot be negative'),
  })).min(1, 'At least one item is required'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

export const inventoryAdjustmentSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  type: z.enum(['stock_in', 'stock_out', 'adjustment'], {
    errorMap: () => ({ message: 'Type must be stock_in, stock_out, or adjustment' })
  }),
  qty_change: z.number()
    .int('Quantity must be a whole number')
    .refine((val) => val !== 0, 'Quantity change cannot be zero'),
  reason: z.string().min(3, 'Reason is required (minimum 3 characters)'),
})

// ─── JOB CARD SCHEMAS ────────────────────────────────────────────────────────
export const jobCardProgressSchema = z.object({
  progress: z.number()
    .min(0, 'Progress cannot be negative')
    .max(100, 'Progress cannot exceed 100'),
  status: z.enum([
    'pending',
    'diagnosis',
    'parts_ordered',
    'in_progress',
    'quality_check',
    'ready',
    'completed'
  ]).optional(),
  technician_notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  estimated_cost: z.number().min(0, 'Cost cannot be negative').optional(),
  final_cost: z.number().min(0, 'Cost cannot be negative').optional(),
})

// ─── USER SCHEMAS ────────────────────────────────────────────────────────────
export const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  phone: z.string().optional(),
  role: z.enum(['customer', 'technician', 'admin', 'stockkeeper'], {
    errorMap: () => ({ message: 'Invalid role selected' })
  }),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
})

// ─── INSPECTION SCHEMAS ──────────────────────────────────────────────────────
export const inspectionSchema = z.object({
  odometer_reading: z.number()
    .int('Odometer reading must be a whole number')
    .min(0, 'Odometer cannot be negative')
    .max(9999999, 'Odometer reading exceeds maximum'),
  fuel_level: z.enum(['empty', 'quarter', 'half', 'three_quarters', 'full']),
  damage_notes: z.array(z.string()).optional(),
  valuables_notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

// ─── INVOICE SCHEMAS ─────────────────────────────────────────────────────────
export const invoiceSchema = z.object({
  appointment_id: z.string().min(1, 'Appointment is required'),
  customer_id: z.string().min(1, 'Customer is required'),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    qty: z.number()
      .int('Quantity must be a whole number')
      .min(1, 'Quantity must be at least 1'),
    unit_price: z.number().min(0, 'Price cannot be negative'),
  })).min(1, 'At least one item is required'),
})

// ─── HELPER FUNCTION ─────────────────────────────────────────────────────────
export const validateForm = (schema, data) => {
  try {
    schema.parse(data)
    return { success: true, errors: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = {}
      error.errors.forEach((err) => {
        const path = err.path.join('.')
        errors[path] = err.message
      })
      return { success: false, errors }
    }
    return { success: false, errors: { _form: 'Validation failed' } }
  }
}
