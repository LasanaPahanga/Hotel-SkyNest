import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import Card from '../components/Card';
import { roomAPI, guestAPI, bookingAPI, branchAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, calculateNights } from '../utils/helpers';
import '../styles/CreateBooking.css';

const CreateBooking = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [branches, setBranches] = useState([]);
    const [guests, setGuests] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        branch_id: user?.branch?.branch_id || '',
        guest_id: '',
        room_id: '',
        check_in_date: '',
        check_out_date: '',
        number_of_guests: 1,
        payment_method: 'Cash',
        special_requests: ''
    });

    const [newGuest, setNewGuest] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        id_type: 'Passport',
        id_number: '',
        country: 'Sri Lanka'
    });

    useEffect(() => {
        fetchBranches();
        fetchGuests();
    }, []);

    const fetchBranches = async () => {
        try {
            const response = await branchAPI.getAll();
            setBranches(response.data.data);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchGuests = async () => {
        try {
            const response = await guestAPI.getAll();
            setGuests(response.data.data);
        } catch (error) {
            console.error('Error fetching guests:', error);
        }
    };

    const searchRooms = async () => {
        if (!formData.branch_id || !formData.check_in_date || !formData.check_out_date) {
            toast.error('Please select branch and dates');
            return;
        }

        setLoading(true);
        try {
            const response = await roomAPI.getAvailable({
                branch_id: formData.branch_id,
                check_in_date: formData.check_in_date,
                check_out_date: formData.check_out_date,
                guests: formData.number_of_guests
            });
            setAvailableRooms(response.data.data);
            if (response.data.data.length === 0) {
                toast.info('No rooms available for selected dates');
            }
        } catch (error) {
            toast.error('Failed to search rooms');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGuest = async (e) => {
        e.preventDefault();
        try {
            const response = await guestAPI.create(newGuest);
            toast.success('Guest created successfully');
            setFormData({ ...formData, guest_id: response.data.data.guest_id });
            fetchGuests();
            setStep(2);
        } catch (error) {
            toast.error('Failed to create guest');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await bookingAPI.create(formData);
            toast.success('Booking created successfully');
            navigate(`/bookings/${response.data.data.booking_id}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create booking');
        } finally {
            setLoading(false);
        }
    };

    const nights = calculateNights(formData.check_in_date, formData.check_out_date);
    const selectedRoom = availableRooms.find(r => r.room_id === parseInt(formData.room_id));

    return (
        <Layout>
            <div className="create-booking-page">
                <div className="page-header">
                    <h1>Create New Booking</h1>
                </div>

                <div className="booking-steps">
                    <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Guest</div>
                    <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Room</div>
                    <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Confirm</div>
                </div>

                {step === 1 && (
                    <Card title="Select or Create Guest">
                        <div className="guest-selection">
                            <div className="form-group">
                                <label>Existing Guest</label>
                                <select
                                    value={formData.guest_id}
                                    onChange={(e) => setFormData({ ...formData, guest_id: e.target.value })}
                                >
                                    <option value="">Select a guest</option>
                                    {guests.map((guest) => (
                                        <option key={guest.guest_id} value={guest.guest_id}>
                                            {guest.first_name} {guest.last_name} - {guest.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {formData.guest_id && (
                                <button className="btn btn-primary" onClick={() => setStep(2)}>
                                    Continue
                                </button>
                            )}

                            <div className="divider">OR</div>

                            <h3>Create New Guest</h3>
                            <form onSubmit={handleCreateGuest}>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>First Name *</label>
                                        <input
                                            type="text"
                                            value={newGuest.first_name}
                                            onChange={(e) => setNewGuest({ ...newGuest, first_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name *</label>
                                        <input
                                            type="text"
                                            value={newGuest.last_name}
                                            onChange={(e) => setNewGuest({ ...newGuest, last_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email *</label>
                                        <input
                                            type="email"
                                            value={newGuest.email}
                                            onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone *</label>
                                        <input
                                            type="tel"
                                            value={newGuest.phone}
                                            onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>ID Type *</label>
                                        <select
                                            value={newGuest.id_type}
                                            onChange={(e) => setNewGuest({ ...newGuest, id_type: e.target.value })}
                                            required
                                        >
                                            <option value="Passport">Passport</option>
                                            <option value="NIC">NIC</option>
                                            <option value="Driving License">Driving License</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>ID Number *</label>
                                        <input
                                            type="text"
                                            value={newGuest.id_number}
                                            onChange={(e) => setNewGuest({ ...newGuest, id_number: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Country *</label>
                                        <input
                                            type="text"
                                            value={newGuest.country}
                                            onChange={(e) => setNewGuest({ ...newGuest, country: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary">
                                    Create Guest & Continue
                                </button>
                            </form>
                        </div>
                    </Card>
                )}

                {step === 2 && (
                    <Card title="Select Room">
                        <div className="room-search">
                            <div className="form-grid">
                                {user?.role === 'Admin' && (
                                    <div className="form-group">
                                        <label>Branch *</label>
                                        <select
                                            value={formData.branch_id}
                                            onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select branch</option>
                                            {branches.map((branch) => (
                                                <option key={branch.branch_id} value={branch.branch_id}>
                                                    {branch.branch_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>Check-in Date *</label>
                                    <input
                                        type="date"
                                        value={formData.check_in_date}
                                        onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Check-out Date *</label>
                                    <input
                                        type="date"
                                        value={formData.check_out_date}
                                        onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                                        min={formData.check_in_date}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Number of Guests *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.number_of_guests}
                                        onChange={(e) => setFormData({ ...formData, number_of_guests: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>
                            <button className="btn btn-primary" onClick={searchRooms} disabled={loading}>
                                {loading ? 'Searching...' : 'Search Available Rooms'}
                            </button>
                        </div>

                        {availableRooms.length > 0 && (
                            <div className="available-rooms">
                                <h3>Available Rooms ({availableRooms.length})</h3>
                                <div className="rooms-grid">
                                    {availableRooms.map((room) => (
                                        <div
                                            key={room.room_id}
                                            className={`room-card ${formData.room_id === room.room_id ? 'selected' : ''}`}
                                            onClick={() => setFormData({ ...formData, room_id: room.room_id })}
                                        >
                                            <h4>{room.type_name}</h4>
                                            <p>Room {room.room_number}</p>
                                            <p className="room-capacity">Capacity: {room.capacity} guests</p>
                                            <p className="room-rate">{formatCurrency(room.base_rate)}/night</p>
                                            <p className="room-total">
                                                Total: {formatCurrency(room.total_price)} ({nights} nights)
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="step-actions">
                            <button className="btn btn-secondary" onClick={() => setStep(1)}>
                                Back
                            </button>
                            {formData.room_id && (
                                <button className="btn btn-primary" onClick={() => setStep(3)}>
                                    Continue
                                </button>
                            )}
                        </div>
                    </Card>
                )}

                {step === 3 && (
                    <Card title="Confirm Booking">
                        <form onSubmit={handleSubmit}>
                            <div className="booking-summary">
                                <h3>Booking Summary</h3>
                                <div className="summary-item">
                                    <span>Guest:</span>
                                    <strong>{guests.find(g => g.guest_id === parseInt(formData.guest_id))?.first_name} {guests.find(g => g.guest_id === parseInt(formData.guest_id))?.last_name}</strong>
                                </div>
                                <div className="summary-item">
                                    <span>Room:</span>
                                    <strong>{selectedRoom?.type_name} - Room {selectedRoom?.room_number}</strong>
                                </div>
                                <div className="summary-item">
                                    <span>Check-in:</span>
                                    <strong>{formData.check_in_date}</strong>
                                </div>
                                <div className="summary-item">
                                    <span>Check-out:</span>
                                    <strong>{formData.check_out_date}</strong>
                                </div>
                                <div className="summary-item">
                                    <span>Nights:</span>
                                    <strong>{nights}</strong>
                                </div>
                                <div className="summary-item">
                                    <span>Total Amount:</span>
                                    <strong className="total-amount">{formatCurrency(selectedRoom?.total_price || 0)}</strong>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Payment Method *</label>
                                <select
                                    value={formData.payment_method}
                                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                    required
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Credit Card">Credit Card</option>
                                    <option value="Debit Card">Debit Card</option>
                                    <option value="Online Transfer">Online Transfer</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Special Requests</label>
                                <textarea
                                    value={formData.special_requests}
                                    onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                                    rows="3"
                                    placeholder="Any special requests or notes..."
                                />
                            </div>

                            <div className="step-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>
                                    Back
                                </button>
                                <button type="submit" className="btn btn-success" disabled={loading}>
                                    {loading ? 'Creating...' : 'Confirm Booking'}
                                </button>
                            </div>
                        </form>
                    </Card>
                )}
            </div>
        </Layout>
    );
};

export default CreateBooking;
