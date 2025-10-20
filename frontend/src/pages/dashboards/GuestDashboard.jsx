import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { bookingAPI } from '../../utils/api';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { FaCalendarCheck, FaConciergeBell, FaMoneyBillWave, FaUser, FaHotel, FaClock, FaSignOutAlt, FaHome, FaChevronDown, FaHeadset, FaFileInvoice } from 'react-icons/fa';
import { toast } from 'react-toastify';
import hotelVideo from '../../assets/WhatsApp Video 2025-10-20 at 21.26.12_d1af48f8.mp4';
import '../../styles/ModernGuestDashboard.css';

const GuestDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const contentRef = useRef(null);
    const [activeTab, setActiveTab] = useState('home');
    const [stats, setStats] = useState({
        activeBookings: 0,
        upcomingBookings: 0,
        totalSpent: 0,
        pendingPayments: 0
    });
    const [currentBooking, setCurrentBooking] = useState(null);
    const [upcomingBookings, setUpcomingBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const scrollToContent = () => {
        contentRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        fetchDashboardData();
        
        // Auto-refresh every 30 seconds to update stats
        const interval = setInterval(() => {
            fetchDashboardData();
        }, 30000);
        
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await bookingAPI.getAll();
            const bookings = response.data.data;
            
            // Calculate stats
            const active = bookings.filter(b => b.booking_status === 'Checked-In');
            const upcoming = bookings.filter(b => b.booking_status === 'Booked');
            const totalSpent = bookings.reduce((sum, b) => {
                const paid = parseFloat(b.paid_amount || 0);
                return sum + paid;
            }, 0);
            const pendingPayments = bookings.reduce((sum, b) => {
                const outstanding = parseFloat(b.outstanding_amount || 0);
                return sum + outstanding;
            }, 0);
            
            setStats({
                activeBookings: active.length,
                upcomingBookings: upcoming.length,
                totalSpent,
                pendingPayments
            });
            
            // Set current booking - prefer checked-in, then booked
            const currentActive = active[0] || upcoming[0] || null;
            setCurrentBooking(currentActive);
            setUpcomingBookings(upcoming.slice(0, 3));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewBookings = () => {
        navigate('/guest/bookings');
    };

    const handleRequestService = () => {
        if (currentBooking) {
            if (currentBooking.booking_status === 'Checked-In') {
                navigate('/guest/request-service');
            } else {
                toast.info('You can request services after check-in. Your booking is confirmed.');
            }
        } else {
            toast.error('No active booking. Please make a booking first.');
        }
    };

    const handleViewBill = () => {
        if (currentBooking) {
            navigate(`/guest/bookings/${currentBooking.booking_id}`);
        } else {
            toast.error('No active booking');
        }
    };

    const handleViewProfile = () => {
        navigate('/guest/profile');
    };

    const quickActions = [
        {
            title: 'View All Bookings',
            icon: <FaCalendarCheck />,
            color: '#3b82f6',
            action: handleViewBookings
        },
        {
            title: 'Request Service',
            icon: <FaConciergeBell />,
            color: '#10b981',
            action: handleRequestService,
            disabled: !currentBooking
        },
        {
            title: 'View Bill',
            icon: <FaMoneyBillWave />,
            color: '#f59e0b',
            action: handleViewBill,
            disabled: !currentBooking
        },
        {
            title: 'My Profile',
            icon: <FaUser />,
            color: '#8b5cf6',
            action: handleViewProfile
        }
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#ffffff' }}>
                <LoadingSpinner message="Loading dashboard..." />
            </div>
        );
    }

    return (
        <div className="modern-guest-dashboard">
            {/* Top Header with Logo and Logout */}
            <div style={{ background: '#000000', color: '#ffffff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #ffffff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FaHotel style={{ fontSize: '1.5rem' }} />
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>SkyNest Hotels</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{user?.full_name}</span>
                    <button 
                        onClick={handleLogout}
                        style={{ background: '#ffffff', color: '#000000', border: '2px solid #ffffff', padding: '0.5rem 1.25rem', borderRadius: '4px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#000000'; e.currentTarget.style.color = '#ffffff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#000000'; }}
                    >
                        <FaSignOutAlt /> Logout
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="guest-tab-nav">
                <button 
                    className={`guest-tab ${activeTab === 'home' ? 'active' : ''}`}
                    onClick={() => setActiveTab('home')}
                >
                    <FaHome style={{ marginRight: '0.5rem' }} /> Home
                </button>
                <button 
                    className={`guest-tab ${activeTab === 'bookings' ? 'active' : ''}`}
                    onClick={() => navigate('/guest/bookings')}
                >
                    <FaCalendarCheck style={{ marginRight: '0.5rem' }} /> My Bookings
                </button>
                <button 
                    className={`guest-tab ${activeTab === 'services' ? 'active' : ''}`}
                    onClick={() => navigate('/guest/request-service')}
                    disabled={!currentBooking || currentBooking.booking_status !== 'Checked-In'}
                >
                    <FaConciergeBell style={{ marginRight: '0.5rem' }} /> Request Service
                </button>
                <button 
                    className={`guest-tab ${activeTab === 'support' ? 'active' : ''}`}
                    onClick={() => navigate('/guest/support')}
                >
                    <FaHeadset style={{ marginRight: '0.5rem' }} /> Support
                </button>
                <button 
                    className={`guest-tab ${activeTab === 'bill' ? 'active' : ''}`}
                    onClick={handleViewBill}
                    disabled={!currentBooking}
                >
                    <FaFileInvoice style={{ marginRight: '0.5rem' }} /> View Bill
                </button>
                <button 
                    className={`guest-tab ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => navigate('/guest/profile')}
                >
                    <FaUser style={{ marginRight: '0.5rem' }} /> Profile
                </button>
            </div>

            {/* Full-Screen Video Hero Section */}
            <div className="video-hero-section">
                <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="hero-video"
                >
                    <source src={hotelVideo} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                <div className="video-overlay">
                    <div className="hero-content">
                        <h1 className="hero-title">SkyNest Hotels</h1>
                        <p className="hero-subtitle">Experience Luxury Beyond Expectations</p>
                    </div>
                    <button className="scroll-down-btn" onClick={scrollToContent}>
                        <FaChevronDown className="scroll-icon" />
                    </button>
                </div>
            </div>

            {/* Main Content Section */}
            <div ref={contentRef}>
                <div className="dashboard-header-white">
                    <h1>Welcome, {user?.full_name}</h1>
                    <p>Discover a world where sophistication meets comfort</p>
                </div>

                {/* Stats Cards */}
                <div className="modern-stats-grid">
                    <div className="modern-stat-card">
                        <div className="stat-content">
                            <h3>{stats.activeBookings}</h3>
                            <p>Active Bookings</p>
                        </div>
                        <FaHotel className="stat-icon" />
                    </div>
                    <div className="modern-stat-card">
                        <div className="stat-content">
                            <h3>{stats.upcomingBookings}</h3>
                            <p>Upcoming Bookings</p>
                        </div>
                        <FaClock className="stat-icon" />
                    </div>
                    <div className="modern-stat-card">
                        <div className="stat-content">
                            <h3>{formatCurrency(stats.totalSpent)}</h3>
                            <p>Total Spent</p>
                        </div>
                        <FaMoneyBillWave className="stat-icon" />
                    </div>
                    <div className="modern-stat-card">
                        <div className="stat-content">
                            <h3>{formatCurrency(stats.pendingPayments)}</h3>
                            <p>Pending Payments</p>
                        </div>
                        <FaConciergeBell className="stat-icon" />
                    </div>
                </div>

                <div className="modern-content-section">

                    {/* Current Stay */}
                    {currentBooking && (
                        <div className="modern-current-stay">
                            <h2>Current Stay</h2>
                            <div className="stay-details-grid">
                                <div className="stay-info">
                                    <h3>{currentBooking.branch_name}</h3>
                                    <p><strong>Room:</strong> {currentBooking.room_number} ({currentBooking.room_type})</p>
                                    <p><strong>Check-in:</strong> {formatDate(currentBooking.check_in_date)}</p>
                                    <p><strong>Check-out:</strong> {formatDate(currentBooking.check_out_date)}</p>
                                    {currentBooking.outstanding_amount > 0 && (
                                        <p className="outstanding">
                                            <strong>Outstanding:</strong> {formatCurrency(currentBooking.outstanding_amount)}
                                        </p>
                                    )}
                                </div>
                                <div className="stay-actions">
                                    <button 
                                        className="modern-btn"
                                        onClick={() => navigate(`/bookings/${currentBooking.booking_id}`)}
                                    >
                                        View Details
                                    </button>
                                    <button 
                                        className="modern-btn modern-btn-secondary"
                                        onClick={() => navigate(`/bookings/${currentBooking.booking_id}`)}
                                    >
                                        Request Service
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Hotel Info Section */}
                <div className="hotel-info-section">
                    <div className="hotel-info-grid">
                        <div className="info-card">
                            <h3>World-Class Accommodations</h3>
                            <p>Each room is a masterpiece of design, featuring premium furnishings, state-of-the-art technology, and breathtaking views that redefine luxury living.</p>
                        </div>
                        <div className="info-card">
                            <h3>Exceptional Dining</h3>
                            <p>Indulge in culinary excellence at our award-winning restaurants, where master chefs create unforgettable gastronomic experiences using the finest ingredients.</p>
                        </div>
                        <div className="info-card">
                            <h3>Personalized Service</h3>
                            <p>Our dedicated concierge team anticipates your every need, ensuring a seamless and memorable stay from arrival to departure.</p>
                        </div>
                    </div>
                </div>

                {/* Upcoming Bookings */}
                {upcomingBookings.length > 0 && (
                    <div className="modern-content-section">
                        <div className="modern-upcoming-section">
                            <h2>Upcoming Reservations</h2>
                            <div className="upcoming-list">
                                {upcomingBookings.map((booking) => (
                                    <div 
                                        key={booking.booking_id}
                                        className="upcoming-item"
                                        onClick={() => navigate(`/bookings/${booking.booking_id}`)}
                                    >
                                        <div className="upcoming-info">
                                            <h4>{booking.branch_name}</h4>
                                            <p>Room {booking.room_number} • {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}</p>
                                        </div>
                                        <div className="upcoming-price">
                                            <p className="total">{formatCurrency(booking.total_amount)}</p>
                                            <p className="paid">Paid: {formatCurrency(booking.paid_amount)}</p>
                                        </div>
                                    </div>
                                ))}
                                <button 
                                    className="modern-btn"
                                    onClick={() => navigate('/guest/bookings')}
                                    style={{ marginTop: '1rem' }}
                                >
                                    View All Bookings
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* No Bookings Message */}
                {!currentBooking && upcomingBookings.length === 0 && (
                    <div className="modern-content-section">
                        <div className="modern-empty-state">
                            <FaHotel className="empty-icon" />
                            <h3>Begin Your Journey</h3>
                            <p>Contact our reception to reserve your luxurious escape</p>
                        </div>
                    </div>
                )}

                {/* Amenities Section */}
                <div className="amenities-section">
                    <h2>Premium Amenities</h2>
                    <div className="amenities-grid">
                        <div className="amenity-card">
                            <FaConciergeBell className="amenity-icon" />
                            <h3>24/7 Concierge</h3>
                            <p>Round-the-clock personalized assistance for all your needs</p>
                        </div>
                        <div className="amenity-card">
                            <FaHotel className="amenity-icon" />
                            <h3>Spa & Wellness</h3>
                            <p>Rejuvenate your mind and body in our world-class spa facilities</p>
                        </div>
                        <div className="amenity-card">
                            <FaCalendarCheck className="amenity-icon" />
                            <h3>Business Center</h3>
                            <p>State-of-the-art meeting rooms and business services</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuestDashboard;
