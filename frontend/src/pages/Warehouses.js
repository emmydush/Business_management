import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Dropdown } from 'react-bootstrap';
import { FiPlus, FiSearch, FiMapPin, FiMoreVertical, FiEdit2, FiTrash2, FiHome } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Warehouses = () => {
    const [warehouses, setWarehouses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentWarehouse, setCurrentWarehouse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setWarehouses([
                { id: 1, name: 'Main Warehouse', location: 'Kigali, Rwanda', capacity: '85%', manager: 'John Doe', status: 'active', items: 1250 },
                { id: 2, name: 'Secondary Store', location: 'Musanze, Rwanda', capacity: '40%', manager: 'Jane Smith', status: 'active', items: 450 },
                { id: 3, name: 'Distribution Center', location: 'Rubavu, Rwanda', capacity: '95%', manager: 'Robert Wilson', status: 'full', items: 2800 },
                { id: 4, name: 'Old Storage', location: 'Kigali, Rwanda', capacity: '10%', manager: 'Michael Brown', status: 'inactive', items: 120 }
            ]);
            setLoading(false);
        }, 800);
    }, []);

    const handleSave = (e) => {
        e.preventDefault();
        toast.success(currentWarehouse ? 'Warehouse updated!' : 'Warehouse added!');
        setShowModal(false);
    };

    const filteredWarehouses = warehouses.filter(w =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.location.toLowerCase().includes(searchTerm.toLowerCase())
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
                <Button variant="primary" className="d-flex align-items-center mt-3 mt-md-0" onClick={() => {
                    setCurrentWarehouse(null);
                    setShowModal(true);
                }}>
                    <FiPlus className="me-2" /> Add Warehouse
                </Button>
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
                                            <Dropdown align="end">
                                                <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                                                    <FiMoreVertical size={20} />
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu className="border-0 shadow-sm">
                                                    <Dropdown.Item className="d-flex align-items-center py-2" onClick={() => {
                                                        setCurrentWarehouse(w);
                                                        setShowModal(true);
                                                    }}>
                                                        <FiEdit2 className="me-2 text-muted" /> Edit
                                                    </Dropdown.Item>
                                                    <Dropdown.Divider />
                                                    <Dropdown.Item className="d-flex align-items-center py-2 text-danger">
                                                        <FiTrash2 className="me-2" /> Delete
                                                    </Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
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
                                    <Form.Control type="text" defaultValue={currentWarehouse?.manager} placeholder="Manager Name" />
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
