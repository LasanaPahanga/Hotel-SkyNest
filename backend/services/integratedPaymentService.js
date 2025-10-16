const { promisePool } = require('../config/database');

/**
 * Integrated Payment Service
 * Uses existing database procedures and tables
 */

/**
 * Calculate complete payment breakdown using database procedures
 */
const calculatePaymentBreakdown = async (bookingId, promoCode = null) => {
    const connection = await promisePool.getConnection();
    
    try {
        // 1. Get booking details
        const [bookings] = await connection.query(`
            SELECT 
                b.booking_id, b.branch_id, b.room_id, b.guest_id,
                b.check_in_date, b.check_out_date, b.total_amount,
                b.booking_status, b.special_requests,
                r.room_number,
                rt.type_name, rt.base_rate,
                DATEDIFF(b.check_out_date, b.check_in_date) as nights,
                br.branch_name
            FROM bookings b
            JOIN rooms r ON b.room_id = r.room_id
            JOIN room_types rt ON r.room_type_id = rt.room_type_id
            JOIN hotel_branches br ON b.branch_id = br.branch_id
            WHERE b.booking_id = ?
        `, [bookingId]);

        if (bookings.length === 0) {
            throw new Error('Booking not found');
        }

        const booking = bookings[0];
        
        // 2. Calculate room charge
        const roomCharge = booking.base_rate * booking.nights;
        
        // 3. Get services from service_usage
        const [services] = await connection.query(`
            SELECT 
                su.usage_id,
                su.quantity,
                su.total_price,
                sc.service_name,
                sc.price,
                sc.category
            FROM service_usage su
            JOIN service_catalogue sc ON su.service_id = sc.service_id
            WHERE su.booking_id = ?
            ORDER BY su.usage_date DESC
        `, [bookingId]);

        const servicesTotal = services.reduce((sum, s) => sum + parseFloat(s.total_price || 0), 0);
        
        // 4. Calculate subtotal
        let subtotal = roomCharge + servicesTotal;
        
        // 5. Apply discount if promo code provided
        let discountAmount = 0;
        let discountDetails = null;
        
        if (promoCode) {
            const [discounts] = await connection.query(`
                SELECT 
                    discount_config_id,
                    discount_name,
                    discount_type,
                    discount_value,
                    min_booking_amount,
                    max_discount_amount,
                    usage_limit,
                    usage_count
                FROM discount_configurations
                WHERE branch_id = ? 
                AND promo_code = ? 
                AND is_active = TRUE
                AND (valid_from IS NULL OR valid_from <= CURDATE())
                AND (valid_until IS NULL OR valid_until >= CURDATE())
            `, [booking.branch_id, promoCode]);

            if (discounts.length > 0) {
                const discount = discounts[0];
                
                // Validate minimum amount
                if (subtotal >= (discount.min_booking_amount || 0)) {
                    // Validate usage limit
                    if (!discount.usage_limit || discount.usage_count < discount.usage_limit) {
                        // Calculate discount
                        if (discount.discount_type === 'Percentage') {
                            discountAmount = subtotal * (discount.discount_value / 100);
                        } else {
                            discountAmount = parseFloat(discount.discount_value);
                        }
                        
                        // Apply max cap
                        if (discount.max_discount_amount && discountAmount > discount.max_discount_amount) {
                            discountAmount = parseFloat(discount.max_discount_amount);
                        }
                        
                        discountDetails = {
                            discount_config_id: discount.discount_config_id,
                            discount_name: discount.discount_name,
                            discount_type: discount.discount_type,
                            discount_value: discount.discount_value,
                            promo_code: promoCode,
                            discount_amount: parseFloat(discountAmount.toFixed(2))
                        };
                    } else {
                        throw new Error('Promo code usage limit exceeded');
                    }
                } else {
                    throw new Error(`Minimum booking amount of Rs. ${discount.min_booking_amount} required`);
                }
            } else {
                throw new Error('Invalid or expired promo code');
            }
        }
        
        // 6. Calculate total before tax
        const totalBeforeTax = subtotal - discountAmount;
        
        // 7. Get active taxes for branch
        const [taxes] = await connection.query(`
            SELECT 
                tax_config_id,
                tax_name,
                tax_type,
                tax_rate,
                is_percentage
            FROM tax_configurations
            WHERE branch_id = ? AND is_active = TRUE
            ORDER BY tax_name
        `, [booking.branch_id]);

        // Calculate tax amounts
        const taxBreakdown = taxes.map(tax => {
            const taxAmount = tax.is_percentage 
                ? (totalBeforeTax * tax.tax_rate / 100)
                : parseFloat(tax.tax_rate);
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
        
        // 8. Get applied fees (from booking_fees table)
        const [fees] = await connection.query(`
            SELECT 
                bf.booking_fee_id,
                bf.fee_amount,
                bf.fee_reason,
                bf.is_waived,
                fc.fee_type,
                fc.fee_calculation
            FROM booking_fees bf
            LEFT JOIN fee_configurations fc ON bf.fee_config_id = fc.fee_config_id
            WHERE bf.booking_id = ? AND bf.is_waived = FALSE
        `, [bookingId]);

        const feeBreakdown = fees.map(fee => ({
            booking_fee_id: fee.booking_fee_id,
            fee_type: fee.fee_type || 'Other',
            fee_reason: fee.fee_reason,
            fee_amount: parseFloat(fee.fee_amount || 0)
        }));

        const totalFees = feeBreakdown.reduce((sum, fee) => sum + fee.fee_amount, 0);
        
        // 9. Calculate grand total
        const grandTotal = totalBeforeTax + totalTax + totalFees;
        
        // 10. Return complete breakdown
        const breakdown = {
            booking_id: bookingId,
            branch_id: booking.branch_id,
            branch_name: booking.branch_name,
            room_number: booking.room_number,
            room_type: booking.type_name,
            guest_id: booking.guest_id,
            check_in_date: booking.check_in_date,
            check_out_date: booking.check_out_date,
            
            // Room charges
            nights: booking.nights,
            rate_per_night: parseFloat(booking.base_rate),
            room_charge: parseFloat(roomCharge.toFixed(2)),
            
            // Services
            services: services.map(s => ({
                service_name: s.service_name,
                category: s.category,
                quantity: s.quantity,
                unit_price: parseFloat(s.price),
                total: parseFloat(s.total_price || 0)
            })),
            services_total: parseFloat(servicesTotal.toFixed(2)),
            
            // Subtotal
            subtotal: parseFloat(subtotal.toFixed(2)),
            
            // Discount
            discount: discountDetails,
            discount_amount: parseFloat(discountAmount.toFixed(2)),
            
            // Total before tax
            total_before_tax: parseFloat(totalBeforeTax.toFixed(2)),
            
            // Taxes
            taxes: taxBreakdown,
            tax_amount: parseFloat(totalTax.toFixed(2)),
            
            // Fees
            fees: feeBreakdown,
            fees_amount: parseFloat(totalFees.toFixed(2)),
            
            // Grand total
            grand_total: parseFloat(grandTotal.toFixed(2)),
            
            // Metadata
            calculation_date: new Date()
        };
        
        return breakdown;
        
    } finally {
        connection.release();
    }
};

/**
 * Save payment breakdown to database
 */
const saveBreakdown = async (breakdown) => {
    const connection = await promisePool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Save to payment_breakdowns table
        const [result] = await connection.query(`
            INSERT INTO payment_breakdowns (
                booking_id,
                room_charge,
                services_total,
                subtotal,
                discount_amount,
                discount_config_id,
                total_before_tax,
                tax_amount,
                fees_amount,
                grand_total,
                breakdown_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            breakdown.booking_id,
            breakdown.room_charge,
            breakdown.services_total,
            breakdown.subtotal,
            breakdown.discount_amount,
            breakdown.discount?.discount_config_id || null,
            breakdown.total_before_tax,
            breakdown.tax_amount,
            breakdown.fees_amount,
            breakdown.grand_total,
            JSON.stringify(breakdown)
        ]);
        
        // Save taxes to booking_taxes
        if (breakdown.taxes && breakdown.taxes.length > 0) {
            for (const tax of breakdown.taxes) {
                await connection.query(`
                    INSERT INTO booking_taxes (booking_id, tax_config_id, tax_amount)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE tax_amount = VALUES(tax_amount)
                `, [breakdown.booking_id, tax.tax_config_id, tax.tax_amount]);
            }
        }
        
        // Save discount to booking_discounts
        if (breakdown.discount) {
            await connection.query(`
                INSERT INTO booking_discounts (booking_id, discount_config_id, discount_amount)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE discount_amount = VALUES(discount_amount)
            `, [
                breakdown.booking_id,
                breakdown.discount.discount_config_id,
                breakdown.discount.discount_amount
            ]);
            
            // Increment usage count
            await connection.query(`
                UPDATE discount_configurations
                SET usage_count = usage_count + 1
                WHERE discount_config_id = ?
            `, [breakdown.discount.discount_config_id]);
        }
        
        // Update booking total_amount
        await connection.query(`
            UPDATE bookings
            SET total_amount = ?
            WHERE booking_id = ?
        `, [breakdown.grand_total, breakdown.booking_id]);
        
        await connection.commit();
        
        return result.insertId;
        
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Process payment with breakdown
 */
const processPaymentWithBreakdown = async (paymentData) => {
    const connection = await promisePool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // 1. Get breakdown
        const breakdown = await calculatePaymentBreakdown(
            paymentData.booking_id,
            paymentData.promo_code
        );
        
        // 2. Save breakdown
        await saveBreakdown(breakdown);
        
        // 3. Create payment record
        const [paymentResult] = await connection.query(`
            INSERT INTO payments (
                booking_id,
                amount,
                payment_method,
                payment_status,
                transaction_id,
                payment_date,
                processed_by,
                notes
            ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)
        `, [
            paymentData.booking_id,
            breakdown.grand_total,
            paymentData.payment_method || 'Credit Card',
            'Completed',
            paymentData.transaction_id || `TXN${Date.now()}`,
            paymentData.processed_by || null,
            paymentData.notes || null
        ]);
        
        // 4. Update booking status
        await connection.query(`
            UPDATE bookings
            SET booking_status = 'Confirmed',
                total_amount = ?
            WHERE booking_id = ?
        `, [breakdown.grand_total, paymentData.booking_id]);
        
        await connection.commit();
        
        return {
            payment_id: paymentResult.insertId,
            breakdown: breakdown
        };
        
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    calculatePaymentBreakdown,
    saveBreakdown,
    processPaymentWithBreakdown
};
