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
router.route('/me')
    .get(getMyProfile)
    .put(updateMyProfile);

router.route('/')
    .get(getAllGuests)
    .post(createGuest);

router.route('/:id')
    .get(getGuest)
    .put(updateGuest)
    .delete(checkRole('Admin'), deleteGuest);

module.exports = router;
