import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { BrowserMultiFormatReader } from '@zxing/browser';

const BarcodeScannerModal = ({ show, onHide, onDetected }) => {
    const videoRef = useRef(null);
    const codeReaderRef = useRef(null);
    const detectedRef = useRef(false); // prevent duplicate detections
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [manualBarcode, setManualBarcode] = useState('');
    const [showManualInput, setShowManualInput] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [lastDetected, setLastDetected] = useState(null);
    const [videoLoading, setVideoLoading] = useState(false);
    const streamRef = useRef(null);

    useEffect(() => {
        codeReaderRef.current = new BrowserMultiFormatReader();
        return () => {
            stop();
            if (codeReaderRef.current) {
                try { codeReaderRef.current.reset(); } catch (e) { /* ignore */ }
            }
        };
    }, []);

    useEffect(() => {
        if (!show) {
            stop();
            return;
        }

        console.log('🎬 Opening barcode scanner modal');
        
        // Reset duplicate-detection guard when modal opens
        detectedRef.current = false;
        setErrorMessage(null);
        setManualBarcode('');
        setShowManualInput(false);

        (async () => {
            try {
                console.log('📹 Getting video devices...');
                const videoInputs = await BrowserMultiFormatReader.listVideoInputDevices();
                console.log('📹 Found video devices:', videoInputs);
                setDevices(videoInputs);
                
                if (!videoInputs || videoInputs.length === 0) {
                    console.error('❌ No camera devices found');
                    setErrorMessage('No camera devices detected. Please connect a camera and refresh the page.');
                    return;
                }
                
                const deviceId = (videoInputs[0] && videoInputs[0].deviceId) || '';
                console.log('📹 Selected camera device:', deviceId);
                setSelectedDevice(deviceId);
                
                // Small delay to ensure DOM is ready
                setTimeout(() => {
                    start(deviceId);
                }, 100);
                
            } catch (err) {
                console.error('❌ Error listing video devices:', err);
                setErrorMessage('Error accessing camera devices. Please check browser permissions and try again.');
            }
        })();

        return () => { /* cleanup handled elsewhere */ };
    }, [show]);

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualBarcode.trim()) {
            console.log('🔢 Manual barcode entered:', manualBarcode.trim());
            onDetected && onDetected(manualBarcode.trim());
            setManualBarcode('');
        }
    };

    const start = (deviceId) => {
        console.log('🚀 Starting continuous barcode scanner with device:', deviceId);
        setIsScanning(true);
        setLastDetected(null);
        setVideoLoading(true);
        
        if (!codeReaderRef.current) {
            console.log('🔧 Creating new BrowserMultiFormatReader');
            codeReaderRef.current = new BrowserMultiFormatReader();
        }
        
        // Verify video element exists
        if (!videoRef.current) {
            console.error('❌ Video element not found');
            setErrorMessage('Camera element not ready. Please try again.');
            setIsScanning(false);
            setVideoLoading(false);
            return;
        }
        
        try {
            setErrorMessage(null);
            console.log('📹 Requesting camera access and starting video stream...');
            
            // First, get the video stream directly to ensure it's working
            const videoConstraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facing: 'environment' // Prefer rear camera on mobile
                }
            };
            
            navigator.mediaDevices.getUserMedia({ 
                video: videoConstraints,
                audio: false 
            })
            .then(stream => {
                console.log('✅ Video stream obtained successfully');
                streamRef.current = stream;
                setVideoLoading(false);
                
                // Attach stream to video element
                videoRef.current.srcObject = stream;
                
                // Handle video play with proper error handling
                videoRef.current.play()
                    .then(() => {
                        console.log('▶️ Video playing successfully');
                        setIsScanning(true);
                        
                        // Now start barcode detection
                        codeReaderRef.current.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
                            if (result) {
                                const text = result.getText();
                                if (text && text.trim()) {
                                    console.log('✅ Barcode detected:', text);
                                    
                                    // Only stop scanning briefly to prevent duplicate detections
                                    detectedRef.current = true;
                                    setLastDetected(text.trim());
                                    
                                    // Call the detection callback
                                    onDetected && onDetected(text.trim());
                                    
                                    // Brief delay before allowing new detections
                                    setTimeout(() => {
                                        detectedRef.current = false;
                                        console.log('🔄 Ready for next barcode scan');
                                    }, 1000); // 1 second delay between scans
                                }
                            }
                            if (err) {
                                const name = err.name || '';
                                
                                // Don't log frequent not-found errors as they're normal
                                if (name === 'NotFoundException' || name === 'NotFoundError') {
                                    // No barcode in view - this is normal
                                    return;
                                } else if (name === 'NotAllowedError' || name === 'NotAllowed') {
                                    console.error('🚫 Camera permission denied:', err);
                                    setErrorMessage('Camera access was denied. Please allow camera access for this site and refresh the page.');
                                    setIsScanning(false);
                                } else if (name === 'NotReadableError' || name === 'NotReadable') {
                                    console.error('📵 Camera already in use:', err);
                                    setErrorMessage('Camera is already being used by another application. Please close other apps using the camera.');
                                    setIsScanning(false);
                                } else if (name === 'OverconstrainedError' || name === 'Overconstrained') {
                                    console.error('⚠️ Camera constraints not satisfied:', err);
                                    setErrorMessage('Camera cannot be used with current settings. Please try a different camera or browser.');
                                    setIsScanning(false);
                                } else {
                                    console.error('❓ Unknown barcode error:', err);
                                    setErrorMessage(`Barcode scanning error: ${name}. Please try again.`);
                                }
                            }
                        });
                    })
                    .catch(playError => {
                        console.error('❌ Error playing video:', playError);
                        setErrorMessage('Failed to start video playback. Please try again.');
                        setIsScanning(false);
                    });
            })
            .catch(err => {
                console.error('❌ Error accessing camera:', err);
                setVideoLoading(false);
                if (err.name === 'NotAllowedError' || err.name === 'NotAllowed') {
                    setErrorMessage('Camera access was denied. Please allow camera access for this site and refresh the page.');
                } else if (err.name === 'NotFoundError' || err.name === 'NotFoundError') {
                    setErrorMessage('No camera device found. Please connect a camera and try again.');
                } else if (err.name === 'NotReadableError' || err.name === 'NotReadable') {
                    setErrorMessage('Camera is already in use by another application. Please close other apps using the camera.');
                } else {
                    setErrorMessage(`Camera error: ${err.name || 'Unknown error'}. Please check camera permissions.`);
                }
                setIsScanning(false);
            });
            
        } catch (err) {
            console.error('❌ Error starting barcode scanner:', err);
            setVideoLoading(false);
            setErrorMessage('Failed to start camera. Please check camera permissions and ensure no other app is using the camera.');
            setIsScanning(false);
        }
    };

    const stop = () => {
        console.log('🛑 Stopping barcode scanner');
        
        // Stop video stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                console.log('🔄 Stopping video track:', track);
                track.stop();
            });
            streamRef.current = null;
        }
        
        // Clear video element
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.pause();
        }
        
        // Stop barcode reader
        try {
            if (codeReaderRef.current) codeReaderRef.current.reset();
        } catch (e) {
            console.warn('⚠️ Error stopping scanner:', e);
        }
        
        // Reset all states
        setErrorMessage(null);
        setIsScanning(false);
        setVideoLoading(false);
        setLastDetected(null);
    };

    const handleDeviceChange = (e) => {
        const id = e.target.value;
        stop();
        setSelectedDevice(id);
        start(id);
    };

    return (
        <Modal show={show} onHide={() => { stop(); setErrorMessage(null); onHide && onHide(); }} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Scan Barcode</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* Camera Scanner Section */}
                {!showManualInput && (
                    <div className="mb-4">
                        <h6 className="mb-3">📷 Camera Scanner</h6>
                        <div className="mb-3 position-relative">
                            {/* Loading Overlay */}
                            {videoLoading && (
                                <div className="position-absolute top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center" 
                                     style={{ background: 'rgba(0, 0, 0, 0.8)', borderRadius: '8px' }}>
                                    <div className="text-center">
                                        <div className="mb-2">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Loading camera...</span>
                                            </div>
                                        </div>
                                        <small className="text-white">📹 Initializing camera...</small>
                                    </div>
                                </div>
                            )}
                            
                            {/* Scanning Indicator */}
                            {!videoLoading && isScanning && (
                                <div className="position-absolute top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center" 
                                     style={{ background: 'rgba(40, 167, 69, 0.1)', borderRadius: '8px' }}>
                                    <div className="text-center">
                                        <div className="mb-2">
                                            <div className="spinner-border text-light" role="status">
                                                <span className="visually-hidden">Scanning...</span>
                                            </div>
                                        </div>
                                        <small className="text-white">📷 Point camera at barcode to scan</small>
                                        {lastDetected && (
                                            <div className="alert alert-success mt-2 mb-0">
                                                <strong>✅ Last Scanned:</strong> {lastDetected}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            <video 
                                ref={videoRef} 
                                style={{ 
                                    width: '100%', 
                                    maxHeight: '60vh', 
                                    borderRadius: '8px',
                                    border: !videoLoading && isScanning ? '3px solid #28a745' : '3px solid #dee2e6',
                                    opacity: videoLoading ? 0.5 : 1
                                }} 
                            />
                        </div>
                        {errorMessage && <div className="alert alert-warning small">{errorMessage}</div>}
                        {devices && devices.length > 1 && (
                            <Form.Group className="mb-3">
                                <Form.Label className="small">Camera</Form.Label>
                                <Form.Select value={selectedDevice} onChange={handleDeviceChange}>
                                    {devices.map(d => (
                                        <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        )}
                        <div className="d-flex gap-2">
                            <Button variant="outline-secondary" onClick={() => setShowManualInput(true)}>
                                🔢 Manual Entry
                            </Button>
                            <Button variant="outline-danger" onClick={() => { stop(); onHide && onHide(); }}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {/* Manual Input Section */}
                {showManualInput && (
                    <div>
                        <h6 className="mb-3">🔢 Manual Barcode Entry</h6>
                        <Form onSubmit={handleManualSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Enter Barcode/SKU/Product ID</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={manualBarcode}
                                    onChange={(e) => setManualBarcode(e.target.value)}
                                    placeholder="Enter barcode number, SKU, or product ID"
                                    autoFocus
                                />
                            </Form.Group>
                            <div className="d-flex gap-2">
                                <Button type="submit" variant="primary">
                                    🔍 Search Product
                                </Button>
                                <Button variant="outline-secondary" onClick={() => setShowManualInput(false)}>
                                    📷 Use Camera
                                </Button>
                                <Button variant="outline-danger" onClick={() => { stop(); onHide && onHide(); }}>
                                    Cancel
                                </Button>
                            </div>
                        </Form>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default BarcodeScannerModal;
