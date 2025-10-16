const { promisePool } = require('../config/database');

/**
 * Complete Payment Service
 * Handles full payment tracking with partial payments
 */

/**
 * Get booking payment summary
 */
const getBookingPaymentSummary = async (bookingId) => {
    const connection = await promisePool.getConnection();
    
    try {
        // Get booking with payment info
        const [bookings] = await connection.query(`
            SELECT 
                booking_id,
                total_amount,
                paid_amount,
                outstanding_amount
            FROM bookings
            WHERE booking_id = ?
        `, [bookingId]);
        
        if (!bookings || bookings.length === 0) {
            throw new Error('Booking not found');
        }
        
        const booking = bookings[0];
        
        // Get all payments for this booking
        const [payments] = await connection.query(`
            SELECT 
                payment_id,
                amount,
                payment_method,
                payment_status,
                transaction_reference,
                payment_date,
                notes
            FROM payments
            WHERE booking_id = ?
            ORDER BY payment_date DESC
        `, [bookingId]);
        
        return {
            booking_id: bookingId,
            total_amount: parseFloat(booking.total_amount || 0),
            paid_amount: parseFloat(booking.paid_amount || 0),
            outstanding_amount: parseFloat(booking.outstanding_amount || 0),
            payments: payments || [],
            payment_count: payments.length,
            is_fully_paid: parseFloat(booking.outstanding_amount || 0) <= 0
        };
        
    } finally {
        connection.release();
    }
};

/**
 * Calculate payment breakdown with partial payments considered
 */
const calculatePaymentBreakdown = async (bookingId, promoCode = null) => {
    const connection = await promisePool.getConnection();
    
    try {
        // 1. Get booking details
        const [bookings] = await connection.query(`
            SELECT 
                b.booking_id, b.branch_id, b.room_id, b.guest_id,
                b.check_in_date, b.check_out_date, 
                b.total_amount, b.paid_amount, b.outstanding_amount,
                b.booking_status, b.special_requests,
                r.room_number,
                rt.type_name, rt.base_rate,
                DATEDIFF(b.check_out_date, b.check_in_date) as nights,
                br.branch_name,
                CONCAT(g.first_name, ' ', g.last_name) as guest_name,
                g.email as guest_email
            FROM bookings b
            JOIN rooms r ON b.room_id = r.room_id
            JOIN room_types rt ON r.room_type_id = rt.room_type_id
            JOIN hotel_branches br ON b.branch_id = br.branch_id
            JOIN guests g ON b.guest_id = g.guest_id
            WHERE b.booking_id = ?
        `, [bookingId]);

        if (!bookings || bookings.length === 0) {
            throw new Error('Booking not found');
        }

        const booking = bookings[0];
        
        if (!booking.branch_id) {
            throw new Error('Booking has no branch assigned');
        }

        // 2. Calculate room charge
        const nights = booking.nights || 0;
        const ratePerNight = parseFloat(booking.base_rate || 0);
        const roomCharge = nights * ratePerNight;
        
        // 3. Get services
        let services = [];
        let servicesTotal = 0;
        
        try {
            const [serviceRows] = await connection.query(`
                SELECT 
                    su.usage_id,
                    su.quantity,
                    su.total_price,
                    sc.service_name,
                    sc.base_price as price,
                    sc.category
                FROM service_usage su
                JOIN service_catalogue sc ON su.service_id = sc.service_id
                WHERE su.booking_id = ?
            `, [bookingId]);
            
            services = serviceRows || [];
            servicesTotal = services.reduce((sum, s) => sum + parseFloat(s.total_price || 0), 0);
        } catch (err) {
            console.log('No services found or error:', err.message);
        }
        
        // 4. Calculate subtotal
        const subtotal = roomCharge + servicesTotal;
        
        // 5. Apply discount if promo code provided
        let discountAmount = 0;
        let discountDetails = null;
        
        if (promoCode && promoCode.trim()) {
            try {
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
                `, [booking.branch_id, promoCode.trim().toUpperCase()]);

                if (discounts && discounts.length > 0) {
                    const discount = discounts[0];
                    
                    const minAmount = parseFloat(discount.min_booking_amount || 0);
                    if (subtotal >= minAmount) {
                        const usageLimit = discount.usage_limit;
                        const usageCount = discount.usage_count || 0;
                        
                        if (!usageLimit || usageCount < usageLimit) {
                            if (discount.discount_type === 'Percentage') {
                                discountAmount = subtotal * (parseFloat(discount.discount_value) / 100);
                            } else {
                                discountAmount = parseFloat(discount.discount_value);
                            }
                            
                            const maxDiscount = discount.max_discount_amount;
                            if (maxDiscount && discountAmount > parseFloat(maxDiscount)) {
                                discountAmount = parseFloat(maxDiscount);
                            }
                            
                            discountDetails = {
                                discount_config_id: discount.discount_config_id,
                                discount_name: discount.discount_name,
                                discount_type: discount.discount_type,
                                discount_value: discount.discount_value,
                                promo_code: promoCode.trim().toUpperCase(),
                                discount_amount: parseFloat(discountAmount.toFixed(2))
                            };
                        } else {
                            throw new Error('Promo code usage limit exceeded');
                        }
                    } else {
                        throw new Error(`Minimum booking amount of Rs. ${minAmount} required`);
                    }
                } else {
                    throw new Error('Invalid or expired promo code');
                }
            } catch (err) {
                if (err.message.includes('Promo code') || err.message.includes('Minimum') || err.message.includes('Invalid')) {
                    throw err;
                }
                console.log('Discount error:', err.message);
            }
        }
        
        // 6. Calculate total before tax
        const totalBeforeTax = subtotal - discountAmount;
        
        // 7. Get taxes and apply correctly
        let taxes = [];
        let totalTax = 0;
        
        try {
            const [taxRows] = await connection.query(`
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

            if (taxRows && taxRows.length > 0) {
                taxes = taxRows.map(tax => {
                    let taxableAmount = 0;
                    let taxAmount = 0;
                    
                    // Apply tax based on type
                    if (tax.tax_type === 'Service Tax') {
                        // Service Tax applies only to services
                        if (servicesTotal > 0 && subtotal > 0) {
                            // Calculate discount proportion for services
                            const discountOnServices = (servicesTotal / subtotal) * discountAmount;
                            taxableAmount = servicesTotal - discountOnServices;
                            taxAmount = tax.is_percentage 
                                ? (taxableAmount * parseFloat(tax.tax_rate) / 100)
                                : parseFloat(tax.tax_rate);
                        } else {
                            // No services or subtotal is 0, so no service tax
                            taxableAmount = 0;
                            taxAmount = 0;
                        }
                    } else if (tax.tax_type === 'VAT' || tax.tax_type === 'GST') {
                        // VAT/GST applies to everything (room + services)
                        taxableAmount = totalBeforeTax;
                        taxAmount = tax.is_percentage 
                            ? (taxableAmount * parseFloat(tax.tax_rate) / 100)
                            : parseFloat(tax.tax_rate);
                    } else {
                        // Other taxes apply to total before tax
                        taxableAmount = totalBeforeTax;
                        taxAmount = tax.is_percentage 
                            ? (taxableAmount * parseFloat(tax.tax_rate) / 100)
                            : parseFloat(tax.tax_rate);
                    }
                    
                    return {
                        tax_config_id: tax.tax_config_id,
                        tax_name: tax.tax_name,
                        tax_type: tax.tax_type,
                        tax_rate: parseFloat(tax.tax_rate),
                        is_percentage: tax.is_percentage,
                        taxable_amount: parseFloat(taxableAmount.toFixed(2)),
                        tax_amount: parseFloat(taxAmount.toFixed(2))
                    };
                });
                totalTax = taxes.reduce((sum, tax) => sum + tax.tax_amount, 0);
            }
        } catch (err) {
            console.log('No taxes found or error:', err.message);
        }
        
        // 8. Get fees
        let fees = [];
        let totalFees = 0;
        
        try {
            const [feeRows] = await connection.query(`
                SELECT 
                    bf.booking_fee_id,
                    bf.fee_amount,
                    bf.fee_reason,
                    fc.fee_type,
                    fc.fee_calculation
                FROM booking_fees bf
                LEFT JOIN fee_configurations fc ON bf.fee_config_id = fc.fee_config_id
                WHERE bf.booking_id = ?
            `, [bookingId]);

            if (feeRows && feeRows.length > 0) {
                fees = feeRows.map(fee => ({
                    booking_fee_id: fee.booking_fee_id,
                    fee_type: fee.fee_type || 'Other',
                    fee_reason: fee.fee_reason,
                    fee_amount: parseFloat(fee.fee_amount || 0)
                }));
                totalFees = fees.reduce((sum, fee) => sum + fee.fee_amount, 0);
            }
        } catch (err) {
            console.log('No fees found or error:', err.message);
        }
        
        // 9. Calculate grand total
        const grandTotal = totalBeforeTax + totalTax + totalFees;
        
        // 10. Get payment history
        const paidAmount = parseFloat(booking.paid_amount || 0);
        const outstandingAmount = grandTotal - paidAmount;
        
        // Get previous payments
        const [previousPayments] = await connection.query(`
            SELECT 
                payment_id,
                amount,
                payment_method,
                payment_date,
                transaction_reference
            FROM payments
            WHERE booking_id = ?
            ORDER BY payment_date DESC
        `, [bookingId]);
        
        // 11. Build breakdown object
        const breakdown = {
            booking_id: bookingId,
            branch_id: booking.branch_id,
            branch_name: booking.branch_name,
            room_number: booking.room_number,
            room_type: booking.type_name,
            guest_id: booking.guest_id,
            guest_name: booking.guest_name,
            guest_email: booking.guest_email,
            check_in_date: booking.check_in_date,
            check_out_date: booking.check_out_date,
            
            // Room charges
            nights: nights,
            rate_per_night: parseFloat(ratePerNight.toFixed(2)),
            room_charge: parseFloat(roomCharge.toFixed(2)),
            
            // Services
            services: services.map(s => ({
                service_name: s.service_name,
                category: s.category,
                quantity: s.quantity,
                unit_price: parseFloat(s.price || 0),
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
            taxes: taxes,
            tax_amount: parseFloat(totalTax.toFixed(2)),
            
            // Fees
            fees: fees,
            fees_amount: parseFloat(totalFees.toFixed(2)),
            
            // Grand total
            grand_total: parseFloat(grandTotal.toFixed(2)),
            
            // Payment tracking
            paid_amount: parseFloat(paidAmount.toFixed(2)),
            outstanding_amount: parseFloat(outstandingAmount.toFixed(2)),
            is_fully_paid: outstandingAmount <= 0,
            previous_payments: previousPayments || [],
            payment_count: previousPayments.length,
            
            // Metadata
            calculation_date: new Date()
        };
        
        return breakdown;
        
    } finally {
        connection.release();
    }
};

/**
 * Process payment (handles both partial and full)
 */
const processPayment = async (paymentData) => {
    let connection;
    
    try {
        connection = await promisePool.getConnection();
        await connection.beginTransaction();
        
        const { booking_id, amount, payment_method, transaction_id, processed_by, notes, promo_code } = paymentData;
        
        // 1. Get current breakdown
        const breakdown = await calculatePaymentBreakdown(booking_id, promo_code);
        
        // 2. Determine payment amount
        let paymentAmount = amount;
        let isFullPayment = false;
        
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            // Full payment - pay outstanding amount
            paymentAmount = breakdown.outstanding_amount;
            isFullPayment = true;
        } else {
            // Partial payment
            paymentAmount = parseFloat(paymentAmount);
            
            // Check if this payment will complete the booking
            if (paymentAmount >= breakdown.outstanding_amount) {
                paymentAmount = breakdown.outstanding_amount;
                isFullPayment = true;
            }
        }
        
        if (paymentAmount <= 0) {
            throw new Error('Booking is already fully paid');
        }
        
        // 3. Save breakdown if full payment
        if (isFullPayment) {
            await connection.query(`
                INSERT INTO payment_breakdowns (
                    booking_id, room_charge, services_total, subtotal,
                    discount_amount, discount_config_id, total_before_tax,
                    tax_amount, fees_amount, grand_total, breakdown_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    room_charge = VALUES(room_charge),
                    services_total = VALUES(services_total),
                    subtotal = VALUES(subtotal),
                    discount_amount = VALUES(discount_amount),
                    total_before_tax = VALUES(total_before_tax),
                    tax_amount = VALUES(tax_amount),
                    fees_amount = VALUES(fees_amount),
                    grand_total = VALUES(grand_total),
                    breakdown_json = VALUES(breakdown_json)
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
            
            // Save taxes
            if (breakdown.taxes && breakdown.taxes.length > 0) {
                for (const tax of breakdown.taxes) {
                    await connection.query(`
                        INSERT INTO booking_taxes (
                            booking_id, tax_config_id, tax_name, 
                            tax_rate, taxable_amount, tax_amount
                        )
                        VALUES (?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE 
                            tax_amount = VALUES(tax_amount), 
                            tax_rate = VALUES(tax_rate),
                            taxable_amount = VALUES(taxable_amount)
                    `, [
                        breakdown.booking_id, 
                        tax.tax_config_id, 
                        tax.tax_name,
                        tax.tax_rate,
                        tax.taxable_amount || breakdown.total_before_tax,
                        tax.tax_amount
                    ]);
                }
            }
            
            // Save discount
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
        }
        
        // 4. Create payment record
        const [paymentResult] = await connection.query(`
            INSERT INTO payments (
                booking_id, amount, payment_method, payment_status,
                transaction_reference, payment_date, processed_by, notes
            ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)
        `, [
            booking_id,
            paymentAmount,
            payment_method || 'Cash',
            'Completed',
            transaction_id || `TXN${Date.now()}`,
            processed_by || null,
            notes || null
        ]);
        
        // 5. Update booking amounts
        const newPaidAmount = breakdown.paid_amount + paymentAmount;
        const newOutstandingAmount = breakdown.grand_total - newPaidAmount;
        
        await connection.query(`
            UPDATE bookings
            SET 
                total_amount = ?,
                paid_amount = ?,
                outstanding_amount = ?
            WHERE booking_id = ?
        `, [
            breakdown.grand_total,
            newPaidAmount,
            newOutstandingAmount,
            booking_id
        ]);
        
        await connection.commit();
        
        // 6. Get updated summary
        const updatedSummary = await getBookingPaymentSummary(booking_id);
        
        return {
            payment_id: paymentResult.insertId,
            payment_amount: parseFloat(paymentAmount.toFixed(2)),
            is_full_payment: isFullPayment,
            breakdown: breakdown,
            payment_summary: updatedSummary
        };
        
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Payment processing error:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports = {
    getBookingPaymentSummary,
    calculatePaymentBreakdown,
    processPayment
};
