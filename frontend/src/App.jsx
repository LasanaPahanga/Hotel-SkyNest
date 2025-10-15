import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import ReceptionistDashboard from './pages/dashboards/ReceptionistDashboard';
import GuestDashboard from './pages/dashboards/GuestDashboard';
import Bookings from './pages/Bookings';
import BookingDetails from './pages/BookingDetails';
import CreateBooking from './pages/CreateBooking';
import Rooms from './pages/Rooms';
import Guests from './pages/Guests';
import GuestDetails from './pages/GuestDetails';
import Services from './pages/Services';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Guest Pages
import MyBookings from './pages/guest/MyBookings';
import GuestBookingDetails from './pages/guest/BookingDetails';
import RequestService from './pages/guest/RequestService';
import ContactSupport from './pages/guest/ContactSupport';
import SupportTickets from './pages/SupportTickets';
import ServiceRequests from './pages/ServiceRequests';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes - Admin */}
            <Route
              path="/admin/*"
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            
            {/* Protected Routes - Receptionist */}
            <Route
              path="/receptionist/*"
              element={
                <PrivateRoute allowedRoles={['Receptionist']}>
                  <ReceptionistDashboard />
                </PrivateRoute>
              }
            />
            
            {/* Protected Routes - Guest */}
            <Route
              path="/guest"
              element={
                <PrivateRoute allowedRoles={['Guest']}>
                  <GuestDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/guest/dashboard"
              element={
                <PrivateRoute allowedRoles={['Guest']}>
                  <GuestDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/guest/bookings"
              element={
                <PrivateRoute allowedRoles={['Guest']}>
                  <MyBookings />
                </PrivateRoute>
              }
            />
            <Route
              path="/guest/bookings/:id"
              element={
                <PrivateRoute allowedRoles={['Guest']}>
                  <GuestBookingDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/guest/request-service"
              element={
                <PrivateRoute allowedRoles={['Guest']}>
                  <RequestService />
                </PrivateRoute>
              }
            />
            <Route
              path="/guest/support"
              element={
                <PrivateRoute allowedRoles={['Guest']}>
                  <ContactSupport />
                </PrivateRoute>
              }
            />
            
            {/* Shared Protected Routes */}
            <Route
              path="/bookings"
              element={
                <PrivateRoute>
                  <Bookings />
                </PrivateRoute>
              }
            />
            <Route
              path="/bookings/:id"
              element={
                <PrivateRoute>
                  <BookingDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/bookings/new"
              element={
                <PrivateRoute allowedRoles={['Admin', 'Receptionist']}>
                  <CreateBooking />
                </PrivateRoute>
              }
            />
            <Route
              path="/rooms"
              element={
                <PrivateRoute>
                  <Rooms />
                </PrivateRoute>
              }
            />
            <Route
              path="/guests"
              element={
                <PrivateRoute allowedRoles={['Admin', 'Receptionist']}>
                  <Guests />
                </PrivateRoute>
              }
            />
            <Route
              path="/guests/:id"
              element={
                <PrivateRoute allowedRoles={['Admin', 'Receptionist']}>
                  <GuestDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/services"
              element={
                <PrivateRoute>
                  <Services />
                </PrivateRoute>
              }
            />
            <Route
              path="/service-requests"
              element={
                <PrivateRoute allowedRoles={['Admin', 'Receptionist']}>
                  <ServiceRequests />
                </PrivateRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <PrivateRoute allowedRoles={['Admin', 'Receptionist']}>
                  <Payments />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <PrivateRoute allowedRoles={['Admin', 'Receptionist']}>
                  <Reports />
                </PrivateRoute>
              }
            />
            <Route
              path="/support"
              element={
                <PrivateRoute allowedRoles={['Admin', 'Receptionist']}>
                  <SupportTickets />
                </PrivateRoute>
              }
            />
            <Route
              path="/users"
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <Users />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            
            {/* Default Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
