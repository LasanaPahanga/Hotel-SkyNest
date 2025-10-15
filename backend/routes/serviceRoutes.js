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
router.get('/branch/:branchId', getBranchServices);
router.put('/branch/:branchId/toggle/:serviceId', checkRole('Admin', 'Receptionist'), toggleBranchService);
router.put('/branch/:branchId/price/:serviceId', checkRole('Admin', 'Receptionist'), setBranchServicePrice);

// Service usage routes (MUST come before /:id routes)
router.post('/usage', addServiceUsage);
router.get('/usage/:bookingId', getServiceUsage);
router.delete('/usage/:id', checkRole('Admin', 'Receptionist'), deleteServiceUsage);

// Service catalogue routes (MUST come last to avoid conflicts)
router.get('/', getAllServices);
router.get('/:id', getService);
router.post('/', checkRole('Admin'), createService);
router.put('/:id', checkRole('Admin'), updateService);
router.delete('/:id', checkRole('Admin'), deleteService);

module.exports = router;
