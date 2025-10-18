-- ============================================
-- ADD MISSING service_requests_view
-- Run this if you already set up the database
-- and don't want to re-run the complete setup
-- ============================================

USE skynest_hotels;

-- Create the service_requests_view that the backend API needs
DROP VIEW IF EXISTS service_requests_view;
CREATE VIEW service_requests_view AS
SELECT 
    sr.request_id,
    sr.booking_id,
    sr.guest_id,
    CONCAT(g.first_name, ' ', g.last_name) as guest_name,
    g.email as guest_email,
    g.phone as guest_phone,
    sr.service_id,
    sc.service_name,
    sc.service_category,
    sc.unit_price as base_price,
    COALESCE(bs.custom_price, sc.unit_price) as unit_price,
    sr.quantity,
    (COALESCE(bs.custom_price, sc.unit_price) * sr.quantity) as total_amount,
    sr.branch_id,
    hb.branch_name,
    sr.request_status,
    sr.request_notes,
    sr.reviewed_by,
    u.full_name as reviewed_by_name,
    sr.reviewed_at,
    sr.review_notes,
    sr.requested_at,
    r.room_number,
    b.check_in_date,
    b.check_out_date
FROM service_requests sr
JOIN guests g ON sr.guest_id = g.guest_id
JOIN service_catalogue sc ON sr.service_id = sc.service_id
JOIN hotel_branches hb ON sr.branch_id = hb.branch_id
JOIN bookings b ON sr.booking_id = b.booking_id
JOIN rooms r ON b.room_id = r.room_id
LEFT JOIN branch_services bs ON sr.service_id = bs.service_id AND sr.branch_id = bs.branch_id
LEFT JOIN users u ON sr.reviewed_by = u.user_id;

SELECT 'service_requests_view created successfully!' as Status;
