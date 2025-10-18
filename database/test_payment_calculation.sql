-- ============================================
-- TEST PAYMENT CALCULATION
-- Run this to verify all data is correct
-- ============================================

USE skynest_hotels;

-- ============================================
-- TEST 1: Check if views exist
-- ============================================
SELECT 'TEST 1: Checking if compatibility views exist...' as Test;
SHOW FULL TABLES WHERE Table_type = 'VIEW' AND Tables_in_skynest_hotels LIKE '%configurations';

-- ============================================
-- TEST 2: Check tax data
-- ============================================
SELECT 'TEST 2: Checking tax configurations...' as Test;
SELECT * FROM tax_configurations WHERE branch_id = 1;

-- ============================================
-- TEST 3: Check discount data
-- ============================================
SELECT 'TEST 3: Checking discount configurations...' as Test;
SELECT * FROM discount_configurations WHERE branch_id = 1;

-- ============================================
-- TEST 4: Check booking #9 details
-- ============================================
SELECT 'TEST 4: Checking booking #9...' as Test;
SELECT 
    b.booking_id,
    b.branch_id,
    b.total_amount,
    b.paid_amount,
    b.outstanding_amount,
    DATEDIFF(b.check_out_date, b.check_in_date) as nights,
    rt.base_rate
FROM bookings b
JOIN rooms r ON b.room_id = r.room_id
JOIN room_types rt ON r.room_type_id = rt.room_type_id
WHERE b.booking_id = 9;

-- ============================================
-- TEST 5: Check services for booking #9
-- ============================================
SELECT 'TEST 5: Checking services for booking #9...' as Test;
SELECT 
    su.usage_id,
    su.quantity,
    su.total_price,
    sc.service_name,
    sc.unit_price,
    sc.service_category
FROM service_usage su
JOIN service_catalogue sc ON su.service_id = sc.service_id
WHERE su.booking_id = 9;

-- ============================================
-- TEST 6: Manual calculation
-- ============================================
SELECT 'TEST 6: Manual calculation for booking #9...' as Test;

-- Room charge
SELECT 
    DATEDIFF(b.check_out_date, b.check_in_date) * rt.base_rate as room_charge
FROM bookings b
JOIN rooms r ON b.room_id = r.room_id
JOIN room_types rt ON r.room_type_id = rt.room_type_id
WHERE b.booking_id = 9;

-- Services total
SELECT 
    SUM(su.total_price) as services_total
FROM service_usage su
WHERE su.booking_id = 9;

-- Subtotal (room + services)
SELECT 
    (DATEDIFF(b.check_out_date, b.check_in_date) * rt.base_rate) + COALESCE((SELECT SUM(su.total_price) FROM service_usage su WHERE su.booking_id = 9), 0) as subtotal
FROM bookings b
JOIN rooms r ON b.room_id = r.room_id
JOIN room_types rt ON r.room_type_id = rt.room_type_id
WHERE b.booking_id = 9;

-- ============================================
-- TEST 7: Check if payment_breakdowns table exists
-- ============================================
SELECT 'TEST 7: Checking payment_breakdowns table...' as Test;
SHOW TABLES LIKE 'payment_breakdowns';

-- ============================================
-- RESULTS SUMMARY
-- ============================================
SELECT '============================================' as '';
SELECT 'TEST RESULTS SUMMARY' as '';
SELECT '============================================' as '';
SELECT 'If all tests show data, the database is configured correctly.' as Info;
SELECT 'If views are missing, run: fix_table_name_mismatch.sql' as Action1;
SELECT 'If services are missing, check service_usage table' as Action2;
SELECT 'If taxes show 0, check branch_tax_config table' as Action3;
