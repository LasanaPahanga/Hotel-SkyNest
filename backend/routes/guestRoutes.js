const express = require('express');
const router = express.Router();
const {
    getAllGuests,
    getGuest,
    createGuest,
    updateGuest,
    deleteGuest,
    getMyProfile,
    updateMyProfile
} = require('../controllers/guestController');
const { verifyToken, checkRole } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Guest profile routes (must be before /:id routes)
/**
 * @swagger
 * /api/guests/me:
 *   get:
 *     tags: [Guests]
 *     summary: Get my profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Guest profile
 *   put:
 *     tags: [Guests]
 *     summary: Update my profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.route('/me')
    .get(getMyProfile)
    .put(updateMyProfile);

/**
 * @swagger
 * /api/guests:
 *   get:
 *     tags: [Guests]
 *     summary: Get all guests
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of guests
 *   post:
 *     tags: [Guests]
 *     summary: Create new guest
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *               - phone
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               id_number:
 *                 type: string
 *     responses:
 *       201:
 *         description: Guest created successfully
 */
router.route('/')
    .get(getAllGuests)
    .post(createGuest);

/**
 * @swagger
 * /api/guests/{id}:
 *   get:
 *     tags: [Guests]
 *     summary: Get guest by ID
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
 *         description: Guest details
 *   put:
 *     tags: [Guests]
 *     summary: Update guest
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
 *         description: Guest updated successfully
 *   delete:
 *     tags: [Guests]
 *     summary: Delete guest (Admin only)
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
 *         description: Guest deleted successfully
 */
router.route('/:id')
    .get(getGuest)
    .put(updateGuest)
    .delete(checkRole('Admin'), deleteGuest);

module.exports = router;
