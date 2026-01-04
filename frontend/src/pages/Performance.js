import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, ProgressBar, Dropdown } from 'react-bootstrap';
import { FiAward, FiTrendingUp, FiTarget, FiMoreVertical, FiEdit2, FiStar, FiActivity } from 'react-icons/fi';
import { hrAPI } from '../services/api';
import toast from 'react-hot-toast';

const Performance = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPerformanceData();
    }, []);

    const fetchPerformanceData = async () => {
        try {
            setLoading(true);
            const response = await hrAPI.getEmployees();
            setEmployees(response.data.employees || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch performance data.');
        } finally {
            setLoading(false);
        }
    };

    const getRatingColor = (rating) => {
        if (rating >= 4.5) return 'success';
        if (rating >= 3.5) return 'primary';
        if (rating >= 2.5) return 'warning';
        return 'danger';
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
        <div className="performance-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Performance Reviews</h2>
                    <p className="text-muted mb-0">Track employee goals, KPIs, and appraisal scores.</p>
                </div>
                <Button variant="primary" className="d-flex align-items-center mt-3 mt-md-0" onClick={() => toast.success('Starting new appraisal cycle...')}>
                    <FiAward className="me-2" /> Start Review Cycle
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="g-4 mb-4">
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                                    <FiTrendingUp className="text-primary" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Avg. Performance Score</span>
                            </div>
                            <h3 className="fw-bold mb-0">4.2 / 5.0</h3>
                            <small className="text-success fw-medium">+0.3 from last quarter</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                                    <FiTarget className="text-success" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Goals Completed</span>
                            </div>
                            <h3 className="fw-bold mb-0">87%</h3>
                            <ProgressBar now={87} variant="success" className="mt-2" style={{ height: '6px' }} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                                    <FiStar className="text-info" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Top Performers</span>
                            </div>
                            <h3 className="fw-bold mb-0">12</h3>
                            <small className="text-muted">Rating above 4.5</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 py-3">
                    <h5 className="fw-bold mb-0">Employee Appraisals</h5>
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="ps-4">Employee</th>
                                    <th>Last Review</th>
                                    <th>KPI Progress</th>
                                    <th>Rating</th>
                                    <th>Status</th>
                                    <th className="text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((emp, idx) => {
                                    const mockRating = (Math.random() * (5 - 3) + 3).toFixed(1);
                                    const mockProgress = Math.floor(Math.random() * (100 - 60) + 60);
                                    return (
                                        <tr key={emp.id}>
                                            <td className="ps-4">
                                                <div className="fw-bold">{emp.user.first_name} {emp.user.last_name}</div>
                                                <div className="small text-muted">{emp.position}</div>
                                            </td>
                                            <td>
                                                <div className="small text-muted">Oct 15, 2025</div>
                                            </td>
                                            <td style={{ width: '200px' }}>
                                                <div className="d-flex align-items-center">
                                                    <ProgressBar
                                                        now={mockProgress}
                                                        variant={mockProgress > 80 ? 'success' : 'primary'}
                                                        style={{ height: '6px', flexGrow: 1 }}
                                                        className="me-2"
                                                    />
                                                    <span className="small fw-bold">{mockProgress}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <Badge bg={getRatingColor(mockRating)} className="fw-normal">
                                                    <FiStar className="me-1" /> {mockRating}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Badge bg="light" text="dark" className="border fw-normal">Completed</Badge>
                                            </td>
                                            <td className="text-end pe-4">
                                                <Dropdown align="end">
                                                    <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                                                        <FiMoreVertical size={20} />
                                                    </Dropdown.Toggle>
                                                    <Dropdown.Menu className="border-0 shadow-sm">
                                                        <Dropdown.Item className="d-flex align-items-center py-2">
                                                            <FiActivity className="me-2 text-muted" /> View KPI Details
                                                        </Dropdown.Item>
                                                        <Dropdown.Item className="d-flex align-items-center py-2">
                                                            <FiEdit2 className="me-2 text-muted" /> Edit Appraisal
                                                        </Dropdown.Item>
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Performance;
