import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import { serviceRequestAPI, bookingAPI, serviceAPI } from '../../utils/api';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { toast } from 'react-toastify';
import dashboardImage from '../../assets/dashboard.jpeg';
import '../../styles/CommonPage.css';
import { FaClock, FaCheckCircle, FaTimesCircle, FaTrash } from 'react-icons/fa';
import '../../styles/GuestDashboard.css';

const RequestService = () => {
    const navigate = useNavigate();
    
    const [activeBooking, setActiveBooking] = useState(null);
    const [services, setServices] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedService, setSelectedService] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const categories = ['all', 'Room Service', 'Spa', 'Laundry', 'Minibar', 'Restaurant', 'Transportation'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Get guest's active booking
            const bookingsRes = await bookingAPI.getAll({ status: 'Checked-In' });
            const activeBookings = bookingsRes.data.data.filter(b => b.booking_status === 'Checked-In');
            
            if (activeBookings.length === 0) {
                toast.error('You must be checked-in to request services');
                navigate('/guest/bookings');
                return;
            }

            setActiveBooking(activeBookings[0]);

            // Get available services for the branch
            const servicesRes = await serviceAPI.getBranchServices(activeBookings[0].branch_id);
            const availableServices = servicesRes.data.data.filter(s => s.is_available !== 0);
            setServices(availableServices);

            // Get my service requests
            const requestsRes = await serviceRequestAPI.getAll();
            setMyRequests(requestsRes.data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    const filteredServices = selectedCategory === 'all' 
        ? services 
        : services.filter(s => s.service_category === selectedCategory);

    const handleSelectService = (service) => {
        setSelectedService(service);
        setQuantity(1);
        setNotes('');
    };

    const handleSubmitRequest = async () => {
        if (!selectedService) {
            toast.error('Please select a service');
            return;
        }

        setSubmitting(true);
        try {
            await serviceRequestAPI.create({
                booking_id: activeBooking.booking_id,
                service_id: selectedService.service_id,
                quantity,
                request_notes: notes
            });
            
            toast.success('Service request submitted! Waiting for receptionist approval.');
            setSelectedService(null);
            setQuantity(1);
            setNotes('');
            fetchData(); // Refresh requests
        } catch (error) {
            console.error('Error requesting service:', error);
            toast.error(error.response?.data?.message || 'Failed to request service');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelRequest = async (requestId) => {
        if (!window.confirm('Are you sure you want to cancel this request?')) {
            return;
        }

        try {
            await serviceRequestAPI.cancel(requestId);
            toast.success('Request cancelled successfully');
            fetchData(); // Refresh requests
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel request');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Pending':
                return <FaClock style={{ color: '#f59e0b' }} />;
            case 'Approved':
            case 'Completed':
                return <FaCheckCircle style={{ color: '#10b981' }} />;
            case 'Rejected':
                return <FaTimesCircle style={{ color: '#ef4444' }} />;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <Layout>
                <LoadingSpinner message="Loading services..." />
            </Layout>
        );
    }

    if (!activeBooking) {
        return (
            <Layout>
                <Card>
                    <p>No active booking found. You must be checked-in to request services.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/guest/bookings')}>
                        View My Bookings
                    </button>
                </Card>
            </Layout>
        );
    }

    return (
        <Layout>
            <div 
                className="request-service-page common-page" 
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
                    <div>
                        <h1>Request Services</h1>
                        <p>Booking #{activeBooking.booking_id} - Room {activeBooking.room_number}</p>
                    </div>
                </div>

                <div className="service-request-layout">
                    {/* Services List */}
                    <div className="services-section">
                        <Card>
                            <div className="category-filters">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                                        onClick={() => setSelectedCategory(cat)}
                                    >
                                        {cat === 'all' ? 'All Services' : cat}
                                    </button>
                                ))}
                            </div>

                            <div className="services-grid">
                                {filteredServices.length === 0 ? (
                                    <p className="no-services">No services available</p>
                                ) : (
                                    filteredServices.map(service => (
                                        <div 
                                            key={service.service_id} 
                                            className={`service-item ${selectedService?.service_id === service.service_id ? 'selected' : ''}`}
                                            onClick={() => handleSelectService(service)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="service-info">
                                                <h4>{service.service_name}</h4>
                                                <p className="service-description">{service.description || 'No description'}</p>
                                                <span className="service-category">{service.service_category}</span>
                                            </div>
                                            <div className="service-action">
                                                <span className="service-price">
                                                    {formatCurrency(service.custom_price || service.unit_price)}
                                                    <small>/{service.unit_type || 'unit'}</small>
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Request Form */}
                    <div className="cart-section">
                        <Card title="Service Request">
                            {!selectedService ? (
                                <div className="empty-cart">
                                    <p>No service selected</p>
                                    <small>Click on a service to request it</small>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <div>
                                        <strong>Selected Service:</strong>
                                        <p>{selectedService.service_name}</p>
                                        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                                            {formatCurrency(selectedService.custom_price || selectedService.unit_price)} per {selectedService.unit_type || 'unit'}
                                        </p>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                            Quantity
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                            Special Instructions (Optional)
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows="3"
                                            placeholder="e.g., Room number, delivery time..."
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                        />
                                    </div>

                                    <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span>Estimated Total:</span>
                                            <strong>{formatCurrency((selectedService.custom_price || selectedService.unit_price) * quantity)}</strong>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                                            * Request will be sent to receptionist for approval
                                        </p>
                                    </div>

                                    <button 
                                        className="btn btn-primary btn-block"
                                        onClick={handleSubmitRequest}
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Request'}
                                    </button>
                                </div>
                            )}
                        </Card>

                        {/* My Requests */}
                        <Card title={`My Requests (${myRequests.length})`} style={{ marginTop: '1rem' }}>
                            {myRequests.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#6b7280' }}>No requests yet</p>
                            ) : (
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {myRequests.map(request => (
                                        <div 
                                            key={request.request_id}
                                            style={{
                                                padding: '1rem',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '0.5rem',
                                                display: 'grid',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                <div>
                                                    <strong>{request.service_name}</strong>
                                                    <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                                                        Qty: {request.quantity} × {formatCurrency(request.service_price)} = {formatCurrency(request.total_amount)}
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {getStatusIcon(request.request_status)}
                                                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                                        {request.request_status}
                                                    </span>
                                                </div>
                                            </div>

                                            {request.request_notes && (
                                                <p style={{ margin: 0, fontSize: '0.875rem', fontStyle: 'italic', color: '#6b7280' }}>
                                                    Note: {request.request_notes}
                                                </p>
                                            )}

                                            {request.review_notes && (
                                                <p style={{ margin: 0, fontSize: '0.875rem', padding: '0.5rem', background: '#f9fafb', borderRadius: '0.25rem' }}>
                                                    <strong>Receptionist:</strong> {request.review_notes}
                                                </p>
                                            )}

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#6b7280' }}>
                                                <span>Requested: {formatDateTime(request.requested_at)}</span>
                                                {request.request_status === 'Pending' && (
                                                    <button
                                                        onClick={() => handleCancelRequest(request.request_id)}
                                                        style={{
                                                            padding: '0.25rem 0.5rem',
                                                            fontSize: '0.75rem',
                                                            backgroundColor: '#ef4444',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '0.25rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <FaTrash /> Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default RequestService;
