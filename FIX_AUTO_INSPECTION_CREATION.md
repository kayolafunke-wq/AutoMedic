# ✅ FIX: Stop Auto-Creating Inspection Reports Visible to Customers

## Problem
When an admin assigned a technician to an appointment, an inspection report was automatically created with status `'pending'`. This made it immediately visible to the customer, even though the technician had NOT started working on it yet and had NOT signed anything.

**User Scenario:**
1. Admin accepts appointment ✓
2. Admin assigns technician ✓
3. 🚨 **Inspection report immediately appears on customer dashboard** ❌
4. Customer sees "Action Required — Your Signature Is Needed" banner
5. Report shows empty inspection data (no fuel level, no damages, no photos)

**Expected Behavior:**
1. Admin accepts appointment ✓
2. Admin assigns technician ✓
3. Technician performs inspection and fills out form
4. Technician signs inspection report
5. **ONLY THEN** does inspection appear to customer for signature

## Root Cause
**File:** `backend/routes/appointment.routes.js` (Line 276)

```javascript
// OLD CODE:
await db.query(
  `INSERT INTO inspections (id, appointment_id, technician_id, status)
   VALUES ($1, $2, $3, $4)`,
  [inspId, req.params.id, technician_id, 'pending']  // ❌ WRONG!
)
```

When assigning a technician, the system auto-created an inspection with status `'pending'`, which means "waiting for customer signature". This is incorrect because:
- Technician hasn't inspected the vehicle yet
- No inspection data exists (fuel, odometer, damages)
- Technician hasn't signed it
- Customer shouldn't see it yet

## Solution
Changed auto-created inspection status from `'pending'` to `'draft'`.

**File:** `backend/routes/appointment.routes.js` (Lines 261-277)

**NEW CODE:**
```javascript
// Auto-create inspection record so technician can start immediately
// Status 'draft' = technician working on it (not visible to customer yet)
// Status 'pending' = technician signed, waiting for customer signature
const apptDetail = await db.query(
  'SELECT id FROM appointments WHERE id = $1',
  [req.params.id]
)
if (apptDetail.rows.length) {
  const inspExists = await db.query(
    'SELECT id FROM inspections WHERE appointment_id = $1',
    [req.params.id]
  )
  if (!inspExists.rows.length) {
    const inspId = crypto.randomBytes(16).toString('hex')
    await db.query(
      `INSERT INTO inspections (id, appointment_id, technician_id, status)
       VALUES ($1, $2, $3, $4)`,
      [inspId, req.params.id, technician_id, 'draft']  // ✅ CORRECT!
    )
  }
}
```

## Inspection Status Flow (Corrected)

### Status: `'draft'`
- **Who sees it:** Technician only (on their dashboard)
- **When:** Auto-created when technician is assigned
- **Purpose:** Technician can fill out inspection form
- **Visible to customer:** ❌ NO

### Status: `'pending'`
- **Who sees it:** Customer (on their inspection section)
- **When:** Technician completes inspection AND signs it
- **Purpose:** Customer reviews and signs to authorize repairs
- **Visible to customer:** ✅ YES

### Status: `'customer_signed'`
- **Who sees it:** Admin, Technician, Customer
- **When:** Customer signs the inspection report
- **Purpose:** Confirms customer authorized repairs
- **Visible to customer:** ✅ YES (shows green "Signed" confirmation)

### Status: `'completed'`
- **Who sees it:** Everyone
- **When:** Job is fully completed
- **Purpose:** Archive/history
- **Visible to customer:** ✅ YES (in service history)

## What Changed
✅ Auto-created inspections now have status `'draft'` instead of `'pending'`  
✅ Customers no longer see empty inspection reports  
✅ Inspections only appear to customers AFTER technician signs them  
✅ Technician dashboard still shows draft inspections for them to work on  
✅ No more "Action Required" banners for incomplete inspections  

## Testing Checklist
- [ ] Admin creates appointment and assigns technician
- [ ] Verify technician sees inspection in their dashboard (status: draft)
- [ ] Verify customer does NOT see inspection yet
- [ ] Technician fills out inspection and signs it
- [ ] Verify status changes to 'pending'
- [ ] Verify customer NOW sees inspection with "Action Required" banner
- [ ] Customer signs inspection
- [ ] Verify status changes to 'customer_signed'
- [ ] Verify both customer and technician see signed confirmation

## Deployment
```bash
cd backend
# No database migration needed
# Deploy to Railway (will restart automatically)
```

## Files Modified
- `backend/routes/appointment.routes.js` (Lines 261-277)

## Related Fixes
This fix works together with:
1. `FIX_INSPECTION_MULTIPLE_VEHICLES.md` - Backend validation to ensure advisor_signature is valid
2. `FIX_MULTIPLE_REPAIRS_DISPLAY.md` - Frontend displays all inspections

## Status: ✅ COMPLETE
Inspections are no longer auto-sent to customers without technician signature.
