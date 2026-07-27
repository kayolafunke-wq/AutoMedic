-- ============================================
-- Clean up ALL duplicate job cards for JK 2345
-- This keeps only the OLDEST job card
-- ============================================

-- Step 1: View all job cards for JK 2345
SELECT jc.id, jc.appointment_id, jc.created_at, a.tracking_number, 
       u.name as customer_name, v.registration_number
FROM job_cards jc
LEFT JOIN appointments a ON jc.appointment_id = a.id
LEFT JOIN users u ON a.customer_id = u.id
LEFT JOIN vehicles v ON a.vehicle_id = v.id
WHERE v.registration_number = 'JK 2345'
ORDER BY jc.created_at ASC;

-- Step 2: Delete ALL duplicates except the oldest one
-- This finds the oldest job card and deletes everything else
WITH oldest_job AS (
  SELECT jc.id
  FROM job_cards jc
  LEFT JOIN appointments a ON jc.appointment_id = a.id
  LEFT JOIN vehicles v ON a.vehicle_id = v.id
  WHERE v.registration_number = 'JK 2345'
  ORDER BY jc.created_at ASC
  LIMIT 1
),
duplicates AS (
  SELECT jc.id
  FROM job_cards jc
  LEFT JOIN appointments a ON jc.appointment_id = a.id
  LEFT JOIN vehicles v ON a.vehicle_id = v.id
  WHERE v.registration_number = 'JK 2345'
    AND jc.id NOT IN (SELECT id FROM oldest_job)
)
DELETE FROM repair_updates 
WHERE job_card_id IN (SELECT id FROM duplicates);

-- Delete the duplicate job cards
WITH oldest_job AS (
  SELECT jc.id
  FROM job_cards jc
  LEFT JOIN appointments a ON jc.appointment_id = a.id
  LEFT JOIN vehicles v ON a.vehicle_id = v.id
  WHERE v.registration_number = 'JK 2345'
  ORDER BY jc.created_at ASC
  LIMIT 1
)
DELETE FROM job_cards
WHERE id IN (
  SELECT jc.id
  FROM job_cards jc
  LEFT JOIN appointments a ON jc.appointment_id = a.id
  LEFT JOIN vehicles v ON a.vehicle_id = v.id
  WHERE v.registration_number = 'JK 2345'
    AND jc.id NOT IN (SELECT id FROM oldest_job)
);

-- Step 3: Verify only 1 job card remains
SELECT COUNT(*) as remaining_count, 
       MIN(jc.created_at) as kept_job_created_at
FROM job_cards jc
LEFT JOIN appointments a ON jc.appointment_id = a.id
LEFT JOIN vehicles v ON a.vehicle_id = v.id
WHERE v.registration_number = 'JK 2345';

-- Should show: remaining_count = 1
