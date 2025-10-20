const express = require('express');
const router = express.Router();
const {
    getAllPayments,
    getPayment,
    processPayment,
    getBookingPayments,
    updatePayment,
    calculatePayment,
    getBreakdown,
    processPaymentWithBreakdown,
    validatePromoCode,
    getPaymentSummary
} = require('../controllers/paymentController');
const { verifyToken, checkRole } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Payment calculation and breakdown routes
/**
 * @swagger
 * /api/payments/calculate:
 *   post:
 *     tags: [Payments]
 *     summary: Calculate payment amount
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - booking_id
 *             properties:
 *               booking_id:
 *                 type: integer
 *               promo_code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment calculation
 */
router.post('/calculate', calculatePayment);
router.post('/validate-promo', validatePromoCode);
/**
 * @swagger
 * /api/payments/breakdown/{bookingId}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment breakdown for booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment breakdown details
 */
router.get('/breakdown/:bookingId', getBreakdown);
router.get('/summary/:bookingId', getPaymentSummary);
router.post('/process-with-breakdown', checkRole('Admin', 'Receptionist'), processPaymentWithBreakdown);

// Standard payment routes
/**
 * @swagger
 * /api/payments:
 *   get:
 *     tags: [Payments]
 *     summary: Get all payments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payments
 *   post:
 *     tags: [Payments]
 *     summary: Process payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - booking_id
 *               - amount
 *               - payment_method
 *             properties:
 *               booking_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *               payment_method:
 *                 type: string
 *                 enum: [Cash, Credit Card, Debit Card, Bank Transfer]
 *               transaction_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment processed successfully
 */
router.route('/')
    .get(getAllPayments)
    .post(checkRole('Admin', 'Receptionist'), processPayment);

/**
 * @swagger
 * /api/payments/booking/{bookingId}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payments for a booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of booking payments
 */
router.get('/booking/:bookingId', getBookingPayments);

router.route('/:id')
    .get(getPayment)
    .put(checkRole('Admin'), updatePayment);

module.exports = router;
