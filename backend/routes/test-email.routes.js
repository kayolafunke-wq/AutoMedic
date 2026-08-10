const express = require('express')
const router = express.Router()
const { authenticate, authorize } = require('../middleware/auth')
const emailService = require('../services/email.service')

/**
 * POST /api/test-email
 * Test email configuration - sends test email to specified address
 * Admin only for security
 */
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email address is required' 
      })
    }

    // Check if email is configured (Resend API or SMTP)
    const hasResend = !!process.env.RESEND_API_KEY
    const hasSmtp   = process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_email@gmail.com'
    if (!hasResend && !hasSmtp) {
      return res.status(400).json({
        success: false,
        message: 'Email is not configured. Set RESEND_API_KEY (recommended) or EMAIL_USER + EMAIL_PASS.',
        config: {
          RESEND_API_KEY: 'NOT SET',
          EMAIL_HOST: process.env.EMAIL_HOST || 'NOT SET',
          EMAIL_USER: process.env.EMAIL_USER || 'NOT SET',
        }
      })
    }

    // Send test email
    console.log(`📧 Sending test email to ${email}...`)
    const result = await emailService.sendTestEmail({ email })

    if (result && result.success === false) {
      return res.status(500).json({
        success: false,
        message: `Failed to send email: ${result.error || result.reason}`,
        error: result.error || result.reason,
        config: {
          EMAIL_HOST: process.env.EMAIL_HOST,
          EMAIL_PORT: process.env.EMAIL_PORT,
          EMAIL_FROM: process.env.EMAIL_FROM,
          EMAIL_USER: process.env.EMAIL_USER
        }
      })
    }

    res.json({
      success: true,
      message: `Test email sent to ${email}. Check your inbox (and spam folder)!`,
      provider: process.env.RESEND_API_KEY ? 'Resend API' : 'SMTP',
      config: {
        RESEND_FROM: process.env.RESEND_FROM || 'NOT SET',
        EMAIL_HOST:  process.env.EMAIL_HOST  || 'NOT SET',
        EMAIL_FROM:  process.env.EMAIL_FROM  || 'NOT SET',
      }
    })
  } catch (err) {
    console.error('❌ Test email failed:', err)
    res.status(500).json({
      success: false,
      message: 'Failed to send test email: ' + err.message,
      error: err.message
    })
  }
})

/**
 * POST /api/test-email/send-customer
 * Send a custom email directly to a customer
 * Admin only
 */
router.post('/send-customer', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, email, subject, message } = req.body
    if (!email || !message) {
      return res.status(400).json({ success: false, message: 'Email and message are required' })
    }

    const result = await emailService.sendCustomNotification({
      name: name || 'Valued Customer',
      email,
      subject: subject || 'Update from AutoMedic Garage',
      message
    })

    if (result && result.success === false) {
      return res.status(500).json({ success: false, message: result.error || result.reason })
    }

    res.json({ success: true, message: `Email notification sent to ${email}` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

/**
 * GET /api/test-email/config
 * Check current email configuration status
 * Admin only
 */
router.get('/config', authenticate, authorize('admin'), (req, res) => {
  const hasResend = !!process.env.RESEND_API_KEY
  const hasSmtp   = !!(process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_email@gmail.com')
  const isConfigured = hasResend || hasSmtp

  res.json({
    success: true,
    configured: isConfigured,
    provider: hasResend ? 'Resend API (HTTPS)' : hasSmtp ? 'SMTP/Nodemailer' : 'None',
    config: {
      RESEND_API_KEY: hasResend ? 're_***' : 'NOT SET',
      RESEND_FROM:    process.env.RESEND_FROM  || 'NOT SET',
      EMAIL_HOST:     process.env.EMAIL_HOST   || 'smtp.gmail.com',
      EMAIL_PORT:     process.env.EMAIL_PORT   || '587',
      EMAIL_USER:     hasSmtp ? process.env.EMAIL_USER : 'NOT SET',
      EMAIL_FROM:     process.env.EMAIL_FROM   || 'NOT SET',
    },
    garage: {
      GARAGE_NAME:    process.env.GARAGE_NAME    || 'NOT SET',
      GARAGE_PHONE:   process.env.GARAGE_PHONE   || 'NOT SET',
      GARAGE_EMAIL:   process.env.GARAGE_EMAIL   || 'NOT SET',
      GARAGE_ADDRESS: process.env.GARAGE_ADDRESS || 'NOT SET',
    },
    message: hasResend
      ? '✅ Resend API configured — emails will deliver in production'
      : hasSmtp
        ? '⚠️ SMTP configured — may be blocked on cloud hosts. Add RESEND_API_KEY for reliable delivery.'
        : '❌ Email not configured. Set RESEND_API_KEY in environment variables.'
  })
})

module.exports = router

