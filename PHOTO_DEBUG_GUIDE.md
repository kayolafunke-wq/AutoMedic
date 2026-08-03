# 📸 Inspection Photos Troubleshooting Guide

## Issue
Photos uploaded during inspection are not displaying in the inspection report.

## Root Cause Analysis

Based on code review, the system is **working correctly**:

1. ✅ `inspection_photos` table exists and is properly structured
2. ✅ Photos are uploaded via `POST /inspections/:id/photos` (base64 data URLs)
3. ✅ Photos are fetched via `GET /inspections/:id` and attached as `inspection.photos` array
4. ✅ Frontend displays photos from `inspection.photos` array

## Most Likely Causes

### Cause #1: No Photos Were Actually Uploaded
**Symptom:** "No Inspection Photos Uploaded" message displays
**Why:** The inspection was submitted WITHOUT uploading photos, OR photos failed to upload silently

**Solution:**
1. Create a NEW inspection with photos
2. Make sure to add photos in Step 3 (Photos tab) BEFORE submitting
3. Check browser console for upload errors

### Cause #2: Viewing Old Inspection
**Symptom:** Viewing an inspection created before photo feature was added
**Why:** Old inspections have no records in `inspection_photos` table

**Solution:**
- Create a brand NEW inspection with photos
- Don't try to add photos to existing old inspections

### Cause #3: Photos Failed to Upload Silently
**Symptom:** Photos appear in the form but don't save to database
**Why:** Network error, authentication failure, or server error during upload

**Solution:**
1. Check Railway logs for errors during photo upload
2. Run the debug script (see below)

## Debugging Steps

### Step 1: Check Production Database

SSH into Railway and run the debug script:

```bash
# On Railway
railway shell
node debug-photos-production.js
```

This will show:
- ✅ Total photos in database
- ✅ Recent photo uploads
- ✅ Which inspections have photos
- ✅ Sample photo data

### Step 2: Check Browser Console

1. Open inspection report page
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for:
   - Network errors (red)
   - API call to `/inspections/:id`
   - Response data

### Step 3: Check Railway Logs

```bash
railway logs
```

Look for:
- `POST /api/inspections/:id/photos` requests
- Any error messages during upload
- 400/500 status codes

## Testing the Fix

### Create a Fresh Test Inspection

1. **Go to Technician Dashboard**
2. **Select a job** to inspect
3. **Fill in Step 1** (Vehicle Info)
   - Set fuel level
   - Enter odometer reading
4. **Fill in Step 2** (Condition Check)
   - Mark any damages
   - Fill checklist
5. **🔥 Step 3 (Photos) - CRITICAL**
   - Upload at least 2-3 photos
   - Verify photos appear as thumbnails
   - Make sure photos are visible before clicking Next
6. **Fill in Step 4** (Accessories)
7. **Submit** the inspection
8. **View the inspection report**
   - Go to Photos tab
   - Photos should display

## Expected Behavior

### During Upload (Step 3):
- Click "Click or drag to upload"
- Select image file(s)
- Photos appear as thumbnails immediately
- Can delete photos with X button

### After Submission:
- Inspection status: "Pending Customer Sign-Off"
- View inspection report
- Navigate to "Photos" tab
- Photos display grouped by type:
  - 📸 Before Repairs
  - 📸 Damages
  - 📸 Dashboard & Odometer

### If No Photos:
- Shows message: "No Inspection Photos Uploaded"
- "No digital proof was captured during this reception"

## Code Verification Checklist

✅ Backend route exists: `POST /api/inspections/:id/photos`
✅ Backend route exists: `GET /api/inspections/:id` (fetches photos)
✅ Frontend uploads photos as base64 data URLs
✅ Frontend component displays photos from `inspection.photos` array
✅ Database table `inspection_photos` exists with proper structure

## Quick Fixes

### Fix #1: Add Console Logging

Add this to `InspectionModule.jsx` in the submit function (around line 609):

```javascript
console.log(`📸 Uploading ${toUpload.length} photos...`);
for (const p of toUpload) {
  try {
    console.log(`Uploading photo: ${p.type} - ${p.name}`);
    const res = await apiMod.post(`/inspections/${id}/photos`, {
      photo_type: p.type,
      file_url: p.url,
      file_name: p.name,
    });
    console.log(`✅ Photo uploaded:`, res.data);
  } catch (photoErr) {
    console.error(`❌ Photo upload failed:`, photoErr);
  }
}
console.log(`✅ All photos uploaded!`);
```

### Fix #2: Add Backend Logging

Add this to `inspection.routes.js` in the POST /:id/photos route (around line 290):

```javascript
console.log(`📸 Photo upload request for inspection ${req.params.id}`);
console.log(`   Type: ${photo_type}`);
console.log(`   File name: ${file_name}`);
console.log(`   URL length: ${file_url?.length} chars`);
console.log(`   Uploaded by: ${req.user.id}`);
```

## Common Mistakes

❌ **NOT uploading photos in Step 3** - Form allows submission without photos
❌ **Viewing old inspections** - Created before photo feature existed  
❌ **Network timeout** - Large photos (>5MB) may timeout on slow connections
❌ **Missing authentication** - User must be logged in to upload

## Support

If issue persists after following this guide:

1. Run `debug-photos-production.js` on Railway
2. Share the output
3. Share browser console logs
4. Share inspection reference number

---

**Last Updated:** December 2024
**Version:** 2.0
