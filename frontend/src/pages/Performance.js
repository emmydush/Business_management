import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, ProgressBar, Dropdown } from 'react-bootstrap';
import { FiAward, FiTrendingUp, FiTarget, FiMoreVertical, FiEdit2, FiStar, FiActivity } from 'react-icons/fi';
import { hrAPI } from '../services/api';
import toast from 'react-hot-toast';

const Performance = () => {
    const [employees, setEmployees] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPerformanceData();
    }, []);

    const fetchPerformanceData = async () => {
        try {
            setLoading(true);
            const response = await hrAPI.getPerformance();
            setEmployees(response.data.performance || []);
            setSummary(response.data.summary || null);
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
                            <h3 className="fw-bold mb-0">{summary ? `${summary.avg_rating.toFixed(1)} / 5.0` : (employees.length > 0 ? (employees.reduce((sum, emp) => sum + (emp.rating || 0), 0) / employees.length).toFixed(1) + ' / 5.0' : '0.0 / 5.0')}</h3>
                            {summary ? (
                                <small className={"fw-medium " + (summary.avg_rating_change >= 0 ? 'text-success' : 'text-danger')}>{`${summary.avg_rating_change >= 0 ? '+' : ''}${summary.avg_rating_change} from previous period`}</small>
                            ) : (
                                <small className="text-muted">N/A</small>
                            )}
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
                            <h3 className="fw-bold mb-0">{summary ? `${summary.goals_completed_percentage}%` : (employees.length > 0 ? Math.round((employees.reduce((sum, emp) => sum + (emp.completed_tasks || 0), 0) / employees.reduce((sum, emp) => sum + (emp.assigned_tasks || 1), 0)) * 100) + '%' : '0%')}</h3>
                            <ProgressBar now={summary ? summary.goals_completed_percentage : (employees.length > 0 ? Math.round((employees.reduce((sum, emp) => sum + (emp.completed_tasks || 0), 0) / employees.reduce((sum, emp) => sum + (emp.assigned_tasks || 1), 0)) * 100) : 0)} variant="success" className="mt-2" style={{ height: '6px' }} />
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
                            <h3 className="fw-bold mb-0">{summary ? summary.top_performers_count : employees.filter(emp => emp.rating > 4.5).length}</h3>
                            <small className="text-muted">Rating above {summary ? summary.top_rating_threshold : '4.5'}</small>
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
                                    const firstName = emp.employee?.first_name || 'Unknown';
                                    const lastName = emp.employee?.last_name || '';
                                    const position = emp.employee?.position || 'N/A';
                                    const progress = emp.attendance_rate ? Math.min(100, Math.round(emp.attendance_rate)) : 0;
                                    return (
                                        <tr key={emp.employee?.id || idx}>
                                            <td className="ps-4">
                                                <div className="fw-bold">{firstName} {lastName}</div>
                                                <div className="small text-muted">{position}</div>
                                            </td>
                                            <td>
                                                <div className="small text-muted">{emp.last_review ? new Date(emp.last_review).toLocaleDateString() : 'N/A'}</div>
                                            </td>
                                            <td style={{ width: '200px' }}>
                                                <div className="d-flex align-items-center">
                                                    <ProgressBar
                                                        now={progress}
                                                        variant={progress > 80 ? 'success' : progress > 60 ? 'primary' : 'warning'}
                                                        style={{ height: '6px', flexGrow: 1 }}
                                                        className="me-2"
                                                    />
                                                    <span className="small fw-bold">{progress}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <Badge bg={getRatingColor(emp.rating)} className="fw-normal">
                                                    <FiStar className="me-1" /> {emp.rating?.toFixed(1) || '0.0'}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Badge bg={emp.status === 'Completed' ? 'success' : emp.status === 'No Tasks' ? 'light' : 'warning'} text={emp.status === 'No Tasks' ? 'dark' : 'light'} className="border fw-normal">{emp.status}</Badge>
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
