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

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     tags: [Bookings]
 *     summary: Get all bookings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 *   post:
 *     tags: [Bookings]
 *     summary: Create new booking
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - guest_id
 *               - room_id
 *               - check_in_date
 *               - check_out_date
 *             properties:
 *               guest_id:
 *                 type: integer
 *               room_id:
 *                 type: integer
 *               check_in_date:
 *                 type: string
 *                 format: date
 *               check_out_date:
 *                 type: string
 *                 format: date
 *               number_of_guests:
 *                 type: integer
 *               special_requests:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 */
router.route('/')
    .get(getAllBookings)
    .post(createBooking);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get booking by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking details
 *       404:
 *         description: Booking not found
 */
router.route('/:id')
    .get(getBooking)
    .put(checkRole('Admin', 'Receptionist'), updateBooking);

/**
 * @swagger
 * /api/bookings/{id}/checkin:
 *   put:
 *     tags: [Bookings]
 *     summary: Check in guest
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Guest checked in successfully
 */
router.put('/:id/checkin', checkRole('Admin', 'Receptionist'), checkInGuest);

/**
 * @swagger
 * /api/bookings/{id}/checkout:
 *   put:
 *     tags: [Bookings]
 *     summary: Check out guest
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Guest checked out successfully
 */
router.put('/:id/checkout', checkRole('Admin', 'Receptionist'), checkOutGuest);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   put:
 *     tags: [Bookings]
 *     summary: Cancel booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 */
router.put('/:id/cancel', cancelBooking);

module.exports = router;
