const express = require('express');
const router = express.Router();
const {
    getAllRooms,
    getAvailableRooms,
    getRoom,
    createRoom,
    updateRoom,
    deleteRoom,
    getRoomTypes
} = require('../controllers/roomController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Public routes
router.get('/available', getAvailableRooms);
router.get('/types/all', getRoomTypes);

// Protected routes
router.use(verifyToken);

router.route('/')
    .get(getAllRooms)
    .post(checkRole('Admin'), createRoom);

router.route('/:id')
    .get(getRoom)
    .put(checkRole('Admin'), updateRoom)
    .delete(checkRole('Admin'), deleteRoom);

module.exports = router;
