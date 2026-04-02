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
    if (isScanningRef.current) return;

    setCameraError(null);
    setLoading(true);

    try {
      // Always create a fresh instance (avoids stale internal state)
      if (html5QrcodeRef.current) {
        try { await html5QrcodeRef.current.stop(); } catch (_) { /* ignore */ }
        try { await html5QrcodeRef.current.clear(); } catch (_) { /* ignore */ }
        html5QrcodeRef.current = null;
      }

      const scanner = new Html5Qrcode(READER_ID, { verbose: false });
      html5QrcodeRef.current = scanner;

      let lastCode = '';
      let lastTime = 0;

      await scanner.start(
        { facingMode: 'environment' },   // rear camera on phones
        { fps: 10, qrbox: { width: 240, height: 140 } },
        (decodedText) => {
          const now = Date.now();
          if (decodedText === lastCode && now - lastTime < 3000) return;
          lastCode = decodedText;
          lastTime = now;

          playScanSound(); // Play scan sound
          onScan(decodedText);
          if (!continuous) stopScanner(true);
        },
        () => {} // ignore per-frame errors silently
      );

      isScanningRef.current = true;
    } catch (err) {
      console.error('Camera start error:', err);
      let message = 'Could not start the camera.';

      if (err && err.name === 'NotReadableError') {
        message =
          'Camera is already in use by another app or tab. ' +
          'Please close other apps using the camera and try again.';
      } else if (err && err.name === 'NotAllowedError') {
        message =
          'Camera permission denied. Please allow camera access in your browser settings and try again.';
      } else if (err && err.name === 'NotFoundError') {
        message = 'No camera found on this device.';
      } else if (err && typeof err === 'string') {
        // html5-qrcode sometimes rejects with a plain string
        if (err.includes('permission')) {
          message = 'Camera permission denied. Please allow camera access and try again.';
        }
      }

      setCameraError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Stop camera ────────────────────────────────────────────────────────────
  const stopScanner = async (andClose = false) => {
    isScanningRef.current = false;
    if (html5QrcodeRef.current) {
      try { await html5QrcodeRef.current.stop(); } catch (_) { /* ignore */ }
      try { await html5QrcodeRef.current.clear(); } catch (_) { /* ignore */ }
      html5QrcodeRef.current = null;
    }
    if (andClose) onHide();
  };

  // ── Lifecycle: open / close modal ─────────────────────────────────────────
  useEffect(() => {
    if (show) {
      // Give the Modal's DOM time to be painted
      const t = setTimeout(() => startScanner(), 300);
      return () => clearTimeout(t);
    } else {
      stopScanner(false);
      setCameraError(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopScanner(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => stopScanner(true);

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Scan Barcode / QR Code</Modal.Title>
      </Modal.Header>

      <Modal.Body className="text-center px-3 pb-3">
        {/* Camera error state */}
        {cameraError && (
          <Alert variant="danger" className="text-start mb-3">
            <strong>Camera Error</strong>
            <p className="mb-2 mt-1" style={{ fontSize: '0.9rem' }}>{cameraError}</p>
            <Button size="sm" variant="outline-danger" onClick={startScanner}>
              Retry
            </Button>
          </Alert>
        )}

        {/* Loading state */}
        {loading && !cameraError && (
          <div className="d-flex flex-column align-items-center py-4">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <p className="text-muted mb-0">Starting camera…</p>
          </div>
        )}

        {/* The video container — must always be in the DOM when modal is shown */}
        <div
          id={READER_ID}
          style={{
            width: '100%',
            minHeight: loading || cameraError ? '0' : '280px',
            display: loading || cameraError ? 'none' : 'block',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        />

        {!loading && !cameraError && (
          <p className="mt-3 text-muted" style={{ fontSize: '0.85rem' }}>
            Point your camera at the barcode or QR code
          </p>
        )}
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
