import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, Modal, Form } from 'react-bootstrap';
import { FiShield, FiUser, FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { settingsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Permissions = () => {
    const [permissions, setPermissions] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentPermission, setCurrentPermission] = useState(null);
    const [permissionData, setPermissionData] = useState({
        user_id: '',
        module: '',
        permission: '',
        granted: true
    });

    const modules = [
        { value: 'dashboard', label: 'Dashboard' },
        { value: 'sales', label: 'Sales' },
        { value: 'inventory', label: 'Inventory' },
        { value: 'purchases', label: 'Purchases' },
        { value: 'expenses', label: 'Expenses' },
        { value: 'hr', label: 'HR' },
        { value: 'reports', label: 'Reports' },
        { value: 'settings', label: 'Settings' },
        { value: 'communication', label: 'Communication' },
        { value: 'customers', label: 'Customers' },
        { value: 'suppliers', label: 'Suppliers' },
        { value: 'assets', label: 'Assets' },
        { value: 'tasks', label: 'Tasks' },
        { value: 'projects', label: 'Projects' },
        { value: 'documents', label: 'Documents' },
        { value: 'payroll', label: 'Payroll' },
        { value: 'attendance', label: 'Attendance' },
        { value: 'leave', label: 'Leave Requests' },
        { value: 'pos', label: 'Point of Sale' },
        { value: 'taxes', label: 'Taxes' }
    ];

    const permissionsList = [
        { value: 'read', label: 'Read' },
        { value: 'write', label: 'Write' },
        { value: 'delete', label: 'Delete' },
        { value: 'admin', label: 'Admin' },
        { value: 'view', label: 'View Only' },
        { value: 'export', label: 'Export' },
        { value: 'approve', label: 'Approve' },
        { value: 'finance', label: 'Finance Access' }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [permissionsRes, usersRes] = await Promise.all([
                settingsAPI.getPermissions(),
                settingsAPI.getUsers()
            ]);
            setPermissions(permissionsRes.data.permissions || []);
            setUsers(usersRes.data.users || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch permissions and users.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await settingsAPI.createPermission(permissionData);
            toast.success('Permission created successfully');
            setShowCreateModal(false);
            setPermissionData({ user_id: '', module: '', permission: '', granted: true });
            fetchData();
        } catch (err) {
            toast.error('Failed to create permission');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (id, granted) => {
        try {
            await settingsAPI.updatePermission(id, { granted });
            toast.success('Permission updated successfully');
            fetchData();
        } catch (err) {
            toast.error('Failed to update permission');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this permission?')) {
            try {
                await settingsAPI.deletePermission(id);
                toast.success('Permission deleted successfully');
                fetchData();
            } catch (err) {
                toast.error('Failed to delete permission');
            }
        }
    };

    const handleEdit = (permission) => {
        setCurrentPermission(permission);
        setPermissionData({
            user_id: permission.user_id,
            module: permission.module,
            permission: permission.permission,
            granted: permission.granted
        });
        setShowEditModal(true);
    };

    const getUserById = (userId) => {
        return users.find(user => user.id === userId) || { username: 'Unknown User' };
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
                    <h2 className="fw-bold text-dark mb-1">Permissions</h2>
                    <p className="text-muted mb-0">Manage user permissions and access rights</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button 
                        variant="primary" 
                        className="d-flex align-items-center"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <FiPlus className="me-2" /> Add Permission
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row>
                <Col lg={12}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">User Permissions</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-4">User</th>
                                            <th>Module</th>
                                            <th>Permission</th>
                                            <th>Status</th>
                                            <th className="text-end pe-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {permissions.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="text-center py-5">
                                                    <div className="d-flex flex-column align-items-center">
                                                        <FiShield size={48} className="text-muted mb-3" />
                                                        <h5 className="fw-bold text-dark">No permissions</h5>
                                                        <p className="text-muted mb-0">No user permissions have been configured yet</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            permissions.map(permission => (
                                                <tr key={permission.id}>
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center">
                                                            <FiUser className="text-muted me-2" />
                                                            <div>
                                                                <div className="fw-bold">
                                                                    {permission.user ? 
                                                                        `${permission.user.first_name} ${permission.user.last_name}` : 
                                                                        getUserById(permission.user_id).username}
                                                                </div>
                                                                <div className="small text-muted">
                                                                    {permission.user ? permission.user.username : 'User details not available'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="fw-bold text-capitalize">{permission.module}</div>
                                                    </td>
                                                    <td>
                                                        <div className="text-capitalize">{permission.permission}</div>
                                                    </td>
                                                    <td>
                                                        <Form.Check
                                                            type="switch"
                                                            id={`permission-${permission.id}`}
                                                            checked={permission.granted}
                                                            onChange={(e) => handleUpdate(permission.id, e.target.checked)}
                                                            label={permission.granted ? 'Granted' : 'Revoked'}
                                                        />
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        <Button 
                                                            variant="outline-primary" 
                                                            size="sm" 
                                                            className="me-2"
                                                            onClick={() => handleEdit(permission)}
                                                        >
                                                            <FiEdit />
                                                        </Button>
                                                        <Button 
                                                            variant="outline-danger" 
                                                            size="sm"
                                                            onClick={() => handleDelete(permission.id)}
                                                        >
                                                            <FiTrash2 />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            {/* Bulk Permissions Assignment Section */}
            <Row className="mt-4">
                <Col lg={12}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Bulk Permissions Assignment</h5>
                            <p className="text-muted mb-0 small">Assign multiple permissions to users at once</p>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={3}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Select User</Form.Label>
                                        <Form.Select
                                            value={permissionData.user_id}
                                            onChange={(e) => setPermissionData({ ...permissionData, user_id: parseInt(e.target.value) || '' })}
                                        >
                                            <option value="">Choose a user</option>
                                            {users.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.first_name} {user.last_name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Select Module</Form.Label>
                                        <Form.Select
                                            value={permissionData.module}
                                            onChange={(e) => setPermissionData({ ...permissionData, module: e.target.value })}
                                        >
                                            <option value="">Choose a module</option>
                                            {modules.map(module => (
                                                <option key={module.value} value={module.value}>
                                                    {module.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Select Permission</Form.Label>
                                        <Form.Select
                                            value={permissionData.permission}
                                            onChange={(e) => setPermissionData({ ...permissionData, permission: e.target.value })}
                                        >
                                            <option value="">Choose a permission</option>
                                            {permissionsList.map(perm => (
                                                <option key={perm.value} value={perm.value}>
                                                    {perm.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Status</Form.Label>
                                        <Form.Select
                                            value={permissionData.granted}
                                            onChange={(e) => setPermissionData({ ...permissionData, granted: e.target.value === 'true' })}
                                        >
                                            <option value={true}>Granted</option>
                                            <option value={false}>Revoked</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <div className="d-flex">
                                <Button 
                                    variant="primary" 
                                    onClick={() => {
                                        if (!permissionData.user_id || !permissionData.module || !permissionData.permission) {
                                            toast.error('Please select user, module, and permission');
                                            return;
                                        }
                                        settingsAPI.createPermission(permissionData)
                                            .then(() => {
                                                toast.success('Permission created successfully');
                                                setPermissionData({
                                                    user_id: '',
                                                    module: '',
                                                    permission: '',
                                                    granted: true
                                                });
                                                fetchData();
                                            })
                                            .catch(() => toast.error('Failed to create permission'));
                                    }}
                                >
                                    Add Permission
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Create Permission Modal */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add Permission</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>User</Form.Label>
                            <Form.Select
                                value={permissionData.user_id}
                                onChange={(e) => setPermissionData({ ...permissionData, user_id: parseInt(e.target.value) })}
                                required
                            >
                                <option value="">Select a user</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.first_name} {user.last_name} ({user.username})
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Module</Form.Label>
                            <Form.Select
                                value={permissionData.module}
                                onChange={(e) => setPermissionData({ ...permissionData, module: e.target.value })}
                                required
                            >
                                <option value="">Select a module</option>
                                {modules.map(module => (
                                    <option key={module.value} value={module.value}>
                                        {module.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Permission</Form.Label>
                            <Form.Select
                                value={permissionData.permission}
                                onChange={(e) => setPermissionData({ ...permissionData, permission: e.target.value })}
                                required
                            >
                                <option value="">Select a permission</option>
                                {permissionsList.map(perm => (
                                    <option key={perm.value} value={perm.value}>
                                        {perm.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="switch"
                                id="permission-granted"
                                label="Permission Granted"
                                checked={permissionData.granted}
                                onChange={(e) => setPermissionData({ ...permissionData, granted: e.target.checked })}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={saving}>
                            {saving ? (
                                <>
                                    <div className="spinner-border spinner-border-sm me-2" role="status">
                                        <span className="visually-hidden">Saving...</span>
                                    </div>
                                    Saving...
                                </>
                            ) : 'Add Permission'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Edit Permission Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Permission</Modal.Title>
                </Modal.Header>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdate(currentPermission.id, permissionData.granted);
                    setShowEditModal(false);
                }}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>User</Form.Label>
                            <Form.Select
                                value={permissionData.user_id}
                                onChange={(e) => setPermissionData({ ...permissionData, user_id: parseInt(e.target.value) })}
                                required
                            >
                                <option value="">Select a user</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id} selected={user.id === permissionData.user_id}>
                                        {user.first_name} {user.last_name} ({user.username})
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Module</Form.Label>
                            <Form.Select
                                value={permissionData.module}
                                onChange={(e) => setPermissionData({ ...permissionData, module: e.target.value })}
                                required
                            >
                                <option value="">Select a module</option>
                                {modules.map(module => (
                                    <option key={module.value} value={module.value} selected={module.value === permissionData.module}>
                                        {module.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Permission</Form.Label>
                            <Form.Select
                                value={permissionData.permission}
                                onChange={(e) => setPermissionData({ ...permissionData, permission: e.target.value })}
                                required
                            >
                                <option value="">Select a permission</option>
                                {permissionsList.map(perm => (
                                    <option key={perm.value} value={perm.value} selected={perm.value === permissionData.permission}>
                                        {perm.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="switch"
                                id="edit-permission-granted"
                                label="Permission Granted"
                                checked={permissionData.granted}
                                onChange={(e) => setPermissionData({ ...permissionData, granted: e.target.checked })}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Update Permission
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default Permissions;
