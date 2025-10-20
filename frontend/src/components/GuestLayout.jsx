import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    FaHome, FaCalendarCheck, FaConciergeBell, 
    FaSignOutAlt, FaHeadset, FaFileInvoice, FaUser, FaHotel
} from 'react-icons/fa';
import '../styles/ModernGuestDashboard.css';
import '../styles/GuestTheme.css';

const GuestLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('home');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => {
        if (path === '/guest') {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

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
                    className={`guest-tab ${isActive('/guest') && location.pathname === '/guest' ? 'active' : ''}`}
                    onClick={() => navigate('/guest')}
                >
                    <FaHome style={{ marginRight: '0.5rem' }} /> Home
                </button>
                <button 
                    className={`guest-tab ${isActive('/guest/bookings') ? 'active' : ''}`}
                    onClick={() => navigate('/guest/bookings')}
                >
                    <FaCalendarCheck style={{ marginRight: '0.5rem' }} /> My Bookings
                </button>
                <button 
                    className={`guest-tab ${isActive('/guest/request-service') ? 'active' : ''}`}
                    onClick={() => navigate('/guest/request-service')}
                >
                    <FaConciergeBell style={{ marginRight: '0.5rem' }} /> Request Service
                </button>
                <button 
                    className={`guest-tab ${isActive('/guest/support') ? 'active' : ''}`}
                    onClick={() => navigate('/guest/support')}
                >
                    <FaHeadset style={{ marginRight: '0.5rem' }} /> Support
                </button>
                <button 
                    className={`guest-tab ${isActive('/guest/view-bill') ? 'active' : ''}`}
                    onClick={() => navigate('/guest/view-bill')}
                >
                    <FaFileInvoice style={{ marginRight: '0.5rem' }} /> View Bill
                </button>
                <button 
                    className={`guest-tab ${isActive('/guest/profile') ? 'active' : ''}`}
                    onClick={() => navigate('/guest/profile')}
                >
                    <FaUser style={{ marginRight: '0.5rem' }} /> Profile
                </button>
            </div>

            {/* Full Width Content */}
            <main className="guest-main-content">
                {children}
            </main>
        </div>
    );
};

export default GuestLayout;