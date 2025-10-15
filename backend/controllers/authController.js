const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { promisePool } = require('../config/database');

// Generate JWT token
const generateToken = (user, guest_id = null) => {
    const payload = {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        branch_id: user.branch_id
    };
    
    // Add guest_id if user is a guest
    if (guest_id) {
        payload.guest_id = guest_id;
    }
    
    return jwt.sign(payload, process.env.JWT_SECRET, { 
        expiresIn: process.env.JWT_EXPIRE || '7d' 
    });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username and password'
            });
        }

        // Check if user exists
        const [users] = await promisePool.query(
            'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Get guest_id if user is a guest
        let guest_id = null;
        if (user.role === 'Guest') {
            const [guests] = await promisePool.query(
                'SELECT guest_id FROM guests WHERE email = ?',
                [user.email]
            );
            if (guests.length > 0) {
                guest_id = guests[0].guest_id;
            }
        }

        // Generate token with guest_id if applicable
        const token = generateToken(user, guest_id);

        // Get branch info if user has one
        let branchInfo = null;
        if (user.branch_id) {
            const [branches] = await promisePool.query(
                'SELECT branch_id, branch_name, location FROM hotel_branches WHERE branch_id = ?',
                [user.branch_id]
            );
            branchInfo = branches[0] || null;
        }

        const userData = {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            branch: branchInfo
        };

        // Add guest_id for guest users
        if (guest_id) {
            userData.guest_id = guest_id;
        }

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: userData
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Register new user (Admin only)
// @route   POST /api/auth/register
// @access  Private/Admin
const register = async (req, res, next) => {
    try {
        const { username, password, email, full_name, role, branch_id, phone } = req.body;

        // Validation
        if (!username || !password || !email || !full_name || !role) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if username or email already exists
        const [existingUsers] = await promisePool.query(
            'SELECT user_id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert user
        const [result] = await promisePool.query(
            `INSERT INTO users (username, password_hash, email, full_name, role, branch_id, phone)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [username, password_hash, email, full_name, role, branch_id || null, phone || null]
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user_id: result.insertId,
                username,
                email,
                role
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        const [users] = await promisePool.query(
            `SELECT u.user_id, u.username, u.email, u.full_name, u.role, u.phone, u.is_active,
                    b.branch_id, b.branch_name, b.location
             FROM users u
             LEFT JOIN hotel_branches b ON u.branch_id = b.branch_id
             WHERE u.user_id = ?`,
            [req.user.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];
        const branch = user.branch_id ? {
            branch_id: user.branch_id,
            branch_name: user.branch_name,
            location: user.location
        } : null;

        res.json({
            success: true,
            data: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                phone: user.phone,
                is_active: user.is_active,
                branch
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        // Get user with password
        const [users] = await promisePool.query(
            'SELECT password_hash FROM users WHERE user_id = ?',
            [req.user.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(current_password, users[0].password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const new_password_hash = await bcrypt.hash(new_password, salt);

        // Update password
        await promisePool.query(
            'UPDATE users SET password_hash = ? WHERE user_id = ?',
            [new_password_hash, req.user.user_id]
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    register,
    getMe,
    changePassword
};
