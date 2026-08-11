const nodemailer = require('nodemailer')

// ── TRANSPORT SELECTION ────────────────────────────────────────────────────────
// Production containers (Railway, Render, Fly.io, etc.) block SMTP ports 25/465/587.
// If RESEND_API_KEY is set, we use Resend's HTTPS API (port 443 — never blocked).
// Otherwise we fall back to SMTP/Nodemailer (fine for local dev).

const USE_RESEND = !!process.env.RESEND_API_KEY

let resend = null
if (USE_RESEND) {
  try {
    const { Resend } = require('resend')
    resend = new Resend(process.env.RESEND_API_KEY)
    console.log('[EMAIL] Using Resend API (HTTPS) for email delivery')
  } catch (e) {
    console.warn('[EMAIL] resend package not found — falling back to SMTP. Run: npm install resend')
  }
}

// ── GMAIL OAUTH2 & SMTP TRANSPORTER ─────────────────────────────────────────────
function getTransporter() {
  const user = (process.env.EMAIL_USER || 'kayolafunke@gmail.com').trim()
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim()
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim()
  const refreshToken = (process.env.GOOGLE_REFRESH_TOKEN || '').trim()

  if (clientId && clientSecret && refreshToken) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: user,
        clientId: clientId,
        clientSecret: clientSecret,
        refreshToken: refreshToken,
      }
    })
  }

  // Fallback to traditional App Password SMTP
  const pass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || 'kbmdyicztybpmuln').replace(/\s+/g, '')
  const port = Number(process.env.EMAIL_PORT || 587)
  const secure = process.env.EMAIL_SECURE !== undefined ? process.env.EMAIL_SECURE === 'true' : (port === 465)
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
    port:   port,
    secure: secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2',
    },
    connectionTimeout: 30000,
    greetingTimeout:   20000,
    socketTimeout:     30000,
  })
}

function getFromEmail() {
  const user = (process.env.EMAIL_USER || 'kayolafunke@gmail.com').trim()
  return process.env.EMAIL_FROM || `AutoMedic <${user}>`
}

// ── GARAGE INFO ────────────────────────────────────────────────────────────────
const GARAGE  = process.env.GARAGE_NAME    || 'AutoMedic Garage'
const PHONE   = process.env.GARAGE_PHONE   || '+265 999 000 000'
const ADDRESS = process.env.GARAGE_ADDRESS || 'Area 47, Lilongwe, Malawi'
const WA      = process.env.GARAGE_WHATSAPP || '+265999000000'

// ── BASE TEMPLATE ─────────────────────────────────────────────────────────────
function baseHtml(title, bodyHtml) {
  const logoUrl = process.env.LOGO_URL || 'https://automedic-mw.up.railway.app/logo.jpg'

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <style>
    body{margin:0;padding:0;background:#F0F2F5;font-family:'Segoe UI',Arial,sans-serif;color:#1A1A2E}
    .wrap{max-width:580px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .body{padding:32px}
    .badge{display:inline-block;background:#B8860B;color:#ffffff;border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;margin-bottom:20px}
    h2{font-size:22px;font-weight:900;margin:0 0 8px;color:#1A1A2E}
    p{font-size:15px;line-height:1.6;color:#374151;margin:0 0 16px}
    .card{background:#F8F9FA;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #E5E7EB}
    .row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #E5E7EB}
    .row:last-child{border-bottom:none}
    .row-label{font-size:13px;color:#6B7280}
    .row-value{font-size:13px;font-weight:600;color:#1A1A2E}
    .btn{display:inline-block;background:#B8860B;color:#ffffff !important;padding:12px 28px;border-radius:100px;font-weight:700;font-size:14px;text-decoration:none;margin-top:8px}
    .footer{background:#F8F9FA;padding:20px 32px;border-top:1px solid #E5E7EB;text-align:center}
    .footer p{font-size:12px;color:#9CA3AF;margin:0}
    .progress-bar{background:#E5E7EB;border-radius:100px;height:10px;overflow:hidden;margin:12px 0}
    .progress-fill{height:100%;border-radius:100px;background:linear-gradient(90deg,#B8860B,#F59E0B)}
  </style>
</head>
<body>
  <div class="wrap">
    <!-- BULLETPROOF HEADER TABLE -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#1A1A2E;border-collapse:collapse;">
      <tr>
        <td style="padding:20px 28px;vertical-align:middle;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <!-- Logo Image Badge -->
              <td style="vertical-align:middle;padding-right:14px;">
                <img src="${logoUrl}" alt="AutoMedic" width="44" height="44" style="display:block;width:44px;height:44px;border-radius:12px;object-fit:cover;border:0;" />
              </td>
              <!-- Brand Name -->
              <td style="vertical-align:middle;color:#FFFFFF;font-family:'Segoe UI',Arial,sans-serif;font-weight:900;font-size:22px;line-height:1;letter-spacing:-0.5px;">
                Auto<span style="color:#B8860B;">Medic</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div class="body">${bodyHtml}</div>

    <!-- FOOTER -->
    <div class="footer">
      <p>${GARAGE} · ${ADDRESS}</p>
      <p style="margin-top:4px;">📞 ${PHONE} · WhatsApp: <a href="https://wa.me/${WA.replace(/\D/g,'')}" style="color:#B8860B;text-decoration:none;">${PHONE}</a></p>
      <p style="margin-top:8px;">© ${new Date().getFullYear()} AutoMedic. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
}

// ── SEND HELPER ───────────────────────────────────────────────────────────────
async function send(to, subject, html) {
  const recipient = process.env.EMAIL_OVERRIDE || to

  // 1. Try Gmail Direct SSL (Port 465) — sends directly to ANY customer Google email
  try {
    const transporter = getTransporter()
    const from = getFromEmail()
    const info = await transporter.sendMail({ from, to: recipient, subject, html })
    console.log(`[EMAIL] Gmail SMTP (SSL 465) sent to ${recipient}: ${subject} (ID: ${info.messageId})`)
    return { success: true, messageId: info.messageId }
  } catch (smtpErr) {
    console.warn(`[EMAIL] Gmail SMTP failed to send to ${recipient}: ${smtpErr.message}. Trying Resend API fallback...`)
  }

  // 2. Fallback to Resend API if SMTP is blocked by network host
  if (USE_RESEND && resend) {
    const fromEmail = process.env.RESEND_FROM || process.env.EMAIL_FROM || `AutoMedic <onboarding@resend.dev>`
    try {
      const { data, error } = await resend.emails.send({ from: fromEmail, to: recipient, subject, html })
      if (error) {
        console.error(`[EMAIL] Resend API error sending to ${recipient}:`, JSON.stringify(error))
        return { success: false, error: error.message || JSON.stringify(error) }
      }
      console.log(`[EMAIL] Resend API sent to ${recipient}: ${subject} (id: ${data?.id})`)
      return { success: true, messageId: data?.id }
    } catch (err) {
      console.error(`[EMAIL] Resend exception sending to ${recipient}:`, err.message)
      return { success: false, error: err.message }
    }
  }

  return { success: false, error: 'All email transports failed' }
}

// ── EMAIL TEMPLATES ───────────────────────────────────────────────────────────

/**
 * Test email endpoint helper
 */
async function sendTestEmail({ email }) {
  const html = baseHtml('Email Test - AutoMedic', `
    <div class="badge">✅ Email Working!</div>
    <h2>Success! Email is configured correctly.</h2>
    <p>This test email was sent from your AutoMedic backend.</p>
    <div class="card">
      <div class="row">
        <span class="row-label">Test Time</span>
        <span class="row-value">${new Date().toLocaleString()}</span>
      </div>
      <div class="row">
        <span class="row-label">Email Provider</span>
        <span class="row-value">${USE_RESEND ? 'Resend API (HTTPS)' : (process.env.EMAIL_HOST || 'smtp.gmail.com')}</span>
      </div>
      <div class="row">
        <span class="row-label">From Email</span>
        <span class="row-value">${USE_RESEND ? (process.env.RESEND_FROM || 'onboarding@resend.dev') : getFromEmail()}</span>
      </div>
    </div>
    <p>If you received this email, your email configuration is working perfectly! 🎉</p>
    <p style="font-size:13px;color:#9CA3AF;margin-top:20px">Customers will now receive real email notifications for appointment bookings, repair updates, inspection reports, and invoices.</p>
  `)
  return await send(email, '✅ Email Test - AutoMedic', html)
}

/**
 * Welcome email after registration
 */
async function sendWelcome({ name, email }) {
  const html = baseHtml('Welcome to AutoMedic', `
    <div class="badge">Welcome 🎉</div>
    <h2>Hi ${name}, welcome to AutoMedic!</h2>
    <p>Your account is ready. You can now book appointments, track your vehicle's repair progress in real-time, and view your service history — all from your dashboard.</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="btn">Go to Dashboard →</a>
    <p style="margin-top:24px;font-size:13px;color:#9CA3AF">If you didn't create this account, please ignore this email.</p>
  `)
  await send(email, `Welcome to ${GARAGE}!`, html)
}

/**
 * Appointment Created email (sent to customer upon booking request)
 */
async function sendAppointmentCreated({ name, email, tracking, date, vehicle, service }) {
  const html = baseHtml('Booking Received', `
    <div class="badge">📋 Booking Received</div>
    <h2>Thank you for your booking request</h2>
    <p>Hi ${name}, we have received your service request at ${GARAGE}. Our service team will review it shortly.</p>
    <div class="card">
      <div class="row"><span class="row-label">Tracking #</span><span class="row-value" style="color:#B8860B;font-size:16px;font-weight:700">${tracking}</span></div>
      <div class="row"><span class="row-label">Vehicle</span><span class="row-value">${vehicle}</span></div>
      <div class="row"><span class="row-label">Requested Service</span><span class="row-value">${service || 'General Service'}</span></div>
      <div class="row"><span class="row-label">Preferred Date</span><span class="row-value">${date}</span></div>
      <div class="row"><span class="row-label">Status</span><span class="row-value" style="color:#D97706;font-weight:700">Pending Review</span></div>
    </div>
    <p>You can check the live status of your booking anytime using your tracking number.</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/track/${tracking}" class="btn">Track My Booking →</a>
  `)
  await send(email, `Booking Received — ${tracking}`, html)
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
      <div class="row"><span class="row-label">Scheduled Date</span><span class="row-value">${date}</span></div>
      ${technicianName ? `<div class="row"><span class="row-label">Assigned Technician</span><span class="row-value">${technicianName}</span></div>` : ''}
    </div>
    <p>You can track your vehicle's repair progress at any time using your tracking number.</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/track/${tracking}" class="btn">Track My Vehicle →</a>
  `)
  await send(email, `Booking Confirmed — ${tracking}`, html)
}

/**
 * Appointment status update email (e.g. cancelled, in progress, completed)
 */
async function sendAppointmentStatusUpdate({ name, email, tracking, vehicle, status }) {
  const statusLabels = {
    confirmed:   { label: 'Booking Confirmed', desc: 'Your appointment has been confirmed by our service team.' },
    in_progress: { label: 'Repair Started',    desc: 'Work on your vehicle has officially begun.' },
    completed:   { label: 'Vehicle Ready',     desc: 'Your vehicle service is completed and ready for collection.' },
    cancelled:   { label: 'Booking Cancelled', desc: 'Your appointment booking has been cancelled.' },
  }
  const info = statusLabels[status] || { label: `Status Update: ${status}`, desc: 'Your appointment status has been updated.' }

  const html = baseHtml('Appointment Update', `
    <div class="badge">${info.label}</div>
    <h2>${info.label}</h2>
    <p>Hi ${name}, here is an update regarding your booking for <strong>${vehicle}</strong>.</p>
    <p>${info.desc}</p>
    <div class="card">
      <div class="row"><span class="row-label">Booking #</span><span class="row-value">${tracking}</span></div>
      <div class="row"><span class="row-label">Vehicle</span><span class="row-value">${vehicle}</span></div>
      <div class="row"><span class="row-label">Current Status</span><span class="row-value" style="font-weight:700">${info.label}</span></div>
    </div>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/track/${tracking}" class="btn">View Live Status →</a>
  `)
  await send(email, `Appointment Update: ${info.label} — ${tracking}`, html)
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
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="btn">Review &amp; Sign →</a>
  `)
  return await send(email, `Inspection Ready — Sign-off Required (${tracking})`, html)
}

/**
 * Repair progress update
 */
async function sendRepairUpdate({ name, email, tracking, vehicle, status, progress, notes }) {
  const statusMessages = {
    diagnosis:     { label: 'Diagnosis in Progress', desc: 'Our technician is currently diagnosing your vehicle.' },
    parts_ordered: { label: 'Parts Ordered',          desc: 'Parts have been ordered for your vehicle.' },
    in_progress:   { label: 'Repair in Progress',     desc: 'Active repair work has started on your vehicle.' },
    quality_check: { label: 'Quality Check',           desc: 'Your vehicle is undergoing a final quality inspection.' },
    ready:         { label: '🎉 Vehicle Ready!',        desc: 'Your vehicle is ready for collection. Please visit us at your earliest convenience.' },
    completed:     { label: 'Service Completed',       desc: `Thank you for choosing ${GARAGE}. Your service has been completed.` },
  }
  const info = statusMessages[status] || { label: `Status Update: ${status}`, desc: 'Your repair status has been updated.' }
  const mainText = notes || info.desc

  const html = baseHtml('Repair Update', `
    <div class="badge">🔧 Repair Update</div>
    <h2>${info.label}</h2>
    <p>Hi ${name}, here is the latest update regarding your vehicle <strong>${vehicle}</strong>:</p>
    
    <div class="card" style="border-left: 4px solid #B8860B; background-color: #F8F9FA; padding: 16px 20px; margin: 20px 0;">
      <p style="margin:0; font-size:15px; font-weight:600; color:#1A1A2E; line-height:1.6;">${mainText}</p>
    </div>

    <div class="card">
      <div class="row"><span class="row-label">Booking / Tracking #</span><span class="row-value" style="color:#B8860B;font-size:15px;font-weight:700;">${tracking}</span></div>
      <div class="row"><span class="row-label">Current Status</span><span class="row-value" style="font-weight:700;">${info.label}</span></div>
      <div class="row"><span class="row-label">Completion Progress</span><span class="row-value" style="font-weight:700;color:#B8860B;">${progress}%</span></div>
    </div>
    
    <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/track/${tracking}" class="btn">View Live Progress →</a>
  `)
  return await send(email, `Repair Update: ${info.label} (${progress}%) — ${tracking}`, html)
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
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="btn">View Invoice →</a>
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
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="btn">Login Now →</a>
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
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/technician" class="btn">View Job Details →</a>
  `)
  await send(email, `New Job Assignment — ${tracking}`, html)
}

/**
 * Password reset email
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

/**
 * Custom email notification sent directly by admin/staff to customer
 */
async function sendCustomNotification({ name, email, subject, message }) {
  const html = baseHtml(subject || 'Update from AutoMedic', `
    <div class="badge">📩 Garage Notification</div>
    <h2>Update regarding your vehicle service</h2>
    <p>Hi ${name},</p>
    <div class="card">
      <p style="margin:0;font-size:15px;line-height:1.6;white-space:pre-wrap;color:#1A1A2E">${message}</p>
    </div>
    <p>If you have any questions, please feel free to reply or call us at ${PHONE}.</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="btn">Go to Dashboard →</a>
  `)
  return await send(email, subject || `Update from ${GARAGE}`, html)
}

module.exports = {
  sendTestEmail,
  sendWelcome,
  sendAppointmentCreated,
  sendAppointmentConfirmed,
  sendAppointmentStatusUpdate,
  sendInspectionReady,
  sendRepairUpdate,
  sendInvoiceReady,
  sendNewAccountCredentials,
  sendPasswordReset,
  sendJobAssigned,
  sendCustomNotification,
}
