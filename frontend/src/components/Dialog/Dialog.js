import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import './Dialog.css';

const Dialog = ({
  show,
  onHide,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  showCancel = false,
  size = 'md',
  icon = null,
  customButtons = null
}) => {
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onHide();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onHide();
  };

  const getDialogIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'info':
      default:
        return 'info';
    }
  };

  const getDialogVariant = () => {
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'danger';
      case 'info':
      default:
        return 'primary';
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered 
      size={size}
      className="custom-dialog"
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header className={`dialog-header-${getDialogVariant()}`} closeButton>
        <Modal.Title className="d-flex align-items-center">
          <span className={`dialog-icon dialog-icon-${getDialogIcon()}`}>
            {type === 'success' && ' success'}
            {type === 'warning' && ' warning'}
            {type === 'error' && ' error'}
            {type === 'info' && ' info'}
          </span>
          {title}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="dialog-body">
        <div className="dialog-content">
          {message}
        </div>
      </Modal.Body>
      
      <Modal.Footer className="dialog-footer">
        {customButtons ? (
          customButtons({ onConfirm, handleCancel, onHide })
        ) : (
          <>
            {showCancel && (
              <Button 
                variant="secondary" 
                onClick={handleCancel}
                className="dialog-btn-cancel"
              >
                {cancelText}
              </Button>
            )}
            <Button 
              variant={getDialogVariant()} 
              onClick={handleConfirm}
              className="dialog-btn-confirm"
            >
              {confirmText}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default Dialog;
