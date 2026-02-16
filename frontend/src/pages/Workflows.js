import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Badge, ProgressBar, Dropdown, Spinner, Alert } from 'react-bootstrap';
import { FiPlay, FiSettings, FiMoreVertical, FiActivity, FiCheckCircle, FiClock, FiPlus, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { tasksAPI } from '../services/api';

const Workflows = () => {
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchWorkflows = async () => {
        setLoading(true);
        setError(null);
        await tasksAPI.getTasks()
            .then(res => {
                const tasks = (res.data && (res.data.tasks || res.data)) || [];

                // Group tasks by project name
                const groups = {};
                tasks.forEach(t => {
                    const project = t.project || t.project_name || (t.project && t.project.name) || 'General';
                    if (!groups[project]) groups[project] = [];
                    groups[project].push(t);
                });

                const result = Object.keys(groups).map((p, idx) => {
                    const tasksForProject = groups[p];
                    const steps = tasksForProject.length;
                    const completed = tasksForProject.filter(t => (t.status || '').toLowerCase() === 'completed').length;
                    const status = completed === steps ? 'Completed' : (completed === 0 ? 'Paused' : 'Active');
                    const lastRunTask = tasksForProject.reduce((a,b) => {
                        const aDate = new Date(a.updated_at || a.created_at || 0);
                        const bDate = new Date(b.updated_at || b.created_at || 0);
                        return aDate > bDate ? a : b;
                    }, tasksForProject[0]);
                    const lastRun = lastRunTask ? (lastRunTask.updated_at || lastRunTask.created_at) : null;
                    return { id: `wf-${idx}`, name: p, steps, completed, status, lastRun };
                });

                setWorkflows(result);
            })
            .catch(err => {
                console.error('Failed to load workflows:', err);
                setError('Failed to load workflows.');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchWorkflows();
    }, []);


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
                {loading && <Col lg={12}><div className="text-center py-5"><Spinner animation="border" /></div></Col>}
                {!loading && error && <Col lg={12}><Alert variant="danger">{error}</Alert></Col>}
                {!loading && !error && workflows.map(wf => (
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
                                    <div className="d-flex gap-2">
                                        <Button variant="outline-secondary" size="sm" className="d-flex align-items-center" title="Run Now">
                                            <FiPlay size={16} />
                                        </Button>
                                        <Button variant="outline-secondary" size="sm" className="d-flex align-items-center" title="Configure">
                                            <FiSettings size={16} />
                                        </Button>
                                        <Button variant="outline-danger" size="sm" className="d-flex align-items-center" title="Delete">
                                            <FiTrash2 size={16} />
                                        </Button>
                                    </div>
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
