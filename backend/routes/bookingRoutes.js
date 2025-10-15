const express = require('express');
const router = express.Router();
const {
    getAllBookings,
    getBooking,
    createBooking,
    checkInGuest,
    checkOutGuest,
    cancelBooking,
    updateBooking
} = require('../controllers/bookingController');
const { verifyToken, checkRole } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

router.route('/')
    .get(getAllBookings)
    .post(createBooking);

router.route('/:id')
    .get(getBooking)
    .put(checkRole('Admin', 'Receptionist'), updateBooking);

router.put('/:id/checkin', checkRole('Admin', 'Receptionist'), checkInGuest);
router.put('/:id/checkout', checkRole('Admin', 'Receptionist'), checkOutGuest);
router.put('/:id/cancel', cancelBooking);

module.exports = router;
