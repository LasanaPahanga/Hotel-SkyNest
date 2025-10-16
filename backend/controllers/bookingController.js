const { promisePool } = require('../config/database');
const bcrypt = require('bcryptjs');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
const getAllBookings = async (req, res, next) => {
    try {
        const { status, branch_id, start_date, end_date } = req.query;
        
        let query = `
            SELECT 
                b.booking_id, b.check_in_date, b.check_out_date, b.actual_check_in, b.actual_check_out,
                b.number_of_guests, b.booking_status, b.payment_method, b.special_requests,
                b.total_amount, b.paid_amount, b.outstanding_amount, b.booking_date,
                g.guest_id, g.first_name, g.last_name, g.email, g.phone,
                r.room_id, r.room_number, r.floor_number,
                rt.type_name as room_type, rt.base_rate,
                br.branch_id, br.branch_name, br.location
            FROM bookings b
            JOIN guests g ON b.guest_id = g.guest_id
            JOIN rooms r ON b.room_id = r.room_id
            JOIN room_types rt ON r.room_type_id = rt.room_type_id
            JOIN hotel_branches br ON b.branch_id = br.branch_id
            WHERE 1=1
        `;
        
        const params = [];
        
        // Filter by status
        if (status) {
            query += ' AND b.booking_status = ?';
            params.push(status);
        }
        
        // Filter by role
        if (req.user.role === 'Guest') {
            // Guests can only see their own bookings
            query += ' AND b.guest_id = ?';
            params.push(req.user.guest_id);
        } else if (req.user.role === 'Receptionist') {
            // Receptionists can only see their branch
            query += ' AND b.branch_id = ?';
            params.push(req.user.branch_id);
        } else if (branch_id) {
            // Admin can filter by branch
            query += ' AND b.branch_id = ?';
            params.push(branch_id);
        }
        
        // Filter by date range
        if (start_date) {
            query += ' AND b.check_in_date >= ?';
            params.push(start_date);
        }
        
        if (end_date) {
            query += ' AND b.check_out_date <= ?';
            params.push(end_date);
        }
        
        query += ' ORDER BY b.booking_date DESC';
        
        const [bookings] = await promisePool.query(query, params);
        
        res.json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
const getBooking = async (req, res, next) => {
    try {
        const [bookings] = await promisePool.query(
            `SELECT 
                b.*, 
                g.first_name, g.last_name, g.email, g.phone, g.id_type, g.id_number, g.address, g.country,
                r.room_number, r.floor_number,
                rt.type_name as room_type, rt.base_rate, rt.capacity, rt.amenities,
                br.branch_name, br.location, br.address as branch_address, br.phone as branch_phone
            FROM bookings b
            JOIN guests g ON b.guest_id = g.guest_id
            JOIN rooms r ON b.room_id = r.room_id
            JOIN room_types rt ON r.room_type_id = rt.room_type_id
            JOIN hotel_branches br ON b.branch_id = br.branch_id
            WHERE b.booking_id = ?`,
            [req.params.id]
        );
        
        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        // Get service usage for this booking
        const [services] = await promisePool.query(
            `SELECT su.*, sc.service_name, sc.service_category
             FROM service_usage su
             JOIN service_catalogue sc ON su.service_id = sc.service_id
             WHERE su.booking_id = ?
             ORDER BY su.usage_date DESC`,
            [req.params.id]
        );
        
        // Get payments for this booking
        const [payments] = await promisePool.query(
            `SELECT p.*, u.full_name as processed_by_name
             FROM payments p
             LEFT JOIN users u ON p.processed_by = u.user_id
             WHERE p.booking_id = ?
             ORDER BY p.payment_date DESC`,
            [req.params.id]
        );
        
        const booking = bookings[0];
        booking.services = services;
        booking.payments = payments;
        
        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res, next) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.beginTransaction();
        
        const {
            guest_id, room_id, check_in_date, check_out_date,
            number_of_guests, payment_method, special_requests
        } = req.body;
        
        // Validation
        if (!guest_id || !room_id || !check_in_date || !check_out_date || !payment_method) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }
        
        // Check if guest has a user account, if not create one
        const [guest] = await connection.query(
            'SELECT g.*, u.user_id FROM guests g LEFT JOIN users u ON g.email = u.email WHERE g.guest_id = ?',
            [guest_id]
        );
        
        if (guest.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Guest not found'
            });
        }
        
        let userCredentials = null;
        
        // If guest doesn't have a user account, create one
        if (!guest[0].user_id) {
            const { first_name, last_name, email } = guest[0];
            
            // Generate username
            let username = `${first_name.toLowerCase()}.${last_name.toLowerCase()}`;
            const [existingUsers] = await connection.query(
                'SELECT user_id FROM users WHERE username = ?',
                [username]
            );
            
            if (existingUsers.length > 0) {
                username = `${username}.${guest_id}`;
            }
            
            // Generate default password
            const defaultPassword = 'Guest@123';
            const password_hash = await bcrypt.hash(defaultPassword, 10);
            
            // Create user account
            await connection.query(
                `INSERT INTO users (username, password_hash, email, full_name, role, is_active)
                 VALUES (?, ?, ?, ?, 'Guest', TRUE)`,
                [username, password_hash, email, `${first_name} ${last_name}`]
            );
            
            userCredentials = {
                username,
                password: defaultPassword,
                email
            };
        }
        
        // Call stored procedure to create booking
        const [result] = await connection.query(
            `CALL create_booking(?, ?, ?, ?, ?, ?, ?, ?, @booking_id, @error_message)`,
            [guest_id, room_id, check_in_date, check_out_date, number_of_guests || 1, 
             payment_method, special_requests || null, req.user.user_id]
        );
        
        // Get output parameters
        const [output] = await connection.query(
            'SELECT @booking_id as booking_id, @error_message as error_message'
        );
        
        if (output[0].error_message) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: output[0].error_message
            });
        }
        
        // Get the created booking
        const [bookings] = await connection.query(
            'SELECT * FROM bookings WHERE booking_id = ?',
            [output[0].booking_id]
        );
        
        await connection.commit();
        
        const response = {
            success: true,
            message: 'Booking created successfully',
            data: bookings[0]
        };
        
        // Include user credentials if account was created
        if (userCredentials) {
            response.user_account_created = true;
            response.credentials = userCredentials;
            response.note = 'Guest user account was automatically created. Please share these credentials with the guest.';
        }
        
        res.status(201).json(response);
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// @desc    Check-in guest
// @route   PUT /api/bookings/:id/checkin
// @access  Private (Admin, Receptionist) - GUESTS CANNOT CHECK-IN
const checkInGuest = async (req, res, next) => {
    try {
        // IMPORTANT: Guests cannot check-in themselves
        if (req.user.role === 'Guest') {
            return res.status(403).json({
                success: false,
                message: 'Guests cannot check-in. Please contact the receptionist.'
            });
        }

        // Call stored procedure
        await promisePool.query(
            `CALL check_in_guest(?, ?, @success, @error_message)`,
            [req.params.id, req.user.user_id]
        );
        
        // Get output parameters
        const [output] = await promisePool.query(
            'SELECT @success as success, @error_message as error_message'
        );
        
        if (!output[0].success) {
            return res.status(400).json({
                success: false,
                message: output[0].error_message
            });
        }
        
        res.json({
            success: true,
            message: 'Guest checked in successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Check-out guest
// @route   PUT /api/bookings/:id/checkout
// @access  Private (Admin, Receptionist) - GUESTS CANNOT CHECK-OUT
const checkOutGuest = async (req, res, next) => {
    try {
        // IMPORTANT: Guests cannot check-out themselves
        if (req.user.role === 'Guest') {
            return res.status(403).json({
                success: false,
                message: 'Guests cannot check-out. Please contact the receptionist.'
            });
        }

        const { actual_checkout_time } = req.body;

        // Call stored procedure
        await promisePool.query(
            `CALL check_out_guest(?, ?, @success, @error_message, @outstanding_amount)`,
            [req.params.id, req.user.user_id]
        );
        
        // Get output parameters
        const [output] = await promisePool.query(
            'SELECT @success as success, @error_message as error_message, @outstanding_amount as outstanding_amount'
        );
        
        if (!output[0].success) {
            return res.status(400).json({
                success: false,
                message: output[0].error_message,
                outstanding_amount: output[0].outstanding_amount
            });
        }

        // Apply late checkout fee if applicable
        if (actual_checkout_time) {
            await promisePool.query(
                'CALL apply_late_checkout_fee(?, ?, ?, @fee_amount, @fee_message)',
                [req.params.id, actual_checkout_time, req.user.user_id]
            );
        }
        
        res.json({
            success: true,
            message: 'Guest checked out successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res, next) => {
    try {
        // IMPORTANT: Guests can only cancel bookings that are NOT checked-in
        if (req.user.role === 'Guest') {
            const [booking] = await promisePool.query(
                'SELECT booking_status, guest_id FROM bookings WHERE booking_id = ?',
                [req.params.id]
            );

            if (booking.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            // Check if booking belongs to the guest
            if (booking[0].guest_id !== req.user.guest_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Guests cannot cancel checked-in bookings
            if (booking[0].booking_status === 'Checked-In') {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot cancel a checked-in booking. Please contact the receptionist.'
                });
            }
        }

        // Call stored procedure
        await promisePool.query(
            `CALL cancel_booking(?, ?, @success, @error_message)`,
            [req.params.id, req.user.user_id]
        );
        
        // Get output parameters
        const [output] = await promisePool.query(
            'SELECT @success as success, @error_message as error_message'
        );
        
        if (!output[0].success) {
            return res.status(400).json({
                success: false,
                message: output[0].error_message
            });
        }
        
        res.json({
            success: true,
            message: 'Booking cancelled successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private (Admin, Receptionist)
const updateBooking = async (req, res, next) => {
    try {
        const { special_requests, number_of_guests } = req.body;
        
        const updates = [];
        const params = [];
        
        if (special_requests !== undefined) {
            updates.push('special_requests = ?');
            params.push(special_requests);
        }
        
        if (number_of_guests !== undefined) {
            updates.push('number_of_guests = ?');
            params.push(number_of_guests);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }
        
        params.push(req.params.id);
        
        await promisePool.query(
            `UPDATE bookings SET ${updates.join(', ')} WHERE booking_id = ?`,
            params
        );
        
        res.json({
            success: true,
            message: 'Booking updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllBookings,
    getBooking,
    createBooking,
    checkInGuest,
    checkOutGuest,
    cancelBooking,
    updateBooking
};
