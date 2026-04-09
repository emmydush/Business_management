import React from 'react';
import { createRoot } from 'react-dom/client';
import Dialog from './Dialog';

let dialogRoot = null;
let dialogContainer = null;

const initializeDialogRoot = () => {
  if (!dialogRoot) {
    dialogContainer = document.createElement('div');
    dialogContainer.id = 'dialog-container';
    document.body.appendChild(dialogContainer);
    dialogRoot = createRoot(dialogContainer);
  }
};

const DialogService = {
  /**
   * Show a confirmation dialog
   * @param {Object} options - Dialog options
   * @param {string} options.title - Dialog title
   * @param {string} options.message - Dialog message
   * @param {string} options.confirmText - Confirm button text
   * @param {string} options.cancelText - Cancel button text
   * @param {Function} options.onConfirm - Callback when confirmed
   * @param {Function} options.onCancel - Callback when cancelled
   * @param {string} options.type - Dialog type (info, success, warning, error)
   * @param {string} options.size - Dialog size (sm, md, lg)
   * @returns {Promise} - Resolves with true if confirmed, false if cancelled
   */
  confirm: (options = {}) => {
    console.log('DialogService.confirm called with options:', options);
    return new Promise((resolve) => {
      try {
        initializeDialogRoot();
        console.log('Dialog root initialized');
        
        const {
          title = 'Confirm Action',
          message = 'Are you sure you want to proceed?',
          confirmText = 'Confirm',
          cancelText = 'Cancel',
          type = 'info',
          size = 'md'
        } = options;

        const handleConfirm = () => {
          console.log('Dialog confirmed by user');
          resolve(true);
          if (options.onConfirm) options.onConfirm();
          if (dialogRoot) {
            dialogRoot.unmount();
            dialogRoot = null;
          }
          if (dialogContainer && dialogContainer.parentNode) {
            dialogContainer.parentNode.removeChild(dialogContainer);
          }
          dialogContainer = null;
        };

        const handleCancel = () => {
          console.log('Dialog cancelled by user');
          resolve(false);
          if (options.onCancel) options.onCancel();
          if (dialogRoot) {
            dialogRoot.unmount();
            dialogRoot = null;
          }
          if (dialogContainer && dialogContainer.parentNode) {
            dialogContainer.parentNode.removeChild(dialogContainer);
          }
          dialogContainer = null;
        };

        const dialogElement = (
          <Dialog
            show={true}
            onHide={handleCancel}
            title={title}
            message={message}
            type={type}
            confirmText={confirmText}
            cancelText={cancelText}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            showCancel={true}
            size={size}
          />
        );

        console.log('Rendering dialog element');
        dialogRoot.render(dialogElement);
      } catch (error) {
        console.error('Error in DialogService.confirm:', error);
        resolve(false);
      }
    });
  },

  /**
   * Show an alert dialog
   * @param {Object} options - Dialog options
   * @param {string} options.title - Dialog title
   * @param {string} options.message - Dialog message
   * @param {string} options.confirmText - Confirm button text
   * @param {string} options.type - Dialog type (info, success, warning, error)
   * @param {string} options.size - Dialog size (sm, md, lg)
   * @returns {Promise} - Resolves when dialog is closed
   */
  alert: (options = {}) => {
    return new Promise((resolve) => {
      initializeDialogRoot();
      
      const {
        title = 'Information',
        message = '',
        confirmText = 'OK',
        type = 'info',
        size = 'md'
      } = options;

      const handleConfirm = () => {
        resolve();
        if (options.onConfirm) options.onConfirm();
        if (dialogRoot) {
          dialogRoot.unmount();
          dialogRoot = null;
        }
        if (dialogContainer && dialogContainer.parentNode) {
          dialogContainer.parentNode.removeChild(dialogContainer);
        }
        dialogContainer = null;
      };

      const dialogElement = (
        <Dialog
          show={true}
          onHide={handleConfirm}
          title={title}
          message={message}
          type={type}
          confirmText={confirmText}
          onConfirm={handleConfirm}
          showCancel={false}
          size={size}
        />
      );

      dialogRoot.render(dialogElement);
    });
  },

  /**
   * Show a success dialog
   * @param {string} message - Success message
   * @param {string} title - Dialog title (optional)
   */
  success: (message, title = 'Success') => {
    return DialogService.alert({
      title,
      message,
      type: 'success'
    });
  },

  /**
   * Show an error dialog
   * @param {string} message - Error message
   * @param {string} title - Dialog title (optional)
   */
  error: (message, title = 'Error') => {
    return DialogService.alert({
      title,
      message,
      type: 'error'
    });
  },

  /**
   * Show a warning dialog
   * @param {string} message - Warning message
   * @param {string} title - Dialog title (optional)
   */
  warning: (message, title = 'Warning') => {
    return DialogService.alert({
      title,
      message,
      type: 'warning'
    });
  },

  /**
   * Show an info dialog
   * @param {string} message - Info message
   * @param {string} title - Dialog title (optional)
   */
  info: (message, title = 'Information') => {
    return DialogService.alert({
      title,
      message,
      type: 'info'
    });
  },

  /**
   * Show a custom dialog with custom buttons
   * @param {Object} options - Dialog options
   * @param {Function} options.renderButtons - Function that renders custom buttons
   * @returns {Promise} - Resolves when dialog is closed
   */
  custom: (options = {}) => {
    return new Promise((resolve) => {
      initializeDialogRoot();
      
      const {
        title = 'Dialog',
        message = '',
        type = 'info',
        size = 'md',
        renderButtons
      } = options;

      const handleClose = () => {
        resolve();
        if (options.onClose) options.onClose();
        if (dialogRoot) {
          dialogRoot.unmount();
          dialogRoot = null;
        }
        if (dialogContainer && dialogContainer.parentNode) {
          dialogContainer.parentNode.removeChild(dialogContainer);
        }
        dialogContainer = null;
      };

      const dialogElement = (
        <Dialog
          show={true}
          onHide={handleClose}
          title={title}
          message={message}
          type={type}
          size={size}
          customButtons={renderButtons}
        />
      );

      dialogRoot.render(dialogElement);
    });
  }
};

export default DialogService;
