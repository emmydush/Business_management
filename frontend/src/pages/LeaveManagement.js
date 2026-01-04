import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, Modal, Form, Dropdown } from 'react-bootstrap';
import { FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiPlus, FiMoreVertical, FiFilter } from 'react-icons/fi';
import { hrAPI } from '../services/api';
import toast from 'react-hot-toast';

const LeaveManagement = () => {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchLeaveRequests();
    }, []);

    const fetchLeaveRequests = async () => {
        try {
            setLoading(true);
            const response = await hrAPI.getLeaveRequests();
            setLeaveRequests(response.data.leave_requests || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch leave requests.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status.toLowerCase()) {
            case 'approved': return <Badge bg="success" className="fw-normal"><FiCheckCircle className="me-1" /> Approved</Badge>;
            case 'pending': return <Badge bg="warning" text="dark" className="fw-normal"><FiClock className="me-1" /> Pending</Badge>;
            case 'rejected': return <Badge bg="danger" className="fw-normal"><FiXCircle className="me-1" /> Rejected</Badge>;
            default: return <Badge bg="secondary" className="fw-normal">{status}</Badge>;
        }
    };

    const handleApprove = async (id) => {
        try {
            const response = await hrAPI.approveLeaveRequest(id);
            toast.success(response.data.message || 'Leave request approved successfully');
            fetchLeaveRequests(); // Refresh the list
        } catch (err) {
            toast.error('Failed to approve leave request. Please try again.');
            console.error('Error approving leave request:', err);
        }
    };

    const handleReject = async (id) => {
        try {
            const response = await hrAPI.rejectLeaveRequest(id);
            toast.success(response.data.message || 'Leave request rejected successfully');
            fetchLeaveRequests(); // Refresh the list
        } catch (err) {
            toast.error('Failed to reject leave request. Please try again.');
            console.error('Error rejecting leave request:', err);
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
        <div className="leave-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Leave Management</h2>
                    <p className="text-muted mb-0">Review and approve employee time-off requests.</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-secondary" className="d-flex align-items-center">
                        <FiFilter className="me-2" /> Filter
                    </Button>
                    <Button variant="primary" className="d-flex align-items-center" onClick={() => setShowModal(true)}>
                        <FiPlus className="me-2" /> New Request
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="g-4 mb-4">
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Pending Requests</div>
                            <h3 className="fw-bold mb-0 text-warning">{leaveRequests.filter(r => r.status === 'PENDING').length}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Approved (This Month)</div>
                            <h3 className="fw-bold mb-0 text-success">12</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Employees on Leave</div>
                            <h3 className="fw-bold mb-0 text-primary">3</h3>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="ps-4 py-3 border-0">Employee</th>
                                    <th className="py-3 border-0">Leave Type</th>
                                    <th className="py-3 border-0">Duration</th>
                                    <th className="py-3 border-0">Reason</th>
                                    <th className="py-3 border-0">Status</th>
                                    <th className="text-end pe-4 py-3 border-0">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaveRequests.map(request => (
                                    <tr key={request.id}>
                                        <td className="ps-4">
                                            <div className="fw-bold">{request.employee?.user?.first_name} {request.employee?.user?.last_name}</div>
                                            <div className="small text-muted">{request.employee?.employee_id}</div>
                                        </td>
                                        <td>
                                            <Badge bg="light" text="dark" className="border fw-normal">{request.leave_type}</Badge>
                                        </td>
                                        <td>
                                            <div className="small text-dark fw-medium">{request.start_date} to {request.end_date}</div>
                                            <div className="small text-muted">{request.total_days} days</div>
                                        </td>
                                        <td>
                                            <div className="small text-muted text-truncate" style={{ maxWidth: '200px' }}>{request.reason}</div>
                                        </td>
                                        <td>{getStatusBadge(request.status)}</td>
                                        <td className="text-end pe-4">
                                            <Dropdown align="end">
                                                <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                                                    <FiMoreVertical size={20} />
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu className="border-0 shadow-sm">
                                                    <Dropdown.Item className="d-flex align-items-center py-2 text-success" onClick={() => handleApprove(request.id)}>
                                                        <FiCheckCircle className="me-2" /> Approve
                                                    </Dropdown.Item>
                                                    <Dropdown.Item className="d-flex align-items-center py-2 text-danger" onClick={() => handleReject(request.id)}>
                                                        <FiXCircle className="me-2" /> Reject
                                                    </Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">Submit Leave Request</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Leave Type</Form.Label>
                            <Form.Select>
                                <option>Annual Leave</option>
                                <option>Sick Leave</option>
                                <option>Maternity/Paternity</option>
                                <option>Unpaid Leave</option>
                            </Form.Select>
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Start Date</Form.Label>
                                    <Form.Control type="date" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">End Date</Form.Label>
                                    <Form.Control type="date" />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Reason</Form.Label>
                            <Form.Control as="textarea" rows={3} placeholder="Provide a brief reason..." />
                        </Form.Group>
                        <div className="d-grid">
                            <Button variant="primary" onClick={() => {
                                toast.success('Request submitted!');
                                setShowModal(false);
                            }}>Submit Request</Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default LeaveManagement;
