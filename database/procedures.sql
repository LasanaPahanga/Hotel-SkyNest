-- SkyNest Hotels - Stored Procedures and Functions
-- Business logic implementation for ACID compliance

USE skynest_hotels;

DELIMITER $$

-- ============================================
-- FUNCTION: calculate_room_charges
-- Calculates total room charges for a booking
-- ============================================
DROP FUNCTION IF EXISTS calculate_room_charges$$
CREATE FUNCTION calculate_room_charges(
    p_room_id INT,
    p_check_in DATE,
    p_check_out DATE
) RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_rate DECIMAL(10,2);
    DECLARE v_nights INT;
    DECLARE v_total DECIMAL(10,2);
    
    -- Get room rate
    SELECT rt.base_rate INTO v_rate
    FROM rooms r
    JOIN room_types rt ON r.room_type_id = rt.room_type_id
    WHERE r.room_id = p_room_id;
    
    -- Calculate number of nights
    SET v_nights = DATEDIFF(p_check_out, p_check_in);
    
    -- Calculate total
    SET v_total = v_rate * v_nights;
    
    RETURN v_total;
END$$

-- ============================================
-- FUNCTION: calculate_service_charges
-- Calculates total service charges for a booking
-- ============================================
DROP FUNCTION IF EXISTS calculate_service_charges$$
CREATE FUNCTION calculate_service_charges(p_booking_id INT) 
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total DECIMAL(10,2);
    
    SELECT COALESCE(SUM(total_price), 0) INTO v_total
    FROM service_usage
    WHERE booking_id = p_booking_id;
    
    RETURN v_total;
END$$

-- ============================================
-- FUNCTION: check_room_availability
-- Checks if a room is available for given dates
-- Returns 1 if available, 0 if not
-- ============================================
DROP FUNCTION IF EXISTS check_room_availability$$
CREATE FUNCTION check_room_availability(
    p_room_id INT,
    p_check_in DATE,
    p_check_out DATE,
    p_exclude_booking_id INT
) RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_count INT;
    
    SELECT COUNT(*) INTO v_count
    FROM bookings
    WHERE room_id = p_room_id
    AND booking_status IN ('Booked', 'Checked-In')
    AND (booking_id != p_exclude_booking_id OR p_exclude_booking_id IS NULL)
    AND (
        (check_in_date <= p_check_in AND check_out_date > p_check_in)
        OR (check_in_date < p_check_out AND check_out_date >= p_check_out)
        OR (check_in_date >= p_check_in AND check_out_date <= p_check_out)
    );
    
    RETURN (v_count = 0);
END$$

-- ============================================
-- PROCEDURE: create_booking
-- Creates a new booking with validation
-- ============================================
DROP PROCEDURE IF EXISTS create_booking$$
CREATE PROCEDURE create_booking(
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
BEGIN
    DECLARE v_branch_id INT;
    DECLARE v_is_available BOOLEAN;
    DECLARE v_room_charges DECIMAL(10,2);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_error_message = 'Database error occurred';
        SET p_booking_id = NULL;
    END;
    
    START TRANSACTION;
    
    -- Validate dates
    IF p_check_out <= p_check_in THEN
        SET p_error_message = 'Check-out date must be after check-in date';
        SET p_booking_id = NULL;
        ROLLBACK;
    ELSE
        -- Get branch_id for the room
        SELECT branch_id INTO v_branch_id
        FROM rooms
        WHERE room_id = p_room_id;
        
        -- Check room availability
        SET v_is_available = check_room_availability(p_room_id, p_check_in, p_check_out, NULL);
        
        IF NOT v_is_available THEN
            SET p_error_message = 'Room is not available for selected dates';
            SET p_booking_id = NULL;
            ROLLBACK;
        ELSE
            -- Calculate room charges
            SET v_room_charges = calculate_room_charges(p_room_id, p_check_in, p_check_out);
            
            -- Create booking
            INSERT INTO bookings (
                guest_id, room_id, branch_id, check_in_date, check_out_date,
                number_of_guests, booking_status, payment_method, special_requests,
                total_amount, outstanding_amount, created_by
            ) VALUES (
                p_guest_id, p_room_id, v_branch_id, p_check_in, p_check_out,
                p_number_of_guests, 'Booked', p_payment_method, p_special_requests,
                v_room_charges, v_room_charges, p_created_by
            );
            
            SET p_booking_id = LAST_INSERT_ID();
            
            -- Update room status to Reserved
            UPDATE rooms SET status = 'Reserved' WHERE room_id = p_room_id;
            
            SET p_error_message = NULL;
            COMMIT;
        END IF;
    END IF;
END$$

-- ============================================
-- PROCEDURE: check_in_guest
-- Processes guest check-in
-- ============================================
DROP PROCEDURE IF EXISTS check_in_guest$$
CREATE PROCEDURE check_in_guest(
    IN p_booking_id INT,
    IN p_user_id INT,
    OUT p_success BOOLEAN,
    OUT p_error_message VARCHAR(255)
)
BEGIN
    DECLARE v_room_id INT;
    DECLARE v_booking_status VARCHAR(20);
    DECLARE v_check_in_date DATE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_error_message = 'Database error occurred';
    END;
    
    START TRANSACTION;
    
    -- Get booking details
    SELECT room_id, booking_status, check_in_date
    INTO v_room_id, v_booking_status, v_check_in_date
    FROM bookings
    WHERE booking_id = p_booking_id;
    
    -- Validate booking status
    IF v_booking_status != 'Booked' THEN
        SET p_success = FALSE;
        SET p_error_message = 'Booking is not in Booked status';
        ROLLBACK;
    ELSE
        -- Update booking status
        UPDATE bookings
        SET booking_status = 'Checked-In',
            actual_check_in = NOW()
        WHERE booking_id = p_booking_id;
        
        -- Update room status
        UPDATE rooms
        SET status = 'Occupied'
        WHERE room_id = v_room_id;
        
        SET p_success = TRUE;
        SET p_error_message = NULL;
        COMMIT;
    END IF;
END$$

-- ============================================
-- PROCEDURE: check_out_guest
-- Processes guest check-out with billing
-- ============================================
DROP PROCEDURE IF EXISTS check_out_guest$$
CREATE PROCEDURE check_out_guest(
    IN p_booking_id INT,
    IN p_user_id INT,
    OUT p_success BOOLEAN,
    OUT p_error_message VARCHAR(255),
    OUT p_outstanding_amount DECIMAL(10,2)
)
BEGIN
    DECLARE v_room_id INT;
    DECLARE v_booking_status VARCHAR(20);
    DECLARE v_paid_amount DECIMAL(10,2);
    DECLARE v_total_amount DECIMAL(10,2);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_error_message = 'Database error occurred';
    END;
    
    START TRANSACTION;
    
    -- Get booking details
    SELECT room_id, booking_status, paid_amount, total_amount
    INTO v_room_id, v_booking_status, v_paid_amount, v_total_amount
    FROM bookings
    WHERE booking_id = p_booking_id;
    
    -- Validate booking status
    IF v_booking_status != 'Checked-In' THEN
        SET p_success = FALSE;
        SET p_error_message = 'Booking is not in Checked-In status';
        SET p_outstanding_amount = 0;
        ROLLBACK;
    ELSE
        -- Calculate outstanding amount
        SET p_outstanding_amount = v_total_amount - v_paid_amount;
        
        -- Check if payment is complete
        IF p_outstanding_amount > 0 THEN
            SET p_success = FALSE;
            SET p_error_message = 'Outstanding payment required before checkout';
            ROLLBACK;
        ELSE
            -- Update booking status
            UPDATE bookings
            SET booking_status = 'Checked-Out',
                actual_check_out = NOW()
            WHERE booking_id = p_booking_id;
            
            -- Update room status
            UPDATE rooms
            SET status = 'Available'
            WHERE room_id = v_room_id;
            
            SET p_success = TRUE;
            SET p_error_message = NULL;
            COMMIT;
        END IF;
    END IF;
END$$

-- ============================================
-- PROCEDURE: add_service_usage
-- Adds a service to a booking
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
    DECLARE v_total_price DECIMAL(10,2);
    DECLARE v_booking_status VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_error_message = 'Database error occurred';
        SET p_usage_id = NULL;
    END;
    
    START TRANSACTION;
    
    -- Check booking status
    SELECT booking_status INTO v_booking_status
    FROM bookings
    WHERE booking_id = p_booking_id;
    
    IF v_booking_status != 'Checked-In' THEN
        SET p_error_message = 'Services can only be added to checked-in bookings';
        SET p_usage_id = NULL;
        ROLLBACK;
    ELSE
        -- Get service price
        SELECT unit_price INTO v_unit_price
        FROM service_catalogue
        WHERE service_id = p_service_id AND is_active = TRUE;
        
        -- Calculate total price
        SET v_total_price = v_unit_price * p_quantity;
        
        -- Insert service usage
        INSERT INTO service_usage (
            booking_id, service_id, quantity, unit_price, total_price, notes
        ) VALUES (
            p_booking_id, p_service_id, p_quantity, v_unit_price, v_total_price, p_notes
        );
        
        SET p_usage_id = LAST_INSERT_ID();
        SET p_error_message = NULL;
        
        COMMIT;
    END IF;
END$$

-- ============================================
-- PROCEDURE: process_payment
-- Processes a payment for a booking
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
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_error_message = 'Database error occurred';
        SET p_payment_id = NULL;
    END;
    
    START TRANSACTION;
    
    -- Get outstanding amount
    SELECT outstanding_amount INTO v_outstanding
    FROM bookings
    WHERE booking_id = p_booking_id;
    
    -- Validate payment amount
    IF p_amount <= 0 THEN
        SET p_error_message = 'Payment amount must be greater than zero';
        SET p_payment_id = NULL;
        ROLLBACK;
    ELSEIF p_amount > v_outstanding THEN
        SET p_error_message = 'Payment amount exceeds outstanding balance';
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
        SET p_error_message = NULL;
        
        COMMIT;
    END IF;
END$$

-- ============================================
-- PROCEDURE: cancel_booking
-- Cancels a booking
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
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_error_message = 'Database error occurred';
    END;
    
    START TRANSACTION;
    
    -- Get booking details
    SELECT room_id, booking_status
    INTO v_room_id, v_booking_status
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
        
        -- Update room status if it was reserved
        IF v_booking_status = 'Booked' THEN
            UPDATE rooms
            SET status = 'Available'
            WHERE room_id = v_room_id;
        END IF;
        
        SET p_success = TRUE;
        SET p_error_message = NULL;
        COMMIT;
    END IF;
END$$

DELIMITER ;
