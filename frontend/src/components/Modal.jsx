import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import '../styles/Modal.css';

const Modal = ({ isOpen, onClose, title, children, size = 'medium' }) => {
    useEffect(() => {
        console.log('Modal isOpen:', isOpen);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) {
        console.log('Modal not rendering - isOpen is false');
        return null;
    }
    
    console.log('Modal rendering with title:', title);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div 
                className={`modal-content modal-${size}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
