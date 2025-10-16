import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import { reportAPI } from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';
import { 
    FaCalendarAlt, FaBed, FaMoneyBillWave, FaChartLine,
    FaUsers, FaCheckCircle 
} from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dashboardImage from '../../assets/dashboard.jpeg';
import '../../styles/Dashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [revenueData, setRevenueData] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, revenueRes] = await Promise.all([
                reportAPI.getDashboard(),
                reportAPI.getMonthlyRevenue({ year: new Date().getFullYear() })
            ]);

            setStats(statsRes.data.data);
            setRevenueData(revenueRes.data.data.slice(0, 6).reverse());
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <LoadingSpinner message="Loading dashboard..." />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="dashboard" style={{ backgroundImage: `url(${dashboardImage})` }}>
                <div className="dashboard-header">
                    <h1>Welcome, SkyNest Team!</h1>
                    <p className="dashboard-subtitle">Key Metrics</p>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <StatCard
                        title="Total Bookings"
                        value={stats?.total_bookings || 0}
                        icon={FaCalendarAlt}
                        color="blue"
                        subtitle={`${stats?.today_checkins || 0} check-ins today`}
                    />
                    <StatCard
                        title="Current Check-ins"
                        value={stats?.current_checkins || 0}
                        icon={FaCheckCircle}
                        color="green"
                        subtitle={`${stats?.today_checkouts || 0} check-outs today`}
                    />
                    <StatCard
                        title="Available Rooms"
                        value={`${stats?.available_rooms || 0}/${stats?.total_rooms || 0}`}
                        icon={FaBed}
                        color="purple"
                        subtitle={`${stats?.occupancy_rate || 0}% occupied`}
                    />
                    <StatCard
                        title="Monthly Revenue"
                        value={formatCurrency(stats?.monthly_revenue?.collected || 0)}
                        icon={FaMoneyBillWave}
                        color="orange"
                        subtitle={`${formatCurrency(stats?.monthly_revenue?.pending || 0)} pending`}
                    />
                </div>

                {/* Charts */}
                <div className="dashboard-charts">
                    <Card title="Monthly Revenue by Branch">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="branch_name" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                                <Bar dataKey="room_revenue" fill="#5b8697" name="Room Revenue" />
                                <Bar dataKey="service_revenue" fill="#17a2b8" name="Service Revenue" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </div>

                {/* Quick Stats */}
                <div className="quick-stats">
                    <Card title="Quick Statistics">
                        <div className="quick-stats-grid">
                            <div className="quick-stat-item">
                                <FaUsers className="quick-stat-icon" />
                                <div>
                                    <h4>Occupancy Rate</h4>
                                    <p className="quick-stat-value">{stats?.occupancy_rate || 0}%</p>
                                </div>
                            </div>
                            <div className="quick-stat-item">
                                <FaChartLine className="quick-stat-icon" />
                                <div>
                                    <h4>Total Revenue</h4>
                                    <p className="quick-stat-value">
                                        {formatCurrency(stats?.monthly_revenue?.total || 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </Layout>
    );
};

export default AdminDashboard;
