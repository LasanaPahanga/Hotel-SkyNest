import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardRoute } from '../utils/helpers';
import { FaHotel, FaUser, FaLock } from 'react-icons/fa';
import '../styles/Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

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
                    <FaHotel className="login-logo" />
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

                    <button 
                        type="submit" 
                        className="login-btn"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="login-footer">
                    <div className="demo-credentials">
                        <h4>Demo Credentials:</h4>
                        <p><strong>Admin:</strong> admin / password123</p>
                        <p><strong>Receptionist:</strong> receptionist_colombo / password123</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
