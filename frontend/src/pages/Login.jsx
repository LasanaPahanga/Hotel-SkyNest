import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardRoute } from '../utils/helpers';
import { FaUser, FaLock } from 'react-icons/fa';
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
    );
};

export default Login;
