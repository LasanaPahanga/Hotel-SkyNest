-- ============================================
-- ADD MISSING payment_breakdowns TABLE
-- Run this to fix the payment processing error
-- ============================================

USE skynest_hotels;

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

SELECT 'payment_breakdowns table created successfully!' as Status;
