import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
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
import MyProfile from './pages/guest/MyProfile';
import GuestCreateBooking from './pages/guest/CreateBooking';
import ViewBill from './pages/guest/ViewBill';
import SupportTickets from './pages/SupportTickets';
import ServiceRequests from './pages/ServiceRequests';

// Management Pages
import TaxDiscountManagement from './pages/TaxDiscountManagement';
import FeeManagement from './pages/FeeManagement';
import PaymentGateway from './pages/PaymentGateway';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            
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
              path="/guest/bookings/new"
              element={
                <PrivateRoute allowedRoles={['Guest']}>
                  <GuestCreateBooking />
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
            <Route
              path="/guest/profile"
              element={
                <PrivateRoute allowedRoles={['Guest']}>
                  <MyProfile />
                </PrivateRoute>
              }
            />
            <Route
              path="/guest/view-bill"
              element={
                <PrivateRoute allowedRoles={['Guest']}>
                  <ViewBill />
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
              path="/payment-gateway/:bookingId"
              element={
                <PrivateRoute allowedRoles={['Admin', 'Receptionist']}>
                  <PaymentGateway />
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
              path="/tax-discount"
              element={
                <PrivateRoute allowedRoles={['Admin', 'Receptionist']}>
                  <TaxDiscountManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/fees"
              element={
                <PrivateRoute allowedRoles={['Admin', 'Receptionist']}>
                  <FeeManagement />
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
