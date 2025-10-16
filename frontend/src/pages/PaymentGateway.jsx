import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import { FaCreditCard, FaMoneyBillWave, FaTag, FaReceipt, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/PaymentGateway.css';

const PaymentGateway = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [breakdown, setBreakdown] = useState(null);
    const [promoCode, setPromoCode] = useState('');
    const [promoApplied, setPromoApplied] = useState(false);
    const [validatingPromo, setValidatingPromo] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    
    const [paymentData, setPaymentData] = useState({
        payment_method: 'Credit Card',
        card_number: '',
        card_holder: '',
        expiry_month: '',
        expiry_year: '',
        cvv: '',
        notes: ''
    });

    useEffect(() => {
        fetchPaymentBreakdown();
    }, [bookingId]);

    const fetchPaymentBreakdown = async (promo = null) => {
        try {
            setLoading(true);
            const response = await api.post('/payments/calculate', {
                booking_id: bookingId,
                promo_code: promo
            });
            setBreakdown(response.data.data);
        } catch (error) {
            console.error('Payment breakdown error:', error);
            toast.error(error.response?.data?.message || 'Failed to load payment details');
            setBreakdown(null);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) {
            toast.error('Please enter a promo code');
            return;
        }

        try {
            setValidatingPromo(true);
            const response = await api.post('/payments/validate-promo', {
                booking_id: bookingId,
                promo_code: promoCode
            });

            toast.success(response.data.message);
            setPromoApplied(true);
            await fetchPaymentBreakdown(promoCode);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid promo code');
        } finally {
            setValidatingPromo(false);
        }
    };

    const handleRemovePromo = () => {
        setPromoCode('');
        setPromoApplied(false);
        fetchPaymentBreakdown(null);
    };

    const handlePayment = async (e) => {
        e.preventDefault();

        // No validation needed - demo mode, accept any payment details
        
        try {
            setProcessing(true);

            // Simulate payment gateway processing (1 second)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Process payment with breakdown
            const response = await api.post('/payments/process-with-breakdown', {
                booking_id: bookingId,
                promo_code: promoApplied ? promoCode : null,
                payment_method: paymentData.payment_method,
                transaction_reference: `TXN${Date.now()}`,
                notes: paymentData.notes
            });

            setPaymentSuccess(true);
            toast.success('Payment processed successfully!');

            // Redirect after 2 seconds
            setTimeout(() => {
                navigate(`/bookings/${bookingId}`);
            }, 2000);

        } catch (error) {
            console.error('Payment error:', error);
            toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <LoadingSpinner />
            </Layout>
        );
    }

    if (!breakdown) {
        return (
            <Layout>
                <Card>
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <h2>Unable to load payment details</h2>
                        <p>Please check the booking and try again.</p>
                        <button onClick={() => navigate(-1)} className="btn btn-secondary">Go Back</button>
                    </div>
                </Card>
            </Layout>
        );
    }

    if (paymentSuccess) {
        return (
            <Layout>
                <div className="payment-success">
                    <Card>
                        <div className="success-content">
                            <FaCheckCircle className="success-icon" />
                            <h1>Payment Successful!</h1>
                            <p>Your payment has been processed successfully.</p>
                            <p className="amount">Amount Paid: {formatCurrency(breakdown.outstanding_amount)}</p>
                            {breakdown.is_fully_paid && (
                                <p style={{ color: '#10b981', fontWeight: 600, marginTop: '1rem' }}>
                                    ✅ Your booking is now fully paid!
                                </p>
                            )}
                            <p className="redirect-message">Redirecting to booking details...</p>
                        </div>
                    </Card>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="payment-gateway-container">
                <h1 className="page-title">
                    <FaReceipt /> Payment Checkout
                </h1>

                <div className="payment-layout">
                    {/* Left Side - Bill Breakdown */}
                    <div className="bill-section">
                        <Card>
                            <h2 className="section-title">Bill Summary</h2>
                            
                            {/* Room Charges */}
                            <div className="bill-item-group">
                                <h3>Room Charges</h3>
                                <div className="bill-item">
                                    <span>{breakdown.nights} Night(s) × {formatCurrency(breakdown.rate_per_night)}</span>
                                    <span className="amount">{formatCurrency(breakdown.room_charge)}</span>
                                </div>
                            </div>

                            {/* Services */}
                            {breakdown.services && breakdown.services.length > 0 && (
                                <div className="bill-item-group">
                                    <h3>Services</h3>
                                    {breakdown.services.map((service, index) => (
                                        <div key={index} className="bill-item">
                                            <span>
                                                {service.service_name} × {service.quantity}
                                            </span>
                                            <span className="amount">{formatCurrency(service.total)}</span>
                                        </div>
                                    ))}
                                    <div className="bill-item subtotal">
                                        <span>Services Total</span>
                                        <span className="amount">{formatCurrency(breakdown.services_total)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Subtotal */}
                            <div className="bill-item-group">
                                <div className="bill-item subtotal-main">
                                    <span><strong>Subtotal</strong></span>
                                    <span className="amount"><strong>{formatCurrency(breakdown.subtotal)}</strong></span>
                                </div>
                            </div>

                            {/* Discount */}
                            {breakdown.discount && (
                                <div className="bill-item-group discount-section">
                                    <h3>Discount Applied</h3>
                                    <div className="bill-item discount">
                                        <span>
                                            <FaTag /> {breakdown.discount.discount_name}
                                            {breakdown.discount.promo_code && ` (${breakdown.discount.promo_code})`}
                                        </span>
                                        <span className="amount">-{formatCurrency(breakdown.discount_amount)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Total Before Tax */}
                            <div className="bill-item-group">
                                <div className="bill-item">
                                    <span>Total Before Tax</span>
                                    <span className="amount">{formatCurrency(breakdown.total_before_tax)}</span>
                                </div>
                            </div>

                            {/* Taxes */}
                            {breakdown.taxes && breakdown.taxes.length > 0 && (
                                <div className="bill-item-group">
                                    <h3>Taxes</h3>
                                    {breakdown.taxes.map((tax, index) => (
                                        <div key={index} className="bill-item">
                                            <span>
                                                {tax.tax_name} ({tax.tax_rate}%)
                                            </span>
                                            <span className="amount">{formatCurrency(tax.tax_amount)}</span>
                                        </div>
                                    ))}
                                    <div className="bill-item subtotal">
                                        <span>Total Tax</span>
                                        <span className="amount">{formatCurrency(breakdown.total_tax)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Fees */}
                            {breakdown.fees && breakdown.fees.length > 0 && (
                                <div className="bill-item-group">
                                    <h3>Additional Fees</h3>
                                    {breakdown.fees.map((fee, index) => (
                                        <div key={index} className="bill-item">
                                            <span>{fee.fee_type} - {fee.fee_reason}</span>
                                            <span className="amount">{formatCurrency(fee.fee_amount)}</span>
                                        </div>
                                    ))}
                                    <div className="bill-item subtotal">
                                        <span>Total Fees</span>
                                        <span className="amount">{formatCurrency(breakdown.total_fees)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Grand Total */}
                            <div className="bill-item-group grand-total-section">
                                <div className="bill-item grand-total">
                                    <span><strong>Grand Total</strong></span>
                                    <span className="amount"><strong>{formatCurrency(breakdown.grand_total)}</strong></span>
                                </div>
                            </div>

                            {/* Payment History */}
                            {breakdown.previous_payments && breakdown.previous_payments.length > 0 && (
                                <div className="bill-item-group" style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '0.5rem', border: '2px solid #3b82f6' }}>
                                    <h3 style={{ color: '#1e40af', marginBottom: '1rem' }}>Previous Payments ({breakdown.payment_count})</h3>
                                    {breakdown.previous_payments.map((payment, index) => (
                                        <div key={index} className="bill-item" style={{ padding: '0.5rem 0', borderBottom: index < breakdown.previous_payments.length - 1 ? '1px solid #bfdbfe' : 'none' }}>
                                            <span style={{ fontSize: '0.875rem' }}>
                                                {new Date(payment.payment_date).toLocaleDateString()} - {payment.payment_method}
                                                {payment.transaction_reference && (
                                                    <span style={{ color: '#6b7280', fontSize: '0.75rem', marginLeft: '0.5rem' }}>({payment.transaction_reference})</span>
                                                )}
                                            </span>
                                            <span className="amount" style={{ color: '#059669', fontWeight: 600 }}>-{formatCurrency(payment.amount)}</span>
                                        </div>
                                    ))}
                                    <div className="bill-item" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '2px solid #3b82f6' }}>
                                        <span><strong style={{ color: '#1e40af' }}>Total Paid</strong></span>
                                        <span className="amount"><strong style={{ color: '#059669' }}>-{formatCurrency(breakdown.paid_amount)}</strong></span>
                                    </div>
                                </div>
                            )}

                            {/* Outstanding Amount */}
                            <div className="bill-item-group" style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: breakdown.is_fully_paid ? '#d1fae5' : '#fef3c7', borderRadius: '0.5rem', border: breakdown.is_fully_paid ? '3px solid #10b981' : '3px solid #f59e0b' }}>
                                <div className="bill-item" style={{ fontSize: '1.25rem' }}>
                                    <span><strong style={{ color: breakdown.is_fully_paid ? '#065f46' : '#92400e' }}>Amount to Pay Now</strong></span>
                                    <span className="amount"><strong style={{ color: breakdown.is_fully_paid ? '#065f46' : '#92400e', fontSize: '1.5rem' }}>{formatCurrency(breakdown.outstanding_amount)}</strong></span>
                                </div>
                                {breakdown.is_fully_paid && (
                                    <div style={{ marginTop: '0.5rem', color: '#065f46', fontSize: '0.875rem', fontWeight: 600 }}>
                                        ✅ This booking is fully paid!
                                    </div>
                                )}
                                {!breakdown.is_fully_paid && breakdown.paid_amount > 0 && (
                                    <div style={{ marginTop: '0.5rem', color: '#92400e', fontSize: '0.875rem' }}>
                                        💡 You have already paid {formatCurrency(breakdown.paid_amount)}. Pay the remaining amount to complete your booking.
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Promo Code Section */}
                        {!promoApplied && (
                            <Card>
                                <h3>Have a Promo Code?</h3>
                                <div className="promo-input-group">
                                    <input
                                        type="text"
                                        placeholder="Enter promo code"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                        disabled={validatingPromo}
                                    />
                                    <button
                                        onClick={handleApplyPromo}
                                        disabled={validatingPromo}
                                        className="btn btn-secondary"
                                    >
                                        {validatingPromo ? 'Validating...' : 'Apply'}
                                    </button>
                                </div>
                            </Card>
                        )}

                        {promoApplied && (
                            <Card>
                                <div className="promo-applied">
                                    <FaTag className="promo-icon" />
                                    <span>Promo code applied: <strong>{promoCode}</strong></span>
                                    <button onClick={handleRemovePromo} className="btn-link">Remove</button>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Right Side - Payment Form */}
                    <div className="payment-form-section">
                        <Card>
                            <h2 className="section-title">Payment Details</h2>
                            
                            <form onSubmit={handlePayment}>
                                {/* Payment Method */}
                                <div className="form-group">
                                    <label>Payment Method</label>
                                    <select
                                        value={paymentData.payment_method}
                                        onChange={(e) => setPaymentData({...paymentData, payment_method: e.target.value})}
                                        required
                                    >
                                        <option value="Credit Card">Credit Card</option>
                                        <option value="Debit Card">Debit Card</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                    </select>
                                </div>

                                {(paymentData.payment_method === 'Credit Card' || paymentData.payment_method === 'Debit Card') && (
                                    <>
                                        {/* Card Holder Name */}
                                        <div className="form-group">
                                            <label>Card Holder Name</label>
                                            <input
                                                type="text"
                                                placeholder="John Doe"
                                                value={paymentData.card_holder}
                                                onChange={(e) => setPaymentData({...paymentData, card_holder: e.target.value})}
                                                required
                                            />
                                        </div>

                                        {/* Card Number */}
                                        <div className="form-group">
                                            <label>
                                                <FaCreditCard /> Card Number
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="1234 5678 9012 3456"
                                                maxLength="19"
                                                value={paymentData.card_number}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\s/g, '');
                                                    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                                                    setPaymentData({...paymentData, card_number: formatted});
                                                }}
                                                required
                                            />
                                        </div>

                                        {/* Expiry and CVV */}
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Expiry Month</label>
                                                <select
                                                    value={paymentData.expiry_month}
                                                    onChange={(e) => setPaymentData({...paymentData, expiry_month: e.target.value})}
                                                    required
                                                >
                                                    <option value="">MM</option>
                                                    {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                                                        <option key={month} value={month.toString().padStart(2, '0')}>
                                                            {month.toString().padStart(2, '0')}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Expiry Year</label>
                                                <select
                                                    value={paymentData.expiry_year}
                                                    onChange={(e) => setPaymentData({...paymentData, expiry_year: e.target.value})}
                                                    required
                                                >
                                                    <option value="">YYYY</option>
                                                    {Array.from({length: 10}, (_, i) => new Date().getFullYear() + i).map(year => (
                                                        <option key={year} value={year}>{year}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>CVV</label>
                                                <input
                                                    type="text"
                                                    placeholder="123"
                                                    maxLength="4"
                                                    value={paymentData.cvv}
                                                    onChange={(e) => setPaymentData({...paymentData, cvv: e.target.value.replace(/\D/g, '')})}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Notes */}
                                <div className="form-group">
                                    <label>Notes (Optional)</label>
                                    <textarea
                                        placeholder="Any additional notes..."
                                        value={paymentData.notes}
                                        onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                                        rows="3"
                                    />
                                </div>

                                {/* Payment Summary */}
                                <div className="payment-summary">
                                    <div className="summary-row">
                                        <span>Grand Total:</span>
                                        <span>{formatCurrency(breakdown.grand_total)}</span>
                                    </div>
                                    {breakdown.paid_amount > 0 && (
                                        <div className="summary-row" style={{ color: '#059669' }}>
                                            <span>Already Paid:</span>
                                            <span>-{formatCurrency(breakdown.paid_amount)}</span>
                                        </div>
                                    )}
                                    <div className="summary-row" style={{ borderTop: '2px solid #e5e7eb', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                                        <span><strong>Amount to Pay Now:</strong></span>
                                        <span className="total-amount"><strong>{formatCurrency(breakdown.outstanding_amount)}</strong></span>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-block"
                                    disabled={processing || breakdown.is_fully_paid}
                                >
                                    {breakdown.is_fully_paid ? (
                                        <>✅ Fully Paid</>
                                    ) : processing ? (
                                        <>Processing Payment...</>
                                    ) : (
                                        <>
                                            <FaMoneyBillWave /> Pay {formatCurrency(breakdown.outstanding_amount)}
                                        </>
                                    )}
                                </button>

                                {breakdown.is_fully_paid && (
                                    <p style={{ textAlign: 'center', color: '#10b981', fontWeight: 600, marginTop: '1rem' }}>
                                        This booking is already fully paid!
                                    </p>
                                )}

                                <p className="security-note">
                                    🔒 Your payment information is secure and encrypted
                                </p>
                            </form>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PaymentGateway;
