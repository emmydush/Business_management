import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Spinner, Form, InputGroup, Modal } from 'react-bootstrap';
import { superadminAPI } from '../services/api';
import { FiSearch, FiCheck, FiX, FiTrash2, FiRefreshCw, FiEdit2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../components/auth/AuthContext';

const SuperAdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: '',
        is_active: true,
        approval_status: ''
    });

    const fetchUsers = async () => {
        try {
            setRefreshing(true);
            const response = await superadminAPI.getUsers();
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleApprove = async (userId) => {
        try {
            await superadminAPI.approveUser(userId);
            toast.success('User approved successfully');
            fetchUsers();
        } catch (err) {
            console.error('Error approving user:', err);
            toast.error(err.response?.data?.error || 'Failed to approve user');
        }
    };

    const handleReject = (userId) => {
        toast((t) => (
            <div className="d-flex flex-column gap-2 p-1">
                <div className="d-flex align-items-center gap-2">
                    <FiX className="text-danger" size={18} />
                    <span className="fw-bold">Reject User?</span>
                </div>
                <p className="mb-0 small text-white-50">Are you sure you want to reject this user?</p>
                <div className="d-flex gap-2 justify-content-end mt-2">
                    <Button size="sm" variant="outline-light" className="border-0" onClick={() => toast.dismiss(t.id)}>
                        Cancel
                    </Button>
                    <Button size="sm" variant="danger" className="px-3 shadow-sm" onClick={async () => {
                        try {
                            await superadminAPI.rejectUser(userId);
                            toast.dismiss(t.id);
                            toast.success('User rejected successfully');
                            fetchUsers();
                        } catch (err) {
                            toast.dismiss(t.id);
                            console.error('Error rejecting user:', err);
                            toast.error(err.response?.data?.error || 'Failed to reject user');
                        }
                    }}>
                        Reject
                    </Button>
                </div>
            </div>
        ), {
            duration: 4000,
            style: {
                minWidth: '300px',
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff'
            }
        });
    };

    // Current signed-in user
    const { user: currentUser } = useAuth();

    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditFormData({
            username: user.username || '',
            email: user.email || '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            phone: user.phone || '',
            role: user.role || '',
            is_active: user.is_active,
            approval_status: user.approval_status || ''
        });
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await superadminAPI.updateUser(editingUser.id, editFormData);
            toast.success('User updated successfully');
            setShowEditModal(false);
            fetchUsers();
        } catch (err) {
            console.error('Error updating user:', err);
            toast.error(err.response?.data?.error || 'Failed to update user');
        }
    };

    const handleDelete = (userId) => {
        toast((t) => (
            <div className="d-flex flex-column gap-2 p-1">
                <div className="d-flex align-items-center gap-2">
                    <FiTrash2 className="text-danger" size={18} />
                    <span className="fw-bold">Delete User?</span>
                </div>
                <p className="mb-0 small text-white-50">Are you sure you want to delete this user? This action cannot be undone.</p>
                <div className="d-flex gap-2 justify-content-end mt-2">
                    <Button size="sm" variant="outline-light" className="border-0" onClick={() => toast.dismiss(t.id)}>
                        Cancel
                    </Button>
                    <Button size="sm" variant="danger" className="px-3 shadow-sm" onClick={async () => {
                        try {
                            await superadminAPI.deleteUser(userId);
                            toast.dismiss(t.id);
                            toast.success('User deleted successfully');
                            fetchUsers();
                        } catch (err) {
                            toast.dismiss(t.id);
                            console.error('Error deleting user:', err);
                            toast.error(err.response?.data?.error || 'Failed to delete user');
                        }
                    }}>
                        Delete
                    </Button>
                </div>
            </div>
        ), {
            duration: 4000,
            style: {
                minWidth: '300px',
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff'
            }
        });
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusBadge = (status) => {
        const s = (status || '').toLowerCase();
        switch (s) {
            case 'approved': return <Badge bg="success">Approved</Badge>;
            case 'rejected': return <Badge bg="danger">Rejected</Badge>;
            case 'pending': return <Badge bg="warning" text="dark">Pending</Badge>;
            default: return <Badge bg="secondary">{status}</Badge>;
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
        <div className="superadmin-users py-4">
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold text-white mb-1">User Management</h2>
                        <p className="text-muted mb-0">Manage platform users and approvals.</p>
                    </div>
                    <Button
                        variant="outline-danger"
                        className="d-flex align-items-center gap-2"
                        onClick={fetchUsers}
                        disabled={refreshing}
                    >
                        <FiRefreshCw className={refreshing ? 'spin' : ''} />
                        {refreshing ? 'Refreshing...' : 'Refresh List'}
                    </Button>
                </div>

                <Card className="border-0 shadow-sm bg-dark text-white">
                    <Card.Header className="bg-transparent border-0 p-4">
                        <InputGroup className="w-50">
                            <InputGroup.Text className="bg-dark border-secondary text-muted">
                                <FiSearch />
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder="Search users by name, email or username..."
                                className="bg-dark border-secondary text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <Table responsive hover className="align-middle mb-0 border-secondary border-opacity-10">
                            <thead className="bg-dark text-muted small text-uppercase">
                                <tr>
                                    <th className="border-0 ps-4">User</th>
                                    <th className="border-0">Role</th>
                                    <th className="border-0">Business ID</th>
                                    <th className="border-0">Status</th>
                                    <th className="border-0">Approval</th>
                                    <th className="border-0 text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-white">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="border-secondary border-opacity-10">
                                            <td className="border-0 ps-4">
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar-placeholder bg-secondary bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                                        <span className="fw-bold text-white">{user.username.charAt(0).toUpperCase()}</span>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold">{user.first_name} {user.last_name}</div>
                                                        <div className="text-muted small">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="border-0">
                                                <Badge bg="info" className="text-uppercase">{user.role}</Badge>
                                            </td>
                                            <td className="border-0 text-muted">
                                                #{user.business_id || 'N/A'}
                                            </td>
                                            <td className="border-0">
                                                <Badge bg={user.is_active ? 'success' : 'secondary'}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="border-0">
                                                {getStatusBadge(user.approval_status)}
                                            </td>
                                            <td className="border-0 text-end pe-4">
                                                {String(user.approval_status).toLowerCase() === 'pending' && (
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            onClick={() => handleApprove(user.id)}
                                                            title="Approve User"
                                                        >
                                                            <FiCheck /> Approve
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleReject(user.id)}
                                                            title="Reject User"
                                                        >
                                                            <FiX /> Reject
                                                        </Button>
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            className="me-2"
                                                            onClick={() => handleEditClick(user)}
                                                            title="Edit User"
                                                        >
                                                            <FiEdit2 /> Edit
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDelete(user.id)}
                                                            disabled={currentUser?.id === user.id}
                                                            title={currentUser?.id === user.id ? 'Cannot delete your own account' : 'Delete User'}
                                                        >
                                                            <FiTrash2 /> Delete
                                                        </Button>
                                                    </div>
                                                )}
                                                {user.approval_status !== 'pending' && (
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            className="me-2"
                                                            onClick={() => handleEditClick(user)}
                                                            title="Edit User"
                                                        >
                                                            <FiEdit2 /> Edit
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDelete(user.id)}
                                                            disabled={currentUser?.id === user.id}
                                                            title={currentUser?.id === user.id ? 'Cannot delete your own account' : 'Delete User'}
                                                        >
                                                            <FiTrash2 /> Delete
                                                        </Button>
                                                    </div>
                                                )}
                                                {user.approval_status !== 'pending' && (
                                                    <span className="text-muted small">No actions</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5 text-muted border-0">
                                            No users found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            </Container>

            {/* Edit User Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Edit User</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                                type="text"
                                name="username"
                                value={editFormData.username}
                                onChange={handleEditChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                value={editFormData.email}
                                onChange={handleEditChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>First Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="first_name"
                                value={editFormData.first_name}
                                onChange={handleEditChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Last Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="last_name"
                                value={editFormData.last_name}
                                onChange={handleEditChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Phone</Form.Label>
                            <Form.Control
                                type="text"
                                name="phone"
                                value={editFormData.phone}
                                onChange={handleEditChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Role</Form.Label>
                            <Form.Select
                                name="role"
                                value={editFormData.role}
                                onChange={handleEditChange}
                            >
                                <option value="">Select Role</option>
                                <option value="superadmin">Super Admin</option>
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                                <option value="staff">Staff</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="switch"
                                name="is_active"
                                label="Active"
                                checked={editFormData.is_active}
                                onChange={handleEditChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Approval Status</Form.Label>
                            <Form.Select
                                name="approval_status"
                                value={editFormData.approval_status}
                                onChange={handleEditChange}
                            >
                                <option value="">Select Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Save Changes
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <style dangerouslySetInnerHTML={{
                __html: `
                .superadmin-users {
                    background-color: #0f172a;
                    min-height: 100vh;
                }
                .card {
                    background-color: #1e293b !important;
                    border: 1px solid rgba(255, 255, 255, 0.05) !important;
                }
                .table {
                    --bs-table-bg: transparent;
                    --bs-table-hover-bg: rgba(255, 255, 255, 0.02);
                }
                .form-control::placeholder {
                    color: rgba(255, 255, 255, 0.3);
                }
                .form-control:focus {
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

export default SuperAdminUsers;
