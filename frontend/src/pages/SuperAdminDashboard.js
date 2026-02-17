import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Spinner, Form } from 'react-bootstrap';
import { superadminAPI } from '../services/api';
import {
    FiServer,
    FiUsers,
    FiShield,
    FiCpu,
    FiRefreshCw,
    FiCreditCard,
    FiTrendingUp,
    FiCheckCircle,
    FiActivity
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            setRefreshing(true);
            const statsRes = await superadminAPI.getStats();
            setStats(statsRes.data);
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
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
                    <div>
                        <h2 className="fw-bold text-white mb-1">Superadmin Control Center</h2>
                        <p className="text-muted mb-0">Manage users, businesses, and platform subscriptions.</p>
                    </div>
                    <Button
                        variant="outline-danger"
                        className="d-flex align-items-center gap-2 w-100 w-md-auto justify-content-center"
                        onClick={fetchData}
                        disabled={refreshing}
                    >
                        <FiRefreshCw className={refreshing ? 'spin' : ''} />
                        {refreshing ? 'Refreshing...' : 'Refresh Data'}
                    </Button>
                </div>

                {/* KPI Cards */}
                <Row className="g-3 g-md-4 mb-4">
                    <Col xl={3} md={6} xs={12}>
                        <Card className="border-0 shadow-sm h-100 bg-dark text-white overflow-hidden">
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <p className="text-muted mb-2 small">Total Users</p>
                                        <h3 className="fw-bold mb-0">{stats?.users?.total || 0}</h3>
                                        <small className="text-success mt-2">
                                            <FiTrendingUp className="me-1" />
                                            {stats?.users?.active || 0} active
                                        </small>
                                    </div>
                                    <div className="bg-primary bg-opacity-25 p-3 rounded-3">
                                        <FiUsers size={28} className="text-primary" />
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col xl={3} md={6} xs={12}>
                        <Card className="border-0 shadow-sm h-100 bg-dark text-white overflow-hidden">
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <p className="text-muted mb-2 small">Active Businesses</p>
                                        <h3 className="fw-bold mb-0">{stats?.businesses?.active || 0}</h3>
                                        <small className="text-info mt-2">
                                            <FiActivity className="me-1" />
                                            {stats?.businesses?.total || 0} total
                                        </small>
                                    </div>
                                    <div className="bg-success bg-opacity-25 p-3 rounded-3">
                                        <FiShield size={28} className="text-success" />
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col xl={3} md={6} xs={12}>
                        <Card className="border-0 shadow-sm h-100 bg-dark text-white overflow-hidden">
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <p className="text-muted mb-2 small">Active Subscriptions</p>
                                        <h3 className="fw-bold mb-0">{stats?.subscriptions?.active || 0}</h3>
                                        <small className="text-warning mt-2">
                                            <FiCheckCircle className="me-1" />
                                            {stats?.subscriptions?.total || 0} total
                                        </small>
                                    </div>
                                    <div className="bg-warning bg-opacity-25 p-3 rounded-3">
                                        <FiCreditCard size={28} className="text-warning" />
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col xl={3} md={6} xs={12}>
                        <Card className="border-0 shadow-sm h-100 bg-dark text-white overflow-hidden">
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <p className="text-muted mb-2 small">Monthly Revenue</p>
                                        <h3 className="fw-bold mb-0">${(stats?.subscriptions?.monthly_revenue || 0).toLocaleString()}</h3>
                                        <small className="text-success mt-2">
                                            <FiTrendingUp className="me-1" />
                                            From {stats?.subscriptions?.active || 0} subscriptions
                                        </small>
                                    </div>
                                    <div className="bg-danger bg-opacity-25 p-3 rounded-3">
                                        <FiServer size={28} className="text-danger" />
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row className="g-4">
                    {/* User Distribution */}
                    <Col lg={4} xs={12}>
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

                    {/* Platform Health Metrics */}
                    <Col lg={4} xs={12}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header className="bg-transparent border-0 p-4">
                                <h5 className="fw-bold mb-0 text-white">Platform Metrics</h5>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0">
                                <div className="space-y-3">
                                    <div className="d-flex justify-content-between align-items-center p-3 bg-dark bg-opacity-50 rounded-3">
                                        <div>
                                            <p className="text-muted small mb-0">User Activation Rate</p>
                                            <h6 className="text-white fw-bold mb-0">{stats?.users?.total > 0 ? ((stats?.users?.active / stats?.users?.total) * 100).toFixed(1) : 0}%</h6>
                                        </div>
                                        <div className="text-success">
                                            <FiCheckCircle size={24} />
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center p-3 bg-dark bg-opacity-50 rounded-3">
                                        <div>
                                            <p className="text-muted small mb-0">Business Activation</p>
                                            <h6 className="text-white fw-bold mb-0">{stats?.businesses?.total > 0 ? ((stats?.businesses?.active / stats?.businesses?.total) * 100).toFixed(1) : 0}%</h6>
                                        </div>
                                        <div className="text-success">
                                            <FiCheckCircle size={24} />
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center p-3 bg-dark bg-opacity-50 rounded-3">
                                        <div>
                                            <p className="text-muted small mb-0">Subscription Conversion</p>
                                            <h6 className="text-white fw-bold mb-0">{stats?.businesses?.active > 0 ? ((stats?.subscriptions?.active / stats?.businesses?.active) * 100).toFixed(1) : 0}%</h6>
                                        </div>
                                        <div className="text-warning">
                                            <FiTrendingUp size={24} />
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center p-3 bg-dark bg-opacity-50 rounded-3">
                                        <div>
                                            <p className="text-muted small mb-0">Avg Revenue per Sub</p>
                                            <h6 className="text-white fw-bold mb-0">${stats?.subscriptions?.active > 0 ? (stats?.subscriptions?.monthly_revenue / stats?.subscriptions?.active).toFixed(2) : 0}</h6>
                                        </div>
                                        <div className="text-danger">
                                            <FiServer size={24} />
                                        </div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Quick Stats */}
                    <Col lg={4} xs={12}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header className="bg-transparent border-0 p-4">
                                <h5 className="fw-bold mb-0 text-white">Quick Overview</h5>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0">
                                <div className="space-y-3">
                                    <div className="d-flex justify-content-between align-items-center p-3 bg-dark bg-opacity-50 rounded-3 border-start border-primary border-5">
                                        <div>
                                            <p className="text-muted small mb-0">Super Admins</p>
                                            <h6 className="text-white fw-bold mb-0">{stats?.users?.roles?.superadmin || 0}</h6>
                                        </div>
                                        <FiUsers size={24} className="text-primary" />
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center p-3 bg-dark bg-opacity-50 rounded-3 border-start border-success border-5">
                                        <div>
                                            <p className="text-muted small mb-0">Admins</p>
                                            <h6 className="text-white fw-bold mb-0">{stats?.users?.roles?.admin || 0}</h6>
                                        </div>
                                        <FiShield size={24} className="text-success" />
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center p-3 bg-dark bg-opacity-50 rounded-3 border-start border-info border-5">
                                        <div>
                                            <p className="text-muted small mb-0">Regular Users</p>
                                            <h6 className="text-white fw-bold mb-0">{(stats?.users?.roles?.user || 0) + (stats?.users?.roles?.manager || 0) + (stats?.users?.roles?.staff || 0)}</h6>
                                        </div>
                                        <FiUsers size={24} className="text-info" />
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center p-3 bg-dark bg-opacity-50 rounded-3 border-start border-warning border-5">
                                        <div>
                                            <p className="text-muted small mb-0">Avg Users per Business</p>
                                            <h6 className="text-white fw-bold mb-0">{stats?.users?.total > 0 && stats?.businesses?.total > 0 ? (stats?.users?.total / stats?.businesses?.total).toFixed(1) : 0}</h6>
                                        </div>
                                        <FiTrendingUp size={24} className="text-warning" />
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
                    pointer-events: auto !important;
                }
                .superadmin-dashboard * {
                    pointer-events: auto !important;
                }
                .superadmin-dashboard .container-fluid {
                    pointer-events: auto !important;
                }
                .superadmin-dashboard .row {
                    pointer-events: auto !important;
                }
                .superadmin-dashboard .col {
                    pointer-events: auto !important;
                }
                .card {
                    background-color: #1e293b !important;
                    border: 1px solid rgba(255, 255, 255, 0.05) !important;
                    pointer-events: auto !important;
                }
                .btn {
                    pointer-events: auto !important;
                    cursor: pointer !important;
                    position: relative !important;
                    z-index: 100 !important;
                }
                .btn:hover {
                    opacity: 0.9;
                }
                button {
                    pointer-events: auto !important;
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
