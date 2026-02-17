import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Form, InputGroup, Modal, Tab, Tabs } from 'react-bootstrap';
import { superadminAPI } from '../services/api';
import { FiSearch, FiActivity, FiDatabase, FiSettings, FiSend, FiRefreshCw, FiServer, FiMail, FiShield, FiGlobe } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const SuperAdminAdvanced = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Overview state
    const [overview, setOverview] = useState(null);
    
    // Broadcast state
    const [broadcastForm, setBroadcastForm] = useState({
        title: '',
        message: '',
        target: 'all',
        priority: 'normal'
    });
    const [sending, setSending] = useState(false);
    
    // API Analytics state
    const [apiDays, setApiDays] = useState(7);
    const [apiAnalytics, setApiAnalytics] = useState(null);
    
    // System Settings state
    const [systemSettings, setSystemSettings] = useState({
        platform_name: 'MoMo ERP',
        allow_registration: 'true',
        require_email_verification: 'false',
        max_businesses_per_user: '5',
        default_subscription_plan: 'professional'
    });
    const [savingSettings, setSavingSettings] = useState(false);
    
    // Quick Actions
    const [quickActionLoading, setQuickActionLoading] = useState(null);

    const fetchOverview = async () => {
        try {
            const response = await superadminAPI.getPlatformOverview();
            setOverview(response.data);
        } catch (err) {
            console.error('Error fetching overview:', err);
        }
    };

    const fetchApiAnalytics = async () => {
        try {
            const response = await superadminAPI.getApiAnalytics(apiDays);
            setApiAnalytics(response.data);
        } catch (err) {
            console.error('Error fetching API analytics:', err);
        }
    };

    const fetchSystemSettings = async () => {
        try {
            const response = await superadminAPI.getSystemSettings();
            if (response.data.settings) {
                setSystemSettings(prev => ({ ...prev, ...response.data.settings }));
            }
        } catch (err) {
            console.error('Error fetching system settings:', err);
        }
    };

    const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchOverview(), fetchApiAnalytics(), fetchSystemSettings()]);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleBroadcastSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await superadminAPI.sendBroadcast(broadcastForm);
            toast.success('Broadcast sent successfully');
            setBroadcastForm({ title: '', message: '', target: 'all', priority: 'normal' });
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to send broadcast');
        } finally {
            setSending(false);
        }
    };

    const handleSettingsSave = async () => {
        setSavingSettings(true);
        try {
            await superadminAPI.updateSystemSettings(systemSettings);
            toast.success('System settings saved successfully');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save settings');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleQuickAction = async (action) => {
        setQuickActionLoading(action);
        try {
            if (action === 'test_email') {
                const email = prompt('Enter email address for test:');
                if (email) {
                    await superadminAPI.executeQuickAction('test_email', { email });
                    toast.success(`Test email sent to ${email}`);
                }
            } else {
                await superadminAPI.executeQuickAction(action, {});
                toast.success('Action completed successfully');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Action failed');
        } finally {
            setQuickActionLoading(null);
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
        <div className="superadmin-advanced py-4">
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold text-white mb-1">Advanced Admin Panel</h2>
                        <p className="text-muted mb-0">Platform-wide management and analytics.</p>
                    </div>
                    <Button
                        variant="outline-danger"
                        className="d-flex align-items-center gap-2"
                        onClick={handleRefresh}
                        disabled={refreshing}
                    >
                        <FiRefreshCw className={refreshing ? 'spin' : ''} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </div>

                <Tabs
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k)}
                    className="mb-4"
                    variant="pills"
                >
                    <Tab eventKey="overview" title={<span><FiActivity className="me-2" />Overview</span>}>
                        <Row className="g-4">
                            {/* User Stats */}
                            <Col md={6} lg={3}>
                                <Card className="bg-dark text-white border-0 h-100">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <p className="text-muted mb-1">Total Users</p>
                                                <h3 className="mb-0">{overview?.users?.total || 0}</h3>
                                            </div>
                                            <Badge bg="primary" className="rounded-pill">Users</Badge>
                                        </div>
                                        <hr className="border-secondary" />
                                        <div className="d-flex justify-content-between small">
                                            <span className="text-muted">Today: <span className="text-success">{overview?.users?.today || 0}</span></span>
                                            <span className="text-muted">This Week: <span className="text-info">{overview?.users?.this_week || 0}</span></span>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>

                            {/* Business Stats */}
                            <Col md={6} lg={3}>
                                <Card className="bg-dark text-white border-0 h-100">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <p className="text-muted mb-1">Total Businesses</p>
                                                <h3 className="mb-0">{overview?.businesses?.total || 0}</h3>
                                            </div>
                                            <Badge bg="success" className="rounded-pill">Businesses</Badge>
                                        </div>
                                        <hr className="border-secondary" />
                                        <div className="d-flex justify-content-between small">
                                            <span className="text-muted">Active: <span className="text-success">{overview?.businesses?.active || 0}</span></span>
                                            <span className="text-muted">This Month: <span className="text-info">{overview?.businesses?.this_month || 0}</span></span>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>

                            {/* Active Users */}
                            <Col md={6} lg={3}>
                                <Card className="bg-dark text-white border-0 h-100">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <p className="text-muted mb-1">Active Sessions (24h)</p>
                                                <h3 className="mb-0">{overview?.users?.active_24h || 0}</h3>
                                            </div>
                                            <Badge bg="warning" className="rounded-pill">Active</Badge>
                                        </div>
                                        <hr className="border-secondary" />
                                        <div className="small text-muted">
                                            Users with activity in the last 24 hours
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>

                            {/* Subscriptions */}
                            <Col md={6} lg={3}>
                                <Card className="bg-dark text-white border-0 h-100">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <p className="text-muted mb-1">Active Subscriptions</p>
                                                <h3 className="mb-0">{overview?.subscriptions?.active || 0}</h3>
                                            </div>
                                            <Badge bg="info" className="rounded-pill">Subs</Badge>
                                        </div>
                                        <hr className="border-secondary" />
                                        <div className="small text-muted">
                                            {overview?.subscriptions?.trial || 0} trials, {overview?.subscriptions?.expired || 0} expired
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>

                            {/* Quick Actions */}
                            <Col xs={12}>
                                <Card className="bg-dark text-white border-0">
                                    <Card.Header className="bg-transparent border-0">
                                        <h5 className="mb-0"><FiServer className="me-2" />Quick Actions</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="d-flex flex-wrap gap-3">
                                            <Button 
                                                variant="outline-primary" 
                                                onClick={() => handleQuickAction('test_email')}
                                                disabled={quickActionLoading !== null}
                                            >
                                                <FiMail className="me-2" />
                                                {quickActionLoading === 'test_email' ? 'Sending...' : 'Test Email'}
                                            </Button>
                                            <Button 
                                                variant="outline-success" 
                                                onClick={() => handleQuickAction('backup_database')}
                                                disabled={quickActionLoading !== null}
                                            >
                                                <FiDatabase className="me-2" />
                                                {quickActionLoading === 'backup_database' ? 'Backing up...' : 'Backup Database'}
                                            </Button>
                                            <Button 
                                                variant="outline-warning" 
                                                onClick={() => handleQuickAction('clear_cache')}
                                                disabled={quickActionLoading !== null}
                                            >
                                                <FiShield className="me-2" />
                                                {quickActionLoading === 'clear_cache' ? 'Clearing...' : 'Clear Cache'}
                                            </Button>
                                            <Button 
                                                variant="outline-info" 
                                                onClick={() => handleQuickAction('cleanup_sessions')}
                                                disabled={quickActionLoading !== null}
                                            >
                                                <FiActivity className="me-2" />
                                                {quickActionLoading === 'cleanup_sessions' ? 'Cleaning...' : 'Cleanup Sessions'}
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Tab>

                    <Tab eventKey="broadcast" title={<span><FiSend className="me-2" />Broadcast</span>}>
                        <Row className="justify-content-center">
                            <Col lg={8}>
                                <Card className="bg-dark text-white border-0">
                                    <Card.Header className="bg-transparent border-0">
                                        <h5 className="mb-0">Send Global Broadcast</h5>
                                        <p className="text-muted small mb-0">Send announcements to all users or businesses on the platform.</p>
                                    </Card.Header>
                                    <Card.Body>
                                        <Form onSubmit={handleBroadcastSubmit}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Title</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Enter broadcast title"
                                                    value={broadcastForm.title}
                                                    onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                                                    required
                                                    className="bg-dark text-white border-secondary"
                                                />
                                            </Form.Group>
                                            
                                            <Form.Group className="mb-3">
                                                <Form.Label>Message</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={4}
                                                    placeholder="Enter your message"
                                                    value={broadcastForm.message}
                                                    onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                                                    required
                                                    className="bg-dark text-white border-secondary"
                                                />
                                            </Form.Group>
                                            
                                            <Row className="mb-3">
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Target Audience</Form.Label>
                                                        <Form.Select
                                                            value={broadcastForm.target}
                                                            onChange={(e) => setBroadcastForm({ ...broadcastForm, target: e.target.value })}
                                                            className="bg-dark text-white border-secondary"
                                                        >
                                                            <option value="all">All Users & Businesses</option>
                                                            <option value="businesses">All Businesses Only</option>
                                                            <option value="users">All Users Only</option>
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Priority</Form.Label>
                                                        <Form.Select
                                                            value={broadcastForm.priority}
                                                            onChange={(e) => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
                                                            className="bg-dark text-white border-secondary"
                                                        >
                                                            <option value="low">Low</option>
                                                            <option value="normal">Normal</option>
                                                            <option value="high">High</option>
                                                            <option value="critical">Critical</option>
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                            
                                            <Button variant="danger" type="submit" disabled={sending} className="w-100">
                                                {sending ? 'Sending...' : 'Send Broadcast'}
                                            </Button>
                                        </Form>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Tab>

                    <Tab eventKey="analytics" title={<span><FiActivity className="me-2" />API Analytics</span>}>
                        <Row className="g-4">
                            <Col xs={12}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="mb-0 text-white">API Usage Analytics</h5>
                                    <Form.Select
                                        value={apiDays}
                                        onChange={(e) => setApiDays(e.target.value)}
                                        className="bg-dark text-white border-secondary w-auto"
                                        onMouseLeave={fetchApiAnalytics}
                                    >
                                        <option value="7">Last 7 Days</option>
                                        <option value="14">Last 14 Days</option>
                                        <option value="30">Last 30 Days</option>
                                        <option value="90">Last 90 Days</option>
                                    </Form.Select>
                                </div>
                            </Col>
                            
                            <Col md={6} lg={3}>
                                <Card className="bg-dark text-white border-0">
                                    <Card.Body>
                                        <p className="text-muted mb-1">Total API Calls</p>
                                        <h3>{apiAnalytics?.total_calls || 0}</h3>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6} lg={3}>
                                <Card className="bg-dark text-white border-0">
                                    <Card.Body>
                                        <p className="text-muted mb-1">Avg. Daily Calls</p>
                                        <h3>{Math.round(apiAnalytics?.avg_daily_calls || 0)}</h3>
                                    </Card.Body>
                                </Card>
                            </Col>
                            
                            <Col xs={12}>
                                <Card className="bg-dark text-white border-0">
                                    <Card.Header className="bg-transparent border-0">
                                        <h6 className="mb-0">Top Businesses by API Usage</h6>
                                    </Card.Header>
                                    <Card.Body className="p-0">
                                        <Table responsive className="mb-0">
                                            <thead className="bg-dark text-muted">
                                                <tr>
                                                    <th>Business</th>
                                                    <th>API Calls</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {apiAnalytics?.top_businesses?.length > 0 ? (
                                                    apiAnalytics.top_businesses.map((biz, idx) => (
                                                        <tr key={idx}>
                                                            <td>{biz.business_name}</td>
                                                            <td><Badge bg="primary">{biz.api_calls}</Badge></td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={2} className="text-center text-muted">No data available</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Tab>


                    <Tab eventKey="settings" title={<span><FiSettings className="me-2" />Settings</span>}>
                        <Row className="justify-content-center">
                            <Col lg={8}>
                                <Card className="bg-dark text-white border-0">
                                    <Card.Header className="bg-transparent border-0">
                                        <h5 className="mb-0">Global System Settings</h5>
                                        <p className="text-muted small mb-0">Configure platform-wide settings.</p>
                                    </Card.Header>
                                    <Card.Body>
                                        <Form>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Platform Name</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={systemSettings.platform_name || ''}
                                                    onChange={(e) => setSystemSettings({ ...systemSettings, platform_name: e.target.value })}
                                                    className="bg-dark text-white border-secondary"
                                                />
                                            </Form.Group>
                                            
                                            <Form.Group className="mb-3">
                                                <Form.Check
                                                    type="switch"
                                                    label="Allow New User Registration"
                                                    checked={systemSettings.allow_registration === 'true'}
                                                    onChange={(e) => setSystemSettings({ ...systemSettings, allow_registration: e.target.checked ? 'true' : 'false' })}
                                                />
                                            </Form.Group>
                                            
                                            <Form.Group className="mb-3">
                                                <Form.Check
                                                    type="switch"
                                                    label="Require Email Verification"
                                                    checked={systemSettings.require_email_verification === 'true'}
                                                    onChange={(e) => setSystemSettings({ ...systemSettings, require_email_verification: e.target.checked ? 'true' : 'false' })}
                                                />
                                            </Form.Group>
                                            
                                            <Form.Group className="mb-3">
                                                <Form.Label>Max Businesses per User</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={systemSettings.max_businesses_per_user || ''}
                                                    onChange={(e) => setSystemSettings({ ...systemSettings, max_businesses_per_user: e.target.value })}
                                                    className="bg-dark text-white border-secondary"
                                                />
                                            </Form.Group>
                                            
                                            <Form.Group className="mb-3">
                                                <Form.Label>Default Subscription Plan</Form.Label>
                                                <Form.Select
                                                    value={systemSettings.default_subscription_plan || 'professional'}
                                                    onChange={(e) => setSystemSettings({ ...systemSettings, default_subscription_plan: e.target.value })}
                                                    className="bg-dark text-white border-secondary"
                                                >
                                                    <option value="free">Free</option>
                                                    <option value="starter">Starter</option>
                                                    <option value="professional">Professional</option>
                                                    <option value="enterprise">Enterprise</option>
                                                </Form.Select>
                                            </Form.Group>
                                            
                                            <Button variant="danger" onClick={handleSettingsSave} disabled={savingSettings}>
                                                {savingSettings ? 'Saving...' : 'Save Settings'}
                                            </Button>
                                        </Form>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Tab>
                </Tabs>
            </Container>

            <style dangerouslySetInnerHTML={{
                __html: `
                .superadmin-advanced {
                    background-color: #0f172a;
                    min-height: 100vh;
                }
                .card {
                    background-color: #1e293b !important;
                    border: 1px solid rgba(255, 255, 255, 0.05) !important;
                }
                .nav-pills .nav-link {
                    color: #94a3b8;
                    border-radius: 0.5rem;
                    padding: 0.5rem 1rem;
                }
                .nav-pills .nav-link.active {
                    background-color: #ef4444;
                    color: white;
                }
                .nav-pills .nav-link:hover {
                    color: white;
                }
                .table {
                    --bs-table-bg: transparent;
                    color: white;
                }
                .table thead th {
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    font-weight: 500;
                    text-transform: uppercase;
                    font-size: 0.75rem;
                }
                .form-control:focus, .form-select:focus {
                    background-color: #0f172a;
                    color: white;
                    border-color: #ef4444;
                    box-shadow: 0 0 0 0.25rem rgba(239, 68, 68, 0.25);
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}} />
        </div>
    );
};

export default SuperAdminAdvanced;
