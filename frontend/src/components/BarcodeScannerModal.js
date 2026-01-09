import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

const BarcodeScannerModal = ({ show, onHide, onDetected }) => {
    // Scanner component using @zxing/browser
    const videoRef = useRef(null);
    const codeReaderRef = useRef(null);
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);

    const stopScanning = () => {
        if (codeReaderRef.current) {
            try {
                // Stop the continuous decode
                if (typeof codeReaderRef.current.reset === 'function') {
                    codeReaderRef.current.reset();
                } else if (typeof codeReaderRef.current.stopContinuousDecode === 'function') {
                    codeReaderRef.current.stopContinuousDecode();
                }
                // Stop all video streams
                if (videoRef.current && videoRef.current.srcObject) {
                    const stream = videoRef.current.srcObject;
                    const tracks = stream.getTracks();
                    tracks.forEach(track => track.stop());
                    videoRef.current.srcObject = null;
                }
            } catch (err) {
                console.error('Error stopping scanner:', err);
            }
        }
        setScanning(false);
    };

    useEffect(() => {
        const hints = new Map();
        // Expanded list of supported barcode formats
        const formats = [
            BarcodeFormat.QR_CODE,
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.ITF,
            BarcodeFormat.DATA_MATRIX,
            BarcodeFormat.AZTEC,
            BarcodeFormat.PDF_417,
            BarcodeFormat.CODABAR
        ];
        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
        hints.set(DecodeHintType.TRY_HARDER, true);
        // Add TRY_HARDER hint to improve detection
        hints.set(DecodeHintType.ASSUME_GS1, false);
        
        codeReaderRef.current = new BrowserMultiFormatReader(hints);

        return () => {
            stopScanning();
        };
    }, []);

    useEffect(() => {
        if (!show) {
            stopScanning();
            return;
        }

        const initScanner = async () => {
            setLoading(true);
            setError(null);
            try {
                // Request camera permissions first
                await navigator.mediaDevices.getUserMedia({ video: true });
                
                const videoInputs = await BrowserMultiFormatReader.listVideoInputDevices();
                setDevices(videoInputs);

                if (videoInputs && videoInputs.length > 0) {
                    // Prefer front camera for better barcode scanning
                    const frontCamera = videoInputs.find(d =>
                        /front|user|face/i.test(d.label)
                    );
                    const backCamera = videoInputs.find(d =>
                        /back|rear|environment/i.test(d.label)
                    );
                    
                    // Use front camera if available, otherwise back camera
                    const deviceId = frontCamera ? frontCamera.deviceId : (backCamera ? backCamera.deviceId : videoInputs[0].deviceId);
                    setSelectedDevice(deviceId);

                    // Small delay to ensure video element is ready in DOM
                    setTimeout(() => {
                        start(deviceId);
                        setLoading(false);
                    }, 500);
                } else {
                    setError('No camera found on this device.');
                    setLoading(false);
                }
            } catch (err) {
                console.error('Error initializing camera:', err);
                if (err.name === 'NotAllowedError') {
                    setError('Camera access denied. Please allow camera permissions in your browser settings.');
                } else if (err.name === 'NotFoundError') {
                    setError('No camera found on this device.');
                } else {
                    setError('Camera initialization failed: ' + err.message);
                }
                setLoading(false);
            }
        };

        initScanner();
    }, [show]);

    const start = async (deviceId) => {
        if (!codeReaderRef.current || !videoRef.current) {
            console.error('CodeReader or video element not ready');
            return;
        }

        if (scanning) {
            console.log('Already scanning, stopping first...');
            stopScanning();
        }

        try {
            console.log('Starting barcode scanner with device:', deviceId);
            setScanning(true);
            setError(null); // Clear any previous errors

            // Use decodeFromVideoDevice which handles continuous scanning
            await codeReaderRef.current.decodeFromVideoDevice(
                deviceId,
                videoRef.current,
                (result, error, contents) => {
                    if (result) {
                        const text = result.getText();
                        console.log('Barcode detected:', text);
                        if (text && text.trim() !== '') {
                            // Success! Call the callback
                            if (onDetected) {
                                onDetected(text);
                                // Close the modal after successful scan
                                handleClose();
                            }
                        }
                    } else if (error && error.name !== 'NotFoundException') {
                        // Log errors but don't show them to the user as they're common during scanning
                        console.debug('Scanner debug:', error);
                    }
                }
            );
        } catch (err) {
            console.error('Error starting barcode scanner:', err);
            setError('Failed to start the camera stream. ' + err.message);
            setScanning(false);
        }
    };

    const handleDeviceChange = (e) => {
        const id = e.target.value;
        stopScanning();
        setSelectedDevice(id);
        start(id);
    };

    const handleClose = () => {
        stopScanning();
        onHide && onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="md" className="barcode-scanner-modal">
            <Modal.Header closeButton className="border-0 bg-white">
                <Modal.Title className="fw-bold">Scan Barcode</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0 overflow-hidden bg-black position-relative" style={{ minHeight: '350px' }}>
                {loading && (
                    <div className="position-absolute top-50 start-50 translate-middle text-center z-index-10">
                        <Spinner animation="border" variant="primary" />
                        <p className="text-white mt-2 small">Initializing camera...</p>
                    </div>
                )}

                <video
                    ref={videoRef}
                    className="w-100 h-100"
                    style={{ objectFit: 'cover', minHeight: '350px' }}
                    playsInline
                    muted
                />

                {/* Scanning UI Overlay */}
                {!loading && !error && (
                    <div className="scanner-ui">
                        <div className="scanner-target">
                            <div className="corner top-left"></div>
                            <div className="corner top-right"></div>
                            <div className="corner bottom-left"></div>
                            <div className="corner bottom-right"></div>
                            <div className="scan-line"></div>
                        </div>
                        <div className="scanner-hint">
                            Align barcode within the frame
                        </div>
                    </div>
                )}

                {error && (
                    <div className="position-absolute top-50 start-50 translate-middle text-center w-75">
                        <div className="bg-danger bg-opacity-75 text-white p-3 rounded-3 shadow">
                            <p className="mb-0 small">{error}</p>
                            <Button variant="light" size="sm" className="mt-2" onClick={() => window.location.reload()}>
                                Reload Page
                            </Button>
                        </div>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer className="bg-white border-0 d-flex flex-column align-items-stretch">
                {devices && devices.length > 1 && (
                    <Form.Group className="mb-3">
                        <Form.Label className="extra-small fw-bold text-muted text-uppercase mb-1">Select Camera</Form.Label>
                        <Form.Select size="sm" value={selectedDevice} onChange={handleDeviceChange} className="border-0 bg-light">
                            {devices.map(d => (
                                <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 5)}`}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                )}
                <Button variant="light" onClick={handleClose} className="fw-bold">Cancel</Button>
            </Modal.Footer>

            <style dangerouslySetInnerHTML={{
                __html: `
                .barcode-scanner-modal .modal-content {
                    border-radius: 20px;
                    overflow: hidden;
                    border: none;
                }
                .scanner-ui {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    pointer-events: none;
                }
                .scanner-target {
                    position: relative;
                    width: 260px;
                    height: 180px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 15px;
                    background: rgba(0, 0, 0, 0.1);
                }
                .corner {
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    border: 3px solid #0d6efd;
                }
                .top-left { top: -2px; left: -2px; border-right: 0; border-bottom: 0; border-top-left-radius: 12px; }
                .top-right { top: -2px; right: -2px; border-left: 0; border-bottom: 0; border-top-right-radius: 12px; }
                .bottom-left { bottom: -2px; left: -2px; border-right: 0; border-top: 0; border-bottom-left-radius: 12px; }
                .bottom-right { bottom: -2px; right: -2px; border-left: 0; border-top: 0; border-bottom-right-radius: 12px; }
                
                .scan-line {
                    position: absolute;
                    top: 50%;
                    left: 10%;
                    width: 80%;
                    height: 2px;
                    background: #0d6efd;
                    box-shadow: 0 0 10px #0d6efd;
                    animation: scan-move 2s infinite ease-in-out;
                }
                @keyframes scan-move {
                    0%, 100% { top: 15%; opacity: 0.5; }
                    50% { top: 85%; opacity: 1; }
                }
                .scanner-hint {
                    margin-top: 20px;
                    background: rgba(0, 0, 0, 0.6);
                    color: white;
                    padding: 6px 16px;
                    border-radius: 20px;
                    font-size: 12px;
                    backdrop-filter: blur(4px);
                }
                .extra-small { font-size: 10px; }
                .z-index-10 { z-index: 10; }
            `}} />
        </Modal>
    );
};

export default BarcodeScannerModal;
