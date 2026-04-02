import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import { Html5Qrcode } from 'html5-qrcode';
import { playScanSound } from '../utils/sound';

const READER_ID = 'barcode-qr-reader';

const BarcodeScannerModal = ({ show, onHide, onScan, continuous = false }) => {
  const html5QrcodeRef = useRef(null);
  const isScanningRef = useRef(false);
  const [cameraError, setCameraError] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Start camera ───────────────────────────────────────────────────────────
  const startScanner = async () => {
    // If already running, do nothing
    if (isScanningRef.current) {
        console.log('Scanner already running, skipping start.');
        return;
    }

    console.log('Attempting to start scanner...');
    setCameraError(null);
    setLoading(true);

    try {
      // Always create a fresh instance (avoids stale internal state)
      if (html5QrcodeRef.current) {
        try { 
            await html5QrcodeRef.current.stop(); 
            await html5QrcodeRef.current.clear();
        } catch (_) { /* ignore */ }
        html5QrcodeRef.current = null;
      }

      // Check if element exists in DOM
      if (!document.getElementById(READER_ID)) {
          console.error(`Element #${READER_ID} not found in DOM`);
          throw new Error('Scanner container not found in DOM.');
      }

      const scanner = new Html5Qrcode(READER_ID, { verbose: false });
      html5QrcodeRef.current = scanner;

      let lastCode = '';
      let lastTime = 0;

      const config = { 
        fps: 10, 
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(minEdge * 0.7);
          return { width: size, height: size };
        },
        aspectRatio: 1.0,
        disableFlip: false
      };

      console.log('Starting html5Qrcode with config:', config);

      await scanner.start(
        { facingMode: 'environment' },   // rear camera on phones
        config,
        (decodedText) => {
          const now = Date.now();
          if (decodedText === lastCode && now - lastTime < 3000) return;
          lastCode = decodedText;
          lastTime = now;

          console.log('Barcode scanned:', decodedText);
          playScanSound(); // Play scan sound
          onScan(decodedText);
          if (!continuous) stopScanner(true);
        },
        (errorMessage) => {
            // Silence frequent frame processing errors, but maybe log rare ones
        }
      );

      console.log('Scanner started successfully!');
      isScanningRef.current = true;
    } catch (err) {
      console.error('Camera start error:', err);
      let message = 'Could not start the camera.';

      if (err && (err.name === 'NotReadableError' || err === 'Scanner already running')) {
        message =
          'Camera is already in use by another app or tab. ' +
          'Please close other apps using the camera and try again.';
      } else if (err && err.name === 'NotAllowedError') {
        message =
          'Camera permission denied. Please allow camera access in your browser settings and try again.';
      } else if (err && err.name === 'NotFoundError') {
        message = 'No camera found on this device. If you are on a smartphone, ensure you are using a browser that supports camera access (like Chrome or Safari).';
      } else if (err && typeof err === 'string') {
        if (err.includes('permission')) {
          message = 'Camera permission denied. Please allow camera access and try again.';
        }
      } else if (err && err.message) {
          message = err.message;
      }

      setCameraError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Stop camera ────────────────────────────────────────────────────────────
  const stopScanner = async (andClose = false) => {
    console.log('Stopping scanner...');
    isScanningRef.current = false;
    if (html5QrcodeRef.current) {
      try {
        await html5QrcodeRef.current.stop();
        await html5QrcodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      html5QrcodeRef.current = null;
    }
    if (andClose) onHide();
  };

  // ── Lifecycle: open / close modal ─────────────────────────────────────────
  useEffect(() => {
    if (show) {
      // Give the Modal's DOM time to be painted and displayed
      const t = setTimeout(() => startScanner(), 500);
      return () => {
          clearTimeout(t);
      };
    } else {
      stopScanner(false);
      setCameraError(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { 
        if (isScanningRef.current) {
            stopScanner(false); 
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => stopScanner(true);

  return (
    <Modal 
        show={show} 
        onHide={handleClose} 
        centered 
        backdrop="static" 
        size="md"
        className="barcode-scanner-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">Scan Barcode / QR Code</Modal.Title>
      </Modal.Header>

      <Modal.Body className="text-center p-3">
        {/* Camera error state */}
        {cameraError && (
          <Alert variant="danger" className="text-start mb-3">
            <div className="d-flex align-items-center gap-2 mb-2">
                <strong>Camera Error</strong>
            </div>
            <p className="mb-2" style={{ fontSize: '0.9rem' }}>{cameraError}</p>
            <Button size="sm" variant="danger" onClick={startScanner}>
              Retry Connection
            </Button>
          </Alert>
        )}

        {/* Scanner Container */}
        <div 
          className="position-relative overflow-hidden rounded-4 bg-black mb-2" 
          style={{ 
            minHeight: '320px',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,1)',
            border: '1px solid #333'
          }}
        >
          {/* Loading overlay */}
          {loading && !cameraError && (
            <div 
              className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-dark text-white"
              style={{ zIndex: 10, opacity: 0.9 }}
            >
              <Spinner animation="border" variant="light" className="mb-3" />
              <p className="mb-0 small">Accessing camera...</p>
            </div>
          )}

          {/* The video container — MUST be visible (not display: none) for Html5Qrcode to init correctly */}
          <div
            id={READER_ID}
            style={{ 
              width: '100%',
              backgroundColor: '#000',
              overflow: 'hidden'
            }}
          />
        </div>

        {!loading && !cameraError && (
          <div className="py-2">
            <p className="mt-2 text-muted mb-0" style={{ fontSize: '0.85rem' }}>
              Point your camera at a barcode or QR code to scan
            </p>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0">
        <Button variant="outline-secondary" className="w-100 py-2" onClick={handleClose}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BarcodeScannerModal;
