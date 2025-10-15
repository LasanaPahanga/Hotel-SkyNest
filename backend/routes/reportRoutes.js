const express = require('express');
const router = express.Router();
const {
    getRoomOccupancyReport,
    getBillingReport,
    getUnpaidBookingsReport,
    getServiceUsageReport,
    getRevenueReport,
    getMonthlyRevenueReport,
    getTopServicesReport,
    getDashboardStats,
    getGuestHistory
} = require('../controllers/reportController');
const { verifyToken, checkRole } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

router.get('/dashboard', getDashboardStats);
router.get('/occupancy', getRoomOccupancyReport);
router.get('/billing', getBillingReport);
router.get('/unpaid', getUnpaidBookingsReport);
router.get('/services', getServiceUsageReport);
router.get('/revenue', getRevenueReport); // Allow both Admin and Receptionist
router.get('/monthly-revenue', getMonthlyRevenueReport);
router.get('/top-services', getTopServicesReport);
router.get('/guest-history/:guestId', getGuestHistory);

module.exports = router;
