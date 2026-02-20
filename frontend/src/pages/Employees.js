import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Dropdown, Alert } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEdit2, FiTrash2, FiUser, FiMail, FiPhone, FiCalendar, FiBriefcase, FiDownload } from 'react-icons/fi';
import { hrAPI, settingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import SubscriptionGuard from '../components/SubscriptionGuard';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
    const [createUserAccount, setCreateUserAccount] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await hrAPI.getEmployees();
            setEmployees(response.data.employees || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching employees:', err);
            
            // Check if it's a subscription/permission error
            if (err.response?.status === 403) {
                if (err.response.data?.upgrade_required) {
                    setError({
                        message: err.response.data.message,
                        upgrade_message: err.response.data.upgrade_message,
                        feature_required: 'HR module',
                        showUpgrade: true
                    });
                } else {
                    setError({
                        message: err.response.data?.error || 'Access denied. Please contact your administrator.',
                        showUpgrade: false
                    });
                }
            } else if (err.response?.status === 404) {
                setError({
                    message: 'HR module is not available. Please check your subscription plan.',
                    showUpgrade: true,
                    feature_required: 'HR module'
                });
            } else {
                setError({
                    message: 'Failed to fetch employees. Please try again.',
                    showUpgrade: false
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const employeeData = {
            employee_id: formData.get('employee_id'),
            department: formData.get('department'),
            position: formData.get('position'),
            hire_date: formData.get('hire_date'),
            salary: formData.get('salary'),
            is_active: formData.get('is_active') === 'on'
        };

        setIsSaving(true);
        try {
            // Validate password is provided when creating user account
            if (!currentEmployee && createUserAccount && !formData.get('password')) {
                toast.error('Please provide a password when creating a user account');
                setIsSaving(false);
                return;
            }

            if (currentEmployee) {
                // For updating an existing employee, just update the employee details
                // Don't send user data as part of employee update
                const updateEmployeeData = {
                    employee_id: formData.get('employee_id'),
                    department: formData.get('department'),
                    position: formData.get('position'),
                    hire_date: formData.get('hire_date'),
                    salary: formData.get('salary'),
                    is_active: formData.get('is_active') === 'on'
                };

                await hrAPI.updateEmployee(currentEmployee.id, updateEmployeeData);
                toast.success('Employee updated successfully!');
            } else {
                // For new employee, optionally create a user account
                if (createUserAccount) {
                    const firstName = formData.get('first_name');
                    const lastName = formData.get('last_name');
                    const email = formData.get('email');

                    // Generate username from first and last name
                    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;

                    const userData = {
                        username: username,
                        first_name: firstName,
                        last_name: lastName,
                        email: email,
                        phone: formData.get('phone'),
                        role: 'staff',
                        password: formData.get('password') || 'TempPass123!' // Provide a temporary password
                    };

                    // Create user first
                    const userResponse = await settingsAPI.createUser(userData);
                    employeeData.user_id = userResponse.data.user.id;
                }

                await hrAPI.createEmployee(employeeData);
                toast.success('Employee added successfully!');
            }
            fetchEmployees();
            handleClose();
        } catch (err) {
            console.error('Error saving employee:', err);
            // Check if it's a validation error from backend
            const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to save employee. Please check all required fields and try again.';
            toast.error(errorMsg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id) => {
        toast((t) => (
            <span>
                Delete this employee record?
                <div className="mt-2 d-flex gap-2">
                    <Button size="sm" variant="danger" onClick={async () => {
                        try {
                            await hrAPI.deleteEmployee(id);
                            setEmployees(employees.filter(emp => emp.id !== id));
                            toast.dismiss(t.id);
                            toast.success('Employee deleted');
                        } catch (err) {
                            toast.error('Failed to delete employee');
                        }
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

    const handleClose = () => {
        setShowModal(false);
        setCurrentEmployee(null);
        setCreateUserAccount(false);
    };

    const handleExport = async () => {
        try {
            // Note: Export functionality may not be implemented yet
            toast.info('Export functionality coming soon!');
        } catch (err) {
            toast.error('Failed to export employee list. Please try again.');
            console.error('Error exporting employees:', err);
        }
    };

    const handleFileChange = (e) => {
        setUploadFile(e.target.files[0]);
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadFile) {
            toast.error('Please select a CSV file.');
            return;
        }
        setUploading(true);
        setUploadResult(null);
        const fd = new FormData();
        fd.append('file', uploadFile);
        try {
            const res = await hrAPI.bulkUploadEmployees(fd);
            setUploadResult(res.data);
            toast.success(`Created ${res.data.created_count} employees`);
            fetchEmployees();
        } catch (err) {
            console.error('Bulk upload error (employees):', err);
            toast.error('Failed to bulk upload employees.');
        } finally {
            setUploading(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        `${emp.user?.first_name || ''} ${emp.user?.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="employees-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Employees</h2>
                    <p className="text-muted mb-0">Manage your workforce and employee details.</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-secondary" className="d-flex align-items-center" onClick={handleExport}>
                        <FiDownload className="me-2" /> Export
                    </Button>
                    <SubscriptionGuard message="Renew your subscription to bulk-upload employees">
                        <Button
                            variant="outline-secondary"
                            className="d-flex align-items-center"
                            onClick={() => setShowUploadModal(true)}
                        >
                            <FiDownload className="me-2" /> Bulk Upload
                        </Button>
                    </SubscriptionGuard>
                    <SubscriptionGuard message="Renew your subscription to add new employees">
                        <Button variant="primary" className="d-flex align-items-center" onClick={() => {
                            setCurrentEmployee(null);
                            setShowModal(true);
                        }}>
                            <FiPlus className="me-2" /> Add Employee
                        </Button>
                    </SubscriptionGuard>
                </div>
            </div>

                        {error && typeof error === 'object' ? (
                            <div className="alert alert-warning d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <strong>Access Restricted</strong><br />
                                    {error.message} {error.upgrade_message}
                                    {error.feature_required && <span className="d-block mt-1">Feature required: <strong>{error.feature_required}</strong></span>}
                                </div>
                                {error.showUpgrade && (
                                    <a href="/subscription" className="btn btn-primary btn-sm">Upgrade Plan</a>
                                )}
                            </div>
                        ) : error ? (
                            <div className="alert alert-danger mb-4">
                                {error}
                            </div>
                        ) : null}

            <Row className="g-4 mb-4">
                <Col md={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Total Employees</div>
                            <h3 className="fw-bold mb-0">{employees.length}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Active Staff</div>
                            <h3 className="fw-bold mb-0 text-success">{employees.filter(e => e.is_active).length}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Departments</div>
                            <h3 className="fw-bold mb-0 text-primary">{new Set(employees.map(e => e.department)).size}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Avg. Tenure</div>
                            <h3 className="fw-bold mb-0 text-info">2.4 Yrs</h3>
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
                                placeholder="Search by name or ID..."
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
                                    <th className="border-0 py-3 ps-4">Employee</th>
                                    <th className="border-0 py-3">Department</th>
                                    <th className="border-0 py-3">Position</th>
                                    <th className="border-0 py-3">Contact</th>
                                    <th className="border-0 py-3">Status</th>
                                    <th className="border-0 py-3 text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.map(emp => (
                                    <tr key={emp.id}>
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center">
                                                <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3 text-primary fw-bold" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {emp.user?.first_name?.[0] || 'N'}{emp.user?.last_name?.[0] || 'A'}
                                                </div>
                                                <div>
                                                    <div className="fw-bold text-dark">{emp.user?.first_name || 'N/A'} {emp.user?.last_name || ''}</div>
                                                    <div className="small text-muted">{emp.employee_id || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <Badge bg="light" text="dark" className="border fw-normal">{emp.department || 'N/A'}</Badge>
                                        </td>
                                        <td>
                                            <div className="text-muted small">{emp.position || 'N/A'}</div>
                                        </td>
                                        <td>
                                            <div className="d-flex flex-column small">
                                                <span className="text-dark"><FiMail className="me-1" /> {emp.user?.email || 'N/A'}</span>
                                                <span className="text-muted"><FiPhone className="me-1" /> {emp.user?.phone || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <Badge bg={emp.is_active ? 'success' : 'secondary'} className="fw-normal">
                                                {emp.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="text-end pe-4">
                                            <div className="d-flex gap-2 justify-content-end">
                                                <Button variant="outline-warning" size="sm" className="d-flex align-items-center" onClick={() => {
                                                    setCurrentEmployee(emp);
                                                    setShowModal(true);
                                                }} title="Edit Details">
                                                    <FiEdit2 size={16} />
                                                </Button>
                                                <Button variant="outline-secondary" size="sm" className="d-flex align-items-center" title="View Attendance">
                                                    <FiCalendar size={16} />
                                                </Button>
                                                <Button variant="outline-danger" size="sm" className="d-flex align-items-center" onClick={() => handleDelete(emp.id)} title="Terminate">
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

            <Modal show={showModal} onHide={handleClose} centered size="lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">{currentEmployee ? 'Edit Employee' : 'Add New Employee'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-4">
                    <Form onSubmit={handleSave}>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">First Name</Form.Label>
                                    <Form.Control name="first_name" type="text" defaultValue={currentEmployee?.user?.first_name} placeholder="First name" required={!currentEmployee} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Last Name</Form.Label>
                                    <Form.Control name="last_name" type="text" defaultValue={currentEmployee?.user?.last_name} placeholder="Last name" required={!currentEmployee} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Email</Form.Label>
                                    <Form.Control name="email" type="email" defaultValue={currentEmployee?.user?.email} placeholder="email@example.com" required={!currentEmployee} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Phone</Form.Label>
                                    <Form.Control name="phone" type="tel" defaultValue={currentEmployee?.user?.phone} placeholder="Phone number" />
                                </Form.Group>
                            </Col>
                            {!currentEmployee && (
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Check
                                            type="checkbox"
                                            id="createUserAccount"
                                            label="Create user account (allow login)"
                                            checked={createUserAccount}
                                            onChange={(e) => setCreateUserAccount(e.target.checked)}
                                        />
                                        <Form.Text className="text-muted">
                                            Check this if the employee needs to log into the system
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            )}
                            {createUserAccount && !currentEmployee && (
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold small">Password</Form.Label>
                                        <Form.Control name="password" type="password" placeholder="Temporary password" />
                                        <Form.Text className="text-muted">Provide a temporary password for the employee account</Form.Text>
                                    </Form.Group>
                                </Col>
                            )}
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Employee ID</Form.Label>
                                    <Form.Control name="employee_id" type="text" defaultValue={currentEmployee?.employee_id} placeholder="e.g. EMP-001" required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Department</Form.Label>
                                    <Form.Control name="department" type="text" defaultValue={currentEmployee?.department} placeholder="e.g. Engineering" required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Position</Form.Label>
                                    <Form.Control name="position" type="text" defaultValue={currentEmployee?.position} placeholder="e.g. Senior Developer" required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Monthly Salary</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>$</InputGroup.Text>
                                        <Form.Control name="salary" type="number" defaultValue={currentEmployee?.salary} />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Hire Date</Form.Label>
                                    <Form.Control name="hire_date" type="date" defaultValue={currentEmployee?.hire_date} required />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Check
                                    name="is_active"
                                    type="switch"
                                    id="employee-status"
                                    label="Employee is active"
                                    defaultChecked={currentEmployee ? currentEmployee.is_active : true}
                                />
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button variant="light" onClick={handleClose}>Cancel</Button>
                            <Button variant="primary" type="submit" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Employee'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Bulk Upload Modal */}
            <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Bulk Upload Employees</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-4">
                    <Form onSubmit={handleUploadSubmit}>
                        <Form.Group>
                            <Form.Label className="fw-semibold small">CSV File</Form.Label>
                            <Form.Control type="file" accept=".csv" onChange={handleFileChange} />
                            <Form.Text className="text-muted">
                                Upload a CSV with columns like: employee_id, user_email, department, position, hire_date, salary, is_active.
                                <div className="mt-2">
                                    <a href="/employee_bulk_sample.csv" target="_blank" rel="noreferrer">
                                        Download sample CSV
                                    </a>
                                </div>
                            </Form.Text>
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <Button variant="light" onClick={() => setShowUploadModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={uploading}>
                                {uploading ? 'Uploading...' : 'Upload'}
                            </Button>
                        </div>
                    </Form>

                    {uploadResult && (
                        <div className="mt-3">
                            <Alert variant="success">
                                Created {uploadResult.created_count} employees
                            </Alert>
                            {uploadResult.errors && uploadResult.errors.length > 0 && (
                                <div>
                                    <h6>Errors:</h6>
                                    <ul>
                                        {uploadResult.errors.map((err, idx) => (
                                            <li key={idx}>
                                                Row {err.row}: {err.error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Employees;
