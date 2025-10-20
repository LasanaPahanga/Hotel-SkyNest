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
        <div className="layout role-guest">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    {sidebarOpen ? (
                        <img src={logoSky} alt="SkyNest Hotels" className="sidebar-logo" />
                    ) : (
                        <img src={logoSky} alt="SkyNest" className="sidebar-logo-small" />
                    )}
                    <button className="toggle-btn" onClick={toggleSidebar}>
                        {sidebarOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <Link 
                        to="/guest" 
                        className={`nav-item ${isActive('/guest')}`}
                    >
                        <FaHome className="nav-icon" />
                        {sidebarOpen && <span>Dashboard</span>}
                    </Link>

                    {getNavItems().map((item) => (
                        <Link 
                            key={item.path}
                            to={item.path} 
                            className={`nav-item ${isActive(item.path)}`}
                        >
                            <item.icon className="nav-icon" />
                            {sidebarOpen && <span>{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <FaSignOutAlt className="nav-icon" />
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content - No Top Bar */}
            <div className="main-content guest-layout-main">
                {/* Page Content */}
                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default GuestLayout;