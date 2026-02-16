import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, Modal, Form, Dropdown } from 'react-bootstrap';
import { FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiPlus, FiMoreVertical, FiFilter } from 'react-icons/fi';
import { hrAPI } from '../services/api';
import toast from 'react-hot-toast';
import SubscriptionGuard from '../components/SubscriptionGuard';

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

    // Helper functions to calculate leave statistics
    const getApprovedThisMonth = () => {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        return leaveRequests.filter(r =>
            r.status === 'APPROVED' &&
            r.approved_date &&
            new Date(r.approved_date) >= startOfMonth
        ).length;
    };

    const getEmployeesOnLeave = () => {
        const today = new Date();
        return leaveRequests.filter(r =>
            r.status === 'APPROVED' &&
            r.start_date &&
            r.end_date &&
            today >= new Date(r.start_date) &&
            today <= new Date(r.end_date)
        ).length;
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
                    <SubscriptionGuard message="Renew your subscription to submit leave requests">
                        <Button variant="primary" className="d-flex align-items-center" onClick={() => setShowModal(true)}>
                            <FiPlus className="me-2" /> New Request
                        </Button>
                    </SubscriptionGuard>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="g-2 g-md-4 mb-4">
                <Col xs={12} sm={6} md={4}>
                    <Card className="border-0 shadow-sm h-100 card-responsive">
                        <Card.Body className="p-2 p-md-4">
                            <div className="text-muted small fw-medium small-md mb-1">Pending Requests</div>
                            <h3 className="fw-bold mb-0 text-warning h5 h4-md">{leaveRequests.filter(r => r.status === 'PENDING').length}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} sm={6} md={4}>
                    <Card className="border-0 shadow-sm h-100 card-responsive">
                        <Card.Body className="p-2 p-md-4">
                            <div className="text-muted small fw-medium small-md mb-1">Approved (This Month)</div>
                            <h3 className="fw-bold mb-0 text-success h5 h4-md">{getApprovedThisMonth()}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} sm={6} md={4}>
                    <Card className="border-0 shadow-sm h-100 card-responsive">
                        <Card.Body className="p-2 p-md-4">
                            <div className="text-muted small fw-medium small-md mb-1">Employees on Leave</div>
                            <h3 className="fw-bold mb-0 text-primary h5 h4-md">{getEmployeesOnLeave()}</h3>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <style dangerouslySetInnerHTML={{
                __html: `
                /* Mobile Responsive Styles for Leave Management Cards */
                @media (max-width: 767.98px) {
                    .card-responsive {
                        min-height: 100px;
                        margin-bottom: 10px;
                    }
                    
                    .card-responsive .card-body {
                        padding: 12px !important;
                    }
                    
                    .small-md {
                        font-size: 0.7rem !important;
                    }
                    
                    .h4-md {
                        font-size: 1.25rem !important;
                    }
                    
                    .h5 {
                        font-size: 1rem !important;
                    }
                }
                
                @media (max-width: 575.98px) {
                    .card-responsive {
                        min-height: 90px;
                    }
                    
                    .card-responsive .card-body {
                        padding: 10px !important;
                    }
                    
                    .small-md {
                        font-size: 0.65rem !important;
                    }
                    
                    .h4-md {
                        font-size: 1.1rem !important;
                    }
                }
                
                /* Desktop styles */
                @media (min-width: 768px) {
                    .small-md {
                        font-size: 0.875rem !important;
                    }
                    
                    .h4-md {
                        font-size: 1.5rem !important;
                    }
                }
                
                /* Smooth transitions */
                .card-responsive {
                    transition: all 0.2s ease-in-out;
                }
                
                .card-responsive:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1) !important;
                }
                `}} />

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
                                            <div className="d-flex gap-2 justify-content-end">
                                                <Button variant="success" size="sm" className="d-flex align-items-center" onClick={() => handleApprove(request.id)} title="Approve">
                                                    <FiCheckCircle size={16} />
                                                </Button>
                                                <Button variant="danger" size="sm" className="d-flex align-items-center" onClick={() => handleReject(request.id)} title="Reject">
                                                    <FiXCircle size={16} />
                                                </Button>
                                            </div>
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
