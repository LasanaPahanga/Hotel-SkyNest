import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { guestAPI } from '../utils/api';
import { FaEdit, FaTrash, FaEye, FaPlus, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Guests = () => {
    const { user } = useAuth();
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        id_type: 'Passport',
        id_number: '',
        address: '',
        country: '',
        date_of_birth: ''
    });

    useEffect(() => {
        fetchGuests();
    }, [search]);

    const fetchGuests = async () => {
        try {
            const response = await guestAPI.getAll({ search });
            setGuests(response.data.data);
        } catch (error) {
            console.error('Error fetching guests:', error);
            toast.error('Failed to load guests');
        } finally {
            setLoading(false);
        }
    };

    const handleAddGuest = () => {
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            id_type: 'Passport',
            id_number: '',
            address: '',
            country: '',
            date_of_birth: ''
        });
        setShowAddModal(true);
    };

    const handleEditGuest = (guest) => {
        setSelectedGuest(guest);
        setFormData({
            first_name: guest.first_name,
            last_name: guest.last_name,
            email: guest.email,
            phone: guest.phone,
            id_type: guest.id_type,
            id_number: guest.id_number,
            address: guest.address || '',
            country: guest.country,
            date_of_birth: guest.date_of_birth ? guest.date_of_birth.split('T')[0] : ''
        });
        setShowEditModal(true);
    };

    const handleViewGuest = (guest) => {
        setSelectedGuest(guest);
        setShowViewModal(true);
    };

    const handleSubmitAdd = async (e) => {
        e.preventDefault();
        try {
            const response = await guestAPI.create(formData);
            toast.success('Guest created successfully!');
            
            // Show credentials if user account was created
            if (response.data.data.username) {
                toast.info(`Login Credentials:\nUsername: ${response.data.data.username}\nPassword: ${response.data.data.default_password}`, {
                    autoClose: 10000
                });
            }
            
            setShowAddModal(false);
            fetchGuests();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create guest');
        }
    };

    const handleSubmitEdit = async (e) => {
        e.preventDefault();
        try {
            await guestAPI.update(selectedGuest.guest_id, formData);
            toast.success('Guest updated successfully!');
            setShowEditModal(false);
            fetchGuests();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update guest');
        }
    };

    const handleDeleteGuest = async (guestId, guestName) => {
        if (window.confirm(`Are you sure you want to delete ${guestName}?`)) {
            try {
                await guestAPI.delete(guestId);
                toast.success('Guest deleted successfully!');
                fetchGuests();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete guest');
            }
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    if (loading) {
        return (
            <Layout>
                <LoadingSpinner message="Loading guests..." />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="guests-page">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1>Guests Management</h1>
                        <p>Manage guest information and bookings</p>
                    </div>
                    {(user.role === 'Admin' || user.role === 'Receptionist') && (
                        <button className="btn btn-primary" onClick={handleAddGuest}>
                            <FaPlus /> Add Guest
                        </button>
                    )}
                </div>

                <Card title={`All Guests (${guests.length})`}>
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ position: 'relative', maxWidth: '400px' }}>
                            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                            <input
                                type="text"
                                placeholder="Search by name, email, phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.5rem',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Phone</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Country</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Total Bookings</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {guests.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                            No guests found
                                        </td>
                                    </tr>
                                ) : (
                                    guests.map((guest) => (
                                        <tr key={guest.guest_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                            <td style={{ padding: '0.75rem' }}>
                                                <strong>{guest.first_name} {guest.last_name}</strong>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>{guest.email}</td>
                                            <td style={{ padding: '0.75rem' }}>{guest.phone}</td>
                                            <td style={{ padding: '0.75rem' }}>{guest.country}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                <span style={{ 
                                                    backgroundColor: '#dbeafe', 
                                                    color: '#1e40af', 
                                                    padding: '0.25rem 0.75rem', 
                                                    borderRadius: '9999px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600
                                                }}>
                                                    {guest.total_bookings || 0}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => handleViewGuest(guest)}
                                                        style={{
                                                            padding: '0.25rem 0.75rem',
                                                            fontSize: '0.875rem',
                                                            backgroundColor: '#3b82f6',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '0.25rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <FaEye /> View
                                                    </button>
                                                    {(user.role === 'Admin' || user.role === 'Receptionist') && (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditGuest(guest)}
                                                                style={{
                                                                    padding: '0.25rem 0.75rem',
                                                                    fontSize: '0.875rem',
                                                                    backgroundColor: '#10b981',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '0.25rem',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <FaEdit /> Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteGuest(guest.guest_id, `${guest.first_name} ${guest.last_name}`)}
                                                                style={{
                                                                    padding: '0.25rem 0.75rem',
                                                                    fontSize: '0.875rem',
                                                                    backgroundColor: '#ef4444',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '0.25rem',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <FaTrash /> Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Add Guest Modal */}
                <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Guest" size="large">
                    <form onSubmit={handleSubmitAdd}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>First Name *</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Last Name *</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Phone *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ID Type *</label>
                                <select
                                    name="id_type"
                                    value={formData.id_type}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                >
                                    <option value="Passport">Passport</option>
                                    <option value="NIC">NIC</option>
                                    <option value="Driving License">Driving License</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ID Number *</label>
                                <input
                                    type="text"
                                    name="id_number"
                                    value={formData.id_number}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Country *</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Date of Birth</label>
                                <input
                                    type="date"
                                    name="date_of_birth"
                                    value={formData.date_of_birth}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Address</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    rows="3"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Create Guest
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Edit Guest Modal */}
                <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Guest" size="large">
                    <form onSubmit={handleSubmitEdit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>First Name *</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Last Name *</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Phone *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Country *</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Date of Birth</label>
                                <input
                                    type="date"
                                    name="date_of_birth"
                                    value={formData.date_of_birth}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Address</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    rows="3"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Update Guest
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* View Guest Modal */}
                {showViewModal && selectedGuest && (
                    <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={`${selectedGuest.first_name} ${selectedGuest.last_name}`}>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <strong>Email:</strong> {selectedGuest.email}
                            </div>
                            <div>
                                <strong>Phone:</strong> {selectedGuest.phone}
                            </div>
                            <div>
                                <strong>ID Type:</strong> {selectedGuest.id_type}
                            </div>
                            <div>
                                <strong>ID Number:</strong> {selectedGuest.id_number}
                            </div>
                            <div>
                                <strong>Country:</strong> {selectedGuest.country}
                            </div>
                            <div>
                                <strong>Date of Birth:</strong> {selectedGuest.date_of_birth ? new Date(selectedGuest.date_of_birth).toLocaleDateString() : 'N/A'}
                            </div>
                            <div>
                                <strong>Address:</strong> {selectedGuest.address || 'N/A'}
                            </div>
                            <div>
                                <strong>Total Bookings:</strong> {selectedGuest.total_bookings || 0}
                            </div>
                            <div>
                                <strong>Completed Bookings:</strong> {selectedGuest.completed_bookings || 0}
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        </Layout>
    );
};

export default Guests;
