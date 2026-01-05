import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Spinner, ProgressBar, Form } from 'react-bootstrap';
import { superadminAPI } from '../services/api';
import {
    FiServer,
    FiUsers,
    FiActivity,
    FiShield,
    FiCpu,
    FiHardDrive,
    FiDatabase,
    FiRefreshCw,
    FiCheckCircle
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            setRefreshing(true);
            const [statsRes, healthRes] = await Promise.all([
                superadminAPI.getStats(),
                superadminAPI.getSystemHealth()
            ]);
            setStats(statsRes.data);
            setHealth(healthRes.data);
        } catch (err) {
            console.error('Error fetching superadmin data:', err);
            toast.error('Failed to load system statistics');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const handleToggleModule = async (module, currentStatus) => {
        try {
            await superadminAPI.toggleModule({ module, status: !currentStatus });
            toast.success(`${module} module status updated`);
            fetchData();
        } catch (err) {
            toast.error('Failed to update module status');
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="superadmin-dashboard py-4">
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold text-white mb-1">Superadmin Control Center</h2>
                        <p className="text-muted mb-0">Global system monitoring and application control.</p>
                    </div>
                    <Button
                        variant="outline-danger"
                        className="d-flex align-items-center gap-2"
                        onClick={fetchData}
                        disabled={refreshing}
                    >
                        <FiRefreshCw className={refreshing ? 'spin' : ''} />
                        {refreshing ? 'Refreshing...' : 'Refresh Data'}
                    </Button>
                </div>

                {/* System Health Overview */}
                <Row className="g-4 mb-4">
                    <Col xl={3} md={6}>
                        <Card className="border-0 shadow-sm h-100 bg-dark text-white overflow-hidden">
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div className="bg-danger bg-opacity-25 p-2 rounded-3">
                                        <FiCpu size={24} className="text-danger" />
                                    </div>
                                    <Badge bg="success">Healthy</Badge>
                                </div>
                                <h6 className="text-uppercase text-muted small fw-bold mb-2">CPU Usage</h6>
                                <h3 className="fw-bold mb-3 text-white">{stats?.system?.cpu_usage || '0%'}</h3>
                                <ProgressBar variant="danger" now={parseInt(stats?.system?.cpu_usage) || 0} height={6} className="bg-secondary" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xl={3} md={6}>
                        <Card className="border-0 shadow-sm h-100 bg-dark text-white overflow-hidden">
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div className="bg-info bg-opacity-25 p-2 rounded-3">
                                        <FiActivity size={24} className="text-info" />
                                    </div>
                                    <Badge bg="success">Stable</Badge>
                                </div>
                                <h6 className="text-uppercase text-muted small fw-bold mb-2">Memory Usage</h6>
                                <h3 className="fw-bold mb-3 text-white">{stats?.system?.memory_usage || '0%'}</h3>
                                <ProgressBar variant="info" now={parseInt(stats?.system?.memory_usage) || 0} height={6} className="bg-secondary" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xl={3} md={6}>
                        <Card className="border-0 shadow-sm h-100 bg-dark text-white overflow-hidden">
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div className="bg-warning bg-opacity-25 p-2 rounded-3">
                                        <FiHardDrive size={24} className="text-warning" />
                                    </div>
                                    <Badge bg="warning">85% Full</Badge>
                                </div>
                                <h6 className="text-uppercase text-muted small fw-bold mb-2">Disk Usage</h6>
                                <h3 className="fw-bold mb-3 text-white">{stats?.system?.disk_usage || '0%'}</h3>
                                <ProgressBar variant="warning" now={parseInt(stats?.system?.disk_usage) || 0} height={6} className="bg-secondary" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xl={3} md={6}>
                        <Card className="border-0 shadow-sm h-100 bg-dark text-white overflow-hidden">
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div className="bg-success bg-opacity-25 p-2 rounded-3">
                                        <FiDatabase size={24} className="text-success" />
                                    </div>
                                    <Badge bg="success">Connected</Badge>
                                </div>
                                <h6 className="text-uppercase text-muted small fw-bold mb-2">Database Status</h6>
                                <h3 className="fw-bold mb-3 text-white">Online</h3>
                                <div className="d-flex align-items-center gap-2 text-success small">
                                    <FiCheckCircle /> Latency: 12ms
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row className="g-4">
                    {/* User Distribution */}
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header className="bg-transparent border-0 p-4">
                                <h5 className="fw-bold mb-0 text-white">User Distribution</h5>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0">
                                <div className="text-center mb-4">
                                    <h1 className="fw-bold mb-0 text-white">{stats?.users?.total || 0}</h1>
                                    <p className="text-muted">Total Registered Users</p>
                                </div>
                                <div className="user-roles-list">
                                    {stats?.users?.roles && Object.entries(stats.users.roles).map(([role, count]) => (
                                        <div key={role} className="d-flex justify-content-between align-items-center mb-3 p-3 bg-dark bg-opacity-50 rounded-3 border border-secondary border-opacity-10">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className={`role-dot bg-${role === 'superadmin' ? 'danger' : role === 'admin' ? 'primary' : 'info'}`}></div>
                                                <span className="text-capitalize fw-semibold text-white">{role}</span>
                                            </div>
                                            <Badge bg="secondary" className="text-white border-0">{count}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Module Access Control */}
                    <Col lg={8}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header className="bg-transparent border-0 p-4 d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold mb-0 text-white">Platform Module Control</h5>
                                <Badge bg="danger" className="text-uppercase px-3 py-2">System Critical</Badge>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0">
                                <div className="mb-4 p-3 bg-danger bg-opacity-10 border border-danger border-opacity-20 rounded-3">
                                    <p className="text-danger small mb-0">
                                        <strong>Warning:</strong> Disabling core modules will affect all users across the platform. Use with caution.
                                    </p>
                                </div>

                                <Table responsive hover className="align-middle border-secondary border-opacity-10">
                                    <thead className="bg-dark text-muted small text-uppercase">
                                        <tr>
                                            <th className="border-0">Module Name</th>
                                            <th className="border-0">Status</th>
                                            <th className="border-0">Last Accessed</th>
                                            <th className="border-0 text-end">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-white">
                                        {health?.services?.map((service, idx) => (
                                            <tr key={idx} className="border-secondary border-opacity-10">
                                                <td className="border-0">
                                                    <div className="fw-bold">{service.name}</div>
                                                    <div className="text-muted small">v1.0.4</div>
                                                </td>
                                                <td className="border-0">
                                                    <Badge bg={service.status === 'Running' ? 'success-light' : 'danger-light'} className={`text-${service.status === 'Running' ? 'success' : 'danger'}`}>
                                                        {service.status}
                                                    </Badge>
                                                </td>
                                                <td className="border-0 text-muted small">2 mins ago</td>
                                                <td className="border-0 text-end">
                                                    <Form.Check
                                                        type="switch"
                                                        id={`module-switch-${idx}`}
                                                        checked={service.status === 'Running'}
                                                        onChange={() => handleToggleModule(service.name, service.status === 'Running')}
                                                        className="d-inline-block"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>

                                <div className="mt-4">
                                    <h6 className="text-white fw-bold mb-3">Platform Maintenance</h6>
                                    <div className="d-flex gap-3">
                                        <Button variant="outline-warning" size="sm" className="px-3">Clear System Cache</Button>
                                        <Button variant="outline-info" size="sm" className="px-3">Generate Audit Report</Button>
                                        <Button variant="outline-danger" size="sm" className="px-3">Maintenance Mode</Button>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <style dangerouslySetInnerHTML={{
                __html: `
                .superadmin-dashboard {
                    background-color: #0f172a;
                    min-height: 100vh;
                }
                .card {
                    background-color: #1e293b !important;
                    border: 1px solid rgba(255, 255, 255, 0.05) !important;
                }
                .role-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }
                .bg-success-light { background-color: rgba(16, 185, 129, 0.1); }
                .bg-danger-light { background-color: rgba(239, 68, 68, 0.1); }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .progress {
                    border-radius: 10px;
                    background-color: #334155;
                }
                .rounded-4 {
                    border-radius: 1.5rem !important;
                }
                .table {
                    --bs-table-bg: transparent;
                    --bs-table-hover-bg: rgba(255, 255, 255, 0.02);
                }
            `}} />
        </div>
    );
};

export default SuperAdminDashboard;
