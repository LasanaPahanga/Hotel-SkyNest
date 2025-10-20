import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { bookingAPI } from '../../utils/api';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { FaCalendarCheck, FaConciergeBell, FaMoneyBillWave, FaClipboardList, FaHotel, FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import dashboardImage from '../../assets/dashboard.jpeg';
import guestHeroImage from '../../assets/premium_photo-1661964071015-d97428970584.avif';
import '../../styles/Dashboard.css';
import '../../styles/CommonPage.css';

const GuestDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState({
        activeBookings: 0,
        upcomingBookings: 0,
        totalSpent: 0,
        pendingPayments: 0
    });
    const [currentBooking, setCurrentBooking] = useState(null);
    const [upcomingBookings, setUpcomingBookings] = useState([]);
    const [loading, setLoading] = useState(true);

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
            icon: <FaClipboardList />,
            color: '#8b5cf6',
            action: handleViewProfile
        }
    ];

    if (loading) {
        return (
            <Layout>
                <LoadingSpinner message="Loading dashboard..." />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="guest-dashboard common-page" style={{ backgroundImage: `url(${dashboardImage})` }}>
                <div className="dashboard-header">
                    <h1>Welcome, {user?.full_name}!</h1>
                    <p>Manage your bookings and services</p>
                </div>

                <div 
                    className="hero-image-section"
                    style={{
                        width: '100%',
                        height: '400px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        marginBottom: '2rem',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <img 
                        src={guestHeroImage} 
                        alt="Hotel Luxury Experience"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center'
                        }}
                    />
                </div>

                {/* Stats Cards */}
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <Card style={{ background: 'linear-gradient(135deg,rgb(50, 75, 185) 0%,rgb(54, 21, 87) 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontSize: '2.5rem', opacity: 0.9 }}>
                                <FaHotel />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{ fontSize: '1.5rem', margin: 0, wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stats.activeBookings}</h3>
                                <p style={{ margin: 0, opacity: 0.9 }}>Active Stays</p>
                            </div>
                        </div>
                    </Card>
                    
                    <Card style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontSize: '2.5rem', opacity: 0.9 }}>
                                <FaClock />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{ fontSize: '1.5rem', margin: 0, wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stats.upcomingBookings}</h3>
                                <p style={{ margin: 0, opacity: 0.9 }}>Upcoming Bookings</p>
                            </div>
                        </div>
                    </Card>
                    
                    <Card style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontSize: '2.5rem', opacity: 0.9 }}>
                                <FaMoneyBillWave />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{ fontSize: '1.5rem', margin: 0, wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatCurrency(stats.totalSpent)}</h3>
                                <p style={{ margin: 0, opacity: 0.9 }}>Total Spent</p>
                            </div>
                        </div>
                    </Card>
                    
                    <Card style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontSize: '2.5rem', opacity: 0.9 }}>
                                <FaConciergeBell />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{ fontSize: '1.5rem', margin: 0, wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatCurrency(stats.pendingPayments)}</h3>
                                <p style={{ margin: 0, opacity: 0.9 }}>Pending Payments</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card title="Quick Actions" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        {quickActions.map((action, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!action.disabled && action.action) {
                                        action.action();
                                    }
                                }}
                                disabled={action.disabled}
                                className="quick-action-btn"
                                style={{
                                    padding: '1.5rem',
                                    border: `2px solid ${action.color}`,
                                    borderRadius: '0.5rem',
                                    background: 'white',
                                    cursor: action.disabled ? 'not-allowed' : 'pointer',
                                    opacity: action.disabled ? 0.5 : 1,
                                    transition: 'all 0.3s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    position: 'relative',
                                    zIndex: 1,
                                    pointerEvents: action.disabled ? 'none' : 'auto'
                                }}
                                onMouseEnter={(e) => {
                                    if (!action.disabled) {
                                        e.currentTarget.style.background = action.color;
                                        e.currentTarget.style.color = 'white';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!action.disabled) {
                                        e.currentTarget.style.background = 'white';
                                        e.currentTarget.style.color = 'inherit';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                <div style={{ fontSize: '2rem', color: 'inherit', pointerEvents: 'none' }}>
                                    {action.icon}
                                </div>
                                <span style={{ fontWeight: 600, pointerEvents: 'none' }}>{action.title}</span>
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Current Stay */}
                {currentBooking && (
                    <Card title="Current Stay" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>{currentBooking.branch_name}</h3>
                                <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>
                                    <strong>Room:</strong> {currentBooking.room_number} ({currentBooking.room_type})
                                </p>
                                <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>
                                    <strong>Check-in:</strong> {formatDate(currentBooking.check_in_date)}
                                </p>
                                <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>
                                    <strong>Check-out:</strong> {formatDate(currentBooking.check_out_date)}
                                </p>
                                <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>
                                    <strong>Outstanding:</strong> <span style={{ color: '#ef4444', fontWeight: 600 }}>{formatCurrency(currentBooking.outstanding_amount)}</span>
                                </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => navigate(`/bookings/${currentBooking.booking_id}`)}
                                >
                                    View Details
                                </button>
                                <button 
                                    className="btn btn-secondary"
                                    onClick={() => navigate(`/bookings/${currentBooking.booking_id}`)}
                                >
                                    Request Service
                                </button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Upcoming Bookings */}
                {upcomingBookings.length > 0 && (
                    <Card title="Upcoming Bookings">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {upcomingBookings.map((booking) => (
                                <div 
                                    key={booking.booking_id}
                                    style={{
                                        padding: '1rem',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '0.5rem',
                                        display: 'grid',
                                        gridTemplateColumns: '1fr auto',
                                        gap: '1rem',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                    onClick={() => navigate(`/bookings/${booking.booking_id}`)}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                >
                                    <div>
                                        <h4 style={{ margin: '0 0 0.5rem 0' }}>{booking.branch_name}</h4>
                                        <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                                            Room {booking.room_number} • {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>{formatCurrency(booking.total_amount)}</p>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                                            Paid: {formatCurrency(booking.paid_amount)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <button 
                                className="btn btn-secondary"
                                onClick={() => navigate('/guest/bookings')}
                                style={{ marginTop: '0.5rem' }}
                            >
                                View All Bookings
                            </button>
                        </div>
                    </Card>
                )}

                {/* No Bookings Message */}
                {!currentBooking && upcomingBookings.length === 0 && (
                    <Card>
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                            <FaHotel style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }} />
                            <h3>No Bookings Yet</h3>
                            <p>Contact our reception to make your first booking!</p>
                        </div>
                    </Card>
                )}
            </div>
        </Layout>
    );
};

export default GuestDashboard;
