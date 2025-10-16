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
router.post('/calculate', calculatePayment);
router.post('/validate-promo', validatePromoCode);
router.get('/breakdown/:bookingId', getBreakdown);
router.get('/summary/:bookingId', getPaymentSummary);
router.post('/process-with-breakdown', checkRole('Admin', 'Receptionist'), processPaymentWithBreakdown);

// Standard payment routes
router.route('/')
    .get(getAllPayments)
    .post(checkRole('Admin', 'Receptionist'), processPayment);

router.get('/booking/:bookingId', getBookingPayments);

router.route('/:id')
    .get(getPayment)
    .put(checkRole('Admin'), updatePayment);

module.exports = router;
