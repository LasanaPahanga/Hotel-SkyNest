import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { FaUser, FaLock } from 'react-icons/fa';
import dashboardImage from '../assets/dashboard.jpeg';
import '../styles/CommonPage.css';

const Profile = () => {
    const { user } = useAuth();
    const [passwords, setPasswords] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwords.new_password !== passwords.confirm_password) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwords.new_password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await authAPI.changePassword({
                current_password: passwords.current_password,
                new_password: passwords.new_password
            });
            toast.success('Password changed successfully');
            setPasswords({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="profile-page common-page" style={{ backgroundImage: `url(${dashboardImage})` }}>
                <div className="page-header">
                    <h1>My Profile</h1>
                </div>

                <div className="profile-grid">
                    <Card title="User Information">
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Full Name:</label>
                                <span>{user?.full_name}</span>
                            </div>
                            <div className="info-item">
                                <label>Username:</label>
                                <span>{user?.username}</span>
                            </div>
                            <div className="info-item">
                                <label>Email:</label>
                                <span>{user?.email}</span>
                            </div>
                            <div className="info-item">
                                <label>Role:</label>
                                <span className="role-badge">{user?.role}</span>
                            </div>
                            {user?.phone && (
                                <div className="info-item">
                                    <label>Phone:</label>
                                    <span>{user.phone}</span>
                                </div>
                            )}
                            {user?.branch && (
                                <div className="info-item">
                                    <label>Branch:</label>
                                    <span>{user.branch.branch_name} - {user.branch.location}</span>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card title="Change Password">
                        <form onSubmit={handlePasswordChange}>
                            <div className="form-group">
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    value={passwords.current_password}
                                    onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={passwords.new_password}
                                    onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                                    required
                                    disabled={loading}
                                    minLength="6"
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwords.confirm_password}
                                    onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                                    required
                                    disabled={loading}
                                    minLength="6"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Changing...' : 'Change Password'}
                            </button>
                        </form>
                    </Card>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
