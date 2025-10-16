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
router.get('/:branchId', verifyToken, checkRole('Admin', 'Receptionist'), getBranchFees);
router.post('/', verifyToken, checkRole('Admin', 'Receptionist'), createFee);
router.put('/:id', verifyToken, checkRole('Admin', 'Receptionist'), updateFee);
router.delete('/:id', verifyToken, checkRole('Admin'), deleteFee);

// Fee application routes
router.post('/apply-late-checkout', verifyToken, checkRole('Admin', 'Receptionist'), applyLateCheckoutFee);
router.post('/apply-no-show', verifyToken, checkRole('Admin', 'Receptionist'), applyNoShowFee);
router.post('/waive/:bookingFeeId', verifyToken, checkRole('Admin'), waiveFee);

// Get booking fees
router.get('/booking/:bookingId', verifyToken, getBookingFees);

module.exports = router;
