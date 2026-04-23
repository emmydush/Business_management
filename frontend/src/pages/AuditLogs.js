import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, Badge, Form, Pagination } from 'react-bootstrap';
import { FiActivity, FiUser, FiClock, FiRefreshCw, FiDownload, FiEye, FiTrash2 } from 'react-icons/fi';
import { superadminAPI } from '../services/api';

const AuditLogs = () => {
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        per_page: 20,
        total: 0,
        pages: 0
    });
    const [filters, setFilters] = useState({
        action: '',
        user: '',
        date_from: '',
        date_to: ''
    });



    useEffect(() => {
        fetchAuditLogs();
    }, [pagination.page]);

    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            // Use the superadmin API for audit logs (requires superadmin role)
            const response = await superadminAPI.getAuditLogs({
                page: pagination.page,
                per_page: pagination.per_page,
                action: filters.action || undefined,
                user_id: filters.user || undefined
            });
            
            if (response.data && response.data.logs) {
                setAuditLogs(response.data.logs);
                setPagination({
                    ...pagination,
                    total: response.data.total || 0,
                    pages: response.data.pages || 0
                });
            } else if (response.data && response.data.audit_logs) {
                // Fallback for different response format
                setAuditLogs(response.data.audit_logs);
                setPagination({
                    ...pagination,
                    total: response.data.audit_logs.length,
                    pages: 1
                });
            } else {
                setAuditLogs([]);
                setPagination({
                    ...pagination,
                    total: 0,
                    pages: 0
                });
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching audit logs:', err);
            setError('Failed to fetch audit logs.');
            setAuditLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyFilters = () => {
        fetchAuditLogs();
    };

    const handleClearFilters = () => {
        setFilters({
            action: '',
            user: '',
            date_from: '',
            date_to: ''
        });
        fetchAuditLogs();
    };

    const getActionBadge = (action) => {
        let variant = 'secondary';
        let text = action;
        
        switch (action) {
            case 'user_login':
                variant = 'success';
                text = 'Login';
                break;
            case 'user_create':
            case 'product_create':
            case 'order_create':
            case 'customer_create':
                variant = 'primary';
                text = 'Created';
                break;
            case 'user_update':
            case 'product_update':
            case 'order_update':
            case 'customer_update':
            case 'settings_update':
                variant = 'warning';
                text = 'Updated';
                break;
            case 'user_delete':
            case 'product_delete':
                variant = 'danger';
                text = 'Deleted';
                break;
            case 'report_view':
                variant = 'info';
                text = 'Viewed Report';
                break;
            default:
                variant = 'secondary';
        }
        
        return <Badge bg={variant} className="fw-normal">{text}</Badge>;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
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
        <Container fluid className="py-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Audit Logs</h2>
                    <p className="text-muted mb-0">Track user activities and system changes</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-secondary" className="d-flex align-items-center" onClick={fetchAuditLogs}>
                        <FiRefreshCw className="me-2" /> Refresh
                    </Button>
                    <Button variant="outline-primary" className="d-flex align-items-center">
                        <FiDownload className="me-2" /> Export Logs
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="mb-4">
                <Col lg={12}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Filters</h5>
                        </Card.Header>
                        <Card.Body>
                            <Form>
                                <Row className="g-3">
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold">Action Type</Form.Label>
                                            <Form.Select
                                                name="action"
                                                value={filters.action}
                                                onChange={handleFilterChange}
                                            >
                                                <option value="">All Actions</option>
                                                <option value="user_login">Login</option>
                                                <option value="user_create">Create User</option>
                                                <option value="user_update">Update User</option>
                                                <option value="product_create">Create Product</option>
                                                <option value="product_update">Update Product</option>
                                                <option value="order_create">Create Order</option>
                                                <option value="settings_update">Settings Update</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold">User</Form.Label>
                                            <Form.Select
                                                name="user"
                                                value={filters.user}
                                                onChange={handleFilterChange}
                                            >
                                                <option value="">All Users</option>
                                                <option value="admin">John Doe (admin)</option>
                                                <option value="manager">Jane Smith (manager)</option>
                                                <option value="staff">Bob Johnson (staff)</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold">Date From</Form.Label>
                                            <Form.Control
                                                type="date"
                                                name="date_from"
                                                value={filters.date_from}
                                                onChange={handleFilterChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold">Date To</Form.Label>
                                            <Form.Control
                                                type="date"
                                                name="date_to"
                                                value={filters.date_to}
                                                onChange={handleFilterChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <div className="d-flex justify-content-end gap-2 mt-3">
                                    <Button variant="outline-secondary" onClick={handleClearFilters}>
                                        Clear Filters
                                    </Button>
                                    <Button variant="primary" onClick={handleApplyFilters}>
                                        Apply Filters
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col lg={12}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Audit Log Entries</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-4">User</th>
                                            <th>Action</th>
                                            <th>Resource</th>
                                            <th>IP Address</th>
                                            <th>Date & Time</th>
                                            <th className="text-end pe-4">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {auditLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="text-center py-5">
                                                    <div className="d-flex flex-column align-items-center">
                                                        <FiActivity size={48} className="text-muted mb-3" />
                                                        <h5 className="fw-bold text-dark">No audit logs</h5>
                                                        <p className="text-muted mb-0">No audit log entries found for the selected filters</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            auditLogs.map(log => (
                                                <tr key={log.id}>
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center">
                                                            <FiUser className="text-muted me-2" />
                                                            <div>
                                                                <div className="fw-bold">
                                                                    {log.user ? 
                                                                        `${log.user.first_name} ${log.user.last_name}` : 
                                                                        'Unknown User'}
                                                                </div>
                                                                <div className="small text-muted">
                                                                    {log.user ? log.user.username : 'N/A'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {getActionBadge(log.action)}
                                                    </td>
                                                    <td>
                                                        <div className="fw-bold text-capitalize">{log.resource_type || 'N/A'}</div>
                                                        <div className="small text-muted">
                                                            ID: {log.resource_id || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="fw-bold">{log.ip_address}</div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <FiClock className="text-muted me-2" />
                                                            <div>
                                                                <div>{formatDate(log.created_at)}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        <Button 
                                                            variant="outline-primary" 
                                                            size="sm" 
                                                            className="me-2"
                                                        >
                                                            <FiEye className="me-1" /> View
                                                        </Button>
                                                        <Button 
                                                            variant="outline-secondary" 
                                                            size="sm"
                                                        >
                                                            <FiTrash2 className="me-1" /> Delete
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                            
                            <div className="border-top py-3 px-4 d-flex justify-content-between align-items-center">
                                <div className="text-muted">
                                    Showing {Math.min((pagination.page - 1) * pagination.per_page + 1, pagination.total)} to {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total} entries
                                </div>
                                <Pagination className="mb-0">
                                    <Pagination.Prev disabled={pagination.page <= 1} />
                                    <Pagination.Item active>{pagination.page}</Pagination.Item>
                                    <Pagination.Next disabled={pagination.page >= pagination.pages} />
                                </Pagination>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AuditLogs;
