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

    // Check if email is configured
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
      return res.status(400).json({
        success: false,
        message: 'Email is not configured in process.env. Please set EMAIL_USER and EMAIL_PASS environment variables.',
        config: {
          EMAIL_HOST: process.env.EMAIL_HOST || 'NOT SET',
          EMAIL_PORT: process.env.EMAIL_PORT || 'NOT SET',
          EMAIL_USER: process.env.EMAIL_USER || 'NOT SET',
          EMAIL_FROM: process.env.EMAIL_FROM || 'NOT SET',
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
      config: {
        EMAIL_HOST: process.env.EMAIL_HOST,
        EMAIL_PORT: process.env.EMAIL_PORT,
        EMAIL_FROM: process.env.EMAIL_FROM,
        EMAIL_USER: process.env.EMAIL_USER.substring(0, 3) + '***'
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
  const isConfigured = process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_email@gmail.com'
  
  res.json({
    success: true,
    configured: isConfigured,
    config: {
      EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
      EMAIL_PORT: process.env.EMAIL_PORT || '587',
      EMAIL_USER: isConfigured ? process.env.EMAIL_USER : 'NOT SET',
      EMAIL_FROM: process.env.EMAIL_FROM || 'NOT SET',
      EMAIL_SECURE: process.env.EMAIL_SECURE || 'false',
    },
    garage: {
      GARAGE_NAME: process.env.GARAGE_NAME || 'NOT SET',
      GARAGE_PHONE: process.env.GARAGE_PHONE || 'NOT SET',
      GARAGE_EMAIL: process.env.GARAGE_EMAIL || 'NOT SET',
      GARAGE_ADDRESS: process.env.GARAGE_ADDRESS || 'NOT SET',
    },
    message: isConfigured 
      ? '✅ Email is configured and ready' 
      : '❌ Email is not configured. Set EMAIL_USER and EMAIL_PASS in environment variables.'
  })
})

module.exports = router

