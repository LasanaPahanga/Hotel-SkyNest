const { promisePool } = require('../config/database');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
const getAllPayments = async (req, res, next) => {
    try {
        const { booking_id, status, start_date, end_date, branch_id } = req.query;
        const userRole = req.user.role;
        const userBranchId = req.user.branch_id;
        
        let query = `
            SELECT 
                p.*,
                b.booking_id, b.total_amount as booking_total, b.branch_id,
                CONCAT(g.first_name, ' ', g.last_name) as guest_name,
                u.full_name as processed_by_name,
                br.branch_name
            FROM payments p
            JOIN bookings b ON p.booking_id = b.booking_id
            JOIN guests g ON b.guest_id = g.guest_id
            LEFT JOIN users u ON p.processed_by = u.user_id
            LEFT JOIN hotel_branches br ON b.branch_id = br.branch_id
            WHERE 1=1
        `;
        
        const params = [];
        
        // Receptionist can only see payments from their branch
        if (userRole === 'Receptionist') {
            query += ' AND b.branch_id = ?';
            params.push(userBranchId);
        } else if (branch_id) {
            // Admin can filter by branch
            query += ' AND b.branch_id = ?';
            params.push(branch_id);
        }
        
        if (booking_id) {
            query += ' AND p.booking_id = ?';
            params.push(booking_id);
        }
        
        if (status) {
            query += ' AND p.payment_status = ?';
            params.push(status);
        }
        
        if (start_date) {
            query += ' AND DATE(p.payment_date) >= ?';
            params.push(start_date);
        }
        
        if (end_date) {
            query += ' AND DATE(p.payment_date) <= ?';
            params.push(end_date);
        }
        
        query += ' ORDER BY p.payment_date DESC';
        
        const [payments] = await promisePool.query(query, params);
        
        res.json({
            success: true,
            count: payments.length,
            data: payments
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
const getPayment = async (req, res, next) => {
    try {
        const userRole = req.user.role;
        const userBranchId = req.user.branch_id;
        
        let query = `
            SELECT 
                p.*,
                b.booking_id, b.total_amount, b.paid_amount, b.outstanding_amount, b.branch_id,
                CONCAT(g.first_name, ' ', g.last_name) as guest_name,
                u.full_name as processed_by_name,
                br.branch_name
            FROM payments p
            JOIN bookings b ON p.booking_id = b.booking_id
            JOIN guests g ON b.guest_id = g.guest_id
            LEFT JOIN users u ON p.processed_by = u.user_id
            LEFT JOIN hotel_branches br ON b.branch_id = br.branch_id
            WHERE p.payment_id = ?
        `;
        
        const params = [req.params.id];
        
        // Receptionist can only see payments from their branch
        if (userRole === 'Receptionist') {
            query += ' AND b.branch_id = ?';
            params.push(userBranchId);
        }
        
        const [payments] = await promisePool.query(query, params);
        
        if (payments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }
        
        res.json({
            success: true,
            data: payments[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Process payment
// @route   POST /api/payments
// @access  Private (Admin, Receptionist)
const processPayment = async (req, res, next) => {
    try {
        const {
            booking_id, amount, payment_method, transaction_reference, notes
        } = req.body;
        
        // Validate required fields
        if (!booking_id || !amount || !payment_method) {
            return res.status(400).json({
                success: false,
                message: 'Please provide booking_id, amount, and payment_method'
            });
        }

        // Validate amount is positive
        if (parseFloat(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Payment amount must be greater than zero'
            });
        }
        
        // Call stored procedure
        await promisePool.query(
            `CALL process_payment(?, ?, ?, ?, ?, @payment_id, @error_message)`,
            [
                parseInt(booking_id), 
                parseFloat(amount), 
                payment_method, 
                transaction_reference || null, 
                req.user.user_id
            ]
        );
        
        // Get output parameters
        const [output] = await promisePool.query(
            'SELECT @payment_id as payment_id, @error_message as error_message'
        );
        
        // Check for errors from stored procedure
        if (output[0].error_message) {
            return res.status(400).json({
                success: false,
                message: output[0].error_message
            });
        }

        // Check if payment was created
        if (!output[0].payment_id) {
            return res.status(500).json({
                success: false,
                message: 'Payment processing failed. Please try again.'
            });
        }
        
        // Add notes if provided
        if (notes) {
            await promisePool.query(
                'UPDATE payments SET notes = ? WHERE payment_id = ?',
                [notes, output[0].payment_id]
            );
        }
        
        res.status(201).json({
            success: true,
            message: 'Payment processed successfully',
            data: {
                payment_id: output[0].payment_id
            }
        });
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to process payment'
        });
    }
};

// @desc    Get payments for booking
// @route   GET /api/payments/booking/:bookingId
// @access  Private
const getBookingPayments = async (req, res, next) => {
    try {
        const [payments] = await promisePool.query(
            `SELECT 
                p.*,
                u.full_name as processed_by_name
            FROM payments p
            LEFT JOIN users u ON p.processed_by = u.user_id
            WHERE p.booking_id = ?
            ORDER BY p.payment_date DESC`,
            [req.params.bookingId]
        );
        
        res.json({
            success: true,
            count: payments.length,
            data: payments
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update payment status
// @route   PUT /api/payments/:id
// @access  Private (Admin)
const updatePayment = async (req, res, next) => {
    try {
        const { payment_status, notes } = req.body;
        
        const updates = [];
        const params = [];
        
        if (payment_status) {
            updates.push('payment_status = ?');
            params.push(payment_status);
        }
        
        if (notes !== undefined) {
            updates.push('notes = ?');
            params.push(notes);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }
        
        params.push(req.params.id);
        
        await promisePool.query(
            `UPDATE payments SET ${updates.join(', ')} WHERE payment_id = ?`,
            params
        );
        
        res.json({
            success: true,
            message: 'Payment updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllPayments,
    getPayment,
    processPayment,
    getBookingPayments,
    updatePayment
};
