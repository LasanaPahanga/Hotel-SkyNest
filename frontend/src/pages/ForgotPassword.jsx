import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import logosky from '../assets/logosky.png';
import '../styles/ForgotPassword.css';

const ForgotPassword = () => {
    const currentYear = new Date().getFullYear();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetData, setResetData] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
                email
            });

            toast.success(response.data.message);
            setResetData(response.data.data);
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to generate reset token';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-page">
            <div className="forgot-password-container">
                <div className="forgot-password-header">
                    <img src={logosky} alt="SkyNest logo" className="forgot-password-logo" />
                    <h1>SkyNest Hotels</h1>
                    <p>Reset Your Password</p>
                </div>

                {!resetData ? (
                    <form className="forgot-password-form" onSubmit={handleSubmit}>
                        <p className="instruction-text">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>

                        <div className="form-group">
                            <label htmlFor="email">
                                <FaEnvelope /> Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="reset-btn"
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        <div className="back-to-login">
                            <Link to="/login">← Back to Login</Link>
                        </div>
                    </form>
                ) : (
                    <div className="success-message">
                        <div className="success-icon">✓</div>
                        <h2>Reset Link Generated</h2>
                        <p>
                            Click the button below to reset your password:
                        </p>
                        <div style={{ margin: '20px 0' }}>
                            <Link 
                                to={`/reset-password/${resetData.token}`}
                                style={{
                                    display: 'inline-block',
                                    padding: '12px 30px',
                                    backgroundColor: '#6896a7',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '5px',
                                    fontWeight: 600
                                }}
                            >
                                Reset Password Now
                            </Link>
                        </div>
                        <p className="note">
                            This link will expire in 1 hour.
                        </p>
                        <div className="back-to-login">
                            <Link to="/login">← Back to Login</Link>
                        </div>
                    </div>
                )}

                <div className="forgot-password-footer">
                    <p className="made-by">© {currentYear} — Made by Group 39</p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
