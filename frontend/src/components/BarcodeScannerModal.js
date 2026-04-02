import React, { useEffect, useRef } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { Html5QrcodeScanner } from 'html5-qrcode';

const BarcodeScannerModal = ({ show, onHide, onScan, continuous = false }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrcodeScanner = null;

    if (show) {
      // Small delay to ensure the modal's DOM element ('reader') is mounted
      setTimeout(() => {
        html5QrcodeScanner = new Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 250, height: 150 } },
          false
        );
        
        let lastScannedCode = '';
        let lastScannedTime = 0;

        html5QrcodeScanner.render(
          (decodedText) => {
            const now = Date.now();
            // Debounce: ignore exact same code for 3 seconds to avoid double-scans
            if (decodedText === lastScannedCode && now - lastScannedTime < 3000) {
                return;
            }
            lastScannedCode = decodedText;
            lastScannedTime = now;

            onScan(decodedText);

            if (!continuous) {
              handleClose();
            } else {
              // In continuous mode, give user a moment to see the scan before potentially scanning again
              // We'll rely on the natural scanning behavior rather than pause/resume
            }
          }
        );
        scannerRef.current = html5QrcodeScanner;
      }, 100);
    }

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(e => console.error("Failed to clear scanner on unmount", e));
      }
    };
  }, [show, onScan, continuous]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().then(() => {
        scannerRef.current = null;
        onHide();
      }).catch(e => {
        console.error("Failed to clear scanner", e);
        scannerRef.current = null;
        onHide();
      });
    } else {
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Scan Barcode / QR Code</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        <div id="reader" style={{ width: '100%', minHeight: '300px' }}></div>
        <p className="mt-3 text-muted">Point your camera at the barcode</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BarcodeScannerModal;
