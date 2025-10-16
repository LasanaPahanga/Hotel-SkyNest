import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaLock } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import logosky from '../assets/logosky.png';
import '../styles/ForgotPassword.css';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/auth/reset-password', {
                token,
                newPassword: formData.newPassword
            });

            toast.success(response.data.message);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to reset password';
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
                    <p>Create New Password</p>
                </div>

                <form className="forgot-password-form" onSubmit={handleSubmit}>
                    <p className="instruction-text">
                        Please enter your new password below.
                    </p>

                    <div className="form-group">
                        <label htmlFor="newPassword">
                            <FaLock /> New Password
                        </label>
                        <input
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            placeholder="Enter new password"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">
                            <FaLock /> Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm new password"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="reset-btn"
                        disabled={loading}
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>

                    <div className="back-to-login">
                        <Link to="/login">← Back to Login</Link>
                    </div>
                </form>

                <div className="forgot-password-footer">
                    <p className="made-by">© {currentYear} — Made by Group 39</p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
