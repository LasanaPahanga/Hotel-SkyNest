const bcrypt = require('bcryptjs');
const { promisePool } = require('../config/database');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
    try {
        const [users] = await promisePool.query(
            `SELECT u.user_id, u.username, u.email, u.full_name, u.role, u.phone, 
                    u.is_active, u.created_at,
                    b.branch_id, b.branch_name, b.location
             FROM users u
             LEFT JOIN hotel_branches b ON u.branch_id = b.branch_id
             ORDER BY u.created_at DESC`
        );

        const formattedUsers = users.map(user => ({
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            phone: user.phone,
            is_active: user.is_active,
            created_at: user.created_at,
            branch: user.branch_id ? {
                branch_id: user.branch_id,
                branch_name: user.branch_name,
                location: user.location
            } : null
        }));

        res.json({
            success: true,
            count: formattedUsers.length,
            data: formattedUsers
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res, next) => {
    try {
        const [users] = await promisePool.query(
            `SELECT u.user_id, u.username, u.email, u.full_name, u.role, u.phone, 
                    u.is_active, u.created_at,
                    b.branch_id, b.branch_name, b.location
             FROM users u
             LEFT JOIN hotel_branches b ON u.branch_id = b.branch_id
             WHERE u.user_id = ?`,
            [req.params.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];
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
                created_at: user.created_at,
                branch: user.branch_id ? {
                    branch_id: user.branch_id,
                    branch_name: user.branch_name,
                    location: user.location
                } : null
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
    try {
        const { email, full_name, role, branch_id, phone, is_active } = req.body;

        // Check if user exists
        const [users] = await promisePool.query(
            'SELECT user_id FROM users WHERE user_id = ?',
            [req.params.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update user
        await promisePool.query(
            `UPDATE users 
             SET email = ?, full_name = ?, role = ?, branch_id = ?, phone = ?, is_active = ?
             WHERE user_id = ?`,
            [email, full_name, role, branch_id || null, phone || null, is_active, req.params.id]
        );

        res.json({
            success: true,
            message: 'User updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
    try {
        // Check if user exists
        const [users] = await promisePool.query(
            'SELECT user_id FROM users WHERE user_id = ?',
            [req.params.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deleting yourself
        if (parseInt(req.params.id) === req.user.user_id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        // Delete user
        await promisePool.query('DELETE FROM users WHERE user_id = ?', [req.params.id]);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reset user password (Admin only)
// @route   PUT /api/users/:id/reset-password
// @access  Private/Admin
const resetPassword = async (req, res, next) => {
    try {
        const { new_password } = req.body;

        if (!new_password || new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Check if user exists
        const [users] = await promisePool.query(
            'SELECT user_id FROM users WHERE user_id = ?',
            [req.params.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(new_password, salt);

        // Update password
        await promisePool.query(
            'UPDATE users SET password_hash = ? WHERE user_id = ?',
            [password_hash, req.params.id]
        );

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    resetPassword
};
