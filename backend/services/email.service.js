const nodemailer = require('nodemailer')

// ── TRANSPORT ─────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
  port:   Number(process.env.EMAIL_PORT || 587),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const FROM    = process.env.EMAIL_FROM    || 'AutoMedic <noreply@automedic.mw>'
const GARAGE  = process.env.GARAGE_NAME   || 'AutoMedic Garage'
const PHONE   = process.env.GARAGE_PHONE  || '+265 999 000 000'
const ADDRESS = process.env.GARAGE_ADDRESS|| 'Area 47, Lilongwe, Malawi'
const WA      = process.env.GARAGE_WHATSAPP || '+265999000000'

// ── BASE TEMPLATE ─────────────────────────────────────────────────────────────
function baseHtml(title, bodyHtml) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <style>
    body{margin:0;padding:0;background:#F0F2F5;font-family:'Segoe UI',Arial,sans-serif;color:#1A1A2E}
    .wrap{max-width:580px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .header{background:#1A1A2E;padding:28px 32px;display:flex;align-items:center;gap:12px}
    .logo{width:36px;height:36px;background:#B8860B;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:13px}
    .brand{color:#fff;font-weight:900;font-size:18px}
    .brand span{color:#B8860B}
    .body{padding:32px}
    .badge{display:inline-block;background:#B8860B;color:#fff;border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;margin-bottom:20px}
    h2{font-size:22px;font-weight:900;margin:0 0 8px}
    p{font-size:15px;line-height:1.6;color:#374151;margin:0 0 16px}
    .card{background:#F8F9FA;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #E5E7EB}
    .row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #E5E7EB}
    .row:last-child{border-bottom:none}
    .row-label{font-size:13px;color:#6B7280}
    .row-value{font-size:13px;font-weight:600;color:#1A1A2E}
    .btn{display:inline-block;background:#B8860B;color:#fff;padding:12px 28px;border-radius:100px;font-weight:700;font-size:14px;text-decoration:none;margin-top:8px}
    .footer{background:#F8F9FA;padding:20px 32px;border-top:1px solid #E5E7EB;text-align:center}
    .footer p{font-size:12px;color:#9CA3AF;margin:0}
    .progress-bar{background:#E5E7EB;border-radius:100px;height:10px;overflow:hidden;margin:12px 0}
    .progress-fill{height:100%;border-radius:100px;background:linear-gradient(90deg,#B8860B,#F59E0B)}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <span class="logo">AM</span>
      <span class="brand">Auto<span>Medic</span></span>
    </div>
    <div class="body">${bodyHtml}</div>
    <div class="footer">
      <p>${GARAGE} · ${ADDRESS}</p>
      <p>📞 ${PHONE} · WhatsApp: <a href="https://wa.me/${WA.replace(/\D/g,'')}" style="color:#B8860B">${PHONE}</a></p>
      <p style="margin-top:8px">© ${new Date().getFullYear()} AutoMedic. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
}

// ── SEND HELPER ───────────────────────────────────────────────────────────────
async function send(to, subject, html) {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
    // Email not configured — log instead of crashing
    console.log(`[EMAIL] (not configured) To: ${to} | Subject: ${subject}`)
    return
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html })
    console.log(`[EMAIL] Sent to ${to}: ${subject}`)
  } catch (err) {
    console.error(`[EMAIL] Failed to send to ${to}:`, err.message)
    // Non-fatal — never crash the request
  }
}

// ── EMAIL TEMPLATES ───────────────────────────────────────────────────────────

/**
 * Welcome email after registration
 */
async function sendWelcome({ name, email }) {
  const html = baseHtml('Welcome to AutoMedic', `
    <div class="badge">Welcome 🎉</div>
    <h2>Hi ${name}, welcome to AutoMedic!</h2>
    <p>Your account is ready. You can now book appointments, track your vehicle's repair progress in real-time, and view your service history — all from your dashboard.</p>
    <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">Go to Dashboard →</a>
    <p style="margin-top:24px;font-size:13px;color:#9CA3AF">If you didn't create this account, please ignore this email.</p>
  `)
  await send(email, `Welcome to ${GARAGE}!`, html)
}

/**
 * Appointment confirmation email
 */
async function sendAppointmentConfirmed({ name, email, tracking, date, vehicle, service, technicianName }) {
  const html = baseHtml('Appointment Confirmed', `
    <div class="badge">✓ Appointment Confirmed</div>
    <h2>Your booking is confirmed</h2>
    <p>Hi ${name}, your vehicle has been booked in for service at ${GARAGE}.</p>
    <div class="card">
      <div class="row"><span class="row-label">Tracking #</span><span class="row-value" style="color:#B8860B;font-size:16px">${tracking}</span></div>
      <div class="row"><span class="row-label">Vehicle</span><span class="row-value">${vehicle}</span></div>
      <div class="row"><span class="row-label">Service</span><span class="row-value">${service || 'General Service'}</span></div>
      <div class="row"><span class="row-label">Preferred Date</span><span class="row-value">${date}</span></div>
      ${technicianName ? `<div class="row"><span class="row-label">Assigned Technician</span><span class="row-value">${technicianName}</span></div>` : ''}
    </div>
    <p>You can track your vehicle's repair progress at any time using your tracking number.</p>
    <a href="${process.env.FRONTEND_URL}/track/${tracking}" class="btn">Track My Vehicle →</a>
  `)
  await send(email, `Booking Confirmed — ${tracking}`, html)
}

/**
 * Inspection ready — customer needs to sign
 */
async function sendInspectionReady({ name, email, vehicle, tracking, inspectionRef }) {
  const html = baseHtml('Inspection Report Ready', `
    <div class="badge">🔍 Action Required</div>
    <h2>Your inspection report is ready</h2>
    <p>Hi ${name}, our technician has completed the pre-repair inspection of <strong>${vehicle}</strong>.</p>
    <p>Please review the report and sign digitally to authorise repair work to begin.</p>
    <div class="card">
      <div class="row"><span class="row-label">Inspection Ref</span><span class="row-value">${inspectionRef}</span></div>
      <div class="row"><span class="row-label">Vehicle</span><span class="row-value">${vehicle}</span></div>
      <div class="row"><span class="row-label">Booking #</span><span class="row-value">${tracking}</span></div>
    </div>
    <p>Repair work cannot begin until you sign off on the inspection.</p>
    <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">Review & Sign →</a>
  `)
  await send(email, `Inspection Ready — Sign-off Required (${tracking})`, html)
}

/**
 * Repair progress update
 */
async function sendRepairUpdate({ name, email, tracking, vehicle, status, progress }) {
  const statusMessages = {
    diagnosis:     { label: 'Diagnosis in Progress', desc: 'Our technician is currently diagnosing your vehicle.' },
    parts_ordered: { label: 'Parts Ordered',          desc: 'Parts have been ordered and are on their way.' },
    in_progress:   { label: 'Repair in Progress',     desc: 'Active repair work has started on your vehicle.' },
    quality_check: { label: 'Quality Check',           desc: 'Your vehicle is undergoing a final quality inspection.' },
    ready:         { label: '🎉 Vehicle Ready!',        desc: 'Your vehicle is ready for collection. Please visit us at your earliest convenience.' },
    completed:     { label: 'Service Completed',       desc: `Thank you for choosing ${GARAGE}. Your service has been completed.` },
  }
  const info = statusMessages[status] || { label: `Status: ${status}`, desc: 'Your repair status has been updated.' }

  const html = baseHtml('Repair Update', `
    <div class="badge">🔧 Repair Update</div>
    <h2>${info.label}</h2>
    <p>Hi ${name}, here's an update on your vehicle <strong>${vehicle}</strong>.</p>
    <p>${info.desc}</p>
    <div class="card">
      <div class="row"><span class="row-label">Booking #</span><span class="row-value">${tracking}</span></div>
      <div class="row"><span class="row-label">Status</span><span class="row-value">${info.label}</span></div>
      <div class="row"><span class="row-label">Progress</span><span class="row-value">${progress}%</span></div>
    </div>
    <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
    <a href="${process.env.FRONTEND_URL}/track/${tracking}" class="btn">View Live Tracking →</a>
  `)
  await send(email, `Repair Update: ${info.label} — ${tracking}`, html)
}

/**
 * Invoice generated
 */
async function sendInvoiceReady({ name, email, tracking, vehicle, invoiceNumber, total }) {
  const fmt = (n) => `MK ${Number(n || 0).toLocaleString()}`
  const html = baseHtml('Invoice Ready', `
    <div class="badge">📄 Invoice Generated</div>
    <h2>Your invoice is ready</h2>
    <p>Hi ${name}, the service for your vehicle <strong>${vehicle}</strong> has been completed and your invoice is ready.</p>
    <div class="card">
      <div class="row"><span class="row-label">Invoice #</span><span class="row-value">${invoiceNumber}</span></div>
      <div class="row"><span class="row-label">Booking #</span><span class="row-value">${tracking}</span></div>
      <div class="row"><span class="row-label">Vehicle</span><span class="row-value">${vehicle}</span></div>
      <div class="row"><span class="row-label">Total Amount</span><span class="row-value" style="color:#B8860B;font-size:18px;font-weight:900">${fmt(total)}</span></div>
    </div>
    <p>You can view and print your full invoice from your dashboard.</p>
    <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">View Invoice →</a>
    <p style="margin-top:20px;font-size:13px;color:#6B7280">Payment is due upon vehicle collection. Please bring this reference when collecting your vehicle.</p>
  `)
  await send(email, `Invoice ${invoiceNumber} — ${fmt(total)} Due`, html)
}

/**
 * Password reset / new account credentials
 */
async function sendNewAccountCredentials({ name, email, password, role }) {
  const roleLabel = role === 'technician' ? 'Technician' : role === 'admin' ? 'Administrator' : 'Customer'
  const html = baseHtml('Account Created', `
    <div class="badge">👤 Account Created</div>
    <h2>Welcome to ${GARAGE}</h2>
    <p>Hi ${name}, an account has been created for you on the AutoMedic system.</p>
    <div class="card">
      <div class="row"><span class="row-label">Email</span><span class="row-value">${email}</span></div>
      <div class="row"><span class="row-label">Temporary Password</span><span class="row-value" style="font-family:monospace;color:#B8860B;letter-spacing:1px">${password}</span></div>
      <div class="row"><span class="row-label">Role</span><span class="row-value">${roleLabel}</span></div>
    </div>
    <p>Please log in and change your password immediately.</p>
    <a href="${process.env.FRONTEND_URL}/login" class="btn">Login Now →</a>
    <p style="margin-top:20px;font-size:12px;color:#9CA3AF">If you did not expect this email, please contact ${GARAGE} at ${PHONE}.</p>
  `)
  await send(email, `Your AutoMedic ${roleLabel} Account`, html)
}

/**
 * Technician job assignment notification
 */
async function sendJobAssigned({ name, email, tracking, vehicle, service }) {
  const html = baseHtml('New Job Assigned', `
    <div class="badge">🔧 New Job Assigned</div>
    <h2>You have a new job assignment</h2>
    <p>Hi ${name}, a new job card has been assigned to you.</p>
    <div class="card">
      <div class="row"><span class="row-label">Booking #</span><span class="row-value" style="color:#B8860B;font-size:16px">${tracking}</span></div>
      <div class="row"><span class="row-label">Vehicle</span><span class="row-value">${vehicle}</span></div>
      <div class="row"><span class="row-label">Service</span><span class="row-value">${service}</span></div>
    </div>
    <p>Please log in to view job details and begin the inspection process.</p>
    <a href="${process.env.FRONTEND_URL}/technician" class="btn">View Job Details →</a>
  `)
  await send(email, `New Job Assignment — ${tracking}`, html)
}

/**
 * Password reset email (for backend-only users: admin, technician, stockkeeper)
 */
async function sendPasswordReset({ name, email, resetUrl, role }) {
  const roleLabel = role === 'admin' ? 'Administrator' : role === 'technician' ? 'Technician' : role === 'stockkeeper' ? 'Stock Keeper' : 'Customer'
  const html = baseHtml('Password Reset Request', `
    <div class="badge">🔐 Password Reset</div>
    <h2>Reset your password</h2>
    <p>Hi ${name}, we received a request to reset the password for your <strong>${roleLabel}</strong> account.</p>
    <p>Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.</p>
    <a href="${resetUrl}" class="btn">Reset My Password →</a>
    <div class="card" style="margin-top:24px">
      <p style="margin:0;font-size:13px;color:#6B7280">If you did not request a password reset, you can safely ignore this email. Your password will not be changed.</p>
    </div>
    <p style="margin-top:20px;font-size:12px;color:#9CA3AF">For security, this link expires in 1 hour and can only be used once.</p>
  `)
  await send(email, `Password Reset — ${GARAGE}`, html)
}

module.exports = {
  sendWelcome,
  sendAppointmentConfirmed,
  sendInspectionReady,
  sendRepairUpdate,
  sendInvoiceReady,
  sendNewAccountCredentials,
  sendPasswordReset,
  sendJobAssigned,
}
