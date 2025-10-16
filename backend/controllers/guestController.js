const { promisePool } = require('../config/database');
const bcrypt = require('bcryptjs');

// @desc    Get all guests
// @route   GET /api/guests
// @access  Private
const getAllGuests = async (req, res, next) => {
    try {
        const { search } = req.query;
        const userRole = req.user.role;
        const userBranchId = req.user.branch_id;
        
        let query = `
            SELECT 
                g.*,
                COUNT(DISTINCT b.booking_id) as total_bookings,
                SUM(CASE WHEN b.booking_status = 'Checked-Out' THEN 1 ELSE 0 END) as completed_bookings
            FROM guests g
            LEFT JOIN bookings b ON g.guest_id = b.guest_id
        `;
        
        const params = [];
        const whereConditions = [];
        
        // Receptionist can only see guests who have bookings at their branch
        if (userRole === 'Receptionist') {
            whereConditions.push('b.branch_id = ?');
            params.push(userBranchId);
        }
        
        if (search) {
            whereConditions.push('(g.first_name LIKE ? OR g.last_name LIKE ? OR g.email LIKE ? OR g.phone LIKE ?)');
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }
        
        query += ' GROUP BY g.guest_id ORDER BY g.created_at DESC';
        
        const [guests] = await promisePool.query(query, params);
        
        res.json({
            success: true,
            count: guests.length,
            data: guests
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single guest
// @route   GET /api/guests/:id
// @access  Private
const getGuest = async (req, res, next) => {
    try {
        const [guests] = await promisePool.query(
            'SELECT * FROM guests WHERE guest_id = ?',
            [req.params.id]
        );
        
        if (guests.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Guest not found'
            });
        }
        
        // Get guest booking history
        const [bookings] = await promisePool.query(
            `SELECT 
                b.booking_id, b.check_in_date, b.check_out_date, b.booking_status,
                b.total_amount, b.paid_amount, b.outstanding_amount,
                br.branch_name, r.room_number, rt.type_name as room_type
            FROM bookings b
            JOIN hotel_branches br ON b.branch_id = br.branch_id
            JOIN rooms r ON b.room_id = r.room_id
            JOIN room_types rt ON r.room_type_id = rt.room_type_id
            WHERE b.guest_id = ?
            ORDER BY b.booking_date DESC`,
            [req.params.id]
        );
        
        const guest = guests[0];
        guest.bookings = bookings;
        
        res.json({
            success: true,
            data: guest
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new guest
// @route   POST /api/guests
// @access  Private
const createGuest = async (req, res, next) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.beginTransaction();
        
        const {
            first_name, last_name, email, phone, id_type, id_number,
            address, country, date_of_birth
        } = req.body;
        
        if (!first_name || !last_name || !email || !phone || !id_type || !id_number || !country) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }
        
        // Check if email already exists
        const [existingGuests] = await connection.query(
            'SELECT guest_id FROM guests WHERE email = ?',
            [email]
        );
        
        if (existingGuests.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Guest with this email already exists'
            });
        }
        
        // 1. Create guest
        const [result] = await connection.query(
            `INSERT INTO guests (first_name, last_name, email, phone, id_type, id_number, address, country, date_of_birth)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, email, phone, id_type, id_number, address || null, country, date_of_birth || null]
        );
        
        const guest_id = result.insertId;
        
        // 2. Auto-generate username (firstname.lastname or firstname.lastname.guestid if exists)
        let username = `${first_name.toLowerCase()}.${last_name.toLowerCase()}`;
        
        // Check if username exists
        const [existingUsers] = await connection.query(
            'SELECT user_id FROM users WHERE username = ?',
            [username]
        );
        
        if (existingUsers.length > 0) {
            username = `${username}.${guest_id}`;
        }
        
        // 3. Generate default password: Guest@123
        const defaultPassword = 'Guest@123';
        const password_hash = await bcrypt.hash(defaultPassword, 10);
        
        // 4. Create user account
        await connection.query(
            `INSERT INTO users (username, password_hash, email, full_name, role, is_active)
             VALUES (?, ?, ?, ?, 'Guest', TRUE)`,
            [username, password_hash, email, `${first_name} ${last_name}`]
        );
        
        await connection.commit();
        
        res.status(201).json({
            success: true,
            message: 'Guest and user account created successfully',
            data: {
                guest_id,
                username,
                default_password: defaultPassword,
                email,
                note: 'Please share these credentials with the guest. They can change the password after logging in.'
            }
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// @desc    Update guest
// @route   PUT /api/guests/:id
// @access  Private
const updateGuest = async (req, res, next) => {
    try {
        const {
            first_name, last_name, email, phone, address, date_of_birth
        } = req.body;
        
        const updates = [];
        const params = [];
        
        if (first_name) {
            updates.push('first_name = ?');
            params.push(first_name);
        }
        
        if (last_name) {
            updates.push('last_name = ?');
            params.push(last_name);
        }
        
        if (email) {
            updates.push('email = ?');
            params.push(email);
        }
        
        if (phone) {
            updates.push('phone = ?');
            params.push(phone);
        }
        
        if (address !== undefined) {
            updates.push('address = ?');
            params.push(address);
        }
        
        if (date_of_birth !== undefined) {
            updates.push('date_of_birth = ?');
            params.push(date_of_birth);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }
        
        params.push(req.params.id);
        
        await promisePool.query(
            `UPDATE guests SET ${updates.join(', ')} WHERE guest_id = ?`,
            params
        );
        
        res.json({
            success: true,
            message: 'Guest updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete guest
// @route   DELETE /api/guests/:id
// @access  Private (Admin)
const deleteGuest = async (req, res, next) => {
    try {
        await promisePool.query('DELETE FROM guests WHERE guest_id = ?', [req.params.id]);
        
        res.json({
            success: true,
            message: 'Guest deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current guest profile (for logged-in guest)
// @route   GET /api/guests/me
// @access  Private (Guest)
const getMyProfile = async (req, res, next) => {
    try {
        // Get guest_id from token
        const guestId = req.user.guest_id;
        
        if (!guestId) {
            return res.status(404).json({
                success: false,
                message: 'Guest profile not found'
            });
        }
        
        const [guests] = await promisePool.query(
            'SELECT * FROM guests WHERE guest_id = ?',
            [guestId]
        );
        
        if (guests.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Guest not found'
            });
        }
        
        res.json({
            success: true,
            data: guests[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update current guest profile (for logged-in guest)
// @route   PUT /api/guests/me
// @access  Private (Guest)
const updateMyProfile = async (req, res, next) => {
    try {
        const guestId = req.user.guest_id;
        
        if (!guestId) {
            return res.status(404).json({
                success: false,
                message: 'Guest profile not found'
            });
        }
        
        const {
            first_name, last_name, phone, address, date_of_birth
        } = req.body;
        
        const updates = [];
        const params = [];
        
        if (first_name) {
            updates.push('first_name = ?');
            params.push(first_name);
        }
        
        if (last_name) {
            updates.push('last_name = ?');
            params.push(last_name);
        }
        
        if (phone) {
            updates.push('phone = ?');
            params.push(phone);
        }
        
        if (address !== undefined) {
            updates.push('address = ?');
            params.push(address);
        }
        
        if (date_of_birth !== undefined) {
            updates.push('date_of_birth = ?');
            params.push(date_of_birth);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }
        
        params.push(guestId);
        
        await promisePool.query(
            `UPDATE guests SET ${updates.join(', ')} WHERE guest_id = ?`,
            params
        );
        
        // Also update user's full_name if first_name or last_name changed
        if (first_name || last_name) {
            const [currentGuest] = await promisePool.query(
                'SELECT first_name, last_name, email FROM guests WHERE guest_id = ?',
                [guestId]
            );
            
            if (currentGuest.length > 0) {
                const updatedFirstName = first_name || currentGuest[0].first_name;
                const updatedLastName = last_name || currentGuest[0].last_name;
                const fullName = `${updatedFirstName} ${updatedLastName}`;
                
                await promisePool.query(
                    'UPDATE users SET full_name = ? WHERE email = ?',
                    [fullName, currentGuest[0].email]
                );
            }
        }
        
        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllGuests,
    getGuest,
    createGuest,
    updateGuest,
    deleteGuest,
    getMyProfile,
    updateMyProfile
};
