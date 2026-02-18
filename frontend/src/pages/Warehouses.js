import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Dropdown } from 'react-bootstrap';
import { FiPlus, FiSearch, FiMapPin, FiMoreVertical, FiEdit2, FiTrash2, FiHome } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { warehousesAPI } from '../services/api';
import SubscriptionGuard from '../components/SubscriptionGuard';

const Warehouses = () => {
    const [warehouses, setWarehouses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentWarehouse, setCurrentWarehouse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchWarehouses();
    }, []);

    const fetchWarehouses = async () => {
        try {
            setLoading(true);
            const response = await warehousesAPI.getWarehouses();

            // Transform the API response to match the expected format
            const transformedWarehouses = response.data.warehouses.map(warehouse => ({
                id: warehouse.id,
                name: warehouse.name,
                location: warehouse.location,
                capacity: `${warehouse.capacity_percentage}%`,
                manager: warehouse.manager ? `${warehouse.manager.first_name} ${warehouse.manager.last_name}` : 'N/A',
                status: warehouse.status,
                items: warehouse.total_items
            }));

            setWarehouses(transformedWarehouses);
        } catch (err) {
            console.error('Error fetching warehouses:', err);
            toast.error('Failed to load warehouses');
            // Fallback to empty array
            setWarehouses([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const form = e.target;
        const name = form.querySelector('input[type="text"]:nth-child(1)').value;
        const location = form.querySelector('input[type="text"]:nth-child(2)').value;
        const manager = form.querySelector('input[type="text"]:nth-child(3)')?.value;
        const status = form.querySelector('select').value;

        // For simplicity, we'll just pass basic data
        // In a real app, we'd need to handle manager selection properly
        const formData = {
            name,
            location,
            status,
            capacity_percentage: 0, // default
            total_items: 0, // default
        };

        try {
            if (currentWarehouse) {
                // Update existing warehouse
                await warehousesAPI.updateWarehouse(currentWarehouse.id, formData);
                toast.success('Warehouse updated successfully!');
            } else {
                // Create new warehouse
                await warehousesAPI.createWarehouse(formData);
                toast.success('Warehouse added successfully!');
            }

            // Refresh the list
            fetchWarehouses();
            setShowModal(false);
        } catch (err) {
            console.error('Error saving warehouse:', err);
            toast.error(currentWarehouse ? 'Failed to update warehouse' : 'Failed to add warehouse');
        }
    };

    const handleDelete = (id) => {
        toast((t) => (
            <span>
                Delete this warehouse?
                <div className="mt-2 d-flex gap-2">
                    <Button size="sm" variant="danger" onClick={async () => {
                        try {
                            await warehousesAPI.deleteWarehouse(id);
                            toast.success('Warehouse deleted successfully!');
                            fetchWarehouses(); // Refresh the list
                        } catch (err) {
                            console.error('Error deleting warehouse:', err);
                            toast.error('Failed to delete warehouse');
                        }
                        toast.dismiss(t.id);
                    }}>
                        Delete
                    </Button>
                    <Button size="sm" variant="light" onClick={() => toast.dismiss(t.id)}>
                        Cancel
                    </Button>
                </div>
            </span>
        ), { duration: 3000 });
    };

    const filteredWarehouses = warehouses.filter(w =>
        (w.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.location || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        <div className="warehouses-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Warehouses</h2>
                    <p className="text-muted mb-0">Manage your storage locations and distribution centers.</p>
                </div>
                <SubscriptionGuard message="Renew your subscription to add new warehouses">
                    <Button variant="primary" className="d-flex align-items-center mt-3 mt-md-0" onClick={() => {
                        setCurrentWarehouse(null);
                        setShowModal(true);
                    }}>
                        <FiPlus className="me-2" /> Add Warehouse
                    </Button>
                </SubscriptionGuard>
            </div>

            <Row className="g-4 mb-4">
                {warehouses.map(w => (
                    <Col md={6} lg={3} key={w.id}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div className="bg-primary bg-opacity-10 p-2 rounded">
                                        <FiHome className="text-primary" size={20} />
                                    </div>
                                    <Badge bg={w.status === 'active' ? 'success' : w.status === 'full' ? 'danger' : 'secondary'} className="fw-normal">
                                        {w.status.toUpperCase()}
                                    </Badge>
                                </div>
                                <h5 className="fw-bold text-dark mb-1">{w.name}</h5>
                                <p className="text-muted small mb-3 d-flex align-items-center">
                                    <FiMapPin className="me-1" /> {w.location}
                                </p>
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="small text-muted">Capacity</span>
                                        <span className="small fw-bold">{w.capacity}</span>
                                    </div>
                                    <div className="progress" style={{ height: '6px' }}>
                                        <div
                                            className={`progress-bar ${parseInt(w.capacity) > 90 ? 'bg-danger' : parseInt(w.capacity) > 70 ? 'bg-warning' : 'bg-success'}`}
                                            role="progressbar"
                                            style={{ width: w.capacity }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                                    <span className="small text-muted">{w.items} Items</span>
                                    <Button variant="link" className="p-0 text-primary small fw-bold text-decoration-none" onClick={() => {
                                        setCurrentWarehouse(w);
                                        setShowModal(true);
                                    }}>Manage</Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <div className="p-3 border-bottom">
                        <InputGroup style={{ maxWidth: '400px' }}>
                            <InputGroup.Text className="bg-light border-0">
                                <FiSearch className="text-muted" />
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Search warehouses..."
                                className="bg-light border-0 ps-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </div>
                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0 py-3 ps-4">Warehouse</th>
                                    <th className="border-0 py-3">Location</th>
                                    <th className="border-0 py-3">Manager</th>
                                    <th className="border-0 py-3">Items</th>
                                    <th className="border-0 py-3 text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWarehouses.map(w => (
                                    <tr key={w.id}>
                                        <td className="ps-4 fw-bold text-dark">{w.name}</td>
                                        <td>{w.location}</td>
                                        <td>{w.manager}</td>
                                        <td>{w.items}</td>
                                        <td className="text-end pe-4">
                                            <div className="d-flex gap-2 justify-content-end">
                                                <Button variant="outline-warning" size="sm" className="d-flex align-items-center" onClick={() => {
                                                    setCurrentWarehouse(w);
                                                    setShowModal(true);
                                                }} title="Edit">
                                                    <FiEdit2 size={16} />
                                                </Button>
                                                <Button variant="outline-danger" size="sm" className="d-flex align-items-center" onClick={() => handleDelete(w.id)} title="Delete">
                                                    <FiTrash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered className="colored-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">{currentWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-4">
                    <Form onSubmit={handleSave}>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small">Warehouse Name</Form.Label>
                            <Form.Control type="text" defaultValue={currentWarehouse?.name} placeholder="e.g. North Wing Store" required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small">Location</Form.Label>
                            <Form.Control type="text" defaultValue={currentWarehouse?.location} placeholder="e.g. Kigali, Rwanda" required />
                        </Form.Group>
                        <Row className="g-3 mb-4">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Manager</Form.Label>
                                    <Form.Control type="text" defaultValue={currentWarehouse?.manager} placeholder="Manager Name" disabled />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Status</Form.Label>
                                    <Form.Select defaultValue={currentWarehouse?.status || 'active'}>
                                        <option value="active">Active</option>
                                        <option value="full">Full</option>
                                        <option value="inactive">Inactive</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button variant="primary" type="submit">Save Warehouse</Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Warehouses;
