import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GuestLayout from '../../components/GuestLayout';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import { bookingAPI, paymentAPI, serviceAPI } from '../../utils/api';
import { formatDate, formatCurrency, formatDateTime } from '../../utils/helpers';
import { FaFileInvoice, FaPrint, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../../styles/GuestDashboard.css';
import '../../styles/GuestTheme.css';

const ViewBill = () => {
    const navigate = useNavigate();
    const [currentBooking, setCurrentBooking] = useState(null);
    const [services, setServices] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBillData();
    }, []);

    const fetchBillData = async () => {
        try {
            setLoading(true);
            
            // Fetch all bookings for the guest
            const bookingsResponse = await bookingAPI.getAll();
            const allBookings = bookingsResponse.data.data || [];
            
            console.log('All bookings:', allBookings);
            
            // Find current checked-in booking
            const checkedInBookings = allBookings.filter(
                b => b.booking_status === 'Checked-In'
            );
            
            console.log('Checked-in bookings:', checkedInBookings);
            
            if (checkedInBookings.length === 0) {
                setLoading(false);
                return;
            }

            const booking = checkedInBookings[0];
            setCurrentBooking(booking);
            
            console.log('Current booking:', booking);

            // Fetch service usage and payments for this booking
            try {
                const [servicesRes, paymentsRes] = await Promise.all([
                    serviceAPI.getUsage(booking.booking_id).catch(() => ({ data: { data: [] } })),
                    paymentAPI.getByBooking(booking.booking_id).catch(() => ({ data: { data: [] } }))
                ]);
                
                setServices(servicesRes.data.data || servicesRes.data || []);
                setPayments(paymentsRes.data.data || paymentsRes.data || []);
                
                console.log('Services:', servicesRes.data);
                console.log('Payments:', paymentsRes.data);
            } catch (err) {
                console.error('Error fetching services/payments:', err);
                setServices([]);
                setPayments([]);
            }

        } catch (error) {
            console.error('Error fetching bill data:', error);
            toast.error('Failed to load bill details');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        toast.info('Download feature coming soon!');
    };

    if (loading) {
        return (
            <GuestLayout>
                <LoadingSpinner message="Loading bill details..." />
            </GuestLayout>
        );
    }

    if (!currentBooking) {
        return (
            <GuestLayout>
                <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <FaFileInvoice style={{ fontSize: '4rem', color: '#d1d5db', marginBottom: '1rem' }} />
                    <h2>No Active Booking</h2>
                    <p>You must have an active booking to view your bill.</p>
                    <button 
                        className="btn btn-primary"
                        onClick={() => navigate('/guest/bookings')}
                        style={{ marginTop: '1rem' }}
                    >
                        View My Bookings
                    </button>
                </div>
            </GuestLayout>
        );
    }

    const nights = Math.ceil(
        (new Date(currentBooking.check_out_date) - new Date(currentBooking.check_in_date)) / 
        (1000 * 60 * 60 * 24)
    ) || 1;

    const totalAmount = parseFloat(currentBooking.total_amount || 0);
    const serviceCharges = services.reduce((sum, s) => sum + parseFloat(s.total_price || 0), 0);
    const roomCharges = totalAmount - serviceCharges;
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const outstandingAmount = totalAmount - totalPaid;

    return (
        <GuestLayout>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
                {/* Page Header */}
                <div style={{ 
                    background: '#000000', 
                    color: '#ffffff', 
                    padding: '2rem', 
                    marginBottom: '2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2rem', textTransform: 'uppercase' }}>Invoice</h1>
                        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                            Booking ID: #{currentBooking.booking_id}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={handlePrint}
                            style={{
                                background: '#ffffff',
                                color: '#000000',
                                border: '2px solid #ffffff',
                                padding: '0.75rem 1.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: '600',
                                textTransform: 'uppercase'
                            }}
                        >
                            <FaPrint /> Print
                        </button>
                        <button
                            onClick={handleDownload}
                            style={{
                                background: '#ffffff',
                                color: '#000000',
                                border: '2px solid #ffffff',
                                padding: '0.75rem 1.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: '600',
                                textTransform: 'uppercase'
                            }}
                        >
                            <FaDownload /> Download
                        </button>
                    </div>
                </div>

                {/* Bill Details */}
                <Card>
                    {/* Hotel & Guest Info */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '2rem',
                        marginBottom: '2rem',
                        paddingBottom: '2rem',
                        borderBottom: '2px solid #e5e7eb'
                    }}>
                        <div>
                            <h3 style={{ margin: '0 0 1rem 0', textTransform: 'uppercase' }}>Hotel Details</h3>
                            <p style={{ margin: '0.5rem 0' }}><strong>SkyNest Hotels</strong></p>
                            <p style={{ margin: '0.5rem 0' }}>{currentBooking.branch_name}</p>
                            <p style={{ margin: '0.5rem 0' }}>Colombo, Sri Lanka</p>
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 1rem 0', textTransform: 'uppercase' }}>Guest Details</h3>
                            <p style={{ margin: '0.5rem 0' }}><strong>{currentBooking.guest_name}</strong></p>
                            <p style={{ margin: '0.5rem 0' }}>Room: {currentBooking.room_number}</p>
                            <p style={{ margin: '0.5rem 0' }}>Type: {currentBooking.room_type}</p>
                        </div>
                    </div>

                    {/* Stay Details */}
                    <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '2px solid #e5e7eb' }}>
                        <h3 style={{ margin: '0 0 1rem 0', textTransform: 'uppercase' }}>Stay Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <p style={{ margin: '0.5rem 0' }}>
                                <strong>Check-in:</strong> {formatDate(currentBooking.check_in_date)}
                            </p>
                            <p style={{ margin: '0.5rem 0' }}>
                                <strong>Check-out:</strong> {formatDate(currentBooking.check_out_date)}
                            </p>
                            <p style={{ margin: '0.5rem 0' }}>
                                <strong>Number of Nights:</strong> {nights}
                            </p>
                            <p style={{ margin: '0.5rem 0' }}>
                                <strong>Status:</strong> {currentBooking.booking_status}
                            </p>
                        </div>
                    </div>

                    {/* Charges Breakdown */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', textTransform: 'uppercase' }}>Charges</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#000000', color: '#ffffff' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', textTransform: 'uppercase' }}>Description</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', textTransform: 'uppercase' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '1rem' }}>
                                        Room Charges ({nights} nights)
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>
                                        {formatCurrency(roomCharges)}
                                    </td>
                                </tr>
                                {services.length > 0 && services.map((service, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '1rem' }}>
                                            {service.service_name} (x{service.quantity})
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>
                                            {formatCurrency(service.total_price)}
                                        </td>
                                    </tr>
                                ))}
                                <tr style={{ background: '#f9fafb', fontWeight: '700', fontSize: '1.1rem' }}>
                                    <td style={{ padding: '1rem' }}>TOTAL</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        {formatCurrency(totalAmount)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Payment History */}
                    {payments.length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ margin: '0 0 1rem 0', textTransform: 'uppercase' }}>Payment History</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#000000', color: '#ffffff' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', textTransform: 'uppercase' }}>Date</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', textTransform: 'uppercase' }}>Method</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', textTransform: 'uppercase' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((payment, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                            <td style={{ padding: '1rem' }}>
                                                {formatDateTime(payment.payment_date)}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                {payment.payment_method}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>
                                                {formatCurrency(payment.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr style={{ background: '#f9fafb', fontWeight: '700' }}>
                                        <td colSpan="2" style={{ padding: '1rem' }}>TOTAL PAID</td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            {formatCurrency(totalPaid)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Outstanding Amount */}
                    <div style={{ 
                        background: outstandingAmount > 0 ? '#fef2f2' : '#f0fdf4',
                        border: `2px solid ${outstandingAmount > 0 ? '#ef4444' : '#10b981'}`,
                        padding: '1.5rem',
                        marginTop: '2rem'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            fontSize: '1.5rem',
                            fontWeight: '700'
                        }}>
                            <span style={{ textTransform: 'uppercase' }}>
                                {outstandingAmount > 0 ? 'Outstanding Amount' : 'Fully Paid'}
                            </span>
                            <span style={{ color: outstandingAmount > 0 ? '#ef4444' : '#10b981' }}>
                                {formatCurrency(Math.abs(outstandingAmount))}
                            </span>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div style={{ 
                        marginTop: '2rem', 
                        paddingTop: '2rem', 
                        borderTop: '2px solid #e5e7eb',
                        textAlign: 'center',
                        color: '#6b7280'
                    }}>
                        <p style={{ margin: '0.5rem 0' }}>Thank you for choosing SkyNest Hotels</p>
                        <p style={{ margin: '0.5rem 0', fontSize: '0.875rem' }}>
                            For any queries, please contact our reception or support team
                        </p>
                    </div>
                </Card>
            </div>
        </GuestLayout>
    );
};

export default ViewBill;
