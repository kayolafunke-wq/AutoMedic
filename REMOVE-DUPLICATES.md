# Remove Duplicate Job Cards for BFK

The duplicate job cards need to be removed from the production Railway database.

## Option 1: Run SQL Command Directly in Railway

1. Go to Railway dashboard: https://railway.app
2. Click on your **AutoMedic backend** service
3. Click **"Data"** tab (or **"PostgreSQL"** service)
4. Click **"Query"** button
5. Run this SQL:

```sql
-- First, check how many duplicates exist
SELECT jc.id, jc.appointment_id, jc.created_at, a.tracking_number, v.registration_number
FROM job_cards jc
LEFT JOIN appointments a ON jc.appointment_id = a.id
LEFT JOIN vehicles v ON a.vehicle_id = v.id
WHERE v.registration_number = 'JK 2345'
ORDER BY jc.created_at ASC;

-- Then delete the newest duplicate(s), keeping the oldest one
-- Replace 'DUPLICATE_JOB_CARD_ID' with the actual ID from the query above
DELETE FROM repair_updates WHERE job_card_id = 'DUPLICATE_JOB_CARD_ID';
DELETE FROM job_cards WHERE id = 'DUPLICATE_JOB_CARD_ID';
```

## Option 2: SSH into Railway and Run Node Script

Run these commands on your local computer:

```bash
# Install Railway CLI if you haven't
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run the cleanup script
railway run node backend/remove-duplicate-jobs.js
```

## What This Does

- Finds all job cards for vehicle registration "JK 2345" (BFK's toyota vitz)
- Keeps the **oldest** job card (first one created)
- Deletes any newer duplicates along with their repair updates
- Shows you the final state after cleanup

## After Removal

Refresh your technician dashboard and you should see only ONE job for BFK's toyota vitz.
