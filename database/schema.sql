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
