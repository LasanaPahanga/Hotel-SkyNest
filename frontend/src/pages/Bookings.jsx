import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Table from '../components/Table';
import LoadingSpinner from '../components/LoadingSpinner';
import { bookingAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatCurrency, getStatusClass } from '../utils/helpers';
import { FaPlus, FaFilter } from 'react-icons/fa';
import dashboardImage from '../assets/dashboard.jpeg';
import '../styles/Bookings.css';

const Bookings = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        fetchBookings();
    }, [filters]);

    const fetchBookings = async () => {
        try {
            const params = { ...filters };
            if (user?.role === 'Receptionist') {
                params.branch_id = user.branch.branch_id;
            }
            const response = await bookingAPI.getAll(params);
            setBookings(response.data.data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    const clearFilters = () => {
        setFilters({
            status: '',
            start_date: '',
            end_date: ''
        });
    };

    const columns = [
        {
            header: 'ID',
            accessor: 'booking_id',
            width: '80px'
        },
        {
            header: 'Guest',
            accessor: 'first_name',
            render: (_, row) => `${row.first_name} ${row.last_name}`
        },
        {
            header: 'Branch',
            accessor: 'branch_name'
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
            header: 'Check-out',
            accessor: 'check_out_date',
            render: (value) => formatDate(value)
        },
        {
            header: 'Total',
            accessor: 'total_amount',
            render: (value) => formatCurrency(value)
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
                <LoadingSpinner message="Loading bookings..." />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="bookings-page" style={{ backgroundImage: `url(${dashboardImage})` }}>
                <div className="page-header">
                    <h1>Bookings</h1>
                    {(user?.role === 'Admin' || user?.role === 'Receptionist') && (
                        <button 
                            className="btn btn-primary"
                            onClick={() => navigate('/bookings/new')}
                        >
                            <FaPlus /> New Booking
                        </button>
                    )}
                </div>

                {/* Filters */}
                <Card title="Filters" className="filters-card">
                    <div className="filters-grid">
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                            >
                                <option value="">All Statuses</option>
                                <option value="Booked">Booked</option>
                                <option value="Checked-In">Checked-In</option>
                                <option value="Checked-Out">Checked-Out</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Start Date</label>
                            <input
                                type="date"
                                name="start_date"
                                value={filters.start_date}
                                onChange={handleFilterChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>End Date</label>
                            <input
                                type="date"
                                name="end_date"
                                value={filters.end_date}
                                onChange={handleFilterChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>&nbsp;</label>
                            <button 
                                className="btn btn-secondary"
                                onClick={clearFilters}
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </Card>

                {/* Bookings Table */}
                <Card title={`Bookings (${bookings.length})`}>
                    <Table
                        columns={columns}
                        data={bookings}
                        onRowClick={(row) => navigate(`/bookings/${row.booking_id}`)}
                        emptyMessage="No bookings found"
                    />
                </Card>
            </div>
        </Layout>
    );
};

export default Bookings;
