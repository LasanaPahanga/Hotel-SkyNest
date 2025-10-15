-- SkyNest Hotels - Seed Data
-- Initial data population for testing

USE skynest_hotels;

-- ============================================
-- Insert Hotel Branches
-- ============================================
INSERT INTO hotel_branches (branch_name, location, address, phone, email) VALUES
('SkyNest Colombo', 'Colombo', '123 Galle Road, Colombo 03, Sri Lanka', '+94112345678', 'colombo@skynest.lk'),
('SkyNest Kandy', 'Kandy', '456 Peradeniya Road, Kandy, Sri Lanka', '+94812345678', 'kandy@skynest.lk'),
('SkyNest Galle', 'Galle', '789 Lighthouse Street, Galle Fort, Sri Lanka', '+94912345678', 'galle@skynest.lk');

-- ============================================
-- Insert Room Types
-- ============================================
INSERT INTO room_types (type_name, capacity, base_rate, amenities, description) VALUES
('Single', 1, 8000.00, 'Single bed, AC, TV, WiFi, Mini fridge', 'Comfortable single room perfect for solo travelers'),
('Double', 2, 12000.00, 'Double bed, AC, TV, WiFi, Mini fridge, Work desk', 'Spacious double room with modern amenities'),
('Deluxe Double', 2, 15000.00, 'King bed, AC, Smart TV, WiFi, Mini bar, Balcony, Work desk', 'Premium double room with city/ocean views'),
('Suite', 4, 25000.00, 'King bed, Living area, AC, Smart TV, WiFi, Mini bar, Balcony, Jacuzzi', 'Luxurious suite with separate living area'),
('Family Room', 4, 20000.00, 'Two double beds, AC, TV, WiFi, Mini fridge, Extra space', 'Perfect for families with children');

-- ============================================
-- Insert Rooms (10+ rooms across branches)
-- ============================================
-- Colombo Branch Rooms
INSERT INTO rooms (branch_id, room_type_id, room_number, floor_number, status) VALUES
(1, 1, '101', 1, 'Available'),
(1, 2, '102', 1, 'Available'),
(1, 3, '201', 2, 'Available'),
(1, 4, '301', 3, 'Available'),
(1, 5, '302', 3, 'Available');

-- Kandy Branch Rooms
INSERT INTO rooms (branch_id, room_type_id, room_number, floor_number, status) VALUES
(2, 1, '101', 1, 'Available'),
(2, 2, '102', 1, 'Available'),
(2, 3, '201', 2, 'Available'),
(2, 4, '301', 3, 'Available');

-- Galle Branch Rooms
INSERT INTO rooms (branch_id, room_type_id, room_number, floor_number, status) VALUES
(3, 2, '101', 1, 'Available'),
(3, 3, '102', 1, 'Available'),
(3, 4, '201', 2, 'Available'),
(3, 5, '202', 2, 'Available');

-- ============================================
-- Insert Service Catalogue (6+ services)
-- ============================================
INSERT INTO service_catalogue (service_name, service_category, description, unit_price, unit_type, is_active) VALUES
('Room Service - Breakfast', 'Room Service', 'Continental breakfast delivered to room', 1500.00, 'order', TRUE),
('Room Service - Lunch', 'Room Service', 'Lunch menu delivered to room', 2000.00, 'order', TRUE),
('Room Service - Dinner', 'Room Service', 'Dinner menu delivered to room', 2500.00, 'order', TRUE),
('Spa - Full Body Massage', 'Spa', '60-minute relaxing full body massage', 5000.00, 'session', TRUE),
('Laundry Service', 'Laundry', 'Wash and iron service', 500.00, 'item', TRUE),
('Minibar - Soft Drink', 'Minibar', 'Assorted soft drinks', 200.00, 'item', TRUE),
('Minibar - Snacks', 'Minibar', 'Chips, chocolates, and snacks', 300.00, 'item', TRUE),
('Airport Transfer', 'Transportation', 'One-way airport pickup/drop', 3000.00, 'trip', TRUE);

-- ============================================
-- Insert Users (Admin, Receptionists, Guests)
-- ============================================
-- Password: 'password123' hashed with bcrypt (you'll need to hash properly in production)
-- For demo purposes, using a simple hash representation
INSERT INTO users (username, password_hash, email, full_name, role, branch_id, phone, is_active) VALUES
('admin', '$2a$10$rqQQQQQQQQQQQQQQQQQQQeJ7vXxXxXxXxXxXxXxXxXxXxXxXxX', 'admin@skynest.lk', 'System Administrator', 'Admin', NULL, '+94771234567', TRUE),
('receptionist_colombo', '$2a$10$rqQQQQQQQQQQQQQQQQQQQeJ7vXxXxXxXxXxXxXxXxXxXxXxXxX', 'rec.colombo@skynest.lk', 'Nimal Perera', 'Receptionist', 1, '+94771234568', TRUE),
('receptionist_kandy', '$2a$10$rqQQQQQQQQQQQQQQQQQQQeJ7vXxXxXxXxXxXxXxXxXxXxXxXxX', 'rec.kandy@skynest.lk', 'Kamala Silva', 'Receptionist', 2, '+94771234569', TRUE),
('receptionist_galle', '$2a$10$rqQQQQQQQQQQQQQQQQQQQeJ7vXxXxXxXxXxXxXxXxXxXxXxXxX', 'rec.galle@skynest.lk', 'Sunil Fernando', 'Receptionist', 3, '+94771234570', TRUE);

-- ============================================
-- Insert Guests (5 guests)
-- ============================================
INSERT INTO guests (first_name, last_name, email, phone, id_type, id_number, address, country, date_of_birth) VALUES
('John', 'Smith', 'john.smith@email.com', '+94771111111', 'Passport', 'P1234567', '123 Main St, London', 'United Kingdom', '1985-05-15'),
('Sarah', 'Johnson', 'sarah.j@email.com', '+94772222222', 'Passport', 'P7654321', '456 Oak Ave, New York', 'United States', '1990-08-22'),
('Rajesh', 'Kumar', 'rajesh.k@email.com', '+94773333333', 'NIC', '198512345678', '789 Temple Road, Mumbai', 'India', '1985-03-10'),
('Emma', 'Wilson', 'emma.w@email.com', '+94774444444', 'Passport', 'P9876543', '321 Beach Rd, Sydney', 'Australia', '1988-11-30'),
('Michael', 'Brown', 'michael.b@email.com', '+94775555555', 'Driving License', 'DL123456', '654 Park Lane, Toronto', 'Canada', '1992-07-18');

-- ============================================
-- Insert Bookings (8 bookings with various statuses)
-- ============================================
-- Booking 1: Checked-Out (Colombo - Single Room)
INSERT INTO bookings (guest_id, room_id, branch_id, check_in_date, check_out_date, actual_check_in, actual_check_out, 
                      number_of_guests, booking_status, payment_method, total_amount, paid_amount, outstanding_amount, created_by)
VALUES (1, 1, 1, '2024-10-01', '2024-10-03', '2024-10-01 14:00:00', '2024-10-03 11:00:00', 
        1, 'Checked-Out', 'Credit Card', 16000.00, 16000.00, 0.00, 2);

-- Booking 2: Checked-Out (Kandy - Deluxe Double)
INSERT INTO bookings (guest_id, room_id, branch_id, check_in_date, check_out_date, actual_check_in, actual_check_out,
                      number_of_guests, booking_status, payment_method, total_amount, paid_amount, outstanding_amount, created_by)
VALUES (2, 8, 2, '2024-10-05', '2024-10-08', '2024-10-05 15:00:00', '2024-10-08 10:00:00',
        2, 'Checked-Out', 'Cash', 45000.00, 45000.00, 0.00, 3);

-- Booking 3: Checked-In (Galle - Suite) - Has outstanding balance
INSERT INTO bookings (guest_id, room_id, branch_id, check_in_date, check_out_date, actual_check_in,
                      number_of_guests, booking_status, payment_method, total_amount, paid_amount, outstanding_amount, created_by)
VALUES (3, 12, 3, '2024-10-12', '2024-10-16', '2024-10-12 14:30:00',
        2, 'Checked-In', 'Credit Card', 100000.00, 50000.00, 50000.00, 4);

-- Booking 4: Checked-In (Colombo - Family Room)
INSERT INTO bookings (guest_id, room_id, branch_id, check_in_date, check_out_date, actual_check_in,
                      number_of_guests, booking_status, payment_method, total_amount, paid_amount, outstanding_amount, created_by)
VALUES (4, 5, 1, '2024-10-13', '2024-10-15', '2024-10-13 16:00:00',
        4, 'Checked-In', 'Debit Card', 40000.00, 40000.00, 0.00, 2);

-- Booking 5: Booked (Future - Colombo Double)
INSERT INTO bookings (guest_id, room_id, branch_id, check_in_date, check_out_date,
                      number_of_guests, booking_status, payment_method, total_amount, paid_amount, outstanding_amount, created_by)
VALUES (5, 2, 1, '2024-10-20', '2024-10-23',
        2, 'Booked', 'Online Transfer', 36000.00, 0.00, 36000.00, 2);

-- Booking 6: Booked (Future - Kandy Suite)
INSERT INTO bookings (guest_id, room_id, branch_id, check_in_date, check_out_date,
                      number_of_guests, booking_status, payment_method, total_amount, paid_amount, outstanding_amount, created_by)
VALUES (1, 9, 2, '2024-10-25', '2024-10-28',
        2, 'Booked', 'Credit Card', 75000.00, 25000.00, 50000.00, 3);

-- Booking 7: Cancelled
INSERT INTO bookings (guest_id, room_id, branch_id, check_in_date, check_out_date,
                      number_of_guests, booking_status, payment_method, total_amount, paid_amount, outstanding_amount, created_by)
VALUES (2, 10, 3, '2024-10-15', '2024-10-17',
        2, 'Cancelled', 'Cash', 24000.00, 0.00, 0.00, 4);

-- Booking 8: Checked-In (Galle - Deluxe Double) - Partial payment
INSERT INTO bookings (guest_id, room_id, branch_id, check_in_date, check_out_date, actual_check_in,
                      number_of_guests, booking_status, payment_method, total_amount, paid_amount, outstanding_amount, created_by)
VALUES (5, 11, 3, '2024-10-14', '2024-10-17', '2024-10-14 15:30:00',
        2, 'Checked-In', 'Credit Card', 45000.00, 30000.00, 15000.00, 4);

-- ============================================
-- Insert Service Usage (for checked-in/out bookings)
-- ============================================
-- Services for Booking 1 (Checked-Out)
INSERT INTO service_usage (booking_id, service_id, usage_date, quantity, unit_price, total_price, notes)
VALUES 
(1, 1, '2024-10-02 08:00:00', 2, 1500.00, 3000.00, 'Breakfast for 2 days'),
(1, 6, '2024-10-02 20:00:00', 2, 200.00, 400.00, 'Soft drinks');

-- Services for Booking 2 (Checked-Out)
INSERT INTO service_usage (booking_id, service_id, usage_date, quantity, unit_price, total_price, notes)
VALUES 
(2, 1, '2024-10-06 08:30:00', 3, 1500.00, 4500.00, 'Breakfast for 3 days'),
(2, 4, '2024-10-06 16:00:00', 1, 5000.00, 5000.00, 'Spa massage'),
(2, 5, '2024-10-07 10:00:00', 5, 500.00, 2500.00, 'Laundry items');

-- Services for Booking 3 (Checked-In - Current)
INSERT INTO service_usage (booking_id, service_id, usage_date, quantity, unit_price, total_price, notes)
VALUES 
(3, 1, '2024-10-13 08:00:00', 1, 1500.00, 1500.00, 'Breakfast'),
(3, 3, '2024-10-13 20:00:00', 1, 2500.00, 2500.00, 'Dinner'),
(3, 4, '2024-10-13 15:00:00', 2, 5000.00, 10000.00, 'Spa for 2');

-- Services for Booking 4 (Checked-In)
INSERT INTO service_usage (booking_id, service_id, usage_date, quantity, unit_price, total_price, notes)
VALUES 
(4, 1, '2024-10-14 08:00:00', 1, 1500.00, 1500.00, 'Breakfast'),
(4, 7, '2024-10-14 21:00:00', 4, 300.00, 1200.00, 'Snacks for family');

-- Services for Booking 8 (Checked-In)
INSERT INTO service_usage (booking_id, service_id, usage_date, quantity, unit_price, total_price, notes)
VALUES 
(8, 1, '2024-10-15 08:30:00', 1, 1500.00, 1500.00, 'Breakfast'),
(8, 2, '2024-10-15 13:00:00', 1, 2000.00, 2000.00, 'Lunch');

-- ============================================
-- Insert Payments (including partial payments)
-- ============================================
-- Payment for Booking 1 (Full payment)
INSERT INTO payments (booking_id, payment_date, amount, payment_method, transaction_reference, payment_status, processed_by)
VALUES (1, '2024-10-01 14:00:00', 16000.00, 'Credit Card', 'TXN001234', 'Completed', 2);

-- Payment for Booking 2 (Full payment)
INSERT INTO payments (booking_id, payment_date, amount, payment_method, transaction_reference, payment_status, processed_by)
VALUES (2, '2024-10-08 10:00:00', 45000.00, 'Cash', 'CASH001', 'Completed', 3);

-- Partial payments for Booking 3
INSERT INTO payments (booking_id, payment_date, amount, payment_method, transaction_reference, payment_status, processed_by)
VALUES 
(3, '2024-10-12 14:30:00', 30000.00, 'Credit Card', 'TXN001235', 'Completed', 4),
(3, '2024-10-13 10:00:00', 20000.00, 'Credit Card', 'TXN001236', 'Completed', 4);

-- Payment for Booking 4 (Full advance payment)
INSERT INTO payments (booking_id, payment_date, amount, payment_method, transaction_reference, payment_status, processed_by)
VALUES (4, '2024-10-13 16:00:00', 40000.00, 'Debit Card', 'TXN001237', 'Completed', 2);

-- Partial payment for Booking 6
INSERT INTO payments (booking_id, payment_date, amount, payment_method, transaction_reference, payment_status, processed_by)
VALUES (6, '2024-10-10 11:00:00', 25000.00, 'Credit Card', 'TXN001238', 'Completed', 3);

-- Partial payments for Booking 8
INSERT INTO payments (booking_id, payment_date, amount, payment_method, transaction_reference, payment_status, processed_by)
VALUES 
(8, '2024-10-14 15:30:00', 20000.00, 'Credit Card', 'TXN001239', 'Completed', 4),
(8, '2024-10-15 09:00:00', 10000.00, 'Credit Card', 'TXN001240', 'Completed', 4);

-- ============================================
-- Update booking totals to include service charges
-- ============================================
UPDATE bookings b
SET total_amount = (
    SELECT calculate_room_charges(b.room_id, b.check_in_date, b.check_out_date) + 
           COALESCE(calculate_service_charges(b.booking_id), 0)
),
outstanding_amount = (
    SELECT calculate_room_charges(b.room_id, b.check_in_date, b.check_out_date) + 
           COALESCE(calculate_service_charges(b.booking_id), 0) - b.paid_amount
)
WHERE b.booking_id IN (1, 2, 3, 4, 8);
