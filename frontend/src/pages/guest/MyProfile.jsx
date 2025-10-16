import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import { guestAPI } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendar, FaIdCard, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../../styles/GuestDashboard.css';

const MyProfile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        date_of_birth: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await guestAPI.getMyProfile();
            setProfile(response.data.data);
            setFormData({
                first_name: response.data.data.first_name || '',
                last_name: response.data.data.last_name || '',
                phone: response.data.data.phone || '',
                address: response.data.data.address || '',
                date_of_birth: response.data.data.date_of_birth || ''
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await guestAPI.updateMyProfile(formData);
            toast.success('Profile updated successfully!');
            setEditing(false);
            fetchProfile(); // Refresh profile data
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            phone: profile.phone || '',
            address: profile.address || '',
            date_of_birth: profile.date_of_birth || ''
        });
        setEditing(false);
    };

    if (loading) {
        return (
            <Layout>
                <LoadingSpinner />
            </Layout>
        );
    }

    if (!profile) {
        return (
            <Layout>
                <div className="container">
                    <Card>
                        <div className="text-center py-5">
                            <h3>Profile not found</h3>
                            <button 
                                className="btn btn-primary mt-3"
                                onClick={() => navigate('/guest/dashboard')}
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </Card>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container">
                <div className="page-header">
                    <h1>
                        <FaUser className="me-2" />
                        My Profile
                    </h1>
                    {!editing && (
                        <button 
                            className="btn btn-primary"
                            onClick={() => setEditing(true)}
                        >
                            <FaEdit className="me-2" />
                            Edit Profile
                        </button>
                    )}
                </div>

                <div className="row">
                    <div className="col-lg-8 mx-auto">
                        <Card>
                            {editing ? (
                                <form onSubmit={handleSubmit}>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">
                                                <FaUser className="me-2" />
                                                First Name *
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="first_name"
                                                value={formData.first_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                <FaUser className="me-2" />
                                                Last Name *
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="last_name"
                                                value={formData.last_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                <FaEnvelope className="me-2" />
                                                Email (Cannot be changed)
                                            </label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={profile.email}
                                                disabled
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                <FaPhone className="me-2" />
                                                Phone *
                                            </label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label">
                                                <FaMapMarkerAlt className="me-2" />
                                                Address
                                            </label>
                                            <textarea
                                                className="form-control"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                rows="3"
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                <FaCalendar className="me-2" />
                                                Date of Birth
                                            </label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="date_of_birth"
                                                value={formData.date_of_birth}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                <FaIdCard className="me-2" />
                                                ID Type (Cannot be changed)
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={profile.id_type}
                                                disabled
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                <FaIdCard className="me-2" />
                                                ID Number (Cannot be changed)
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={profile.id_number}
                                                disabled
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                <FaMapMarkerAlt className="me-2" />
                                                Country (Cannot be changed)
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={profile.country}
                                                disabled
                                            />
                                        </div>
                                    </div>

                                    <div className="d-flex gap-2 mt-4">
                                        <button 
                                            type="submit" 
                                            className="btn btn-success"
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <FaSave className="me-2" />
                                                    Save Changes
                                                </>
                                            )}
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary"
                                            onClick={handleCancel}
                                            disabled={saving}
                                        >
                                            <FaTimes className="me-2" />
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="profile-view">
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <div className="profile-field">
                                                <label>
                                                    <FaUser className="me-2 text-primary" />
                                                    Full Name
                                                </label>
                                                <p className="value">{profile.first_name} {profile.last_name}</p>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="profile-field">
                                                <label>
                                                    <FaEnvelope className="me-2 text-primary" />
                                                    Email
                                                </label>
                                                <p className="value">{profile.email}</p>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="profile-field">
                                                <label>
                                                    <FaPhone className="me-2 text-primary" />
                                                    Phone
                                                </label>
                                                <p className="value">{profile.phone}</p>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="profile-field">
                                                <label>
                                                    <FaCalendar className="me-2 text-primary" />
                                                    Date of Birth
                                                </label>
                                                <p className="value">
                                                    {profile.date_of_birth ? formatDate(profile.date_of_birth) : 'Not provided'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <div className="profile-field">
                                                <label>
                                                    <FaMapMarkerAlt className="me-2 text-primary" />
                                                    Address
                                                </label>
                                                <p className="value">{profile.address || 'Not provided'}</p>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="profile-field">
                                                <label>
                                                    <FaIdCard className="me-2 text-primary" />
                                                    ID Type
                                                </label>
                                                <p className="value">{profile.id_type}</p>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="profile-field">
                                                <label>
                                                    <FaIdCard className="me-2 text-primary" />
                                                    ID Number
                                                </label>
                                                <p className="value">{profile.id_number}</p>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="profile-field">
                                                <label>
                                                    <FaMapMarkerAlt className="me-2 text-primary" />
                                                    Country
                                                </label>
                                                <p className="value">{profile.country}</p>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="profile-field">
                                                <label>
                                                    <FaCalendar className="me-2 text-primary" />
                                                    Member Since
                                                </label>
                                                <p className="value">{formatDate(profile.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .profile-view {
                    padding: 1rem 0;
                }

                .profile-field {
                    margin-bottom: 1rem;
                }

                .profile-field label {
                    font-weight: 600;
                    color: #6c757d;
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 0.5rem;
                    display: flex;
                    align-items: center;
                }

                .profile-field .value {
                    font-size: 1rem;
                    color: #212529;
                    margin: 0;
                    padding: 0.5rem;
                    background-color: #f8f9fa;
                    border-radius: 0.375rem;
                }

                .form-label {
                    font-weight: 600;
                    color: #495057;
                    display: flex;
                    align-items: center;
                }

                .form-control:disabled {
                    background-color: #e9ecef;
                    cursor: not-allowed;
                }
            `}</style>
        </Layout>
    );
};

export default MyProfile;
