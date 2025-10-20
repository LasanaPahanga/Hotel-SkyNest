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

/**
 * @swagger
 * /api/reports/dashboard:
 *   get:
 *     tags: [Reports]
 *     summary: Get dashboard statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.get('/dashboard', getDashboardStats);
/**
 * @swagger
 * /api/reports/occupancy:
 *   get:
 *     tags: [Reports]
 *     summary: Get room occupancy report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Occupancy report
 */
router.get('/occupancy', getRoomOccupancyReport);
router.get('/billing', getBillingReport);
router.get('/unpaid', getUnpaidBookingsReport);
router.get('/services', getServiceUsageReport);
/**
 * @swagger
 * /api/reports/revenue:
 *   get:
 *     tags: [Reports]
 *     summary: Get revenue report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Revenue report
 */
router.get('/revenue', getRevenueReport); // Allow both Admin and Receptionist
/**
 * @swagger
 * /api/reports/monthly-revenue:
 *   get:
 *     tags: [Reports]
 *     summary: Get monthly revenue report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Monthly revenue data
 */
router.get('/monthly-revenue', getMonthlyRevenueReport);
/**
 * @swagger
 * /api/reports/top-services:
 *   get:
 *     tags: [Reports]
 *     summary: Get top services by revenue
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Top services report
 */
router.get('/top-services', getTopServicesReport);
router.get('/guest-history/:guestId', getGuestHistory);

module.exports = router;
