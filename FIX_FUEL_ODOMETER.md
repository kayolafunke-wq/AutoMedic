# 🔧 Fix: Fuel Level & Odometer Not Saving/Displaying

## Issue
Fuel level and odometer readings filled during inspection are not saving to database or displaying in the inspection report. Shows "—" instead of the actual values.

## Root Cause
**Backend Bug:** The `POST /inspections` and `PATCH /inspections/:id/complete` endpoints were NOT including `fuel_level` and `odometer_reading` columns in their SQL INSERT/UPDATE statements.

The data was:
- ✅ Being sent from frontend correctly
- ✅ Extracted from `req.body` 
- ❌ **NEVER inserted into the database**
- ❌ Being concatenated into `advisor_notes` as a workaround (wrong approach)

## The Fix

### 1. Migration: Ensure Columns Exist
Created `migrations/1733400000000_add_inspection_fields.js`

Adds these columns to `inspections` table if they don't exist:
- `fuel_level` (varchar)
- `odometer_reading` (integer)
- `reference_number` (varchar, unique)
- `vehicle_id`, `customer_id`, `advisor_id`
- `damage_notes`, `checklist`, `accessories`, `valuables_notes`
- `customer_signature`, `advisor_signature`, `customer_signed_at`

### 2. Fixed POST /inspections Endpoint
**Before:**
```javascript
INSERT INTO inspections (
  id, appointment_id, technician_id, vehicle_health, 
  under_hood, under_vehicle, photos, recommendations, 
  advisor_notes, status
) VALUES (...)
```

**After:**
```javascript
INSERT INTO inspections (
  id, reference_number, appointment_id, vehicle_id, customer_id, technician_id,
  fuel_level, odometer_reading, damage_notes, checklist, accessories, valuables_notes,
  vehicle_health, under_hood, under_vehicle, photos, recommendations, advisor_notes, status
) VALUES (...)
```

### 3. Fixed PATCH /inspections/:id/complete Endpoint
**Before:**
```javascript
UPDATE inspections SET
  vehicle_health=$1, under_hood=$2, under_vehicle=$3, photos=$4,
  recommendations=$5, advisor_notes=$6, advisor_signature=$7, 
  status=$8, updated_at=$9
WHERE id=$10
```

**After:**
```javascript
UPDATE inspections SET
  fuel_level=$1, odometer_reading=$2, damage_notes=$3, checklist=$4, 
  accessories=$5, valuables_notes=$6, vehicle_health=$7, under_hood=$8, 
  under_vehicle=$9, photos=$10, recommendations=$11, advisor_notes=$12, 
  advisor_signature=$13, status=$14, updated_at=$15
WHERE id=$16
```

### 4. Added Logging
- ✅ Logs fuel/odometer values when creating inspection
- ✅ Logs fuel/odometer values when updating inspection
- ✅ Better error messages

### 5. Fixed Data Flow
**Removed incorrect workaround:**
```javascript
// OLD (WRONG):
const advisorNotesData = advisor_notes || (fuel_level || odometer_reading ? 
  `Fuel: ${fuel_level || 'N/A'}, Odometer: ${odometer_reading || 'N/A'}` : null)

// NEW (CORRECT):
const advisorNotesData = advisor_notes || null
// fuel_level and odometer_reading now stored in their own columns
```

## Testing

### Before Fix
1. Create inspection
2. Set fuel = "1/2", odometer = 50000
3. Submit inspection
4. View report → Shows "—" for both fields ❌

### After Fix
1. Run migration: `npm run db:migrate:new`
2. Create NEW inspection
3. Set fuel = "1/2", odometer = 50000
4. Submit inspection
5. View report → Shows "1/2" and "50,000 km" ✅

## Database Changes

### Migration Commands

**On Railway:**
```bash
railway shell
npm run db:migrate:new
```

This will:
- Add missing columns if they don't exist
- Preserve existing data
- Generate reference numbers for old inspections

### Rollback (if needed)
```bash
npm run db:migrate:down
```

## Impact on Existing Data

### Old Inspections
- Old inspections WITHOUT these columns → Will get NULL values
- Migration is **additive only** (doesn't delete data)
- No data loss

### New Inspections
- Will correctly save fuel_level and odometer_reading
- Will display properly in reports

## Files Changed

1. `backend/routes/inspection.routes.js` - Fixed POST and PATCH endpoints
2. `backend/migrations/1733400000000_add_inspection_fields.js` - New migration
3. `FIX_FUEL_ODOMETER.md` - This documentation

## Deployment Steps

1. **Commit changes**
   ```bash
   git add .
   git commit -m "fix: Save fuel_level and odometer_reading to database"
   git push
   ```

2. **Wait for Railway to deploy** (2-3 minutes)

3. **Run migration on Railway**
   ```bash
   railway shell
   npm run db:migrate:new
   ```

4. **Test with NEW inspection**
   - Create brand new inspection
   - Fill fuel and odometer
   - Submit and verify display

## Notes

- ✅ Frontend was always working correctly
- ✅ Database schema always had the columns (in SQLite schema)
- ❌ Backend endpoints were the problem (not saving to these columns)
- ✅ Migration ensures PostgreSQL production has the columns too

---

**Status:** FIXED ✅  
**Commit:** Pending  
**Railway Migration:** Required after deploy
