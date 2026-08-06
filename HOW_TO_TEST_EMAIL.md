# 📧 How to Test Email (Quick Guide)

## ✅ Code is Already Deployed!

The email testing endpoint is now live on Railway.

---

## Option 1: Test via Postman/Thunder Client (Easiest)

### Step 1: Login as Admin
```
POST https://automedic-mw.up.railway.app/api/auth/login
Content-Type: application/json

{
  "email": "your_admin_email@automedic.mw",
  "password": "your_admin_password"
}
```

Copy the `token` from response.

### Step 2: Check Email Config
```
GET https://automedic-mw.up.railway.app/api/test-email/config
Authorization: Bearer YOUR_TOKEN_HERE
```

**If configured:**
```json
{
  "success": true,
  "configured": true,
  "message": "✅ Email is configured and ready"
}
```

**If NOT configured:**
```json
{
  "success": true,
  "configured": false,
  "message": "❌ Email is not configured"
}
```

### Step 3: Send Test Email
```
POST https://automedic-mw.up.railway.app/api/test-email
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "email": "your_personal_email@gmail.com"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Test email sent to your_personal_email@gmail.com. Check your inbox!"
}
```

---

## Option 2: Test via Browser Console (Quick & Dirty)

1. Login to admin dashboard: https://automedic-mw.up.railway.app/admin
2. Open browser console (F12)
3. Run this code:

```javascript
// Get token from localStorage
const token = localStorage.getItem('am_token')

// Check config
fetch('https://automedic-mw.up.railway.app/api/test-email/config', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('EMAIL CONFIG:', data))

// Send test email
fetch('https://automedic-mw.up.railway.app/api/test-email', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'your_personal_email@gmail.com'  // CHANGE THIS!
  })
})
.then(r => r.json())
.then(data => console.log('TEST RESULT:', data))
```

---

## Option 3: Test via Railway Shell (Advanced)

```bash
# Connect to Railway
railway shell

# Create test script
cat > send-test.js << 'EOF'
const emailService = require('./services/email.service')

emailService.sendTestEmail({ 
  email: 'your_personal_email@gmail.com'  // CHANGE THIS!
})
.then(() => {
  console.log('✅ Email sent successfully!')
  process.exit(0)
})
.catch(err => {
  console.error('❌ Email failed:', err.message)
  process.exit(1)
})
EOF

# Run test
node send-test.js
```

---

## What Email Should Look Like

If configured correctly, you'll receive an email with:

**Subject:** ✅ Email Test - AutoMedic

**Content:**
```
✅ Email Working!

Success! Email is configured correctly.

This test email was sent from your AutoMedic backend on Railway.

Test Time: [Current Date/Time]
Email Provider: smtp.gmail.com (or smtp.sendgrid.net, etc.)
From Email: AutoMedic <noreply@automedic.mw>

If you received this email, your email configuration is working perfectly! 🎉

Customers will now receive appointment confirmations, inspection reports, and invoice notifications.
```

---

## Troubleshooting

### "Email is not configured"
**Solution:** Set EMAIL_USER and EMAIL_PASS in Railway environment variables

Go to: Railway Dashboard → Your Project → Variables → Add:
```
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### "Connection timeout"
**Possible causes:**
1. Wrong EMAIL_HOST (should be `smtp.gmail.com` for Gmail)
2. Wrong EMAIL_PORT (should be `587` for most providers)
3. Firewall blocking Railway IP (rare)

**Solution:** Double-check EMAIL_HOST and EMAIL_PORT

### "Authentication failed"
**Possible causes:**
1. Wrong password (not using app password for Gmail)
2. For SendGrid: EMAIL_USER should be `apikey` not your email

**Solution for Gmail:**
- Must use **App Password**, not regular password
- Go to: https://myaccount.google.com/apppasswords
- Generate new app password
- Use that 16-character password

**Solution for SendGrid:**
```
EMAIL_USER=apikey  # Exactly "apikey"
EMAIL_PASS=SG.your_actual_api_key_here
```

### Email sent but not received
**Check these:**
1. Spam folder
2. Email address typo
3. Gmail might delay test emails by 1-2 minutes
4. Check Railway logs for "[EMAIL] Sent to..." message

---

## After Email is Working

Once test email works, customers will automatically receive:

✅ **Welcome email** - On registration  
✅ **Appointment confirmed** - When admin accepts booking  
✅ **Inspection ready** - When technician submits inspection  
✅ **Repair updates** - When progress changes  
✅ **Invoice ready** - When job completes  

No additional code needed - it's all already implemented!

---

## Quick Checklist

- [ ] Configure EMAIL_USER and EMAIL_PASS in Railway
- [ ] Test with GET /api/test-email/config
- [ ] Send test email with POST /api/test-email
- [ ] Check inbox (and spam folder)
- [ ] Update GARAGE_PHONE and GARAGE_ADDRESS in Railway
- [ ] Test by creating real appointment
- [ ] Monitor Railway logs for "[EMAIL] Sent to..."

---

**Need help?** Tell me:
1. What's your email provider? (Gmail, SendGrid, Resend, other)
2. Do you have the credentials ready?
3. What error are you seeing?

I can walk you through the setup! 🚀
