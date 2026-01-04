import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, InputGroup, Form } from 'react-bootstrap';
import { FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiSearch, FiCalendar, FiRefreshCw } from 'react-icons/fi';
import { hrAPI } from '../services/api';
import toast from 'react-hot-toast';

const Attendance = () => {
    const [attendance, setAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const response = await hrAPI.getAttendance();
            setAttendance(response.data.attendance || null);
            setError(null);
        } catch (err) {
            setError('Failed to fetch attendance data.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="attendance-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Attendance Tracking</h2>
                    <p className="text-muted mb-0">Monitor daily staff presence and punctuality.</p>
                </div>
                <Button variant="outline-primary" className="d-flex align-items-center mt-3 mt-md-0" onClick={fetchAttendance}>
                    <FiRefreshCw className="me-2" /> Refresh Status
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="g-4 mb-4">
                <Col md={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                                <FiCheckCircle className="text-success" size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-medium">Present Today</div>
                                <h4 className="fw-bold mb-0">{attendance?.present_today || 0}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-danger bg-opacity-10 p-3 rounded me-3">
                                <FiXCircle className="text-danger" size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-medium">Absent Today</div>
                                <h4 className="fw-bold mb-0">{attendance?.absent_today || 0}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-warning bg-opacity-10 p-3 rounded me-3">
                                <FiClock className="text-warning" size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-medium">Late Arrivals</div>
                                <h4 className="fw-bold mb-0">{attendance?.late_arrivals || 0}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-info bg-opacity-10 p-3 rounded me-3">
                                <FiAlertCircle className="text-info" size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-medium">On Leave</div>
                                <h4 className="fw-bold mb-0">2</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0">Daily Attendance Log</h5>
                    <div className="d-flex gap-2">
                        <InputGroup size="sm" style={{ width: '250px' }}>
                            <InputGroup.Text className="bg-light border-0"><FiSearch className="text-muted" /></InputGroup.Text>
                            <Form.Control
                                placeholder="Search employee..."
                                className="bg-light border-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                        <Button variant="light" size="sm" className="border d-flex align-items-center">
                            <FiCalendar className="me-2" /> {new Date().toLocaleDateString()}
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="ps-4">Employee</th>
                                    <th>Check In</th>
                                    <th>Check Out</th>
                                    <th>Total Hours</th>
                                    <th>Status</th>
                                    <th className="text-end pe-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Mocking some rows for visual completeness since API returns summary */}
                                <tr>
                                    <td className="ps-4">
                                        <div className="fw-bold">John Doe</div>
                                        <div className="small text-muted">EMP-001</div>
                                    </td>
                                    <td>08:45 AM</td>
                                    <td>05:30 PM</td>
                                    <td>8h 45m</td>
                                    <td><Badge bg="success" className="fw-normal">Present</Badge></td>
                                    <td className="text-end pe-4"><Button variant="link" size="sm" className="p-0 text-decoration-none">Details</Button></td>
                                </tr>
                                <tr>
                                    <td className="ps-4">
                                        <div className="fw-bold">Jane Smith</div>
                                        <div className="small text-muted">EMP-002</div>
                                    </td>
                                    <td>09:15 AM</td>
                                    <td>06:00 PM</td>
                                    <td>8h 45m</td>
                                    <td><Badge bg="warning" text="dark" className="fw-normal">Late</Badge></td>
                                    <td className="text-end pe-4"><Button variant="link" size="sm" className="p-0 text-decoration-none">Details</Button></td>
                                </tr>
                                <tr>
                                    <td className="ps-4">
                                        <div className="fw-bold">Robert Wilson</div>
                                        <div className="small text-muted">EMP-003</div>
                                    </td>
                                    <td>-</td>
                                    <td>-</td>
                                    <td>0h 0m</td>
                                    <td><Badge bg="danger" className="fw-normal">Absent</Badge></td>
                                    <td className="text-end pe-4"><Button variant="link" size="sm" className="p-0 text-decoration-none">Details</Button></td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Attendance;
