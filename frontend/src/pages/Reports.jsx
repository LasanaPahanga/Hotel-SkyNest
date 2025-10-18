import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { reportAPI } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import { FaDownload, FaChartBar, FaCalendar, FaSearch, FaFilter } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import dashboardImage from '../assets/dashboard.jpeg';
import '../styles/Reports.css';
import '../styles/CommonPage.css';

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('occupancy');
    const [occupancyData, setOccupancyData] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [topServices, setTopServices] = useState([]);
    const [unpaidBookings, setUnpaidBookings] = useState([]);
    const [serviceUsageData, setServiceUsageData] = useState([]);
    const [dateRange, setDateRange] = useState({
        start_date: new Date(new Date().setDate(1)).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [roomTypeFilter, setRoomTypeFilter] = useState('all');
    const [serviceSearchTerm, setServiceSearchTerm] = useState('');
    const [serviceCategoryFilter, setServiceCategoryFilter] = useState('all');

    useEffect(() => {
        fetchReports();
    }, [activeTab, dateRange]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            switch (activeTab) {
                case 'occupancy':
                    const occRes = await reportAPI.getOccupancy(dateRange);
                    setOccupancyData(occRes.data.data);
                    break;
                case 'revenue':
                    const revRes = await reportAPI.getRevenue(dateRange);
                    setRevenueData(revRes.data.data);
                    break;
                case 'services':
                    const servRes = await reportAPI.getTopServices(dateRange);
                    setTopServices(servRes.data.data);
                    break;
                case 'unpaid':
                    const unpaidRes = await reportAPI.getUnpaid();
                    setUnpaidBookings(unpaidRes.data.data);
                    break;
                case 'usage':
                    const usageRes = await reportAPI.getServiceUsage();
                    setServiceUsageData(usageRes.data.data);
                    break;
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <Layout>
            <div className="reports-page common-page" style={{ backgroundImage: `url(${dashboardImage})` }}>
                <div className="page-header">
                    <h1>Reports & Analytics</h1>
                </div>

                <Card>
                    <div className="report-tabs">
                        <button
                            className={`tab ${activeTab === 'occupancy' ? 'active' : ''}`}
                            onClick={() => setActiveTab('occupancy')}
                        >
                            Occupancy
                        </button>
                        <button
                            className={`tab ${activeTab === 'revenue' ? 'active' : ''}`}
                            onClick={() => setActiveTab('revenue')}
                        >
                            Revenue
                        </button>
                        <button
                            className={`tab ${activeTab === 'services' ? 'active' : ''}`}
                            onClick={() => setActiveTab('services')}
                        >
                            Top Services
                        </button>
                        <button
                            className={`tab ${activeTab === 'unpaid' ? 'active' : ''}`}
                            onClick={() => setActiveTab('unpaid')}
                        >
                            Unpaid Bookings
                        </button>
                        <button
                            className={`tab ${activeTab === 'usage' ? 'active' : ''}`}
                            onClick={() => setActiveTab('usage')}
                        >
                            Service Usage
                        </button>
                    </div>

                    <div className="date-filters">
                        <input
                            type="date"
                            value={dateRange.start_date}
                            onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                        />
                        <input
                            type="date"
                            value={dateRange.end_date}
                            onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                        />
                    </div>

                    {loading ? (
                        <LoadingSpinner message="Loading report..." />
                    ) : (
                        <div className="report-content">
                            {activeTab === 'occupancy' && (
                                <div>
                                    <div className="report-header">
                                        <h3>Room Occupancy Report</h3>
                                        {occupancyData.length > 0 && (
                                            <div className="occupancy-filters">
                                                <div className="search-box">
                                                    <FaSearch className="search-icon" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search by room number or guest name..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="search-input"
                                                    />
                                                </div>
                                                <div className="filter-group">
                                                    <FaFilter className="filter-icon" />
                                                    <select
                                                        value={statusFilter}
                                                        onChange={(e) => setStatusFilter(e.target.value)}
                                                        className="filter-select"
                                                    >
                                                        <option value="all">All Status</option>
                                                        <option value="Occupied">Occupied</option>
                                                        <option value="Available">Available</option>
                                                    </select>
                                                    <select
                                                        value={roomTypeFilter}
                                                        onChange={(e) => setRoomTypeFilter(e.target.value)}
                                                        className="filter-select"
                                                    >
                                                        <option value="all">All Room Types</option>
                                                        {[...new Set(occupancyData.map(item => item.room_type))].map(type => (
                                                            <option key={type} value={type}>{type}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {occupancyData.length > 0 ? (
                                        <div className="occupancy-table">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Branch</th>
                                                        <th>Room Number</th>
                                                        <th>Room Type</th>
                                                        <th>Date</th>
                                                        <th>Status</th>
                                                        <th>Guest</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {occupancyData
                                                        .filter(item => {
                                                            // Search filter
                                                            const searchLower = searchTerm.toLowerCase();
                                                            const matchesSearch = searchTerm === '' ||
                                                                item.room_number.toString().toLowerCase().includes(searchLower) ||
                                                                (item.guest_name && item.guest_name.toLowerCase().includes(searchLower));
                                                            
                                                            // Status filter
                                                            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
                                                            
                                                            // Room type filter
                                                            const matchesRoomType = roomTypeFilter === 'all' || item.room_type === roomTypeFilter;
                                                            
                                                            return matchesSearch && matchesStatus && matchesRoomType;
                                                        })
                                                        .map((item, index) => (
                                                        <tr key={index}>
                                                            <td>{item.branch_name}</td>
                                                            <td>{item.room_number}</td>
                                                            <td>{item.room_type}</td>
                                                            <td>{formatDate(item.occupancy_date)}</td>
                                                            <td>
                                                                <span className={`status-badge ${item.status === 'Occupied' ? 'status-occupied' : 'status-available'}`}>
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td>{item.guest_name || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {occupancyData.filter(item => {
                                                const searchLower = searchTerm.toLowerCase();
                                                const matchesSearch = searchTerm === '' ||
                                                    item.room_number.toString().toLowerCase().includes(searchLower) ||
                                                    (item.guest_name && item.guest_name.toLowerCase().includes(searchLower));
                                                const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
                                                const matchesRoomType = roomTypeFilter === 'all' || item.room_type === roomTypeFilter;
                                                return matchesSearch && matchesStatus && matchesRoomType;
                                            }).length === 0 && (
                                                <div className="no-results">
                                                    <p>No results found matching your filters.</p>
                                                    <button 
                                                        className="btn-clear-filters"
                                                        onClick={() => {
                                                            setSearchTerm('');
                                                            setStatusFilter('all');
                                                            setRoomTypeFilter('all');
                                                        }}
                                                    >
                                                        Clear Filters
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="no-data">No occupancy data available for the selected date range.</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'revenue' && (
                                <div>
                                    <h3>Revenue by Branch</h3>
                                    {revenueData.length > 0 ? (
                                        <>
                                            <ResponsiveContainer width="100%" height={400}>
                                                <BarChart data={revenueData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="branch_name" />
                                                    <YAxis />
                                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                                    <Legend />
                                                    <Bar dataKey="room_revenue" fill="#4F46E5" name="Room Revenue" />
                                                    <Bar dataKey="service_revenue" fill="#10B981" name="Service Revenue" />
                                                    <Bar dataKey="total_revenue" fill="#F59E0B" name="Total Revenue" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                            <div className="revenue-summary">
                                                {revenueData.map((branch) => (
                                                    <div key={branch.branch_name} className="summary-card">
                                                        <h4>{branch.branch_name}</h4>
                                                        <p><strong>Total Bookings:</strong> {branch.total_bookings}</p>
                                                        <p><strong>Room Revenue:</strong> {formatCurrency(branch.room_revenue || 0)}</p>
                                                        <p><strong>Service Revenue:</strong> {formatCurrency(branch.service_revenue || 0)}</p>
                                                        <p><strong>Total Revenue:</strong> {formatCurrency(branch.total_revenue || 0)}</p>
                                                        <p><strong>Collected:</strong> {formatCurrency(branch.collected_revenue || 0)}</p>
                                                        <p className="text-danger"><strong>Outstanding:</strong> {formatCurrency(branch.outstanding_revenue || 0)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="no-data">No revenue data available for the selected date range.</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'services' && (
                                <div>
                                    <h3>Top Services by Revenue</h3>
                                    {topServices.length > 0 ? (
                                        <>
                                            <ResponsiveContainer width="100%" height={400}>
                                                <BarChart data={topServices.slice(0, 10)}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="service_name" angle={-45} textAnchor="end" height={100} />
                                                    <YAxis />
                                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                                    <Legend />
                                                    <Bar dataKey="total_revenue" fill="#8B5CF6" name="Total Revenue" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                            <div className="services-table">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>Branch</th>
                                                            <th>Service</th>
                                                            <th>Category</th>
                                                            <th>Usage Count</th>
                                                            <th>Total Revenue</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {topServices.map((service, index) => (
                                                            <tr key={`${service.branch_id}-${service.service_name}-${index}`}>
                                                                <td>{service.branch_name}</td>
                                                                <td>{service.service_name}</td>
                                                                <td>{service.service_category}</td>
                                                                <td>{service.usage_count}</td>
                                                                <td>{formatCurrency(service.total_revenue)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="no-data">No service usage data available for the selected date range.</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'unpaid' && (
                                <div>
                                    <h3>Unpaid Bookings</h3>
                                    <div className="unpaid-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Booking ID</th>
                                                    <th>Guest</th>
                                                    <th>Branch</th>
                                                    <th>Check-out</th>
                                                    <th>Outstanding</th>
                                                    <th>Days Overdue</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {unpaidBookings.map((booking) => (
                                                    <tr key={booking.booking_id}>
                                                        <td>{booking.booking_id}</td>
                                                        <td>{booking.guest_name}</td>
                                                        <td>{booking.branch_name}</td>
                                                        <td>{formatDate(booking.check_out_date)}</td>
                                                        <td className="text-danger">{formatCurrency(booking.outstanding_amount)}</td>
                                                        <td>{booking.days_overdue}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'usage' && (
                                <div>
                                    <div className="report-header">
                                        <h3>Service Usage Breakdown</h3>
                                        {serviceUsageData.length > 0 && (
                                            <div className="occupancy-filters">
                                                <div className="search-box">
                                                    <FaSearch className="search-icon" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search by room, guest, or service..."
                                                        value={serviceSearchTerm}
                                                        onChange={(e) => setServiceSearchTerm(e.target.value)}
                                                        className="search-input"
                                                    />
                                                </div>
                                                <div className="filter-group">
                                                    <FaFilter className="filter-icon" />
                                                    <select
                                                        value={serviceCategoryFilter}
                                                        onChange={(e) => setServiceCategoryFilter(e.target.value)}
                                                        className="filter-select"
                                                    >
                                                        <option value="all">All Categories</option>
                                                        {[...new Set(serviceUsageData.map(item => item.service_category))].map(category => (
                                                            <option key={category} value={category}>{category}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {serviceUsageData.length > 0 ? (
                                        <>
                                            {/* Summary Cards */}
                                            <div className="revenue-summary">
                                                <div className="summary-card">
                                                    <h4>Total Services Used</h4>
                                                    <p className="summary-value">{serviceUsageData.length}</p>
                                                </div>
                                                <div className="summary-card">
                                                    <h4>Total Revenue</h4>
                                                    <p className="summary-value">
                                                        {formatCurrency(serviceUsageData.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0))}
                                                    </p>
                                                </div>
                                                <div className="summary-card">
                                                    <h4>Unique Guests</h4>
                                                    <p className="summary-value">
                                                        {new Set(serviceUsageData.map(item => item.guest_name)).size}
                                                    </p>
                                                </div>
                                                <div className="summary-card">
                                                    <h4>Service Categories</h4>
                                                    <p className="summary-value">
                                                        {new Set(serviceUsageData.map(item => item.service_category)).size}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Service Usage Table */}
                                            <div className="table-container">
                                                <table className="report-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Branch</th>
                                                            <th>Room</th>
                                                            <th>Guest</th>
                                                            <th>Service</th>
                                                            <th>Category</th>
                                                            <th>Usage Date</th>
                                                            <th>Quantity</th>
                                                            <th>Unit Price</th>
                                                            <th>Total</th>
                                                            <th>Notes</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {serviceUsageData
                                                            .filter(item => {
                                                                const searchLower = serviceSearchTerm.toLowerCase();
                                                                const matchesSearch = serviceSearchTerm === '' ||
                                                                    item.room_number.toString().toLowerCase().includes(searchLower) ||
                                                                    item.guest_name.toLowerCase().includes(searchLower) ||
                                                                    item.service_name.toLowerCase().includes(searchLower);
                                                                const matchesCategory = serviceCategoryFilter === 'all' || 
                                                                    item.service_category === serviceCategoryFilter;
                                                                return matchesSearch && matchesCategory;
                                                            })
                                                            .map((item, index) => (
                                                                <tr key={index}>
                                                                    <td>{item.branch_name}</td>
                                                                    <td>{item.room_number}</td>
                                                                    <td>{item.guest_name}</td>
                                                                    <td>{item.service_name}</td>
                                                                    <td>
                                                                        <span className="category-badge">{item.service_category}</span>
                                                                    </td>
                                                                    <td>{formatDate(item.usage_date)}</td>
                                                                    <td>{item.quantity}</td>
                                                                    <td>{formatCurrency(item.unit_price)}</td>
                                                                    <td className="text-success">{formatCurrency(item.total_price)}</td>
                                                                    <td>{item.notes || '-'}</td>
                                                                </tr>
                                                            ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Show message if no results after filtering */}
                                            {serviceUsageData.filter(item => {
                                                const searchLower = serviceSearchTerm.toLowerCase();
                                                const matchesSearch = serviceSearchTerm === '' ||
                                                    item.room_number.toString().toLowerCase().includes(searchLower) ||
                                                    item.guest_name.toLowerCase().includes(searchLower) ||
                                                    item.service_name.toLowerCase().includes(searchLower);
                                                const matchesCategory = serviceCategoryFilter === 'all' || 
                                                    item.service_category === serviceCategoryFilter;
                                                return matchesSearch && matchesCategory;
                                            }).length === 0 && (
                                                <div className="no-results">
                                                    <p>No results found</p>
                                                    <button 
                                                        className="btn-clear-filters"
                                                        onClick={() => {
                                                            setServiceSearchTerm('');
                                                            setServiceCategoryFilter('all');
                                                        }}
                                                    >
                                                        Clear Filters
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="no-data">No service usage data available.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </Layout>
    );
};

export default Reports;
