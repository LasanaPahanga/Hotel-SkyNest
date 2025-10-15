const express = require('express');
const router = express.Router();
const {
    createServiceRequest,
    getServiceRequests,
    getServiceRequest,
    reviewServiceRequest,
    cancelServiceRequest,
    getPendingCount
} = require('../controllers/serviceRequestController');
const { verifyToken, checkRole } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Guest routes
router.post('/', checkRole('Guest'), createServiceRequest);
router.delete('/:id', checkRole('Guest'), cancelServiceRequest);

// Receptionist/Admin routes
router.get('/pending/count', checkRole('Receptionist', 'Admin'), getPendingCount);
router.put('/:id/review', checkRole('Receptionist', 'Admin'), reviewServiceRequest);

// Shared routes
router.get('/', getServiceRequests);
router.get('/:id', getServiceRequest);

module.exports = router;
