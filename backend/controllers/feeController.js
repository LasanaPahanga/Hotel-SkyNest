const { promisePool } = require('../config/database');

// @desc    Get all fee configurations for a branch
// @route   GET /api/fees/:branchId
// @access  Private (Admin, Receptionist)
const getBranchFees = async (req, res, next) => {
    try {
        const { branchId } = req.params;
        
        // Check permissions
        if (req.user.role === 'Receptionist' && req.user.branch_id !== parseInt(branchId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this branch'
            });
        }

        const [fees] = await promisePool.query(
            `SELECT * FROM branch_fee_config 
             WHERE branch_id = ? 
             ORDER BY is_active DESC, fee_type, created_at DESC`,
            [branchId]
        );

        res.json({
            success: true,
            count: fees.length,
            data: fees
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create fee configuration
// @route   POST /api/fees
// @access  Private (Admin, Receptionist)
const createFee = async (req, res, next) => {
    try {
        const {
            branch_id, fee_type, fee_calculation, fee_value,
            grace_period_minutes, max_fee_amount, description
        } = req.body;

        // Validation
        if (!branch_id || !fee_type || !fee_calculation || fee_value === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check permissions
        if (req.user.role === 'Receptionist' && req.user.branch_id !== parseInt(branch_id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this branch'
            });
        }

        // Validate fee value
        if (fee_value < 0) {
            return res.status(400).json({
                success: false,
                message: 'Fee value must be positive'
            });
        }

        const [result] = await promisePool.query(
            `INSERT INTO branch_fee_config 
             (branch_id, fee_type, fee_calculation, fee_value, grace_period_minutes, max_fee_amount, description)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                branch_id, fee_type, fee_calculation, fee_value,
                grace_period_minutes || 0, max_fee_amount || null, description || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Fee configuration created successfully',
            data: {
                fee_config_id: result.insertId
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update fee configuration
// @route   PUT /api/fees/:id
// @access  Private (Admin, Receptionist)
const updateFee = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            fee_type, fee_calculation, fee_value, grace_period_minutes,
            max_fee_amount, is_active, description
        } = req.body;

        // Get existing fee config
        const [existing] = await promisePool.query(
            'SELECT branch_id FROM branch_fee_config WHERE fee_config_id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fee configuration not found'
            });
        }

        // Check permissions
        if (req.user.role === 'Receptionist' && req.user.branch_id !== existing[0].branch_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this branch'
            });
        }

        const updates = [];
        const params = [];

        if (fee_type !== undefined) {
            updates.push('fee_type = ?');
            params.push(fee_type);
        }
        if (fee_calculation !== undefined) {
            updates.push('fee_calculation = ?');
            params.push(fee_calculation);
        }
        if (fee_value !== undefined) {
            updates.push('fee_value = ?');
            params.push(fee_value);
        }
        if (grace_period_minutes !== undefined) {
            updates.push('grace_period_minutes = ?');
            params.push(grace_period_minutes);
        }
        if (max_fee_amount !== undefined) {
            updates.push('max_fee_amount = ?');
            params.push(max_fee_amount);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        params.push(id);

        await promisePool.query(
            `UPDATE branch_fee_config SET ${updates.join(', ')} WHERE fee_config_id = ?`,
            params
        );

        res.json({
            success: true,
            message: 'Fee configuration updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete fee configuration
// @route   DELETE /api/fees/:id
// @access  Private (Admin)
const deleteFee = async (req, res, next) => {
    try {
        const { id } = req.params;

        await promisePool.query(
            'DELETE FROM branch_fee_config WHERE fee_config_id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Fee configuration deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Apply late checkout fee manually
// @route   POST /api/fees/apply-late-checkout
// @access  Private (Admin, Receptionist)
const applyLateCheckoutFee = async (req, res, next) => {
    try {
        const { booking_id, actual_checkout_time } = req.body;

        if (!booking_id || !actual_checkout_time) {
            return res.status(400).json({
                success: false,
                message: 'Please provide booking_id and actual_checkout_time'
            });
        }

        // Call stored procedure
        await promisePool.query(
            'CALL apply_late_checkout_fee(?, ?, ?, @fee_amount, @message)',
            [booking_id, actual_checkout_time, req.user.user_id]
        );

        const [result] = await promisePool.query(
            'SELECT @fee_amount as fee_amount, @message as message'
        );

        res.json({
            success: true,
            message: result[0].message,
            data: {
                fee_amount: result[0].fee_amount
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Apply no-show fee manually
// @route   POST /api/fees/apply-no-show
// @access  Private (Admin, Receptionist)
const applyNoShowFee = async (req, res, next) => {
    try {
        const { booking_id } = req.body;

        if (!booking_id) {
            return res.status(400).json({
                success: false,
                message: 'Please provide booking_id'
            });
        }

        // Call stored procedure
        await promisePool.query(
            'CALL apply_no_show_fee(?, ?, @fee_amount, @message)',
            [booking_id, req.user.user_id]
        );

        const [result] = await promisePool.query(
            'SELECT @fee_amount as fee_amount, @message as message'
        );

        res.json({
            success: true,
            message: result[0].message,
            data: {
                fee_amount: result[0].fee_amount
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Waive a fee
// @route   POST /api/fees/waive/:bookingFeeId
// @access  Private (Admin)
const waiveFee = async (req, res, next) => {
    try {
        const { bookingFeeId } = req.params;
        const { reason } = req.body;

        // Get fee details
        const [fees] = await promisePool.query(
            `SELECT bf.*, b.branch_id 
             FROM booking_fees bf
             JOIN bookings b ON bf.booking_id = b.booking_id
             WHERE bf.booking_fee_id = ?`,
            [bookingFeeId]
        );

        if (fees.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fee not found'
            });
        }

        const fee = fees[0];

        // Update booking to remove fee
        await promisePool.query(
            `UPDATE bookings 
             SET additional_fees = additional_fees - ?,
                 total_amount = total_amount - ?,
                 outstanding_amount = outstanding_amount - ?
             WHERE booking_id = ?`,
            [fee.fee_amount, fee.fee_amount, fee.fee_amount, fee.booking_id]
        );

        // Delete fee record
        await promisePool.query(
            'DELETE FROM booking_fees WHERE booking_fee_id = ?',
            [bookingFeeId]
        );

        // Log the waiver
        await promisePool.query(
            `INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values)
             VALUES (?, 'WAIVE_FEE', 'booking_fees', ?, ?, ?)`,
            [
                req.user.user_id,
                bookingFeeId,
                JSON.stringify({ fee_amount: fee.fee_amount, fee_type: fee.fee_type }),
                JSON.stringify({ waived: true, reason: reason || 'No reason provided' })
            ]
        );

        res.json({
            success: true,
            message: 'Fee waived successfully',
            data: {
                waived_amount: fee.fee_amount
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get booking fees
// @route   GET /api/fees/booking/:bookingId
// @access  Private
const getBookingFees = async (req, res, next) => {
    try {
        const { bookingId } = req.params;

        const [fees] = await promisePool.query(
            `SELECT * FROM booking_fees WHERE booking_id = ? ORDER BY applied_at DESC`,
            [bookingId]
        );

        res.json({
            success: true,
            count: fees.length,
            data: fees
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getBranchFees,
    createFee,
    updateFee,
    deleteFee,
    applyLateCheckoutFee,
    applyNoShowFee,
    waiveFee,
    getBookingFees
};
