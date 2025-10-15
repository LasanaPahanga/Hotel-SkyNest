import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { supportAPI } from '../utils/api';
import { formatDateTime } from '../utils/helpers';
import { toast } from 'react-toastify';
import { FaEye, FaFilter, FaTimes, FaClock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const SupportTickets = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [response, setResponse] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        search: ''
    });

    useEffect(() => {
        fetchTickets();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, tickets]);

    const fetchTickets = async () => {
        try {
            const res = await supportAPI.getAllTickets();
            setTickets(res.data.data);
        } catch (error) {
            console.error('Error fetching tickets:', error);
            toast.error('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...tickets];

        if (filters.status) {
            filtered = filtered.filter(t => t.status === filters.status);
        }

        if (filters.priority) {
            filtered = filtered.filter(t => t.priority === filters.priority);
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(t =>
                t.subject?.toLowerCase().includes(searchLower) ||
                t.guest_name?.toLowerCase().includes(searchLower) ||
                t.ticket_id?.toString().includes(searchLower)
            );
        }

        setFilteredTickets(filtered);
    };

    const handleViewDetails = async (ticket) => {
        try {
            const res = await supportAPI.getTicketById(ticket.ticket_id);
            setSelectedTicket(res.data.data);
            setShowDetailsModal(true);
        } catch (error) {
            toast.error('Failed to load ticket details');
        }
    };

    const handleAddResponse = async () => {
        if (!response.trim()) {
            toast.error('Please enter a response');
            return;
        }

        setSubmitting(true);
        try {
            await supportAPI.addResponse(selectedTicket.ticket.ticket_id, { message: response });
            toast.success('Response added successfully');
            setResponse('');
            // Refresh ticket details
            const res = await supportAPI.getTicketById(selectedTicket.ticket.ticket_id);
            setSelectedTicket(res.data.data);
            fetchTickets(); // Refresh list
        } catch (error) {
            toast.error('Failed to add response');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (status) => {
        try {
            await supportAPI.updateTicket(selectedTicket.ticket.ticket_id, { status });
            toast.success(`Ticket ${status.toLowerCase()} successfully`);
            
            // Refresh ticket details in modal
            const res = await supportAPI.getTicketById(selectedTicket.ticket.ticket_id);
            setSelectedTicket(res.data.data);
            
            // Refresh ticket list and stats
            fetchTickets();
        } catch (error) {
            toast.error('Failed to update ticket');
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            'Open': 'bg-blue-500',
            'In Progress': 'bg-yellow-500',
            'Resolved': 'bg-green-500',
            'Closed': 'bg-gray-500'
        };
        return (
            <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: colors[status] || '#6b7280',
                color: 'white'
            }}>
                {status}
            </span>
        );
    };

    const getPriorityBadge = (priority) => {
        const colors = {
            'Low': '#10b981',
            'Medium': '#f59e0b',
            'High': '#ef4444',
            'Urgent': '#dc2626'
        };
        return (
            <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: colors[priority] || '#6b7280',
                color: 'white'
            }}>
                {priority}
            </span>
        );
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Open':
                return <FaClock style={{ color: '#3b82f6' }} />;
            case 'In Progress':
                return <FaExclamationTriangle style={{ color: '#f59e0b' }} />;
            case 'Resolved':
            case 'Closed':
                return <FaCheckCircle style={{ color: '#10b981' }} />;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <Layout>
                <LoadingSpinner message="Loading tickets..." />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="support-tickets-page">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1>Support Tickets</h1>
                        <p>Manage customer support requests</p>
                    </div>
                    <button 
                        className="btn btn-secondary"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FaFilter /> {showFilters ? 'Hide' : 'Show'} Filters
                    </button>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <Card style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <FaClock style={{ fontSize: '2rem' }} />
                            <div>
                                <h3 style={{ fontSize: '2rem', margin: 0 }}>
                                    {tickets.filter(t => t.status === 'Open').length}
                                </h3>
                                <p style={{ margin: 0 }}>Open</p>
                            </div>
                        </div>
                    </Card>
                    <Card style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <FaExclamationTriangle style={{ fontSize: '2rem' }} />
                            <div>
                                <h3 style={{ fontSize: '2rem', margin: 0 }}>
                                    {tickets.filter(t => t.status === 'In Progress').length}
                                </h3>
                                <p style={{ margin: 0 }}>In Progress</p>
                            </div>
                        </div>
                    </Card>
                    <Card style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <FaCheckCircle style={{ fontSize: '2rem' }} />
                            <div>
                                <h3 style={{ fontSize: '2rem', margin: 0 }}>
                                    {tickets.filter(t => t.status === 'Resolved').length}
                                </h3>
                                <p style={{ margin: 0 }}>Resolved</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                {showFilters && (
                    <Card style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Search</label>
                                <input
                                    type="text"
                                    placeholder="Ticket ID, Guest name..."
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
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Priority</label>
                                <select
                                    value={filters.priority}
                                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                >
                                    <option value="">All Priorities</option>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                            </div>
                        </div>
                        <button 
                            className="btn btn-secondary"
                            onClick={() => setFilters({ status: '', priority: '', search: '' })}
                            style={{ marginTop: '1rem' }}
                        >
                            <FaTimes /> Clear Filters
                        </button>
                    </Card>
                )}

                {/* Tickets Table */}
                <Card title={`All Tickets (${filteredTickets.length})`}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>ID</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Guest</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Branch</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Subject</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Priority</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Created</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Responses</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTickets.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                            No tickets found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTickets.map((ticket) => (
                                        <tr key={ticket.ticket_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                            <td style={{ padding: '0.75rem' }}>
                                                <strong>#{ticket.ticket_id}</strong>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>{ticket.guest_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{ticket.guest_email}</div>
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
                                                    {ticket.branch_name || 'N/A'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>{ticket.subject}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                {getPriorityBadge(ticket.priority)}
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                {getStatusBadge(ticket.status)}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>{formatDateTime(ticket.created_at)}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                <span style={{ 
                                                    padding: '0.25rem 0.5rem', 
                                                    backgroundColor: '#e5e7eb', 
                                                    borderRadius: '0.25rem',
                                                    fontSize: '0.875rem'
                                                }}>
                                                    {ticket.response_count || 0}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => handleViewDetails(ticket)}
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
                {showDetailsModal && selectedTicket && (
                    <Modal
                        isOpen={showDetailsModal}
                        onClose={() => setShowDetailsModal(false)}
                        title={`Ticket #${selectedTicket.ticket.ticket_id}`}
                    >
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            {/* Ticket Info */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.5rem 0' }}>{selectedTicket.ticket.subject}</h3>
                                        <p style={{ margin: 0, color: '#6b7280' }}>
                                            by {selectedTicket.ticket.guest_name} • {formatDateTime(selectedTicket.ticket.created_at)}
                                        </p>
                                        {selectedTicket.ticket.branch_name && (
                                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                                                <span style={{ 
                                                    padding: '0.25rem 0.5rem', 
                                                    backgroundColor: '#dbeafe', 
                                                    color: '#1e40af',
                                                    borderRadius: '0.25rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500
                                                }}>
                                                    📍 {selectedTicket.ticket.branch_name}
                                                </span>
                                                {selectedTicket.ticket.room_number && (
                                                    <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>
                                                        Room: {selectedTicket.ticket.room_number}
                                                    </span>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'start' }}>
                                        {getPriorityBadge(selectedTicket.ticket.priority)}
                                        {getStatusBadge(selectedTicket.ticket.status)}
                                    </div>
                                </div>
                                <p style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                                    {selectedTicket.ticket.message}
                                </p>
                            </div>

                            {/* Responses */}
                            <div>
                                <h4 style={{ marginBottom: '1rem' }}>Responses ({selectedTicket.responses.length})</h4>
                                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'grid', gap: '0.75rem' }}>
                                    {selectedTicket.responses.length === 0 ? (
                                        <p style={{ textAlign: 'center', color: '#6b7280' }}>No responses yet</p>
                                    ) : (
                                        selectedTicket.responses.map((resp) => (
                                            <div 
                                                key={resp.response_id}
                                                style={{
                                                    padding: '1rem',
                                                    backgroundColor: resp.is_staff_response ? '#eff6ff' : '#f9fafb',
                                                    borderLeft: `4px solid ${resp.is_staff_response ? '#3b82f6' : '#6b7280'}`,
                                                    borderRadius: '0.25rem'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <strong>{resp.user_name || resp.guest_name}</strong>
                                                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                        {formatDateTime(resp.created_at)}
                                                    </span>
                                                </div>
                                                <p style={{ margin: 0 }}>{resp.message}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Add Response */}
                            {selectedTicket.ticket.status !== 'Closed' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                        Add Response
                                    </label>
                                    <textarea
                                        value={response}
                                        onChange={(e) => setResponse(e.target.value)}
                                        rows="3"
                                        placeholder="Type your response..."
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                    />
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleAddResponse}
                                        disabled={submitting}
                                        style={{ marginTop: '0.5rem' }}
                                    >
                                        {submitting ? 'Sending...' : 'Send Response'}
                                    </button>
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                                {selectedTicket.ticket.status === 'Open' && (
                                    <button
                                        className="btn btn-warning"
                                        onClick={() => handleUpdateStatus('In Progress')}
                                    >
                                        Mark In Progress
                                    </button>
                                )}
                                {(selectedTicket.ticket.status === 'Open' || selectedTicket.ticket.status === 'In Progress') && (
                                    <button
                                        className="btn btn-success"
                                        onClick={() => handleUpdateStatus('Resolved')}
                                    >
                                        Mark Resolved
                                    </button>
                                )}
                                {selectedTicket.ticket.status === 'Resolved' && (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => handleUpdateStatus('Closed')}
                                    >
                                        Close Ticket
                                    </button>
                                )}
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        </Layout>
    );
};

export default SupportTickets;
