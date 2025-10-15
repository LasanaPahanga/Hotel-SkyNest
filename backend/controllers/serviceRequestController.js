const { promisePool } = require('../config/database');

// @desc    Create a service request (Guest)
// @route   POST /api/service-requests
// @access  Private (Guest)
const createServiceRequest = async (req, res, next) => {
    try {
        const { booking_id, service_id, quantity, request_notes } = req.body;
        const guest_id = req.user.guest_id;

        // Validate guest has an active booking
        const [booking] = await promisePool.query(
            `SELECT b.*, r.branch_id 
             FROM bookings b 
             JOIN rooms r ON b.room_id = r.room_id
             WHERE b.booking_id = ? AND b.guest_id = ? AND b.booking_status = 'Checked-In'`,
            [booking_id, guest_id]
        );

        if (booking.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No active booking found or booking does not belong to you'
            });
        }

        const branch_id = booking[0].branch_id;

        // Check if service is available at this branch
        const [service] = await promisePool.query(
            `SELECT sc.*, bs.is_available 
             FROM service_catalogue sc
             LEFT JOIN branch_services bs ON sc.service_id = bs.service_id AND bs.branch_id = ?
             WHERE sc.service_id = ?`,
            [branch_id, service_id]
        );

        if (service.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        // Check if service is available (if branch_services entry exists)
        if (service[0].is_available === 0) {
            return res.status(400).json({
                success: false,
                message: 'This service is currently unavailable at your branch'
            });
        }

        // Create service request
        const [result] = await promisePool.query(
            `INSERT INTO service_requests 
             (booking_id, guest_id, service_id, branch_id, quantity, request_notes) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [booking_id, guest_id, service_id, branch_id, quantity || 1, request_notes || null]
        );

        // Get the created request with details
        const [newRequest] = await promisePool.query(
            'SELECT * FROM service_requests_view WHERE request_id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Service request submitted successfully. Waiting for receptionist approval.',
            data: newRequest[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all service requests (filtered by role)
// @route   GET /api/service-requests
// @access  Private
const getServiceRequests = async (req, res, next) => {
    try {
        const { status, booking_id } = req.query;
        const userRole = req.user.role;
        const guestId = req.user.guest_id;
        const branchId = req.user.branch_id;

        let query = 'SELECT * FROM service_requests_view WHERE 1=1';
        const params = [];

        // Filter by role
        if (userRole === 'Guest') {
            query += ' AND guest_id = ?';
            params.push(guestId);
        } else if (userRole === 'Receptionist') {
            query += ' AND branch_id = ?';
            params.push(branchId);
        }
        // Admin sees all

        // Additional filters
        if (status) {
            query += ' AND request_status = ?';
            params.push(status);
        }

        if (booking_id) {
            query += ' AND booking_id = ?';
            params.push(booking_id);
        }

        query += ' ORDER BY requested_at DESC';

        const [requests] = await promisePool.query(query, params);

        res.json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single service request
// @route   GET /api/service-requests/:id
// @access  Private
const getServiceRequest = async (req, res, next) => {
    try {
        const [request] = await promisePool.query(
            'SELECT * FROM service_requests_view WHERE request_id = ?',
            [req.params.id]
        );

        if (request.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service request not found'
            });
        }

        // Check permissions
        if (req.user.role === 'Guest' && request[0].guest_id !== req.user.guest_id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this request'
            });
        }

        if (req.user.role === 'Receptionist' && request[0].branch_id !== req.user.branch_id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this request'
            });
        }

        res.json({
            success: true,
            data: request[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Approve/Reject service request (Receptionist/Admin)
// @route   PUT /api/service-requests/:id/review
// @access  Private (Receptionist, Admin)
const reviewServiceRequest = async (req, res, next) => {
    try {
        const { status, review_notes } = req.body;
        const requestId = req.params.id;
        const reviewedBy = req.user.user_id;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be either Approved or Rejected'
            });
        }

        // Get request details
        const [request] = await promisePool.query(
            'SELECT * FROM service_requests_view WHERE request_id = ?',
            [requestId]
        );

        if (request.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service request not found'
            });
        }

        // Check permissions
        if (req.user.role === 'Receptionist' && request[0].branch_id !== req.user.branch_id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to review this request'
            });
        }

        if (request[0].request_status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: 'This request has already been reviewed'
            });
        }

        const connection = await promisePool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Update service request
            await connection.query(
                `UPDATE service_requests 
                 SET request_status = ?, reviewed_by = ?, reviewed_at = NOW(), review_notes = ?
                 WHERE request_id = ?`,
                [status, reviewedBy, review_notes || null, requestId]
            );

            // If approved, add to service_usage
            if (status === 'Approved') {
                const servicePrice = request[0].service_price;
                const quantity = request[0].quantity;
                const totalAmount = servicePrice * quantity;

                await connection.query(
                    `INSERT INTO service_usage 
                     (booking_id, service_id, quantity, unit_price, total_price) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [request[0].booking_id, request[0].service_id, quantity, servicePrice, totalAmount]
                );

                // Update booking total_amount
                await connection.query(
                    `UPDATE bookings 
                     SET total_amount = total_amount + ?,
                         outstanding_amount = outstanding_amount + ?
                     WHERE booking_id = ?`,
                    [totalAmount, totalAmount, request[0].booking_id]
                );

                // Mark request as completed
                await connection.query(
                    'UPDATE service_requests SET request_status = ? WHERE request_id = ?',
                    ['Completed', requestId]
                );
            }

            await connection.commit();

            // Get updated request
            const [updatedRequest] = await promisePool.query(
                'SELECT * FROM service_requests_view WHERE request_id = ?',
                [requestId]
            );

            res.json({
                success: true,
                message: status === 'Approved' 
                    ? 'Service request approved and added to booking' 
                    : 'Service request rejected',
                data: updatedRequest[0]
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel service request (Guest)
// @route   DELETE /api/service-requests/:id
// @access  Private (Guest)
const cancelServiceRequest = async (req, res, next) => {
    try {
        const requestId = req.params.id;
        const guestId = req.user.guest_id;

        const [request] = await promisePool.query(
            'SELECT * FROM service_requests WHERE request_id = ? AND guest_id = ?',
            [requestId, guestId]
        );

        if (request.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service request not found or not authorized'
            });
        }

        if (request[0].request_status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: 'Can only cancel pending requests'
            });
        }

        await promisePool.query(
            'DELETE FROM service_requests WHERE request_id = ?',
            [requestId]
        );

        res.json({
            success: true,
            message: 'Service request cancelled successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get pending requests count (for notifications)
// @route   GET /api/service-requests/pending/count
// @access  Private (Receptionist, Admin)
const getPendingCount = async (req, res, next) => {
    try {
        let query = 'SELECT COUNT(*) as count FROM service_requests WHERE request_status = ?';
        const params = ['Pending'];

        if (req.user.role === 'Receptionist') {
            query += ' AND branch_id = ?';
            params.push(req.user.branch_id);
        }

        const [result] = await promisePool.query(query, params);

        res.json({
            success: true,
            data: {
                pending_count: result[0].count
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createServiceRequest,
    getServiceRequests,
    getServiceRequest,
    reviewServiceRequest,
    cancelServiceRequest,
    getPendingCount
};
