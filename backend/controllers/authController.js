const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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
        const { 
            username, password, email, full_name, role, branch_id, phone,
            // Optional guest-specific fields when role === 'Guest'
            firstName, lastName, idType, idNumber, address, country, dateOfBirth
        } = req.body;

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

        const newUserId = result.insertId;

        // If admin is creating a Guest user, also create a guests record
        if (role === 'Guest') {
            // Derive names if not provided separately
            const fName = firstName || (full_name ? full_name.split(' ')[0] : null);
            const lName = lastName || (full_name ? full_name.split(' ').slice(1).join(' ') || '' : null);

            // Validate required guest fields
            if (!fName || !lName || !email || !phone || !idType || !idNumber || !country) {
                // Cleanup created user if guest data is insufficient
                await promisePool.query('DELETE FROM users WHERE user_id = ?', [newUserId]);
                return res.status(400).json({
                    success: false,
                    message: 'Missing required guest fields (firstName, lastName, idType, idNumber, country, phone, email) for Guest role'
                });
            }

            try {
                await promisePool.query(
                    `INSERT INTO guests (user_id, first_name, last_name, email, phone, id_type, id_number, address, country, date_of_birth)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        newUserId,
                        fName,
                        lName,
                        email,
                        phone,
                        idType,
                        idNumber,
                        address || null,
                        country,
                        dateOfBirth || null
                    ]
                );
            } catch (guestErr) {
                // Roll back user if guest insert fails
                await promisePool.query('DELETE FROM users WHERE user_id = ?', [newUserId]);
                throw guestErr;
            }
        }

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user_id: newUserId,
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
            `SELECT 
                u.user_id, u.username, u.email, u.full_name, u.role, u.phone, u.is_active,
                b.branch_id, b.branch_name, b.location,
                g.guest_id
             FROM users u
             LEFT JOIN hotel_branches b ON u.branch_id = b.branch_id
             LEFT JOIN guests g ON g.email = u.email
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
                branch,
                ...(user.role === 'Guest' && user.guest_id ? { guest_id: user.guest_id } : {})
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

// @desc    Guest signup (self-registration) - NO EMAIL VERIFICATION
// @route   POST /api/auth/signup
// @access  Public
const guestSignup = async (req, res, next) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.beginTransaction();
        
        const {
            firstName, lastName, email, phone, password,
            idType, idNumber, address, country, dateOfBirth
        } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !phone || !password || !idType || !idNumber || !country) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if email already exists
        const [existingUsers] = await connection.query(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Generate username
        let username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
        const [existingUsername] = await connection.query(
            'SELECT user_id FROM users WHERE username = ?',
            [username]
        );
        
        if (existingUsername.length > 0) {
            username = `${username}.${Date.now()}`;
        }

        // Create user account (email already verified)
        const [userResult] = await connection.query(
            `INSERT INTO users (username, password_hash, email, full_name, role, phone, email_verified, email_verified_at)
             VALUES (?, ?, ?, ?, 'Guest', ?, TRUE, NOW())`,
            [username, password_hash, email, `${firstName} ${lastName}`, phone]
        );

        const userId = userResult.insertId;

        // Create guest record
        await connection.query(
            `INSERT INTO guests (first_name, last_name, email, phone, id_type, id_number, address, country, date_of_birth)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [firstName, lastName, email, phone, idType, idNumber, address || null, country, dateOfBirth || null]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Account created successfully! You can now login.',
            data: {
                username,
                email
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Signup error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

// @desc    Verify email with token
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res, next) => {
    try {
        const { sendWelcomeEmail } = require('../utils/emailService');
        const { token } = req.params;

        // Find token
        const [tokens] = await promisePool.query(
            `SELECT * FROM email_verification_tokens 
             WHERE token = ? AND token_type = 'Signup' AND is_used = FALSE AND expires_at > NOW()`,
            [token]
        );

        if (tokens.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        const tokenData = tokens[0];
        const userData = JSON.parse(tokenData.user_data);

        // Start transaction
        const connection = await promisePool.getConnection();
        await connection.beginTransaction();

        try {
            // Create user account
            const [userResult] = await connection.query(
                `INSERT INTO users (username, password_hash, email, full_name, role, phone, email_verified, email_verified_at)
                 VALUES (?, ?, ?, ?, 'Guest', ?, TRUE, NOW())`,
                [
                    userData.email.split('@')[0], // Use email prefix as username
                    userData.password_hash,
                    userData.email,
                    `${userData.firstName} ${userData.lastName}`,
                    userData.phone
                ]
            );

            const userId = userResult.insertId;

            // Create guest record
            await connection.query(
                `INSERT INTO guests (user_id, first_name, last_name, email, phone, id_type, id_number, address, country, date_of_birth)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    userData.firstName,
                    userData.lastName,
                    userData.email,
                    userData.phone,
                    userData.idType,
                    userData.idNumber,
                    userData.address || null,
                    userData.country,
                    userData.dateOfBirth || null
                ]
            );

            // Mark token as used
            await connection.query(
                'UPDATE email_verification_tokens SET is_used = TRUE WHERE token_id = ?',
                [tokenData.token_id]
            );

            await connection.commit();
            connection.release();

            // Send welcome email (non-blocking)
            sendWelcomeEmail(userData.email, userData.firstName).catch(err => 
                console.error('Welcome email error:', err)
            );

            res.json({
                success: true,
                message: 'Email verified successfully! You can now login with your credentials.'
            });
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Email verification error:', error);
        next(error);
    }
};

// @desc    Request password reset (NO EMAIL - Returns token directly)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email address'
            });
        }

        // Check if user exists
        const [users] = await promisePool.query(
            'SELECT user_id, email, full_name FROM users WHERE email = ? AND is_active = TRUE',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email'
            });
        }

        const user = users[0];

        // Generate reset token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Store token
        await promisePool.query(
            `INSERT INTO email_verification_tokens (email, token, token_type, expires_at)
             VALUES (?, ?, 'Password Reset', ?)`,
            [email, token, expiresAt]
        );

        // Return token directly (NO EMAIL SENT)
        res.json({
            success: true,
            message: 'Password reset token generated. Use this token to reset your password.',
            data: {
                token,
                email: user.email,
                resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`
            }
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        next(error);
    }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide token and new password'
            });
        }

        // Find valid token
        const [tokens] = await promisePool.query(
            `SELECT * FROM email_verification_tokens 
             WHERE token = ? AND token_type = 'Password Reset' AND is_used = FALSE AND expires_at > NOW()`,
            [token]
        );

        if (tokens.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        const tokenData = tokens[0];

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        // Update password
        await promisePool.query(
            'UPDATE users SET password_hash = ? WHERE email = ?',
            [password_hash, tokenData.email]
        );

        // Mark token as used
        await promisePool.query(
            'UPDATE email_verification_tokens SET is_used = TRUE WHERE token_id = ?',
            [tokenData.token_id]
        );

        res.json({
            success: true,
            message: 'Password reset successfully. You can now login with your new password.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        next(error);
    }
};

module.exports = {
    login,
    register,
    getMe,
    changePassword,
    guestSignup,
    verifyEmail,
    forgotPassword,
    resetPassword
};
