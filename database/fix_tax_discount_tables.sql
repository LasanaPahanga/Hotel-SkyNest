-- Fix Tax, Discount, and Fee Tables
-- Run this to ensure all tables exist and have proper structure

-- 1. Tax Configurations Table
CREATE TABLE IF NOT EXISTS tax_configurations (
    tax_config_id INT PRIMARY KEY AUTO_INCREMENT,
    branch_id INT NOT NULL,
    tax_name VARCHAR(100) NOT NULL,
    tax_type ENUM('VAT', 'Service Tax', 'Tourism Tax', 'Other') NOT NULL DEFAULT 'VAT',
    tax_rate DECIMAL(5,2) NOT NULL,
    is_percentage BOOLEAN DEFAULT TRUE,
    effective_from DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES hotel_branches(branch_id) ON DELETE CASCADE,
    INDEX idx_branch_active (branch_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Discount Configurations Table
CREATE TABLE IF NOT EXISTS discount_configurations (
    discount_config_id INT PRIMARY KEY AUTO_INCREMENT,
    branch_id INT NOT NULL,
    discount_name VARCHAR(100) NOT NULL,
    discount_type ENUM('Percentage', 'Fixed Amount') NOT NULL DEFAULT 'Percentage',
    discount_value DECIMAL(10,2) NOT NULL,
    promo_code VARCHAR(50) UNIQUE,
    min_booking_amount DECIMAL(10,2) DEFAULT 0,
    max_discount_amount DECIMAL(10,2),
    usage_limit INT,
    usage_count INT DEFAULT 0,
    valid_from DATE,
    valid_until DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES hotel_branches(branch_id) ON DELETE CASCADE,
    INDEX idx_promo_code (promo_code),
    INDEX idx_branch_active (branch_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Fee Configurations Table (if not exists)
CREATE TABLE IF NOT EXISTS fee_configurations (
    fee_config_id INT PRIMARY KEY AUTO_INCREMENT,
    branch_id INT NOT NULL,
    fee_type ENUM('Late Checkout', 'No-Show', 'Cancellation', 'Damage', 'Other') NOT NULL,
    fee_calculation ENUM('Fixed Amount', 'Percentage', 'Per Hour') NOT NULL DEFAULT 'Fixed Amount',
    fee_value DECIMAL(10,2) NOT NULL,
    grace_period_minutes INT DEFAULT 0,
    max_fee_amount DECIMAL(10,2),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES hotel_branches(branch_id) ON DELETE CASCADE,
    INDEX idx_branch_active (branch_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Payment Breakdown Table (stores itemized bill)
CREATE TABLE IF NOT EXISTS payment_breakdowns (
    breakdown_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    room_charge DECIMAL(10,2) NOT NULL,
    services_total DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    discount_config_id INT,
    total_before_tax DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    fees_amount DECIMAL(10,2) DEFAULT 0,
    grand_total DECIMAL(10,2) NOT NULL,
    breakdown_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (discount_config_id) REFERENCES discount_configurations(discount_config_id) ON DELETE SET NULL,
    INDEX idx_booking (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Insert sample tax configurations for each branch
INSERT INTO tax_configurations (branch_id, tax_name, tax_type, tax_rate, is_percentage, effective_from, is_active)
SELECT 
    branch_id,
    'VAT',
    'VAT',
    12.00,
    TRUE,
    '2024-01-01',
    TRUE
FROM hotel_branches
WHERE NOT EXISTS (
    SELECT 1 FROM tax_configurations 
    WHERE branch_id = hotel_branches.branch_id 
    AND tax_name = 'VAT'
);

INSERT INTO tax_configurations (branch_id, tax_name, tax_type, tax_rate, is_percentage, effective_from, is_active)
SELECT 
    branch_id,
    'Service Tax',
    'Service Tax',
    10.00,
    TRUE,
    '2024-01-01',
    TRUE
FROM hotel_branches
WHERE NOT EXISTS (
    SELECT 1 FROM tax_configurations 
    WHERE branch_id = hotel_branches.branch_id 
    AND tax_name = 'Service Tax'
);

-- 6. Insert sample fee configurations for each branch
INSERT INTO fee_configurations (branch_id, fee_type, fee_calculation, fee_value, grace_period_minutes, max_fee_amount, description, is_active)
SELECT 
    branch_id,
    'Late Checkout',
    'Per Hour',
    500.00,
    30,
    2000.00,
    'Fee charged for late checkout beyond grace period',
    TRUE
FROM hotel_branches
WHERE NOT EXISTS (
    SELECT 1 FROM fee_configurations 
    WHERE branch_id = hotel_branches.branch_id 
    AND fee_type = 'Late Checkout'
);

INSERT INTO fee_configurations (branch_id, fee_type, fee_calculation, fee_value, grace_period_minutes, max_fee_amount, description, is_active)
SELECT 
    branch_id,
    'No-Show',
    'Percentage',
    50.00,
    0,
    NULL,
    'Fee charged when guest does not show up',
    TRUE
FROM hotel_branches
WHERE NOT EXISTS (
    SELECT 1 FROM fee_configurations 
    WHERE branch_id = hotel_branches.branch_id 
    AND fee_type = 'No-Show'
);

INSERT INTO fee_configurations (branch_id, fee_type, fee_calculation, fee_value, grace_period_minutes, max_fee_amount, description, is_active)
SELECT 
    branch_id,
    'Cancellation',
    'Percentage',
    25.00,
    0,
    NULL,
    'Fee charged for booking cancellation',
    TRUE
FROM hotel_branches
WHERE NOT EXISTS (
    SELECT 1 FROM fee_configurations 
    WHERE branch_id = hotel_branches.branch_id 
    AND fee_type = 'Cancellation'
);

-- 7. Verify data
SELECT 'Tax Configurations' as TableName, COUNT(*) as RecordCount FROM tax_configurations
UNION ALL
SELECT 'Discount Configurations', COUNT(*) FROM discount_configurations
UNION ALL
SELECT 'Fee Configurations', COUNT(*) FROM fee_configurations
UNION ALL
SELECT 'Payment Breakdowns', COUNT(*) FROM payment_breakdowns;

-- 8. Show sample data
SELECT 'Sample Taxes:' as Info;
SELECT branch_id, tax_name, tax_rate, is_active FROM tax_configurations LIMIT 5;

SELECT 'Sample Fees:' as Info;
SELECT branch_id, fee_type, fee_value, is_active FROM fee_configurations LIMIT 5;
