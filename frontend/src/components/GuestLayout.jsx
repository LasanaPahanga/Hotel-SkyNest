import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    FaHome, FaCalendarAlt, FaConciergeBell, 
    FaSignOutAlt, FaBars, FaTimes,
    FaHeadset
} from 'react-icons/fa';
import logoSky from '../assets/logosky.png';
import '../styles/Layout.css';
import '../styles/GuestLayout.css';
import '../styles/GuestDashboard.css';
import '../styles/GuestTheme.css';

const GuestLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const isActive = (path) => {
        // Exact match for dashboard paths
        if (path === '/guest') {
            return location.pathname === path ? 'active' : '';
        }
        // StartsWith for other paths
        return location.pathname.startsWith(path) ? 'active' : '';
    };

    const getNavItems = () => {
        // Guest navigation
        return [
            { path: '/guest/bookings', icon: FaCalendarAlt, label: 'My Bookings' },
            { path: '/guest/support', icon: FaHeadset, label: 'Support' }
        ];
    };

    return (
        <div className="guest-full-layout">
            {/* Top Navigation Bar */}
            <div className="guest-top-bar">
                <div className="guest-top-bar-content">
                    <div className="guest-logo-section">
                        <FaHome style={{ fontSize: '1.5rem' }} />
                        <h1>SkyNest Hotels</h1>
                    </div>
                    <div className="guest-nav-links">
                        <Link to="/guest" className={isActive('/guest')}>
                            <FaHome /> HOME
                        </Link>
                        <Link to="/guest/bookings" className={isActive('/guest/bookings')}>
                            <FaCalendarAlt /> MY BOOKINGS
                        </Link>
                        <Link to="/guest/request-service" className={isActive('/guest/request-service')}>
                            <FaConciergeBell /> REQUEST SERVICE
                        </Link>
                        <Link to="/guest/support" className={isActive('/guest/support')}>
                            <FaHeadset /> SUPPORT
                        </Link>
                    </div>
                    <div className="guest-user-section">
                        <span>{user?.full_name}</span>
                        <button onClick={handleLogout} className="guest-logout-btn">
                            <FaSignOutAlt /> Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Full Width Content */}
            <main className="guest-main-content">
                {children}
            </main>
        </div>
    );
};

export default GuestLayout;