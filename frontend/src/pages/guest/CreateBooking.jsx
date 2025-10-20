import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import { branchAPI, roomAPI, bookingAPI, guestAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { formatCurrency, calculateNights } from '../../utils/helpers';
import dashboardImage from '../../assets/dashboard.jpeg';
import '../../styles/CreateBooking.css';
import '../../styles/CommonPage.css';

const GuestCreateBooking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const guestId = useMemo(() => user?.guest_id, [user]);
  const [resolvedGuestId, setResolvedGuestId] = useState(guestId || '');

  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);

  const [formData, setFormData] = useState({
    branch_id: '',
    room_id: '',
    check_in_date: '',
    check_out_date: '',
    number_of_guests: 1,
    payment_method: 'Cash',
    special_requests: ''
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await branchAPI.getAll();
        setBranches(res.data.data || []);
      } catch (e) {
        // non-blocking
      }
    })();
  }, []);

  // Ensure we have a guest_id (after refresh) by calling /guests/me if needed
  useEffect(() => {
    (async () => {
      if (!resolvedGuestId) {
        try {
          const res = await guestAPI.getMyProfile();
          if (res?.data?.data?.guest_id) {
            setResolvedGuestId(res.data.data.guest_id);
          }
        } catch (_) {
          // ignore; handled on submit
        }
      }
    })();
  }, [resolvedGuestId]);

  const searchRooms = async () => {
    if (!formData.branch_id || !formData.check_in_date || !formData.check_out_date) {
      toast.error('Please select branch and dates');
      return;
    }

    setLoading(true);
    try {
      const res = await roomAPI.getAvailable({
        branch_id: formData.branch_id,
        check_in_date: formData.check_in_date,
        check_out_date: formData.check_out_date,
        guests: formData.number_of_guests,
      });
      setAvailableRooms(res.data.data || []);
      if ((res.data.data || []).length === 0) toast.info('No rooms available for selected dates');
    } catch (e) {
      toast.error('Failed to search rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const gid = resolvedGuestId || guestId;
    if (!gid) {
      toast.error('Guest profile not found. Please re-login.');
      return;
    }
    if (!formData.room_id) {
      toast.error('Please select a room');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        guest_id: gid,
        room_id: formData.room_id,
        check_in_date: formData.check_in_date,
        check_out_date: formData.check_out_date,
        number_of_guests: formData.number_of_guests,
        payment_method: formData.payment_method,
        special_requests: formData.special_requests || null,
      };
      const res = await bookingAPI.create(payload);
      toast.success('Booking created successfully');
      navigate(`/guest/bookings/${res.data.data.booking_id}`);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to create booking';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const nights = calculateNights(formData.check_in_date, formData.check_out_date);
  const selectedRoom = availableRooms.find(r => r.room_id === parseInt(formData.room_id));

  return (
    <Layout>
      <div
        className="create-booking-page common-page"
        style={{
          backgroundImage: `url(${dashboardImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          maxWidth: '1400px'
        }}
      >
        <div className="page-header">
          <h1>New Booking</h1>
        </div>

        <Card title="Select Dates & Room">
          <div className="room-search">
            <div className="form-grid">
              <div className="form-group">
                <label>Branch *</label>
                <select
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  required
                >
                  <option value="">Select branch</option>
                  {branches.map((b) => (
                    <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                  ))}
                </select>
              </div>
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
                  min={formData.check_in_date || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="form-group">
                <label>Number of Guests *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.number_of_guests}
                  onChange={(e) => setFormData({ ...formData, number_of_guests: parseInt(e.target.value || '1') })}
                  required
                />
              </div>
            </div>

            <button className="btn btn-primary" onClick={searchRooms} disabled={loading}>
              {loading ? 'Searching...' : 'Search Available Rooms'}
            </button>

            {availableRooms.length > 0 && (
              <div className="available-rooms" style={{ marginTop: '1rem' }}>
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
                        Total: {formatCurrency(room.total_price || 0)} ({nights} nights)
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {formData.room_id && (
          <Card title="Confirm & Pay">
            <form onSubmit={handleSubmit}>
              <div className="booking-summary">
                <h3>Booking Summary</h3>
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
                  rows={3}
                  placeholder="Any special requests or notes..."
                />
              </div>

              <div className="step-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setFormData({ ...formData, room_id: '' })}>
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

export default GuestCreateBooking;
