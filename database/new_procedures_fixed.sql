-- ============================================
-- SKYNEST HOTELS - NEW STORED PROCEDURES (FIXED)
-- Tax, Discount, Fee Management & Calculations
-- ============================================

USE skynest_hotels;

DELIMITER $$

-- ============================================
-- PROCEDURE: Calculate Booking Taxes
-- ============================================
DROP PROCEDURE IF EXISTS calculate_booking_taxes$$
CREATE PROCEDURE calculate_booking_taxes(
    IN p_booking_id INT,
    IN p_branch_id INT,
    IN p_taxable_amount DECIMAL(10,2),
    OUT p_total_tax DECIMAL(10,2)
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_tax_config_id INT;
    DECLARE v_tax_name VARCHAR(100);
    DECLARE v_tax_rate DECIMAL(5,2);
    DECLARE v_tax_amount DECIMAL(10,2);
    
    DECLARE tax_cursor CURSOR FOR
        SELECT tax_config_id, tax_name, tax_rate
        FROM branch_tax_config
        WHERE branch_id = p_branch_id
        AND is_active = TRUE
        AND effective_from <= CURDATE()
        AND (effective_to IS NULL OR effective_to >= CURDATE());
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    SET p_total_tax = 0;
    
    -- Delete existing tax records for this booking
    DELETE FROM booking_taxes WHERE booking_id = p_booking_id;
    
    OPEN tax_cursor;
    
    tax_loop: LOOP
        FETCH tax_cursor INTO v_tax_config_id, v_tax_name, v_tax_rate;
        IF done THEN
            LEAVE tax_loop;
        END IF;
        
        -- Calculate tax amount
        SET v_tax_amount = ROUND(p_taxable_amount * v_tax_rate / 100, 2);
        
        -- Insert tax record
        INSERT INTO booking_taxes (
            booking_id, tax_config_id, tax_name, tax_rate, 
            taxable_amount, tax_amount
        ) VALUES (
            p_booking_id, v_tax_config_id, v_tax_name, v_tax_rate,
            p_taxable_amount, v_tax_amount
        );
        
        SET p_total_tax = p_total_tax + v_tax_amount;
    END LOOP;
    
    CLOSE tax_cursor;
END$$

-- ============================================
-- PROCEDURE: Apply Discount to Booking
-- ============================================
DROP PROCEDURE IF EXISTS apply_discount_to_booking$$
CREATE PROCEDURE apply_discount_to_booking(
    IN p_booking_id INT,
    IN p_branch_id INT,
    IN p_subtotal DECIMAL(10,2),
    IN p_promo_code VARCHAR(50),
    OUT p_discount_amount DECIMAL(10,2),
    OUT p_error_message VARCHAR(255)
)
BEGIN
    DECLARE v_discount_config_id INT DEFAULT NULL;
    DECLARE v_discount_name VARCHAR(100);
    DECLARE v_discount_type VARCHAR(20);
    DECLARE v_discount_value DECIMAL(10,2);
    DECLARE v_max_discount DECIMAL(10,2);
    DECLARE v_min_amount DECIMAL(10,2);
    DECLARE v_usage_limit INT;
    DECLARE v_usage_count INT;
    
    SET p_discount_amount = 0;
    SET p_error_message = NULL;
    
    -- If promo code provided, validate and apply it
    IF p_promo_code IS NOT NULL AND p_promo_code != '' THEN
        SELECT 
            discount_config_id, discount_name, discount_type, 
            discount_value, max_discount_amount, min_booking_amount,
            usage_limit, usage_count
        INTO 
            v_discount_config_id, v_discount_name, v_discount_type,
            v_discount_value, v_max_discount, v_min_amount,
            v_usage_limit, v_usage_count
        FROM branch_discount_config
        WHERE promo_code = p_promo_code
        AND branch_id = p_branch_id
        AND is_active = TRUE
        AND valid_from <= CURDATE()
        AND (valid_to IS NULL OR valid_to >= CURDATE())
        LIMIT 1;
        
        -- Check if promo code exists
        IF v_discount_config_id IS NULL THEN
            SET p_error_message = 'Invalid or expired promo code';
        ELSE
            -- Check usage limit
            IF v_usage_limit IS NOT NULL AND v_usage_count >= v_usage_limit THEN
                SET p_error_message = 'Promo code usage limit exceeded';
            ELSEIF p_subtotal < v_min_amount THEN
                -- Check minimum booking amount
                SET p_error_message = CONCAT('Minimum booking amount of ', v_min_amount, ' required');
            ELSE
                -- Calculate discount amount
                IF v_discount_type = 'Percentage' THEN
                    SET p_discount_amount = ROUND(p_subtotal * v_discount_value / 100, 2);
                ELSE
                    SET p_discount_amount = v_discount_value;
                END IF;
                
                -- Apply maximum discount cap if set
                IF v_max_discount IS NOT NULL AND p_discount_amount > v_max_discount THEN
                    SET p_discount_amount = v_max_discount;
                END IF;
                
                -- Ensure discount doesn't exceed subtotal
                IF p_discount_amount > p_subtotal THEN
                    SET p_discount_amount = p_subtotal;
                END IF;
                
                -- Insert discount record
                INSERT INTO booking_discounts (
                    booking_id, discount_config_id, discount_name, 
                    discount_type, discount_value, discount_amount, promo_code
                ) VALUES (
                    p_booking_id, v_discount_config_id, v_discount_name,
                    v_discount_type, v_discount_value, p_discount_amount, p_promo_code
                );
                
                -- Increment usage count
                UPDATE branch_discount_config 
                SET usage_count = usage_count + 1
                WHERE discount_config_id = v_discount_config_id;
            END IF;
        END IF;
    END IF;
END$$

-- ============================================
-- PROCEDURE: Calculate Complete Booking Total
-- ============================================
DROP PROCEDURE IF EXISTS calculate_booking_total$$
CREATE PROCEDURE calculate_booking_total(
    IN p_booking_id INT,
    IN p_branch_id INT,
    IN p_room_rate DECIMAL(10,2),
    IN p_num_nights INT,
    IN p_promo_code VARCHAR(50),
    OUT p_subtotal DECIMAL(10,2),
    OUT p_discount_amount DECIMAL(10,2),
    OUT p_tax_amount DECIMAL(10,2),
    OUT p_total_amount DECIMAL(10,2),
    OUT p_error_message VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_taxable_amount DECIMAL(10,2);
    DECLARE v_service_charges DECIMAL(10,2);
    
    SET p_error_message = NULL;
    
    -- Calculate room charges
    SET p_subtotal = p_room_rate * p_num_nights;
    
    -- Add service charges if any
    SELECT COALESCE(SUM(total_price), 0) INTO v_service_charges
    FROM service_usage
    WHERE booking_id = p_booking_id;
    
    SET p_subtotal = p_subtotal + v_service_charges;
    
    -- Apply discount
    CALL apply_discount_to_booking(
        p_booking_id, p_branch_id, p_subtotal, p_promo_code,
        p_discount_amount, p_error_message
    );
    
    IF p_error_message IS NOT NULL THEN
        LEAVE proc_label;
    END IF;
    
    -- Calculate taxable amount (after discount)
    SET v_taxable_amount = p_subtotal - p_discount_amount;
    
    -- Calculate taxes
    CALL calculate_booking_taxes(
        p_booking_id, p_branch_id, v_taxable_amount, p_tax_amount
    );
    
    -- Calculate total
    SET p_total_amount = v_taxable_amount + p_tax_amount;
END$$

-- ============================================
-- PROCEDURE: Apply Late Checkout Fee
-- ============================================
DROP PROCEDURE IF EXISTS apply_late_checkout_fee$$
CREATE PROCEDURE apply_late_checkout_fee(
    IN p_booking_id INT,
    IN p_actual_checkout_time DATETIME,
    IN p_applied_by INT,
    OUT p_fee_amount DECIMAL(10,2),
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_branch_id INT;
    DECLARE v_check_out_date DATE;
    DECLARE v_fee_config_id INT DEFAULT NULL;
    DECLARE v_fee_calculation VARCHAR(50);
    DECLARE v_fee_value DECIMAL(10,2);
    DECLARE v_grace_period INT;
    DECLARE v_max_fee DECIMAL(10,2);
    DECLARE v_total_amount DECIMAL(10,2);
    DECLARE v_scheduled_checkout DATETIME;
    DECLARE v_minutes_late INT;
    DECLARE v_hours_late DECIMAL(10,2);
    
    SET p_fee_amount = 0;
    SET p_message = NULL;
    
    -- Get booking details
    SELECT branch_id, check_out_date, total_amount
    INTO v_branch_id, v_check_out_date, v_total_amount
    FROM bookings
    WHERE booking_id = p_booking_id;
    
    -- Standard checkout time is 11:00 AM
    SET v_scheduled_checkout = CONCAT(v_check_out_date, ' 11:00:00');
    
    -- Calculate minutes late
    SET v_minutes_late = TIMESTAMPDIFF(MINUTE, v_scheduled_checkout, p_actual_checkout_time);
    
    -- If not late, exit
    IF v_minutes_late <= 0 THEN
        SET p_message = 'Checkout on time, no fee applied';
    ELSE
        -- Get fee configuration
        SELECT fee_config_id, fee_calculation, fee_value, grace_period_minutes, max_fee_amount
        INTO v_fee_config_id, v_fee_calculation, v_fee_value, v_grace_period, v_max_fee
        FROM branch_fee_config
        WHERE branch_id = v_branch_id
        AND fee_type = 'Late Checkout'
        AND is_active = TRUE
        LIMIT 1;
        
        -- If no fee config, exit
        IF v_fee_config_id IS NULL THEN
            SET p_message = 'No late checkout fee configured';
        ELSEIF v_minutes_late <= v_grace_period THEN
            -- Check grace period
            SET p_message = CONCAT('Within grace period of ', v_grace_period, ' minutes');
        ELSE
            -- Calculate fee based on configuration
            IF v_fee_calculation = 'Fixed Amount' THEN
                SET p_fee_amount = v_fee_value;
            ELSEIF v_fee_calculation = 'Percentage of Total' THEN
                SET p_fee_amount = ROUND(v_total_amount * v_fee_value / 100, 2);
            ELSEIF v_fee_calculation = 'Per Hour' THEN
                SET v_hours_late = CEILING((v_minutes_late - v_grace_period) / 60.0);
                SET p_fee_amount = v_fee_value * v_hours_late;
            END IF;
            
            -- Apply maximum fee cap if set
            IF v_max_fee IS NOT NULL AND p_fee_amount > v_max_fee THEN
                SET p_fee_amount = v_max_fee;
            END IF;
            
            -- Insert fee record
            INSERT INTO booking_fees (
                booking_id, fee_config_id, fee_type, fee_amount, 
                fee_reason, calculation_details, applied_by
            ) VALUES (
                p_booking_id, v_fee_config_id, 'Late Checkout', p_fee_amount,
                CONCAT('Late by ', v_minutes_late, ' minutes'),
                JSON_OBJECT(
                    'minutes_late', v_minutes_late,
                    'grace_period', v_grace_period,
                    'calculation_type', v_fee_calculation,
                    'fee_value', v_fee_value
                ),
                p_applied_by
            );
            
            -- Update booking additional fees
            UPDATE bookings
            SET additional_fees = additional_fees + p_fee_amount,
                total_amount = total_amount + p_fee_amount,
                outstanding_amount = outstanding_amount + p_fee_amount
            WHERE booking_id = p_booking_id;
            
            SET p_message = CONCAT('Late checkout fee of ', p_fee_amount, ' applied');
        END IF;
    END IF;
END$$

-- ============================================
-- PROCEDURE: Apply No-Show Fee
-- ============================================
DROP PROCEDURE IF EXISTS apply_no_show_fee$$
CREATE PROCEDURE apply_no_show_fee(
    IN p_booking_id INT,
    IN p_applied_by INT,
    OUT p_fee_amount DECIMAL(10,2),
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_branch_id INT;
    DECLARE v_check_in_date DATE;
    DECLARE v_fee_config_id INT DEFAULT NULL;
    DECLARE v_fee_calculation VARCHAR(50);
    DECLARE v_fee_value DECIMAL(10,2);
    DECLARE v_grace_period INT;
    DECLARE v_max_fee DECIMAL(10,2);
    DECLARE v_total_amount DECIMAL(10,2);
    DECLARE v_booking_status VARCHAR(20);
    DECLARE v_grace_deadline DATETIME;
    
    SET p_fee_amount = 0;
    SET p_message = NULL;
    
    -- Get booking details
    SELECT branch_id, check_in_date, total_amount, booking_status
    INTO v_branch_id, v_check_in_date, v_total_amount, v_booking_status
    FROM bookings
    WHERE booking_id = p_booking_id;
    
    -- Only apply to 'Booked' status (not checked in)
    IF v_booking_status != 'Booked' THEN
        SET p_message = 'Booking status is not eligible for no-show fee';
    ELSE
        -- Get fee configuration
        SELECT fee_config_id, fee_calculation, fee_value, grace_period_minutes, max_fee_amount
        INTO v_fee_config_id, v_fee_calculation, v_fee_value, v_grace_period, v_max_fee
        FROM branch_fee_config
        WHERE branch_id = v_branch_id
        AND fee_type = 'No Show'
        AND is_active = TRUE
        LIMIT 1;
        
        -- If no fee config, exit
        IF v_fee_config_id IS NULL THEN
            SET p_message = 'No no-show fee configured';
        ELSE
            -- Calculate grace deadline (check-in date + grace period)
            SET v_grace_deadline = DATE_ADD(
                CONCAT(v_check_in_date, ' 23:59:59'), 
                INTERVAL v_grace_period MINUTE
            );
            
            -- Check if past grace deadline
            IF NOW() <= v_grace_deadline THEN
                SET p_message = 'Still within grace period';
            ELSE
                -- Calculate fee based on configuration
                IF v_fee_calculation = 'Fixed Amount' THEN
                    SET p_fee_amount = v_fee_value;
                ELSEIF v_fee_calculation = 'Percentage of Total' THEN
                    SET p_fee_amount = ROUND(v_total_amount * v_fee_value / 100, 2);
                END IF;
                
                -- Apply maximum fee cap if set
                IF v_max_fee IS NOT NULL AND p_fee_amount > v_max_fee THEN
                    SET p_fee_amount = v_max_fee;
                END IF;
                
                -- Insert fee record
                INSERT INTO booking_fees (
                    booking_id, fee_config_id, fee_type, fee_amount, 
                    fee_reason, calculation_details, applied_by
                ) VALUES (
                    p_booking_id, v_fee_config_id, 'No Show', p_fee_amount,
                    'Guest did not show up for check-in',
                    JSON_OBJECT(
                        'check_in_date', v_check_in_date,
                        'grace_period_minutes', v_grace_period,
                        'calculation_type', v_fee_calculation,
                        'fee_value', v_fee_value
                    ),
                    p_applied_by
                );
                
                -- Update booking
                UPDATE bookings
                SET additional_fees = additional_fees + p_fee_amount,
                    total_amount = total_amount + p_fee_amount,
                    outstanding_amount = outstanding_amount + p_fee_amount,
                    booking_status = 'Cancelled'
                WHERE booking_id = p_booking_id;
                
                SET p_message = CONCAT('No-show fee of ', p_fee_amount, ' applied and booking cancelled');
            END IF;
        END IF;
    END IF;
END$$

-- ============================================
-- PROCEDURE: Generate Receipt Data
-- ============================================
DROP PROCEDURE IF EXISTS generate_receipt_data$$
CREATE PROCEDURE generate_receipt_data(
    IN p_payment_id INT,
    OUT p_receipt_json JSON
)
BEGIN
    DECLARE v_booking_id INT;
    DECLARE v_payment_amount DECIMAL(10,2);
    DECLARE v_payment_method VARCHAR(50);
    DECLARE v_payment_date DATETIME;
    DECLARE v_transaction_ref VARCHAR(100);
    
    -- Get payment details
    SELECT booking_id, amount, payment_method, payment_date, transaction_reference
    INTO v_booking_id, v_payment_amount, v_payment_method, v_payment_date, v_transaction_ref
    FROM payments
    WHERE payment_id = p_payment_id;
    
    -- Build receipt JSON
    SELECT JSON_OBJECT(
        'receipt_number', CONCAT('RCP-', LPAD(p_payment_id, 8, '0')),
        'payment_id', p_payment_id,
        'payment_date', v_payment_date,
        'payment_method', v_payment_method,
        'payment_amount', v_payment_amount,
        'transaction_reference', v_transaction_ref,
        'booking', JSON_OBJECT(
            'booking_id', b.booking_id,
            'booking_date', b.booking_date,
            'check_in_date', b.check_in_date,
            'check_out_date', b.check_out_date,
            'number_of_nights', DATEDIFF(b.check_out_date, b.check_in_date),
            'number_of_guests', b.number_of_guests,
            'room_number', r.room_number,
            'room_type', rt.type_name
        ),
        'guest', JSON_OBJECT(
            'name', CONCAT(g.first_name, ' ', g.last_name),
            'email', g.email,
            'phone', g.phone,
            'id_type', g.id_type,
            'id_number', g.id_number
        ),
        'branch', JSON_OBJECT(
            'name', hb.branch_name,
            'location', hb.location,
            'address', hb.address,
            'phone', hb.phone,
            'email', hb.email
        ),
        'charges', JSON_OBJECT(
            'subtotal', b.subtotal_amount,
            'discount', b.discount_amount,
            'promo_code', b.promo_code,
            'taxes', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'tax_name', tax_name,
                        'tax_rate', tax_rate,
                        'tax_amount', tax_amount
                    )
                )
                FROM booking_taxes
                WHERE booking_id = v_booking_id
            ),
            'total_tax', b.tax_amount,
            'additional_fees', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'fee_type', fee_type,
                        'fee_amount', fee_amount,
                        'fee_reason', fee_reason
                    )
                )
                FROM booking_fees
                WHERE booking_id = v_booking_id
            ),
            'total_fees', b.additional_fees,
            'total_amount', b.total_amount,
            'paid_amount', b.paid_amount,
            'outstanding_amount', b.outstanding_amount
        )
    ) INTO p_receipt_json
    FROM bookings b
    JOIN guests g ON b.guest_id = g.guest_id
    JOIN rooms r ON b.room_id = r.room_id
    JOIN room_types rt ON r.room_type_id = rt.room_type_id
    JOIN hotel_branches hb ON b.branch_id = hb.branch_id
    WHERE b.booking_id = v_booking_id;
END$$

DELIMITER ;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

SELECT '✅ New stored procedures created successfully!' as Status;
SELECT 'Created 6 procedures for tax, discount, and fee management' as Detail;
