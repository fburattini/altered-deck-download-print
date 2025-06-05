import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface ConfirmationPopupProps {
    message: string;
    onClose: () => void;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({ message, onClose }) => {
    return (
        <div className="confirmation-popup">
            <div className="popup-overlay" onClick={onClose}></div>
            <div className="popup-content">
                <div className="popup-header">
                    <div className="header-info">
                        <CheckCircleIcon className="success-icon" />
                        <h3>Success!</h3>
                    </div>
                    <button className="close-button" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>
                
                <div className="popup-body">
                    <p className="confirmation-message">{message}</p>
                </div>
                
                <div className="popup-footer">
                    <button className="confirm-button" onClick={onClose}>
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationPopup;
