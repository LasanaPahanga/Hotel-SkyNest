-- SkyNest Hotels - Database Triggers
-- Ensures ACID compliance and data consistency

USE skynest_hotels;

DELIMITER $$

-- ============================================
-- TRIGGER: after_service_usage_insert
-- Updates booking total when service is added
-- ============================================
DROP TRIGGER IF EXISTS after_service_usage_insert$$
CREATE TRIGGER after_service_usage_insert
AFTER INSERT ON service_usage
FOR EACH ROW
BEGIN
    DECLARE v_room_charges DECIMAL(10,2);
    DECLARE v_service_charges DECIMAL(10,2);
    DECLARE v_total DECIMAL(10,2);
    DECLARE v_paid DECIMAL(10,2);
    
    -- Get current values
    SELECT total_amount, paid_amount INTO v_total, v_paid
    FROM bookings
    WHERE booking_id = NEW.booking_id;
    
    -- Calculate new total (room charges + all service charges)
    SELECT check_in_date, check_out_date, room_id INTO @check_in, @check_out, @room_id
    FROM bookings
    WHERE booking_id = NEW.booking_id;
    
    SET v_room_charges = calculate_room_charges(@room_id, @check_in, @check_out);
    SET v_service_charges = calculate_service_charges(NEW.booking_id);
    SET v_total = v_room_charges + v_service_charges;
    
    -- Update booking totals
    UPDATE bookings
    SET total_amount = v_total,
        outstanding_amount = v_total - v_paid
    WHERE booking_id = NEW.booking_id;
END$$

-- ============================================
-- TRIGGER: after_service_usage_delete
-- Updates booking total when service is removed
-- ============================================
DROP TRIGGER IF EXISTS after_service_usage_delete$$
CREATE TRIGGER after_service_usage_delete
AFTER DELETE ON service_usage
FOR EACH ROW
BEGIN
    DECLARE v_room_charges DECIMAL(10,2);
    DECLARE v_service_charges DECIMAL(10,2);
    DECLARE v_total DECIMAL(10,2);
    DECLARE v_paid DECIMAL(10,2);
    
    -- Get current paid amount
    SELECT paid_amount INTO v_paid
    FROM bookings
    WHERE booking_id = OLD.booking_id;
    
    -- Calculate new total
    SELECT check_in_date, check_out_date, room_id INTO @check_in, @check_out, @room_id
    FROM bookings
    WHERE booking_id = OLD.booking_id;
    
    SET v_room_charges = calculate_room_charges(@room_id, @check_in, @check_out);
    SET v_service_charges = calculate_service_charges(OLD.booking_id);
    SET v_total = v_room_charges + v_service_charges;
    
    -- Update booking totals
    UPDATE bookings
    SET total_amount = v_total,
        outstanding_amount = v_total - v_paid
    WHERE booking_id = OLD.booking_id;
END$$

-- ============================================
-- TRIGGER: after_payment_insert
-- Updates booking payment status after payment
-- ============================================
DROP TRIGGER IF EXISTS after_payment_insert$$
CREATE TRIGGER after_payment_insert
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
    DECLARE v_total_paid DECIMAL(10,2);
    DECLARE v_total_amount DECIMAL(10,2);
    DECLARE v_outstanding DECIMAL(10,2);
    
    -- Calculate total paid amount
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM payments
    WHERE booking_id = NEW.booking_id
    AND payment_status = 'Completed';
    
    -- Get total amount
    SELECT total_amount INTO v_total_amount
    FROM bookings
    WHERE booking_id = NEW.booking_id;
    
    -- Calculate outstanding
    SET v_outstanding = v_total_amount - v_total_paid;
    
    -- Update booking
    UPDATE bookings
    SET paid_amount = v_total_paid,
        outstanding_amount = v_outstanding
    WHERE booking_id = NEW.booking_id;
END$$

-- ============================================
-- TRIGGER: before_booking_insert
-- Validates booking before insertion
-- ============================================
DROP TRIGGER IF EXISTS before_booking_insert$$
CREATE TRIGGER before_booking_insert
BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
    DECLARE v_is_available BOOLEAN;
    
    -- Check room availability
    SET v_is_available = check_room_availability(
        NEW.room_id,
        NEW.check_in_date,
        NEW.check_out_date,
        NULL
    );
    
    IF NOT v_is_available THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Room is not available for the selected dates';
    END IF;
    
    -- Validate dates
    IF NEW.check_out_date <= NEW.check_in_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Check-out date must be after check-in date';
    END IF;
    
    -- Set initial outstanding amount equal to total amount
    SET NEW.outstanding_amount = NEW.total_amount;
END$$

-- ============================================
-- TRIGGER: before_booking_update
-- Validates booking updates
-- ============================================
DROP TRIGGER IF EXISTS before_booking_update$$
CREATE TRIGGER before_booking_update
BEFORE UPDATE ON bookings
FOR EACH ROW
BEGIN
    DECLARE v_is_available BOOLEAN;
    
    -- If dates are being changed, check availability
    IF (NEW.check_in_date != OLD.check_in_date OR NEW.check_out_date != OLD.check_out_date)
       AND NEW.booking_status IN ('Booked', 'Checked-In') THEN
        
        SET v_is_available = check_room_availability(
            NEW.room_id,
            NEW.check_in_date,
            NEW.check_out_date,
            NEW.booking_id
        );
        
        IF NOT v_is_available THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Room is not available for the new dates';
        END IF;
    END IF;
    
    -- Prevent checkout if outstanding balance exists
    IF NEW.booking_status = 'Checked-Out' AND OLD.booking_status = 'Checked-In' THEN
        IF NEW.outstanding_amount > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot check out with outstanding balance';
        END IF;
    END IF;
END$$

-- ============================================
-- TRIGGER: after_booking_update
-- Updates room status when booking status changes
-- ============================================
DROP TRIGGER IF EXISTS after_booking_update$$
CREATE TRIGGER after_booking_update
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    -- Update room status based on booking status change
    IF NEW.booking_status != OLD.booking_status THEN
        CASE NEW.booking_status
            WHEN 'Checked-In' THEN
                UPDATE rooms SET status = 'Occupied' WHERE room_id = NEW.room_id;
            WHEN 'Checked-Out' THEN
                UPDATE rooms SET status = 'Available' WHERE room_id = NEW.room_id;
            WHEN 'Cancelled' THEN
                IF OLD.booking_status = 'Booked' THEN
                    UPDATE rooms SET status = 'Available' WHERE room_id = NEW.room_id;
                END IF;
            WHEN 'Booked' THEN
                UPDATE rooms SET status = 'Reserved' WHERE room_id = NEW.room_id;
        END CASE;
    END IF;
END$$

-- ============================================
-- TRIGGER: before_service_usage_insert
-- Validates service usage before insertion
-- ============================================
DROP TRIGGER IF EXISTS before_service_usage_insert$$
CREATE TRIGGER before_service_usage_insert
BEFORE INSERT ON service_usage
FOR EACH ROW
BEGIN
    DECLARE v_booking_status VARCHAR(20);
    
    -- Check if booking is checked-in
    SELECT booking_status INTO v_booking_status
    FROM bookings
    WHERE booking_id = NEW.booking_id;
    
    IF v_booking_status != 'Checked-In' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Services can only be added to checked-in bookings';
    END IF;
    
    -- Calculate total price
    SET NEW.total_price = NEW.unit_price * NEW.quantity;
END$$

-- ============================================
-- TRIGGER: audit_booking_changes
-- Logs booking changes to audit table
-- ============================================
DROP TRIGGER IF EXISTS audit_booking_changes$$
CREATE TRIGGER audit_booking_changes
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    IF NEW.booking_status != OLD.booking_status THEN
        INSERT INTO audit_log (
            user_id, action, table_name, record_id,
            old_values, new_values
        ) VALUES (
            NEW.created_by,
            'UPDATE_BOOKING_STATUS',
            'bookings',
            NEW.booking_id,
            JSON_OBJECT('status', OLD.booking_status),
            JSON_OBJECT('status', NEW.booking_status)
        );
    END IF;
END$$

DELIMITER ;
