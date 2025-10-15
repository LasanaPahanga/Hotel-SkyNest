import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import { bookingAPI } from '../../utils/api';
import { formatDate, formatCurrency } from '../../utils/helpers';
import '../../styles/GuestDashboard.css';

const MyBookings = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, current, upcoming, past

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const response = await bookingAPI.getAll();
            setBookings(response.data.data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
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

    const filteredBookings = getBookingsByStatus();

    if (loading) {
        return (
            <Layout>
                <LoadingSpinner message="Loading your bookings..." />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="guest-dashboard">
                <div className="dashboard-header">
                    <h1>My Bookings</h1>
                    <p>View and manage your hotel reservations</p>
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
                        <Card>
                            <div className="empty-state">
                                <p>No bookings found</p>
                            </div>
                        </Card>
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
                                    <button className="btn btn-sm btn-primary">View Details</button>
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
            </div>
        </Layout>
    );
};

export default MyBookings;
