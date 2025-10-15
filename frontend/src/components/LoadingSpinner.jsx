import React from 'react';
import '../styles/LoadingSpinner.css';

const LoadingSpinner = ({ message = 'Loading...' }) => {
    return (
        <div className="loading-spinner-container">
            <div className="spinner"></div>
            <p className="loading-message">{message}</p>
        </div>
    );
};

export default LoadingSpinner;
