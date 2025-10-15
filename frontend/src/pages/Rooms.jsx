import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { roomAPI, branchAPI, roomTypeAPI } from '../utils/api';
import { formatCurrency, getStatusClass } from '../utils/helpers';
import { FaEdit, FaEye, FaFilter, FaTimes, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Rooms = () => {
    const { user } = useAuth();
    const [rooms, setRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [branches, setBranches] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    
    // Filters
    const [filters, setFilters] = useState({
        branch_id: '',
        room_type_id: '',
        status: '',
        floor_number: '',
        search: ''
    });

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        available: 0,
        occupied: 0,
        maintenance: 0
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, rooms]);

    const fetchInitialData = async () => {
        try {
            const [roomsRes, branchesRes, typesRes] = await Promise.all([
                roomAPI.getAll(),
                branchAPI.getAll(),
                roomTypeAPI.getAll()
            ]);
            
            setRooms(roomsRes.data.data);
            setBranches(branchesRes.data.data);
            setRoomTypes(typesRes.data.data);
            
            calculateStats(roomsRes.data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load rooms');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (roomsData) => {
        setStats({
            total: roomsData.length,
            available: roomsData.filter(r => r.status === 'Available').length,
            occupied: roomsData.filter(r => r.status === 'Occupied').length,
            maintenance: roomsData.filter(r => r.status === 'Maintenance').length
        });
    };

    const applyFilters = () => {
        let filtered = [...rooms];

        if (filters.branch_id) {
            filtered = filtered.filter(r => r.branch_id === parseInt(filters.branch_id));
        }

        if (filters.room_type_id) {
            filtered = filtered.filter(r => r.room_type_id === parseInt(filters.room_type_id));
        }

        if (filters.status) {
            filtered = filtered.filter(r => r.status === filters.status);
        }

        if (filters.floor_number) {
            filtered = filtered.filter(r => r.floor_number === parseInt(filters.floor_number));
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(r => 
                r.room_number.toLowerCase().includes(searchLower) ||
                r.branch_name.toLowerCase().includes(searchLower) ||
                r.type_name.toLowerCase().includes(searchLower)
            );
        }

        setFilteredRooms(filtered);
    };

    const clearFilters = () => {
        setFilters({
            branch_id: '',
            room_type_id: '',
            status: '',
            floor_number: '',
            search: ''
        });
    };

    const handleViewRoom = (room) => {
        setSelectedRoom(room);
        setShowViewModal(true);
    };

    const handleEditRoom = (room) => {
        setSelectedRoom(room);
        setShowEditModal(true);
    };

    const handleUpdateStatus = async (newStatus) => {
        try {
            await roomAPI.update(selectedRoom.room_id, { status: newStatus });
            toast.success('Room status updated successfully');
            setShowEditModal(false);
            fetchInitialData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update room');
        }
    };

    // Get unique floor numbers
    const floors = [...new Set(rooms.map(r => r.floor_number))].sort((a, b) => a - b);

    if (loading) {
        return (
            <Layout>
                <LoadingSpinner message="Loading rooms..." />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="rooms-page">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1>Rooms Management</h1>
                        <p>Manage and monitor room availability</p>
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
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ fontSize: '2.5rem', margin: 0 }}>{stats.total}</h3>
                            <p style={{ margin: 0, opacity: 0.9 }}>Total Rooms</p>
                        </div>
                    </Card>
                    <Card style={{ background: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', color: 'white', border: 'none' }}>
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ fontSize: '2.5rem', margin: 0 }}>{stats.available}</h3>
                            <p style={{ margin: 0, opacity: 0.9 }}>Available</p>
                        </div>
                    </Card>
                    <Card style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white', border: 'none' }}>
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ fontSize: '2.5rem', margin: 0 }}>{stats.occupied}</h3>
                            <p style={{ margin: 0, opacity: 0.9 }}>Occupied</p>
                        </div>
                    </Card>
                    <Card style={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', color: 'white', border: 'none' }}>
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ fontSize: '2.5rem', margin: 0 }}>{stats.maintenance}</h3>
                            <p style={{ margin: 0, opacity: 0.9 }}>Maintenance</p>
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
                                    placeholder="Room number, branch..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Branch</label>
                                <select
                                    value={filters.branch_id}
                                    onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                >
                                    <option value="">All Branches</option>
                                    {branches.map(b => (
                                        <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Room Type</label>
                                <select
                                    value={filters.room_type_id}
                                    onChange={(e) => setFilters({ ...filters, room_type_id: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                >
                                    <option value="">All Types</option>
                                    {roomTypes.map(t => (
                                        <option key={t.room_type_id} value={t.room_type_id}>{t.type_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                >
                                    <option value="">All Status</option>
                                    <option value="Available">Available</option>
                                    <option value="Occupied">Occupied</option>
                                    <option value="Maintenance">Maintenance</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Floor</label>
                                <select
                                    value={filters.floor_number}
                                    onChange={(e) => setFilters({ ...filters, floor_number: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                                >
                                    <option value="">All Floors</option>
                                    {floors.map(f => (
                                        <option key={f} value={f}>Floor {f}</option>
                                    ))}
                                </select>
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

                {/* Rooms Table */}
                <Card title={`Rooms (${filteredRooms.length})`}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Branch</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Room #</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Type</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Floor</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Capacity</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Rate/Night</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRooms.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                            No rooms found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRooms.map((room) => (
                                        <tr key={room.room_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                            <td style={{ padding: '0.75rem' }}>{room.branch_name}</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <strong>{room.room_number}</strong>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>{room.type_name}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>{room.floor_number}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>{room.capacity}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                                                {formatCurrency(room.base_rate)}
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                <span className={`status-badge ${getStatusClass(room.status)}`}>
                                                    {room.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => handleViewRoom(room)}
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
                                                        <button
                                                            onClick={() => handleEditRoom(room)}
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

                {/* View Modal */}
                {showViewModal && selectedRoom && (
                    <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={`Room ${selectedRoom.room_number} Details`}>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <strong>Branch:</strong> {selectedRoom.branch_name}
                            </div>
                            <div>
                                <strong>Room Type:</strong> {selectedRoom.type_name}
                            </div>
                            <div>
                                <strong>Floor:</strong> {selectedRoom.floor_number}
                            </div>
                            <div>
                                <strong>Capacity:</strong> {selectedRoom.capacity} guests
                            </div>
                            <div>
                                <strong>Rate per Night:</strong> {formatCurrency(selectedRoom.base_rate)}
                            </div>
                            <div>
                                <strong>Amenities:</strong> {selectedRoom.amenities || 'N/A'}
                            </div>
                            <div>
                                <strong>Status:</strong>{' '}
                                <span className={`status-badge ${getStatusClass(selectedRoom.status)}`}>
                                    {selectedRoom.status}
                                </span>
                            </div>
                        </div>
                    </Modal>
                )}

                {/* Edit Modal */}
                {showEditModal && selectedRoom && (
                    <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Edit Room ${selectedRoom.room_number}`}>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <strong>Current Status:</strong>{' '}
                                <span className={`status-badge ${getStatusClass(selectedRoom.status)}`}>
                                    {selectedRoom.status}
                                </span>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                    Change Status:
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button
                                        className="btn btn-success"
                                        onClick={() => handleUpdateStatus('Available')}
                                        disabled={selectedRoom.status === 'Available'}
                                    >
                                        Mark Available
                                    </button>
                                    <button
                                        className="btn btn-warning"
                                        onClick={() => handleUpdateStatus('Maintenance')}
                                        disabled={selectedRoom.status === 'Maintenance'}
                                    >
                                        Mark Maintenance
                                    </button>
                                </div>
                            </div>
                            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                                    <strong>Note:</strong> Room status "Occupied" is automatically set when a guest checks in.
                                </p>
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        </Layout>
    );
};

export default Rooms;
