-- ============================================
-- UPDATE PROCEDURES FOR PROPER TRANSACTION HANDLING
-- Fixes revenue calculation and service management
-- ============================================

USE skynest_hotels;

DELIMITER $$

-- ============================================
-- UPDATED: add_service_usage
-- Now supports branch-specific pricing and any booking status
-- ============================================
DROP PROCEDURE IF EXISTS add_service_usage$$
CREATE PROCEDURE add_service_usage(
    IN p_booking_id INT,
    IN p_service_id INT,
    IN p_quantity INT,
    IN p_notes TEXT,
    OUT p_usage_id INT,
    OUT p_error_message VARCHAR(255)
)
BEGIN
    DECLARE v_unit_price DECIMAL(10,2);
    DECLARE v_custom_price DECIMAL(10,2);
    DECLARE v_total_price DECIMAL(10,2);
    DECLARE v_booking_status VARCHAR(20);
    DECLARE v_branch_id INT;
    DECLARE v_service_available BOOLEAN;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_error_message = 'Database error occurred';
        SET p_usage_id = NULL;
    END;
    
    START TRANSACTION;
    
    -- Get booking details
    SELECT booking_status, branch_id INTO v_booking_status, v_branch_id
    FROM bookings
    WHERE booking_id = p_booking_id;
    
    -- Check if booking is cancelled
    IF v_booking_status = 'Cancelled' THEN
        SET p_error_message = 'Cannot add services to cancelled bookings';
        SET p_usage_id = NULL;
        ROLLBACK;
    ELSE
        -- Get service price (check for branch-specific price first)
        SELECT 
            COALESCE(bs.custom_price, sc.unit_price) AS price,
            COALESCE(bs.is_available, TRUE) AS available
        INTO v_unit_price, v_service_available
        FROM service_catalogue sc
        LEFT JOIN branch_services bs ON sc.service_id = bs.service_id AND bs.branch_id = v_branch_id
        WHERE sc.service_id = p_service_id AND sc.is_active = TRUE;
        
        -- Check if service is available in this branch
        IF NOT v_service_available THEN
            SET p_error_message = 'Service is not available in this branch';
            SET p_usage_id = NULL;
            ROLLBACK;
        ELSE
            -- Calculate total price
            SET v_total_price = v_unit_price * p_quantity;
            
            -- Insert service usage
            INSERT INTO service_usage (
                booking_id, service_id, quantity, unit_price, total_price, notes
            ) VALUES (
                p_booking_id, p_service_id, p_quantity, v_unit_price, v_total_price, p_notes
            );
            
            SET p_usage_id = LAST_INSERT_ID();
            
            -- Update booking total amount
            CALL update_booking_total(p_booking_id);
            
            SET p_error_message = NULL;
            COMMIT;
        END IF;
    END IF;
END$$

-- ============================================
-- NEW: update_booking_total
-- Recalculates booking total based on room + services
-- ============================================
DROP PROCEDURE IF EXISTS update_booking_total$$
CREATE PROCEDURE update_booking_total(IN p_booking_id INT)
BEGIN
    DECLARE v_room_charges DECIMAL(10,2);
    DECLARE v_service_charges DECIMAL(10,2);
    DECLARE v_total DECIMAL(10,2);
    DECLARE v_paid DECIMAL(10,2);
    DECLARE v_room_id INT;
    DECLARE v_check_in DATE;
    DECLARE v_check_out DATE;
    
    -- Get booking details
    SELECT room_id, check_in_date, check_out_date, paid_amount
    INTO v_room_id, v_check_in, v_check_out, v_paid
    FROM bookings
    WHERE booking_id = p_booking_id;
    
    -- Calculate room charges
    SET v_room_charges = calculate_room_charges(v_room_id, v_check_in, v_check_out);
    
    -- Calculate service charges
    SET v_service_charges = calculate_service_charges(p_booking_id);
    
    -- Calculate total
    SET v_total = v_room_charges + v_service_charges;
    
    -- Update booking
    UPDATE bookings
    SET total_amount = v_total,
        outstanding_amount = v_total - v_paid
    WHERE booking_id = p_booking_id;
END$$

-- ============================================
-- UPDATED: process_payment
-- Now updates booking amounts and validates properly
-- ============================================
DROP PROCEDURE IF EXISTS process_payment$$
CREATE PROCEDURE process_payment(
    IN p_booking_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_payment_method VARCHAR(50),
    IN p_transaction_ref VARCHAR(100),
    IN p_processed_by INT,
    OUT p_payment_id INT,
    OUT p_error_message VARCHAR(255)
)
BEGIN
    DECLARE v_outstanding DECIMAL(10,2);
    DECLARE v_paid DECIMAL(10,2);
    DECLARE v_total DECIMAL(10,2);
    DECLARE v_booking_status VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_error_message = 'Database error occurred';
        SET p_payment_id = NULL;
    END;
    
    START TRANSACTION;
    
    -- Recalculate booking total first
    CALL update_booking_total(p_booking_id);
    
    -- Get booking details
    SELECT outstanding_amount, paid_amount, total_amount, booking_status
    INTO v_outstanding, v_paid, v_total, v_booking_status
    FROM bookings
    WHERE booking_id = p_booking_id;
    
    -- Cannot process payment for cancelled bookings
    IF v_booking_status = 'Cancelled' THEN
        SET p_error_message = 'Cannot process payment for cancelled bookings';
        SET p_payment_id = NULL;
        ROLLBACK;
    -- Validate payment amount
    ELSEIF p_amount <= 0 THEN
        SET p_error_message = 'Payment amount must be greater than zero';
        SET p_payment_id = NULL;
        ROLLBACK;
    ELSEIF p_amount > v_outstanding THEN
        SET p_error_message = CONCAT('Payment amount exceeds outstanding balance of ', v_outstanding);
        SET p_payment_id = NULL;
        ROLLBACK;
    ELSE
        -- Insert payment record
        INSERT INTO payments (
            booking_id, amount, payment_method, transaction_reference,
            payment_status, processed_by
        ) VALUES (
            p_booking_id, p_amount, p_payment_method, p_transaction_ref,
            'Completed', p_processed_by
        );
        
        SET p_payment_id = LAST_INSERT_ID();
        
        -- Update booking amounts
        UPDATE bookings
        SET paid_amount = paid_amount + p_amount,
            outstanding_amount = outstanding_amount - p_amount
        WHERE booking_id = p_booking_id;
        
        SET p_error_message = NULL;
        COMMIT;
    END IF;
END$$

-- ============================================
-- UPDATED: cancel_booking
-- Ensures no revenue is counted for cancelled unpaid bookings
-- ============================================
DROP PROCEDURE IF EXISTS cancel_booking$$
CREATE PROCEDURE cancel_booking(
    IN p_booking_id INT,
    IN p_user_id INT,
    OUT p_success BOOLEAN,
    OUT p_error_message VARCHAR(255)
)
BEGIN
    DECLARE v_room_id INT;
    DECLARE v_booking_status VARCHAR(20);
    DECLARE v_paid_amount DECIMAL(10,2);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_error_message = 'Database error occurred';
    END;
    
    START TRANSACTION;
    
    -- Get booking details
    SELECT room_id, booking_status, paid_amount
    INTO v_room_id, v_booking_status, v_paid_amount
    FROM bookings
    WHERE booking_id = p_booking_id;
    
    -- Validate booking status
    IF v_booking_status IN ('Checked-Out', 'Cancelled') THEN
        SET p_success = FALSE;
        SET p_error_message = 'Cannot cancel this booking';
        ROLLBACK;
    ELSE
        -- Update booking status
        UPDATE bookings
        SET booking_status = 'Cancelled'
        WHERE booking_id = p_booking_id;
        
        -- Update room status if it was reserved or occupied
        IF v_booking_status IN ('Booked', 'Checked-In') THEN
            UPDATE rooms
            SET status = 'Available'
            WHERE room_id = v_room_id;
        END IF;
        
        -- Note: Paid amounts remain as revenue (non-refundable)
        -- Outstanding amounts are cleared (not counted as revenue)
        UPDATE bookings
        SET outstanding_amount = 0
        WHERE booking_id = p_booking_id;
        
        SET p_success = TRUE;
        SET p_error_message = NULL;
        COMMIT;
    END IF;
END$$

-- ============================================
-- NEW: delete_service_usage
-- Removes a service from booking and recalculates total
-- ============================================
DROP PROCEDURE IF EXISTS delete_service_usage$$
CREATE PROCEDURE delete_service_usage(
    IN p_usage_id INT,
    OUT p_success BOOLEAN,
    OUT p_error_message VARCHAR(255)
)
BEGIN
    DECLARE v_booking_id INT;
    DECLARE v_booking_status VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_error_message = 'Database error occurred';
    END;
    
    START TRANSACTION;
    
    -- Get booking details
    SELECT su.booking_id, b.booking_status
    INTO v_booking_id, v_booking_status
    FROM service_usage su
    JOIN bookings b ON su.booking_id = b.booking_id
    WHERE su.usage_id = p_usage_id;
    
    -- Cannot delete from cancelled or checked-out bookings
    IF v_booking_status IN ('Cancelled', 'Checked-Out') THEN
        SET p_success = FALSE;
        SET p_error_message = 'Cannot modify services for this booking status';
        ROLLBACK;
    ELSE
        -- Delete service usage
        DELETE FROM service_usage WHERE usage_id = p_usage_id;
        
        -- Recalculate booking total
        CALL update_booking_total(v_booking_id);
        
        SET p_success = TRUE;
        SET p_error_message = NULL;
        COMMIT;
    END IF;
END$$

-- ============================================
-- Create trigger to update booking total when service is added
-- ============================================
DROP TRIGGER IF EXISTS after_service_usage_insert$$
CREATE TRIGGER after_service_usage_insert
AFTER INSERT ON service_usage
FOR EACH ROW
BEGIN
    UPDATE bookings
    SET total_amount = calculate_room_charges(room_id, check_in_date, check_out_date) + 
                       calculate_service_charges(NEW.booking_id),
        outstanding_amount = total_amount - paid_amount
    WHERE booking_id = NEW.booking_id;
END$$

-- ============================================
-- Create trigger to update booking total when service is deleted
-- ============================================
DROP TRIGGER IF EXISTS after_service_usage_delete$$
CREATE TRIGGER after_service_usage_delete
AFTER DELETE ON service_usage
FOR EACH ROW
BEGIN
    UPDATE bookings
    SET total_amount = calculate_room_charges(room_id, check_in_date, check_out_date) + 
                       calculate_service_charges(OLD.booking_id),
        outstanding_amount = total_amount - paid_amount
    WHERE booking_id = OLD.booking_id;
END$$

DELIMITER ;

SELECT '✅ Procedures and triggers updated successfully!' AS status;
SELECT 'Revenue calculation now follows proper transaction rules' AS note;
