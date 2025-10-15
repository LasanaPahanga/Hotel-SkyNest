import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { paymentAPI } from '../utils/api';
import { formatDateTime, formatCurrency, getStatusClass } from '../utils/helpers';
import { FaFilter, FaTimes, FaSearch, FaMoneyBillWave, FaCheckCircle, FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [filteredPayments, setFilteredPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        payment_method: '',
        payment_status: '',
        start_date: '',
        end_date: ''
    });
    const [stats, setStats] = useState({
        total: 0,
        totalAmount: 0,
        completed: 0,
        pending: 0,
        failed: 0
    });

    useEffect(() => {
        fetchPayments();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, payments]);

    const fetchPayments = async () => {
        try {
            const response = await paymentAPI.getAll();
            setPayments(response.data.data);
            calculateStats(response.data.data);
        } catch (error) {
            console.error('Error fetching payments:', error);
            toast.error('Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (paymentsData) => {
        setStats({
            total: paymentsData.length,
            totalAmount: paymentsData.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
            completed: paymentsData.filter(p => p.payment_status === 'Completed').length,
            pending: paymentsData.filter(p => p.payment_status === 'Pending').length,
            failed: paymentsData.filter(p => p.payment_status === 'Failed').length
        });
    };

    const applyFilters = () => {
        let filtered = [...payments];

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(p =>
                p.guest_name?.toLowerCase().includes(searchLower) ||
                p.booking_id?.toString().includes(searchLower) ||
                p.payment_id?.toString().includes(searchLower)
            );
        }

        if (filters.payment_method) {
            filtered = filtered.filter(p => p.payment_method === filters.payment_method);
        }

        if (filters.payment_status) {
            filtered = filtered.filter(p => p.payment_status === filters.payment_status);
        }

        if (filters.start_date) {
            filtered = filtered.filter(p => new Date(p.payment_date) >= new Date(filters.start_date));
        }

        if (filters.end_date) {
            filtered = filtered.filter(p => new Date(p.payment_date) <= new Date(filters.end_date));
        }

        setFilteredPayments(filtered);
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            payment_method: '',
            payment_status: '',
            start_date: '',
            end_date: ''
        });
    };

    if (loading) {
        return (
            <Layout>
                <LoadingSpinner message="Loading payments..." />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="payments-page">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1>Payments Management</h1>
                        <p>Track and manage payment transactions</p>
                    </div>
                    <button 
                        className="btn btn-secondary"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FaFilter /> {showFilters ? 'Hide' : 'Show'} Filters
                    </button>
                </div>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <Card style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <FaMoneyBillWave style={{ fontSize: '2.5rem', opacity: 0.9 }} />
                            <div>
                                <h3 style={{ fontSize: '2rem', margin: 0 }}>{stats.total}</h3>
                                <p style={{ margin: 0, opacity: 0.9 }}>Total Payments</p>
                            </div>
                        </div>
                    </Card>
                    <Card style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <FaMoneyBillWave style={{ fontSize: '2.5rem', opacity: 0.9 }} />
                            <div>
                                <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{formatCurrency(stats.totalAmount)}</h3>
                                <p style={{ margin: 0, opacity: 0.9 }}>Total Amount</p>
                            </div>
                        </div>
                    </Card>
                    <Card style={{ background: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <FaCheckCircle style={{ fontSize: '2.5rem', opacity: 0.9 }} />
                            <div>
                                <h3 style={{ fontSize: '2rem', margin: 0 }}>{stats.completed}</h3>
                                <p style={{ margin: 0, opacity: 0.9 }}>Completed</p>
                            </div>
                        </div>
                    </Card>
                    <Card style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <FaClock style={{ fontSize: '2.5rem', opacity: 0.9 }} />
                            <div>
                                <h3 style={{ fontSize: '2rem', margin: 0 }}>{stats.pending}</h3>
                                <p style={{ margin: 0, opacity: 0.9 }}>Pending</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                {showFilters && (
                    <Card style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Search</label>
                                <input
                                    type="text"
                                    placeholder="Guest, Booking ID..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Payment Method</label>
                                <select
                                    value={filters.payment_method}
                                    onChange={(e) => setFilters({ ...filters, payment_method: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                >
                                    <option value="">All Methods</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Credit Card">Credit Card</option>
                                    <option value="Debit Card">Debit Card</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Status</label>
                                <select
                                    value={filters.payment_status}
                                    onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                >
                                    <option value="">All Status</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Failed">Failed</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Start Date</label>
                                <input
                                    type="date"
                                    value={filters.start_date}
                                    onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>End Date</label>
                                <input
                                    type="date"
                                    value={filters.end_date}
                                    onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                        </div>
                        <button 
                            className="btn btn-secondary"
                            onClick={clearFilters}
                            style={{ marginTop: '0.5rem' }}
                        >
                            <FaTimes /> Clear Filters
                        </button>
                    </Card>
                )}

                {/* Payments Table */}
                <Card title={`Payments (${filteredPayments.length})`}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Payment ID</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Booking ID</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Guest</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Method</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayments.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                            No payments found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPayments.map((payment) => (
                                        <tr key={payment.payment_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                            <td style={{ padding: '0.75rem' }}>
                                                <strong>#{payment.payment_id}</strong>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>#{payment.booking_id}</td>
                                            <td style={{ padding: '0.75rem' }}>{payment.guest_name}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                                                {formatCurrency(payment.amount)}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>{payment.payment_method}</td>
                                            <td style={{ padding: '0.75rem' }}>{formatDateTime(payment.payment_date)}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                <span className={`status-badge ${getStatusClass(payment.payment_status)}`}>
                                                    {payment.payment_status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </Layout>
    );
};

export default Payments;
