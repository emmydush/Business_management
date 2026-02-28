import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Alert, Modal, Form } from 'react-bootstrap';
import { FiGrid, FiUsers, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { hrAPI } from '../services/api';
import toast from 'react-hot-toast';
import SubscriptionGuard from '../components/SubscriptionGuard';
import SubscriptionUpgradeModal from '../components/SubscriptionUpgradeModal';

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [featureError, setFeatureError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchDepartments();
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await hrAPI.getEmployees({ per_page: 1000 });
            setEmployees(response.data.employees || []);
        } catch (err) {
            console.error('Error fetching employees:', err);
        }
    };

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const response = await hrAPI.getDepartments();
            setDepartments(response.data.departments || []);
            setError(null);
        } catch (err) {
            if (err.response?.data?.upgrade_required) {
                setFeatureError(err.response.data);
                setShowUpgradeModal(true);
            } else {
                setError('Failed to fetch departments.');
            }
            console.error('Error fetching departments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDepartment = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const departmentData = {
            name: formData.get('name'),
            description: formData.get('description'),
            head_id: formData.get('head_id') || null,
            is_active: true
        };
        
        setIsSaving(true);
        try {
            await hrAPI.createDepartment(departmentData);
            toast.success('Department created successfully!');
            setShowModal(false);
            fetchDepartments(); // Refresh the list
        } catch (err) {
            console.error('Error creating department:', err);
            const errorMsg = err.response?.data?.error || 'Failed to create department';
            toast.error(errorMsg);
        } finally {
            setIsSaving(false);
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
                <SubscriptionGuard message="Renew your subscription to add new departments">
                    <Button variant="primary" className="d-flex align-items-center mt-3 mt-md-0" onClick={() => setShowModal(true)}>
                        <FiPlus className="me-2" /> Create Department
                    </Button>
                </SubscriptionGuard>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="g-2 g-md-4">
                {departments.map(dept => (
                    <Col xs={12} sm={6} md={6} lg={4} key={dept.id}>
                        <Card className="border-0 shadow-sm h-100 card-responsive">
                            <Card.Body className="p-3 p-md-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div className="bg-primary bg-opacity-10 p-2 p-md-3 rounded">
                                        <FiGrid className="text-primary" size={20} />
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Button variant="link" className="p-0 text-muted"><FiEdit2 size={16} /></Button>
                                        <Button variant="link" className="p-0 text-danger"><FiTrash2 size={16} /></Button>
                                    </div>
                                </div>
                                <h5 className="fw-bold text-dark mb-1 h6 h5-md">{dept.name}</h5>
                                <p className="text-muted small mb-3 mb-md-4 small-md">
                                    Head: <span className="fw-medium text-dark">
                                        {dept.head_name || 'Not assigned'}
                                    </span>
                                </p>

                                <div className="d-flex justify-content-between align-items-center pt-2 pt-md-3 border-top">
                                    <div className="d-flex align-items-center text-muted small small-md">
                                        <FiUsers className="me-1 me-md-2" size={16} /> {dept.employee_count || 0} Employees
                                    </div>
                                    <Badge bg={dept.is_active ? 'light' : 'secondary'} text={dept.is_active ? 'primary' : 'white'} className="fw-bold small">
                                        {dept.is_active ? 'Active' : 'Inactive'}</Badge>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}

                {/* Empty State / Add New Card */}
                <Col xs={12} sm={6} md={6} lg={4}>
                    <SubscriptionGuard message="Renew your subscription to add new departments">
                        <Card
                            className="border-0 shadow-sm h-100 border-2 border-dashed d-flex align-items-center justify-content-center bg-light bg-opacity-50 card-responsive"
                            style={{ cursor: 'pointer', minHeight: '200px' }}
                            onClick={() => setShowModal(true)}
                        >
                            <div className="text-center p-3 p-md-4">
                                <div className="bg-white rounded-circle p-2 p-md-3 shadow-sm mb-2 mb-md-3 d-inline-block">
                                    <FiPlus size={28} className="text-primary" />
                                </div>
                                <h6 className="fw-bold text-muted mb-0 small small-md">Add New Department</h6>
                            </div>
                        </Card>
                    </SubscriptionGuard>
                </Col>
            </Row>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">New Department</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleCreateDepartment}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Department Name</Form.Label>
                            <Form.Control 
                                type="text" 
                                name="name"
                                placeholder="e.g. Marketing" 
                                required 
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Department Head</Form.Label>
                            <Form.Select name="head_id">
                                <option value="">Select Employee (Optional)</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.user?.first_name} {emp.user?.last_name} - {emp.position || 'No Position'}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Description</Form.Label>
                            <Form.Control 
                                as="textarea" 
                                name="description"
                                rows={2} 
                                placeholder="Briefly describe the department's role..." 
                            />
                        </Form.Group>
                        <div className="d-grid">
                            <Button 
                                variant="primary" 
                                type="submit" 
                                disabled={isSaving}
                            >
                                {isSaving ? 'Creating...' : 'Create Department'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            <SubscriptionUpgradeModal 
                error={featureError}
                show={showUpgradeModal}
                onHide={() => setShowUpgradeModal(false)}
            />
        </div>
    );
};

export default Departments;
