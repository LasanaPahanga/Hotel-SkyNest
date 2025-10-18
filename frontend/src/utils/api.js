import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    }
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// API methods
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getMe: () => api.get('/auth/me'),
    changePassword: (data) => api.put('/auth/change-password', data)
};

export const userAPI = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    resetPassword: (id, data) => api.put(`/users/${id}/reset-password`, data)
};

export const bookingAPI = {
    getAll: (params) => api.get('/bookings', { params }),
    getById: (id) => api.get(`/bookings/${id}`),
    create: (data) => api.post('/bookings', data),
    update: (id, data) => api.put(`/bookings/${id}`, data),
    checkIn: (id) => api.put(`/bookings/${id}/checkin`),
    checkOut: (id) => api.put(`/bookings/${id}/checkout`),
    cancel: (id) => api.put(`/bookings/${id}/cancel`)
};

export const roomAPI = {
    getAll: (params) => api.get('/rooms', { params }),
    getAvailable: (params) => api.get('/rooms/available', { params }),
    getById: (id) => api.get(`/rooms/${id}`),
    create: (data) => api.post('/rooms', data),
    update: (id, data) => api.put(`/rooms/${id}`, data),
    delete: (id) => api.delete(`/rooms/${id}`),
    getTypes: () => api.get('/rooms/types/all')
};

export const guestAPI = {
    getAll: (params) => api.get('/guests', { params }),
    getById: (id) => api.get(`/guests/${id}`),
    create: (data) => api.post('/guests', data),
    update: (id, data) => api.put(`/guests/${id}`, data),
    delete: (id) => api.delete(`/guests/${id}`),
    getMyProfile: () => api.get('/guests/me'),
    updateMyProfile: (data) => api.put('/guests/me', data)
};

export const serviceAPI = {
    getAll: (params) => api.get('/services', { params }),
    getById: (id) => api.get(`/services/${id}`),
    create: (data) => api.post('/services', data),
    update: (id, data) => api.put(`/services/${id}`, data),
    delete: (id) => api.delete(`/services/${id}`),
    addUsage: (data) => api.post('/services/usage', data),
    getUsage: (bookingId) => api.get(`/services/usage/${bookingId}`),
    deleteUsage: (id) => api.delete(`/services/usage/${id}`),
    getBranchServices: (branchId) => api.get(`/services/branch/${branchId}`),
    toggleBranchService: (branchId, serviceId, data) => api.put(`/services/branch/${branchId}/toggle/${serviceId}`, data),
    setBranchServicePrice: (branchId, serviceId, data) => api.put(`/services/branch/${branchId}/price/${serviceId}`, data)
};

export const paymentAPI = {
    getAll: (params) => api.get('/payments', { params }),
    getById: (id) => api.get(`/payments/${id}`),
    process: (data) => api.post('/payments', data),
    getByBooking: (bookingId) => api.get(`/payments/booking/${bookingId}`),
    update: (id, data) => api.put(`/payments/${id}`, data)
};

export const supportAPI = {
    createTicket: (data) => api.post('/support/tickets', data),
    getMyTickets: () => api.get('/support/tickets/my'),
    getAllTickets: (params) => api.get('/support/tickets', { params }),
    getTicketById: (id) => api.get(`/support/tickets/${id}`),
    addResponse: (ticketId, data) => api.post(`/support/tickets/${ticketId}/responses`, data),
    updateTicket: (id, data) => api.put(`/support/tickets/${id}`, data)
};

export const reportAPI = {
    getDashboard: (params) => api.get('/reports/dashboard', { params }),
    getOccupancy: (params) => api.get('/reports/occupancy', { params }),
    getBilling: () => api.get('/reports/billing'),
    getUnpaid: () => api.get('/reports/unpaid'),
    getServices: (params) => api.get('/reports/services', { params }),
    getServiceUsage: (params) => api.get('/reports/services', { params }),
    getRevenue: (params) => api.get('/reports/revenue', { params }),
    getMonthlyRevenue: (params) => api.get('/reports/monthly-revenue', { params }),
    getTopServices: (params) => api.get('/reports/top-services', { params }),
    getGuestHistory: (guestId) => api.get(`/reports/guest-history/${guestId}`)
};

export const branchAPI = {
    getAll: () => api.get('/branches'),
    getById: (id) => api.get(`/branches/${id}`),
    create: (data) => api.post('/branches', data),
    update: (id, data) => api.put(`/branches/${id}`, data),
    delete: (id) => api.delete(`/branches/${id}`)
};

export const roomTypeAPI = {
    getAll: () => api.get('/rooms/types/all'),
    getById: (id) => api.get(`/rooms/types/${id}`),
    create: (data) => api.post('/rooms/types', data),
    update: (id, data) => api.put(`/rooms/types/${id}`),
    delete: (id) => api.delete(`/rooms/types/${id}`)
};

export const serviceRequestAPI = {
    getAll: (params) => api.get('/service-requests', { params }),
    getById: (id) => api.get(`/service-requests/${id}`),
    create: (data) => api.post('/service-requests', data),
    review: (id, data) => api.put(`/service-requests/${id}/review`, data),
    cancel: (id) => api.delete(`/service-requests/${id}`),
    getPendingCount: () => api.get('/service-requests/pending/count')
};

export default api;
