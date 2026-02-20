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

        // Reset duplicate-detection guard when modal opens
        detectedRef.current = false;

        (async () => {
            try {
                const videoInputs = await BrowserMultiFormatReader.listVideoInputDevices();
                setDevices(videoInputs);
                if (!videoInputs || videoInputs.length === 0) {
                    setErrorMessage('No camera devices detected.');
                    return;
                }
                const deviceId = (videoInputs[0] && videoInputs[0].deviceId) || '';
                setSelectedDevice(deviceId);
                setErrorMessage(null);
                start(deviceId);
            } catch (err) {
                console.error('Error listing video devices:', err);
                setErrorMessage('Error accessing camera devices. Check browser permissions.');
            }
        })();

        return () => { /* cleanup handled elsewhere */ };
    }, [show]);

    const start = (deviceId) => {
        if (!codeReaderRef.current) codeReaderRef.current = new BrowserMultiFormatReader();
        try {
            codeReaderRef.current.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
                if (result && !detectedRef.current) {
                    const text = result.getText();
                    if (text) {
                        // mark detected and stop further scanning immediately
                        console.debug && console.debug('BarcodeScannerModal detected:', text, Date.now());
                        detectedRef.current = true;
                        try { codeReaderRef.current.reset(); } catch (e) { /* ignore */ }
                        onDetected && onDetected(text);
                    }
                }
                if (err) {
                    const name = err.name || '';
                    // ignore frequent not-found errors
                    if (name === 'NotFoundException' || name === 'NotFoundError') {
                        // no-op
                    } else if (name === 'NotAllowedError' || name === 'NotAllowed') {
                        console.error('Camera permission denied:', err);
                        setErrorMessage('Camera access was denied. Please allow camera access for this site.');
                        stop();
                    } else {
                        console.error('Barcode scan error:', err);
                    }
                }
            });
        } catch (err) {
            console.error('Error starting barcode scanner:', err);
            setErrorMessage('Failed to start camera. Check browser permissions or device status.');
        }
    };

    const stop = () => {
        try {
            if (codeReaderRef.current) codeReaderRef.current.reset();
        } catch (e) {
            // ignore
        }
        setErrorMessage(null);
    };

    const handleDeviceChange = (e) => {
        const id = e.target.value;
        stop();
        setSelectedDevice(id);
        start(id);
    };

    return (
        <Modal show={show} onHide={() => { stop(); setErrorMessage(null); onHide && onHide(); }} centered>
            <Modal.Header closeButton>
                <Modal.Title>Scan Barcode</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="mb-3">
                    <video ref={videoRef} style={{ width: '100%', maxHeight: '60vh' }} />
                </div>
                {errorMessage && <div className="alert alert-warning small">{errorMessage}</div>}
                {devices && devices.length > 1 && (
                    <Form.Group>
                        <Form.Label className="small">Camera</Form.Label>
                        <Form.Select value={selectedDevice} onChange={handleDeviceChange}>
                            {devices.map(d => (
                                <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => { stop(); onHide && onHide(); }}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default BarcodeScannerModal;
