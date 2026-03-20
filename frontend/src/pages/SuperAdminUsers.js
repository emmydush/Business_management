import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Spinner, Form, InputGroup, Modal } from 'react-bootstrap';
import { superadminAPI } from '../services/api';
import { FiSearch, FiCheck, FiX, FiTrash2, FiRefreshCw, FiEdit2, FiEye } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../components/auth/AuthContext';

const SuperAdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingUser, setViewingUser] = useState(null);
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

    const handleViewClick = async (user) => {
        try {
            const response = await superadminAPI.getUser(user.id);
            setViewingUser(response.data);
            setShowViewModal(true);
        } catch (err) {
            console.error('Error fetching user details:', err);
            toast.error('Failed to load user details');
        }
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
        (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusBadge = (status) => {
        const s = (status || '').toLowerCase();
        switch (s) {
            case 'approved': return <Badge bg="success" className="text-uppercase text-white">Approved</Badge>;
            case 'rejected': return <Badge bg="danger" className="text-uppercase text-white">Rejected</Badge>;
            case 'pending': return <Badge bg="warning" className="text-uppercase text-dark">Pending</Badge>;
            default: return <Badge bg="secondary" className="text-uppercase text-white">{status}</Badge>;
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
        <div className="superadmin-users py-4" style={{ background: '#ffffff', minHeight: '100vh' }}>
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-1" style={{ color: '#0f172a' }}>User Management</h2>
                        <p className="mb-0" style={{ color: '#64748b' }}>Manage platform users and approvals.</p>
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
                                                <Badge bg="info" className="text-uppercase text-white">{user.role}</Badge>
                                            </td>
                                            <td className="border-0 text-muted">
                                                #{user.business_id || 'N/A'}
                                            </td>
                                            <td className="border-0">
                                                <Badge bg={user.is_active ? 'success' : 'secondary'} className="text-white">
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="border-0">
                                                {getStatusBadge(user.approval_status)}
                                            </td>
                                            <td className="border-0 text-end pe-4">
                                                <div className="d-flex justify-content-end gap-2">
                                                    {user.approval_status === 'pending' && (
                                                        <>
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
                                                        </>
                                                    )}
                                                    <Button
                                                        variant="outline-info"
                                                        size="sm"
                                                        onClick={() => handleViewClick(user)}
                                                        title="View User Details"
                                                    >
                                                        <FiEye /> View
                                                    </Button>
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
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

            {/* View User Modal */}
            <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title style={{ color: '#0f172a' }}>User Details</Modal.Title>
                </Modal.Header>
                {viewingUser && (
                    <>
                        <Modal.Body>
                            <div className="mb-4">
                                <h6 className="text-muted text-uppercase small fw-bold mb-3" style={{ color: '#64748b' }}>Basic Information</h6>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded">
                                            <small className="d-block mb-1" style={{ color: '#64748b' }}>Username</small>
                                            <span className="fw-semibold" style={{ color: '#0f172a' }}>{viewingUser.username}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded">
                                            <small className="d-block mb-1" style={{ color: '#64748b' }}>Email</small>
                                            <span className="fw-semibold" style={{ color: '#0f172a' }}>{viewingUser.email}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded">
                                            <small className="d-block mb-1" style={{ color: '#64748b' }}>First Name</small>
                                            <span className="fw-semibold" style={{ color: '#0f172a' }}>{viewingUser.first_name}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded">
                                            <small className="d-block mb-1" style={{ color: '#64748b' }}>Last Name</small>
                                            <span className="fw-semibold" style={{ color: '#0f172a' }}>{viewingUser.last_name}</span>
                                        </div>
                                    </div>
                                    {viewingUser.phone && (
                                        <div className="col-md-6">
                                            <div className="p-3 bg-light rounded">
                                                <small className="d-block mb-1" style={{ color: '#64748b' }}>Phone</small>
                                                <span className="fw-semibold" style={{ color: '#0f172a' }}>{viewingUser.phone}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <h6 className="text-uppercase small fw-bold mb-3" style={{ color: '#64748b' }}>Account Information</h6>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded">
                                            <small className="d-block mb-1" style={{ color: '#64748b' }}>Role</small>
                                            <Badge bg="info" className="text-uppercase text-white">{viewingUser.role}</Badge>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded">
                                            <small className="d-block mb-1" style={{ color: '#64748b' }}>Business ID</small>
                                            <span className="fw-semibold" style={{ color: '#0f172a' }}>#{viewingUser.business_id || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded">
                                            <small className="d-block mb-1" style={{ color: '#64748b' }}>Status</small>
                                            <Badge bg={viewingUser.is_active ? 'success' : 'secondary'} className="text-white">
                                                {viewingUser.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded">
                                            <small className="d-block mb-1" style={{ color: '#64748b' }}>Approval Status</small>
                                            {getStatusBadge(viewingUser.approval_status)}
                                        </div>
                                    </div>
                                    {viewingUser.approved_by && (
                                        <div className="col-md-6">
                                            <div className="p-3 bg-light rounded">
                                                <small className="d-block mb-1" style={{ color: '#64748b' }}>Approved By</small>
                                                <span className="fw-semibold" style={{ color: '#0f172a' }}>#{viewingUser.approved_by}</span>
                                            </div>
                                        </div>
                                    )}
                                    {viewingUser.approved_at && (
                                        <div className="col-md-6">
                                            <div className="p-3 bg-light rounded">
                                                <small className="d-block mb-1" style={{ color: '#64748b' }}>Approved At</small>
                                                <span className="fw-semibold" style={{ color: '#0f172a' }}>{new Date(viewingUser.approved_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-3">
                                <h6 className="text-uppercase small fw-bold mb-3" style={{ color: '#64748b' }}>Timestamps</h6>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded">
                                            <small className="d-block mb-1" style={{ color: '#64748b' }}>Created At</small>
                                            <span className="fw-semibold" style={{ color: '#0f172a' }}>{viewingUser.created_at ? new Date(viewingUser.created_at).toLocaleString() : 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded">
                                            <small className="d-block mb-1" style={{ color: '#64748b' }}>Updated At</small>
                                            <span className="fw-semibold" style={{ color: '#0f172a' }}>{viewingUser.updated_at ? new Date(viewingUser.updated_at).toLocaleString() : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowViewModal(false)}>
                                Close
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={() => {
                                    setShowViewModal(false);
                                    handleEditClick(viewingUser);
                                }}
                            >
                                Edit User
                            </Button>
                        </Modal.Footer>
                    </>
                )}
            </Modal>

            {/* Edit User Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title style={{ color: '#0f172a' }}>Edit User</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ color: '#0f172a' }}>Username</Form.Label>
                            <Form.Control
                                type="text"
                                name="username"
                                value={editFormData.username}
                                onChange={handleEditChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ color: '#0f172a' }}>Email</Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                value={editFormData.email}
                                onChange={handleEditChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ color: '#0f172a' }}>First Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="first_name"
                                value={editFormData.first_name}
                                onChange={handleEditChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ color: '#0f172a' }}>Last Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="last_name"
                                value={editFormData.last_name}
                                onChange={handleEditChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ color: '#0f172a' }}>Phone</Form.Label>
                            <Form.Control
                                type="text"
                                name="phone"
                                value={editFormData.phone}
                                onChange={handleEditChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ color: '#0f172a' }}>Role</Form.Label>
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
                                label={<span style={{ color: '#0f172a' }}>Active</span>}
                                checked={editFormData.is_active}
                                onChange={handleEditChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ color: '#0f172a' }}>Approval Status</Form.Label>
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
                    background-color: #ffffff;
                    min-height: 100vh;
                }
                .card {
                    background-color: #ffffff !important;
                    border: 1px solid #e2e8f0 !important;
                }
                .table {
                    --bs-table-bg: transparent;
                    --bs-table-hover-bg: rgba(0, 0, 0, 0.02);
                    color: #0f172a !important;
                }
                .table th,
                .table td {
                    color: #0f172a !important;
                }
                .text-muted {
                    color: #64748b !important;
                }
                .form-control::placeholder {
                    color: rgba(0, 0, 0, 0.5) !important;
                }
                .form-control {
                    color: #0f172a !important;
                }
                .form-control:focus {
                    background-color: #ffffff;
                    color: #0f172a;
                    border-color: #ef4444;
                    box-shadow: 0 0 0 0.25rem rgba(239, 68, 68, 0.25);
                }
                .input-group-text {
                    color: #64748b !important;
                }
                .btn {
                    color: #0f172a !important;
                }
                .modal-title {
                    color: #0f172a !important;
                }
                .form-label {
                    color: #0f172a !important;
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
