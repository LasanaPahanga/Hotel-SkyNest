const { promisePool } = require('../config/database');

// @desc    Get all services (branch-specific for receptionists)
// @route   GET /api/services
// @access  Private
const getAllServices = async (req, res, next) => {
    try {
        const { category, is_active, branch_id, include_unavailable } = req.query;
        const userRole = req.user.role;
        const userBranchId = req.user.branch_id;
        
        // Determine which branch to query
        let targetBranchId = null;
        if (userRole === 'Receptionist') {
            targetBranchId = userBranchId; // Receptionist can only see their branch
        } else if (branch_id) {
            targetBranchId = branch_id; // Admin can filter by branch
        }
        
        let query = `
            SELECT 
                sc.service_id,
                sc.service_name,
                sc.service_category,
                sc.description,
                COALESCE(bs.custom_price, sc.unit_price) AS unit_price,
                sc.unit_type,
                sc.is_active,
                bs.branch_service_id,
                bs.is_available,
                bs.custom_price,
                b.branch_name
            FROM service_catalogue sc
        `;
        const params = [];
        
        if (targetBranchId) {
            // Join with branch_services ONLY for the specific branch
            // This ensures all services are returned, with branch-specific data when available
            query += `
                LEFT JOIN branch_services bs ON sc.service_id = bs.service_id AND bs.branch_id = ?
                LEFT JOIN hotel_branches b ON b.branch_id = ?
            `;
            params.push(targetBranchId, targetBranchId);
            query += ' WHERE 1=1';
            
            // Filter unavailable services unless explicitly requested
            if (include_unavailable !== 'true') {
                query += ' AND (bs.is_available IS NULL OR bs.is_available = TRUE OR bs.is_available = 1)';
            }
        } else {
            query += `
                LEFT JOIN branch_services bs ON sc.service_id = bs.service_id
                LEFT JOIN hotel_branches b ON bs.branch_id = b.branch_id
                WHERE 1=1
            `;
        }
        
        if (category) {
            query += ' AND sc.service_category = ?';
            params.push(category);
        }
        
        if (is_active !== undefined) {
            query += ' AND sc.is_active = ?';
            params.push(is_active === 'true' ? 1 : 0);
        }
        
        query += ' ORDER BY sc.service_category, sc.service_name';
        
        const [services] = await promisePool.query(query, params);
        
        res.json({
            success: true,
            count: services.length,
            data: services
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
const getService = async (req, res, next) => {
    try {
        const [services] = await promisePool.query(
            'SELECT * FROM service_catalogue WHERE service_id = ?',
            [req.params.id]
        );
        
        if (services.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }
        
        res.json({
            success: true,
            data: services[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new service
// @route   POST /api/services
// @access  Private (Admin)
const createService = async (req, res, next) => {
    try {
        const {
            service_name, service_category, description, unit_price, unit_type
        } = req.body;
        
        if (!service_name || !service_category || !unit_price) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }
        
        const [result] = await promisePool.query(
            `INSERT INTO service_catalogue (service_name, service_category, description, unit_price, unit_type)
             VALUES (?, ?, ?, ?, ?)`,
            [service_name, service_category, description || null, unit_price, unit_type || 'item']
        );
        
        res.status(201).json({
            success: true,
            message: 'Service created successfully',
            data: {
                service_id: result.insertId
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private (Admin)
const updateService = async (req, res, next) => {
    try {
        const {
            service_name, description, unit_price, unit_type, is_active
        } = req.body;
        
        const updates = [];
        const params = [];
        
        if (service_name) {
            updates.push('service_name = ?');
            params.push(service_name);
        }
        
        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description);
        }
        
        if (unit_price) {
            updates.push('unit_price = ?');
            params.push(unit_price);
        }
        
        if (unit_type) {
            updates.push('unit_type = ?');
            params.push(unit_type);
        }
        
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }
        
        params.push(req.params.id);
        
        await promisePool.query(
            `UPDATE service_catalogue SET ${updates.join(', ')} WHERE service_id = ?`,
            params
        );
        
        res.json({
            success: true,
            message: 'Service updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private (Admin)
const deleteService = async (req, res, next) => {
    try {
        await promisePool.query('DELETE FROM service_catalogue WHERE service_id = ?', [req.params.id]);
        
        res.json({
            success: true,
            message: 'Service deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add service to booking
// @route   POST /api/services/usage
// @access  Private
const addServiceUsage = async (req, res, next) => {
    try {
        const { booking_id, service_id, quantity, notes } = req.body;
        
        if (!booking_id || !service_id || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }
        
        // Call stored procedure
        await promisePool.query(
            `CALL add_service_usage(?, ?, ?, ?, @usage_id, @error_message)`,
            [booking_id, service_id, quantity, notes || null]
        );
        
        // Get output parameters
        const [output] = await promisePool.query(
            'SELECT @usage_id as usage_id, @error_message as error_message'
        );
        
        if (output[0].error_message) {
            return res.status(400).json({
                success: false,
                message: output[0].error_message
            });
        }
        
        res.status(201).json({
            success: true,
            message: 'Service added to booking successfully',
            data: {
                usage_id: output[0].usage_id
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get service usage for booking
// @route   GET /api/services/usage/:bookingId
// @access  Private
const getServiceUsage = async (req, res, next) => {
    try {
        const [usage] = await promisePool.query(
            `SELECT su.*, sc.service_name, sc.service_category
             FROM service_usage su
             JOIN service_catalogue sc ON su.service_id = sc.service_id
             WHERE su.booking_id = ?
             ORDER BY su.usage_date DESC`,
            [req.params.bookingId]
        );
        
        res.json({
            success: true,
            count: usage.length,
            data: usage
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete service usage
// @route   DELETE /api/services/usage/:id
// @access  Private (Admin, Receptionist)
const deleteServiceUsage = async (req, res, next) => {
    try {
        // Use stored procedure for proper transaction handling
        await promisePool.query(
            'CALL delete_service_usage(?, @success, @error_message)',
            [req.params.id]
        );
        
        const [output] = await promisePool.query(
            'SELECT @success as success, @error_message as error_message'
        );
        
        if (!output[0].success) {
            return res.status(400).json({
                success: false,
                message: output[0].error_message || 'Failed to delete service usage'
            });
        }
        
        res.json({
            success: true,
            message: 'Service usage deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get branch-specific services
// @route   GET /api/services/branch/:branchId
// @access  Private
const getBranchServices = async (req, res, next) => {
    try {
        const branchId = req.params.branchId;
        const userRole = req.user.role;
        const userBranchId = req.user.branch_id;
        
        // Receptionist can only view their own branch
        if (userRole === 'Receptionist' && parseInt(branchId) !== userBranchId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view services for your branch.'
            });
        }
        
        // Direct query to avoid missing stored procedure dependency
        const [services] = await promisePool.query(
            `SELECT 
                sc.service_id,
                sc.service_name,
                sc.service_category,
                sc.description,
                sc.unit_type,
                sc.is_active,
                bs.branch_service_id,
                bs.is_available,
                bs.custom_price,
                COALESCE(bs.custom_price, sc.unit_price) AS unit_price,
                hb.branch_id,
                hb.branch_name
             FROM service_catalogue sc
             LEFT JOIN branch_services bs 
               ON sc.service_id = bs.service_id AND bs.branch_id = ?
             JOIN hotel_branches hb ON hb.branch_id = ?
             WHERE sc.is_active = TRUE
               AND (bs.is_available IS NULL OR bs.is_available = TRUE)
             ORDER BY sc.service_category, sc.service_name`,
            [branchId, branchId]
        );

        res.json({
            success: true,
            count: services.length,
            data: services
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Toggle service availability for a branch
// @route   PUT /api/services/branch/:branchId/toggle/:serviceId
// @access  Private (Admin, Receptionist)
const toggleBranchService = async (req, res, next) => {
    try {
        const { branchId, serviceId } = req.params;
        const { is_available } = req.body;
        const userRole = req.user.role;
        const userBranchId = req.user.branch_id;
        
        // Receptionist can only modify their own branch
        if (userRole === 'Receptionist' && parseInt(branchId) !== userBranchId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only modify services for your branch.'
            });
        }
        
        // Check if branch_service record exists
        const [existing] = await promisePool.query(
            'SELECT * FROM branch_services WHERE branch_id = ? AND service_id = ?',
            [branchId, serviceId]
        );
        
        if (existing.length > 0) {
            // Update existing record
            await promisePool.query(
                'UPDATE branch_services SET is_available = ? WHERE branch_id = ? AND service_id = ?',
                [is_available, branchId, serviceId]
            );
        } else {
            // Insert new record
            await promisePool.query(
                'INSERT INTO branch_services (branch_id, service_id, is_available) VALUES (?, ?, ?)',
                [branchId, serviceId, is_available]
            );
        }
        
        res.json({
            success: true,
            message: `Service ${is_available ? 'enabled' : 'disabled'} for this branch`
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Set custom price for service in a branch
// @route   PUT /api/services/branch/:branchId/price/:serviceId
// @access  Private (Admin, Receptionist)
const setBranchServicePrice = async (req, res, next) => {
    try {
        const { branchId, serviceId } = req.params;
        const { custom_price } = req.body;
        const userRole = req.user.role;
        const userBranchId = req.user.branch_id;
        
        // Receptionist can only modify their own branch
        if (userRole === 'Receptionist' && parseInt(branchId) !== userBranchId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only modify services for your branch.'
            });
        }
        
        // Check if branch_service record exists
        const [existing] = await promisePool.query(
            'SELECT * FROM branch_services WHERE branch_id = ? AND service_id = ?',
            [branchId, serviceId]
        );
        
        if (existing.length > 0) {
            // Update existing record
            await promisePool.query(
                'UPDATE branch_services SET custom_price = ? WHERE branch_id = ? AND service_id = ?',
                [custom_price, branchId, serviceId]
            );
        } else {
            // Insert new record
            await promisePool.query(
                'INSERT INTO branch_services (branch_id, service_id, custom_price) VALUES (?, ?, ?)',
                [branchId, serviceId, custom_price]
            );
        }
        
        res.json({
            success: true,
            message: 'Custom price set successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
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
};
