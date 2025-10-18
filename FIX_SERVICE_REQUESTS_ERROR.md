# Fix: "Failed to load service requests" Error

## Problem
The frontend shows "Failed to load service requests" error because the database is missing the `service_requests_view` that the backend API depends on.

## Solution

You have **2 options**:

---

### Option 1: Add Just the Missing View (Quick Fix - 10 seconds)

If you've already set up the database and don't want to start over:

```bash
mysql -u root -p < database/add_missing_view.sql
```

This will create only the missing view without affecting your existing data.

---

### Option 2: Re-run Complete Database Setup (Clean Start)

If you want to start fresh with all fixes:

```bash
mysql -u root -p < database/COMPLETE_DATABASE_SETUP.sql
```

This will drop and recreate everything, including the missing view.

---

## Verify the Fix

After running either option, verify the view was created:

```bash
mysql -u root -p
```

```sql
USE skynest_hotels;

-- Check if view exists
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Test the view
SELECT * FROM service_requests_view LIMIT 5;

-- Exit
exit
```

---

## Restart Your Application

After fixing the database:

1. **Make sure backend is running:**
   ```bash
   cd backend
   npm start
   ```
   You should see: "Database connected successfully"

2. **Make sure frontend is running:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)

---

## Why This Happened

The `COMPLETE_DATABASE_SETUP.sql` file was missing the `service_requests_view` definition. The backend controller queries this view:

```javascript
// backend/controllers/serviceRequestController.js
let query = 'SELECT * FROM service_requests_view WHERE 1=1';
```

Without this view, the query fails and you get the "Failed to load service requests" error.

---

## What Was Fixed

✅ Added `service_requests_view` to `COMPLETE_DATABASE_SETUP.sql`  
✅ Created `add_missing_view.sql` for quick fix  
✅ View now includes all necessary fields for the API  

---

## Expected Result

After the fix, the Service Requests page should:
- ✅ Load without errors
- ✅ Show "0 Rejected" (or actual count if you have data)
- ✅ Display service requests table
- ✅ Allow filtering and viewing details

---

**Status**: Ready to fix! Run Option 1 for quick fix or Option 2 for clean setup.
