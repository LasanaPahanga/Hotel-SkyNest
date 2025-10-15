import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { bookingAPI, serviceAPI, paymentAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime, formatCurrency, getStatusClass } from '../utils/helpers';
import { FaCheckCircle, FaTimesCircle, FaBan, FaPlus } from 'react-icons/fa';
import '../styles/BookingDetails.css';

const BookingDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState('');
    const [serviceQuantity, setServiceQuantity] = useState(1);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');

    useEffect(() => {
        fetchBookingDetails();
    }, [id]);

    // Fetch services after booking is loaded (to get branch_id)
    useEffect(() => {
        if (booking?.branch_id) {
            fetchServices();
        }
    }, [booking?.branch_id]);

    const fetchBookingDetails = async () => {
        try {
            const response = await bookingAPI.getById(id);
            setBooking(response.data.data);
        } catch (error) {
            console.error('Error fetching booking:', error);
            toast.error('Failed to load booking details');
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        try {
            // Fetch services with branch_id to get custom prices
            const params = { is_active: true };
            if (booking?.branch_id) {
                params.branch_id = booking.branch_id;
            }
            const response = await serviceAPI.getAll(params);
            setServices(response.data.data);
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const handleCheckIn = async () => {
        if (!window.confirm('Are you sure you want to check in this guest?')) return;

        try {
            await bookingAPI.checkIn(id);
            toast.success('Guest checked in successfully');
            fetchBookingDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to check in');
        }
    };

    const handleCheckOut = async () => {
        if (booking.outstanding_amount > 0) {
            toast.error('Cannot check out with outstanding balance');
            return;
        }

        if (!window.confirm('Are you sure you want to check out this guest?')) return;

        try {
            await bookingAPI.checkOut(id);
            toast.success('Guest checked out successfully');
            fetchBookingDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to check out');
        }
    };

    const handleCancel = async () => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;

        try {
            await bookingAPI.cancel(id);
            toast.success('Booking cancelled successfully');
            fetchBookingDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel booking');
        }
    };

    const handleAddService = async (e) => {
        e.preventDefault();

        try {
            await serviceAPI.addUsage({
                booking_id: parseInt(id),
                service_id: parseInt(selectedService),
                quantity: serviceQuantity
            });
            toast.success('Service added successfully');
            setShowServiceModal(false);
            setSelectedService('');
            setServiceQuantity(1);
            fetchBookingDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add service');
        }
    };

    const handleProcessPayment = async (e) => {
        e.preventDefault();

        try {
            await paymentAPI.process({
                booking_id: parseInt(id),
                amount: parseFloat(paymentAmount),
                payment_method: paymentMethod
            });
            toast.success('Payment processed successfully');
            setShowPaymentModal(false);
            setPaymentAmount('');
            fetchBookingDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to process payment');
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
                <div className="error-message">Booking not found</div>
            </Layout>
        );
    }

    const canManage = user?.role === 'Admin' || user?.role === 'Receptionist';

    return (
        <Layout>
            <div className="booking-details-page">
                <div className="page-header">
                    <h1>Booking #{booking.booking_id}</h1>
                    <div className="header-actions">
                        {canManage && booking.booking_status === 'Booked' && (
                            <button className="btn btn-success" onClick={handleCheckIn}>
                                <FaCheckCircle /> Check In
                            </button>
                        )}
                        {canManage && booking.booking_status === 'Checked-In' && (
                            <button className="btn btn-primary" onClick={handleCheckOut}>
                                <FaTimesCircle /> Check Out
                            </button>
                        )}
                        {booking.booking_status !== 'Checked-Out' && booking.booking_status !== 'Cancelled' && (
                            <button className="btn btn-danger" onClick={handleCancel}>
                                <FaBan /> Cancel
                            </button>
                        )}
                    </div>
                </div>

                <div className="details-grid">
                    {/* Guest Information */}
                    <Card title="Guest Information">
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Name:</label>
                                <span>{booking.first_name} {booking.last_name}</span>
                            </div>
                            <div className="info-item">
                                <label>Email:</label>
                                <span>{booking.email}</span>
                            </div>
                            <div className="info-item">
                                <label>Phone:</label>
                                <span>{booking.phone}</span>
                            </div>
                            <div className="info-item">
                                <label>ID Type:</label>
                                <span>{booking.id_type}</span>
                            </div>
                            <div className="info-item">
                                <label>ID Number:</label>
                                <span>{booking.id_number}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Booking Information */}
                    <Card title="Booking Information">
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Status:</label>
                                <span className={`status-badge ${getStatusClass(booking.booking_status)}`}>
                                    {booking.booking_status}
                                </span>
                            </div>
                            <div className="info-item">
                                <label>Branch:</label>
                                <span>{booking.branch_name}</span>
                            </div>
                            <div className="info-item">
                                <label>Room:</label>
                                <span>{booking.room_number} ({booking.room_type})</span>
                            </div>
                            <div className="info-item">
                                <label>Check-in:</label>
                                <span>{formatDate(booking.check_in_date)}</span>
                            </div>
                            <div className="info-item">
                                <label>Check-out:</label>
                                <span>{formatDate(booking.check_out_date)}</span>
                            </div>
                            <div className="info-item">
                                <label>Guests:</label>
                                <span>{booking.number_of_guests}</span>
                            </div>
                            {booking.actual_check_in && (
                                <div className="info-item">
                                    <label>Actual Check-in:</label>
                                    <span>{formatDateTime(booking.actual_check_in)}</span>
                                </div>
                            )}
                            {booking.actual_check_out && (
                                <div className="info-item">
                                    <label>Actual Check-out:</label>
                                    <span>{formatDateTime(booking.actual_check_out)}</span>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Billing Information */}
                    <Card title="Billing Information">
                        <div className="billing-summary">
                            <div className="billing-row">
                                <span>Total Amount:</span>
                                <strong>{formatCurrency(booking.total_amount)}</strong>
                            </div>
                            <div className="billing-row">
                                <span>Paid Amount:</span>
                                <strong className="text-success">{formatCurrency(booking.paid_amount)}</strong>
                            </div>
                            <div className="billing-row">
                                <span>Outstanding:</span>
                                <strong className={booking.outstanding_amount > 0 ? 'text-danger' : 'text-success'}>
                                    {formatCurrency(booking.outstanding_amount)}
                                </strong>
                            </div>
                        </div>
                        {canManage && booking.outstanding_amount > 0 && (
                            <button 
                                className="btn btn-primary btn-block"
                                onClick={() => setShowPaymentModal(true)}
                            >
                                Process Payment
                            </button>
                        )}
                    </Card>

                    {/* Services */}
                    <Card 
                        title="Services Used"
                        actions={
                            canManage && booking.booking_status === 'Checked-In' && (
                                <button 
                                    className="btn btn-sm btn-primary"
                                    onClick={() => setShowServiceModal(true)}
                                >
                                    <FaPlus /> Add Service
                                </button>
                            )
                        }
                    >
                        {booking.services && booking.services.length > 0 ? (
                            <div className="services-list">
                                {booking.services.map((service) => (
                                    <div key={service.usage_id} className="service-item">
                                        <div>
                                            <strong>{service.service_name}</strong>
                                            <p className="service-date">{formatDateTime(service.usage_date)}</p>
                                        </div>
                                        <div className="service-details">
                                            <span>Qty: {service.quantity}</span>
                                            <strong>{formatCurrency(service.total_price)}</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="empty-message">No services used</p>
                        )}
                    </Card>

                    {/* Payments */}
                    <Card title="Payment History">
                        {booking.payments && booking.payments.length > 0 ? (
                            <div className="payments-list">
                                {booking.payments.map((payment) => (
                                    <div key={payment.payment_id} className="payment-item">
                                        <div>
                                            <strong>{formatCurrency(payment.amount)}</strong>
                                            <p className="payment-date">{formatDateTime(payment.payment_date)}</p>
                                        </div>
                                        <div className="payment-details">
                                            <span className="payment-method">{payment.payment_method}</span>
                                            <span className={`status-badge ${getStatusClass(payment.payment_status)}`}>
                                                {payment.payment_status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="empty-message">No payments recorded</p>
                        )}
                    </Card>
                </div>

                {/* Add Service Modal */}
                <Modal
                    isOpen={showServiceModal}
                    onClose={() => setShowServiceModal(false)}
                    title="Add Service"
                >
                    <form onSubmit={handleAddService}>
                        <div className="form-group">
                            <label>Service</label>
                            <select
                                value={selectedService}
                                onChange={(e) => setSelectedService(e.target.value)}
                                required
                            >
                                <option value="">Select a service</option>
                                {services.map((service) => (
                                    <option key={service.service_id} value={service.service_id}>
                                        {service.service_name} - {formatCurrency(service.custom_price || service.unit_price)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Quantity</label>
                            <input
                                type="number"
                                min="1"
                                value={serviceQuantity}
                                onChange={(e) => setServiceQuantity(parseInt(e.target.value))}
                                required
                            />
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowServiceModal(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Add Service
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Process Payment Modal */}
                <Modal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    title="Process Payment"
                >
                    <form onSubmit={handleProcessPayment}>
                        <div className="payment-info">
                            <p>Outstanding Amount: <strong>{formatCurrency(booking.outstanding_amount)}</strong></p>
                        </div>
                        <div className="form-group">
                            <label>Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={booking.outstanding_amount}
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="Enter amount"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Payment Method</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                required
                            >
                                <option value="Cash">Cash</option>
                                <option value="Credit Card">Credit Card</option>
                                <option value="Debit Card">Debit Card</option>
                                <option value="Online Transfer">Online Transfer</option>
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Process Payment
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
};

export default BookingDetails;
