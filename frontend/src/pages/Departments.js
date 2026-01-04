import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Alert, Modal, Form } from 'react-bootstrap';
import { FiGrid, FiUsers, FiPlus, FiEdit2, FiTrash2, FiBriefcase } from 'react-icons/fi';
import { hrAPI } from '../services/api';
import toast from 'react-hot-toast';

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const response = await hrAPI.getDepartments();
            // The API returns a list of strings, let's map them to objects for better UI
            const deptList = (response.data.departments || []).map((name, index) => ({
                id: index + 1,
                name: name,
                head: 'TBD',
                employeeCount: Math.floor(Math.random() * 15) + 5 // Mock count
            }));
            setDepartments(deptList);
            setError(null);
        } catch (err) {
            setError('Failed to fetch departments.');
        } finally {
            setLoading(false);
        }
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
        <div className="departments-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Departments</h2>
                    <p className="text-muted mb-0">Organize your company structure and team leads.</p>
                </div>
                <Button variant="primary" className="d-flex align-items-center mt-3 mt-md-0" onClick={() => setShowModal(true)}>
                    <FiPlus className="me-2" /> Create Department
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="g-4">
                {departments.map(dept => (
                    <Col md={6} lg={4} key={dept.id}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div className="bg-primary bg-opacity-10 p-3 rounded">
                                        <FiGrid className="text-primary" size={24} />
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Button variant="link" className="p-0 text-muted"><FiEdit2 size={18} /></Button>
                                        <Button variant="link" className="p-0 text-danger"><FiTrash2 size={18} /></Button>
                                    </div>
                                </div>
                                <h5 className="fw-bold text-dark mb-1">{dept.name}</h5>
                                <p className="text-muted small mb-4">Head: <span className="fw-medium text-dark">{dept.head}</span></p>

                                <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                                    <div className="d-flex align-items-center text-muted small">
                                        <FiUsers className="me-2" /> {dept.employeeCount} Employees
                                    </div>
                                    <Badge bg="light" text="primary" className="fw-bold">Active</Badge>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}

                {/* Empty State / Add New Card */}
                <Col md={6} lg={4}>
                    <Card
                        className="border-0 shadow-sm h-100 border-2 border-dashed d-flex align-items-center justify-content-center bg-light bg-opacity-50"
                        style={{ cursor: 'pointer', minHeight: '200px' }}
                        onClick={() => setShowModal(true)}
                    >
                        <div className="text-center p-4">
                            <div className="bg-white rounded-circle p-3 shadow-sm mb-3 d-inline-block">
                                <FiPlus size={32} className="text-primary" />
                            </div>
                            <h6 className="fw-bold text-muted mb-0">Add New Department</h6>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">New Department</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Department Name</Form.Label>
                            <Form.Control type="text" placeholder="e.g. Marketing" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Department Head</Form.Label>
                            <Form.Select>
                                <option>Select Employee</option>
                                <option>John Doe</option>
                                <option>Jane Smith</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Description</Form.Label>
                            <Form.Control as="textarea" rows={2} placeholder="Briefly describe the department's role..." />
                        </Form.Group>
                        <div className="d-grid">
                            <Button variant="primary" onClick={() => {
                                toast.success('Department created!');
                                setShowModal(false);
                            }}>Create Department</Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Departments;
