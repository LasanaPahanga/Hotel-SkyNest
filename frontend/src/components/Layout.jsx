import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    FaHome, FaCalendarAlt, FaBed, FaUsers, FaConciergeBell, 
    FaMoneyBillWave, FaChartBar, FaUser, FaSignOutAlt, FaBars, FaTimes, FaUserCog,
    FaHeadset, FaPercent, FaFileInvoiceDollar
} from 'react-icons/fa';
import logoSky from '../assets/logosky.png';
import '../styles/Layout.css';

const Layout = ({ children }) => {
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
        if (path === getDashboardPath()) {
            return location.pathname === path ? 'active' : '';
        }
        // StartsWith for other paths
        return location.pathname.startsWith(path) ? 'active' : '';
    };

    const getNavItems = () => {
        // Guest navigation
        if (user?.role === 'Guest') {
            return [
                { path: '/guest/bookings', icon: FaCalendarAlt, label: 'My Bookings' },
                { path: '/guest/support', icon: FaHeadset, label: 'Support' }
            ];
        }

        // Admin & Receptionist navigation
        const commonItems = [
            { path: '/bookings', icon: FaCalendarAlt, label: 'Bookings' },
            { path: '/rooms', icon: FaBed, label: 'Rooms' },
            { path: '/services', icon: FaConciergeBell, label: 'Services' },
            { path: '/profile', icon: FaUser, label: 'Profile' }
        ];

        const adminReceptionistItems = [
            { path: '/guests', icon: FaUsers, label: 'Guests' },
            { path: '/service-requests', icon: FaConciergeBell, label: 'Service Requests' },
            { path: '/payments', icon: FaMoneyBillWave, label: 'Payments' },
            { path: '/tax-discount', icon: FaPercent, label: 'Tax & Discounts' },
            { path: '/fees', icon: FaFileInvoiceDollar, label: 'Fees' },
            { path: '/reports', icon: FaChartBar, label: 'Reports' },
            { path: '/support', icon: FaHeadset, label: 'Support' }
        ];

        const adminOnlyItems = [
            { path: '/users', icon: FaUserCog, label: 'Users' }
        ];

        if (user?.role === 'Admin') {
            return [...commonItems.slice(0, 3), ...adminReceptionistItems, ...adminOnlyItems, commonItems[3]];
        }

        if (user?.role === 'Receptionist') {
            return [...commonItems.slice(0, 3), ...adminReceptionistItems, commonItems[3]];
        }

        return commonItems;
    };

    const getDashboardPath = () => {
        if (user?.role === 'Admin') return '/admin';
        if (user?.role === 'Receptionist') return '/receptionist';
        if (user?.role === 'Guest') return '/guest';
        return '/login';
    };

    const roleClass = user?.role ? `role-${user.role.toLowerCase()}` : '';

    return (
        <div className={`layout ${roleClass}`}>
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
                        to={getDashboardPath()} 
                        className={`nav-item ${isActive(getDashboardPath())}`}
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

            {/* Main Content */}
            <div className="main-content">
                {/* Top Bar */}
                <header className="top-bar">
                    <div className="top-bar-left">
                        <button className="mobile-toggle" onClick={toggleSidebar}>
                            <FaBars />
                        </button>
                        <h1 className="page-title">
                            {location.pathname.split('/').pop() || 'Dashboard'}
                        </h1>
                    </div>
                    <div className="top-bar-right">
                        <div className="user-info">
                            <span className="user-name">{user?.full_name}</span>
                            <span className="user-role">{user?.role}</span>
                            {user?.branch && (
                                <span className="user-branch">{user.branch.branch_name}</span>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
