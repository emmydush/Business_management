import React, { useState, useEffect, useCallback } from 'react';
import { 
    Container, Row, Col, Card, Table, Button, Badge, 
    Modal, Form, InputGroup, Spinner, Dropdown, ButtonGroup 
} from 'react-bootstrap';
import { 
    FiPlus, FiSearch, FiEdit2, FiTrash2, FiMapPin, 
    FiPhone, FiMail, FiRefreshCw, FiHome, FiMap,
    FiCheck, FiX
} from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { superadminAPI } from '../services/api';
import toast from 'react-hot-toast';
// import { motion, AnimatePresence } from 'framer-motion';

const SuperAdminBranches = () => {
    const location = useLocation();
    const [branches, setBranches] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentBranch, setCurrentBranch] = useState(null);
    const [saving, setSaving] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterBusiness, setFilterBusiness] = useState(location.state?.businessId?.toString() || 'all');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [branchesRes, businessesRes] = await Promise.all([
                superadminAPI.getBranches(),
                superadminAPI.getBusinesses()
            ]);
            setBranches(branchesRes.data);
            setBusinesses(businessesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load branches data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleShowModal = (branch = null) => {
        setCurrentBranch(branch);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setCurrentBranch(null);
        setShowModal(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const branchData = {
            business_id: formData.get('business_id'),
            name: formData.get('name'),
            code: formData.get('code'),
            address: formData.get('address'),
            city: formData.get('city'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            is_headquarters: formData.get('is_headquarters') === 'on',
            is_active: formData.get('is_active') === 'on',
            status: formData.get('status')
        };

        try {
            setSaving(true);
            if (currentBranch) {
                await superadminAPI.updateBranch(currentBranch.id, branchData);
                toast.success('Branch updated successfully');
            } else {
                await superadminAPI.createBranch(branchData);
                toast.success('Branch created successfully');
            }
            handleCloseModal();
            fetchData();
        } catch (error) {
            console.error('Error saving branch:', error);
            toast.error(error.response?.data?.error || 'Failed to save branch');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
            try {
                await superadminAPI.deleteBranch(id);
                toast.success('Branch deleted successfully');
                fetchData();
            } catch (error) {
                console.error('Error deleting branch:', error);
                toast.error('Failed to delete branch');
            }
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await superadminAPI.updateBranch(id, { status });
            toast.success(`Branch ${status} successfully`);
            fetchData();
        } catch (error) {
            console.error(`Error updating status:`, error);
            toast.error(`Failed to update branch status`);
        }
    };

    const filteredBranches = branches.filter(branch => {
        const matchesSearch = 
            branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (branch.code && branch.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
            branch.business_name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = filterStatus === 'all' || branch.status === filterStatus;
        const matchesBusiness = filterBusiness === 'all' || branch.business_id.toString() === filterBusiness;
        
        return matchesSearch && matchesStatus && matchesBusiness;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved': return <Badge bg="success">Approved</Badge>;
            case 'pending': return <Badge bg="warning" text="dark">Pending</Badge>;
            case 'rejected': return <Badge bg="danger">Rejected</Badge>;
            default: return <Badge bg="secondary">{status}</Badge>;
        }
    };

    return (
        <Container fluid className="py-4">
            <header className="mb-4 d-flex justify-content-between align-items-center">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Branch Management</h2>
                    <p className="text-muted mb-0">Manage all business locations and branches across the platform</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-primary" onClick={fetchData} disabled={loading}>
                        <FiRefreshCw className={loading ? 'spin' : ''} />
                    </Button>
                    <Button variant="primary" onClick={() => handleShowModal()}>
                        <FiPlus className="me-2" /> Add Branch
                    </Button>
                </div>
            </header>

            <Card className="shadow-sm border-0 mb-4">
                <Card.Body className="p-3">
                    <Row className="g-3">
                        <Col md={4}>
                            <InputGroup>
                                <InputGroup.Text className="bg-transparent border-end-0">
                                    <FiSearch className="text-muted" />
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Search by name, code or business..."
                                    className="border-start-0 ps-0"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={3}>
                            <Form.Select 
                                value={filterBusiness} 
                                onChange={(e) => setFilterBusiness(e.target.value)}
                            >
                                <option value="all">All Businesses</option>
                                {businesses.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Select 
                                value={filterStatus} 
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">All Statuses</option>
                                <option value="approved">Approved</option>
                                <option value="pending">Pending</option>
                                <option value="rejected">Rejected</option>
                            </Form.Select>
                        </Col>
                        <Col md={2} className="text-end">
                            <span className="text-muted small">Showing {filteredBranches.length} branches</span>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="shadow-sm border-0 overflow-hidden">
                <div className="table-responsive">
                    <Table hover className="align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="ps-4">Branch Info</th>
                                <th>Business</th>
                                <th>Contact</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th className="text-end pe-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-5">
                                        <Spinner animation="grow" variant="primary" />
                                        <p className="mt-2 text-muted">Loading branches...</p>
                                    </td>
                                </tr>
                            ) : filteredBranches.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-5 text-muted">
                                        <FiMap size={48} className="mb-3 opacity-25" />
                                        <p>No branches found matching your criteria</p>
                                    </td>
                                </tr>
                            ) : filteredBranches.map((branch) => (
                                <tr key={branch.id}>
                                    <td className="ps-4">
                                        <div className="d-flex align-items-center">
                                            <div className="branch-avatar me-3 bg-primary-soft text-primary">
                                                {branch.is_headquarters ? <FiHome /> : <FiMapPin />}
                                            </div>
                                            <div>
                                                <div className="fw-bold">{branch.name}</div>
                                                <div className="text-muted small">{branch.code || 'No Code'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <Badge bg="info" className="fw-normal">{branch.business_name}</Badge>
                                    </td>
                                    <td>
                                        <div className="small">
                                            {branch.email && <div><FiMail className="me-1 opacity-50" /> {branch.email}</div>}
                                            {branch.phone && <div><FiPhone className="me-1 opacity-50" /> {branch.phone}</div>}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="small text-truncate" style={{ maxWidth: '200px' }}>
                                            {branch.address}, {branch.city}
                                        </div>
                                    </td>
                                    <td>
                                        {getStatusBadge(branch.status)}
                                        {!branch.is_active && <Badge bg="danger" className="ms-1">Inactive</Badge>}
                                    </td>
                                    <td className="text-end pe-4">
                                        <div className="d-flex justify-content-end align-items-center gap-2">
                                            {branch.status === 'pending' && (
                                                <>
                                                    <Button 
                                                        variant="success" 
                                                        size="sm" 
                                                        className="btn-icon rounded-circle"
                                                        onClick={() => handleStatusChange(branch.id, 'approved')}
                                                        title="Approve Branch"
                                                    >
                                                        <FiCheck />
                                                    </Button>
                                                    <Button 
                                                        variant="danger" 
                                                        size="sm" 
                                                        className="btn-icon rounded-circle"
                                                        onClick={() => handleStatusChange(branch.id, 'rejected')}
                                                        title="Reject Branch"
                                                    >
                                                        <FiX />
                                                    </Button>
                                                </>
                                            )}
                                            <Dropdown as={ButtonGroup}>
                                                <Button variant="link" className="p-0 text-muted" onClick={() => handleShowModal(branch)}>
                                                    <FiEdit2 size={16} />
                                                </Button>
                                                <Dropdown.Toggle split variant="link" className="p-0 text-muted ps-2" />
                                                <Dropdown.Menu align="end">
                                                    <Dropdown.Item onClick={() => handleShowModal(branch)}>Edit Branch</Dropdown.Item>
                                                    {branch.status !== 'approved' && (
                                                        <Dropdown.Item className="text-success" onClick={() => handleStatusChange(branch.id, 'approved')}>
                                                            <FiCheck className="me-2" /> Approve
                                                        </Dropdown.Item>
                                                    )}
                                                    {branch.status !== 'rejected' && (
                                                        <Dropdown.Item className="text-danger" onClick={() => handleStatusChange(branch.id, 'rejected')}>
                                                            <FiX className="me-2" /> Reject
                                                        </Dropdown.Item>
                                                    )}
                                                    <Dropdown.Divider />
                                                    <Dropdown.Item className="text-danger" onClick={() => handleDelete(branch.id)}>
                                                        <FiTrash2 className="me-2" /> Delete
                                                    </Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </Card>

            <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">
                        {currentBranch ? 'Edit Branch' : 'Add New Branch'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body className="pt-4">
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Target Business</Form.Label>
                                    <Form.Select 
                                        name="business_id" 
                                        defaultValue={currentBranch?.business_id || ""} 
                                        required
                                        disabled={!!currentBranch}
                                    >
                                        <option value="" disabled>Select a business</option>
                                        {businesses.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={8}>
                                <Form.Group>
                                    <Form.Label>Branch Name</Form.Label>
                                    <Form.Control 
                                        name="name" 
                                        defaultValue={currentBranch?.name} 
                                        placeholder="e.g. Main Office, Downtown Branch"
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Branch Code</Form.Label>
                                    <Form.Control 
                                        name="code" 
                                        defaultValue={currentBranch?.code} 
                                        placeholder="e.g. BR001"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Phone Number</Form.Label>
                                    <Form.Control 
                                        name="phone" 
                                        defaultValue={currentBranch?.phone} 
                                        placeholder="+1 234 567 890"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Email Address</Form.Label>
                                    <Form.Control 
                                        name="email" 
                                        type="email"
                                        defaultValue={currentBranch?.email} 
                                        placeholder="branch@business.com"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={8}>
                                <Form.Group>
                                    <Form.Label>Address</Form.Label>
                                    <Form.Control 
                                        name="address" 
                                        defaultValue={currentBranch?.address} 
                                        placeholder="123 Street Name"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>City</Form.Label>
                                    <Form.Control 
                                        name="city" 
                                        defaultValue={currentBranch?.city} 
                                        placeholder="City Name"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select name="status" defaultValue={currentBranch?.status || "approved"}>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6} className="d-flex align-items-end gap-3 pb-2">
                                <Form.Check 
                                    type="switch"
                                    id="is_headquarters"
                                    name="is_headquarters"
                                    label="Headquarters"
                                    defaultChecked={currentBranch?.is_headquarters}
                                />
                                <Form.Check 
                                    type="switch"
                                    id="is_active"
                                    name="is_active"
                                    label="Active"
                                    defaultChecked={currentBranch ? currentBranch.is_active : true}
                                />
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0">
                        <Button variant="link" className="text-muted text-decoration-none" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={saving} className="px-4">
                            {saving ? <Spinner animation="border" size="sm" /> : currentBranch ? 'Update Branch' : 'Add Branch'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <style>{`
                .bg-primary-soft {
                    background-color: rgba(18, 184, 255, 0.1);
                }
                .branch-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .btn-icon {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                }
            `}</style>
        </Container>
    );
};

export default SuperAdminBranches;
