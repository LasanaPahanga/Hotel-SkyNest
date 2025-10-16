import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Table from '../components/Table';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { serviceAPI } from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import dashboardImage from '../assets/dashboard.jpeg';
import '../styles/CommonPage.css';
import { useAuth } from '../context/AuthContext';
import { branchAPI } from '../utils/api';

const ServicesNew = () => {
    const { user } = useAuth(); // Get user from AuthContext
    const [services, setServices] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [currentService, setCurrentService] = useState(null);
    const [formData, setFormData] = useState({
        service_name: '',
        service_category: 'Room Service',
        description: '',
        unit_price: '',
        unit_type: 'item'
    });

    // Get user info from AuthContext
    const isAdmin = user?.role === 'Admin';
    const isReceptionist = user?.role === 'Receptionist';
    // Handle both formats: user.branch.branch_id (from API) or user.branch_id (from token)
    const userBranchId = user?.branch?.branch_id || user?.branch_id;

    console.log('Services Page - User Info:', { 
        role: user?.role, 
        isAdmin, 
        isReceptionist, 
        userBranchId,
        fullUser: user 
    });

    const categories = [
        'Room Service', 'Spa', 'Laundry', 'Minibar', 
        'Restaurant', 'Transportation', 'Other'
    ];

    // Initialize on mount - wait for user to be loaded
    useEffect(() => {
        if (user) {
            console.log('ServicesNew - User loaded, initializing...');
            initializePage();
        } else {
            console.log('ServicesNew - Waiting for user...');
        }
    }, [user]); // Re-run when user changes

    const initializePage = async () => {
        setLoading(true);
        try {
            console.log('Initializing page for role:', user.role);
            
            // For admin, fetch branches
            if (isAdmin) {
                console.log('Admin detected - Fetching branches...');
                const branchRes = await branchAPI.getAll();
                console.log('Branches fetched:', branchRes.data.data);
                setBranches(branchRes.data.data);
                
                if (branchRes.data.data.length > 0) {
                    const firstBranch = branchRes.data.data[0].branch_id;
                    console.log('Setting initial branch to:', firstBranch);
                    setSelectedBranch(firstBranch);
                    await loadServices(firstBranch);
                } else {
                    console.warn('No branches found in database');
                    setLoading(false);
                }
            } else if (isReceptionist) {
                // For receptionist, use their branch
                console.log('Receptionist detected - Branch ID:', userBranchId);
                
                if (userBranchId) {
                    setSelectedBranch(userBranchId);
                    await loadServices(userBranchId);
                } else {
                    console.error('Receptionist has no branch_id!', user);
                    alert('Error: No branch assigned to your account. Please contact administrator.');
                    setLoading(false);
                }
            } else {
                console.error('Unknown role or no permissions:', user.role);
                alert('You do not have permission to access this page');
                setLoading(false);
            }
        } catch (error) {
            console.error('Error initializing page:', error);
            alert('Failed to load page: ' + (error.response?.data?.message || error.message));
            setLoading(false);
        }
    };

    const loadServices = async (branchId) => {
        if (!branchId) {
            console.log('No branch ID provided');
            setLoading(false);
            return;
        }

        console.log('Loading services for branch:', branchId);
        try {
            const params = { branch_id: branchId };
            const response = await serviceAPI.getAll(params);
            console.log('Services loaded:', response.data.data);
            setServices(response.data.data || []);
            setLoading(false); 
        } catch (error) {
            console.error('Error loading services:', error);
            alert('Failed to load services: ' + (error.response?.data?.message || error.message));
            setLoading(false); 
        }
    };

    const handleBranchChange = async (branchId) => {
        console.log('Branch changed to:', branchId);
        setSelectedBranch(parseInt(branchId));
        setLoading(true);
        await loadServices(parseInt(branchId));
        // loadServices already sets loading to false
    };

    const handleCreateService = () => {
        setModalMode('create');
        setCurrentService(null);
        setFormData({
            service_name: '',
            service_category: 'Room Service',
            description: '',
            unit_price: '',
            unit_type: 'item'
        });
        setShowModal(true);
    };

    const handleEditService = (service) => {
        setModalMode('edit');
        setCurrentService(service);
        setFormData({
            service_name: service.service_name,
            service_category: service.service_category,
            description: service.description || '',
            unit_price: service.unit_price,
            unit_type: service.unit_type
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                await serviceAPI.create(formData);
            } else {
                await serviceAPI.update(currentService.service_id, formData);
            }
            setShowModal(false);
            await loadServices(selectedBranch);
        } catch (error) {
            console.error('Error saving service:', error);
            alert(error.response?.data?.message || 'Failed to save service');
        }
    };

    const handleToggleAvailability = async (service) => {
        if (!selectedBranch) {
            alert('Please select a branch first');
            return;
        }
        
        try {
            // Handle null, 0, 1, true, false
            const currentStatus = service.is_available === 1 || service.is_available === true;
            const newStatus = !currentStatus;
            
            console.log('Toggle:', { service_id: service.service_id, currentStatus, newStatus });
            
            await serviceAPI.toggleBranchService(selectedBranch, service.service_id, {
                is_available: newStatus
            });
            await loadServices(selectedBranch);
        } catch (error) {
            console.error('Error toggling service:', error);
            alert(error.response?.data?.message || 'Failed to toggle service');
        }
    };

    const handleSetCustomPrice = async (service) => {
        if (!selectedBranch) {
            alert('Please select a branch first');
            return;
        }
        
        const customPrice = prompt(
            `Set custom price for "${service.service_name}":\n(Default: ${formatCurrency(service.unit_price)})`,
            service.custom_price || service.unit_price
        );
        
        if (customPrice === null) return;
        
        const price = parseFloat(customPrice);
        if (isNaN(price) || price < 0) {
            alert('Please enter a valid price');
            return;
        }
        
        try {
            await serviceAPI.setBranchServicePrice(selectedBranch, service.service_id, {
                custom_price: price
            });
            await loadServices(selectedBranch);
        } catch (error) {
            console.error('Error setting price:', error);
            alert(error.response?.data?.message || 'Failed to set price');
        }
    };

    const handleDeleteService = async (serviceId) => {
        if (!confirm('Delete this service? This cannot be undone.')) return;
        
        try {
            await serviceAPI.delete(serviceId);
            await loadServices(selectedBranch);
        } catch (error) {
            console.error('Error deleting service:', error);
            alert(error.response?.data?.message || 'Failed to delete service');
        }
    };

    if (loading) {
        return (
            <Layout>
                <LoadingSpinner message="Loading services..." />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="services-page common-page" style={{ backgroundImage: `url(${dashboardImage})` }}>
                <div className="page-header">
                    <h1>Services Management</h1>
                    {isAdmin && (
                        <button className="btn btn-primary" onClick={handleCreateService}>
                            + Add Service
                        </button>
                    )}
                </div>

                <Card>
                    {/* Branch Selector */}
                    {isAdmin && branches.length > 0 && (
                        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <label style={{ fontWeight: 600 }}>Branch:</label>
                            <select
                                value={selectedBranch || ''}
                                onChange={(e) => handleBranchChange(e.target.value)}
                                style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', minWidth: '200px' }}
                            >
                                {branches.map((branch) => (
                                    <option key={branch.branch_id} value={branch.branch_id}>
                                        {branch.branch_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {isReceptionist && (
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0f9ff', borderRadius: '0.5rem' }}>
                            <strong>Branch:</strong> {user.branch?.branch_name || 'Your Branch'}
                        </div>
                    )}

                    {/* Services Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Service</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Category</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Description</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Price</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Available</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                            No services available
                                        </td>
                                    </tr>
                                ) : (
                                    services.map((service) => (
                                        <tr key={service.service_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                            <td style={{ padding: '0.75rem' }}>
                                                <strong>{service.service_name}</strong>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{ 
                                                    padding: '0.25rem 0.5rem', 
                                                    backgroundColor: '#e0e7ff', 
                                                    color: '#4338ca',
                                                    borderRadius: '0.25rem',
                                                    fontSize: '0.875rem'
                                                }}>
                                                    {service.service_category}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem', maxWidth: '200px' }}>
                                                {service.description || '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                <div>
                                                    {service.custom_price ? (
                                                        <>
                                                            <div style={{ fontWeight: 600 }}>
                                                                {formatCurrency(service.custom_price)}
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', textDecoration: 'line-through' }}>
                                                                Base: {formatCurrency(service.unit_price)}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div style={{ fontWeight: 600 }}>
                                                            {formatCurrency(service.unit_price)}
                                                        </div>
                                                    )}
                                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                        per {service.unit_type}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={service.is_available === 1 || service.is_available === true}
                                                        onChange={() => handleToggleAvailability(service)}
                                                        style={{ marginRight: '0.5rem' }}
                                                    />
                                                    <span style={{ 
                                                        color: (service.is_available === 1 || service.is_available === true) ? '#059669' : '#dc2626',
                                                        fontWeight: 500,
                                                        fontSize: '0.875rem'
                                                    }}>
                                                        {(service.is_available === 1 || service.is_available === true) ? 'Yes' : 'No'}
                                                    </span>
                                                </label>
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => handleSetCustomPrice(service)}
                                                        style={{
                                                            padding: '0.25rem 0.75rem',
                                                            fontSize: '0.875rem',
                                                            backgroundColor: '#f59e0b',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '0.25rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Price
                                                    </button>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleDeleteService(service.service_id)}
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
                                                            Delete
                                                        </button>
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

                {/* Modal for Create/Edit */}
                {showModal && (
                    <Modal 
                        onClose={() => setShowModal(false)} 
                        title={modalMode === 'create' ? 'Add New Service' : 'Edit Service'}
                    >
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                    Service Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.service_name}
                                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                    Category *
                                </label>
                                <select
                                    value={formData.service_category}
                                    onChange={(e) => setFormData({ ...formData, service_category: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                >
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows="3"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                        Price (LKR) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.unit_price}
                                        onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                        Unit Type
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.unit_type}
                                        onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                                        placeholder="e.g., item, hour"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {modalMode === 'create' ? 'Create' : 'Update'}
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}
            </div>
        </Layout>
    );
};

export default ServicesNew;
