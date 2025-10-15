-- ============================================
-- SKYNEST HOTELS - DATABASE EFFICIENCY IMPROVEMENTS
-- ============================================
-- This file adds ONLY performance optimizations
-- WITHOUT changing any existing functionality
-- 
-- Includes:
-- 1. Additional indexes for query optimization
-- 2. Performance-focused views
-- 3. Query optimization hints
-- 
-- DOES NOT INCLUDE:
-- - Triggers (already in triggers.sql)
-- - Procedures (already in procedures.sql and guest_features.sql)
-- - Table modifications (schema is stable)
-- ============================================

USE skynest_hotels;

-- ============================================
-- SECTION 1: ADDITIONAL PERFORMANCE INDEXES
-- ============================================
-- These indexes complement existing ones in schema.sql
-- and improve query performance for common operations

-- Note: Using CREATE INDEX IF NOT EXISTS for MySQL 5.7+ compatibility
-- If index already exists, it will be skipped without error

-- Bookings: Composite index for date range queries
CREATE INDEX IF NOT EXISTS idx_booking_date_range ON bookings(check_in_date, check_out_date, booking_status);

-- Bookings: Guest booking history queries
CREATE INDEX IF NOT EXISTS idx_booking_guest_date ON bookings(guest_id, booking_date);

-- Guests: Full name search optimization
CREATE INDEX IF NOT EXISTS idx_guest_fullname ON guests(first_name, last_name);

-- Service Requests: Status and date filtering
CREATE INDEX IF NOT EXISTS idx_service_request_status_date ON service_requests(request_status, requested_at);

-- Service Requests: Branch filtering for receptionists
CREATE INDEX IF NOT EXISTS idx_service_request_branch_status ON service_requests(branch_id, request_status);

-- Support Tickets: Priority and status filtering
CREATE INDEX IF NOT EXISTS idx_support_priority_status ON support_tickets(priority, status);

-- Support Tickets: Branch-based filtering (via booking)
CREATE INDEX IF NOT EXISTS idx_support_booking ON support_tickets(booking_id, status);

-- Service Usage: Date-based billing reports
CREATE INDEX IF NOT EXISTS idx_service_usage_date ON service_usage(usage_date, booking_id);

-- Payments: Date range financial reports
CREATE INDEX IF NOT EXISTS idx_payment_date_range ON payments(payment_date, payment_status);

-- Ticket Responses: Chronological retrieval
CREATE INDEX IF NOT EXISTS idx_ticket_response_date ON ticket_responses(ticket_id, created_at);

-- Rooms: Multi-column search optimization
CREATE INDEX IF NOT EXISTS idx_room_search ON rooms(branch_id, status, room_type_id);

-- Users: Role-based queries
CREATE INDEX IF NOT EXISTS idx_user_role_branch ON users(role, branch_id, is_active);

-- ============================================
-- SECTION 2: PERFORMANCE-OPTIMIZED VIEWS
-- ============================================

-- View 1: Current Room Availability Summary
DROP VIEW IF EXISTS v_room_availability_summary;
CREATE VIEW v_room_availability_summary AS
SELECT 
    hb.branch_id,
    hb.branch_name,
    rt.room_type_id,
    rt.type_name,
    rt.base_rate,
    COUNT(r.room_id) as total_rooms,
    SUM(CASE WHEN r.status = 'Available' THEN 1 ELSE 0 END) as available_rooms,
    SUM(CASE WHEN r.status = 'Occupied' THEN 1 ELSE 0 END) as occupied_rooms,
    SUM(CASE WHEN r.status = 'Reserved' THEN 1 ELSE 0 END) as reserved_rooms,
    SUM(CASE WHEN r.status = 'Maintenance' THEN 1 ELSE 0 END) as maintenance_rooms
FROM hotel_branches hb
CROSS JOIN room_types rt
LEFT JOIN rooms r ON hb.branch_id = r.branch_id AND rt.room_type_id = r.room_type_id
GROUP BY hb.branch_id, hb.branch_name, rt.room_type_id, rt.type_name, rt.base_rate;

-- View 2: Today's Check-ins and Check-outs
DROP VIEW IF EXISTS v_todays_checkins_checkouts;
CREATE VIEW v_todays_checkins_checkouts AS
SELECT 
    'Check-In' as activity_type,
    b.booking_id,
    b.guest_id,
    CONCAT(g.first_name, ' ', g.last_name) as guest_name,
    g.phone,
    r.room_number,
    rt.type_name as room_type,
    hb.branch_name,
    b.check_in_date as activity_date,
    b.booking_status
FROM bookings b
JOIN guests g ON b.guest_id = g.guest_id
JOIN rooms r ON b.room_id = r.room_id
JOIN room_types rt ON r.room_type_id = rt.room_type_id
JOIN hotel_branches hb ON b.branch_id = hb.branch_id
WHERE b.check_in_date = CURDATE()
AND b.booking_status = 'Booked'

UNION ALL

SELECT 
    'Check-Out' as activity_type,
    b.booking_id,
    b.guest_id,
    CONCAT(g.first_name, ' ', g.last_name) as guest_name,
    g.phone,
    r.room_number,
    rt.type_name as room_type,
    hb.branch_name,
    b.check_out_date as activity_date,
    b.booking_status
FROM bookings b
JOIN guests g ON b.guest_id = g.guest_id
JOIN rooms r ON b.room_id = r.room_id
JOIN room_types rt ON r.room_type_id = rt.room_type_id
JOIN hotel_branches hb ON b.branch_id = hb.branch_id
WHERE b.check_out_date = CURDATE()
AND b.booking_status = 'Checked-In'
ORDER BY activity_date, activity_type;

-- View 3: Pending Service Requests Summary
DROP VIEW IF EXISTS v_pending_service_requests;
CREATE VIEW v_pending_service_requests AS
SELECT 
    sr.request_id,
    sr.branch_id,
    hb.branch_name,
    sr.booking_id,
    CONCAT(g.first_name, ' ', g.last_name) as guest_name,
    r.room_number,
    sc.service_name,
    sc.service_category,
    sr.quantity,
    COALESCE(bs.custom_price, sc.unit_price) as unit_price,
    (COALESCE(bs.custom_price, sc.unit_price) * sr.quantity) as total_amount,
    sr.requested_at,
    TIMESTAMPDIFF(HOUR, sr.requested_at, NOW()) as hours_pending
FROM service_requests sr
JOIN guests g ON sr.guest_id = g.guest_id
JOIN bookings b ON sr.booking_id = b.booking_id
JOIN rooms r ON b.room_id = r.room_id
JOIN service_catalogue sc ON sr.service_id = sc.service_id
JOIN hotel_branches hb ON sr.branch_id = hb.branch_id
LEFT JOIN branch_services bs ON sr.service_id = bs.service_id AND sr.branch_id = bs.branch_id
WHERE sr.request_status = 'Pending'
ORDER BY sr.requested_at ASC;

-- View 4: Open Support Tickets Summary
DROP VIEW IF EXISTS v_open_support_tickets;
CREATE VIEW v_open_support_tickets AS
SELECT 
    st.ticket_id,
    st.guest_id,
    CONCAT(g.first_name, ' ', g.last_name) as guest_name,
    g.email,
    g.phone,
    st.booking_id,
    CASE 
        WHEN st.booking_id IS NOT NULL THEN hb.branch_name
        ELSE 'No Booking'
    END as branch_name,
    st.subject,
    st.priority,
    st.status,
    st.created_at,
    TIMESTAMPDIFF(HOUR, st.created_at, NOW()) as hours_open,
    (SELECT COUNT(*) FROM ticket_responses WHERE ticket_id = st.ticket_id) as response_count
FROM support_tickets st
JOIN guests g ON st.guest_id = g.guest_id
LEFT JOIN bookings b ON st.booking_id = b.booking_id
LEFT JOIN hotel_branches hb ON b.branch_id = hb.branch_id
WHERE st.status IN ('Open', 'In Progress')
ORDER BY 
    CASE st.priority
        WHEN 'Urgent' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Medium' THEN 3
        WHEN 'Low' THEN 4
    END,
    st.created_at ASC;

-- View 5: Revenue Summary by Branch
DROP VIEW IF EXISTS v_revenue_by_branch;
CREATE VIEW v_revenue_by_branch AS
SELECT 
    hb.branch_id,
    hb.branch_name,
    COUNT(DISTINCT b.booking_id) as total_bookings,
    SUM(b.total_amount) as total_revenue,
    SUM(b.paid_amount) as collected_revenue,
    SUM(b.outstanding_amount) as outstanding_revenue,
    SUM(CASE WHEN b.booking_status = 'Checked-In' THEN b.total_amount ELSE 0 END) as active_booking_revenue,
    SUM(CASE WHEN b.booking_status = 'Checked-Out' THEN b.total_amount ELSE 0 END) as completed_booking_revenue
FROM hotel_branches hb
LEFT JOIN bookings b ON hb.branch_id = b.branch_id
WHERE b.booking_status IN ('Booked', 'Checked-In', 'Checked-Out')
GROUP BY hb.branch_id, hb.branch_name;

-- View 6: Guest Booking History with Stats
DROP VIEW IF EXISTS v_guest_booking_history;
CREATE VIEW v_guest_booking_history AS
SELECT 
    g.guest_id,
    CONCAT(g.first_name, ' ', g.last_name) as guest_name,
    g.email,
    g.phone,
    COUNT(b.booking_id) as total_bookings,
    SUM(CASE WHEN b.booking_status = 'Checked-Out' THEN 1 ELSE 0 END) as completed_bookings,
    SUM(CASE WHEN b.booking_status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
    SUM(b.total_amount) as lifetime_value,
    SUM(b.paid_amount) as total_paid,
    MAX(b.booking_date) as last_booking_date,
    MAX(CASE WHEN b.booking_status = 'Checked-Out' THEN b.actual_check_out END) as last_checkout_date
FROM guests g
LEFT JOIN bookings b ON g.guest_id = b.guest_id
GROUP BY g.guest_id, g.first_name, g.last_name, g.email, g.phone;

-- ============================================
-- SECTION 3: QUERY OPTIMIZATION HINTS
-- ============================================

-- Analyze tables to update statistics for query optimizer
ANALYZE TABLE hotel_branches;
ANALYZE TABLE room_types;
ANALYZE TABLE rooms;
ANALYZE TABLE users;
ANALYZE TABLE guests;
ANALYZE TABLE bookings;
ANALYZE TABLE service_catalogue;
ANALYZE TABLE service_usage;
ANALYZE TABLE payments;
ANALYZE TABLE service_requests;
ANALYZE TABLE support_tickets;
ANALYZE TABLE ticket_responses;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

SELECT '✅ Database efficiency improvements applied successfully!' as Status;
SELECT 'Added 12 performance indexes' as Detail1;
SELECT 'Created 6 optimized views' as Detail2;
SELECT 'Analyzed all tables for query optimization' as Detail3;
SELECT 'No existing functionality changed' as Detail4;
