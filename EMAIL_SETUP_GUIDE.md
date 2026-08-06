# 📧 Email Setup Guide - AutoMedic

## Current Status

❌ **Emails are NOT working** - seeing "Connection timeout" errors in logs  
❌ EMAIL_USER is set to dummy value: `your_email@gmail.com`  
❌ EMAIL_PASS is set to dummy value: `your_app_password_here`  

## What Emails Does AutoMedic Send?

The system sends emails for:

1. **Welcome Email** - When customer registers
2. **Appointment Confirmation** - When admin accepts appointment
3. **Inspection Ready** - When technician submits inspection report
4. **Invoice Ready** - When job is completed and invoice generated
5. **Repair Progress** - When technician updates job status
6. **Password Reset** - When user requests password reset (if implemented)

---

## Option 1: Gmail (Recommended for Testing)

### Step 1: Enable 2-Factor Authentication

1. Go to Google Account: https://myaccount.google.com/security
2. Enable **2-Step Verification**
3. Complete the setup

### Step 2: Create App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select **Mail** and your device
3. Click **Generate**
4. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 3: Configure Railway Environment Variables

Go to Railway Dashboard → Your Project → Variables → Add:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_actual_email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop   # (no spaces)
EMAIL_FROM=AutoMedic <your_actual_email@gmail.com>
```

### Gmail Limits:
- **500 emails per day** (free account)
- **2,000 emails per day** (Google Workspace)
- Good for: Testing, small garages (<50 customers/day)

---

## Option 2: SendGrid (Recommended for Production)

### Why SendGrid?
- ✅ **100 emails/day FREE** forever
- ✅ Better deliverability than Gmail
- ✅ Email analytics (open rate, click rate)
- ✅ Professional sender reputation
- ✅ Less likely to land in spam

### Setup Steps:

#### 1. Create SendGrid Account
- Go to: https://signup.sendgrid.com/
- Sign up for **FREE plan**
- Verify email address

#### 2. Create API Key
- Dashboard → Settings → API Keys → Create API Key
- Name: `AutoMedic Production`
- Permissions: **Full Access** (or just Mail Send)
- Copy the API key (starts with `SG.`)

#### 3. Verify Sender Email
- Dashboard → Settings → Sender Authentication
- Click **Verify a Single Sender**
- Enter: `noreply@automedic.mw` (or your domain)
- Check email and verify

#### 4. Configure Railway Environment Variables

```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxx  # Your actual API key
EMAIL_FROM=AutoMedic <noreply@automedic.mw>
```

**IMPORTANT:** EMAIL_USER must be exactly `apikey` (not your email!)

---

## Option 3: Resend (Modern Alternative)

### Why Resend?
- ✅ **3,000 emails/month FREE**
- ✅ Modern API, great docs
- ✅ React Email templates support
- ✅ No credit card required

### Setup Steps:

#### 1. Create Account
- Go to: https://resend.com/
- Sign up with GitHub/Google

#### 2. Create API Key
- Dashboard → API Keys → Create
- Copy the key (starts with `re_`)

#### 3. Verify Domain (Optional but recommended)
- Dashboard → Domains → Add Domain
- Add DNS records to your domain
- Or use `onboarding@resend.dev` for testing

#### 4. Configure Railway

```bash
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=resend
EMAIL_PASS=re_xxxxxxxxxxxxxxxxxxxxxxxxx  # Your API key
EMAIL_FROM=AutoMedic <onboarding@resend.dev>  # Or your verified domain
```

---

## Quick Test (After Configuration)

### Option A: Test via Railway Shell

```bash
# Connect to Railway
railway shell

# Create test script
cat > test-email.js << 'EOF'
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

transporter.sendMail({
  from: process.env.EMAIL_FROM,
  to: 'your_personal_email@gmail.com',  // Change this!
  subject: 'Test Email from AutoMedic',
  html: '<h1>Success!</h1><p>Email is working!</p>'
}, (err, info) => {
  if (err) {
    console.error('❌ FAILED:', err.message)
  } else {
    console.log('✅ SUCCESS:', info.messageId)
  }
  process.exit(0)
})
EOF

# Run test
node test-email.js
```

### Option B: Test via API Endpoint

I can create a test endpoint for you to call from browser.

---

## Update Garage Information

Also update these in Railway → Variables:

```bash
GARAGE_NAME=AutoMedic Garage
GARAGE_PHONE=+265 994 040 900  # Your actual phone
GARAGE_ADDRESS=Area 47, Lilongwe, Malawi
GARAGE_WHATSAPP=265994040900  # Your actual WhatsApp (no + or spaces)
GARAGE_EMAIL=info@automedic.mw  # Your actual email
GARAGE_HOURS=Mon–Sat: 7am – 6pm
```

These appear in email footers!

---

## Common Issues & Solutions

### Issue 1: "Connection timeout"
**Cause:** Invalid credentials or wrong host  
**Fix:** Double-check EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS

### Issue 2: "Authentication failed"
**Cause:** Wrong password or app password not created  
**Fix:** 
- Gmail: Create app password (not your account password!)
- SendGrid: Use `apikey` as EMAIL_USER

### Issue 3: Emails go to spam
**Cause:** Using personal Gmail, not verified domain  
**Fix:** 
- Use SendGrid or Resend (better reputation)
- Or: Verify your domain with SPF/DKIM records

### Issue 4: "Daily limit exceeded"
**Cause:** Gmail's 500/day limit hit  
**Fix:** Switch to SendGrid (100/day free) or upgrade Gmail to Google Workspace

---

## Testing Checklist

After configuring, test these scenarios:

- [ ] Register new customer → Should receive welcome email
- [ ] Admin accepts appointment → Customer receives confirmation
- [ ] Technician submits inspection → Customer receives notification
- [ ] Job completed → Customer receives invoice email
- [ ] Check spam folder if not in inbox
- [ ] Check Railway logs for `[EMAIL] Sent to...` messages

---

## My Recommendation

**For Production (right now):**
1. Use **SendGrid Free Plan** (100 emails/day)
2. Takes 10 minutes to setup
3. Much more reliable than Gmail
4. Professional appearance

**For Future (when you grow):**
1. Get custom domain (automedic.mw)
2. Verify domain with SendGrid
3. Upgrade to SendGrid Pro if needed ($20/month = 40,000 emails)

---

## What Should I Do?

**Tell me which option you want:**

1. **"Setup Gmail"** - I'll walk you through Gmail setup (quick but limited)
2. **"Setup SendGrid"** - I'll walk you through SendGrid (recommended)
3. **"Setup Resend"** - I'll walk you through Resend (modern option)
4. **"Create test endpoint"** - I'll add a `/test-email` endpoint so you can test easily

**Or give me your email credentials and I'll configure it directly!**

Format:
```
Provider: Gmail / SendGrid / Resend
Email: your_email@gmail.com
App Password / API Key: xxxxxxxxxxxx
```

Then I'll add them to Railway for you! 🚀
