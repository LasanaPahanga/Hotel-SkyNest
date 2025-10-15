import React from 'react';
import '../styles/StatCard.css';

const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle = null }) => {
    return (
        <div className={`stat-card stat-card-${color}`}>
            <div className="stat-card-content">
                <div className="stat-card-text">
                    <h4 className="stat-card-title">{title}</h4>
                    <p className="stat-card-value">{value}</p>
                    {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
                </div>
                {Icon && (
                    <div className="stat-card-icon">
                        <Icon />
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;
