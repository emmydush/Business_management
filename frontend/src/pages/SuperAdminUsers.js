import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Spinner, Form, InputGroup } from 'react-bootstrap';
import { superadminAPI } from '../services/api';
import { FiSearch, FiCheck, FiX, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../components/auth/AuthContext';

const SuperAdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState(false);

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
