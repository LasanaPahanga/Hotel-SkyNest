import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { serviceRequestAPI } from '../utils/api';
import { formatDateTime, formatCurrency } from '../utils/helpers';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaTimesCircle, FaClock, FaEye, FaFilter, FaTimes } from 'react-icons/fa';

const ServiceRequests = () => {
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        search: ''
    });

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, requests]);

    const fetchRequests = async () => {
        try {
            const res = await serviceRequestAPI.getAll();
            setRequests(res.data.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('Failed to load service requests');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...requests];

        if (filters.status) {
            filtered = filtered.filter(r => r.request_status === filters.status);
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(r =>
                r.guest_name?.toLowerCase().includes(searchLower) ||
                r.service_name?.toLowerCase().includes(searchLower) ||
                r.request_id?.toString().includes(searchLower) ||
                r.booking_id?.toString().includes(searchLower)
            );
        }

        setFilteredRequests(filtered);
    };

    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setShowDetailsModal(true);
        setReviewNotes('');
    };

    const handleReview = async (status) => {
        if (!reviewNotes.trim() && status === 'Rejected') {
            toast.error('Please provide a reason for rejection');
            return;
        }

        const confirmMsg = status === 'Approved' 
            ? 'Approve this service request? It will be added to the guest\'s booking.'
            : 'Reject this service request?';
        
        if (!window.confirm(confirmMsg)) {
            return;
        }

        setSubmitting(true);
        try {
            await serviceRequestAPI.review(selectedRequest.request_id, {
                status,
                review_notes: reviewNotes
            });
            
            toast.success(`Service request ${status.toLowerCase()} successfully!`);
            setShowDetailsModal(false);
            setSelectedRequest(null);
            setReviewNotes('');
            fetchRequests(); // Refresh list
        } catch (error) {
            console.error('Error reviewing request:', error);
            toast.error(error.response?.data?.message || 'Failed to review request');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            'Pending': { bg: '#fef3c7', color: '#92400e', icon: <FaClock /> },
            'Approved': { bg: '#d1fae5', color: '#065f46', icon: <FaCheckCircle /> },
            'Rejected': { bg: '#fee2e2', color: '#991b1b', icon: <FaTimesCircle /> },
            'Completed': { bg: '#dbeafe', color: '#1e40af', icon: <FaCheckCircle /> }
        };
        const style = styles[status] || styles['Pending'];
        
        return (
            <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: style.bg,
                color: style.color,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
            }}>
                {style.icon} {status}
            </span>
        );
    };

    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.request_status === 'Pending').length,
        approved: requests.filter(r => r.request_status === 'Approved' || r.request_status === 'Completed').length,
        rejected: requests.filter(r => r.request_status === 'Rejected').length
    };

    if (loading) {
        return (
            <Layout>
                <LoadingSpinner message="Loading service requests..." />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="service-requests-page">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1>Service Requests</h1>
                        <p>Manage guest service requests and approvals</p>
                    </div>
                    <button 
                        className="btn btn-secondary"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FaFilter /> {showFilters ? 'Hide' : 'Show'} Filters
                    </button>
                </div>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <Card style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontSize: '2rem' }}>📋</div>
                            <div>
                                <h3 style={{ fontSize: '2rem', margin: 0 }}>{stats.total}</h3>
                                <p style={{ margin: 0, opacity: 0.9 }}>Total Requests</p>
                            </div>
                        </div>
                    </Card>
                    <Card style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <FaClock style={{ fontSize: '2rem' }} />
                            <div>
                                <h3 style={{ fontSize: '2rem', margin: 0 }}>{stats.pending}</h3>
                                <p style={{ margin: 0, opacity: 0.9 }}>Pending</p>
                            </div>
                        </div>
                    </Card>
                    <Card style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <FaCheckCircle style={{ fontSize: '2rem' }} />
                            <div>
                                <h3 style={{ fontSize: '2rem', margin: 0 }}>{stats.approved}</h3>
                                <p style={{ margin: 0, opacity: 0.9 }}>Approved</p>
                            </div>
                        </div>
                    </Card>
                    <Card style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <FaTimesCircle style={{ fontSize: '2rem' }} />
                            <div>
                                <h3 style={{ fontSize: '2rem', margin: 0 }}>{stats.rejected}</h3>
                                <p style={{ margin: 0, opacity: 0.9 }}>Rejected</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                {showFilters && (
                    <Card style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Search</label>
                                <input
                                    type="text"
                                    placeholder="Guest, Service, Request ID..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                >
                                    <option value="">All Status</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                        </div>
                        <button 
                            className="btn btn-secondary"
                            onClick={() => setFilters({ status: '', search: '' })}
                            style={{ marginTop: '1rem' }}
                        >
                            <FaTimes /> Clear Filters
                        </button>
                    </Card>
                )}

                {/* Requests Table */}
                <Card title={`Service Requests (${filteredRequests.length})`}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Request ID</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Guest</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Branch</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Service</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Requested</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                            No service requests found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRequests.map((request) => (
                                        <tr key={request.request_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                            <td style={{ padding: '0.75rem' }}>
                                                <strong>#{request.request_id}</strong>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>{request.guest_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                        Booking #{request.booking_id}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{ 
                                                    padding: '0.25rem 0.5rem', 
                                                    backgroundColor: '#dbeafe', 
                                                    color: '#1e40af',
                                                    borderRadius: '0.25rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500
                                                }}>
                                                    {request.branch_name}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>{request.service_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                        Qty: {request.quantity}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                                                {formatCurrency(request.total_amount)}
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                {getStatusBadge(request.request_status)}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                {formatDateTime(request.requested_at)}
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => handleViewDetails(request)}
                                                >
                                                    <FaEye /> View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Details Modal */}
                {showDetailsModal && selectedRequest && (
                    <Modal
                        isOpen={showDetailsModal}
                        onClose={() => {
                            setShowDetailsModal(false);
                            setSelectedRequest(null);
                            setReviewNotes('');
                        }}
                        title={`Service Request #${selectedRequest.request_id}`}
                    >
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            {/* Request Info */}
                            <div style={{ display: 'grid', gap: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.5rem 0' }}>{selectedRequest.service_name}</h3>
                                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                                            {selectedRequest.service_category}
                                        </p>
                                    </div>
                                    {getStatusBadge(selectedRequest.request_status)}
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                                    <div>
                                        <strong>Guest:</strong>
                                        <p style={{ margin: '0.25rem 0 0 0' }}>{selectedRequest.guest_name}</p>
                                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.75rem' }}>{selectedRequest.guest_email}</p>
                                    </div>
                                    <div>
                                        <strong>Branch:</strong>
                                        <p style={{ margin: '0.25rem 0 0 0' }}>{selectedRequest.branch_name}</p>
                                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.75rem' }}>Room: {selectedRequest.room_number}</p>
                                    </div>
                                    <div>
                                        <strong>Booking ID:</strong>
                                        <p style={{ margin: '0.25rem 0 0 0' }}>#{selectedRequest.booking_id}</p>
                                    </div>
                                    <div>
                                        <strong>Requested:</strong>
                                        <p style={{ margin: '0.25rem 0 0 0' }}>{formatDateTime(selectedRequest.requested_at)}</p>
                                    </div>
                                </div>

                                <div style={{ paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span>Unit Price:</span>
                                        <strong>{formatCurrency(selectedRequest.service_price)}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span>Quantity:</span>
                                        <strong>{selectedRequest.quantity}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #e5e7eb' }}>
                                        <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>Total Amount:</span>
                                        <strong style={{ fontSize: '1.25rem', color: '#059669' }}>
                                            {formatCurrency(selectedRequest.total_amount)}
                                        </strong>
                                    </div>
                                </div>

                                {selectedRequest.request_notes && (
                                    <div>
                                        <strong>Guest Notes:</strong>
                                        <p style={{ margin: '0.5rem 0 0 0', padding: '0.75rem', backgroundColor: 'white', borderRadius: '0.25rem', fontStyle: 'italic' }}>
                                            {selectedRequest.request_notes}
                                        </p>
                                    </div>
                                )}

                                {selectedRequest.review_notes && (
                                    <div>
                                        <strong>Review Notes:</strong>
                                        <p style={{ margin: '0.5rem 0 0 0', padding: '0.75rem', backgroundColor: 'white', borderRadius: '0.25rem' }}>
                                            {selectedRequest.review_notes}
                                        </p>
                                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                                            Reviewed by {selectedRequest.reviewed_by_name} on {formatDateTime(selectedRequest.reviewed_at)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Review Actions */}
                            {selectedRequest.request_status === 'Pending' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                        Review Notes (Optional for approval, Required for rejection)
                                    </label>
                                    <textarea
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        rows="3"
                                        placeholder="Add notes about this decision..."
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.5rem', 
                                            borderRadius: '0.375rem', 
                                            border: '1px solid #d1d5db',
                                            fontSize: '0.875rem'
                                        }}
                                    />
                                    
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => handleReview('Rejected')}
                                            disabled={submitting}
                                        >
                                            <FaTimesCircle /> {submitting ? 'Processing...' : 'Reject'}
                                        </button>
                                        <button
                                            className="btn btn-success"
                                            onClick={() => handleReview('Approved')}
                                            disabled={submitting}
                                        >
                                            <FaCheckCircle /> {submitting ? 'Processing...' : 'Approve & Add to Booking'}
                                        </button>
                                    </div>

                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
                                        * Approving will automatically add this service to the guest's booking and update the bill
                                    </p>
                                </div>
                            )}

                            {selectedRequest.request_status !== 'Pending' && (
                                <div style={{ padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem', textAlign: 'center' }}>
                                    <p style={{ margin: 0, color: '#6b7280' }}>
                                        This request has been {selectedRequest.request_status.toLowerCase()}.
                                    </p>
                                </div>
                            )}
                        </div>
                    </Modal>
                )}
            </div>
        </Layout>
    );
};

export default ServiceRequests;
