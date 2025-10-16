import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Table from '../components/Table';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { userAPI, branchAPI, authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaKey } from 'react-icons/fa';
import dashboardImage from '../assets/dashboard.jpeg';
import '../styles/Users.css';
import '../styles/CommonPage.css';

const Users = () => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        full_name: '',
        role: 'Receptionist',
        branch_id: '',
        phone: ''
    });

    const [resetData, setResetData] = useState({
        new_password: '',
        confirm_password: ''
    });

    useEffect(() => {
        fetchUsers();
        fetchBranches();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await userAPI.getAll();
            setUsers(response.data.data);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const response = await branchAPI.getAll();
            setBranches(response.data.data);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            await authAPI.register(formData);
            toast.success('User created successfully');
            setShowCreateModal(false);
            setFormData({
                username: '',
                password: '',
                email: '',
                full_name: '',
                role: 'Receptionist',
                branch_id: '',
                phone: ''
            });
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create user');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (resetData.new_password !== resetData.confirm_password) {
            toast.error('Passwords do not match');
            return;
        }

        if (resetData.new_password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            await userAPI.resetPassword(selectedUser.user_id, {
                new_password: resetData.new_password
            });
            toast.success('Password reset successfully');
            setShowResetModal(false);
            setSelectedUser(null);
            setResetData({ new_password: '', confirm_password: '' });
        } catch (error) {
            toast.error('Failed to reset password');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await userAPI.delete(userId);
            toast.success('User deleted successfully');
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const columns = [
        { header: 'Username', accessor: 'username' },
        { header: 'Full Name', accessor: 'full_name' },
        { header: 'Email', accessor: 'email' },
        { header: 'Role', accessor: 'role' },
        {
            header: 'Branch',
            accessor: 'branch',
            render: (value) => value ? value.branch_name : 'All Branches'
        },
        {
            header: 'Status',
            accessor: 'is_active',
            render: (value) => (
                <span className={`status-badge ${value ? 'status-available' : 'status-maintenance'}`}>
                    {value ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            header: 'Actions',
            accessor: 'user_id',
            render: (value, row) => (
                <div className="action-buttons">
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(row);
                            setShowResetModal(true);
                        }}
                        title="Reset Password"
                    >
                        <FaKey />
                    </button>
                    <button
                        className="btn btn-sm btn-danger"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(value);
                        }}
                        disabled={value === currentUser?.user_id}
                        title="Delete User"
                    >
                        <FaTrash />
                    </button>
                </div>
            )
        }
    ];

    if (loading) {
        return (
            <Layout>
                <LoadingSpinner message="Loading users..." />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="users-page common-page" style={{ backgroundImage: `url(${dashboardImage})` }}>
                <div className="page-header">
                    <h1>User Management</h1>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <FaPlus /> Create User
                    </button>
                </div>

                <Card title={`All Users (${users.length})`}>
                    <Table columns={columns} data={users} />
                </Card>

                {/* Create User Modal */}
                <Modal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Create New User"
                    size="large"
                >
                    <form onSubmit={handleCreateUser}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Username *</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                    minLength="3"
                                />
                            </div>
                            <div className="form-group">
                                <label>Password *</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    minLength="6"
                                    placeholder="Min 6 characters"
                                />
                            </div>
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+94XXXXXXXXX"
                                />
                            </div>
                            <div className="form-group">
                                <label>Role *</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    required
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Receptionist">Receptionist</option>
                                    <option value="Guest">Guest</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Branch {formData.role === 'Receptionist' && '*'}</label>
                                <select
                                    value={formData.branch_id}
                                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                                    required={formData.role === 'Receptionist'}
                                >
                                    <option value="">Select Branch</option>
                                    {branches.map((branch) => (
                                        <option key={branch.branch_id} value={branch.branch_id}>
                                            {branch.branch_name}
                                        </option>
                                    ))}
                                </select>
                                <small>Required for Receptionists</small>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowCreateModal(false)}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Create User
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Reset Password Modal */}
                <Modal
                    isOpen={showResetModal}
                    onClose={() => {
                        setShowResetModal(false);
                        setSelectedUser(null);
                        setResetData({ new_password: '', confirm_password: '' });
                    }}
                    title={`Reset Password - ${selectedUser?.username}`}
                >
                    <form onSubmit={handleResetPassword}>
                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                value={resetData.new_password}
                                onChange={(e) => setResetData({ ...resetData, new_password: e.target.value })}
                                required
                                minLength="6"
                                placeholder="Min 6 characters"
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                value={resetData.confirm_password}
                                onChange={(e) => setResetData({ ...resetData, confirm_password: e.target.value })}
                                required
                                minLength="6"
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setShowResetModal(false);
                                    setSelectedUser(null);
                                    setResetData({ new_password: '', confirm_password: '' });
                                }}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Reset Password
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
};

export default Users;
