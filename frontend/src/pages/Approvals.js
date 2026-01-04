import React, { useState } from 'react';
import { Row, Col, Card, Table, Button, Badge, Dropdown, Alert } from 'react-bootstrap';
import { FiCheckCircle, FiXCircle, FiClock, FiMoreVertical, FiEye, FiFilter, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Approvals = () => {
    const [approvals, setApprovals] = useState([
        { id: 1, type: 'Expense Claim', title: 'Travel Reimbursement - NY Conference', requester: 'John Doe', date: '2026-01-02', priority: 'High', status: 'Pending' },
        { id: 2, type: 'Leave Request', title: 'Annual Leave - 5 Days', requester: 'Jane Smith', date: '2026-01-03', priority: 'Medium', status: 'Pending' },
        { id: 3, type: 'Purchase Order', title: 'Office Furniture Upgrade', requester: 'Robert Wilson', date: '2026-01-01', priority: 'Low', status: 'Approved' },
        { id: 4, type: 'Document Approval', title: 'Revised Safety Protocol', requester: 'Alice Brown', date: '2025-12-30', priority: 'High', status: 'Rejected' },
        { id: 5, type: 'Project Milestone', title: 'Phase 1 Completion - ERP', requester: 'Charlie Davis', date: '2026-01-04', priority: 'Medium', status: 'Pending' },
    ]);

    const handleAction = (id, newStatus) => {
        setApprovals(approvals.map(app => app.id === id ? { ...app, status: newStatus } : app));
        toast.success(`Request ${newStatus.toLowerCase()} successfully!`);
    };

    const getStatusBadge = (status) => {
        switch (status.toLowerCase()) {
            case 'approved': return <Badge bg="success" className="fw-normal"><FiCheckCircle className="me-1" /> Approved</Badge>;
            case 'pending': return <Badge bg="warning" text="dark" className="fw-normal"><FiClock className="me-1" /> Pending</Badge>;
            case 'rejected': return <Badge bg="danger" className="fw-normal"><FiXCircle className="me-1" /> Rejected</Badge>;
            default: return <Badge bg="secondary" className="fw-normal">{status}</Badge>;
        }
    };

    const getPriorityBadge = (priority) => {
        switch (priority.toLowerCase()) {
            case 'high': return <Badge bg="danger" className="fw-normal">High</Badge>;
            case 'medium': return <Badge bg="primary" className="fw-normal">Medium</Badge>;
            case 'low': return <Badge bg="info" className="fw-normal">Low</Badge>;
            default: return <Badge bg="secondary" className="fw-normal">{priority}</Badge>;
        }
    };

    return (
        <div className="approvals-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Approvals & Workflows</h2>
                    <p className="text-muted mb-0">Review and manage pending requests across all departments.</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-secondary" className="d-flex align-items-center">
                        <FiFilter className="me-2" /> Filter
                    </Button>
                    <Button variant="primary" className="d-flex align-items-center">
                        <FiCheckCircle className="me-2" /> Approve All Pending
                    </Button>
                </div>
            </div>

            <Row className="g-4 mb-4">
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-warning bg-opacity-10 p-3 rounded me-3">
                                <FiClock className="text-warning" size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-medium">Pending Approvals</div>
                                <h4 className="fw-bold mb-0">{approvals.filter(a => a.status === 'Pending').length}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                                <FiCheckCircle className="text-success" size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-medium">Approved Today</div>
                                <h4 className="fw-bold mb-0">8</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-danger bg-opacity-10 p-3 rounded me-3">
                                <FiXCircle className="text-danger" size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-medium">Rejected Today</div>
                                <h4 className="fw-bold mb-0">2</h4>
                            </div>
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
                                    <th className="ps-4 py-3 border-0">Request Details</th>
                                    <th className="py-3 border-0">Requester</th>
                                    <th className="py-3 border-0">Priority</th>
                                    <th className="py-3 border-0">Date</th>
                                    <th className="py-3 border-0">Status</th>
                                    <th className="text-end pe-4 py-3 border-0">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {approvals.map(item => (
                                    <tr key={item.id}>
                                        <td className="ps-4">
                                            <div className="fw-bold text-dark">{item.title}</div>
                                            <div className="small text-muted">{item.type}</div>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <div className="bg-light rounded-circle p-1 me-2"><FiUser size={14} /></div>
                                                <span className="small fw-medium">{item.requester}</span>
                                            </div>
                                        </td>
                                        <td>{getPriorityBadge(item.priority)}</td>
                                        <td className="text-muted small">{item.date}</td>
                                        <td>{getStatusBadge(item.status)}</td>
                                        <td className="text-end pe-4">
                                            {item.status === 'Pending' ? (
                                                <div className="d-flex justify-content-end gap-2">
                                                    <Button variant="success" size="sm" className="px-3" onClick={() => handleAction(item.id, 'Approved')}>Approve</Button>
                                                    <Button variant="outline-danger" size="sm" className="px-3" onClick={() => handleAction(item.id, 'Rejected')}>Reject</Button>
                                                </div>
                                            ) : (
                                                <Dropdown align="end">
                                                    <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                                                        <FiMoreVertical size={20} />
                                                    </Dropdown.Toggle>
                                                    <Dropdown.Menu className="border-0 shadow-sm">
                                                        <Dropdown.Item className="d-flex align-items-center py-2">
                                                            <FiEye className="me-2 text-muted" /> View Details
                                                        </Dropdown.Item>
                                                        <Dropdown.Item className="d-flex align-items-center py-2">
                                                            <FiClock className="me-2 text-muted" /> View History
                                                        </Dropdown.Item>
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Approvals;
