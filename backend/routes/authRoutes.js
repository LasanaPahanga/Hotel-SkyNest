const express = require('express');
const router = express.Router();
const {
    login,
    register,
    getMe,
    changePassword
} = require('../controllers/authController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', verifyToken, getMe);
router.put('/change-password', verifyToken, changePassword);

// Admin only routes
router.post('/register', verifyToken, checkRole('Admin'), register);

module.exports = router;
