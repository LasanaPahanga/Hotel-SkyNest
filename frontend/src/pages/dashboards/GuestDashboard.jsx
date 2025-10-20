import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { bookingAPI } from '../../utils/api';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { FaCalendarCheck, FaConciergeBell, FaMoneyBillWave, FaUser, FaHotel, FaClock, FaSignOutAlt, FaHome, FaChevronDown, FaHeadset, FaFileInvoice } from 'react-icons/fa';
import { toast } from 'react-toastify';
import hotelVideo from '../../assets/WhatsApp Video 2025-10-20 at 21.26.12_d1af48f8.mp4';
import singleRoomImg from '../../assets/single.jpg';
import doubleRoomImg from '../../assets/double room.png';
import deluxeRoomImg from '../../assets/Deluxe-Double-Guestroom2.webp';
import familyRoomImg from '../../assets/family.jpg';
import presidentialSuiteImg from '../../assets/PRESIDENTIAL-SUITE-1-scaled.jpg';
import personalizedServiceImg from '../../assets/PersonalizedService.jpg';
import exceptionalDiningImg from '../../assets/Exceptionaldining.jpg';
import worldClassAccommodationsImg from '../../assets/worldclassaccommodations.webp';
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
    const [currentSlide, setCurrentSlide] = useState(0);

    const hotelFeatures = [
        {
            title: 'World-Class Accommodations',
            description: 'Each room is a masterpiece of design, featuring premium furnishings, state-of-the-art technology, and breathtaking views that redefine luxury living.',
            image: worldClassAccommodationsImg || singleRoomImg
        },
        {
            title: 'Exceptional Dining',
            description: 'Indulge in culinary excellence at our award-winning restaurants, where master chefs create unforgettable gastronomic experiences using the finest ingredients.',
            image: exceptionalDiningImg || doubleRoomImg
        },
        {
            title: 'Personalized Service',
            description: 'Our dedicated concierge team anticipates your every need, ensuring a seamless and memorable stay from arrival to departure.',
            image: personalizedServiceImg || deluxeRoomImg
        }
    ];

    // Debug: Log image paths
    useEffect(() => {
        console.log('Image paths:', {
            worldClass: worldClassAccommodationsImg,
            dining: exceptionalDiningImg,
            service: personalizedServiceImg,
            fallbacks: { single: singleRoomImg, double: doubleRoomImg, deluxe: deluxeRoomImg }
        });
    }, []);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % hotelFeatures.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + hotelFeatures.length) % hotelFeatures.length);
    };

    // Auto-play slider
    useEffect(() => {
        const interval = setInterval(() => {
            nextSlide();
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(interval);
    }, [currentSlide]);

    const scrollToContent = () => {
        contentRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Get room image based on room type
    const getRoomImage = (roomType) => {
        const type = roomType?.toLowerCase() || '';
        if (type.includes('presidential') || type.includes('suite')) return presidentialSuiteImg;
        if (type.includes('deluxe')) return deluxeRoomImg;
        if (type.includes('family')) return familyRoomImg;
        if (type.includes('double')) return doubleRoomImg;
        if (type.includes('single')) return singleRoomImg;
        return doubleRoomImg; // default
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
                        <div className="modern-current-stay" style={{
                            backgroundImage: `url(${getRoomImage(currentBooking.room_type)})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            position: 'relative'
                        }}>
                            <div className="current-stay-overlay">
                                <h2>CURRENT STAY</h2>
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
                                            VIEW DETAILS
                                        </button>
                                        <button 
                                            className="modern-btn modern-btn-secondary"
                                            onClick={() => navigate(`/bookings/${currentBooking.booking_id}`)}
                                        >
                                            REQUEST SERVICE
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Hotel Features Slider */}
                <div className="hotel-slider-section">
                    <div className="slider-container">
                        <button className="slider-arrow slider-arrow-left" onClick={prevSlide}>
                            <FaChevronDown style={{ transform: 'rotate(90deg)' }} />
                        </button>
                        
                        <div className="slider-content">
                            <div className="slider-image slider-fade" style={{
                                backgroundImage: `url(${hotelFeatures[currentSlide].image})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                backgroundColor: '#f0f0f0'
                            }}>
                            </div>
                            <div className="slider-text slider-fade">
                                <h2>{hotelFeatures[currentSlide].title}</h2>
                                <p>{hotelFeatures[currentSlide].description}</p>
                                <div className="slider-dots">
                                    {hotelFeatures.map((_, index) => (
                                        <button
                                            key={index}
                                            className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
                                            onClick={() => setCurrentSlide(index)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <button className="slider-arrow slider-arrow-right" onClick={nextSlide}>
                            <FaChevronDown style={{ transform: 'rotate(-90deg)' }} />
                        </button>
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
            </div>

            {/* Footer */}
            <footer className="guest-footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <div className="footer-logo">
                            <FaHotel style={{ fontSize: '2rem', marginBottom: '1rem' }} />
                            <h3>SkyNest Hotels</h3>
                            <p>Experience Luxury Beyond Expectations</p>
                        </div>
                    </div>
                    <div className="footer-section">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><a href="#" onClick={() => navigate('/guest/bookings')}>My Bookings</a></li>
                            <li><a href="#" onClick={() => navigate('/guest/request-service')}>Request Service</a></li>
                            <li><a href="#" onClick={() => navigate('/guest/support')}>Support</a></li>
                            <li><a href="#" onClick={() => navigate('/guest/profile')}>My Profile</a></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>Contact</h4>
                        <p>Email: info@skynesthotels.com</p>
                        <p>Phone: +94 11 234 5678</p>
                        <p>Address: Colombo, Sri Lanka</p>
                    </div>
                    <div className="footer-section">
                        <h4>Follow Us</h4>
                        <div className="social-links">
                            <a href="#" aria-label="Facebook"><FaUser /></a>
                            <a href="#" aria-label="Twitter"><FaUser /></a>
                            <a href="#" aria-label="Instagram"><FaUser /></a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2025 SkyNest Hotels. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default GuestDashboard;
