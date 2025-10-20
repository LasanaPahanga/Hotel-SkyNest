const express = require('express');
const router = express.Router();
const {
    getBranchFees,
    createFee,
    updateFee,
    deleteFee,
    applyLateCheckoutFee,
    applyNoShowFee,
    waiveFee,
    getBookingFees
} = require('../controllers/feeController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Fee configuration routes
/**
 * @swagger
 * /api/fees/{branchId}:
 *   get:
 *     tags: [Fees]
 *     summary: Get fees for a branch
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
 *         description: List of fees
 */
router.get('/:branchId', verifyToken, checkRole('Admin', 'Receptionist'), getBranchFees);
/**
 * @swagger
 * /api/fees:
 *   post:
 *     tags: [Fees]
 *     summary: Create new fee
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branch_id
 *               - fee_type
 *               - fee_calculation
 *               - fee_value
 *             properties:
 *               branch_id:
 *                 type: integer
 *               fee_type:
 *                 type: string
 *                 enum: [Late Checkout, No Show, Cancellation, Damage]
 *               fee_calculation:
 *                 type: string
 *                 enum: [Fixed Amount, Percentage, Per Hour]
 *               fee_value:
 *                 type: number
 *     responses:
 *       201:
 *         description: Fee created successfully
 */
router.post('/', verifyToken, checkRole('Admin', 'Receptionist'), createFee);
router.put('/:id', verifyToken, checkRole('Admin', 'Receptionist'), updateFee);
router.delete('/:id', verifyToken, checkRole('Admin'), deleteFee);

// Fee application routes
/**
 * @swagger
 * /api/fees/apply-late-checkout:
 *   post:
 *     tags: [Fees]
 *     summary: Apply late checkout fee to booking
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
 *               - hours
 *             properties:
 *               booking_id:
 *                 type: integer
 *               hours:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Fee applied successfully
 */
router.post('/apply-late-checkout', verifyToken, checkRole('Admin', 'Receptionist'), applyLateCheckoutFee);
router.post('/apply-no-show', verifyToken, checkRole('Admin', 'Receptionist'), applyNoShowFee);
router.post('/waive/:bookingFeeId', verifyToken, checkRole('Admin'), waiveFee);

// Get booking fees
/**
 * @swagger
 * /api/fees/booking/{bookingId}:
 *   get:
 *     tags: [Fees]
 *     summary: Get fees for a booking
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
 *         description: List of booking fees
 */
router.get('/booking/:bookingId', verifyToken, getBookingFees);

module.exports = router;
