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
router.get('/taxes/:branchId', verifyToken, checkRole('Admin', 'Receptionist'), getBranchTaxes);
router.post('/taxes', verifyToken, checkRole('Admin', 'Receptionist'), createTax);
router.put('/taxes/:id', verifyToken, checkRole('Admin', 'Receptionist'), updateTax);
router.delete('/taxes/:id', verifyToken, checkRole('Admin'), deleteTax);

// Discount routes
router.get('/discounts/:branchId', verifyToken, checkRole('Admin', 'Receptionist'), getBranchDiscounts);
router.post('/discounts', verifyToken, checkRole('Admin', 'Receptionist'), createDiscount);
router.put('/discounts/:id', verifyToken, checkRole('Admin', 'Receptionist'), updateDiscount);
router.delete('/discounts/:id', verifyToken, checkRole('Admin'), deleteDiscount);

// Promo code validation (public for guests to use)
router.post('/validate-promo', validatePromoCode);

module.exports = router;
