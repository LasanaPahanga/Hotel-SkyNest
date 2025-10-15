import React from 'react';
import '../styles/Card.css';

const Card = ({ title, children, className = '', actions = null }) => {
    return (
        <div className={`card ${className}`}>
            {(title || actions) && (
                <div className="card-header">
                    {title && <h3 className="card-title">{title}</h3>}
                    {actions && <div className="card-actions">{actions}</div>}
                </div>
            )}
            <div className="card-body">
                {children}
            </div>
        </div>
    );
};

export default Card;
