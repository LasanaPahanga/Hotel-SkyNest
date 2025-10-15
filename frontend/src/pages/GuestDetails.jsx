import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { guestAPI } from '../utils/api';
import { formatDate, formatCurrency, getStatusClass } from '../utils/helpers';

const GuestDetails = () => {
    const { id } = useParams();
    const [guest, setGuest] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGuest();
    }, [id]);

    const fetchGuest = async () => {
        try {
            const response = await guestAPI.getById(id);
            setGuest(response.data.data);
        } catch (error) {
            console.error('Error fetching guest:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <LoadingSpinner message="Loading guest details..." />
            </Layout>
        );
    }

    if (!guest) {
        return (
            <Layout>
                <div className="error-message">Guest not found</div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="guest-details-page">
                <div className="page-header">
                    <h1>{guest.first_name} {guest.last_name}</h1>
                </div>

                <div className="details-grid">
                    <Card title="Guest Information">
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Email:</label>
                                <span>{guest.email}</span>
                            </div>
                            <div className="info-item">
                                <label>Phone:</label>
                                <span>{guest.phone}</span>
                            </div>
                            <div className="info-item">
                                <label>ID Type:</label>
                                <span>{guest.id_type}</span>
                            </div>
                            <div className="info-item">
                                <label>ID Number:</label>
                                <span>{guest.id_number}</span>
                            </div>
                            <div className="info-item">
                                <label>Country:</label>
                                <span>{guest.country}</span>
                            </div>
                            {guest.date_of_birth && (
                                <div className="info-item">
                                    <label>Date of Birth:</label>
                                    <span>{formatDate(guest.date_of_birth)}</span>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card title="Booking History">
                        {guest.bookings && guest.bookings.length > 0 ? (
                            <div className="bookings-list">
                                {guest.bookings.map((booking) => (
                                    <div key={booking.booking_id} className="booking-item">
                                        <div>
                                            <strong>{booking.branch_name}</strong>
                                            <p>Room {booking.room_number} - {booking.room_type}</p>
                                            <p>{formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}</p>
                                        </div>
                                        <div>
                                            <p className="booking-amount">{formatCurrency(booking.total_amount)}</p>
                                            <span className={`status-badge ${getStatusClass(booking.booking_status)}`}>
                                                {booking.booking_status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="empty-message">No booking history</p>
                        )}
                    </Card>
                </div>
            </div>
        </Layout>
    );
};

export default GuestDetails;
