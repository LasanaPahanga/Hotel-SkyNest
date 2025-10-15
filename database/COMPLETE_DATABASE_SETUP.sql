-- SkyNest Hotels - Database Schema
-- Hotel Reservation and Guest Services Management System

DROP DATABASE IF EXISTS skynest_hotels;
CREATE DATABASE skynest_hotels;
USE skynest_hotels;

-- ============================================
-- TABLE: hotel_branches
-- Stores information about each hotel branch
-- ============================================
CREATE TABLE hotel_branches (
    branch_id INT PRIMARY KEY AUTO_INCREMENT,
    branch_name VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location (location)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: room_types
-- Defines different types of rooms available
-- ============================================
CREATE TABLE room_types (
    room_type_id INT PRIMARY KEY AUTO_INCREMENT,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    capacity INT NOT NULL,
    base_rate DECIMAL(10, 2) NOT NULL,
    amenities TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (capacity > 0),
    CHECK (base_rate > 0)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: rooms
-- Stores individual room information
-- ============================================
CREATE TABLE rooms (
    room_id INT PRIMARY KEY AUTO_INCREMENT,
    branch_id INT NOT NULL,
    room_type_id INT NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    floor_number INT NOT NULL,
    status ENUM('Available', 'Occupied', 'Maintenance', 'Reserved') DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES hotel_branches(branch_id) ON DELETE CASCADE,
    FOREIGN KEY (room_type_id) REFERENCES room_types(room_type_id) ON DELETE RESTRICT,
    UNIQUE KEY unique_room (branch_id, room_number),
    INDEX idx_branch_status (branch_id, status),
    INDEX idx_room_type (room_type_id)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: users
-- Stores user accounts for system access
-- ============================================
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('Admin', 'Receptionist', 'Guest') NOT NULL,
    branch_id INT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES hotel_branches(branch_id) ON DELETE SET NULL,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: guests
-- Stores guest information
-- ============================================
CREATE TABLE guests (
    guest_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    id_type ENUM('Passport', 'NIC', 'Driving License') NOT NULL,
    id_number VARCHAR(50) NOT NULL,
    address TEXT,
    country VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_id_number (id_number)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: bookings
-- Stores room booking information
-- ============================================
CREATE TABLE bookings (
    booking_id INT PRIMARY KEY AUTO_INCREMENT,
    guest_id INT NOT NULL,
    room_id INT NOT NULL,
    branch_id INT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    actual_check_in DATETIME NULL,
    actual_check_out DATETIME NULL,
    number_of_guests INT NOT NULL DEFAULT 1,
    booking_status ENUM('Booked', 'Checked-In', 'Checked-Out', 'Cancelled') DEFAULT 'Booked',
    payment_method ENUM('Cash', 'Credit Card', 'Debit Card', 'Online Transfer') NOT NULL,
    special_requests TEXT,
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    outstanding_amount DECIMAL(10, 2) DEFAULT 0.00,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES guests(guest_id) ON DELETE RESTRICT,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE RESTRICT,
    FOREIGN KEY (branch_id) REFERENCES hotel_branches(branch_id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CHECK (check_out_date > check_in_date),
    CHECK (number_of_guests > 0),
    CHECK (total_amount >= 0),
    CHECK (paid_amount >= 0),
    CHECK (outstanding_amount >= 0),
    INDEX idx_guest (guest_id),
    INDEX idx_room (room_id),
    INDEX idx_branch (branch_id),
    INDEX idx_dates (check_in_date, check_out_date),
    INDEX idx_status (booking_status),
    INDEX idx_booking_date (booking_date)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: service_catalogue
-- Stores available services
-- ============================================
CREATE TABLE service_catalogue (
    service_id INT PRIMARY KEY AUTO_INCREMENT,
    service_name VARCHAR(100) NOT NULL,
    service_category ENUM('Room Service', 'Spa', 'Laundry', 'Minibar', 'Restaurant', 'Transportation', 'Other') NOT NULL,
    description TEXT,
    unit_price DECIMAL(10, 2) NOT NULL,
    unit_type VARCHAR(20) DEFAULT 'item',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (unit_price >= 0),
    INDEX idx_category (service_category),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: service_usage
-- Tracks services used by guests during their stay
-- ============================================
CREATE TABLE service_usage (
    usage_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    service_id INT NOT NULL,
    usage_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES service_catalogue(service_id) ON DELETE RESTRICT,
    CHECK (quantity > 0),
    CHECK (unit_price >= 0),
    CHECK (total_price >= 0),
    INDEX idx_booking (booking_id),
    INDEX idx_service (service_id),
    INDEX idx_usage_date (usage_date)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: payments
-- Stores payment transactions
-- ============================================
CREATE TABLE payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('Cash', 'Credit Card', 'Debit Card', 'Online Transfer') NOT NULL,
    transaction_reference VARCHAR(100),
    payment_status ENUM('Pending', 'Completed', 'Failed', 'Refunded') DEFAULT 'Completed',
    notes TEXT,
    processed_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CHECK (amount > 0),
    INDEX idx_booking (booking_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_status (payment_status)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: audit_log
-- Tracks important system actions for auditing
-- ============================================
CREATE TABLE audit_log (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_table (table_name),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: room_availability_cache
-- Caches room availability for performance
-- ============================================
CREATE TABLE room_availability_cache (
    cache_id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    booking_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    UNIQUE KEY unique_room_date (room_id, date),
    INDEX idx_date (date),
    INDEX idx_available (is_available)
) ENGINE=InnoDB;
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
    
    -- Get booking details
    SELECT outstanding_amount, paid_amount, total_amount, booking_status
    INTO v_outstanding, v_paid, v_total, v_booking_status
    FROM bookings
    WHERE booking_id = p_booking_id;
    
    -- Check if booking exists
    IF v_booking_status IS NULL THEN
        SET p_error_message = 'Booking not found';
        SET p_payment_id = NULL;
        ROLLBACK;
    -- Cannot process payment for cancelled bookings
    ELSEIF v_booking_status = 'Cancelled' THEN
        SET p_error_message = 'Cannot process payment for cancelled bookings';
        SET p_payment_id = NULL;
        ROLLBACK;
    -- Validate payment amount
    ELSEIF p_amount <= 0 THEN
        SET p_error_message = 'Payment amount must be greater than zero';
        SET p_payment_id = NULL;
        ROLLBACK;
    ELSEIF p_amount > v_outstanding THEN
        SET p_error_message = CONCAT('Payment amount (', p_amount, ') exceeds outstanding balance (', v_outstanding, ')');
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
        
        -- Update booking amounts (trigger will handle this, but doing it explicitly for safety)
        UPDATE bookings
        SET paid_amount = paid_amount + p_amount,
            outstanding_amount = outstanding_amount - p_amount
        WHERE booking_id = p_booking_id;
        
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
