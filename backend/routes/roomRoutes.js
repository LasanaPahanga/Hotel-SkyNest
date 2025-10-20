const express = require('express');
const router = express.Router();
const {
    getAllRooms,
    getAvailableRooms,
    getRoom,
    createRoom,
    updateRoom,
    deleteRoom,
    getRoomTypes,
    getRoomWithGuest
} = require('../controllers/roomController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Public routes
/**
 * @swagger
 * /api/rooms/available:
 *   get:
 *     tags: [Rooms]
 *     summary: Get available rooms
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: check_in_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: check_out_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: guests
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of available rooms
 */
router.get('/available', getAvailableRooms);
/**
 * @swagger
 * /api/rooms/types/all:
 *   get:
 *     tags: [Rooms]
 *     summary: Get all room types
 *     responses:
 *       200:
 *         description: List of room types
 */
router.get('/types/all', getRoomTypes);

// Protected routes
router.use(verifyToken);

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     tags: [Rooms]
 *     summary: Get all rooms
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all rooms
 *   post:
 *     tags: [Rooms]
 *     summary: Create new room (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - room_number
 *               - room_type_id
 *               - branch_id
 *               - floor_number
 *             properties:
 *               room_number:
 *                 type: string
 *               room_type_id:
 *                 type: integer
 *               branch_id:
 *                 type: integer
 *               floor_number:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [Available, Occupied, Reserved, Maintenance]
 *     responses:
 *       201:
 *         description: Room created successfully
 */
router.route('/')
    .get(getAllRooms)
    .post(checkRole('Admin'), createRoom);

router.get('/:id/details', checkRole('Admin', 'Receptionist'), getRoomWithGuest);

/**
 * @swagger
 * /api/rooms/{id}:
 *   get:
 *     tags: [Rooms]
 *     summary: Get room by ID
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
 *         description: Room details
 *   put:
 *     tags: [Rooms]
 *     summary: Update room (Admin only)
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
 *         description: Room updated successfully
 *   delete:
 *     tags: [Rooms]
 *     summary: Delete room (Admin only)
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
 *         description: Room deleted successfully
 */
router.route('/:id')
    .get(getRoom)
    .put(checkRole('Admin'), updateRoom)
    .delete(checkRole('Admin'), deleteRoom);

module.exports = router;
