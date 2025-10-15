# 🗄️ Database Tables Structure

Complete documentation of all database tables in the SkyNest Hotels system.

---

## 📊 Table of Contents

1. [hotel_branches](#1-hotel_branches)
2. [room_types](#2-room_types)
3. [rooms](#3-rooms)
4. [users](#4-users)
5. [guests](#5-guests)
6. [bookings](#6-bookings)
7. [service_catalogue](#7-service_catalogue)
8. [branch_services](#8-branch_services)
9. [service_usage](#9-service_usage)
10. [service_requests](#10-service_requests)
11. [payments](#11-payments)
12. [support_tickets](#12-support_tickets)
13. [ticket_responses](#13-ticket_responses)
14. [audit_log](#14-audit_log)
15. [room_availability_cache](#15-room_availability_cache)

---

## 1. hotel_branches

**Purpose:** Stores information about each hotel branch/location.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| branch_id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique branch identifier |
| branch_name | VARCHAR(100) | NOT NULL | Branch name |
| location | VARCHAR(100) | NOT NULL | City/location |
| address | TEXT | NOT NULL | Full address |
| phone | VARCHAR(20) | NOT NULL | Contact phone |
| email | VARCHAR(100) | NOT NULL | Contact email |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update time |

**Indexes:**
- PRIMARY KEY: `branch_id`
- INDEX: `idx_location` on `location`

**Relationships:**
- Referenced by: `rooms`, `users`, `bookings`, `service_requests`

---

## 2. room_types

**Purpose:** Defines different types of rooms available (Single, Double, Suite, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| room_type_id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique room type ID |
| type_name | VARCHAR(50) | NOT NULL, UNIQUE | Room type name |
| capacity | INT | NOT NULL, CHECK > 0 | Maximum guests |
| base_rate | DECIMAL(10,2) | NOT NULL, CHECK > 0 | Base price per night |
| amenities | TEXT | NULL | List of amenities |
| description | TEXT | NULL | Room description |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update time |

**Indexes:**
- PRIMARY KEY: `room_type_id`
- UNIQUE: `type_name`

**Relationships:**
- Referenced by: `rooms`

---

## 3. rooms

**Purpose:** Stores individual room inventory for each branch.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| room_id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique room identifier |
| branch_id | INT | NOT NULL, FOREIGN KEY | Branch reference |
| room_type_id | INT | NOT NULL, FOREIGN KEY | Room type reference |
| room_number | VARCHAR(20) | NOT NULL | Room number |
| floor_number | INT | NOT NULL | Floor location |
| status | ENUM | DEFAULT 'Available' | Room status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update time |

**Status Values:**
- `Available` - Ready for booking
- `Occupied` - Currently occupied
- `Maintenance` - Under maintenance
- `Reserved` - Reserved for booking

**Indexes:**
- PRIMARY KEY: `room_id`
- UNIQUE: `(branch_id, room_number)`
- INDEX: `idx_branch_status` on `(branch_id, status)`
- INDEX: `idx_room_type` on `room_type_id`

**Foreign Keys:**
- `branch_id` → `hotel_branches(branch_id)` ON DELETE CASCADE
- `room_type_id` → `room_types(room_type_id)` ON DELETE RESTRICT

---

## 4. users

**Purpose:** Stores user accounts for system access (Admin, Receptionist, Guest).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique user ID |
| username | VARCHAR(50) | NOT NULL, UNIQUE | Login username |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| email | VARCHAR(100) | NOT NULL, UNIQUE | User email |
| full_name | VARCHAR(100) | NOT NULL | Full name |
| role | ENUM | NOT NULL | User role |
| branch_id | INT | NULL, FOREIGN KEY | Branch assignment |
| phone | VARCHAR(20) | NULL | Contact phone |
| is_active | BOOLEAN | DEFAULT TRUE | Account status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update |

**Role Values:**
- `Admin` - Full system access
- `Receptionist` - Branch-specific operations
- `Guest` - Guest portal access

**Indexes:**
- PRIMARY KEY: `user_id`
- UNIQUE: `username`, `email`
- INDEX: `idx_username` on `username`
- INDEX: `idx_email` on `email`
- INDEX: `idx_role` on `role`

**Foreign Keys:**
- `branch_id` → `hotel_branches(branch_id)` ON DELETE SET NULL

---

## 5. guests

**Purpose:** Stores guest profile information and identification details.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| guest_id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique guest ID |
| user_id | INT | NULL, FOREIGN KEY | Linked user account |
| first_name | VARCHAR(50) | NOT NULL | First name |
| last_name | VARCHAR(50) | NOT NULL | Last name |
| email | VARCHAR(100) | NOT NULL | Email address |
| phone | VARCHAR(20) | NOT NULL | Phone number |
| id_type | ENUM | NOT NULL | ID document type |
| id_number | VARCHAR(50) | NOT NULL | ID number |
| address | TEXT | NULL | Residential address |
| country | VARCHAR(50) | NOT NULL | Country |
| date_of_birth | DATE | NULL | Date of birth |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update |

**ID Types:**
- `Passport`
- `NIC` (National Identity Card)
- `Driving License`

**Indexes:**
- PRIMARY KEY: `guest_id`
- INDEX: `idx_email` on `email`
- INDEX: `idx_phone` on `phone`
- INDEX: `idx_id_number` on `id_number`

**Foreign Keys:**
- `user_id` → `users(user_id)` ON DELETE SET NULL

---

## 6. bookings

**Purpose:** Core table storing all room reservations and booking details.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| booking_id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique booking ID |
| guest_id | INT | NOT NULL, FOREIGN KEY | Guest reference |
| room_id | INT | NOT NULL, FOREIGN KEY | Room reference |
| branch_id | INT | NOT NULL, FOREIGN KEY | Branch reference |
| check_in_date | DATE | NOT NULL | Planned check-in |
| check_out_date | DATE | NOT NULL, CHECK > check_in | Planned check-out |
| actual_check_in | DATETIME | NULL | Actual check-in time |
| actual_check_out | DATETIME | NULL | Actual check-out time |
| number_of_guests | INT | NOT NULL, DEFAULT 1, CHECK > 0 | Guest count |
| booking_status | ENUM | DEFAULT 'Booked' | Booking status |
| payment_method | ENUM | NOT NULL | Payment method |
| special_requests | TEXT | NULL | Special requests |
| total_amount | DECIMAL(10,2) | DEFAULT 0.00, CHECK >= 0 | Total bill |
| paid_amount | DECIMAL(10,2) | DEFAULT 0.00, CHECK >= 0 | Amount paid |
| outstanding_amount | DECIMAL(10,2) | DEFAULT 0.00, CHECK >= 0 | Balance due |
| booking_date | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Booking creation |
| created_by | INT | NULL, FOREIGN KEY | Staff who created |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update |

**Status Values:**
- `Booked` - Reservation confirmed
- `Checked-In` - Guest checked in
- `Checked-Out` - Guest checked out
- `Cancelled` - Booking cancelled

**Payment Methods:**
- `Cash`
- `Credit Card`
- `Debit Card`
- `Online Transfer`

**Indexes:**
- PRIMARY KEY: `booking_id`
- INDEX: `idx_guest` on `guest_id`
- INDEX: `idx_room` on `room_id`
- INDEX: `idx_branch` on `branch_id`
- INDEX: `idx_dates` on `(check_in_date, check_out_date)`
- INDEX: `idx_status` on `booking_status`
- INDEX: `idx_booking_date` on `booking_date`

**Foreign Keys:**
- `guest_id` → `guests(guest_id)` ON DELETE RESTRICT
- `room_id` → `rooms(room_id)` ON DELETE RESTRICT
- `branch_id` → `hotel_branches(branch_id)` ON DELETE RESTRICT
- `created_by` → `users(user_id)` ON DELETE SET NULL

**Business Rules:**
- `check_out_date` must be after `check_in_date`
- `number_of_guests` must be > 0
- All amounts must be >= 0

---

## 7. service_catalogue

**Purpose:** Master list of all services available across the hotel chain.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| service_id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique service ID |
| service_name | VARCHAR(100) | NOT NULL | Service name |
| service_category | ENUM | NOT NULL | Service category |
| description | TEXT | NULL | Service description |
| unit_price | DECIMAL(10,2) | NOT NULL, CHECK >= 0 | Default price |
| unit_type | VARCHAR(20) | DEFAULT 'item' | Unit of measurement |
| is_active | BOOLEAN | DEFAULT TRUE | Service availability |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update |

**Categories:**
- `Room Service`
- `Spa`
- `Laundry`
- `Minibar`
- `Restaurant`
- `Transportation`
- `Other`

**Indexes:**
- PRIMARY KEY: `service_id`
- INDEX: `idx_category` on `service_category`
- INDEX: `idx_active` on `is_active`

---

## 8. branch_services

**Purpose:** Branch-specific service pricing (overrides default catalogue prices).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| branch_service_id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique ID |
| branch_id | INT | NOT NULL, FOREIGN KEY | Branch reference |
| service_id | INT | NOT NULL, FOREIGN KEY | Service reference |
| custom_price | DECIMAL(10,2) | NULL | Branch-specific price |
| is_available | BOOLEAN | DEFAULT TRUE | Availability at branch |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update |

**Indexes:**
- PRIMARY KEY: `branch_service_id`
- UNIQUE: `(branch_id, service_id)`

**Foreign Keys:**
- `branch_id` → `hotel_branches(branch_id)` ON DELETE CASCADE
- `service_id` → `service_catalogue(service_id)` ON DELETE CASCADE

---

## 9. service_usage

**Purpose:** Tracks services used by guests during their stay.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| usage_id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique usage ID |
| booking_id | INT | NOT NULL, FOREIGN KEY | Booking reference |
| service_id | INT | NOT NULL, FOREIGN KEY | Service reference |
| usage_date | DATETIME | DEFAULT CURRENT_TIMESTAMP | When service used |
| quantity | INT | NOT NULL, DEFAULT 1, CHECK > 0 | Quantity used |
| unit_price | DECIMAL(10,2) | NOT NULL, CHECK >= 0 | Price per unit |
| total_price | DECIMAL(10,2) | NOT NULL, CHECK >= 0 | Total cost |
| notes | TEXT | NULL | Additional notes |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation |

**Indexes:**
- PRIMARY KEY: `usage_id`
- INDEX: `idx_booking` on `booking_id`
- INDEX: `idx_service` on `service_id`
- INDEX: `idx_usage_date` on `usage_date`

**Foreign Keys:**
- `booking_id` → `bookings(booking_id)` ON DELETE CASCADE
- `service_id` → `service_catalogue(service_id)` ON DELETE RESTRICT

**Triggers:**
- `after_service_usage_insert` - Updates booking total_amount
- `after_service_usage_delete` - Recalculates booking total
- `before_service_usage_insert` - Validates booking status, calculates total_price

---

## 10. service_requests

**Purpose:** Guest service requests with approval workflow.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| request_id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique request ID |
| booking_id | INT | NOT NULL, FOREIGN KEY | Booking reference |
| guest_id | INT | NOT NULL, FOREIGN KEY | Guest reference |
| service_id | INT | NOT NULL, FOREIGN KEY | Service reference |
| branch_id | INT | NOT NULL, FOREIGN KEY | Branch reference |
| quantity | INT | NOT NULL, DEFAULT 1 | Requested quantity |
| request_notes | TEXT | NULL | Guest notes |
| request_status | ENUM | DEFAULT 'Pending' | Request status |
| requested_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Request time |
| reviewed_by | INT | NULL, FOREIGN KEY | Staff reviewer |
| reviewed_at | TIMESTAMP | NULL | Review time |
| review_notes | TEXT | NULL | Staff notes |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update |

**Status Values:**
- `Pending` - Awaiting review
- `Approved` - Approved by staff
- `Rejected` - Rejected by staff
- `Completed` - Service added to booking

**Indexes:**
- PRIMARY KEY: `request_id`
- INDEX: `idx_booking` on `booking_id`
- INDEX: `idx_guest` on `guest_id`
- INDEX: `idx_status` on `request_status`
- INDEX: `idx_branch` on `branch_id`

**Foreign Keys:**
- `booking_id` → `bookings(booking_id)` ON DELETE CASCADE
- `guest_id` → `guests(guest_id)` ON DELETE CASCADE
- `service_id` → `service_catalogue(service_id)` ON DELETE CASCADE
- `branch_id` → `hotel_branches(branch_id)` ON DELETE CASCADE
- `reviewed_by` → `users(user_id)` ON DELETE SET NULL

---

## 11. payments

**Purpose:** Records all payment transactions for bookings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| payment_id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique payment ID |
| booking_id | INT | NOT NULL, FOREIGN KEY | Booking reference |
| payment_date | DATETIME | DEFAULT CURRENT_TIMESTAMP | Payment time |
| amount | DECIMAL(10,2) | NOT NULL, CHECK > 0 | Payment amount |
| payment_method | ENUM | NOT NULL | Payment method |
| transaction_reference | VARCHAR(100) | NULL | Transaction ref |
| payment_status | ENUM | DEFAULT 'Completed' | Payment status |
| notes | TEXT | NULL | Payment notes |
| processed_by | INT | NULL, FOREIGN KEY | Staff processor |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation |

**Payment Methods:**
- `Cash`
- `Credit Card`
- `Debit Card`
- `Online Transfer`

**Status Values:**
- `Pending`
- `Completed`
- `Failed`
- `Refunded`

**Indexes:**
- PRIMARY KEY: `payment_id`
- INDEX: `idx_booking` on `booking_id`
- INDEX: `idx_payment_date` on `payment_date`
- INDEX: `idx_status` on `payment_status`

**Foreign Keys:**
- `booking_id` → `bookings(booking_id)` ON DELETE CASCADE
- `processed_by` → `users(user_id)` ON DELETE SET NULL

**Triggers:**
- `after_payment_insert` - Updates booking paid_amount and outstanding_amount

---

## 12. support_tickets

**Purpose:** Customer support ticket system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| ticket_id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique ticket ID |
| guest_id | INT | NOT NULL, FOREIGN KEY | Guest reference |
| booking_id | INT | NULL, FOREIGN KEY | Related booking |
| subject | VARCHAR(200) | NOT NULL | Ticket subject |
| message | TEXT | NOT NULL | Ticket message |
| status | ENUM | DEFAULT 'Open' | Ticket status |
| priority | ENUM | DEFAULT 'Medium' | Priority level |
| assigned_to | INT | NULL, FOREIGN KEY | Assigned staff |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Ticket creation |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update |
| resolved_at | TIMESTAMP | NULL | Resolution time |

**Status Values:**
- `Open` - New ticket
- `In Progress` - Being handled
- `Resolved` - Issue resolved
- `Closed` - Ticket closed

**Priority Levels:**
- `Low`
- `Medium`
- `High`
- `Urgent`

**Indexes:**
- PRIMARY KEY: `ticket_id`
- INDEX: `idx_guest` on `guest_id`
- INDEX: `idx_status` on `status`
- INDEX: `idx_created` on `created_at`

**Foreign Keys:**
- `guest_id` → `guests(guest_id)`
- `booking_id` → `bookings(booking_id)`
- `assigned_to` → `users(user_id)`

---

## 13. ticket_responses

**Purpose:** Responses/replies to support tickets.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| response_id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique response ID |
| ticket_id | INT | NOT NULL, FOREIGN KEY | Ticket reference |
| user_id | INT | NULL, FOREIGN KEY | Staff responder |
| guest_id | INT | NULL, FOREIGN KEY | Guest responder |
| message | TEXT | NOT NULL | Response message |
| is_staff_response | BOOLEAN | DEFAULT FALSE | Staff vs guest |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Response time |

**Indexes:**
- PRIMARY KEY: `response_id`
- INDEX: `idx_ticket` on `ticket_id`
- INDEX: `idx_created` on `created_at`

**Foreign Keys:**
- `ticket_id` → `support_tickets(ticket_id)` ON DELETE CASCADE
- `user_id` → `users(user_id)`
- `guest_id` → `guests(guest_id)`

---

## 14. audit_log

**Purpose:** Tracks important system actions for auditing and compliance.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| log_id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique log ID |
| user_id | INT | NULL, FOREIGN KEY | User who acted |
| action | VARCHAR(100) | NOT NULL | Action performed |
| table_name | VARCHAR(50) | NOT NULL | Affected table |
| record_id | INT | NULL | Affected record |
| old_values | JSON | NULL | Previous values |
| new_values | JSON | NULL | New values |
| ip_address | VARCHAR(45) | NULL | User IP address |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Action time |

**Indexes:**
- PRIMARY KEY: `log_id`
- INDEX: `idx_user` on `user_id`
- INDEX: `idx_action` on `action`
- INDEX: `idx_table` on `table_name`
- INDEX: `idx_created` on `created_at`

**Foreign Keys:**
- `user_id` → `users(user_id)` ON DELETE SET NULL

---

## 15. room_availability_cache

**Purpose:** Caches room availability for performance optimization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| cache_id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique cache ID |
| room_id | INT | NOT NULL, FOREIGN KEY | Room reference |
| date | DATE | NOT NULL | Availability date |
| is_available | BOOLEAN | DEFAULT TRUE | Availability flag |
| booking_id | INT | NULL, FOREIGN KEY | Blocking booking |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Cache creation |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update |

**Indexes:**
- PRIMARY KEY: `cache_id`
- UNIQUE: `(room_id, date)`
- INDEX: `idx_date` on `date`
- INDEX: `idx_available` on `is_available`

**Foreign Keys:**
- `room_id` → `rooms(room_id)` ON DELETE CASCADE
- `booking_id` → `bookings(booking_id)` ON DELETE CASCADE

---

## 📊 Database Statistics

- **Total Tables:** 15
- **Total Indexes:** 50+
- **Total Foreign Keys:** 25+
- **Total Triggers:** 8
- **Total Stored Procedures:** 10+
- **Total Views:** 6+

---

**Next:** See [DATABASE_PROCEDURES.md](./DATABASE_PROCEDURES.md) for stored procedures documentation.
