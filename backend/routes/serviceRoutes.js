const express = require('express');
const router = express.Router();
const {
    getAllServices,
    getService,
    createService,
    updateService,
    deleteService,
    addServiceUsage,
    getServiceUsage,
    deleteServiceUsage,
    getBranchServices,
    toggleBranchService,
    setBranchServicePrice
} = require('../controllers/serviceController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Protected routes - require authentication
router.use(verifyToken);

// Branch-specific service routes (MUST come before /:id routes)
/**
 * @swagger
 * /api/services/branch/{branchId}:
 *   get:
 *     tags: [Services]
 *     summary: Get services for a branch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of branch services
 */
router.get('/branch/:branchId', getBranchServices);
router.put('/branch/:branchId/toggle/:serviceId', checkRole('Admin', 'Receptionist'), toggleBranchService);
router.put('/branch/:branchId/price/:serviceId', checkRole('Admin', 'Receptionist'), setBranchServicePrice);

// Service usage routes (MUST come before /:id routes)
/**
 * @swagger
 * /api/services/usage:
 *   post:
 *     tags: [Services]
 *     summary: Add service usage to booking
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - booking_id
 *               - service_id
 *               - quantity
 *             properties:
 *               booking_id:
 *                 type: integer
 *               service_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Service usage added successfully
 */
router.post('/usage', addServiceUsage);
/**
 * @swagger
 * /api/services/usage/{bookingId}:
 *   get:
 *     tags: [Services]
 *     summary: Get service usage for a booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Service usage list
 */
router.get('/usage/:bookingId', getServiceUsage);
router.delete('/usage/:id', checkRole('Admin', 'Receptionist'), deleteServiceUsage);

// Service catalogue routes (MUST come last to avoid conflicts)
/**
 * @swagger
 * /api/services:
 *   get:
 *     tags: [Services]
 *     summary: Get all services
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of services
 *   post:
 *     tags: [Services]
 *     summary: Create new service (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - service_name
 *               - service_category
 *               - base_price
 *             properties:
 *               service_name:
 *                 type: string
 *               service_category:
 *                 type: string
 *               base_price:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Service created successfully
 */
router.get('/', getAllServices);
/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     tags: [Services]
 *     summary: Get service by ID
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
 *         description: Service details
 */
router.get('/:id', getService);
router.post('/', checkRole('Admin'), createService);
router.put('/:id', checkRole('Admin'), updateService);
router.delete('/:id', checkRole('Admin'), deleteService);

module.exports = router;
