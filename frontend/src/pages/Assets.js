import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, InputGroup, Form, Modal, Spinner } from 'react-bootstrap';
import { FiBox, FiSearch, FiEdit2, FiTrash2, FiUser, FiPlus, FiCheck, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import { assetsAPI, settingsAPI } from '../services/api';
import moment from 'moment';
import SubscriptionGuard from '../components/SubscriptionGuard';

const Assets = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [assets, setAssets] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [stats, setStats] = useState({ total_assets: 0, assigned: 0, available: 0, in_repair: 0 });
    const { formatCurrency } = useCurrency();

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [currentAsset, setCurrentAsset] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        serial_number: '',
        asset_tag: '',
        description: '',
        value: '',
        status: 'Available',
        assigned_to: '',
        assigned_date: '',
        purchase_date: '',
        warranty_expiry: '',
        location: '',
        notes: ''
    });

    useEffect(() => {
        fetchAssets();
        fetchUsers();
    }, []);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const response = await assetsAPI.getAssets({ search: searchTerm });
            setAssets(response.data.assets || []);
            setStats(response.data.stats || { total_assets: 0, assigned: 0, available: 0, in_repair: 0 });
            
        } catch (err) {
            console.error('Error fetching assets:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await settingsAPI.getUsers();
            setUsers(response.data.users || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchAssets();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleOpenModal = (asset = null) => {
        if (asset) {
            setCurrentAsset(asset);
            setFormData({
                name: asset.name || '',
                category: asset.category || '',
                serial_number: asset.serial_number || '',
                asset_tag: asset.asset_tag || '',
                description: asset.description || '',
                value: asset.value || '',
                status: asset.status || 'Available',
                assigned_to: asset.assigned_to || '',
                assigned_date: asset.assigned_date ? moment(asset.assigned_date).format('YYYY-MM-DD') : '',
                purchase_date: asset.purchase_date ? moment(asset.purchase_date).format('YYYY-MM-DD') : '',
                warranty_expiry: asset.warranty_expiry ? moment(asset.warranty_expiry).format('YYYY-MM-DD') : '',
                location: asset.location || '',
                notes: asset.notes || ''
            });
        } else {
            setCurrentAsset(null);
            setFormData({
                name: '',
                category: '',
                serial_number: '',
                asset_tag: '',
                description: '',
                value: '',
                status: 'Available',
                assigned_to: '',
                assigned_date: '',
                purchase_date: '',
                warranty_expiry: '',
                location: '',
                notes: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentAsset(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (currentAsset) {
                await assetsAPI.updateAsset(currentAsset.id, formData);
                toast.success('Asset updated successfully');
            } else {
                await assetsAPI.createAsset(formData);
                toast.success('Asset registered successfully');
            }
            handleCloseModal();
            fetchAssets();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save asset');
            console.error('Error saving asset:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
            try {
                await assetsAPI.deleteAsset(id);
                toast.success('Asset deleted successfully');
                fetchAssets();
            } catch (err) {
                toast.error('Failed to delete asset');
                console.error('Error deleting asset:', err);
            }
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Assigned': return <Badge bg="primary">Assigned</Badge>;
            case 'Available': return <Badge bg="success">Available</Badge>;
            case 'In Repair': return <Badge bg="warning" text="dark">In Repair</Badge>;
            case 'Retired': return <Badge bg="danger">Retired</Badge>;
            default: return <Badge bg="secondary">{status}</Badge>;
        }
    };

    if (loading && assets.length === 0) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="assets-wrapper p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Asset Management</h2>
                    <p className="text-muted mb-0">Track and manage company physical assets and equipment.</p>
                </div>
                <SubscriptionGuard message="Renew your subscription to register new assets">
                    <Button variant="primary" className="d-flex align-items-center mt-3 mt-md-0 shadow-sm" onClick={() => handleOpenModal()}>
                        <FiPlus className="me-2" /> Register New Asset
                    </Button>
                </SubscriptionGuard>
            </div>

            <Row className="g-3 g-md-4 mb-4">
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100 card-responsive">
                        <Card.Body className="d-flex align-items-center p-3 p-md-4">
                            <div className="bg-primary bg-opacity-10 p-2 p-md-3 rounded-3 me-2 me-md-3">
                                <FiBox className="text-primary" size={24} />
                            </div>
                            <div>
                                <div className="text-muted small small-md fw-medium mb-1">Total Assets</div>
                                <h3 className="fw-bold mb-0 h5 h4-md">{stats.total_assets}</h3>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100 card-responsive">
                        <Card.Body className="d-flex align-items-center p-3 p-md-4">
                            <div className="bg-success bg-opacity-10 p-2 p-md-3 rounded-3 me-2 me-md-3">
                                <FiCheck className="text-success" size={24} />
                            </div>
                            <div>
                                <div className="text-muted small small-md fw-medium mb-1">Available</div>
                                <h3 className="fw-bold mb-0 h5 h4-md">{stats.available}</h3>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100 card-responsive">
                        <Card.Body className="d-flex align-items-center p-3 p-md-4">
                            <div className="bg-info bg-opacity-10 p-2 p-md-3 rounded-3 me-2 me-md-3">
                                <FiUser className="text-info" size={24} />
                            </div>
                            <div>
                                <div className="text-muted small small-md fw-medium mb-1">Assigned</div>
                                <h3 className="fw-bold mb-0 h5 h4-md">{stats.assigned}</h3>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100 card-responsive">
                        <Card.Body className="d-flex align-items-center p-3 p-md-4">
                            <div className="bg-danger bg-opacity-10 p-2 p-md-3 rounded-3 me-2 me-md-3">
                                <FiTrash2 className="text-danger" size={24} />
                            </div>
                            <div>
                                <div className="text-muted small small-md fw-medium mb-1">In Repair</div>
                                <h3 className="fw-bold mb-0 h5 h4-md">{stats.in_repair}</h3>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <div className="p-3 border-bottom">
                        <InputGroup style={{ maxWidth: '400px' }}>
                            <InputGroup.Text className="bg-light border-0">
                                <FiSearch className="text-muted" />
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Search by name, serial, or tag..."
                                className="bg-light border-0 ps-0"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </InputGroup>
                    </div>

                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="ps-4 py-3 border-0">Asset Name</th>
                                    <th className="py-3 border-0">Category</th>
                                    <th className="py-3 border-0">Serial / Tag</th>
                                    <th className="py-3 border-0">Assigned To</th>
                                    <th className="py-3 border-0">Value</th>
                                    <th className="py-3 border-0">Status</th>
                                    <th className="text-end pe-4 py-3 border-0">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.length > 0 ? (
                                    assets.map(asset => (
                                        <tr key={asset.id}>
                                            <td className="ps-4">
                                                <div className="fw-bold text-dark">{asset.name}</div>
                                                <div className="text-muted small">{asset.location || 'No location'}</div>
                                            </td>
                                            <td><Badge bg="light" text="dark" className="border fw-normal">{asset.category}</Badge></td>
                                            <td>
                                                <div className="small text-dark">{asset.serial_number || 'N/A'}</div>
                                                <div className="text-muted extra-small">{asset.asset_tag || 'No tag'}</div>
                                            </td>
                                            <td>
                                                {asset.user ? (
                                                    <div className="d-flex align-items-center">
                                                        <div className="bg-light rounded-circle p-1 me-2"><FiUser size={12} /></div>
                                                        <span className="small">{asset.user.first_name} {asset.user.last_name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted small">-</span>
                                                )}
                                            </td>
                                            <td className="fw-medium">{formatCurrency(asset.value)}</td>
                                            <td>{getStatusBadge(asset.status)}</td>
                                            <td className="text-end pe-2 pe-md-4">
                                                <div className="d-flex gap-1 gap-md-2 justify-content-end">
                                                    <Button variant="outline-primary" size="sm" className="d-flex align-items-center" onClick={() => handleOpenModal(asset)} title="View Details">
                                                        <FiEye size={14} className="d-md-none" />
                                                        <span className="d-none d-md-inline">View</span>
                                                    </Button>
                                                    <Button variant="outline-warning" size="sm" className="d-flex align-items-center" onClick={() => handleOpenModal(asset)} title="Edit Details">
                                                        <FiEdit2 size={14} className="d-md-none" />
                                                        <span className="d-none d-md-inline">Edit</span>
                                                    </Button>
                                                    <Button variant="outline-danger" size="sm" className="d-flex align-items-center" onClick={() => handleDelete(asset.id)} title="Delete Asset">
                                                        <FiTrash2 size={14} className="d-md-none" />
                                                        <span className="d-none d-md-inline">Delete</span>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-5 text-muted">
                                            No assets found. Click &quot;Register New Asset&quot; to add one.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Asset Modal */}
            <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">
                        {currentAsset ? 'Edit Asset' : 'Register New Asset'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body className="pt-4">
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Asset Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g. MacBook Pro 16"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Category *</Form.Label>
                                    <Form.Select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Furniture">Furniture</option>
                                        <option value="Vehicles">Vehicles</option>
                                        <option value="Office Supplies">Office Supplies</option>
                                        <option value="Machinery">Machinery</option>
                                        <option value="Other">Other</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Serial Number</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="serial_number"
                                        value={formData.serial_number}
                                        onChange={handleInputChange}
                                        placeholder="Manufacturer serial number"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Asset Tag</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="asset_tag"
                                        value={formData.asset_tag}
                                        onChange={handleInputChange}
                                        placeholder="Internal tracking ID"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Value</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="value"
                                        value={formData.value}
                                        onChange={handleInputChange}
                                        placeholder="Purchase value"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Status</Form.Label>
                                    <Form.Select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                    >
                                        <option value="Available">Available</option>
                                        <option value="Assigned">Assigned</option>
                                        <option value="In Repair">In Repair</option>
                                        <option value="Retired">Retired</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Location</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        placeholder="Physical location"
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Assigned To</Form.Label>
                                    <Form.Select
                                        name="assigned_to"
                                        value={formData.assigned_to}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Unassigned</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.first_name} {user.last_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Assigned Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="assigned_date"
                                        value={formData.assigned_date}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Purchase Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="purchase_date"
                                        value={formData.purchase_date}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Warranty Expiry</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="warranty_expiry"
                                        value={formData.warranty_expiry}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Detailed description of the asset"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0">
                        <Button variant="light" onClick={handleCloseModal} className="px-4">
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={submitting} className="px-4">
                            {submitting ? (
                                <><Spinner size="sm" className="me-2" /> Saving...</>
                            ) : (
                                currentAsset ? 'Update Asset' : 'Register Asset'
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <style dangerouslySetInnerHTML={{
                __html: `
                /* Mobile Responsive Styles for Assets Cards */
                @media (max-width: 767.98px) {
                    .card-responsive {
                        min-height: 100px;
                        margin-bottom: 10px;
                    }
                    
                    .card-responsive .card-body {
                        padding: 12px !important;
                    }
                    
                    .small-md {
                        font-size: 0.75rem !important;
                    }
                    
                    .h4-md {
                        font-size: 1.25rem !important;
                    }
                    
                    .h5 {
                        font-size: 1rem !important;
                    }
                    
                    /* Adjust icon sizes for mobile */
                    .card-responsive svg {
                        width: 16px !important;
                        height: 16px !important;
                    }
                    
                    /* Reduce spacing between cards on mobile */
                    .row.g-3 {
                        --bs-gutter-x: 1rem;
                        --bs-gutter-y: 1rem;
                    }
                    
                    /* Responsive table cells */
                    .table td {
                        padding: 0.75rem 0.5rem !important;
                    }
                    
                    .btn-sm {
                        padding: 0.35rem 0.5rem !important;
                        font-size: 0.75rem !important;
                    }
                }
                
                @media (max-width: 575.98px) {
                    .table td {
                        padding: 0.5rem 0.3rem !important;
                    }
                    
                    .btn-sm {
                        padding: 0.3rem 0.4rem !important;
                        font-size: 0.65rem !important;
                    }
                    
                    table {
                        font-size: 0.75rem !important;
                    }
                }
                
                /* Desktop styles */
                @media (min-width: 768px) {
                    .small-md {
                        font-size: 0.875rem !important;
                    }
                    
                    .h4-md {
                        font-size: 1.5rem !important;
                    }
                }
                
                /* Smooth transitions */
                .card-responsive {
                    transition: all 0.2s ease-in-out;
                }
                
                .card-responsive:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1) !important;
                }
                
                .extra-small { font-size: 10px; }
                .assets-wrapper .card { border-radius: 12px; }
                .assets-wrapper .table thead th { font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
                .assets-wrapper .table tbody td { padding: 1rem 0.75rem; }
                
                /* Ensure action buttons are always visible */
                .btn {
                    display: inline-flex !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
            `}} />
        </div>
    );
};

export default Assets;
