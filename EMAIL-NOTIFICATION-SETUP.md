# Email & Notification Setup Guide

## 📧 Email Configuration

You'll use **Gmail** (kayolafunke@gmail.com) to send all AutoMedic notifications.

### Railway Environment Variables

Go to **Railway → Backend Service → Variables** and add these:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=kayolafunke@gmail.com
EMAIL_PASS=kbmd yicz tybp muln
EMAIL_FROM=AutoMedic <kayolafunke@gmail.com>
```

**Important:** 
- Copy each line exactly
- The `EMAIL_PASS` is your Gmail App Password (with spaces)
- The `EMAIL_FROM` includes the company name

---

## 🔔 What Emails Are Sent?

### 1. **Appointment Confirmed**
**When:** Admin assigns a technician and confirms appointment
**To:** Customer
**Subject:** "Your AutoMedic Appointment is Confirmed"
**Contains:**
- Tracking number
- Date & time
- Vehicle details
- Service booked
- Technician name

### 2. **Job Assigned**
**When:** Admin assigns a job to a technician
**To:** Technician
**Subject:** "New Job Card Assigned"
**Contains:**
- Job reference
- Vehicle details
- Service to perform
- Customer info

### 3. **Password Reset**
**When:** User clicks "Forgot Password"
**To:** User
**Subject:** "Reset Your AutoMedic Password"
**Contains:**
- Reset link (valid for 1 hour)

---

## 📱 In-App Notifications

### Customer Dashboard Notifications:
- ✅ Appointment confirmed
- ✅ Appointment cancelled
- ✅ Repair started (in progress)
- ✅ Vehicle ready for collection (completed)

### Technician Dashboard Notifications:
- ✅ New job card assigned
- ✅ Job priority changed
- ✅ New inspection assigned

### Admin Dashboard Notifications:
- ✅ New appointment created
- ✅ Payment received
- ✅ Low stock alerts

---

## ✅ Testing the Setup

### Step 1: Add Environment Variables
1. Go to Railway → Backend → Variables
2. Click **"+ New Variable"**
3. Add each of the 5 variables above
4. Click **"Deploy"** (Railway will restart the backend)

### Step 2: Test Email Notification
1. Wait 1-2 minutes for deployment
2. Go to admin dashboard → Appointments
3. Create a new appointment or reassign an existing one
4. Check the customer's email (kayolafrank129@gmail.com)
5. You should receive an email confirmation

### Step 3: Test In-App Notifications
1. Log in as customer (kayolafrank129@gmail.com)
2. Look for the **bell icon** 🔔 in the top right
3. You should see notifications about your appointment

---

## 🐛 Troubleshooting

### Email Not Sending

**Check Railway Logs:**
```
Railway → Backend → Logs
Look for: "✉️ Email sent" or "❌ Email error"
```

**Common Issues:**

1. **"Invalid login"**
   - Make sure `EMAIL_PASS` has the app password with spaces: `kbmd yicz tybp muln`
   - Don't use your regular Gmail password

2. **"Connection timeout"**
   - Check `EMAIL_PORT` is `587` (not 465 or 25)
   - Check `EMAIL_HOST` is `smtp.gmail.com`

3. **Emails go to spam**
   - Add kayolafunke@gmail.com to customer's contacts
   - Gmail sending limit: 500 emails/day

### Notifications Not Showing

**Check Database:**
Run in Railway console:
```bash
node -e "
require('dotenv').config();
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}});
pool.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5')
  .then(r => { console.table(r.rows); return pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
"
```

If no notifications appear, the `notify()` function is failing.

---

## 📋 Email Templates

The system uses these templates (already coded):

### 1. Appointment Confirmed Template
- Professional HTML email
- Company branding
- Appointment details in table format
- Tracking link

### 2. Job Assigned Template
- Professional HTML email
- Job details
- Customer & vehicle info
- Call to action button

### 3. Password Reset Template
- Simple, secure design
- One-click reset button
- Expiration warning

---

## 🚀 Next Steps

1. **Add the 5 environment variables** to Railway
2. **Wait for deployment** (1-2 minutes)
3. **Test by assigning a job** to a technician
4. **Check both email and in-app notifications**

---

## 💡 Future Enhancements

Consider adding:
- SMS notifications (Twilio)
- WhatsApp notifications (Twilio API)
- Push notifications (Firebase Cloud Messaging)
- Email receipts for invoices
- Service reminders

---

**Support Contact:** kayolafunke@gmail.com
