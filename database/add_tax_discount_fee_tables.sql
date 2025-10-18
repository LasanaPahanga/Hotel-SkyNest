-- ============================================
-- ADD MISSING TAX, DISCOUNT, AND FEE TABLES
-- Run this if you already set up the database
-- and don't want to re-run the complete setup
-- ============================================

USE skynest_hotels;

-- ============================================
-- TABLE: branch_tax_config
-- Branch-specific tax configurations
-- ============================================
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

-- ============================================
-- TABLE: branch_discount_config
-- Branch-specific discount configurations
-- ============================================
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

-- ============================================
-- TABLE: branch_fee_config
-- Branch-specific fee configurations
-- ============================================
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

-- ============================================
-- TABLE: payment_breakdowns
-- Detailed payment breakdown for bookings
-- ============================================
CREATE TABLE IF NOT EXISTS payment_breakdowns (
    breakdown_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL UNIQUE,
    room_charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
    services_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_config_id INT NULL,
    total_before_tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    fees_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    grand_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    breakdown_json JSON NULL COMMENT 'Complete breakdown details in JSON format',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (discount_config_id) REFERENCES branch_discount_config(discount_config_id) ON DELETE SET NULL,
    INDEX idx_booking (booking_id)
) ENGINE=InnoDB;

-- ============================================
-- Insert Tax Configurations (for each branch)
-- ============================================
INSERT IGNORE INTO branch_tax_config (branch_id, tax_name, tax_type, tax_rate, effective_from, is_active)
SELECT branch_id, 'VAT', 'VAT', 12.00, CURDATE(), TRUE FROM hotel_branches;

INSERT IGNORE INTO branch_tax_config (branch_id, tax_name, tax_type, tax_rate, effective_from, is_active)
SELECT branch_id, 'Service Tax', 'Service Tax', 10.00, CURDATE(), TRUE FROM hotel_branches;

-- ============================================
-- Insert Fee Configurations (for each branch)
-- ============================================
INSERT IGNORE INTO branch_fee_config (branch_id, fee_type, fee_calculation, fee_value, grace_period_minutes, is_active)
SELECT branch_id, 'Late Checkout', 'Per Hour', 1000.00, 60, TRUE FROM hotel_branches;

INSERT IGNORE INTO branch_fee_config (branch_id, fee_type, fee_calculation, fee_value, grace_period_minutes, is_active)
SELECT branch_id, 'No Show', 'Percentage of Total', 50.00, 1440, TRUE FROM hotel_branches;

INSERT IGNORE INTO branch_fee_config (branch_id, fee_type, fee_calculation, fee_value, grace_period_minutes, is_active)
SELECT branch_id, 'Cancellation', 'Percentage of Total', 25.00, 0, TRUE FROM hotel_branches;

SELECT 'Tax, Discount, Fee, and Payment Breakdown tables created successfully!' as Status;
SELECT 'Default tax and fee configurations added for all branches' as Info;
