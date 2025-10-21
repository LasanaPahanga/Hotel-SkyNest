const { promisePool } = require('../config/database');

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Private
const getAllRooms = async (req, res, next) => {
    try {
        const { branch_id, status, room_type_id } = req.query;
        const userRole = req.user.role;
        const userBranchId = req.user.branch_id;
        
        let query = `
            SELECT 
                r.room_id, r.room_number, r.floor_number, r.status,
                rt.room_type_id, rt.type_name, rt.capacity, rt.base_rate, rt.amenities, rt.description,
                b.branch_id, b.branch_name, b.location
            FROM rooms r
            JOIN room_types rt ON r.room_type_id = rt.room_type_id
            JOIN hotel_branches b ON r.branch_id = b.branch_id
            WHERE 1=1
        `;
        
        const params = [];
        
        // Receptionist can only see their branch rooms
        if (userRole === 'Receptionist') {
            query += ' AND r.branch_id = ?';
            params.push(userBranchId);
        } else if (branch_id) {
            // Admin can filter by branch
            query += ' AND r.branch_id = ?';
            params.push(branch_id);
        }
        
        if (status) {
            query += ' AND r.status = ?';
            params.push(status);
        }
        
        if (room_type_id) {
            query += ' AND r.room_type_id = ?';
            params.push(room_type_id);
        }
        
        query += ' ORDER BY b.branch_name, r.room_number';
        
        const [rooms] = await promisePool.query(query, params);
        
        res.json({
            success: true,
            count: rooms.length,
            data: rooms
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get available rooms
// @route   GET /api/rooms/available
// @access  Public
const getAvailableRooms = async (req, res, next) => {
    try {
        const { branch_id, check_in_date, check_out_date, room_type_id, guests } = req.query;
        
        if (!check_in_date || !check_out_date) {
            return res.status(400).json({
                success: false,
                message: 'Please provide check-in and check-out dates'
            });
        }
        
        let query = `
            SELECT 
                r.room_id, r.room_number, r.floor_number, r.status,
                rt.room_type_id, rt.type_name, rt.capacity, rt.base_rate, rt.amenities, rt.description,
                b.branch_id, b.branch_name, b.location,
                DATEDIFF(?, ?) as nights,
                (rt.base_rate * DATEDIFF(?, ?)) as total_price
            FROM rooms r
            JOIN room_types rt ON r.room_type_id = rt.room_type_id
            JOIN hotel_branches b ON r.branch_id = b.branch_id
            WHERE r.status IN ('Available', 'Reserved')
            AND r.room_id NOT IN (
                SELECT room_id FROM bookings
                WHERE booking_status IN ('Booked', 'Checked-In')
                AND (
                    (check_in_date <= ? AND check_out_date > ?)
                    OR (check_in_date < ? AND check_out_date >= ?)
                    OR (check_in_date >= ? AND check_out_date <= ?)
                )
            )
        `;
        
        const params = [
            check_out_date, check_in_date,
            check_out_date, check_in_date,
            check_in_date, check_in_date,
            check_out_date, check_out_date,
            check_in_date, check_out_date
        ];
        
        if (branch_id) {
            query += ' AND r.branch_id = ?';
            params.push(branch_id);
        }
        
        if (room_type_id) {
            query += ' AND r.room_type_id = ?';
            params.push(room_type_id);
        }
        
        if (guests) {
            query += ' AND rt.capacity >= ?';
            params.push(guests);
        }
        
        query += ' ORDER BY b.branch_name, rt.base_rate, r.room_number';
        
        const [rooms] = await promisePool.query(query, params);
        
        res.json({
            success: true,
            count: rooms.length,
            data: rooms
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Private
const getRoom = async (req, res, next) => {
    try {
        const [rooms] = await promisePool.query(
            `SELECT 
                r.*, 
                rt.type_name, rt.capacity, rt.base_rate, rt.amenities, rt.description,
                b.branch_name, b.location, b.address, b.phone, b.email
            FROM rooms r
            JOIN room_types rt ON r.room_type_id = rt.room_type_id
            JOIN hotel_branches b ON r.branch_id = b.branch_id
            WHERE r.room_id = ?`,
            [req.params.id]
        );
        
        if (rooms.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }
        
        res.json({
            success: true,
            data: rooms[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new room
// @route   POST /api/rooms
// @access  Private (Admin)
const createRoom = async (req, res, next) => {
    try {
        const { branch_id, room_type_id, room_number, floor_number } = req.body;
        
        if (!branch_id || !room_type_id || !room_number || !floor_number) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }
        
        const [result] = await promisePool.query(
            `INSERT INTO rooms (branch_id, room_type_id, room_number, floor_number)
             VALUES (?, ?, ?, ?)`,
            [branch_id, room_type_id, room_number, floor_number]
        );
        
        res.status(201).json({
            success: true,
            message: 'Room created successfully',
            data: {
                room_id: result.insertId
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private (Admin)
const updateRoom = async (req, res, next) => {
    try {
        const { status, floor_number, base_price } = req.body;
        
        const updates = [];
        const params = [];
        
        if (status) {
            updates.push('status = ?');
            params.push(status);
        }
        
        if (floor_number) {
            updates.push('floor_number = ?');
            params.push(floor_number);
        }
        
        if (base_price !== undefined && base_price !== null) {
            updates.push('base_price = ?');
            params.push(parseFloat(base_price));
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }
        
        params.push(req.params.id);
        
        await promisePool.query(
            `UPDATE rooms SET ${updates.join(', ')} WHERE room_id = ?`,
            params
        );
        
        res.json({
            success: true,
            message: 'Room updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private (Admin)
const deleteRoom = async (req, res, next) => {
    try {
        await promisePool.query('DELETE FROM rooms WHERE room_id = ?', [req.params.id]);
        
        res.json({
            success: true,
            message: 'Room deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get room types
// @route   GET /api/rooms/types/all
// @access  Public
const getRoomTypes = async (req, res, next) => {
    try {
        const [roomTypes] = await promisePool.query(
            'SELECT * FROM room_types ORDER BY base_rate'
        );
        
        res.json({
            success: true,
            count: roomTypes.length,
            data: roomTypes
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get room with current guest details
// @route   GET /api/rooms/:id/details
// @access  Private (Admin, Receptionist)
const getRoomWithGuest = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get room details with current guest information using JOIN
        const [rooms] = await promisePool.query(
            `SELECT 
                r.room_id,
                r.room_number,
                r.floor_number,
                r.status,
                rt.capacity,
                rt.type_name as room_type,
                rt.base_rate,
                hb.branch_id,
                hb.branch_name,
                b.booking_id,
                b.check_in_date,
                b.check_out_date,
                b.booking_status,
                CONCAT(g.first_name, ' ', g.last_name) as current_guest_name,
                g.email as guest_email,
                g.phone as guest_phone,
                DATEDIFF(b.check_out_date, CURDATE()) as days_remaining,
                CASE 
                    WHEN DATEDIFF(b.check_out_date, CURDATE()) < 0 THEN 'Overdue'
                    WHEN DATEDIFF(b.check_out_date, CURDATE()) = 0 THEN 'Checkout Today'
                    WHEN DATEDIFF(b.check_out_date, CURDATE()) <= 2 THEN 'Checkout Soon'
                    ELSE 'Active'
                END as occupancy_status
            FROM rooms r
            JOIN room_types rt ON r.room_type_id = rt.room_type_id
            JOIN hotel_branches hb ON r.branch_id = hb.branch_id
            LEFT JOIN bookings b ON r.room_id = b.room_id 
                AND b.booking_status IN ('Checked-In', 'Booked')
                AND b.check_out_date >= CURDATE()
            LEFT JOIN guests g ON b.guest_id = g.guest_id
            WHERE r.room_id = ?
            ORDER BY b.check_in_date DESC
            LIMIT 1`,
            [id]
        );

        if (rooms.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const room = rooms[0];

        // Get booking taxes and discounts if there's a current booking
        if (room.booking_id) {
            const [taxes] = await promisePool.query(
                'SELECT * FROM booking_taxes WHERE booking_id = ?',
                [room.booking_id]
            );

            const [discounts] = await promisePool.query(
                'SELECT * FROM booking_discounts WHERE booking_id = ?',
                [room.booking_id]
            );

            const [fees] = await promisePool.query(
                'SELECT * FROM booking_fees WHERE booking_id = ?',
                [room.booking_id]
            );

            room.booking_taxes = taxes;
            room.booking_discounts = discounts;
            room.booking_fees = fees;
        }

        res.json({
            success: true,
            data: room
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllRooms,
    getAvailableRooms,
    getRoom,
    createRoom,
    updateRoom,
    deleteRoom,
    getRoomTypes,
    getRoomWithGuest
};
