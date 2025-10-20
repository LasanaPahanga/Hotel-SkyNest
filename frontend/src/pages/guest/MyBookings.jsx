import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GuestLayout from '../../components/GuestLayout';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { bookingAPI, paymentAPI, serviceAPI } from '../../utils/api';
import { formatDate, formatCurrency, formatDateTime } from '../../utils/helpers';
import { FaSync, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import dashboardImage from '../../assets/dashboard.jpeg';
import '../../styles/GuestDashboard.css';
import '../../styles/CommonPage.css';
import '../../styles/GuestTheme.css';

const MyBookings = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, current, upcoming, past
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [bookingDetails, setBookingDetails] = useState(null);

    useEffect(() => {
        fetchBookings();
        
        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchBookings();
        }, 30000);
        
        return () => clearInterval(interval);
    }, []);

    const fetchBookings = async (showToast = false) => {
        try {
            const response = await bookingAPI.getAll();
            setBookings(response.data.data);
            if (showToast) {
                toast.success('Bookings refreshed!');
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            if (showToast) {
                toast.error('Failed to refresh bookings');
            }
        } finally {
            setLoading(false);
        }
    };

    const getBookingsByStatus = () => {
        const today = new Date().toISOString().split('T')[0];
        
        switch(filter) {
            case 'current':
                return bookings.filter(b => b.booking_status === 'Checked-In');
            case 'upcoming':
                return bookings.filter(b => 
                    b.booking_status === 'Booked' && b.check_in_date >= today
                );
            case 'past':
                return bookings.filter(b => 
                    b.booking_status === 'Checked-Out' || 
                    (b.booking_status === 'Cancelled')
                );
            default:
                return bookings;
        }
    };

    const getStatusBadgeClass = (status) => {
        const classes = {
            'Booked': 'badge-info',
            'Checked-In': 'badge-success',
            'Checked-Out': 'badge-secondary',
            'Cancelled': 'badge-danger'
        };
        return classes[status] || 'badge-secondary';
    };

    const handleViewBooking = async (booking) => {
        setSelectedBooking(booking);
        setShowModal(true);
        setModalLoading(true);
        
        try {
            const [servicesRes, paymentsRes] = await Promise.all([
                serviceAPI.getUsage(booking.booking_id),
                paymentAPI.getByBooking(booking.booking_id)
            ]);
            
            setBookingDetails({
                services: servicesRes.data.data || [],
                payments: paymentsRes.data.data || []
            });
        } catch (error) {
            console.error('Error fetching booking details:', error);
            toast.error('Failed to load booking details');
        } finally {
            setModalLoading(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedBooking(null);
        setBookingDetails(null);
    };

    const filteredBookings = getBookingsByStatus();

    if (loading) {
        return (
            <GuestLayout>
                <LoadingSpinner message="Loading your bookings..." />
            </GuestLayout>
        );
    }

    return (
        <GuestLayout>
            <div 
                className="my-bookings-page common-page" 
                style={{ 
                    backgroundImage: `url(${dashboardImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: 'fixed',
                    minHeight: '100vh'
                }}
            >
                <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>My Bookings</h1>
                        <p>View and manage your hotel reservations</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                            className="btn btn-secondary"
                            onClick={() => fetchBookings(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <FaSync /> Refresh
                        </button>
                        <button 
                            className="btn btn-primary"
                            onClick={() => navigate('/guest/bookings/new')}
                        >
                            New Booking
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="filter-tabs">
                    <button 
                        className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All Bookings ({bookings.length})
                    </button>
                    <button 
                        className={`filter-tab ${filter === 'current' ? 'active' : ''}`}
                        onClick={() => setFilter('current')}
                    >
                        Current ({bookings.filter(b => b.booking_status === 'Checked-In').length})
                    </button>
                    <button 
                        className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setFilter('upcoming')}
                    >
                        Upcoming ({bookings.filter(b => b.booking_status === 'Booked').length})
                    </button>
                    <button 
                        className={`filter-tab ${filter === 'past' ? 'active' : ''}`}
                        onClick={() => setFilter('past')}
                    >
                        Past ({bookings.filter(b => ['Checked-Out', 'Cancelled'].includes(b.booking_status)).length})
                    </button>
                </div>

                {/* Bookings Grid */}
                <div className="bookings-grid">
                    {filteredBookings.length === 0 ? (
                        <div className="empty-state">
                            <p>No bookings found</p>
                        </div>
                    ) : (
                        filteredBookings.map((booking) => (
                            <Card key={booking.booking_id} className="booking-card" onClick={() => navigate(`/guest/bookings/${booking.booking_id}`)}>
                                <div className="booking-card-header">
                                    <div>
                                        <h3>{booking.branch_name}</h3>
                                        <p className="location">{booking.location}</p>
                                    </div>
                                    <span className={`status-badge ${getStatusBadgeClass(booking.booking_status)}`}>
                                        {booking.booking_status}
                                    </span>
                                </div>

                                <div className="booking-card-body">
                                    <div className="booking-info-row">
                                        <div className="info-item">
                                            <span className="label">Room</span>
                                            <span className="value">{booking.room_number} - {booking.room_type_name}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="label">Booking ID</span>
                                            <span className="value">#{booking.booking_id}</span>
                                        </div>
                                    </div>

                                    <div className="booking-info-row">
                                        <div className="info-item">
                                            <span className="label">Check-in</span>
                                            <span className="value">{formatDate(booking.check_in_date)}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="label">Check-out</span>
                                            <span className="value">{formatDate(booking.check_out_date)}</span>
                                        </div>
                                    </div>

                                    <div className="booking-info-row">
                                        <div className="info-item">
                                            <span className="label">Total Amount</span>
                                            <span className="value amount">{formatCurrency(booking.total_amount)}</span>
                                        </div>
                                        {booking.outstanding_amount > 0 && (
                                            <div className="info-item">
                                                <span className="label">Outstanding</span>
                                                <span className="value outstanding">{formatCurrency(booking.outstanding_amount)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="booking-card-footer">
                                    <button 
                                        className="btn btn-sm btn-primary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewBooking(booking);
                                        }}
                                    >
                                        View Details
                                    </button>
                                    {booking.booking_status === 'Checked-In' && (
                                        <button 
                                            className="btn btn-sm btn-secondary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/guest/request-service?booking=${booking.booking_id}`);
                                            }}
                                        >
                                            Request Service
                                        </button>
                                    )}
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {/* Booking Details Modal */}
                {showModal && selectedBooking && (
                    <Modal isOpen={showModal} onClose={closeModal} title={`Booking #${selectedBooking.booking_id}`}>
                        {modalLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <LoadingSpinner message="Loading details..." />
                            </div>
                        ) : (
                            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                {/* Booking Info */}
                                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                                    <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Booking Information</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <div>
                                            <strong>Branch:</strong> {selectedBooking.branch_name}
                                        </div>
                                        <div>
                                            <strong>Room:</strong> {selectedBooking.room_number} ({selectedBooking.room_type_name})
                                        </div>
                                        <div>
                                            <strong>Check-in:</strong> {formatDate(selectedBooking.check_in_date)}
                                        </div>
                                        <div>
                                            <strong>Check-out:</strong> {formatDate(selectedBooking.check_out_date)}
                                        </div>
                                        <div>
                                            <strong>Status:</strong> <span className={`status-badge ${getStatusBadgeClass(selectedBooking.booking_status)}`}>{selectedBooking.booking_status}</span>
                                        </div>
                                        <div>
                                            <strong>Guests:</strong> {selectedBooking.number_of_guests}
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Summary */}
                                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #86efac' }}>
                                    <h3 style={{ margin: '0 0 1rem 0', color: '#166534' }}>Financial Summary</h3>
                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Total Amount:</span>
                                            <strong>{formatCurrency(selectedBooking.total_amount)}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                                            <span>Paid Amount:</span>
                                            <strong>{formatCurrency(selectedBooking.paid_amount)}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: selectedBooking.outstanding_amount > 0 ? '#dc2626' : '#059669', paddingTop: '0.5rem', borderTop: '1px solid #86efac' }}>
                                            <span><strong>Outstanding:</strong></span>
                                            <strong>{formatCurrency(selectedBooking.outstanding_amount)}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Services Used */}
                                {bookingDetails && bookingDetails.services.length > 0 && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Services Used</h3>
                                        <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead style={{ background: '#f9fafb' }}>
                                                    <tr>
                                                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Service</th>
                                                        <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Qty</th>
                                                        <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {bookingDetails.services.map((service, index) => (
                                                        <tr key={index}>
                                                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{service.service_name}</td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>{service.quantity}</td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>{formatCurrency(service.total_price)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Payment History */}
                                {bookingDetails && bookingDetails.payments.length > 0 && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Payment History</h3>
                                        <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead style={{ background: '#f9fafb' }}>
                                                    <tr>
                                                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                                                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Method</th>
                                                        <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {bookingDetails.payments.map((payment, index) => (
                                                        <tr key={index}>
                                                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{formatDateTime(payment.payment_date)}</td>
                                                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{payment.payment_method}</td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb', color: '#059669', fontWeight: 600 }}>{formatCurrency(payment.amount)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => {
                                            closeModal();
                                            navigate(`/guest/bookings/${selectedBooking.booking_id}`);
                                        }}
                                        style={{ flex: 1 }}
                                    >
                                        Full Details
                                    </button>
                                    {selectedBooking.booking_status === 'Checked-In' && (
                                        <button 
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                closeModal();
                                                navigate(`/guest/request-service?booking=${selectedBooking.booking_id}`);
                                            }}
                                            style={{ flex: 1 }}
                                        >
                                            Request Service
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </Modal>
                )}
            </div>
        </GuestLayout>
    );
};

export default MyBookings;
