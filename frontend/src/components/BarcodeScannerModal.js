import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { BrowserMultiFormatReader } from '@zxing/browser';

const BarcodeScannerModal = ({ show, onHide, onDetected }) => {
    const videoRef = useRef(null);
    const codeReaderRef = useRef(null);
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);

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

        (async () => {
            try {
                const videoInputs = await BrowserMultiFormatReader.listVideoInputDevices();
                setDevices(videoInputs);
                const deviceId = (videoInputs && videoInputs[0] && videoInputs[0].deviceId) || '';
                setSelectedDevice(deviceId);
                start(deviceId);
            } catch (err) {
                console.error('Error listing video devices:', err);
            }
        })();

        return () => { /* cleanup handled elsewhere */ };
    }, [show]);

    const start = (deviceId) => {
        if (!codeReaderRef.current) codeReaderRef.current = new BrowserMultiFormatReader();
        try {
            codeReaderRef.current.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
                if (result) {
                    const text = result.getText();
                    if (text) {
                        onDetected && onDetected(text);
                    }
                }
                // ignore continuous NotFound errors
                // console.debug(err);
            });
        } catch (err) {
            console.error('Error starting barcode scanner:', err);
        }
    };

    const stop = () => {
        try {
            if (codeReaderRef.current) codeReaderRef.current.reset();
        } catch (e) {
            // ignore
        }
    };

    const handleDeviceChange = (e) => {
        const id = e.target.value;
        stop();
        setSelectedDevice(id);
        start(id);
    };

    return (
        <Modal show={show} onHide={() => { stop(); onHide && onHide(); }} centered>
            <Modal.Header closeButton>
                <Modal.Title>Scan Barcode</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="mb-3">
                    <video ref={videoRef} style={{ width: '100%', maxHeight: '60vh' }} />
                </div>
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
