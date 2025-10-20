import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GuestLayout from '../../components/GuestLayout';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { supportAPI, bookingAPI } from '../../utils/api';
import { formatDateTime } from '../../utils/helpers';
import { toast } from 'react-toastify';
import dashboardImage from '../../assets/dashboard.jpeg';
import '../../styles/GuestDashboard.css';
import '../../styles/GuestTheme.css';
import '../../styles/ContactSupport.css';

const ContactSupport = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const bookingIdParam = searchParams.get('booking');
    
    const [tickets, setTickets] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [ticketDetails, setTicketDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [response, setResponse] = useState('');
    const [sendingResponse, setSendingResponse] = useState(false);
    
    const [formData, setFormData] = useState({
        booking_id: bookingIdParam || '',
        subject: '',
        message: '',
        priority: 'Medium'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [ticketsRes, bookingsRes] = await Promise.all([
                supportAPI.getMyTickets(),
                bookingAPI.getAll()
            ]);
            
            setTickets(ticketsRes.data.data || []);
            setMyBookings(bookingsRes.data.data.filter(b => 
                ['Booked', 'Checked-In'].includes(b.booking_status)
            ));
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.subject.trim() || !formData.message.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            await supportAPI.createTicket(formData);
            toast.success('Support ticket submitted successfully!');
            setShowForm(false);
            setFormData({
                booking_id: '',
                subject: '',
                message: '',
                priority: 'Medium'
            });
            fetchData();
        } catch (error) {
            console.error('Error submitting ticket:', error);
            toast.error(error.response?.data?.message || 'Failed to submit ticket');
        } finally {
            setSubmitting(false);
        }
    };

    const handleViewTicket = async (ticket) => {
        setSelectedTicket(ticket);
        setShowDetailsModal(true);
        setLoadingDetails(true);
        
        try {
            const res = await supportAPI.getTicketById(ticket.ticket_id);
            setTicketDetails(res.data.data);
        } catch (error) {
            toast.error('Failed to load ticket details');
            setShowDetailsModal(false);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleAddResponse = async () => {
        if (!response.trim()) {
            toast.error('Please enter a response');
            return;
        }

        setSendingResponse(true);
        try {
            await supportAPI.addResponse(selectedTicket.ticket_id, { message: response });
            toast.success('Response added successfully');
            setResponse('');
            // Refresh ticket details
            const res = await supportAPI.getTicketById(selectedTicket.ticket_id);
            setTicketDetails(res.data.data);
            fetchData(); // Refresh list
        } catch (error) {
            toast.error('Failed to add response');
        } finally {
            setSendingResponse(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        const classes = {
            'Open': 'badge-info',
            'In Progress': 'badge-warning',
            'Resolved': 'badge-success',
            'Closed': 'badge-secondary'
        };
        return classes[status] || 'badge-secondary';
    };

    const getPriorityBadgeClass = (priority) => {
        const classes = {
            'Low': 'badge-secondary',
            'Medium': 'badge-info',
            'High': 'badge-warning',
            'Urgent': 'badge-danger'
        };
        return classes[priority] || 'badge-secondary';
    };

    if (loading) {
        return (
            <GuestLayout>
                <LoadingSpinner message="Loading support tickets..." />
            </GuestLayout>
        );
    }

    return (
        <GuestLayout>
            <div 
                className="contact-support-page common-page" 
                style={{ 
                    backgroundImage: `url(${dashboardImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: 'fixed',
                    minHeight: '100vh'
                }}
            >
                <div className="page-header">
                    <h1>Contact Support</h1>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? 'Cancel' : '+ New Ticket'}
                    </button>
                </div>

                {showForm && (
                    <Card title="Submit Support Ticket">
                        <form onSubmit={handleSubmit} className="support-form">
                            <div className="form-group">
                                <label>Related Booking (Optional)</label>
                                <select
                                    value={formData.booking_id}
                                    onChange={(e) => setFormData({ ...formData, booking_id: e.target.value })}
                                >
                                    <option value="">-- Select Booking --</option>
                                    {myBookings.map(booking => (
                                        <option key={booking.booking_id} value={booking.booking_id}>
                                            Booking #{booking.booking_id} - {booking.branch_name} - Room {booking.room_number}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Subject *</label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="Brief description of your issue"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Priority</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Message *</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Describe your issue in detail..."
                                    rows="5"
                                    required
                                />
                            </div>

                            <div className="form-actions">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => setShowForm(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Ticket'}
                                </button>
                            </div>
                        </form>
                    </Card>
                )}

                <Card title={`My Support Tickets (${tickets.length})`}>
                    {tickets.length === 0 ? (
                        <div className="empty-state">
                            <p>No support tickets yet</p>
                            <small>Click "New Ticket" to submit a request</small>
                        </div>
                    ) : (
                        <div className="tickets-list">
                            {tickets.map(ticket => (
                                <div 
                                    key={ticket.ticket_id} 
                                    className="ticket-item"
                                    onClick={() => handleViewTicket(ticket)}
                                >
                                    <div className="ticket-header">
                                        <div>
                                            <h4>#{ticket.ticket_id} - {ticket.subject}</h4>
                                            <p className="ticket-meta">
                                                Created {formatDateTime(ticket.created_at)}
                                                {ticket.booking_id && ` • Booking #${ticket.booking_id}`}
                                            </p>
                                        </div>
                                        <div className="ticket-badges">
                                            <span className={`status-badge ${getStatusBadgeClass(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                            <span className={`status-badge ${getPriorityBadgeClass(ticket.priority)}`}>
                                                {ticket.priority}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="ticket-message">{ticket.message}</p>
                                    {ticket.response_count > 0 && (
                                        <p className="ticket-responses">
                                            {ticket.response_count} response(s)
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Ticket Details Modal */}
                {showDetailsModal && selectedTicket && (
                    <Modal
                        isOpen={showDetailsModal}
                        onClose={() => {
                            setShowDetailsModal(false);
                            setSelectedTicket(null);
                            setTicketDetails(null);
                            setResponse('');
                        }}
                        title={`Ticket #${selectedTicket.ticket_id}`}
                    >
                        {loadingDetails ? (
                            <div className="modal-loading">
                                <p>Loading ticket details...</p>
                            </div>
                        ) : ticketDetails ? (
                            <div className="modal-content">
                                {/* Ticket Info */}
                                <div>
                                    <div className="ticket-details-header">
                                        <div>
                                            <h3>{ticketDetails.ticket.subject}</h3>
                                            <p className="ticket-details-meta">
                                                Created {formatDateTime(ticketDetails.ticket.created_at)}
                                            </p>
                                        </div>
                                        <div className="ticket-badges">
                                            <span className={`status-badge ${getPriorityBadgeClass(ticketDetails.ticket.priority)}`}>
                                                {ticketDetails.ticket.priority}
                                            </span>
                                            <span className={`status-badge ${getStatusBadgeClass(ticketDetails.ticket.status)}`}>
                                                {ticketDetails.ticket.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ticket-description">
                                        <p>{ticketDetails.ticket.description}</p>
                                    </div>
                                </div>

                                {/* Responses */}
                                <div className="responses-section">
                                    <h4>
                                        Responses ({ticketDetails.responses.length})
                                    </h4>
                                    <div className="responses-container">
                                        {ticketDetails.responses.length === 0 ? (
                                            <p className="no-responses">
                                                No responses yet. Staff will respond soon.
                                            </p>
                                        ) : (
                                            ticketDetails.responses.map((resp) => (
                                                <div 
                                                    key={resp.response_id}
                                                    className={`response-item ${resp.is_staff_response ? 'staff-response' : 'guest-response'}`}
                                                >
                                                    <div className="response-header">
                                                        <strong className={resp.is_staff_response ? 'response-author staff' : 'response-author'}>
                                                            {resp.responder_name || 'Guest'}
                                                            {resp.is_staff_response && <span className="staff-badge">(Staff)</span>}
                                                        </strong>
                                                        <span className="response-time">
                                                            {formatDateTime(resp.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="response-text">{resp.response_text}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Add Response */}
                                {ticketDetails.ticket.status !== 'Closed' && (
                                    <div className="add-response-section">
                                        <label>
                                            Add Your Response
                                        </label>
                                        <textarea
                                            value={response}
                                            onChange={(e) => setResponse(e.target.value)}
                                            rows="3"
                                            placeholder="Type your message..."
                                        />
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleAddResponse}
                                            disabled={sendingResponse}
                                            style={{ marginTop: '0.5rem' }}
                                        >
                                            {sendingResponse ? 'Sending...' : 'Send Response'}
                                        </button>
                                    </div>
                                )}

                                {ticketDetails.ticket.status === 'Closed' && (
                                    <div className="closed-notice">
                                        <p>
                                            This ticket has been closed. No further responses can be added.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <p>Failed to load ticket details</p>
                            </div>
                        )}
                    </Modal>
                )}
            </div>
        </GuestLayout>
    );
};

export default ContactSupport;
