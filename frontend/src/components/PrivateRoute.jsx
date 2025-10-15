import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardRoute } from '../utils/helpers';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to={getDashboardRoute(user.role)} replace />;
    }

    return children;
};

export default PrivateRoute;
