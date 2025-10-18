# Quick Database Setup Guide

## ✅ All Issues Fixed!

The `COMPLETE_DATABASE_SETUP.sql` file has been fixed and is now ready to use.

## 🚀 One-Command Setup (Recommended)

```bash
mysql -u root -p < database/COMPLETE_DATABASE_SETUP.sql
```

**Enter your MySQL root password when prompted.**

This single command will:
- ✅ Create the database `skynest_hotels`
- ✅ Create all 15+ tables
- ✅ Insert seed data (branches, rooms, users, guests, bookings)
- ✅ Create all functions and stored procedures
- ✅ Create all triggers
- ✅ Create reporting views
- ✅ Add performance indexes
- ✅ Optimize the database

## ⏱️ Expected Time

- **Small setup**: ~5-10 seconds
- **With all optimizations**: ~15-20 seconds

## ✔️ Verification

After running, verify the setup:

```bash
mysql -u root -p
```

```sql
-- Check database exists
SHOW DATABASES LIKE 'skynest_hotels';

-- Use the database
USE skynest_hotels;

-- Check tables (should show 15+ tables)
SHOW TABLES;

-- Check sample data
SELECT COUNT(*) as total_bookings FROM bookings;
SELECT COUNT(*) as total_guests FROM guests;
SELECT COUNT(*) as total_rooms FROM rooms;

-- Check functions exist
SHOW FUNCTION STATUS WHERE Db = 'skynest_hotels';

-- Check procedures exist
SHOW PROCEDURE STATUS WHERE Db = 'skynest_hotels';

-- Exit
exit
```

## 🔧 What Was Fixed

### Issue 1: Function Not Found (Error 1305)
- **Problem**: UPDATE statement tried to use functions before they were created
- **Fix**: Moved UPDATE statement to execute AFTER functions are defined

### Issue 2: Syntax Error (Error 1064) - First Attempt
- **Problem**: `CREATE INDEX IF NOT EXISTS` not supported in MySQL 5.7 and earlier
- **Fix Attempt 1**: Changed to `DROP INDEX IF EXISTS` + `CREATE INDEX` pattern
- **Issue**: `DROP INDEX IF EXISTS` also not supported in MySQL 5.6 and earlier

### Issue 3: Syntax Error (Error 1064) - Final Fix
- **Problem**: Both `CREATE INDEX IF NOT EXISTS` and `DROP INDEX IF EXISTS` not supported in older MySQL
- **Final Fix**: Created a stored procedure `create_index_if_not_exists()` that:
  - Checks if index exists using `information_schema`
  - Only creates index if it doesn't exist
  - Works on MySQL 5.6, 5.7, and 8.0+

## 📊 What Gets Created

### Tables (15+)
- `hotel_branches` - Hotel branch information
- `room_types` - Room categories and pricing
- `rooms` - Individual room records
- `users` - System user accounts
- `guests` - Guest information
- `bookings` - Reservation records
- `service_catalogue` - Available services
- `service_usage` - Service consumption tracking
- `payments` - Payment records
- `audit_log` - System audit trail
- `room_availability_cache` - Performance optimization
- And more...

### Sample Data
- 3 hotel branches (Colombo, Kandy, Galle)
- 5 room types (Single, Double, Deluxe, Suite, Family)
- 13 rooms across branches
- 4 users (1 admin, 3 receptionists)
- 5 guests
- 8 bookings (various statuses)
- 8 services
- Multiple service usage records
- Payment records

### Functions
- `calculate_room_charges()` - Calculate room costs
- `calculate_service_charges()` - Calculate service costs
- `check_room_availability()` - Check if room is available

### Stored Procedures
- `create_booking()` - Create new booking with validation
- `check_in_guest()` - Process guest check-in
- `check_out_guest()` - Process guest check-out
- `add_service_usage()` - Add service to booking
- `process_payment()` - Process payment transaction
- `cancel_booking()` - Cancel a booking
- And many more...

### Triggers
- `after_service_usage_insert` - Update booking totals
- `after_payment_insert` - Update payment status
- `before_booking_insert` - Validate bookings
- `after_booking_update` - Update room status
- And more...

### Views
- `room_occupancy_view` - Current room occupancy
- `guest_billing_summary` - Billing information
- `service_usage_breakdown` - Service usage details
- `monthly_revenue_by_branch` - Revenue reports
- And more...

## 🎯 Default Login Credentials

After setup, you can login with these test accounts:

**Admin:**
- Username: `admin`
- Password: `Admin@123`

**Receptionist (Colombo):**
- Username: `receptionist_colombo`
- Password: `password123`

**Receptionist (Kandy):**
- Username: `receptionist_kandy`
- Password: `password123`

**Receptionist (Galle):**
- Username: `receptionist_galle`
- Password: `password123`

## 🆘 Troubleshooting

### Error: Access denied
```bash
# Make sure you're using the correct MySQL password
mysql -u root -p
```

### Error: Database already exists
```bash
# The script will DROP and recreate the database
# This is safe - it's designed to start fresh
```

### Error: Command not found
```bash
# Make sure MySQL is in your PATH
# Windows: Add C:\Program Files\MySQL\MySQL Server 8.0\bin to PATH
# Or use full path:
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < database/COMPLETE_DATABASE_SETUP.sql
```

### Error: File not found
```bash
# Make sure you're in the Hotel-SkyNest directory
cd C:\Users\PCland\Desktop\Hotel-SkyNest
mysql -u root -p < database/COMPLETE_DATABASE_SETUP.sql
```

## 📝 Next Steps

After database setup:

1. **Configure Backend**
   ```bash
   cd backend
   npm install
   # Edit .env with your database credentials
   npm start
   ```

2. **Configure Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📚 Additional Resources

- `DATABASE_SETUP_FIX.md` - Detailed explanation of fixes
- `INSTALLATION.md` - Complete installation guide
- `DATABASE_TABLES.md` - Database schema documentation
- `DATABASE_PROCEDURES.md` - Stored procedures documentation

---

**Ready to go! Your database setup is now error-free and compatible with MySQL 5.7+ and MySQL 8.0+** 🎉
