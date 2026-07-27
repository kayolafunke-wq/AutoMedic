# SQL Syntax Fix Progress

## ✅ COMPLETED (PostgreSQL syntax)
1. ✅ **auth.routes.js** - Login, register, password reset, firebase-sync
2. ✅ **users.routes.js** - User CRUD operations
3. ✅ **settings.routes.js** - Garage settings
4. ✅ **appointment.routes.js** - Booking, assignment, tracking
5. ✅ **vehicle.routes.js** - Vehicle management
6. ✅ **service.routes.js** - Service management
7. ✅ **notification.routes.js** - Notifications
8. ✅ **product.routes.js** - Product/parts management
9. ✅ **report.routes.js** - Dashboard stats (removed stock_checkouts dependency)
10. ✅ **customer.routes.js** - Already clean
11. ✅ **technician.routes.js** - Already clean
12. ⚠️ **jobcard.routes.js** - PARTIALLY fixed (GET /my route fixed, UPDATE queries still need work)

## ❌ TODO (Still have SQLite syntax)
1. ❌ **checkout.routes.js** - Stock checkout, invoice creation
2. ❌ **inspection.routes.js** - Vehicle inspections
3. ❌ **invoice.routes.js** - Invoice management
4. ❌ **inventory.routes.js** - Inventory tracking
5. ❌ **upload.routes.js** - File uploads (check if has SQL)
6. ❌ Complete **jobcard.routes.js** - Remaining UPDATE queries

---

## Priority Order for Fixing

### HIGH PRIORITY (Core features customers use):
1. **inspection.routes.js** - Technicians need this to start work
2. **invoice.routes.js** - Needed for billing
3. **jobcard.routes.js** (complete) - Job progress updates

### MEDIUM PRIORITY (Admin features):
4. **checkout.routes.js** - Parts checkout system
5. **inventory.routes.js** - Stock management

### LOW PRIORITY:
6. **upload.routes.js** - File uploads

---

## Known Schema Differences (SQLite → PostgreSQL)

### Tables with Different Schemas:
- **inspections** - No `reference_number`, `vehicle_id`, `customer_id` columns
- **stock_checkouts** - Table doesn't exist in PostgreSQL
- **notifications** - Schema TBD

### Date Function Changes:
- `date('now')` → `CURRENT_DATE`
- `strftime('%Y-%m', date)` → `TO_CHAR(date, 'YYYY-MM')`
- `date('now', '-X days')` → `CURRENT_DATE - INTERVAL 'X days'`

### Placeholder Changes:
- `?` → `$1, $2, $3, ...` (numbered placeholders)

---

## Next Steps

1. Fix **inspection.routes.js** (HIGH PRIORITY)
2. Fix **invoice.routes.js** (HIGH PRIORITY)  
3. Complete **jobcard.routes.js** (HIGH PRIORITY)
4. Fix **checkout.routes.js** (MEDIUM)
5. Fix **inventory.routes.js** (MEDIUM)
6. Test all features end-to-end

