const { promisePool } = require('../config/database');

/**
 * Calculate complete payment breakdown for a booking
 * Includes: base amount, services, taxes, discounts, fees
 */
const calculateBookingPayment = async (bookingId, promoCode = null) => {
    const connection = await promisePool.getConnection();
    
    try {
        // Get booking details with branch
        const [bookings] = await connection.query(`
            SELECT 
                b.booking_id, b.branch_id, b.room_id, b.guest_id,
                b.check_in_date, b.check_out_date, b.actual_check_in, b.actual_check_out,
                b.number_of_guests, b.booking_status,
                r.room_number,
                rt.type_name, rt.base_rate,
                DATEDIFF(b.check_out_date, b.check_in_date) as nights
            FROM bookings b
            JOIN rooms r ON b.room_id = r.room_id
            JOIN room_types rt ON r.room_type_id = rt.room_type_id
            WHERE b.booking_id = ?
        `, [bookingId]);

        if (bookings.length === 0) {
            throw new Error('Booking not found');
        }

        const booking = bookings[0];
        const branchId = booking.branch_id;

        // 1. Calculate base room charge
        const roomCharge = booking.base_rate * booking.nights;
        let subtotal = roomCharge;

        // 2. Get booking services from service_usage table
        const [services] = await connection.query(`
            SELECT 
                su.usage_id, su.quantity, su.total_price,
                sc.service_name, sc.price
            FROM service_usage su
            JOIN service_catalogue sc ON su.service_id = sc.service_id
            WHERE su.booking_id = ?
        `, [bookingId]);

        const servicesTotal = services.reduce((sum, svc) => sum + parseFloat(svc.total_price || 0), 0);
        subtotal += servicesTotal;

        // 3. Get active taxes for this branch
        const [taxes] = await connection.query(`
            SELECT 
                tax_config_id, tax_name, tax_type, tax_rate, is_percentage
            FROM tax_configurations
            WHERE branch_id = ? AND is_active = TRUE
            ORDER BY tax_name
        `, [branchId]);

        // Calculate tax amounts
        const taxBreakdown = taxes.map(tax => {
            const taxAmount = tax.is_percentage 
                ? (subtotal * tax.tax_rate / 100)
                : tax.tax_rate;
            return {
                tax_config_id: tax.tax_config_id,
                tax_name: tax.tax_name,
                tax_type: tax.tax_type,
                tax_rate: tax.tax_rate,
                is_percentage: tax.is_percentage,
                tax_amount: parseFloat(taxAmount.toFixed(2))
            };
        });

        const totalTax = taxBreakdown.reduce((sum, tax) => sum + tax.tax_amount, 0);

        // 4. Calculate discount if promo code provided
        let discountBreakdown = null;
        let discountAmount = 0;

        if (promoCode) {
            const [discounts] = await connection.query(`
                SELECT 
                    discount_config_id, discount_name, discount_type, 
                    discount_value, min_booking_amount, max_discount_amount,
                    usage_limit, usage_count
                FROM discount_configurations
                WHERE branch_id = ? 
                AND promo_code = ? 
                AND is_active = TRUE
                AND (valid_from IS NULL OR valid_from <= NOW())
                AND (valid_until IS NULL OR valid_until >= NOW())
            `, [branchId, promoCode]);

            if (discounts.length > 0) {
                const discount = discounts[0];

                // Check minimum booking amount
                if (subtotal >= discount.min_booking_amount) {
                    // Check usage limit
                    if (!discount.usage_limit || discount.usage_count < discount.usage_limit) {
                        // Calculate discount
                        if (discount.discount_type === 'Percentage') {
                            discountAmount = subtotal * discount.discount_value / 100;
                        } else {
                            discountAmount = discount.discount_value;
                        }

                        // Apply max discount cap
                        if (discount.max_discount_amount && discountAmount > discount.max_discount_amount) {
                            discountAmount = discount.max_discount_amount;
                        }

                        discountBreakdown = {
                            discount_config_id: discount.discount_config_id,
                            discount_name: discount.discount_name,
                            discount_type: discount.discount_type,
                            discount_value: discount.discount_value,
                            promo_code: promoCode,
                            discount_amount: parseFloat(discountAmount.toFixed(2))
                        };
                    }
                }
            }
        }

        // 5. Get applicable fees (late checkout, no-show, cancellation)
        const [fees] = await connection.query(`
            SELECT 
                bf.booking_fee_id, bf.fee_amount, bf.fee_reason, bf.is_waived,
                fc.fee_type, fc.fee_calculation
            FROM booking_fees bf
            LEFT JOIN fee_configurations fc ON bf.fee_config_id = fc.fee_config_id
            WHERE bf.booking_id = ? AND bf.is_waived = FALSE
        `, [bookingId]);

        const feeBreakdown = fees.map(fee => ({
            booking_fee_id: fee.booking_fee_id,
            fee_type: fee.fee_type,
            fee_reason: fee.fee_reason,
            fee_amount: parseFloat(fee.fee_amount)
        }));

        const totalFees = feeBreakdown.reduce((sum, fee) => sum + fee.fee_amount, 0);

        // 6. Calculate final total
        const totalBeforeTax = subtotal - discountAmount;
        const grandTotal = totalBeforeTax + totalTax + totalFees;

        // Return complete breakdown
        return {
            booking_id: bookingId,
            branch_id: branchId,
            calculation_date: new Date(),
            
            // Room charges
            room_charge: parseFloat(roomCharge.toFixed(2)),
            nights: booking.nights,
            rate_per_night: booking.base_rate,
            
            // Services
            services: services.map(s => ({
                service_name: s.service_name,
                quantity: s.quantity,
                unit_price: s.price,
                total: parseFloat(s.total_price)
            })),
            services_total: parseFloat(servicesTotal.toFixed(2)),
            
            // Subtotal before tax and discount
            subtotal: parseFloat(subtotal.toFixed(2)),
            
            // Discount
            discount: discountBreakdown,
            discount_amount: parseFloat(discountAmount.toFixed(2)),
            
            // Total after discount, before tax
            total_before_tax: parseFloat(totalBeforeTax.toFixed(2)),
            
            // Taxes
            taxes: taxBreakdown,
            total_tax: parseFloat(totalTax.toFixed(2)),
            
            // Fees
            fees: feeBreakdown,
            total_fees: parseFloat(totalFees.toFixed(2)),
            
            // Grand total
            grand_total: parseFloat(grandTotal.toFixed(2))
        };

    } finally {
        connection.release();
    }
};

/**
 * Apply and save payment breakdown to database
 */
const savePaymentBreakdown = async (bookingId, breakdown, promoCode = null) => {
    const connection = await promisePool.getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. Save tax details
        for (const tax of breakdown.taxes) {
            await connection.query(`
                INSERT INTO booking_taxes 
                (booking_id, tax_config_id, tax_name, tax_rate, tax_amount, applied_date)
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [
                bookingId,
                tax.tax_config_id,
                tax.tax_name,
                tax.tax_rate,
                tax.tax_amount
            ]);
        }

        // 2. Save discount if applied
        if (breakdown.discount) {
            await connection.query(`
                INSERT INTO booking_discounts 
                (booking_id, discount_config_id, discount_name, discount_amount, promo_code, applied_date)
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [
                bookingId,
                breakdown.discount.discount_config_id,
                breakdown.discount.discount_name,
                breakdown.discount.discount_amount,
                promoCode
            ]);

            // Increment usage count
            await connection.query(`
                UPDATE discount_configurations 
                SET usage_count = usage_count + 1
                WHERE discount_config_id = ?
            `, [breakdown.discount.discount_config_id]);
        }

        // 3. Update booking total amount
        await connection.query(`
            UPDATE bookings 
            SET total_amount = ?
            WHERE booking_id = ?
        `, [breakdown.grand_total, bookingId]);

        await connection.commit();
        return true;

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Get saved payment breakdown for a booking
 */
const getPaymentBreakdown = async (bookingId) => {
    const connection = await promisePool.getConnection();
    
    try {
        // Get booking details
        const [bookings] = await connection.query(`
            SELECT 
                b.*, 
                r.room_number,
                rt.type_name, rt.base_rate,
                DATEDIFF(b.check_out_date, b.check_in_date) as nights
            FROM bookings b
            JOIN rooms r ON b.room_id = r.room_id
            JOIN room_types rt ON r.room_type_id = rt.room_type_id
            WHERE b.booking_id = ?
        `, [bookingId]);

        if (bookings.length === 0) {
            throw new Error('Booking not found');
        }

        const booking = bookings[0];

        // Get services
        const [services] = await connection.query(`
            SELECT 
                s.service_name, bs.quantity, s.price, bs.total_price
            FROM booking_services bs
            JOIN services s ON bs.service_id = s.service_id
            WHERE bs.booking_id = ?
        `, [bookingId]);

        // Get taxes
        const [taxes] = await connection.query(`
            SELECT tax_name, tax_rate, tax_amount, applied_date
            FROM booking_taxes
            WHERE booking_id = ?
        `, [bookingId]);

        // Get discounts
        const [discounts] = await connection.query(`
            SELECT discount_name, discount_amount, promo_code, applied_date
            FROM booking_discounts
            WHERE booking_id = ?
        `, [bookingId]);

        // Get fees
        const [fees] = await connection.query(`
            SELECT 
                bf.fee_amount, bf.fee_reason, bf.applied_date,
                fc.fee_type
            FROM booking_fees bf
            LEFT JOIN fee_configurations fc ON bf.fee_config_id = fc.fee_config_id
            WHERE bf.booking_id = ? AND bf.is_waived = FALSE
        `, [bookingId]);

        // Get payments
        const [payments] = await connection.query(`
            SELECT payment_id, amount, payment_method, payment_date, payment_status
            FROM payments
            WHERE booking_id = ?
            ORDER BY payment_date DESC
        `, [bookingId]);

        const roomCharge = booking.base_rate * booking.nights;
        const servicesTotal = services.reduce((sum, s) => sum + parseFloat(s.total_price), 0);
        const subtotal = roomCharge + servicesTotal;
        const totalTax = taxes.reduce((sum, t) => sum + parseFloat(t.tax_amount), 0);
        const totalDiscount = discounts.reduce((sum, d) => sum + parseFloat(d.discount_amount), 0);
        const totalFees = fees.reduce((sum, f) => sum + parseFloat(f.fee_amount), 0);

        return {
            booking_id: bookingId,
            room_charge: parseFloat(roomCharge.toFixed(2)),
            nights: booking.nights,
            rate_per_night: booking.base_rate,
            services,
            services_total: parseFloat(servicesTotal.toFixed(2)),
            subtotal: parseFloat(subtotal.toFixed(2)),
            taxes,
            total_tax: parseFloat(totalTax.toFixed(2)),
            discounts,
            total_discount: parseFloat(totalDiscount.toFixed(2)),
            fees,
            total_fees: parseFloat(totalFees.toFixed(2)),
            grand_total: booking.total_amount,
            paid_amount: booking.paid_amount,
            outstanding_amount: booking.outstanding_amount,
            payments
        };

    } finally {
        connection.release();
    }
};

module.exports = {
    calculateBookingPayment,
    savePaymentBreakdown,
    getPaymentBreakdown
};
