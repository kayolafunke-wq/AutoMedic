// ─── PAGINATION ──────────────────────────────────────────────────────────────
export const PAGE_SIZE = 15

// ─── STATUS COLORS ───────────────────────────────────────────────────────────
export const APPOINTMENT_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export const JOB_STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  diagnosis: 'bg-yellow-100 text-yellow-800',
  parts_ordered: 'bg-orange-100 text-orange-800',
  in_progress: 'bg-blue-100 text-blue-800',
  quality_check: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  completed: 'bg-green-600 text-white',
}

export const INVOICE_STATUS_COLORS = {
  unpaid: 'bg-red-100 text-red-800',
  partial: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
}

export const INSPECTION_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  customer_signed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
}

// ─── STATUS LABELS ───────────────────────────────────────────────────────────
export const JOB_STATUS_LABELS = {
  pending: 'Pending',
  diagnosis: 'Diagnosis',
  parts_ordered: 'Parts Ordered',
  in_progress: 'In Progress',
  quality_check: 'Quality Check',
  ready: 'Ready',
  completed: 'Completed',
}

export const APPOINTMENT_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const INVOICE_STATUS_LABELS = {
  unpaid: 'Unpaid',
  partial: 'Partially Paid',
  paid: 'Paid',
}

// ─── FUEL LEVELS ─────────────────────────────────────────────────────────────
export const FUEL_LEVELS = [
  { value: 'empty', label: 'Empty' },
  { value: 'quarter', label: '1/4 Tank' },
  { value: 'half', label: '1/2 Tank' },
  { value: 'three_quarters', label: '3/4 Tank' },
  { value: 'full', label: 'Full Tank' },
]

// ─── USER ROLES ──────────────────────────────────────────────────────────────
export const USER_ROLES = [
  { value: 'customer', label: 'Customer' },
  { value: 'technician', label: 'Technician' },
  { value: 'stockkeeper', label: 'Stock Keeper' },
  { value: 'admin', label: 'Administrator' },
]

// ─── PRODUCT CATEGORIES ──────────────────────────────────────────────────────
export const PRODUCT_CATEGORIES = [
  'Engine Parts',
  'Brake System',
  'Suspension',
  'Electrical',
  'Body Parts',
  'Fluids & Oils',
  'Filters',
  'Tires & Wheels',
  'Tools',
  'Accessories',
  'Other',
]

// ─── SERVICE CATEGORIES ──────────────────────────────────────────────────────
export const SERVICE_CATEGORIES = [
  'General Service',
  'Engine Repair',
  'Brake Service',
  'Suspension',
  'Electrical',
  'Diagnostics',
  'Body Work',
  'Tire Service',
  'AC Service',
  'Other',
]

// ─── TAX RATE ────────────────────────────────────────────────────────────────
export const DEFAULT_VAT_RATE = 0.165 // 16.5% VAT

// ─── DATE FORMATS ────────────────────────────────────────────────────────────
export const DATE_FORMAT = 'MMM DD, YYYY'
export const DATETIME_FORMAT = 'MMM DD, YYYY - HH:mm'

// ─── API ENDPOINTS ───────────────────────────────────────────────────────────
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ─── FILE UPLOAD ─────────────────────────────────────────────────────────────
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
