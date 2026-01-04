import React, { useState } from 'react';
import { Row, Col, Card, Button, Badge, ProgressBar, Dropdown } from 'react-bootstrap';
import { FiPlay, FiSettings, FiMoreVertical, FiActivity, FiCheckCircle, FiClock, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Workflows = () => {
    const [workflows, setWorkflows] = useState([
        { id: 1, name: 'Employee Onboarding', steps: 8, completed: 5, status: 'Active', lastRun: '2 hours ago' },
        { id: 2, name: 'Invoice Approval Chain', steps: 4, completed: 4, status: 'Completed', lastRun: '1 day ago' },
        { id: 3, name: 'Inventory Reorder Process', steps: 6, completed: 2, status: 'Active', lastRun: '30 mins ago' },
        { id: 4, name: 'Quarterly Tax Filing', steps: 12, completed: 0, status: 'Paused', lastRun: 'Never' },
        { id: 5, name: 'Customer Feedback Loop', steps: 5, completed: 3, status: 'Active', lastRun: '5 hours ago' },
    ]);

    return (
        <div className="workflows-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Automated Workflows</h2>
                    <p className="text-muted mb-0">Design and monitor business process automations.</p>
                </div>
                <Button variant="primary" className="d-flex align-items-center mt-3 mt-md-0" onClick={() => toast.success('Opening workflow designer...')}>
                    <FiPlus className="me-2" /> Create Workflow
                </Button>
            </div>

            <Row className="g-4">
                {workflows.map(wf => (
                    <Col lg={6} key={wf.id}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div className="d-flex align-items-center">
                                        <div className={`p-3 rounded me-3 ${wf.status === 'Active' ? 'bg-success bg-opacity-10 text-success' : wf.status === 'Paused' ? 'bg-warning bg-opacity-10 text-warning' : 'bg-primary bg-opacity-10 text-primary'}`}>
                                            <FiActivity size={24} />
                                        </div>
                                        <div>
                                            <h5 className="fw-bold text-dark mb-0">{wf.name}</h5>
                                            <div className="text-muted small">Last run: {wf.lastRun}</div>
                                        </div>
                                    </div>
                                    <Dropdown align="end">
                                        <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                                            <FiMoreVertical size={20} />
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu className="border-0 shadow-sm">
                                            <Dropdown.Item className="d-flex align-items-center py-2"><FiPlay className="me-2" /> Run Now</Dropdown.Item>
                                            <Dropdown.Item className="d-flex align-items-center py-2"><FiSettings className="me-2" /> Configure</Dropdown.Item>
                                            <Dropdown.Divider />
                                            <Dropdown.Item className="d-flex align-items-center py-2 text-danger">Delete</Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </div>

                                <div className="mb-4">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted small fw-medium">Progress ({wf.completed}/{wf.steps} steps)</span>
                                        <span className="fw-bold small">{Math.round((wf.completed / wf.steps) * 100)}%</span>
                                    </div>
                                    <ProgressBar
                                        now={(wf.completed / wf.steps) * 100}
                                        variant={wf.status === 'Active' ? 'success' : wf.status === 'Paused' ? 'warning' : 'primary'}
                                        style={{ height: '8px' }}
                                    />
                                </div>

                                <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                                    <div className="d-flex gap-2">
                                        <Badge bg={wf.status === 'Active' ? 'success' : wf.status === 'Paused' ? 'warning' : 'primary'} className="fw-normal">
                                            {wf.status}
                                        </Badge>
                                        <Badge bg="light" text="dark" className="border fw-normal">
                                            <FiClock className="me-1" /> Scheduled
                                        </Badge>
                                    </div>
                                    <Button variant="link" className="p-0 text-primary text-decoration-none small fw-bold">View History</Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}

                <Col lg={6}>
                    <Card
                        className="border-0 shadow-sm h-100 border-2 border-dashed d-flex align-items-center justify-content-center bg-light bg-opacity-50"
                        style={{ cursor: 'pointer', minHeight: '200px' }}
                        onClick={() => toast.success('Opening templates...')}
                    >
                        <div className="text-center p-4">
                            <div className="bg-white rounded-circle p-3 shadow-sm mb-3 d-inline-block">
                                <FiPlus size={32} className="text-primary" />
                            </div>
                            <h6 className="fw-bold text-muted mb-0">Use a Workflow Template</h6>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Workflows;
