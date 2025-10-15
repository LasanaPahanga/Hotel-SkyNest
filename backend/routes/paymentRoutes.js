const express = require('express');
const router = express.Router();
const {
    getAllPayments,
    getPayment,
    processPayment,
    getBookingPayments,
    updatePayment
} = require('../controllers/paymentController');
const { verifyToken, checkRole } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

router.route('/')
    .get(getAllPayments)
    .post(checkRole('Admin', 'Receptionist'), processPayment); // Allow Admin and Receptionist

router.get('/booking/:bookingId', getBookingPayments);

router.route('/:id')
    .get(getPayment)
    .put(checkRole('Admin'), updatePayment);

module.exports = router;
