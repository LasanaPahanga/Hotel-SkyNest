import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaIdCard, FaGlobe } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import logosky from '../assets/logosky.png';
import '../styles/Signup.css';

const Signup = () => {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        idType: 'Passport',
        idNumber: '',
        address: '',
        country: '',
        dateOfBirth: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Validation
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/auth/signup', {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                idType: formData.idType,
                idNumber: formData.idNumber,
                address: formData.address,
                country: formData.country,
                dateOfBirth: formData.dateOfBirth || null
            });

            const createdUsername = response?.data?.data?.username || (formData.email ? formData.email.split('@')[0] : '');
            const message = createdUsername
                ? `Account created successfully! Your username is ${createdUsername}. Redirecting to login...`
                : 'Account created successfully! Redirecting to login...';
            toast.success(message);
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (error) {
            const message = error.response?.data?.message || 'Signup failed. Please try again.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-page">
            <div className="signup-container">
                <div className="signup-header">
                    <img src={logosky} alt="SkyNest logo" className="signup-logo" />
                    <h1>SkyNest Hotels</h1>
                    <p>Create Your Account</p>
                </div>

                <form className="signup-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="firstName">
                                <FaUser /> First Name *
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="Enter first name"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="lastName">
                                <FaUser /> Last Name *
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Enter last name"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">
                            <FaEnvelope /> Email *
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">
                            <FaPhone /> Phone *
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Enter phone number"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="password">
                                <FaLock /> Password *
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter password"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">
                                <FaLock /> Confirm Password *
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm password"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="idType">
                                <FaIdCard /> ID Type *
                            </label>
                            <select
                                id="idType"
                                name="idType"
                                value={formData.idType}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            >
                                <option value="Passport">Passport</option>
                                <option value="NIC">NIC</option>
                                <option value="Driving License">Driving License</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="idNumber">
                                <FaIdCard /> ID Number *
                            </label>
                            <input
                                type="text"
                                id="idNumber"
                                name="idNumber"
                                value={formData.idNumber}
                                onChange={handleChange}
                                placeholder="Enter ID number"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="country">
                            <FaGlobe /> Country *
                        </label>
                        <input
                            type="text"
                            id="country"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            placeholder="Enter country"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">
                            Address
                        </label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter address (optional)"
                            rows="2"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="dateOfBirth">
                            Date of Birth
                        </label>
                        <input
                            type="date"
                            id="dateOfBirth"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="signup-btn"
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>

                    <div className="login-link">
                        Already have an account? <Link to="/login">Login here</Link>
                    </div>
                </form>

                <div className="signup-footer">
                    <div className="signup-footer-note">
                        <p className="made-by">© {currentYear} — Made by Group 39</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
