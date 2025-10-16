import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import { FaEdit, FaTrash, FaPlus, FaPercent, FaTag, FaChartLine } from 'react-icons/fa';
import { toast } from 'react-toastify';
import dashboardImage from '../assets/dashboard.jpeg';
import '../styles/CommonPage.css';

const TaxDiscountManagement = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('taxes');
    const [taxes, setTaxes] = useState([]);
    const [discounts, setDiscounts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [showTaxModal, setShowTaxModal] = useState(false);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [editingTax, setEditingTax] = useState(null);
    const [editingDiscount, setEditingDiscount] = useState(null);
    const [taxStats, setTaxStats] = useState({ total: 0, count: 0 });
    const [discountStats, setDiscountStats] = useState({ total: 0, count: 0 });

    const [taxForm, setTaxForm] = useState({
        tax_name: '',
        tax_type: 'VAT',
        tax_rate: '',
        effective_from: new Date().toISOString().split('T')[0],
        is_active: true
    });

    const [discountForm, setDiscountForm] = useState({
        discount_name: '',
        discount_type: 'Percentage',
        discount_value: '',
        promo_code: '',
        min_booking_amount: '0',
        max_discount_amount: '',
        usage_limit: '',
        valid_from: '',
        valid_until: '',
        is_active: true
    });

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        if (selectedBranch) {
            if (activeTab === 'taxes') {
                fetchTaxes();
            } else {
                fetchDiscounts();
            }
        }
    }, [selectedBranch, activeTab]);

    const fetchBranches = async () => {
        try {
            const response = await api.get('/branches');
            const branchData = response.data.data || [];
            setBranches(branchData);
            
            if (branchData.length > 0) {
                if (user.role === 'Receptionist') {
                    const userBranchId = user.branch_id;
                    setSelectedBranch(userBranchId || branchData[0].branch_id);
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

    const fetchTaxes = async () => {
        if (!selectedBranch) return;
        setLoading(true);
        try {
            const response = await api.get(`/tax-discount/taxes/${selectedBranch}`);
            const taxData = response.data.data || [];
            setTaxes(taxData);
            const activeTaxes = taxData.filter(t => t.is_active);
            const totalRate = activeTaxes.reduce((sum, t) => sum + parseFloat(t.tax_rate), 0);
            setTaxStats({ total: totalRate, count: activeTaxes.length });
        } catch (error) {
            console.error('Fetch taxes error:', error);
            toast.error('Failed to load taxes');
            setTaxes([]);
            setTaxStats({ total: 0, count: 0 });
        } finally {
            setLoading(false);
        }
    };

    const fetchDiscounts = async () => {
        if (!selectedBranch) return;
        setLoading(true);
        try {
            const response = await api.get(`/tax-discount/discounts/${selectedBranch}`);
            const discountData = response.data.data || [];
            setDiscounts(discountData);
            const activeDiscounts = discountData.filter(d => d.is_active);
            const totalUsage = activeDiscounts.reduce((sum, d) => sum + (d.usage_count || 0), 0);
            setDiscountStats({ total: totalUsage, count: activeDiscounts.length });
        } catch (error) {
            console.error('Fetch discounts error:', error);
            toast.error('Failed to load discounts');
            setDiscounts([]);
            setDiscountStats({ total: 0, count: 0 });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (item, type) => {
        try {
            const endpoint = type === 'tax' ? `/tax-discount/taxes/${item.tax_config_id}` : `/tax-discount/discounts/${item.discount_config_id}`;
            await api.put(endpoint, { is_active: !item.is_active });
            toast.success(`${type === 'tax' ? 'Tax' : 'Discount'} status updated`);
            type === 'tax' ? fetchTaxes() : fetchDiscounts();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDeleteTax = async (id) => {
        if (!window.confirm('Delete this tax? It will affect future bookings.')) return;
        try {
            await api.delete(`/tax-discount/taxes/${id}`);
            toast.success('Tax deleted');
            fetchTaxes();
        } catch (error) {
            toast.error('Failed to delete tax');
        }
    };

    const handleDeleteDiscount = async (id) => {
        if (!window.confirm('Delete this discount?')) return;
        try {
            await api.delete(`/tax-discount/discounts/${id}`);
            toast.success('Discount deleted');
            fetchDiscounts();
        } catch (error) {
            toast.error('Failed to delete discount');
        }
    };

    const handleAddTax = () => {
        setEditingTax(null);
        setTaxForm({ tax_name: '', tax_type: 'VAT', tax_rate: '', effective_from: new Date().toISOString().split('T')[0], is_active: true });
        setShowTaxModal(true);
    };

    const handleEditTax = (tax) => {
        setEditingTax(tax);
        setTaxForm({ tax_name: tax.tax_name, tax_type: tax.tax_type, tax_rate: tax.tax_rate, effective_from: tax.effective_from ? tax.effective_from.split('T')[0] : new Date().toISOString().split('T')[0], is_active: tax.is_active });
        setShowTaxModal(true);
    };

    const handleSaveTax = async (e) => {
        e.preventDefault();
        try {
            const data = { ...taxForm, branch_id: selectedBranch, tax_rate: parseFloat(taxForm.tax_rate), is_percentage: true };
            if (editingTax) {
                await api.put(`/tax-discount/taxes/${editingTax.tax_config_id}`, data);
                toast.success('Tax updated');
            } else {
                await api.post('/tax-discount/taxes', data);
                toast.success('Tax created');
            }
            setShowTaxModal(false);
            fetchTaxes();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save tax');
        }
    };

    const handleAddDiscount = () => {
        setEditingDiscount(null);
        setDiscountForm({ discount_name: '', discount_type: 'Percentage', discount_value: '', promo_code: '', min_booking_amount: '0', max_discount_amount: '', usage_limit: '', valid_from: '', valid_until: '', is_active: true });
        setShowDiscountModal(true);
    };

    const handleEditDiscount = (discount) => {
        setEditingDiscount(discount);
        setDiscountForm({ discount_name: discount.discount_name, discount_type: discount.discount_type, discount_value: discount.discount_value, promo_code: discount.promo_code || '', min_booking_amount: discount.min_booking_amount || '0', max_discount_amount: discount.max_discount_amount || '', usage_limit: discount.usage_limit || '', valid_from: discount.valid_from ? discount.valid_from.split('T')[0] : '', valid_until: discount.valid_until ? discount.valid_until.split('T')[0] : '', is_active: discount.is_active });
        setShowDiscountModal(true);
    };

    const handleSaveDiscount = async (e) => {
        e.preventDefault();
        try {
            const data = { ...discountForm, branch_id: selectedBranch, discount_value: parseFloat(discountForm.discount_value), min_booking_amount: discountForm.min_booking_amount ? parseFloat(discountForm.min_booking_amount) : 0, max_discount_amount: discountForm.max_discount_amount ? parseFloat(discountForm.max_discount_amount) : null, usage_limit: discountForm.usage_limit ? parseInt(discountForm.usage_limit) : null };
            if (editingDiscount) {
                await api.put(`/tax-discount/discounts/${editingDiscount.discount_config_id}`, data);
                toast.success('Discount updated');
            } else {
                await api.post('/tax-discount/discounts', data);
                toast.success('Discount created');
            }
            setShowDiscountModal(false);
            fetchDiscounts();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save discount');
        }
    };
        if (loading && !selectedBranch) {
        return <Layout><LoadingSpinner /></Layout>;
    }

    return (
        <Layout>
            <div className="page-container" style={{ backgroundImage: `url(${dashboardImage})` }}>
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Tax & Discount Management</h1>
                        <p className="page-subtitle">Manage branch-wise taxes and discounts - Affects booking calculations</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <Card>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FaPercent style={{ fontSize: '1.5rem', color: '#3b82f6' }} />
                            </div>
                            <div>
                                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Active Taxes</p>
                                <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '1.75rem', fontWeight: 700 }}>{taxStats.count}</h2>
                                <p style={{ margin: '0.25rem 0 0 0', color: '#3b82f6', fontSize: '0.875rem', fontWeight: 600 }}>Total Rate: {taxStats.total.toFixed(2)}%</p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FaTag style={{ fontSize: '1.5rem', color: '#16a34a' }} />
                            </div>
                            <div>
                                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Active Discounts</p>
                                <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '1.75rem', fontWeight: 700 }}>{discountStats.count}</h2>
                                <p style={{ margin: '0.25rem 0 0 0', color: '#16a34a', fontSize: '0.875rem', fontWeight: 600 }}>Total Usage: {discountStats.total}</p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FaChartLine style={{ fontSize: '1.5rem', color: '#f59e0b' }} />
                            </div>
                            <div>
                                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Impact on Bookings</p>
                                <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>+{taxStats.total.toFixed(1)}% Tax</h2>
                                <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>Applied to all new bookings</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card>
                    {user.role === 'Admin' && branches.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Select Branch:</label>
                            <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #ddd', width: '300px' }}>
                                {branches.map(branch => <option key={branch.branch_id} value={branch.branch_id}>{branch.branch_name}</option>)}
                            </select>
                        </div>
                    )}

                    {user.role === 'Receptionist' && branches.length > 0 && (
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#e0f2fe', borderRadius: '0.5rem' }}>
                            <p style={{ margin: 0, color: '#0369a1' }}><strong>Your Branch:</strong> {branches.find(b => b.branch_id === selectedBranch)?.branch_name || 'Loading...'}</p>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#075985' }}>You can toggle status. Only Admin can add/edit/delete.</p>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb' }}>
                        <button onClick={() => setActiveTab('taxes')} style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'taxes' ? '3px solid #6896a7' : '3px solid transparent', color: activeTab === 'taxes' ? '#6896a7' : '#6b7280', fontWeight: 600, cursor: 'pointer' }}>
                            <FaPercent style={{ marginRight: '0.5rem' }} />Taxes (Increases Price)
                        </button>
                        <button onClick={() => setActiveTab('discounts')} style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'discounts' ? '3px solid #6896a7' : '3px solid transparent', color: activeTab === 'discounts' ? '#6896a7' : '#6b7280', fontWeight: 600, cursor: 'pointer' }}>
                            <FaTag style={{ marginRight: '0.5rem' }} />Discounts (Reduces Price)
                        </button>
                    </div>

                    {activeTab === 'taxes' && (
                        <>
                            {user.role === 'Admin' && <div style={{ marginBottom: '1rem' }}><button onClick={handleAddTax} className="btn btn-primary"><FaPlus /> Add Tax</button></div>}
                            {loading ? <LoadingSpinner /> : (
                                <>
                                    <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem', border: '2px solid #fbbf24' }}>
                                        <p style={{ margin: 0, color: '#92400e', fontWeight: 600 }}>💡 Tax Impact: Active taxes will <strong>INCREASE</strong> booking price. Total: <strong>{taxStats.total.toFixed(2)}%</strong></p>
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Tax Name</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Type</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Rate (%)</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Effective From</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {taxes.length === 0 ? (
                                                    <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No taxes configured</td></tr>
                                                ) : (
                                                    taxes.map(tax => (
                                                        <tr key={tax.tax_config_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                            <td style={{ padding: '0.75rem' }}>{tax.tax_name}</td>
                                                            <td style={{ padding: '0.75rem' }}>{tax.tax_type}</td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>+{tax.tax_rate}%</td>
                                                            <td style={{ padding: '0.75rem' }}>{tax.effective_from ? new Date(tax.effective_from).toLocaleDateString() : '-'}</td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                                <button onClick={() => handleToggleStatus(tax, 'tax')} style={{ padding: '0.25rem 0.75rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer', backgroundColor: tax.is_active ? '#d1fae5' : '#fee2e2', color: tax.is_active ? '#065f46' : '#991b1b', fontWeight: 600, fontSize: '0.875rem' }}>
                                                                    {tax.is_active ? 'Active' : 'Inactive'}
                                                                </button>
                                                            </td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                                    {user.role === 'Admin' && (
                                                                        <>
                                                                            <button onClick={() => handleEditTax(tax)} className="btn btn-sm btn-secondary"><FaEdit /></button>
                                                                            <button onClick={() => handleDeleteTax(tax.tax_config_id)} className="btn btn-sm btn-danger"><FaTrash /></button>
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
                                </>
                            )}
                        </>
                    )}

                    {activeTab === 'discounts' && (
                        <>
                            {user.role === 'Admin' && <div style={{ marginBottom: '1rem' }}><button onClick={handleAddDiscount} className="btn btn-primary"><FaPlus /> Add Discount</button></div>}
                            {loading ? <LoadingSpinner /> : (
                                <>
                                    <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#dcfce7', borderRadius: '0.5rem', border: '2px solid #22c55e' }}>
                                        <p style={{ margin: 0, color: '#14532d', fontWeight: 600 }}>💡 Discount Impact: Active discounts will <strong>REDUCE</strong> booking price when promo codes applied.</p>
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Discount Name</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Promo Code</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Type</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Value</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Min Amount</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Usage</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {discounts.length === 0 ? (
                                                    <tr><td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No discounts configured</td></tr>
                                                ) : (
                                                    discounts.map(discount => (
                                                        <tr key={discount.discount_config_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                            <td style={{ padding: '0.75rem' }}>{discount.discount_name}</td>
                                                            <td style={{ padding: '0.75rem' }}><code style={{ backgroundColor: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: 600 }}>{discount.promo_code || '-'}</code></td>
                                                            <td style={{ padding: '0.75rem' }}>{discount.discount_type}</td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>-{discount.discount_type === 'Percentage' ? `${discount.discount_value}%` : formatCurrency(discount.discount_value)}</td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(discount.min_booking_amount || 0)}</td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>{discount.usage_count || 0}{discount.usage_limit ? ` / ${discount.usage_limit}` : ' / ∞'}</td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                                <button onClick={() => handleToggleStatus(discount, 'discount')} style={{ padding: '0.25rem 0.75rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer', backgroundColor: discount.is_active ? '#d1fae5' : '#fee2e2', color: discount.is_active ? '#065f46' : '#991b1b', fontWeight: 600, fontSize: '0.875rem' }}>
                                                                    {discount.is_active ? 'Active' : 'Inactive'}
                                                                </button>
                                                            </td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                                    {user.role === 'Admin' && (
                                                                        <>
                                                                            <button onClick={() => handleEditDiscount(discount)} className="btn btn-sm btn-secondary"><FaEdit /></button>
                                                                            <button onClick={() => handleDeleteDiscount(discount.discount_config_id)} className="btn btn-sm btn-danger"><FaTrash /></button>
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
                                </>
                            )}
                        </>
                    )}
                </Card>
            </div>

            {/* Tax Modal */}
            <Modal isOpen={showTaxModal} onClose={() => setShowTaxModal(false)} title={editingTax ? 'Edit Tax' : 'Add Tax'}>
                <form onSubmit={handleSaveTax}>
                    <div className="form-group">
                        <label>Tax Name *</label>
                        <input type="text" value={taxForm.tax_name} onChange={(e) => setTaxForm({...taxForm, tax_name: e.target.value})} required />
                    </div>
                    <div className="form-group">
                        <label>Tax Type *</label>
                        <select value={taxForm.tax_type} onChange={(e) => setTaxForm({...taxForm, tax_type: e.target.value})} required>
                            <option value="VAT">VAT</option>
                            <option value="Service Tax">Service Tax</option>
                            <option value="Tourism Tax">Tourism Tax</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Tax Rate (%) *</label>
                        <input type="number" step="0.01" value={taxForm.tax_rate} onChange={(e) => setTaxForm({...taxForm, tax_rate: e.target.value})} required />
                    </div>
                    <div className="form-group">
                        <label>Effective From *</label>
                        <input type="date" value={taxForm.effective_from} onChange={(e) => setTaxForm({...taxForm, effective_from: e.target.value})} required />
                    </div>
                    <div className="form-group">
                        <label><input type="checkbox" checked={taxForm.is_active} onChange={(e) => setTaxForm({...taxForm, is_active: e.target.checked})} /> Active</label>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingTax ? 'Update' : 'Create'}</button>
                        <button type="button" onClick={() => setShowTaxModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                    </div>
                </form>
            </Modal>

            {/* Discount Modal */}
            <Modal isOpen={showDiscountModal} onClose={() => setShowDiscountModal(false)} title={editingDiscount ? 'Edit Discount' : 'Add Discount'}>
                <form onSubmit={handleSaveDiscount}>
                    <div className="form-group">
                        <label>Discount Name *</label>
                        <input type="text" value={discountForm.discount_name} onChange={(e) => setDiscountForm({...discountForm, discount_name: e.target.value})} required />
                    </div>
                    <div className="form-group">
                        <label>Promo Code</label>
                        <input type="text" value={discountForm.promo_code} onChange={(e) => setDiscountForm({...discountForm, promo_code: e.target.value.toUpperCase()})} placeholder="e.g., WELCOME10" />
                    </div>
                    <div className="form-group">
                        <label>Discount Type *</label>
                        <select value={discountForm.discount_type} onChange={(e) => setDiscountForm({...discountForm, discount_type: e.target.value})} required>
                            <option value="Percentage">Percentage</option>
                            <option value="Fixed Amount">Fixed Amount</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Discount Value * {discountForm.discount_type === 'Percentage' ? '(%)' : '(Rs.)'}</label>
                        <input type="number" step="0.01" value={discountForm.discount_value} onChange={(e) => setDiscountForm({...discountForm, discount_value: e.target.value})} required />
                    </div>
                    <div className="form-group">
                        <label>Minimum Booking Amount (Rs.)</label>
                        <input type="number" step="0.01" value={discountForm.min_booking_amount} onChange={(e) => setDiscountForm({...discountForm, min_booking_amount: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label>Maximum Discount Amount (Rs.)</label>
                        <input type="number" step="0.01" value={discountForm.max_discount_amount} onChange={(e) => setDiscountForm({...discountForm, max_discount_amount: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label>Usage Limit</label>
                        <input type="number" value={discountForm.usage_limit} onChange={(e) => setDiscountForm({...discountForm, usage_limit: e.target.value})} placeholder="Leave empty for unlimited" />
                    </div>
                    <div className="form-group">
                        <label>Valid From</label>
                        <input type="date" value={discountForm.valid_from} onChange={(e) => setDiscountForm({...discountForm, valid_from: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label>Valid Until</label>
                        <input type="date" value={discountForm.valid_until} onChange={(e) => setDiscountForm({...discountForm, valid_until: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label><input type="checkbox" checked={discountForm.is_active} onChange={(e) => setDiscountForm({...discountForm, is_active: e.target.checked})} /> Active</label>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingDiscount ? 'Update' : 'Create'}</button>
                        <button type="button" onClick={() => setShowDiscountModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
};

export default TaxDiscountManagement;