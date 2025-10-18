import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import { FaEdit, FaTrash, FaPlus, FaMoneyBillWave, FaClock, FaExclamationTriangle, FaChartLine } from 'react-icons/fa';
import { toast } from 'react-toastify';
import dashboardImage from '../assets/dashboard.jpeg';
import '../styles/Dashboard.css';

const FeeManagement = () => {
    const { user } = useAuth();
    const [fees, setFees] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [feeStats, setFeeStats] = useState({ totalAmount: 0, count: 0 });

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        if (selectedBranch) {
            fetchFees();
        }
    }, [selectedBranch]);

    const fetchBranches = async () => {
        try {
            const response = await api.get('/branches');
            const branchData = response.data.data || [];
            setBranches(branchData);
            
            if (branchData.length > 0) {
                if (user.role === 'Receptionist') {
                    const userBranchId = user.branch_id;
                    if (userBranchId) {
                        setSelectedBranch(userBranchId);
                    } else {
                        setSelectedBranch(branchData[0].branch_id);
                    }
                } else {
                    setSelectedBranch(branchData[0].branch_id);
                }
            }
        } catch (error) {
            console.error('Fetch branches error:', error);
            toast.error('Failed to load branches');
            setLoading(false);
        }
    };

    const fetchFees = async () => {
        if (!selectedBranch) return;
        
        setLoading(true);
        try {
            const response = await api.get(`/fees/${selectedBranch}`);
            const feeData = response.data.data || [];
            setFees(feeData);
            
            // Calculate stats for active fees
            const activeFees = feeData.filter(f => f.is_active);
            const totalAmount = activeFees.reduce((sum, f) => {
                if (f.fee_calculation === 'Fixed Amount') {
                    return sum + parseFloat(f.fee_value);
                }
                return sum;
            }, 0);
            setFeeStats({ totalAmount, count: activeFees.length });
        } catch (error) {
            console.error('Fetch fees error:', error);
            toast.error('Failed to load fees');
            setFees([]);
            setFeeStats({ totalAmount: 0, count: 0 });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (fee) => {
        try {
            await api.put(`/fees/${fee.fee_config_id}`, { is_active: !fee.is_active });
            toast.success('Fee status updated');
            fetchFees();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDeleteFee = async (id) => {
        if (!window.confirm('Are you sure you want to delete this fee?')) return;
        try {
            await api.delete(`/fees/${id}`);
            toast.success('Fee deleted successfully');
            fetchFees();
        } catch (error) {
            toast.error('Failed to delete fee');
        }
    };

    if (loading && !selectedBranch) {
        return (
            <Layout>
                <LoadingSpinner />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="dashboard" style={{ backgroundImage: `url(${dashboardImage})` }}>
                <div className="dashboard-header">
                    <h1>Fee Management</h1>
                    <p className="dashboard-subtitle">Key Metrics</p>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <StatCard
                        title="Active Fees"
                        value={feeStats.count}
                        icon={FaMoneyBillWave}
                        color="orange"
                        subtitle={`Total Fixed: ${formatCurrency(feeStats.totalAmount)}`}
                    />
                    <StatCard
                        title="Late Checkout"
                        value="Per Hour"
                        icon={FaClock}
                        color="blue"
                        subtitle="Grace period: 60 minutes"
                    />
                    <StatCard
                        title="No Show Fee"
                        value="50%"
                        icon={FaExclamationTriangle}
                        color="purple"
                        subtitle="Of total booking amount"
                    />
                    <StatCard
                        title="Fee Impact"
                        value="Active"
                        icon={FaChartLine}
                        color="green"
                        subtitle="Applied when conditions met"
                    />
                </div>

                <Card>
                    {user.role === 'Admin' && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                Select Branch:
                            </label>
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #ddd',
                                    width: '300px'
                                }}
                            >
                                {branches.map(branch => (
                                    <option key={branch.branch_id} value={branch.branch_id}>
                                        {branch.branch_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {loading ? (
                        <LoadingSpinner />
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Fee Type</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Calculation</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Value</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Grace Period</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Max Amount</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Description</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fees.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                                No fees configured
                                            </td>
                                        </tr>
                                    ) : (
                                        fees.map(fee => (
                                            <tr key={fee.fee_config_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                                                    <FaMoneyBillWave style={{ marginRight: '0.5rem', color: '#6896a7' }} />
                                                    {fee.fee_type}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.5rem',
                                                        backgroundColor: '#e0e7ff',
                                                        color: '#4338ca',
                                                        borderRadius: '0.25rem',
                                                        fontSize: '0.875rem'
                                                    }}>
                                                        {fee.fee_calculation}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                                                    {fee.fee_calculation === 'Percentage' 
                                                        ? `${fee.fee_value}%` 
                                                        : fee.fee_calculation === 'Per Hour'
                                                        ? `${formatCurrency(fee.fee_value)}/hr`
                                                        : formatCurrency(fee.fee_value)}
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                    {fee.grace_period_minutes} min
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                    {fee.max_fee_amount ? formatCurrency(fee.max_fee_amount) : 'No limit'}
                                                </td>
                                                <td style={{ padding: '0.75rem', maxWidth: '200px' }}>
                                                    {fee.description || '-'}
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleToggleStatus(fee)}
                                                        style={{
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '0.25rem',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            backgroundColor: fee.is_active ? '#d1fae5' : '#fee2e2',
                                                            color: fee.is_active ? '#065f46' : '#991b1b',
                                                            fontWeight: 600,
                                                            fontSize: '0.875rem'
                                                        }}
                                                    >
                                                        {fee.is_active ? 'Active' : 'Inactive'}
                                                    </button>
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                    {user.role === 'Admin' && (
                                                        <button
                                                            onClick={() => handleDeleteFee(fee.fee_config_id)}
                                                            className="btn btn-sm btn-danger"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div style={{ 
                        marginTop: '2rem', 
                        padding: '1rem', 
                        backgroundColor: '#f0f9ff', 
                        borderRadius: '0.5rem',
                        border: '1px solid #bae6fd'
                    }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#0369a1', fontSize: '1rem' }}>
                            Fee Configuration Info
                        </h3>
                        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#0c4a6e', fontSize: '0.875rem' }}>
                            <li><strong>Late Checkout:</strong> Applied when guest checks out after standard time</li>
                            <li><strong>No-Show:</strong> Applied when guest doesn't arrive for confirmed booking</li>
                            <li><strong>Cancellation:</strong> Applied based on cancellation policy</li>
                            <li><strong>Grace Period:</strong> Time buffer before fee is applied</li>
                            <li><strong>Max Amount:</strong> Cap on fee to prevent excessive charges</li>
                        </ul>
                    </div>
                </Card>
            </div>
        </Layout>
    );
};

export default FeeManagement;
