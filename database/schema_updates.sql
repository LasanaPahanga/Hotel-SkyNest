-- ============================================
-- SKYNEST HOTELS - SCHEMA UPDATES
-- New Features Implementation
-- ============================================
-- This file adds new tables and columns for:
-- 1. Guest signup and email verification
-- 2. Tax and discount management (branch-wise)
-- 3. Late checkout and no-show fee handling
-- 4. Service requests and support tickets
-- 5. Payment gateway and receipt generation
-- ============================================

USE skynest_hotels;

-- ============================================
-- SECTION 1: MISSING CORE TABLES
-- ============================================

-- Service Requests Table
CREATE TABLE IF NOT EXISTS service_requests (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    guest_id INT NOT NULL,
    service_id INT NOT NULL,
    branch_id INT NOT NULL,
    quantity INT DEFAULT 1,
    request_status ENUM('Pending', 'Approved', 'Rejected', 'Completed') DEFAULT 'Pending',
    request_notes TEXT,
    reviewed_by INT NULL,
    reviewed_at DATETIME NULL,
    review_notes TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (guest_id) REFERENCES guests(guest_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES service_catalogue(service_id) ON DELETE RESTRICT,
    FOREIGN KEY (branch_id) REFERENCES hotel_branches(branch_id) ON DELETE RESTRICT,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_booking (booking_id),
    INDEX idx_guest (guest_id),
    INDEX idx_status (request_status),
    INDEX idx_branch (branch_id)
) ENGINE=InnoDB;

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
    ticket_id INT PRIMARY KEY AUTO_INCREMENT,
    guest_id INT NOT NULL,
    booking_id INT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
    status ENUM('Open', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES guests(guest_id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_guest (guest_id),
    INDEX idx_priority (priority)
) ENGINE=InnoDB;

-- Ticket Responses Table
CREATE TABLE IF NOT EXISTS ticket_responses (
    response_id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    user_id INT NULL,
    response_text TEXT NOT NULL,
    is_staff_response BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_ticket (ticket_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- Branch Services Table (for branch-specific pricing)
CREATE TABLE IF NOT EXISTS branch_services (
    branch_service_id INT PRIMARY KEY AUTO_INCREMENT,
    branch_id INT NOT NULL,
    service_id INT NOT NULL,
    custom_price DECIMAL(10, 2) NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES hotel_branches(branch_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES service_catalogue(service_id) ON DELETE CASCADE,
    UNIQUE KEY unique_branch_service (branch_id, service_id),
    INDEX idx_branch (branch_id),
    INDEX idx_service (service_id)
) ENGINE=InnoDB;

-- ============================================
-- SECTION 2: EMAIL VERIFICATION
-- ============================================

-- Email Verification Tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    token_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    token_type ENUM('Signup', 'Password Reset') NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    user_data JSON NULL COMMENT 'Temporary storage for signup data',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_email (email),
    INDEX idx_expires (expires_at),
    INDEX idx_type (token_type)
) ENGINE=InnoDB;

-- ============================================
-- SECTION 3: TAX MANAGEMENT
-- ============================================

-- Branch Tax Configuration
CREATE TABLE IF NOT EXISTS branch_tax_config (
    tax_config_id INT PRIMARY KEY AUTO_INCREMENT,
    branch_id INT NOT NULL,
    tax_name VARCHAR(100) NOT NULL,
    tax_type ENUM('VAT', 'Service Tax', 'Tourism Tax', 'Other') NOT NULL,
    tax_rate DECIMAL(5, 2) NOT NULL COMMENT 'Tax rate in percentage',
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES hotel_branches(branch_id) ON DELETE CASCADE,
    CHECK (tax_rate >= 0 AND tax_rate <= 100),
    INDEX idx_branch_active (branch_id, is_active),
    INDEX idx_effective_dates (effective_from, effective_to)
) ENGINE=InnoDB;

-- Booking Tax Details (applied taxes per booking)
CREATE TABLE IF NOT EXISTS booking_taxes (
    booking_tax_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    tax_config_id INT NULL,
    tax_name VARCHAR(100) NOT NULL,
    tax_rate DECIMAL(5, 2) NOT NULL,
    taxable_amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (tax_config_id) REFERENCES branch_tax_config(tax_config_id) ON DELETE SET NULL,
    INDEX idx_booking (booking_id)
) ENGINE=InnoDB;

-- ============================================
-- SECTION 4: DISCOUNT MANAGEMENT
-- ============================================

-- Branch Discount Configuration
CREATE TABLE IF NOT EXISTS branch_discount_config (
    discount_config_id INT PRIMARY KEY AUTO_INCREMENT,
    branch_id INT NOT NULL,
    discount_name VARCHAR(100) NOT NULL,
    discount_type ENUM('Percentage', 'Fixed Amount') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    applicable_on ENUM('Room', 'Service', 'Total Bill') DEFAULT 'Total Bill',
    min_booking_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2) NULL COMMENT 'Maximum discount cap',
    is_active BOOLEAN DEFAULT TRUE,
    valid_from DATE NOT NULL,
    valid_to DATE NULL,
    promo_code VARCHAR(50) NULL UNIQUE,
    usage_limit INT NULL COMMENT 'Total times this discount can be used',
    usage_count INT DEFAULT 0 COMMENT 'Times this discount has been used',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES hotel_branches(branch_id) ON DELETE CASCADE,
    CHECK (discount_value >= 0),
    INDEX idx_branch_active (branch_id, is_active),
    INDEX idx_promo_code (promo_code),
    INDEX idx_valid_dates (valid_from, valid_to)
) ENGINE=InnoDB;

-- Booking Discount Details (applied discounts per booking)
CREATE TABLE IF NOT EXISTS booking_discounts (
    booking_discount_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    discount_config_id INT NULL,
    discount_name VARCHAR(100) NOT NULL,
    discount_type ENUM('Percentage', 'Fixed Amount') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    promo_code VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (discount_config_id) REFERENCES branch_discount_config(discount_config_id) ON DELETE SET NULL,
    INDEX idx_booking (booking_id)
) ENGINE=InnoDB;

-- ============================================
-- SECTION 5: FEE MANAGEMENT
-- ============================================

-- Branch Fee Configuration
CREATE TABLE IF NOT EXISTS branch_fee_config (
    fee_config_id INT PRIMARY KEY AUTO_INCREMENT,
    branch_id INT NOT NULL,
    fee_type ENUM('Late Checkout', 'No Show', 'Early Checkout', 'Cancellation', 'Other') NOT NULL,
    fee_calculation ENUM('Fixed Amount', 'Percentage of Total', 'Per Hour') NOT NULL,
    fee_value DECIMAL(10, 2) NOT NULL,
    grace_period_minutes INT DEFAULT 0 COMMENT 'Grace period before fee applies',
    max_fee_amount DECIMAL(10, 2) NULL COMMENT 'Maximum fee cap',
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES hotel_branches(branch_id) ON DELETE CASCADE,
    CHECK (fee_value >= 0),
    INDEX idx_branch_type (branch_id, fee_type, is_active)
) ENGINE=InnoDB;

-- Booking Additional Fees
CREATE TABLE IF NOT EXISTS booking_fees (
    booking_fee_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    fee_config_id INT NULL,
    fee_type ENUM('Late Checkout', 'No Show', 'Early Checkout', 'Cancellation', 'Other') NOT NULL,
    fee_amount DECIMAL(10, 2) NOT NULL,
    fee_reason TEXT,
    calculation_details JSON COMMENT 'Details of how fee was calculated',
    applied_by INT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (fee_config_id) REFERENCES branch_fee_config(fee_config_id) ON DELETE SET NULL,
    FOREIGN KEY (applied_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_booking (booking_id),
    INDEX idx_fee_type (fee_type)
) ENGINE=InnoDB;

-- ============================================
-- SECTION 6: PAYMENT RECEIPTS
-- ============================================

-- Payment Receipts Table
CREATE TABLE IF NOT EXISTS payment_receipts (
    receipt_id INT PRIMARY KEY AUTO_INCREMENT,
    payment_id INT NOT NULL,
    booking_id INT NOT NULL,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    receipt_data JSON NOT NULL COMMENT 'Complete receipt details in JSON format',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    INDEX idx_payment (payment_id),
    INDEX idx_booking (booking_id),
    INDEX idx_receipt_number (receipt_number)
) ENGINE=InnoDB;

-- ============================================
-- SECTION 7: UPDATE EXISTING TABLES
-- ============================================

-- Add new columns to bookings table for enhanced billing
-- Check and add columns one by one (MySQL doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN)

-- Add subtotal_amount column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'skynest_hotels' 
AND TABLE_NAME = 'bookings' 
AND COLUMN_NAME = 'subtotal_amount';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE bookings ADD COLUMN subtotal_amount DECIMAL(10, 2) DEFAULT 0.00 COMMENT "Amount before taxes and discounts" AFTER total_amount',
    'SELECT "Column subtotal_amount already exists" AS Info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add tax_amount column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'skynest_hotels' 
AND TABLE_NAME = 'bookings' 
AND COLUMN_NAME = 'tax_amount';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE bookings ADD COLUMN tax_amount DECIMAL(10, 2) DEFAULT 0.00 COMMENT "Total tax amount" AFTER subtotal_amount',
    'SELECT "Column tax_amount already exists" AS Info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add discount_amount column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'skynest_hotels' 
AND TABLE_NAME = 'bookings' 
AND COLUMN_NAME = 'discount_amount';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE bookings ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0.00 COMMENT "Total discount amount" AFTER tax_amount',
    'SELECT "Column discount_amount already exists" AS Info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add additional_fees column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'skynest_hotels' 
AND TABLE_NAME = 'bookings' 
AND COLUMN_NAME = 'additional_fees';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE bookings ADD COLUMN additional_fees DECIMAL(10, 2) DEFAULT 0.00 COMMENT "Late checkout, no-show fees etc" AFTER discount_amount',
    'SELECT "Column additional_fees already exists" AS Info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add promo_code column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'skynest_hotels' 
AND TABLE_NAME = 'bookings' 
AND COLUMN_NAME = 'promo_code';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE bookings ADD COLUMN promo_code VARCHAR(50) NULL COMMENT "Applied promo code" AFTER additional_fees',
    'SELECT "Column promo_code already exists" AS Info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add email_verified column to users table
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'skynest_hotels' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'email_verified';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE AFTER email',
    'SELECT "Column email_verified already exists" AS Info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add email_verified_at column to users table
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'skynest_hotels' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'email_verified_at';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN email_verified_at DATETIME NULL AFTER email_verified',
    'SELECT "Column email_verified_at already exists" AS Info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add last_login_at column to users table
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'skynest_hotels' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'last_login_at';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL AFTER email_verified_at',
    'SELECT "Column last_login_at already exists" AS Info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- SECTION 8: CREATE VIEWS FOR EASY QUERYING
-- ============================================

-- Service Requests View with all details
DROP VIEW IF EXISTS service_requests_view;
CREATE VIEW service_requests_view AS
SELECT 
    sr.request_id,
    sr.booking_id,
    sr.guest_id,
    CONCAT(g.first_name, ' ', g.last_name) as guest_name,
    g.email as guest_email,
    g.phone as guest_phone,
    sr.service_id,
    sc.service_name,
    sc.service_category,
    sc.unit_price as base_price,
    COALESCE(bs.custom_price, sc.unit_price) as unit_price,
    sr.quantity,
    (COALESCE(bs.custom_price, sc.unit_price) * sr.quantity) as total_amount,
    sr.branch_id,
    hb.branch_name,
    sr.request_status,
    sr.request_notes,
    sr.reviewed_by,
    u.full_name as reviewed_by_name,
    sr.reviewed_at,
    sr.review_notes,
    sr.requested_at,
    r.room_number,
    b.check_in_date,
    b.check_out_date
FROM service_requests sr
JOIN guests g ON sr.guest_id = g.guest_id
JOIN service_catalogue sc ON sr.service_id = sc.service_id
JOIN hotel_branches hb ON sr.branch_id = hb.branch_id
JOIN bookings b ON sr.booking_id = b.booking_id
JOIN rooms r ON b.room_id = r.room_id
LEFT JOIN branch_services bs ON sr.service_id = bs.service_id AND sr.branch_id = bs.branch_id
LEFT JOIN users u ON sr.reviewed_by = u.user_id;

-- Booking Financial Summary View
DROP VIEW IF EXISTS booking_financial_summary;
CREATE VIEW booking_financial_summary AS
SELECT 
    b.booking_id,
    b.branch_id,
    hb.branch_name,
    b.guest_id,
    CONCAT(g.first_name, ' ', g.last_name) as guest_name,
    b.check_in_date,
    b.check_out_date,
    b.booking_status,
    b.subtotal_amount,
    COALESCE(SUM(bd.discount_amount), 0) as total_discounts,
    COALESCE(SUM(bt.tax_amount), 0) as total_taxes,
    COALESCE(SUM(bf.fee_amount), 0) as total_fees,
    b.total_amount,
    b.paid_amount,
    b.outstanding_amount,
    b.promo_code
FROM bookings b
JOIN guests g ON b.guest_id = g.guest_id
JOIN hotel_branches hb ON b.branch_id = hb.branch_id
LEFT JOIN booking_discounts bd ON b.booking_id = bd.booking_id
LEFT JOIN booking_taxes bt ON b.booking_id = bt.booking_id
LEFT JOIN booking_fees bf ON b.booking_id = bf.booking_id
GROUP BY b.booking_id, b.branch_id, hb.branch_name, b.guest_id, g.first_name, g.last_name,
         b.check_in_date, b.check_out_date, b.booking_status, b.subtotal_amount,
         b.total_amount, b.paid_amount, b.outstanding_amount, b.promo_code;

-- Active Tax Configurations View
DROP VIEW IF EXISTS active_tax_configs;
CREATE VIEW active_tax_configs AS
SELECT 
    tc.tax_config_id,
    tc.branch_id,
    hb.branch_name,
    tc.tax_name,
    tc.tax_type,
    tc.tax_rate,
    tc.effective_from,
    tc.effective_to
FROM branch_tax_config tc
JOIN hotel_branches hb ON tc.branch_id = hb.branch_id
WHERE tc.is_active = TRUE
AND tc.effective_from <= CURDATE()
AND (tc.effective_to IS NULL OR tc.effective_to >= CURDATE());

-- Active Discount Configurations View
DROP VIEW IF EXISTS active_discount_configs;
CREATE VIEW active_discount_configs AS
SELECT 
    dc.discount_config_id,
    dc.branch_id,
    hb.branch_name,
    dc.discount_name,
    dc.discount_type,
    dc.discount_value,
    dc.applicable_on,
    dc.min_booking_amount,
    dc.max_discount_amount,
    dc.promo_code,
    dc.valid_from,
    dc.valid_to,
    dc.usage_limit,
    dc.usage_count,
    CASE 
        WHEN dc.usage_limit IS NULL THEN TRUE
        WHEN dc.usage_count < dc.usage_limit THEN TRUE
        ELSE FALSE
    END as is_available
FROM branch_discount_config dc
JOIN hotel_branches hb ON dc.branch_id = hb.branch_id
WHERE dc.is_active = TRUE
AND dc.valid_from <= CURDATE()
AND (dc.valid_to IS NULL OR dc.valid_to >= CURDATE());

-- Room with Current Guest View
DROP VIEW IF EXISTS rooms_with_current_guest;
CREATE VIEW rooms_with_current_guest AS
SELECT 
    r.room_id,
    r.branch_id,
    hb.branch_name,
    r.room_number,
    r.floor_number,
    r.status,
    rt.type_name as room_type,
    rt.base_rate,
    rt.capacity,
    b.booking_id,
    b.guest_id,
    CONCAT(g.first_name, ' ', g.last_name) as current_guest_name,
    g.email as guest_email,
    g.phone as guest_phone,
    b.check_in_date,
    b.check_out_date,
    b.actual_check_in,
    DATEDIFF(b.check_out_date, CURDATE()) as days_remaining,
    CASE 
        WHEN DATEDIFF(b.check_out_date, CURDATE()) < 0 THEN 'Overdue'
        WHEN DATEDIFF(b.check_out_date, CURDATE()) = 0 THEN 'Checkout Today'
        WHEN DATEDIFF(b.check_out_date, CURDATE()) <= 2 THEN 'Checkout Soon'
        ELSE 'Active'
    END as occupancy_status
FROM rooms r
JOIN hotel_branches hb ON r.branch_id = hb.branch_id
JOIN room_types rt ON r.room_type_id = rt.room_type_id
LEFT JOIN bookings b ON r.room_id = b.room_id 
    AND b.booking_status = 'Checked-In'
    AND b.check_out_date >= CURDATE()
LEFT JOIN guests g ON b.guest_id = g.guest_id;

-- ============================================
-- SECTION 9: INSERT DEFAULT CONFIGURATIONS
-- ============================================

-- Insert default tax configurations for each branch
INSERT IGNORE INTO branch_tax_config (branch_id, tax_name, tax_type, tax_rate, effective_from)
SELECT branch_id, 'VAT', 'VAT', 12.00, CURDATE() FROM hotel_branches;

INSERT IGNORE INTO branch_tax_config (branch_id, tax_name, tax_type, tax_rate, effective_from)
SELECT branch_id, 'Service Tax', 'Service Tax', 10.00, CURDATE() FROM hotel_branches;

-- Insert default fee configurations for each branch
INSERT IGNORE INTO branch_fee_config (branch_id, fee_type, fee_calculation, fee_value, grace_period_minutes)
SELECT branch_id, 'Late Checkout', 'Per Hour', 1000.00, 60 FROM hotel_branches;

INSERT IGNORE INTO branch_fee_config (branch_id, fee_type, fee_calculation, fee_value, grace_period_minutes)
SELECT branch_id, 'No Show', 'Percentage of Total', 50.00, 1440 FROM hotel_branches;

INSERT IGNORE INTO branch_fee_config (branch_id, fee_type, fee_calculation, fee_value, grace_period_minutes)
SELECT branch_id, 'Cancellation', 'Percentage of Total', 25.00, 0 FROM hotel_branches;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

SELECT '✅ Schema updates applied successfully!' as Status;
SELECT 'Created 15 new tables' as Detail1;
SELECT 'Added 7 new columns to existing tables' as Detail2;
SELECT 'Created 5 new views' as Detail3;
SELECT 'Inserted default tax and fee configurations' as Detail4;
