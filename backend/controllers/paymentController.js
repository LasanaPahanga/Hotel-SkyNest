const { promisePool } = require('../config/database');
const { 
    getBookingPaymentSummary,
    calculatePaymentBreakdown: calculateCompletePayment,
    processPayment: processCompletePayment
} = require('../services/completePaymentService');

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

// @desc    Process payment (Quick Payment - Partial or Full)
// @route   POST /api/payments
// @access  Private (Admin, Receptionist)
const processPayment = async (req, res, next) => {
    try {
        const {
            booking_id, amount, payment_method, transaction_reference, notes, promo_code
        } = req.body;
        
        console.log('Payment request:', { booking_id, amount, payment_method, user: req.user.role });
        
        // Validate required fields
        if (!booking_id || !payment_method) {
            return res.status(400).json({
                success: false,
                message: 'Please provide booking_id and payment_method'
            });
        }

        // Use complete payment service (handles partial and full payments)
        const result = await processCompletePayment({
            booking_id,
            amount: amount || null, // null = full payment
            payment_method,
            transaction_id: transaction_reference,
            processed_by: req.user.user_id,
            notes,
            promo_code
        });
        
        console.log('Payment processed successfully:', {
            payment_id: result.payment_id,
            amount: result.payment_amount,
            is_full: result.is_full_payment
        });
        
        res.status(201).json({
            success: true,
            message: result.is_full_payment ? 'Full payment processed successfully' : 'Partial payment processed successfully',
            data: result
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

// @desc    Calculate payment breakdown for booking
// @route   POST /api/payments/calculate
// @access  Private
const calculatePayment = async (req, res, next) => {
    try {
        const { booking_id, promo_code } = req.body;

        console.log('Calculate payment request:', { booking_id, promo_code });

        if (!booking_id) {
            return res.status(400).json({
                success: false,
                message: 'Please provide booking_id'
            });
        }

        // Use complete payment service (includes partial payment tracking)
        const breakdown = await calculateCompletePayment(booking_id, promo_code);

        console.log('Payment breakdown calculated successfully');

        res.json({
            success: true,
            data: breakdown
        });
    } catch (error) {
        console.error('Payment calculation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to calculate payment'
        });
    }
};

// @desc    Get payment breakdown/bill for booking
// @route   GET /api/payments/breakdown/:bookingId
// @access  Private
const getBreakdown = async (req, res, next) => {
    try {
        // Use complete payment service to calculate fresh breakdown
        const breakdown = await calculateCompletePayment(req.params.bookingId);

        res.json({
            success: true,
            data: breakdown
        });
    } catch (error) {
        console.error('Get breakdown error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get payment breakdown'
        });
    }
};

// @desc    Process payment with full breakdown (Payment Gateway Integration)
// @route   POST /api/payments/process-with-breakdown
// @access  Private
const processPaymentWithBreakdownHandler = async (req, res, next) => {
    try {
        const {
            booking_id,
            promo_code,
            payment_method,
            transaction_reference,
            notes
        } = req.body;

        console.log('Process payment with breakdown request:', { booking_id, payment_method });

        if (!booking_id || !payment_method) {
            return res.status(400).json({
                success: false,
                message: 'Please provide booking_id and payment_method'
            });
        }

        // Use complete payment service (pays outstanding amount)
        const result = await processCompletePayment({
            booking_id,
            amount: null, // null = pay outstanding amount
            promo_code,
            payment_method,
            transaction_id: transaction_reference,
            processed_by: req.user.user_id,
            notes
        });

        console.log('Payment processed successfully');

        res.status(201).json({
            success: true,
            message: 'Payment processed successfully',
            data: result
        });

    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to process payment'
        });
    }
};

// @desc    Validate promo code
// @route   POST /api/payments/validate-promo
// @access  Private
const validatePromoCode = async (req, res, next) => {
    try {
        const { booking_id, promo_code } = req.body;

        if (!booking_id || !promo_code) {
            return res.status(400).json({
                success: false,
                message: 'Please provide booking_id and promo_code'
            });
        }

        // Get booking branch
        const [bookings] = await promisePool.query(`
            SELECT branch_id, total_amount 
            FROM bookings 
            WHERE booking_id = ?
        `, [booking_id]);

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const { branch_id, total_amount } = bookings[0];

        // Check promo code
        const [discounts] = await promisePool.query(`
            SELECT 
                discount_config_id, discount_name, discount_type, 
                discount_value, min_booking_amount, max_discount_amount,
                usage_limit, usage_count, valid_from, valid_until
            FROM discount_configurations
            WHERE branch_id = ? 
            AND promo_code = ? 
            AND is_active = TRUE
        `, [branch_id, promo_code]);

        if (discounts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Invalid promo code'
            });
        }

        const discount = discounts[0];

        // Validate conditions
        if (discount.valid_from && new Date(discount.valid_from) > new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Promo code not yet valid'
            });
        }

        if (discount.valid_until && new Date(discount.valid_until) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Promo code has expired'
            });
        }

        if (total_amount < discount.min_booking_amount) {
            return res.status(400).json({
                success: false,
                message: `Minimum booking amount of Rs. ${discount.min_booking_amount} required`
            });
        }

        if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
            return res.status(400).json({
                success: false,
                message: 'Promo code usage limit reached'
            });
        }

        // Calculate discount amount
        let discountAmount = 0;
        if (discount.discount_type === 'Percentage') {
            discountAmount = total_amount * discount.discount_value / 100;
        } else {
            discountAmount = discount.discount_value;
        }

        if (discount.max_discount_amount && discountAmount > discount.max_discount_amount) {
            discountAmount = discount.max_discount_amount;
        }

        res.json({
            success: true,
            message: 'Promo code is valid',
            data: {
                discount_name: discount.discount_name,
                discount_type: discount.discount_type,
                discount_value: discount.discount_value,
                discount_amount: parseFloat(discountAmount.toFixed(2))
            }
        });

    } catch (error) {
        console.error('Promo validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate promo code'
        });
    }
};

// @desc    Get payment summary for booking
// @route   GET /api/payments/summary/:bookingId
// @access  Private
const getPaymentSummary = async (req, res, next) => {
    try {
        const summary = await getBookingPaymentSummary(req.params.bookingId);

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Get payment summary error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get payment summary'
        });
    }
};

module.exports = {
    getAllPayments,
    getPayment,
    processPayment,
    getBookingPayments,
    updatePayment,
    calculatePayment,
    getBreakdown,
    processPaymentWithBreakdown: processPaymentWithBreakdownHandler,
    validatePromoCode,
    getPaymentSummary
};
