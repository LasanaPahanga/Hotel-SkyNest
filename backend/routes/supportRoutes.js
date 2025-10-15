const express = require('express');
const router = express.Router();
const {
    createTicket,
    getMyTickets,
    getTicketById,
    getAllTickets,
    addResponse,
    updateTicket
} = require('../controllers/supportController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken);

// Guest routes
router.post('/tickets', checkRole('Guest'), createTicket);
router.get('/tickets/my', checkRole('Guest'), getMyTickets);

// Staff routes
router.get('/tickets', checkRole('Admin', 'Receptionist'), getAllTickets);
router.put('/tickets/:id', checkRole('Admin', 'Receptionist'), updateTicket);

// Shared routes (guests can view their own, staff can view all)
router.get('/tickets/:id', getTicketById);
router.post('/tickets/:id/responses', addResponse);

module.exports = router;
