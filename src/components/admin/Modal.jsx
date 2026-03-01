import React from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  details,
  onConfirm,
  confirmText,
  cancelText,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={48} className="modal-icon success" />;
      case 'error':
        return <XCircle size={48} className="modal-icon error" />;
      case 'warning':
        return <AlertTriangle size={48} className="modal-icon warning" />;
      case 'confirm':
        return <AlertTriangle size={48} className="modal-icon confirm" />;
      default:
        return <Info size={48} className="modal-icon info" />;
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal-container ${type}`}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-icon-wrapper">{getIcon()}</div>

        {title && <h2 className="modal-title">{title}</h2>}

        <div className="modal-message">{message}</div>

        {details && (
          <div className="modal-details">
            {Object.entries(details).map(([key, value]) => (
              <div key={key} className="modal-detail-row">
                <span className="detail-label">{key}:</span>
                <span className="detail-value">{value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          {onConfirm ? (
            <>
              <button className="modal-btn cancel" onClick={onClose}>
                {cancelText || 'Cancel'}
              </button>
              <button className="modal-btn confirm" onClick={onConfirm}>
                {confirmText || 'Confirm'}
              </button>
            </>
          ) : (
            <button className="modal-btn primary" onClick={onClose}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
