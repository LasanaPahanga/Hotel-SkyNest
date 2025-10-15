# ⚡ Database Triggers, Views & Indexes

Complete documentation of all triggers, views, and performance indexes in the SkyNest Hotels system.

---

## 📋 Table of Contents

### Triggers
1. [after_service_usage_insert](#1-after_service_usage_insert)
2. [after_service_usage_delete](#2-after_service_usage_delete)
3. [after_payment_insert](#3-after_payment_insert)
4. [before_booking_insert](#4-before_booking_insert)
5. [before_booking_update](#5-before_booking_update)
6. [after_booking_update](#6-after_booking_update)
7. [before_service_usage_insert](#7-before_service_usage_insert)
8. [audit_booking_changes](#8-audit_booking_changes)

### Views
9. [service_requests_view](#9-service_requests_view)
10. [v_room_availability_summary](#10-v_room_availability_summary)
11. [v_todays_checkins_checkouts](#11-v_todays_checkins_checkouts)
12. [v_pending_service_requests](#12-v_pending_service_requests)
13. [v_open_support_tickets](#13-v_open_support_tickets)
14. [v_revenue_by_branch](#14-v_revenue_by_branch)
15. [v_guest_booking_history](#15-v_guest_booking_history)

### Performance Indexes
16. [Performance Indexes](#performance-indexes)

---

## Triggers

### 1. after_service_usage_insert

**Table:** `service_usage`  
**Timing:** AFTER INSERT  
**Purpose:** Automatically updates booking total when a service is added.

**Logic:**
1. Gets current booking total and paid amounts
2. Calculates room charges using `calculate_room_charges()`
3. Calculates service charges using `calculate_service_charges()`
4. Updates booking:
   - `total_amount` = room_charges + service_charges
   - `outstanding_amount` = total_amount - paid_amount

**Why It's Important:**
- ✅ Ensures bill is always accurate
- ✅ Prevents manual calculation errors
- ✅ Real-time bill updates
- ✅ Maintains data consistency

**Example:**
```sql
-- Guest orders breakfast (₹500)
INSERT INTO service_usage (booking_id, service_id, quantity, unit_price, total_price)
VALUES (1001, 5, 1, 500.00, 500.00);

-- Trigger automatically:
-- - Adds ₹500 to total_amount
-- - Adds ₹500 to outstanding_amount
```

**Supports Feature:** Live billing, service management

---

### 2. after_service_usage_delete

**Table:** `service_usage`  
**Timing:** AFTER DELETE  
**Purpose:** Recalculates booking total when a service is removed.

**Logic:**
1. Gets current paid amount
2. Recalculates room charges
3. Recalculates remaining service charges
4. Updates booking totals

**Why It's Important:**
- ✅ Handles service cancellations
- ✅ Maintains accurate billing
- ✅ Supports refund scenarios

**Example:**
```sql
-- Remove a service
DELETE FROM service_usage WHERE usage_id = 501;

-- Trigger automatically:
-- - Recalculates total without deleted service
-- - Updates outstanding amount
```

**Supports Feature:** Service cancellation, billing corrections

---

### 3. after_payment_insert

**Table:** `payments`  
**Timing:** AFTER INSERT  
**Purpose:** Updates booking payment status when payment is made.

**Logic:**
1. Calculates total paid amount (sum of all completed payments)
2. Gets booking total_amount
3. Calculates outstanding: `total_amount - total_paid`
4. Updates booking:
   - `paid_amount` = sum of payments
   - `outstanding_amount` = calculated outstanding

**Why It's Important:**
- ✅ Real-time payment tracking
- ✅ Accurate outstanding balance
- ✅ Prevents payment errors
- ✅ Enables partial payments

**Example:**
```sql
-- Guest pays ₹10,000 (partial payment)
INSERT INTO payments (booking_id, amount, payment_method)
VALUES (1001, 10000.00, 'Cash');

-- Trigger automatically:
-- - Adds ₹10,000 to paid_amount
-- - Reduces outstanding_amount by ₹10,000
```

**Supports Feature:** Payment processing, checkout validation

---

### 4. before_booking_insert

**Table:** `bookings`  
**Timing:** BEFORE INSERT  
**Purpose:** Validates booking before creation and prevents double booking.

**Validations:**
1. **Availability Check:**
   - Calls `check_room_availability()`
   - Signals error if room not available
2. **Date Validation:**
   - Check-out must be after check-in
   - Signals error if invalid dates
3. **Initial Amount:**
   - Sets `outstanding_amount` = `total_amount`

**Why It's Important:**
- ✅ **PREVENTS DOUBLE BOOKING** (Critical!)
- ✅ Enforces date logic
- ✅ Data integrity at insertion
- ✅ Blocks invalid bookings

**Example:**
```sql
-- Try to book already occupied room
INSERT INTO bookings (guest_id, room_id, check_in_date, check_out_date, ...)
VALUES (1, 101, '2025-01-15', '2025-01-18', ...);

-- If room 101 is already booked for those dates:
-- ERROR: Room is not available for the selected dates
```

**Supports Feature:** Double booking prevention, booking validation

---

### 5. before_booking_update

**Table:** `bookings`  
**Timing:** BEFORE UPDATE  
**Purpose:** Validates booking updates and prevents conflicts.

**Validations:**
1. **Date Change Check:**
   - If dates are modified, checks availability
   - Excludes current booking from conflict check
2. **Checkout Validation:**
   - Prevents checkout if outstanding balance exists
   - Signals error if balance > 0

**Why It's Important:**
- ✅ Prevents double booking on date changes
- ✅ Enforces payment before checkout
- ✅ Business rule compliance

**Example:**
```sql
-- Try to checkout with outstanding balance
UPDATE bookings 
SET booking_status = 'Checked-Out' 
WHERE booking_id = 1001;

-- If outstanding_amount > 0:
-- ERROR: Cannot check out with outstanding balance
```

**Supports Feature:** Booking modifications, checkout validation

---

### 6. after_booking_update

**Table:** `bookings`  
**Timing:** AFTER UPDATE  
**Purpose:** Updates room status when booking status changes.

**Logic:**
```
IF booking_status changed:
    CASE new_status:
        'Checked-In'  → Set room to 'Occupied'
        'Checked-Out' → Set room to 'Available'
        'Cancelled'   → Set room to 'Available' (if was 'Booked')
        'Booked'      → Set room to 'Reserved'
```

**Why It's Important:**
- ✅ Automatic room status management
- ✅ Real-time availability updates
- ✅ Reduces manual work
- ✅ Prevents status mismatches

**Example:**
```sql
-- Check-in guest
UPDATE bookings SET booking_status = 'Checked-In' WHERE booking_id = 1001;

-- Trigger automatically:
-- UPDATE rooms SET status = 'Occupied' WHERE room_id = 101;
```

**Supports Feature:** Room status management, availability tracking

---

### 7. before_service_usage_insert

**Table:** `service_usage`  
**Timing:** BEFORE INSERT  
**Purpose:** Validates service addition and calculates total price.

**Validations:**
1. **Booking Status Check:**
   - Service can only be added to 'Checked-In' bookings
   - Signals error if not checked-in
2. **Price Calculation:**
   - Automatically calculates: `total_price = unit_price × quantity`

**Why It's Important:**
- ✅ Prevents services for non-active bookings
- ✅ Automatic price calculation
- ✅ Business rule enforcement

**Example:**
```sql
-- Try to add service to booked (not checked-in) booking
INSERT INTO service_usage (booking_id, service_id, quantity, unit_price, total_price)
VALUES (1001, 5, 2, 500.00, 1000.00);

-- If booking status is 'Booked':
-- ERROR: Services can only be added to checked-in bookings
```

**Supports Feature:** Service management, billing accuracy

---

### 8. audit_booking_changes

**Table:** `bookings`  
**Timing:** AFTER UPDATE  
**Purpose:** Logs booking status changes for auditing and compliance.

**Logic:**
1. Checks if `booking_status` changed
2. If changed, inserts audit log with:
   - User who made change
   - Action: 'UPDATE_BOOKING_STATUS'
   - Old and new status (JSON format)
   - Timestamp

**Why It's Important:**
- ✅ Compliance and auditing
- ✅ Change tracking
- ✅ Accountability
- ✅ Historical record

**Example:**
```sql
-- Update booking status
UPDATE bookings SET booking_status = 'Checked-In' WHERE booking_id = 1001;

-- Trigger automatically logs:
-- INSERT INTO audit_log (action, table_name, old_values, new_values)
-- VALUES ('UPDATE_BOOKING_STATUS', 'bookings', 
--         '{"status":"Booked"}', '{"status":"Checked-In"}');
```

**Supports Feature:** Audit trail, compliance reporting

---

## Views

### 9. service_requests_view

**Purpose:** Comprehensive view of service requests with all related details.

**Columns:**
- Request details (ID, status, dates)
- Guest information (name, email, phone)
- Service details (name, category, price)
- Branch and room information
- Calculated total amount
- Reviewer information

**Query:**
```sql
SELECT * FROM service_requests_view 
WHERE request_status = 'Pending' 
ORDER BY requested_at;
```

**Used By:**
- Service request management page
- Receptionist dashboard
- Admin reports

**Performance:** Indexed on status, branch_id, requested_at

---

### 10. v_room_availability_summary

**Purpose:** Current room availability by branch and room type.

**Columns:**
- Branch details
- Room type details
- Total rooms count
- Available rooms count
- Occupied rooms count
- Reserved rooms count
- Maintenance rooms count

**Query:**
```sql
SELECT * FROM v_room_availability_summary 
WHERE branch_id = 1;
```

**Used By:**
- Dashboard statistics
- Room availability reports
- Booking interface

**Business Value:** Quick overview of inventory status

---

### 11. v_todays_checkins_checkouts

**Purpose:** Shows all check-ins and check-outs scheduled for today.

**Columns:**
- Activity type (Check-In / Check-Out)
- Booking and guest details
- Room information
- Branch information
- Current status

**Query:**
```sql
SELECT * FROM v_todays_checkins_checkouts 
ORDER BY activity_type, activity_date;
```

**Used By:**
- Receptionist dashboard
- Daily operations planning
- Front desk management

**Business Value:** Daily task list for receptionists

---

### 12. v_pending_service_requests

**Purpose:** All pending service requests with priority information.

**Columns:**
- Request details
- Guest and room information
- Service details with pricing
- Hours pending (calculated)
- Branch information

**Query:**
```sql
SELECT * FROM v_pending_service_requests 
WHERE branch_id = 1 
ORDER BY hours_pending DESC;
```

**Used By:**
- Service request management
- Priority handling
- SLA monitoring

**Business Value:** Identifies urgent requests

---

### 13. v_open_support_tickets

**Purpose:** All open and in-progress support tickets with priority.

**Columns:**
- Ticket details
- Guest information
- Branch information
- Priority level
- Hours open (calculated)
- Response count

**Sorting:** By priority (Urgent → High → Medium → Low), then by creation time

**Query:**
```sql
SELECT * FROM v_open_support_tickets 
WHERE priority IN ('Urgent', 'High');
```

**Used By:**
- Support ticket dashboard
- Priority management
- Response time tracking

**Business Value:** Prioritized support queue

---

### 14. v_revenue_by_branch

**Purpose:** Revenue summary and statistics by branch.

**Columns:**
- Branch details
- Total bookings count
- Total revenue
- Collected revenue
- Outstanding revenue
- Active booking revenue
- Completed booking revenue

**Query:**
```sql
SELECT * FROM v_revenue_by_branch 
ORDER BY total_revenue DESC;
```

**Used By:**
- Financial reports
- Admin dashboard
- Performance analysis

**Business Value:** Financial performance tracking

---

### 15. v_guest_booking_history

**Purpose:** Guest booking history with lifetime statistics.

**Columns:**
- Guest details
- Total bookings count
- Completed bookings
- Cancelled bookings
- Lifetime value (total spent)
- Total paid
- Last booking date
- Last checkout date

**Query:**
```sql
SELECT * FROM v_guest_booking_history 
WHERE lifetime_value > 50000 
ORDER BY lifetime_value DESC;
```

**Used By:**
- Guest management
- Loyalty programs
- Marketing analysis

**Business Value:** Customer value analysis

---

## Performance Indexes

### Core Table Indexes (from schema.sql)

**bookings:**
- `idx_guest` on `guest_id`
- `idx_room` on `room_id`
- `idx_branch` on `branch_id`
- `idx_dates` on `(check_in_date, check_out_date)`
- `idx_status` on `booking_status`
- `idx_booking_date` on `booking_date`

**rooms:**
- `idx_branch_status` on `(branch_id, status)`
- `idx_room_type` on `room_type_id`

**users:**
- `idx_username` on `username`
- `idx_email` on `email`
- `idx_role` on `role`

**guests:**
- `idx_email` on `email`
- `idx_phone` on `phone`
- `idx_id_number` on `id_number`

**service_usage:**
- `idx_booking` on `booking_id`
- `idx_service` on `service_id`
- `idx_usage_date` on `usage_date`

**payments:**
- `idx_booking` on `booking_id`
- `idx_payment_date` on `payment_date`
- `idx_status` on `payment_status`

**support_tickets:**
- `idx_guest` on `guest_id`
- `idx_status` on `status`
- `idx_created` on `created_at`

### Additional Performance Indexes (from database_efficiency_improvements.sql)

**Composite Indexes:**
- `idx_booking_date_range` on `bookings(check_in_date, check_out_date, booking_status)`
- `idx_booking_guest_date` on `bookings(guest_id, booking_date)`
- `idx_guest_fullname` on `guests(first_name, last_name)`
- `idx_service_request_status_date` on `service_requests(request_status, requested_at)`
- `idx_service_request_branch_status` on `service_requests(branch_id, request_status)`
- `idx_support_priority_status` on `support_tickets(priority, status)`
- `idx_support_booking` on `support_tickets(booking_id, status)`
- `idx_service_usage_date` on `service_usage(usage_date, booking_id)`
- `idx_payment_date_range` on `payments(payment_date, payment_status)`
- `idx_ticket_response_date` on `ticket_responses(ticket_id, created_at)`
- `idx_room_search` on `rooms(branch_id, status, room_type_id)`
- `idx_user_role_branch` on `users(role, branch_id, is_active)`

**Total Indexes:** 50+

**Performance Impact:**
- ✅ Faster date range queries
- ✅ Optimized branch filtering
- ✅ Improved search performance
- ✅ Better report generation
- ✅ Reduced query execution time

---

## 🎯 Summary

### Triggers
- **Total:** 8 triggers
- **Purpose:** Data integrity, automatic calculations, business rules
- **Key Features:**
  - Double booking prevention
  - Automatic billing updates
  - Room status management
  - Audit logging

### Views
- **Total:** 7 views
- **Purpose:** Query optimization, reporting, dashboard data
- **Key Features:**
  - Pre-joined data
  - Calculated fields
  - Filtered datasets
  - Performance optimization

### Indexes
- **Total:** 50+ indexes
- **Purpose:** Query performance, search optimization
- **Key Features:**
  - Single-column indexes
  - Composite indexes
  - Unique constraints
  - Foreign key indexes

---

## 🔄 How They Work Together

```
User Action → Trigger Validation → Database Update → View Refresh → Indexed Query
```

**Example Flow:**
1. Guest checks in
2. `before_booking_update` validates payment
3. Booking status updated to 'Checked-In'
4. `after_booking_update` sets room to 'Occupied'
5. `audit_booking_changes` logs the change
6. `v_todays_checkins_checkouts` reflects the update
7. Dashboard queries use indexes for fast retrieval

---

**Next:** See [DATABASE_RELATIONSHIPS.md](./DATABASE_RELATIONSHIPS.md) for ER diagram and relationships.
