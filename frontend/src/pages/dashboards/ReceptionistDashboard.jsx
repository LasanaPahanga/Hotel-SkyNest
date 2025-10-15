import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import Table from '../../components/Table';
import LoadingSpinner from '../../components/LoadingSpinner';
import { reportAPI, bookingAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, getStatusClass } from '../../utils/helpers';
import { FaCalendarAlt, FaBed, FaCheckCircle, FaMoneyBillWave } from 'react-icons/fa';
import '../../styles/Dashboard.css';

const ReceptionistDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [todayBookings, setTodayBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const statsRes = await reportAPI.getDashboard({ 
                branch_id: user?.branch?.branch_id 
            });
            setStats(statsRes.data.data);

            // Get today's bookings
            const today = new Date().toISOString().split('T')[0];
            const bookingsRes = await bookingAPI.getAll({
                branch_id: user?.branch?.branch_id,
                start_date: today,
                end_date: today
            });
            setTodayBookings(bookingsRes.data.data.slice(0, 5));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: 'Guest',
            accessor: 'first_name',
            render: (_, row) => `${row.first_name} ${row.last_name}`
        },
        {
            header: 'Room',
            accessor: 'room_number'
        },
        {
            header: 'Check-in',
            accessor: 'check_in_date',
            render: (value) => formatDate(value)
        },
        {
            header: 'Status',
            accessor: 'booking_status',
            render: (value) => (
                <span className={`status-badge ${getStatusClass(value)}`}>
                    {value}
                </span>
            )
        }
    ];

    if (loading) {
        return (
            <Layout>
                <LoadingSpinner message="Loading dashboard..." />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="dashboard">
                <div className="dashboard-header">
                    <h1>Receptionist Dashboard</h1>
                    <p>Welcome to {user?.branch?.branch_name}</p>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <StatCard
                        title="Today's Check-ins"
                        value={stats?.today_checkins || 0}
                        icon={FaCalendarAlt}
                        color="blue"
                    />
                    <StatCard
                        title="Today's Check-outs"
                        value={stats?.today_checkouts || 0}
                        icon={FaCheckCircle}
                        color="green"
                    />
                    <StatCard
                        title="Available Rooms"
                        value={stats?.available_rooms || 0}
                        icon={FaBed}
                        color="purple"
                    />
                    <StatCard
                        title="Current Guests"
                        value={stats?.current_checkins || 0}
                        icon={FaMoneyBillWave}
                        color="orange"
                    />
                </div>

                {/* Today's Bookings */}
                <Card 
                    title="Today's Bookings"
                    actions={
                        <button 
                            className="btn btn-primary"
                            onClick={() => navigate('/bookings/new')}
                        >
                            New Booking
                        </button>
                    }
                >
                    <Table
                        columns={columns}
                        data={todayBookings}
                        onRowClick={(row) => navigate(`/bookings/${row.booking_id}`)}
                        emptyMessage="No bookings for today"
                    />
                </Card>
            </div>
        </Layout>
    );
};

export default ReceptionistDashboard;
