import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, ProgressBar, Container } from 'react-bootstrap';
import { FiUsers, FiDownload, FiPieChart, FiTrendingUp, FiCalendar, FiActivity } from 'react-icons/fi';
import { reportsAPI } from '../services/api';
import toast from 'react-hot-toast';
import DateRangeSelector from '../components/DateRangeSelector';
import { DATE_RANGES, calculateDateRange, formatDateForAPI } from '../utils/dateRanges';

const HRReports = () => {
    const [hrReport, setHrReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState(DATE_RANGES.TODAY);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    useEffect(() => {
        fetchHRData();
    }, [dateRange, customStartDate, customEndDate]);

    const fetchHRData = async () => {
        try {
            setLoading(true);
            
            // Calculate date range
            const dateRangeObj = calculateDateRange(dateRange, customStartDate, customEndDate);
            const apiParams = {
                start_date: formatDateForAPI(dateRangeObj.startDate),
                end_date: formatDateForAPI(dateRangeObj.endDate)
            };
            
            const response = await reportsAPI.getHrReport(apiParams);
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
                    <DateRangeSelector
                        value={dateRange}
                        onChange={(range, start, end) => {
                            setDateRange(range);
                            if (range === DATE_RANGES.CUSTOM_RANGE && start && end) {
                                setCustomStartDate(start);
                                setCustomEndDate(end);
                            }
                        }}
                    />
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
                            <div className="text-success small fw-bold"><FiTrendingUp /> Active Workforce</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Active Today</div>
                            <h3 className="fw-bold mb-0">{hrReport ? hrReport.present_today : '0'}</h3>
                            <div className="text-muted small">{hrReport && hrReport.total_employees > 0 ? Math.round((hrReport.present_today / hrReport.total_employees) * 100) : '0'}% attendance</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Pending Leaves</div>
                            <h3 className="fw-bold mb-0 text-warning">{hrReport ? hrReport.pending_leave_requests : '0'}</h3>
                            <div className="text-muted small">Awaiting approval</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Active Employees</div>
                            <h3 className="fw-bold mb-0 text-primary">{hrReport ? hrReport.active_employees : '0'}</h3>
                            <div className="text-muted small">Current staff</div>
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
                            {hrReport?.department_distribution?.length > 0 ? hrReport.department_distribution.map((dept, idx) => (
                                <div key={idx} className="mb-4">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="small fw-bold">{dept.department}</span>
                                        <span className="small text-muted">{dept.count} employees ({dept.percentage}%)</span>
                                    </div>
                                    <ProgressBar now={dept.percentage} variant={['primary', 'success', 'info', 'warning'][idx % 4]} style={{ height: '8px' }} />
                                </div>
                            )) : (
                                <p className="text-center py-4 text-muted">No department data available.</p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={6}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Recent Leave Requests</h5>
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
                                        {hrReport?.recent_leaves?.length > 0 ? hrReport.recent_leaves.map((leave, idx) => (
                                            <tr key={idx}>
                                                <td className="ps-4">
                                                    <div className="fw-bold small">{leave.employee?.first_name} {leave.employee?.last_name}</div>
                                                </td>
                                                <td><div className="small text-muted">{leave.leave_type}</div></td>
                                                <td><div className="small text-muted">{new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</div></td>
                                                <td className="text-end pe-4">
                                                    <Badge bg={leave.status === 'PENDING' ? 'warning' : leave.status === 'APPROVED' ? 'success' : 'secondary'} className={`fw-normal ${leave.status === 'PENDING' ? 'text-dark' : ''}`}>
                                                        {leave.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="text-center py-4 text-muted">No recent leave requests.</td>
                                            </tr>
                                        )}
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
