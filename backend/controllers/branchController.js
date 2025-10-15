const { promisePool } = require('../config/database');

// @desc    Get all branches
// @route   GET /api/branches
// @access  Public
const getAllBranches = async (req, res, next) => {
    try {
        const [branches] = await promisePool.query(
            'SELECT * FROM hotel_branches ORDER BY branch_name'
        );
        
        res.json({
            success: true,
            count: branches.length,
            data: branches
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single branch
// @route   GET /api/branches/:id
// @access  Public
const getBranch = async (req, res, next) => {
    try {
        const [branches] = await promisePool.query(
            'SELECT * FROM hotel_branches WHERE branch_id = ?',
            [req.params.id]
        );
        
        if (branches.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }
        
        // Get room count and types for this branch
        const [roomStats] = await promisePool.query(
            `SELECT 
                COUNT(*) as total_rooms,
                SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available_rooms,
                SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) as occupied_rooms
            FROM rooms
            WHERE branch_id = ?`,
            [req.params.id]
        );
        
        const branch = branches[0];
        branch.room_stats = roomStats[0];
        
        res.json({
            success: true,
            data: branch
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new branch
// @route   POST /api/branches
// @access  Private (Admin)
const createBranch = async (req, res, next) => {
    try {
        const { branch_name, location, address, phone, email } = req.body;
        
        if (!branch_name || !location || !address || !phone || !email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }
        
        const [result] = await promisePool.query(
            `INSERT INTO hotel_branches (branch_name, location, address, phone, email)
             VALUES (?, ?, ?, ?, ?)`,
            [branch_name, location, address, phone, email]
        );
        
        res.status(201).json({
            success: true,
            message: 'Branch created successfully',
            data: {
                branch_id: result.insertId
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update branch
// @route   PUT /api/branches/:id
// @access  Private (Admin)
const updateBranch = async (req, res, next) => {
    try {
        const { branch_name, location, address, phone, email } = req.body;
        
        const updates = [];
        const params = [];
        
        if (branch_name) {
            updates.push('branch_name = ?');
            params.push(branch_name);
        }
        
        if (location) {
            updates.push('location = ?');
            params.push(location);
        }
        
        if (address) {
            updates.push('address = ?');
            params.push(address);
        }
        
        if (phone) {
            updates.push('phone = ?');
            params.push(phone);
        }
        
        if (email) {
            updates.push('email = ?');
            params.push(email);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }
        
        params.push(req.params.id);
        
        await promisePool.query(
            `UPDATE hotel_branches SET ${updates.join(', ')} WHERE branch_id = ?`,
            params
        );
        
        res.json({
            success: true,
            message: 'Branch updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete branch
// @route   DELETE /api/branches/:id
// @access  Private (Admin)
const deleteBranch = async (req, res, next) => {
    try {
        await promisePool.query('DELETE FROM hotel_branches WHERE branch_id = ?', [req.params.id]);
        
        res.json({
            success: true,
            message: 'Branch deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllBranches,
    getBranch,
    createBranch,
    updateBranch,
    deleteBranch
};
