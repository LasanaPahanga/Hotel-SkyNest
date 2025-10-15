import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaExclamationTriangle } from 'react-icons/fa';
import '../styles/NotFound.css';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="not-found-page">
            <div className="not-found-content">
                <FaExclamationTriangle className="not-found-icon" />
                <h1>404</h1>
                <h2>Page Not Found</h2>
                <p>The page you're looking for doesn't exist.</p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>
                    Go Home
                </button>
            </div>
        </div>
    );
};

export default NotFound;
