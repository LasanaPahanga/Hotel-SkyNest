# 🔧 Database Stored Procedures & Functions

Complete documentation of all stored procedures and functions in the SkyNest Hotels system.

---

## 📋 Table of Contents

### Functions
1. [calculate_room_charges](#1-calculate_room_charges)
2. [calculate_service_charges](#2-calculate_service_charges)
3. [check_room_availability](#3-check_room_availability)
4. [check_room_availability_detailed](#4-check_room_availability_detailed)

### Procedures
5. [create_booking](#5-create_booking)
6. [check_in_guest](#6-check_in_guest)
7. [check_out_guest](#7-check_out_guest)
8. [cancel_booking](#8-cancel_booking)
9. [add_service_usage](#9-add_service_usage)
10. [process_payment](#10-process_payment)
11. [check_booking_availability](#11-check_booking_availability)
12. [create_support_ticket](#12-create_support_ticket)
13. [add_ticket_response](#13-add_ticket_response)
14. [get_live_bill](#14-get_live_bill)

---

## Functions

### 1. calculate_room_charges

**Purpose:** Calculates total room charges for a booking based on room rate and number of nights.

**Signature:**
```sql
calculate_room_charges(
    p_room_id INT,
    p_check_in DATE,
    p_check_out DATE
) RETURNS DECIMAL(10,2)
```

**Parameters:**
- `p_room_id` - Room identifier
- `p_check_in` - Check-in date
- `p_check_out` - Check-out date

**Returns:** Total room charges (base_rate × number_of_nights)

**Logic:**
1. Retrieves room's base_rate from room_types
2. Calculates nights: `DATEDIFF(check_out, check_in)`
3. Returns: `base_rate × nights`

**Usage:**
```sql
SELECT calculate_room_charges(101, '2025-01-15', '2025-01-18');
-- Returns: 36000.00 (if base_rate is 12000 for 3 nights)
```

**Used By:**
- `create_booking` procedure
- `get_live_bill` procedure
- Booking triggers

---

### 2. calculate_service_charges

**Purpose:** Calculates total service charges for a booking.

**Signature:**
```sql
calculate_service_charges(p_booking_id INT) RETURNS DECIMAL(10,2)
```

**Parameters:**
- `p_booking_id` - Booking identifier

**Returns:** Sum of all service charges for the booking

**Logic:**
1. Sums `total_price` from `service_usage` table
2. Returns 0 if no services used

**Usage:**
```sql
SELECT calculate_service_charges(1001);
-- Returns: 5500.00 (sum of all services)
```

**Used By:**
- Booking total calculations
- Bill generation
- Service usage triggers

---

### 3. check_room_availability

**Purpose:** Checks if a room is available for given dates (simple boolean check).

**Signature:**
```sql
check_room_availability(
    p_room_id INT,
    p_check_in DATE,
    p_check_out DATE,
    p_exclude_booking_id INT
) RETURNS BOOLEAN
```

**Parameters:**
- `p_room_id` - Room to check
- `p_check_in` - Desired check-in date
- `p_check_out` - Desired check-out date
- `p_exclude_booking_id` - Booking to exclude (for updates, NULL for new)

**Returns:** 
- `TRUE` (1) if available
- `FALSE` (0) if not available

**Logic:**
1. Counts overlapping bookings with status 'Booked' or 'Checked-In'
2. Excludes specified booking_id if provided
3. Returns TRUE if count = 0

**Overlap Detection:**
```sql
-- Checks for date overlap:
(check_in_date <= p_check_in AND check_out_date > p_check_in) OR
(check_in_date < p_check_out AND check_out_date >= p_check_out) OR
(check_in_date >= p_check_in AND check_out_date <= p_check_out)
```

**Usage:**
```sql
SELECT check_room_availability(101, '2025-01-15', '2025-01-18', NULL);
-- Returns: 1 (available) or 0 (not available)
```

**Used By:**
- `create_booking` procedure
- `before_booking_insert` trigger
- `before_booking_update` trigger

---

### 4. check_room_availability_detailed

**Purpose:** Returns detailed availability information with conflict details.

**Signature:**
```sql
check_room_availability_detailed(
    p_room_id INT,
    p_check_in DATE,
    p_check_out DATE,
    p_exclude_booking_id INT
) RETURNS VARCHAR(500)
```

**Parameters:** Same as `check_room_availability`

**Returns:** 
- `'AVAILABLE'` if room is free
- `'UNAVAILABLE: Room is booked from YYYY-MM-DD to YYYY-MM-DD'` with conflict dates

**Usage:**
```sql
SELECT check_room_availability_detailed(101, '2025-01-15', '2025-01-18', NULL);
-- Returns: 'AVAILABLE' or 'UNAVAILABLE: Room is booked from 2025-01-16 to 2025-01-20'
```

**Used By:**
- `check_booking_availability` procedure
- Frontend availability checks

---

## Procedures

### 5. create_booking

**Purpose:** Creates a new booking with full validation and room status update.

**Signature:**
```sql
create_booking(
    IN p_guest_id INT,
    IN p_room_id INT,
    IN p_check_in DATE,
    IN p_check_out DATE,
    IN p_number_of_guests INT,
    IN p_payment_method VARCHAR(50),
    IN p_special_requests TEXT,
    IN p_created_by INT,
    OUT p_booking_id INT,
    OUT p_error_message VARCHAR(255)
)
```

**Parameters:**
- **IN** `p_guest_id` - Guest making booking
- **IN** `p_room_id` - Room to book
- **IN** `p_check_in` - Check-in date
- **IN** `p_check_out` - Check-out date
- **IN** `p_number_of_guests` - Number of guests
- **IN** `p_payment_method` - Payment method
- **IN** `p_special_requests` - Special requests
- **IN** `p_created_by` - Staff creating booking
- **OUT** `p_booking_id` - Created booking ID (NULL if failed)
- **OUT** `p_error_message` - Error message (NULL if success)

**Process:**
1. **Validate dates:** Check-out must be after check-in
2. **Get branch_id** from room
3. **Check availability** using `check_room_availability()`
4. **Calculate charges** using `calculate_room_charges()`
5. **Insert booking** with status 'Booked'
6. **Update room status** to 'Reserved'
7. **Commit transaction**

**Error Handling:**
- Rolls back on any error
- Returns error message in `p_error_message`

**Usage:**
```sql
CALL create_booking(
    1, 101, '2025-01-15', '2025-01-18', 2, 
    'Credit Card', 'Late check-in', 5, 
    @booking_id, @error
);
SELECT @booking_id, @error;
```

**Features:**
- ✅ ACID compliant (transaction-based)
- ✅ Double booking prevention
- ✅ Automatic charge calculation
- ✅ Room status management

---

### 6. check_in_guest

**Purpose:** Processes guest check-in, updates booking and room status.

**Signature:**
```sql
check_in_guest(
    IN p_booking_id INT,
    IN p_user_id INT,
    OUT p_success BOOLEAN,
    OUT p_error_message VARCHAR(255)
)
```

**Parameters:**
- **IN** `p_booking_id` - Booking to check-in
- **IN** `p_user_id` - Staff processing check-in
- **OUT** `p_success` - TRUE if successful
- **OUT** `p_error_message` - Error message if failed

**Process:**
1. **Validate status:** Must be 'Booked'
2. **Update booking:**
   - Set status to 'Checked-In'
   - Set `actual_check_in` to NOW()
3. **Update room status** to 'Occupied'
4. **Commit transaction**

**Validations:**
- Booking must exist
- Status must be 'Booked'

**Usage:**
```sql
CALL check_in_guest(1001, 5, @success, @error);
SELECT @success, @error;
```

---

### 7. check_out_guest

**Purpose:** Processes guest check-out with payment validation.

**Signature:**
```sql
check_out_guest(
    IN p_booking_id INT,
    IN p_user_id INT,
    OUT p_success BOOLEAN,
    OUT p_error_message VARCHAR(255),
    OUT p_outstanding_amount DECIMAL(10,2)
)
```

**Parameters:**
- **IN** `p_booking_id` - Booking to check-out
- **IN** `p_user_id` - Staff processing check-out
- **OUT** `p_success` - TRUE if successful
- **OUT** `p_error_message` - Error message if failed
- **OUT** `p_outstanding_amount` - Outstanding balance

**Process:**
1. **Get booking details**
2. **Validate status:** Must be 'Checked-In'
3. **Check payment:** Outstanding must be 0
4. **Update booking:**
   - Set status to 'Checked-Out'
   - Set `actual_check_out` to NOW()
5. **Update room status** to 'Available'
6. **Commit transaction**

**Validations:**
- Booking must be 'Checked-In'
- No outstanding balance allowed

**Usage:**
```sql
CALL check_out_guest(1001, 5, @success, @error, @outstanding);
SELECT @success, @error, @outstanding;
```

**Business Rule:** Cannot check-out with outstanding balance

---

### 8. cancel_booking

**Purpose:** Cancels a booking and updates room status.

**Signature:**
```sql
cancel_booking(
    IN p_booking_id INT,
    IN p_user_id INT,
    OUT p_success BOOLEAN,
    OUT p_error_message VARCHAR(255)
)
```

**Parameters:**
- **IN** `p_booking_id` - Booking to cancel
- **IN** `p_user_id` - User cancelling
- **OUT** `p_success` - TRUE if successful
- **OUT** `p_error_message` - Error message if failed

**Process:**
1. **Get booking details**
2. **Validate:** Cannot cancel if 'Checked-Out' or already 'Cancelled'
3. **Update booking status** to 'Cancelled'
4. **Update room status** to 'Available' (if was 'Booked')
5. **Commit transaction**

**Usage:**
```sql
CALL cancel_booking(1001, 5, @success, @error);
SELECT @success, @error;
```

---

### 9. add_service_usage

**Purpose:** Adds a service to a checked-in booking.

**Signature:**
```sql
add_service_usage(
    IN p_booking_id INT,
    IN p_service_id INT,
    IN p_quantity INT,
    IN p_notes TEXT,
    OUT p_usage_id INT,
    OUT p_error_message VARCHAR(255)
)
```

**Parameters:**
- **IN** `p_booking_id` - Booking to add service to
- **IN** `p_service_id` - Service to add
- **IN** `p_quantity` - Quantity
- **IN** `p_notes` - Additional notes
- **OUT** `p_usage_id` - Created usage ID
- **OUT** `p_error_message` - Error message if failed

**Process:**
1. **Validate:** Booking must be 'Checked-In'
2. **Get service price** from catalogue
3. **Calculate total:** `unit_price × quantity`
4. **Insert service_usage**
5. **Trigger updates booking total** automatically
6. **Commit transaction**

**Usage:**
```sql
CALL add_service_usage(1001, 5, 2, 'Breakfast for 2', @usage_id, @error);
SELECT @usage_id, @error;
```

**Note:** Booking total is updated automatically by `after_service_usage_insert` trigger

---

### 10. process_payment

**Purpose:** Processes a payment for a booking with validation.

**Signature:**
```sql
process_payment(
    IN p_booking_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_payment_method VARCHAR(50),
    IN p_transaction_ref VARCHAR(100),
    IN p_processed_by INT,
    OUT p_payment_id INT,
    OUT p_error_message VARCHAR(255)
)
```

**Parameters:**
- **IN** `p_booking_id` - Booking to pay for
- **IN** `p_amount` - Payment amount
- **IN** `p_payment_method` - Payment method
- **IN** `p_transaction_ref` - Transaction reference
- **IN** `p_processed_by` - Staff processing
- **OUT** `p_payment_id` - Created payment ID
- **OUT** `p_error_message` - Error message if failed

**Process:**
1. **Get outstanding amount**
2. **Validate:**
   - Amount must be > 0
   - Amount cannot exceed outstanding
3. **Insert payment record**
4. **Trigger updates booking** automatically
5. **Commit transaction**

**Validations:**
- Payment amount > 0
- Payment amount ≤ outstanding amount

**Usage:**
```sql
CALL process_payment(1001, 15000.00, 'Cash', NULL, 5, @payment_id, @error);
SELECT @payment_id, @error;
```

**Note:** Booking amounts updated automatically by `after_payment_insert` trigger

---

### 11. check_booking_availability

**Purpose:** Comprehensive availability check with detailed validation.

**Signature:**
```sql
check_booking_availability(
    IN p_room_id INT,
    IN p_check_in DATE,
    IN p_check_out DATE,
    IN p_exclude_booking_id INT,
    OUT p_is_available BOOLEAN,
    OUT p_message VARCHAR(500)
)
```

**Parameters:**
- **IN** `p_room_id` - Room to check
- **IN** `p_check_in` - Check-in date
- **IN** `p_check_out` - Check-out date
- **IN** `p_exclude_booking_id` - Booking to exclude
- **OUT** `p_is_available` - TRUE if available
- **OUT** `p_message` - Detailed message

**Checks:**
1. Room exists
2. Room not under maintenance
3. Check-out after check-in
4. Check-in not in past
5. No booking conflicts

**Messages:**
- `'Room is available for the selected dates'`
- `'Room does not exist'`
- `'Room is currently under maintenance'`
- `'Check-out date must be after check-in date'`
- `'Check-in date cannot be in the past'`
- `'UNAVAILABLE: Room is booked from...'`

**Usage:**
```sql
CALL check_booking_availability(101, '2025-01-15', '2025-01-18', NULL, @available, @message);
SELECT @available, @message;
```

---

### 12. create_support_ticket

**Purpose:** Creates a new support ticket with validation.

**Signature:**
```sql
create_support_ticket(
    IN p_guest_id INT,
    IN p_booking_id INT,
    IN p_subject VARCHAR(200),
    IN p_message TEXT,
    IN p_priority VARCHAR(20),
    OUT p_ticket_id INT,
    OUT p_error_message VARCHAR(255)
)
```

**Parameters:**
- **IN** `p_guest_id` - Guest creating ticket
- **IN** `p_booking_id` - Related booking (optional)
- **IN** `p_subject` - Ticket subject
- **IN** `p_message` - Ticket message
- **IN** `p_priority` - Priority level
- **OUT** `p_ticket_id` - Created ticket ID
- **OUT** `p_error_message` - Error message if failed

**Process:**
1. **Validate inputs** (subject and message required)
2. **Insert ticket** with status 'Open'
3. **Commit transaction**

**Usage:**
```sql
CALL create_support_ticket(
    1, 1001, 'AC not working', 'Room AC stopped working', 'High',
    @ticket_id, @error
);
SELECT @ticket_id, @error;
```

---

### 13. add_ticket_response

**Purpose:** Adds a response to a support ticket.

**Signature:**
```sql
add_ticket_response(
    IN p_ticket_id INT,
    IN p_user_id INT,
    IN p_guest_id INT,
    IN p_message TEXT,
    IN p_is_staff_response BOOLEAN,
    OUT p_response_id INT,
    OUT p_error_message VARCHAR(255)
)
```

**Parameters:**
- **IN** `p_ticket_id` - Ticket to respond to
- **IN** `p_user_id` - Staff user (if staff response)
- **IN** `p_guest_id` - Guest (if guest response)
- **IN** `p_message` - Response message
- **IN** `p_is_staff_response` - TRUE if from staff
- **OUT** `p_response_id` - Created response ID
- **OUT** `p_error_message` - Error message if failed

**Process:**
1. **Insert response**
2. **If staff response:**
   - Update ticket status to 'In Progress'
3. **Commit transaction**

**Usage:**
```sql
CALL add_ticket_response(
    101, 5, NULL, 'Technician dispatched', TRUE,
    @response_id, @error
);
SELECT @response_id, @error;
```

---

### 14. get_live_bill

**Purpose:** Generates complete live bill for a booking with all details.

**Signature:**
```sql
get_live_bill(IN p_booking_id INT)
```

**Parameters:**
- **IN** `p_booking_id` - Booking to generate bill for

**Returns:** 3 result sets:

**Result Set 1: Booking Summary**
- Booking details
- Room charges (calculated)
- Service charges (calculated)
- Total, paid, outstanding amounts
- Room and branch information

**Result Set 2: Service Breakdown**
- All services used
- Quantities and prices
- Usage dates

**Result Set 3: Payment History**
- All payments made
- Payment methods
- Transaction references

**Usage:**
```sql
CALL get_live_bill(1001);
-- Returns 3 result sets
```

**Used By:**
- Bill generation
- Check-out process
- Guest portal

---

## 🎯 Summary

**Total Functions:** 4
- 2 calculation functions
- 2 availability check functions

**Total Procedures:** 10
- 4 booking lifecycle procedures
- 2 service procedures
- 1 payment procedure
- 2 support procedures
- 1 reporting procedure

**Key Features:**
- ✅ ACID compliance (all use transactions)
- ✅ Comprehensive error handling
- ✅ Input validation
- ✅ Business rule enforcement
- ✅ Automatic calculations
- ✅ Status management

---

**Next:** See [DATABASE_TRIGGERS.md](./DATABASE_TRIGGERS.md) for trigger documentation.
