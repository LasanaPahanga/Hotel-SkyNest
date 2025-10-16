const { promisePool } = require('../config/database');

// ============================================
// TAX MANAGEMENT
// ============================================

// @desc    Get all taxes for a branch
// @route   GET /api/tax-discount/taxes/:branchId
// @access  Private (Admin, Receptionist)
const getBranchTaxes = async (req, res, next) => {
    try {
        const { branchId } = req.params;
        
        // Check permissions
        if (req.user.role === 'Receptionist' && req.user.branch_id !== parseInt(branchId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this branch'
            });
        }

        const [taxes] = await promisePool.query(
            `SELECT * FROM branch_tax_config 
             WHERE branch_id = ? 
             ORDER BY is_active DESC, tax_type, created_at DESC`,
            [branchId]
        );

        res.json({
            success: true,
            count: taxes.length,
            data: taxes
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create tax configuration
// @route   POST /api/tax-discount/taxes
// @access  Private (Admin, Receptionist)
const createTax = async (req, res, next) => {
    try {
        const { branch_id, tax_name, tax_type, tax_rate, effective_from, effective_to } = req.body;

        // Validation
        if (!branch_id || !tax_name || !tax_type || tax_rate === undefined || !effective_from) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check permissions
        if (req.user.role === 'Receptionist' && req.user.branch_id !== parseInt(branch_id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this branch'
            });
        }

        // Validate tax rate
        if (tax_rate < 0 || tax_rate > 100) {
            return res.status(400).json({
                success: false,
                message: 'Tax rate must be between 0 and 100'
            });
        }

        const [result] = await promisePool.query(
            `INSERT INTO branch_tax_config (branch_id, tax_name, tax_type, tax_rate, effective_from, effective_to)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [branch_id, tax_name, tax_type, tax_rate, effective_from, effective_to || null]
        );

        res.status(201).json({
            success: true,
            message: 'Tax configuration created successfully',
            data: {
                tax_config_id: result.insertId
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update tax configuration
// @route   PUT /api/tax-discount/taxes/:id
// @access  Private (Admin, Receptionist)
const updateTax = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { tax_name, tax_type, tax_rate, is_active, effective_from, effective_to } = req.body;

        // Get existing tax config
        const [existing] = await promisePool.query(
            'SELECT branch_id FROM branch_tax_config WHERE tax_config_id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tax configuration not found'
            });
        }

        // Check permissions
        if (req.user.role === 'Receptionist' && req.user.branch_id !== existing[0].branch_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this branch'
            });
        }

        const updates = [];
        const params = [];

        if (tax_name !== undefined) {
            updates.push('tax_name = ?');
            params.push(tax_name);
        }
        if (tax_type !== undefined) {
            updates.push('tax_type = ?');
            params.push(tax_type);
        }
        if (tax_rate !== undefined) {
            if (tax_rate < 0 || tax_rate > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Tax rate must be between 0 and 100'
                });
            }
            updates.push('tax_rate = ?');
            params.push(tax_rate);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active);
        }
        if (effective_from !== undefined) {
            updates.push('effective_from = ?');
            params.push(effective_from);
        }
        if (effective_to !== undefined) {
            updates.push('effective_to = ?');
            params.push(effective_to);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        params.push(id);

        await promisePool.query(
            `UPDATE branch_tax_config SET ${updates.join(', ')} WHERE tax_config_id = ?`,
            params
        );

        res.json({
            success: true,
            message: 'Tax configuration updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete tax configuration
// @route   DELETE /api/tax-discount/taxes/:id
// @access  Private (Admin)
const deleteTax = async (req, res, next) => {
    try {
        const { id } = req.params;

        await promisePool.query(
            'DELETE FROM branch_tax_config WHERE tax_config_id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Tax configuration deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// DISCOUNT MANAGEMENT
// ============================================

// @desc    Get all discounts for a branch
// @route   GET /api/tax-discount/discounts/:branchId
// @access  Private (Admin, Receptionist)
const getBranchDiscounts = async (req, res, next) => {
    try {
        const { branchId } = req.params;
        
        // Check permissions
        if (req.user.role === 'Receptionist' && req.user.branch_id !== parseInt(branchId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this branch'
            });
        }

        const [discounts] = await promisePool.query(
            `SELECT * FROM branch_discount_config 
             WHERE branch_id = ? 
             ORDER BY is_active DESC, created_at DESC`,
            [branchId]
        );

        res.json({
            success: true,
            count: discounts.length,
            data: discounts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create discount configuration
// @route   POST /api/tax-discount/discounts
// @access  Private (Admin, Receptionist)
const createDiscount = async (req, res, next) => {
    try {
        const {
            branch_id, discount_name, discount_type, discount_value,
            applicable_on, min_booking_amount, max_discount_amount,
            valid_from, valid_to, promo_code, usage_limit
        } = req.body;

        // Validation
        if (!branch_id || !discount_name || !discount_type || discount_value === undefined || !valid_from) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check permissions
        if (req.user.role === 'Receptionist' && req.user.branch_id !== parseInt(branch_id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this branch'
            });
        }

        // Validate discount value
        if (discount_value < 0) {
            return res.status(400).json({
                success: false,
                message: 'Discount value must be positive'
            });
        }

        const [result] = await promisePool.query(
            `INSERT INTO branch_discount_config 
             (branch_id, discount_name, discount_type, discount_value, applicable_on, 
              min_booking_amount, max_discount_amount, valid_from, valid_to, promo_code, usage_limit)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                branch_id, discount_name, discount_type, discount_value,
                applicable_on || 'Total Bill', min_booking_amount || 0,
                max_discount_amount || null, valid_from, valid_to || null,
                promo_code || null, usage_limit || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Discount configuration created successfully',
            data: {
                discount_config_id: result.insertId
            }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Promo code already exists'
            });
        }
        next(error);
    }
};

// @desc    Update discount configuration
// @route   PUT /api/tax-discount/discounts/:id
// @access  Private (Admin, Receptionist)
const updateDiscount = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            discount_name, discount_type, discount_value, applicable_on,
            min_booking_amount, max_discount_amount, is_active,
            valid_from, valid_to, promo_code, usage_limit
        } = req.body;

        // Get existing discount config
        const [existing] = await promisePool.query(
            'SELECT branch_id FROM branch_discount_config WHERE discount_config_id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Discount configuration not found'
            });
        }

        // Check permissions
        if (req.user.role === 'Receptionist' && req.user.branch_id !== existing[0].branch_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this branch'
            });
        }

        const updates = [];
        const params = [];

        if (discount_name !== undefined) {
            updates.push('discount_name = ?');
            params.push(discount_name);
        }
        if (discount_type !== undefined) {
            updates.push('discount_type = ?');
            params.push(discount_type);
        }
        if (discount_value !== undefined) {
            updates.push('discount_value = ?');
            params.push(discount_value);
        }
        if (applicable_on !== undefined) {
            updates.push('applicable_on = ?');
            params.push(applicable_on);
        }
        if (min_booking_amount !== undefined) {
            updates.push('min_booking_amount = ?');
            params.push(min_booking_amount);
        }
        if (max_discount_amount !== undefined) {
            updates.push('max_discount_amount = ?');
            params.push(max_discount_amount);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active);
        }
        if (valid_from !== undefined) {
            updates.push('valid_from = ?');
            params.push(valid_from);
        }
        if (valid_to !== undefined) {
            updates.push('valid_to = ?');
            params.push(valid_to);
        }
        if (promo_code !== undefined) {
            updates.push('promo_code = ?');
            params.push(promo_code);
        }
        if (usage_limit !== undefined) {
            updates.push('usage_limit = ?');
            params.push(usage_limit);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        params.push(id);

        await promisePool.query(
            `UPDATE branch_discount_config SET ${updates.join(', ')} WHERE discount_config_id = ?`,
            params
        );

        res.json({
            success: true,
            message: 'Discount configuration updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete discount configuration
// @route   DELETE /api/tax-discount/discounts/:id
// @access  Private (Admin)
const deleteDiscount = async (req, res, next) => {
    try {
        const { id } = req.params;

        await promisePool.query(
            'DELETE FROM branch_discount_config WHERE discount_config_id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Discount configuration deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Validate promo code
// @route   POST /api/tax-discount/validate-promo
// @access  Public
const validatePromoCode = async (req, res, next) => {
    try {
        const { promo_code, branch_id, subtotal } = req.body;

        if (!promo_code || !branch_id || subtotal === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Please provide promo_code, branch_id, and subtotal'
            });
        }

        const [discounts] = await promisePool.query(
            `SELECT * FROM branch_discount_config
             WHERE promo_code = ? AND branch_id = ? AND is_active = TRUE
             AND valid_from <= CURDATE() AND (valid_to IS NULL OR valid_to >= CURDATE())`,
            [promo_code, branch_id]
        );

        if (discounts.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired promo code'
            });
        }

        const discount = discounts[0];

        // Check usage limit
        if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
            return res.status(400).json({
                success: false,
                message: 'Promo code usage limit exceeded'
            });
        }

        // Check minimum amount
        if (subtotal < discount.min_booking_amount) {
            return res.status(400).json({
                success: false,
                message: `Minimum booking amount of ${discount.min_booking_amount} required`
            });
        }

        // Calculate discount amount
        let discount_amount = 0;
        if (discount.discount_type === 'Percentage') {
            discount_amount = (subtotal * discount.discount_value) / 100;
        } else {
            discount_amount = discount.discount_value;
        }

        // Apply max discount cap
        if (discount.max_discount_amount && discount_amount > discount.max_discount_amount) {
            discount_amount = discount.max_discount_amount;
        }

        // Ensure discount doesn't exceed subtotal
        if (discount_amount > subtotal) {
            discount_amount = subtotal;
        }

        res.json({
            success: true,
            message: 'Promo code is valid',
            data: {
                discount_config_id: discount.discount_config_id,
                discount_name: discount.discount_name,
                discount_type: discount.discount_type,
                discount_value: discount.discount_value,
                discount_amount: parseFloat(discount_amount.toFixed(2))
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getBranchTaxes,
    createTax,
    updateTax,
    deleteTax,
    getBranchDiscounts,
    createDiscount,
    updateDiscount,
    deleteDiscount,
    validatePromoCode
};
