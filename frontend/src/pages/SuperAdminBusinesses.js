import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Spinner, Form, InputGroup, Modal } from 'react-bootstrap';
import { superadminAPI } from '../services/api';
import { FiSearch, FiRefreshCw, FiLock, FiUnlock, FiMail, FiPhone, FiMapPin, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const SuperAdminBusinesses = () => {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingBusiness, setEditingBusiness] = useState(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        is_active: true
    });

    const fetchBusinesses = async () => {
        try {
            setRefreshing(true);
            const response = await superadminAPI.getBusinesses();
            setBusinesses(response.data);
        } catch (err) {
            console.error('Error fetching businesses:', err);
            toast.error('Failed to load businesses');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBusinesses();
    }, []);

    const handleEditClick = (business) => {
        setEditingBusiness(business);
        setEditFormData({
            name: business.name || '',
            email: business.email || '',
            phone: business.phone || '',
            address: business.address || '',
            city: business.city || '',
            country: business.country || '',
            is_active: business.is_active
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
            await superadminAPI.updateBusiness(editingBusiness.id, editFormData);
            toast.success('Business updated successfully');
            setShowEditModal(false);
            fetchBusinesses();
        } catch (err) {
            console.error('Error updating business:', err);
            toast.error(err.response?.data?.error || 'Failed to update business');
        }
    };

    const handleToggleStatus = async (businessId, currentStatus, businessName) => {
        const action = currentStatus ? 'block' : 'activate';
        toast((t) => (
            <div className="d-flex flex-column gap-2 p-1">
                <div className="d-flex align-items-center gap-2">
                    {currentStatus ? <FiLock className="text-danger" size={18} /> : <FiUnlock className="text-success" size={18} />}
                    <span className="fw-bold text-capitalize">{action} Business?</span>
                </div>
                <p className="mb-0 small text-white-50">
                    Are you sure you want to {action} <strong>{businessName}</strong>?
                    {currentStatus && " This will prevent all users from this business from accessing the platform."}
                </p>
                <div className="d-flex gap-2 justify-content-end mt-2">
                    <Button size="sm" variant="outline-light" className="border-0" onClick={() => toast.dismiss(t.id)}>
                        Cancel
                    </Button>
                    <Button size="sm" variant={currentStatus ? "danger" : "success"} className="px-3 shadow-sm" onClick={async () => {
                        try {
                            await superadminAPI.toggleBusinessStatus(businessId);
                            toast.dismiss(t.id);
                            toast.success(`Business ${action}ed successfully`);
                            fetchBusinesses();
                        } catch (err) {
                            toast.dismiss(t.id);
                            console.error(`Error ${action}ing business:`, err);
                            toast.error(err.response?.data?.error || `Failed to ${action} business`);
                        }
                    }}>
                        Confirm
                    </Button>
                </div>
            </div>
        ), {
            duration: 5000,
            style: {
                minWidth: '320px',
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff'
            }
        });
    };

    const handleDeleteBusiness = async (businessId, businessName) => {
        toast((t) => (
            <div className="d-flex flex-column gap-2 p-1">
                <div className="d-flex align-items-center gap-2">
                    <FiTrash2 className="text-danger" size={18} />
                    <span className="fw-bold">Delete Business?</span>
                </div>
                <p className="mb-0 small text-white-50">
                    Are you sure you want to delete <strong>{businessName}</strong>?
                    <span className="text-danger d-block mt-1 fw-bold">This action is permanent and will delete ALL related data (users, products, sales, etc).</span>
                </p>
                <div className="d-flex gap-2 justify-content-end mt-2">
                    <Button size="sm" variant="outline-light" className="border-0" onClick={() => toast.dismiss(t.id)}>
                        Cancel
                    </Button>
                    <Button size="sm" variant="danger" className="px-3 shadow-sm" onClick={async () => {
                        try {
                            await superadminAPI.deleteBusiness(businessId);
                            toast.dismiss(t.id);
                            toast.success(`Business ${businessName} deleted successfully`);
                            fetchBusinesses();
                        } catch (err) {
                            toast.dismiss(t.id);
                            console.error(`Error deleting business:`, err);
                            toast.error(err.response?.data?.error || `Failed to delete business`);
                        }
                    }}>
                        Delete Permanently
                    </Button>
                </div>
            </div>
        ), {
            duration: 7000,
            style: {
                minWidth: '350px',
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff'
            }
        });
    };

    const filteredBusinesses = businesses.filter(business =>
        business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (business.phone && business.phone.includes(searchTerm))
    );

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="superadmin-businesses py-4">
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold text-white mb-1">Business Management</h2>
                        <p className="text-muted mb-0">Monitor and control business accounts on the platform.</p>
                    </div>
                    <Button
                        variant="outline-danger"
                        className="d-flex align-items-center gap-2"
                        onClick={fetchBusinesses}
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
                                placeholder="Search businesses by name, email or phone..."
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
                                    <th className="border-0 ps-4">Business</th>
                                    <th className="border-0">Contact Info</th>
                                    <th className="border-0">Created At</th>
                                    <th className="border-0">Status</th>
                                    <th className="border-0 text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-white">
                                {filteredBusinesses.length > 0 ? (
                                    filteredBusinesses.map((business) => (
                                        <tr key={business.id} className="border-secondary border-opacity-10">
                                            <td className="border-0 ps-4">
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar-placeholder bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '45px', height: '45px' }}>
                                                        <span className="fw-bold text-danger">{business.name.charAt(0).toUpperCase()}</span>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold">{business.name}</div>
                                                        <div className="text-muted small">ID: #{business.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="border-0">
                                                <div className="d-flex flex-column gap-1">
                                                    <div className="small d-flex align-items-center gap-2">
                                                        <FiMail className="text-muted" /> {business.email}
                                                    </div>
                                                    <div className="small d-flex align-items-center gap-2">
                                                        <FiPhone className="text-muted" /> {business.phone || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="border-0 text-muted small">
                                                {new Date(business.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="border-0">
                                                <Badge bg={business.is_active ? 'success' : 'danger'} className="px-3 py-2">
                                                    {business.is_active ? 'Active' : 'Blocked'}
                                                </Badge>
                                            </td>
                                            <td className="border-0 text-end pe-4">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="d-inline-flex align-items-center gap-2 me-2"
                                                    onClick={() => handleEditClick(business)}
                                                    title="Edit Business"
                                                >
                                                    <FiEdit2 /> Edit
                                                </Button>
                                                <Button
                                                    variant={business.is_active ? "outline-danger" : "outline-success"}
                                                    size="sm"
                                                    className="d-inline-flex align-items-center gap-2"
                                                    onClick={() => handleToggleStatus(business.id, business.is_active, business.name)}
                                                >
                                                    {business.is_active ? (
                                                        <><FiLock /> Block</>
                                                    ) : (
                                                        <><FiUnlock /> Activate</>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    className="d-inline-flex align-items-center gap-2 ms-2"
                                                    onClick={() => handleDeleteBusiness(business.id, business.name)}
                                                    title="Delete Business"
                                                >
                                                    <FiTrash2 /> Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5 text-muted border-0">
                                            No businesses found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            </Container>

            {/* Edit Business Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Edit Business</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={editFormData.name}
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
                            <Form.Label>Phone</Form.Label>
                            <Form.Control
                                type="text"
                                name="phone"
                                value={editFormData.phone}
                                onChange={handleEditChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Address</Form.Label>
                            <Form.Control
                                type="text"
                                name="address"
                                value={editFormData.address}
                                onChange={handleEditChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>City</Form.Label>
                            <Form.Control
                                type="text"
                                name="city"
                                value={editFormData.city}
                                onChange={handleEditChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Country</Form.Label>
                            <Form.Control
                                type="text"
                                name="country"
                                value={editFormData.country}
                                onChange={handleEditChange}
                            />
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
                .superadmin-businesses {
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

export default SuperAdminBusinesses;
