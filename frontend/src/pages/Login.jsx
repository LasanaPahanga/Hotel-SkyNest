import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardRoute } from '../utils/helpers';
import { FaUser, FaLock, FaHotel, FaConciergeBell, FaShieldAlt, FaClock } from 'react-icons/fa';
import logosky from '../assets/logosky.png';
import '../styles/Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const user = await login(username, password);
            navigate(getDashboardRoute(user.role));
        } catch (error) {
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-split-container">
                {/* Left Side - Login Form */}
                <div className="login-left">
                    <div className="login-container">
                        <div className="login-header">
                            <img src={logosky} alt="SkyNest logo" className="login-logo" />
                            <h1>SkyNest Hotels</h1>
                            <p>Reservation & Management System</p>
                        </div>

                        <form className="login-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="username">
                                    <FaUser /> Username
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">
                                    <FaLock /> Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="forgot-password-link">
                                <Link to="/forgot-password">Forgot Password?</Link>
                            </div>

                            <button 
                                type="submit" 
                                className="login-btn"
                                disabled={loading}
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>

                            <div className="signup-link">
                                Don't have an account? <Link to="/signup">Sign Up</Link>
                            </div>
                        </form>

                        <div className="login-footer">
                            <div className="login-footer-note">
                                <p className="made-by">© {currentYear} — Made by Group 39</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Features */}
                <div className="login-right">
                    <div className="features-container">
                        <h2>Welcome to SkyNest Hotels</h2>
                        <p className="features-subtitle">Experience luxury and comfort with our premium services</p>
                        
                        <div className="features-grid">
                            <div className="feature-item">
                                <div className="feature-icon">
                                    <FaHotel />
                                </div>
                                <h3>Premium Accommodations</h3>
                                <p>Luxurious rooms with world-class amenities and breathtaking views</p>
                            </div>

                            <div className="feature-item">
                                <div className="feature-icon">
                                    <FaConciergeBell />
                                </div>
                                <h3>24/7 Concierge Service</h3>
                                <p>Round-the-clock assistance for all your needs and requests</p>
                            </div>

                            <div className="feature-item">
                                <div className="feature-icon">
                                    <FaShieldAlt />
                                </div>
                                <h3>Secure & Safe</h3>
                                <p>Advanced security measures to ensure your safety and privacy</p>
                            </div>

                            <div className="feature-item">
                                <div className="feature-icon">
                                    <FaClock />
                                </div>
                                <h3>Easy Booking</h3>
                                <p>Quick and hassle-free reservation system for your convenience</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
