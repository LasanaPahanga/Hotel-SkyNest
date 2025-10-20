import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import { bookingAPI, paymentAPI, serviceAPI } from '../../utils/api';
import { formatDate, formatCurrency, formatDateTime } from '../../utils/helpers';
import dashboardImage from '../../assets/dashboard.jpeg';
import '../../styles/GuestDashboard.css';
import '../../styles/CommonPage.css';
import '../../styles/GuestTheme.css';

const BookingDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [services, setServices] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookingDetails();
    }, [id]);

    const fetchBookingDetails = async () => {
        try {
            const [bookingRes, servicesRes, paymentsRes] = await Promise.all([
                bookingAPI.getById(id),
                serviceAPI.getUsage(id),
                paymentAPI.getByBooking(id)
            ]);
            
            setBooking(bookingRes.data.data);
            setServices(servicesRes.data.data || []);
            setPayments(paymentsRes.data.data || []);
        } catch (error) {
            console.error('Error fetching booking details:', error);
            alert('Failed to load booking details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <LoadingSpinner message="Loading booking details..." />
            </Layout>
        );
    }

    if (!booking) {
        return (
            <Layout>
                <div className="error-state">
                    <h2>Booking not found</h2>
                    <button className="btn btn-primary" onClick={() => navigate('/guest/bookings')}>
                        Back to My Bookings
                    </button>
                </div>
            </Layout>
        );
    }

    const roomCharges = booking.total_amount - (services.reduce((sum, s) => sum + parseFloat(s.total_price), 0));
    const serviceCharges = services.reduce((sum, s) => sum + parseFloat(s.total_price), 0);
    const nights = Math.ceil((new Date(booking.check_out_date) - new Date(booking.check_in_date)) / (1000 * 60 * 60 * 24));

    return (
        <Layout>
            <div 
                className="booking-details-page common-page" 
                style={{ 
                    backgroundImage: `url(${dashboardImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: 'fixed',
                    minHeight: '100vh',
                    maxWidth: '1400px'
                }}
            >
                <div className="page-header">
                    <button className="btn btn-secondary" onClick={() => navigate('/guest/bookings')}>
                        ← Back to Bookings
                    </button>
                    <h1>Booking #{booking.booking_id}</h1>
                    <span className={`status-badge status-${booking.booking_status.toLowerCase()}`}>
                        {booking.booking_status}
                    </span>
                </div>

                <div className="details-grid">
                    {/* Booking Information */}
                    <Card title="Booking Information">
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="label">Hotel</span>
                                <span className="value">{booking.branch_name}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Location</span>
                                <span className="value">{booking.location}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Room</span>
                                <span className="value">{booking.room_number} - {booking.room_type_name}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Guests</span>
                                <span className="value">{booking.number_of_guests}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Check-in Date</span>
                                <span className="value">{formatDate(booking.check_in_date)}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Check-out Date</span>
                                <span className="value">{formatDate(booking.check_out_date)}</span>
                            </div>
                            {booking.actual_check_in && (
                                <div className="info-item">
                                    <span className="label">Actual Check-in</span>
                                    <span className="value">{formatDateTime(booking.actual_check_in)}</span>
                                </div>
                            )}
                            {booking.actual_check_out && (
                                <div className="info-item">
                                    <span className="label">Actual Check-out</span>
                                    <span className="value">{formatDateTime(booking.actual_check_out)}</span>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Live Bill */}
                    <Card title="Live Bill" className="bill-card">
                        <div className="bill-section">
                            <h4>Room Charges</h4>
                            <div className="bill-item">
                                <span>{booking.room_type_name} × {nights} night(s)</span>
                                <span className="amount">{formatCurrency(roomCharges)}</span>
                            </div>
                        </div>

                        {services.length > 0 && (
                            <div className="bill-section">
                                <h4>Service Charges</h4>
                                {services.map((service) => (
                                    <div key={service.usage_id} className="bill-item">
                                        <span>
                                            {service.service_name} × {service.quantity}
                                            <small className="service-date">{formatDate(service.usage_date)}</small>
                                        </span>
                                        <span className="amount">{formatCurrency(service.total_price)}</span>
                                    </div>
                                ))}
                                <div className="bill-item subtotal">
                                    <span>Service Subtotal</span>
                                    <span className="amount">{formatCurrency(serviceCharges)}</span>
                                </div>
                            </div>
                        )}

                        <div className="bill-section bill-total">
                            <div className="bill-item total">
                                <span>Total Amount</span>
                                <span className="amount">{formatCurrency(booking.total_amount)}</span>
                            </div>
                            <div className="bill-item paid">
                                <span>Paid Amount</span>
                                <span className="amount">{formatCurrency(booking.paid_amount)}</span>
                            </div>
                            <div className={`bill-item outstanding ${booking.outstanding_amount > 0 ? 'has-outstanding' : ''}`}>
                                <span>Outstanding</span>
                                <span className="amount">{formatCurrency(booking.outstanding_amount)}</span>
                            </div>
                        </div>

                        {booking.outstanding_amount > 0 && booking.booking_status === 'Checked-In' && (
                            <div className="bill-alert">
                                <strong>⚠️ Payment Required</strong>
                                <p>Please settle the outstanding amount before check-out</p>
                            </div>
                        )}
                    </Card>

                    {/* Payment History */}
                    {payments.length > 0 && (
                        <Card title="Payment History">
                            <div className="payment-history">
                                {payments.map((payment) => (
                                    <div key={payment.payment_id} className="payment-item">
                                        <div className="payment-info">
                                            <span className="payment-date">{formatDateTime(payment.payment_date)}</span>
                                            <span className="payment-method">{payment.payment_method}</span>
                                            {payment.transaction_reference && (
                                                <span className="payment-ref">Ref: {payment.transaction_reference}</span>
                                            )}
                                        </div>
                                        <span className="payment-amount">{formatCurrency(payment.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Actions */}
                    {booking.booking_status === 'Checked-In' && (
                        <Card title="Quick Actions">
                            <div className="action-buttons">
                                <button 
                                    className="btn btn-primary btn-block"
                                    onClick={() => navigate(`/guest/request-service?booking=${booking.booking_id}`)}
                                >
                                    Request Service
                                </button>
                                <button 
                                    className="btn btn-secondary btn-block"
                                    onClick={() => navigate(`/guest/support?booking=${booking.booking_id}`)}
                                >
                                    Contact Support
                                </button>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default BookingDetails;
