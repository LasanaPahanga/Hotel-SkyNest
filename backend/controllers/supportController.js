const { promisePool } = require('../config/database');

// @desc    Create support ticket
// @route   POST /api/support/tickets
// @access  Private (Guest)
const createTicket = async (req, res, next) => {
    try {
        const { booking_id, subject, message, priority } = req.body;
        const guest_id = req.user.guest_id;

        if (!guest_id) {
            return res.status(400).json({
                success: false,
                message: 'Guest ID not found. Please ensure you are logged in as a guest.'
            });
        }

        await promisePool.query(
            'CALL create_support_ticket(?, ?, ?, ?, ?, @ticket_id, @error_message)',
            [guest_id, booking_id || null, subject, message, priority || 'Medium']
        );

        const [output] = await promisePool.query(
            'SELECT @ticket_id as ticket_id, @error_message as error_message'
        );

        if (output[0].error_message) {
            return res.status(400).json({
                success: false,
                message: output[0].error_message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Support ticket created successfully',
            data: { ticket_id: output[0].ticket_id }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get my tickets
// @route   GET /api/support/tickets/my
// @access  Private (Guest)
const getMyTickets = async (req, res, next) => {
    try {
        const guest_id = req.user.guest_id;

        if (!guest_id) {
            return res.status(400).json({
                success: false,
                message: 'Guest ID not found'
            });
        }

        const [tickets] = await promisePool.query(
            `SELECT t.*, 
                    (SELECT COUNT(*) FROM ticket_responses WHERE ticket_id = t.ticket_id) as response_count
             FROM support_tickets t
             WHERE t.guest_id = ?
             ORDER BY t.created_at DESC`,
            [guest_id]
        );

        res.json({
            success: true,
            data: tickets
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get ticket by ID
// @route   GET /api/support/tickets/:id
// @access  Private (Guest - own tickets, Staff - all)
const getTicketById = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        let query = `
            SELECT t.*, CONCAT(g.first_name, ' ', g.last_name) as guest_name, g.email as guest_email,
                   b.booking_id, r.room_number, br.branch_name
            FROM support_tickets t
            JOIN guests g ON t.guest_id = g.guest_id
            LEFT JOIN bookings b ON t.booking_id = b.booking_id
            LEFT JOIN rooms r ON b.room_id = r.room_id
            LEFT JOIN hotel_branches br ON b.branch_id = br.branch_id
            WHERE t.ticket_id = ?
        `;
        const params = [id];

        // If guest, only show their own tickets
        if (req.user.role === 'Guest') {
            query += ' AND t.guest_id = ?';
            params.push(req.user.guest_id);
        }

        const [tickets] = await promisePool.query(query, params);

        if (tickets.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        // Get responses
        const [responses] = await promisePool.query(
            `SELECT r.*, 
                    u.full_name as user_name,
                    CONCAT(g.first_name, ' ', g.last_name) as guest_name
             FROM ticket_responses r
             LEFT JOIN users u ON r.user_id = u.user_id
             LEFT JOIN guests g ON r.guest_id = g.guest_id
             WHERE r.ticket_id = ?
             ORDER BY r.created_at ASC`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ticket: tickets[0],
                responses: responses
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all tickets (Admin/Receptionist)
// @route   GET /api/support/tickets
// @access  Private (Admin, Receptionist)
const getAllTickets = async (req, res, next) => {
    try {
        const { status, priority } = req.query;
        let query = `
            SELECT t.*, CONCAT(g.first_name, ' ', g.last_name) as guest_name, g.email as guest_email,
                   b.booking_id, r.room_number, br.branch_name,
                   (SELECT COUNT(*) FROM ticket_responses WHERE ticket_id = t.ticket_id) as response_count
            FROM support_tickets t
            JOIN guests g ON t.guest_id = g.guest_id
            LEFT JOIN bookings b ON t.booking_id = b.booking_id
            LEFT JOIN rooms r ON b.room_id = r.room_id
            LEFT JOIN hotel_branches br ON b.branch_id = br.branch_id
            WHERE 1=1
        `;
        const params = [];

        // Branch filtering for receptionists
        if (req.user.role === 'Receptionist') {
            query += ' AND (b.branch_id = ? OR b.branch_id IS NULL)';
            params.push(req.user.branch_id);
        }

        if (status) {
            query += ' AND t.status = ?';
            params.push(status);
        }

        if (priority) {
            query += ' AND t.priority = ?';
            params.push(priority);
        }

        query += ' ORDER BY t.created_at DESC';

        const [tickets] = await promisePool.query(query, params);

        res.json({
            success: true,
            data: tickets
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add response to ticket
// @route   POST /api/support/tickets/:id/responses
// @access  Private
const addResponse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        
        const user_id = req.user.role !== 'Guest' ? req.user.user_id : null;
        const guest_id = req.user.role === 'Guest' ? req.user.guest_id : null;
        const is_staff_response = req.user.role !== 'Guest';

        await promisePool.query(
            'CALL add_ticket_response(?, ?, ?, ?, ?, @response_id, @error_message)',
            [id, user_id, guest_id, message, is_staff_response]
        );

        const [output] = await promisePool.query(
            'SELECT @response_id as response_id, @error_message as error_message'
        );

        if (output[0].error_message) {
            return res.status(400).json({
                success: false,
                message: output[0].error_message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Response added successfully',
            data: { response_id: output[0].response_id }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update ticket status
// @route   PUT /api/support/tickets/:id
// @access  Private (Admin, Receptionist)
const updateTicket = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, priority, assigned_to } = req.body;

        const updates = [];
        const params = [];

        if (status) {
            updates.push('status = ?');
            params.push(status);
        }

        if (priority) {
            updates.push('priority = ?');
            params.push(priority);
        }

        if (assigned_to !== undefined) {
            updates.push('assigned_to = ?');
            params.push(assigned_to);
        }

        if (status === 'Resolved' || status === 'Closed') {
            updates.push('resolved_at = NOW()');
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No updates provided'
            });
        }

        params.push(id);

        await promisePool.query(
            `UPDATE support_tickets SET ${updates.join(', ')} WHERE ticket_id = ?`,
            params
        );

        res.json({
            success: true,
            message: 'Ticket updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTicket,
    getMyTickets,
    getTicketById,
    getAllTickets,
    addResponse,
    updateTicket
};
