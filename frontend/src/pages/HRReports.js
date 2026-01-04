import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, ProgressBar } from 'react-bootstrap';
import { FiUsers, FiDownload, FiPieChart, FiTrendingUp, FiCalendar, FiActivity } from 'react-icons/fi';
import { hrAPI, reportsAPI } from '../services/api';
import toast from 'react-hot-toast';

const HRReports = () => {
    const [hrReport, setHrReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchHRData();
    }, []);

    const fetchHRData = async () => {
        try {
            setLoading(true);
            const response = await reportsAPI.getHrReport();
            setHrReport(response.data.hr_report || null);
            setError(null);
        } catch (err) {
            setError('Failed to fetch HR report data.');
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
        <div className="hr-reports-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">HR & Workforce Reports</h2>
                    <p className="text-muted mb-0">Analyze employee demographics, attendance, and retention.</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-secondary" className="d-flex align-items-center" onClick={() => toast.success('Exporting HR Report...')}>
                        <FiDownload className="me-2" /> Export PDF
                    </Button>
                    <Button variant="primary" className="d-flex align-items-center" onClick={fetchHRData}>
                        <FiActivity className="me-2" /> Refresh Data
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="g-4 mb-4">
                <Col lg={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Total Employees</div>
                            <h3 className="fw-bold mb-0">{hrReport ? hrReport.total_employees : '0'}</h3>
                            <div className="text-success small fw-bold"><FiTrendingUp /> {hrReport ? '+' + (hrReport.total_employees - 20) : '+0'} this month</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Active Today</div>
                            <h3 className="fw-bold mb-0">{hrReport ? hrReport.present_today : '0'}</h3>
                            <div className="text-muted small">{hrReport ? Math.round((hrReport.present_today / hrReport.total_employees) * 100) : '0'}% attendance</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Turnover Rate</div>
                            <h3 className="fw-bold mb-0 text-danger">{hrReport ? hrReport.turnover_rate + '%' : '0%'}</h3>
                            <div className="text-muted small">Annualized</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Avg. Tenure</div>
                            <h3 className="fw-bold mb-0">{hrReport ? hrReport.average_tenure + ' yrs' : '0 yrs'}</h3>
                            <div className="text-muted small">Company average</div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4">
                <Col lg={6}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Department Distribution</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-4">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="small fw-bold">Engineering</span>
                                    <span className="small text-muted">35%</span>
                                </div>
                                <ProgressBar now={35} variant="primary" style={{ height: '8px' }} />
                            </div>
                            <div className="mb-4">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="small fw-bold">Sales & Marketing</span>
                                    <span className="small text-muted">25%</span>
                                </div>
                                <ProgressBar now={25} variant="success" style={{ height: '8px' }} />
                            </div>
                            <div className="mb-4">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="small fw-bold">Operations</span>
                                    <span className="small text-muted">20%</span>
                                </div>
                                <ProgressBar now={20} variant="info" style={{ height: '8px' }} />
                            </div>
                            <div className="mb-0">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="small fw-bold">Finance & HR</span>
                                    <span className="small text-muted">20%</span>
                                </div>
                                <ProgressBar now={20} variant="warning" style={{ height: '8px' }} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={6}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Leave Requests</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-4">Employee</th>
                                            <th>Type</th>
                                            <th>Dates</th>
                                            <th className="text-end pe-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="ps-4">
                                                <div className="fw-bold small">John Smith</div>
                                            </td>
                                            <td><div className="small text-muted">Vacation</div></td>
                                            <td><div className="small text-muted">Jan 15 - Jan 22</div></td>
                                            <td className="text-end pe-4">
                                                <Badge bg="warning" className="fw-normal text-dark">Pending</Badge>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="ps-4">
                                                <div className="fw-bold small">Sarah Johnson</div>
                                            </td>
                                            <td><div className="small text-muted">Sick</div></td>
                                            <td><div className="small text-muted">Jan 18 - Jan 19</div></td>
                                            <td className="text-end pe-4">
                                                <Badge bg="success" className="fw-normal">Approved</Badge>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="ps-4">
                                                <div className="fw-bold small">Michael Brown</div>
                                            </td>
                                            <td><div className="small text-muted">Personal</div></td>
                                            <td><div className="small text-muted">Jan 25 - Jan 25</div></td>
                                            <td className="text-end pe-4">
                                                <Badge bg="success" className="fw-normal">Approved</Badge>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="ps-4">
                                                <div className="fw-bold small">Emily Davis</div>
                                            </td>
                                            <td><div className="small text-muted">Vacation</div></td>
                                            <td><div className="small text-muted">Feb 1 - Feb 8</div></td>
                                            <td className="text-end pe-4">
                                                <Badge bg="secondary" className="fw-normal">Rejected</Badge>
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default HRReports;
