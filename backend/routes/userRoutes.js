const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    resetPassword
} = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/auth');

// All routes require authentication and Admin role
router.use(verifyToken);
router.use(checkRole('Admin'));

router.route('/')
    .get(getAllUsers);

router.route('/:id')
    .get(getUserById)
    .put(updateUser)
    .delete(deleteUser);

router.put('/:id/reset-password', resetPassword);

module.exports = router;
