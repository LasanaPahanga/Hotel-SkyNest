const express = require('express');
const router = express.Router();
const {
    getBranchTaxes,
    createTax,
    updateTax,
    deleteTax,
    getBranchDiscounts,
    createDiscount,
    updateDiscount,
    deleteDiscount,
    validatePromoCode
} = require('../controllers/taxDiscountController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Tax routes
/**
 * @swagger
 * /api/tax-discount/taxes/{branchId}:
 *   get:
 *     tags: [Tax & Discount]
 *     summary: Get taxes for a branch
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
 *         description: List of taxes
 */
router.get('/taxes/:branchId', verifyToken, checkRole('Admin', 'Receptionist'), getBranchTaxes);
/**
 * @swagger
 * /api/tax-discount/taxes:
 *   post:
 *     tags: [Tax & Discount]
 *     summary: Create new tax
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
 *               - tax_name
 *               - tax_type
 *               - tax_rate
 *             properties:
 *               branch_id:
 *                 type: integer
 *               tax_name:
 *                 type: string
 *               tax_type:
 *                 type: string
 *                 enum: [Percentage, Fixed Amount]
 *               tax_rate:
 *                 type: number
 *     responses:
 *       201:
 *         description: Tax created successfully
 */
router.post('/taxes', verifyToken, checkRole('Admin', 'Receptionist'), createTax);
router.put('/taxes/:id', verifyToken, checkRole('Admin', 'Receptionist'), updateTax);
router.delete('/taxes/:id', verifyToken, checkRole('Admin'), deleteTax);

// Discount routes
/**
 * @swagger
 * /api/tax-discount/discounts/{branchId}:
 *   get:
 *     tags: [Tax & Discount]
 *     summary: Get discounts for a branch
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
 *         description: List of discounts
 */
router.get('/discounts/:branchId', verifyToken, checkRole('Admin', 'Receptionist'), getBranchDiscounts);
/**
 * @swagger
 * /api/tax-discount/discounts:
 *   post:
 *     tags: [Tax & Discount]
 *     summary: Create new discount
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
 *               - discount_name
 *               - discount_type
 *               - discount_value
 *             properties:
 *               branch_id:
 *                 type: integer
 *               discount_name:
 *                 type: string
 *               discount_type:
 *                 type: string
 *                 enum: [Percentage, Fixed Amount]
 *               discount_value:
 *                 type: number
 *               promo_code:
 *                 type: string
 *     responses:
 *       201:
 *         description: Discount created successfully
 */
router.post('/discounts', verifyToken, checkRole('Admin', 'Receptionist'), createDiscount);
router.put('/discounts/:id', verifyToken, checkRole('Admin', 'Receptionist'), updateDiscount);
router.delete('/discounts/:id', verifyToken, checkRole('Admin'), deleteDiscount);

// Promo code validation (public for guests to use)
router.post('/validate-promo', validatePromoCode);

module.exports = router;
