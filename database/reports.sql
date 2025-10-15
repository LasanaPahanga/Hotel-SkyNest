-- SkyNest Hotels - Report Views and Queries
-- Pre-defined views and queries for management reports

USE skynest_hotels;

-- ============================================
-- VIEW: room_occupancy_view
-- Shows current room occupancy status
-- ============================================
CREATE OR REPLACE VIEW room_occupancy_view AS
SELECT 
    b.branch_name,
    b.location,
    r.room_number,
    rt.type_name AS room_type,
    r.status AS current_status,
    bk.booking_id,
    CONCAT(g.first_name, ' ', g.last_name) AS guest_name,
    bk.check_in_date,
    bk.check_out_date,
    bk.booking_status
FROM rooms r
JOIN hotel_branches b ON r.branch_id = b.branch_id
JOIN room_types rt ON r.room_type_id = rt.room_type_id
LEFT JOIN bookings bk ON r.room_id = bk.room_id 
    AND bk.booking_status IN ('Booked', 'Checked-In')
    AND CURDATE() BETWEEN bk.check_in_date AND bk.check_out_date
LEFT JOIN guests g ON bk.guest_id = g.guest_id
ORDER BY b.branch_name, r.room_number;

-- ============================================
-- VIEW: guest_billing_summary
-- Shows billing summary for all active bookings
-- ============================================
CREATE OR REPLACE VIEW guest_billing_summary AS
SELECT 
    bk.booking_id,
    bk.booking_status,
    CONCAT(g.first_name, ' ', g.last_name) AS guest_name,
    g.email,
    g.phone,
    b.branch_name,
    r.room_number,
    rt.type_name AS room_type,
    bk.check_in_date,
    bk.check_out_date,
    DATEDIFF(bk.check_out_date, bk.check_in_date) AS nights,
    rt.base_rate AS room_rate_per_night,
    calculate_room_charges(bk.room_id, bk.check_in_date, bk.check_out_date) AS room_charges,
    COALESCE(calculate_service_charges(bk.booking_id), 0) AS service_charges,
    bk.total_amount,
    bk.paid_amount,
    bk.outstanding_amount,
    CASE 
        WHEN bk.outstanding_amount > 0 THEN 'UNPAID'
        ELSE 'PAID'
    END AS payment_status
FROM bookings bk
JOIN guests g ON bk.guest_id = g.guest_id
JOIN rooms r ON bk.room_id = r.room_id
JOIN room_types rt ON r.room_type_id = rt.room_type_id
JOIN hotel_branches b ON bk.branch_id = b.branch_id
WHERE bk.booking_status IN ('Booked', 'Checked-In', 'Checked-Out')
ORDER BY bk.booking_date DESC;

-- ============================================
-- VIEW: service_usage_breakdown
-- Shows detailed service usage by booking
-- ============================================
CREATE OR REPLACE VIEW service_usage_breakdown AS
SELECT 
    b.branch_name,
    r.room_number,
    CONCAT(g.first_name, ' ', g.last_name) AS guest_name,
    bk.booking_id,
    bk.check_in_date,
    bk.check_out_date,
    sc.service_name,
    sc.service_category,
    su.usage_date,
    su.quantity,
    su.unit_price,
    su.total_price,
    su.notes
FROM service_usage su
JOIN bookings bk ON su.booking_id = bk.booking_id
JOIN service_catalogue sc ON su.service_id = sc.service_id
JOIN guests g ON bk.guest_id = g.guest_id
JOIN rooms r ON bk.room_id = r.room_id
JOIN hotel_branches b ON bk.branch_id = b.branch_id
ORDER BY su.usage_date DESC;

-- ============================================
-- VIEW: monthly_revenue_by_branch
-- Shows revenue breakdown by branch and month
-- ============================================
CREATE OR REPLACE VIEW monthly_revenue_by_branch AS
SELECT 
    b.branch_id,
    b.branch_name,
    b.location,
    YEAR(bk.booking_date) AS `year`,
    MONTH(bk.booking_date) AS `month`,
    DATE_FORMAT(MIN(bk.booking_date), '%Y-%m') AS `year_month`,
    COUNT(DISTINCT bk.booking_id) AS total_bookings,
    SUM(calculate_room_charges(bk.room_id, bk.check_in_date, bk.check_out_date)) AS room_revenue,
    SUM(COALESCE(calculate_service_charges(bk.booking_id), 0)) AS service_revenue,
    SUM(bk.total_amount) AS total_revenue,
    SUM(bk.paid_amount) AS collected_revenue,
    SUM(bk.outstanding_amount) AS pending_revenue
FROM bookings bk
JOIN hotel_branches b ON bk.branch_id = b.branch_id
WHERE bk.booking_status != 'Cancelled'
GROUP BY b.branch_id, b.branch_name, b.location, YEAR(bk.booking_date), MONTH(bk.booking_date)
ORDER BY `year` DESC, `month` DESC, b.branch_name;

-- ============================================
-- VIEW: top_services_report
-- Shows most used services and revenue
-- ============================================
CREATE OR REPLACE VIEW top_services_report AS
SELECT 
    sc.service_name,
    sc.service_category,
    COUNT(su.usage_id) AS usage_count,
    SUM(su.quantity) AS total_quantity,
    SUM(su.total_price) AS total_revenue,
    AVG(su.total_price) AS avg_revenue_per_use,
    sc.unit_price AS current_price
FROM service_usage su
JOIN service_catalogue sc ON su.service_id = sc.service_id
GROUP BY sc.service_id
ORDER BY total_revenue DESC;

-- ============================================
-- STORED PROCEDURE: get_room_occupancy_report
-- Generates room occupancy report for a date range
-- ============================================
DELIMITER $$

DROP PROCEDURE IF EXISTS get_room_occupancy_report$$
CREATE PROCEDURE get_room_occupancy_report(
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_branch_id INT
)
BEGIN
    SELECT 
        b.branch_name,
        r.room_number,
        rt.type_name AS room_type,
        DATE(dates.date) AS occupancy_date,
        CASE 
            WHEN bk.booking_id IS NOT NULL THEN 'Occupied'
            ELSE 'Available'
        END AS status,
        CONCAT(COALESCE(g.first_name, ''), ' ', COALESCE(g.last_name, '')) AS guest_name,
        bk.booking_id
    FROM 
        (SELECT DATE(p_start_date) + INTERVAL (a.a + (10 * b.a)) DAY AS date
         FROM 
            (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 
             UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 
             UNION ALL SELECT 8 UNION ALL SELECT 9) AS a
         CROSS JOIN 
            (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 
             UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 
             UNION ALL SELECT 8 UNION ALL SELECT 9) AS b
         WHERE DATE(p_start_date) + INTERVAL (a.a + (10 * b.a)) DAY <= p_end_date
        ) AS dates
    CROSS JOIN rooms r
    JOIN hotel_branches b ON r.branch_id = b.branch_id
    JOIN room_types rt ON r.room_type_id = rt.room_type_id
    LEFT JOIN bookings bk ON r.room_id = bk.room_id
        AND dates.date BETWEEN bk.check_in_date AND DATE_SUB(bk.check_out_date, INTERVAL 1 DAY)
        AND bk.booking_status IN ('Booked', 'Checked-In', 'Checked-Out')
    LEFT JOIN guests g ON bk.guest_id = g.guest_id
    WHERE (p_branch_id IS NULL OR r.branch_id = p_branch_id)
    ORDER BY b.branch_name, r.room_number, dates.date;
END$$

-- ============================================
-- STORED PROCEDURE: get_unpaid_bookings_report
-- Gets all bookings with outstanding balances
-- ============================================
DROP PROCEDURE IF EXISTS get_unpaid_bookings_report$$
CREATE PROCEDURE get_unpaid_bookings_report()
BEGIN
    SELECT 
        bk.booking_id,
        b.branch_name,
        CONCAT(g.first_name, ' ', g.last_name) AS guest_name,
        g.email,
        g.phone,
        r.room_number,
        bk.check_in_date,
        bk.check_out_date,
        bk.booking_status,
        bk.total_amount,
        bk.paid_amount,
        bk.outstanding_amount,
        DATEDIFF(CURDATE(), bk.check_out_date) AS days_overdue
    FROM bookings bk
    JOIN guests g ON bk.guest_id = g.guest_id
    JOIN rooms r ON bk.room_id = r.room_id
    JOIN hotel_branches b ON bk.branch_id = b.branch_id
    WHERE bk.outstanding_amount > 0
    AND bk.booking_status IN ('Booked', 'Checked-In', 'Checked-Out')
    ORDER BY bk.outstanding_amount DESC;
END$$

-- ============================================
-- STORED PROCEDURE: get_revenue_report
-- Generates comprehensive revenue report
-- ============================================
DROP PROCEDURE IF EXISTS get_revenue_report$$
CREATE PROCEDURE get_revenue_report(
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_branch_id INT
)
BEGIN
    SELECT 
        b.branch_name,
        COUNT(DISTINCT bk.booking_id) AS total_bookings,
        COUNT(DISTINCT CASE WHEN bk.booking_status = 'Checked-Out' THEN bk.booking_id END) AS completed_bookings,
        COUNT(DISTINCT CASE WHEN bk.booking_status = 'Cancelled' THEN bk.booking_id END) AS cancelled_bookings,
        SUM(DATEDIFF(bk.check_out_date, bk.check_in_date)) AS total_room_nights,
        SUM(calculate_room_charges(bk.room_id, bk.check_in_date, bk.check_out_date)) AS room_revenue,
        SUM(COALESCE(calculate_service_charges(bk.booking_id), 0)) AS service_revenue,
        SUM(bk.total_amount) AS total_revenue,
        SUM(bk.paid_amount) AS collected_revenue,
        SUM(bk.outstanding_amount) AS outstanding_revenue,
        AVG(bk.total_amount) AS avg_booking_value
    FROM bookings bk
    JOIN hotel_branches b ON bk.branch_id = b.branch_id
    WHERE bk.booking_date BETWEEN p_start_date AND p_end_date
    AND (p_branch_id IS NULL OR bk.branch_id = p_branch_id)
    AND bk.booking_status != 'Cancelled'
    GROUP BY b.branch_id
    ORDER BY total_revenue DESC;
END$$

-- ============================================
-- STORED PROCEDURE: get_service_trends_report
-- Analyzes service usage trends
-- ============================================
DROP PROCEDURE IF EXISTS get_service_trends_report$$
CREATE PROCEDURE get_service_trends_report(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        sc.service_category,
        sc.service_name,
        COUNT(su.usage_id) AS usage_count,
        SUM(su.quantity) AS total_quantity,
        SUM(su.total_price) AS total_revenue,
        AVG(su.total_price) AS avg_revenue_per_use,
        MIN(su.usage_date) AS first_used,
        MAX(su.usage_date) AS last_used,
        COUNT(DISTINCT su.booking_id) AS unique_bookings
    FROM service_usage su
    JOIN service_catalogue sc ON su.service_id = sc.service_id
    WHERE su.usage_date BETWEEN p_start_date AND p_end_date
    GROUP BY sc.service_id
    ORDER BY total_revenue DESC, usage_count DESC;
END$$

-- ============================================
-- STORED PROCEDURE: get_guest_history
-- Gets complete history for a guest
-- ============================================
DROP PROCEDURE IF EXISTS get_guest_history$$
CREATE PROCEDURE get_guest_history(IN p_guest_id INT)
BEGIN
    SELECT 
        bk.booking_id,
        b.branch_name,
        r.room_number,
        rt.type_name AS room_type,
        bk.check_in_date,
        bk.check_out_date,
        bk.booking_status,
        bk.total_amount,
        bk.paid_amount,
        bk.outstanding_amount,
        COUNT(DISTINCT su.usage_id) AS services_used,
        SUM(COALESCE(su.total_price, 0)) AS service_charges
    FROM bookings bk
    JOIN hotel_branches b ON bk.branch_id = b.branch_id
    JOIN rooms r ON bk.room_id = r.room_id
    JOIN room_types rt ON r.room_type_id = rt.room_type_id
    LEFT JOIN service_usage su ON bk.booking_id = su.booking_id
    WHERE bk.guest_id = p_guest_id
    GROUP BY bk.booking_id
    ORDER BY bk.booking_date DESC;
END$$

DELIMITER ;

-- ============================================
-- Create indexes for report performance
-- ============================================
CREATE INDEX idx_bookings_date_range ON bookings(booking_date, check_in_date, check_out_date);
CREATE INDEX idx_service_usage_date ON service_usage(usage_date);
CREATE INDEX idx_payments_date ON payments(payment_date);
