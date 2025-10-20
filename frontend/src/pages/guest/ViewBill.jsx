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
import '../../styles/ViewBill.css';

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
                <div className="no-booking-state">
                    <FaFileInvoice />
                    <h2>No Active Booking</h2>
                    <p>You must have an active booking to view your bill.</p>
                    <button 
                        className="btn btn-primary"
                        onClick={() => navigate('/guest/bookings')}
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
            <div className="view-bill-page">
                {/* Page Header */}
                <div className="bill-header">
                    <div>
                        <h1>Invoice</h1>
                        <p>
                            Booking ID: #{currentBooking.booking_id}
                        </p>
                    </div>
                    <div className="bill-actions">
                        <button
                            onClick={handlePrint}
                            className="bill-action-btn"
                        >
                            <FaPrint /> Print
                        </button>
                        <button
                            onClick={handleDownload}
                            className="bill-action-btn"
                        >
                            <FaDownload /> Download
                        </button>
                    </div>
                </div>

                {/* Bill Details */}
                <div className="bill-card">
                    {/* Hotel & Guest Info */}
                    <div className="bill-info-grid">
                        <div className="bill-info-section">
                            <h3>Hotel Details</h3>
                            <p><strong>SkyNest Hotels</strong></p>
                            <p>{currentBooking.branch_name}</p>
                            <p>Colombo, Sri Lanka</p>
                        </div>
                        <div className="bill-info-section">
                            <h3>Guest Details</h3>
                            <p><strong>{currentBooking.guest_name}</strong></p>
                            <p>Room: {currentBooking.room_number}</p>
                            <p>Type: {currentBooking.room_type}</p>
                        </div>
                    </div>

                    {/* Stay Details */}
                    <div className="stay-details">
                        <h3>Stay Details</h3>
                        <div className="stay-details-grid">
                            <p>
                                <strong>Check-in:</strong> {formatDate(currentBooking.check_in_date)}
                            </p>
                            <p>
                                <strong>Check-out:</strong> {formatDate(currentBooking.check_out_date)}
                            </p>
                            <p>
                                <strong>Number of Nights:</strong> {nights}
                            </p>
                            <p>
                                <strong>Status:</strong> {currentBooking.booking_status}
                            </p>
                        </div>
                    </div>

                    {/* Charges Breakdown */}
                    <div className="bill-section">
                        <h3>Charges</h3>
                        <table className="bill-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th className="align-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        Room Charges ({nights} nights)
                                    </td>
                                    <td className="align-right">
                                        {formatCurrency(roomCharges)}
                                    </td>
                                </tr>
                                {services.length > 0 && services.map((service, index) => (
                                    <tr key={index}>
                                        <td>
                                            {service.service_name} (x{service.quantity})
                                        </td>
                                        <td className="align-right">
                                            {formatCurrency(service.total_price)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="total-row">
                                    <td>TOTAL</td>
                                    <td className="align-right">
                                        {formatCurrency(totalAmount)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Payment History */}
                    {payments.length > 0 && (
                        <div className="bill-section">
                            <h3>Payment History</h3>
                            <table className="bill-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Method</th>
                                        <th className="align-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((payment, index) => (
                                        <tr key={index}>
                                            <td>
                                                {formatDateTime(payment.payment_date)}
                                            </td>
                                            <td>
                                                {payment.payment_method}
                                            </td>
                                            <td className="align-right">
                                                {formatCurrency(payment.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="total-row">
                                        <td colSpan="2">TOTAL PAID</td>
                                        <td className="align-right">
                                            {formatCurrency(totalPaid)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Outstanding Amount */}
                    <div className={`outstanding-box ${outstandingAmount > 0 ? 'has-balance' : 'fully-paid'}`}>
                        <span className="label">
                            {outstandingAmount > 0 ? 'Outstanding Amount' : 'Fully Paid'}
                        </span>
                        <span className="amount">
                            {formatCurrency(Math.abs(outstandingAmount))}
                        </span>
                    </div>

                    {/* Footer Note */}
                    <div className="bill-footer">
                        <p>Thank you for choosing SkyNest Hotels</p>
                        <p>
                            For any queries, please contact our reception or support team
                        </p>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
};

export default ViewBill;
