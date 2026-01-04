import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge } from 'react-bootstrap';

const HR = () => {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data for employees
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setEmployees([
        { id: 1, employeeId: 'EMP001', name: 'John Doe', position: 'Manager', department: 'Sales', email: 'john.doe@company.com', phone: '123-456-7890', hireDate: '2022-01-15', status: 'active' },
        { id: 2, employeeId: 'EMP002', name: 'Jane Smith', position: 'Developer', department: 'IT', email: 'jane.smith@company.com', phone: '098-765-4321', hireDate: '2022-03-20', status: 'active' },
        { id: 3, employeeId: 'EMP003', name: 'Bob Johnson', position: 'Accountant', department: 'Finance', email: 'bob.johnson@company.com', phone: '555-123-4567', hireDate: '2021-11-10', status: 'active' },
        { id: 4, employeeId: 'EMP004', name: 'Alice Brown', position: 'HR Specialist', department: 'HR', email: 'alice.brown@company.com', phone: '555-987-6543', hireDate: '2023-02-01', status: 'active' },
        { id: 5, employeeId: 'EMP005', name: 'Charlie Wilson', position: 'Sales Rep', department: 'Sales', email: 'charlie.wilson@company.com', phone: '555-456-7890', hireDate: '2023-05-15', status: 'inactive' }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleEdit = (employee) => {
    setCurrentEmployee(employee);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  const handleAdd = () => {
    setCurrentEmployee(null);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setCurrentEmployee(null);
  };

  const getStatusVariant = (status) => {
    return status === 'active' ? 'success' : 'danger';
  };

  if (loading) {
    return (
      <Container fluid className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid>
      <h1 className="mb-4">Human Resources Management</h1>
      
      <Row>
        <Col lg={12}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5>Employee Management</h5>
              <Button variant="primary" onClick={handleAdd}>Add Employee</Button>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>Position</th>
                      <th>Department</th>
                      <th>Email</th>
                      <th>Hire Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(employee => (
                      <tr key={employee.id}>
                        <td>{employee.employeeId}</td>
                        <td>{employee.name}</td>
                        <td>{employee.position}</td>
                        <td>{employee.department}</td>
                        <td>{employee.email}</td>
                        <td>{employee.hireDate}</td>
                        <td>
                          <Badge bg={getStatusVariant(employee.status)}>
                            {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                          </Badge>
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleEdit(employee)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(employee.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Employee Modal */}
      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {currentEmployee ? `Edit Employee: ${currentEmployee.name}` : 'Add New Employee'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Employee ID</Form.Label>
                  <Form.Control 
                    type="text" 
                    defaultValue={currentEmployee?.employeeId || ''}
                    placeholder="EMP001"
                    disabled={!!currentEmployee}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select defaultValue={currentEmployee?.status || 'active'}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    defaultValue={currentEmployee?.name.split(' ')[0] || ''}
                    placeholder="Enter first name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    defaultValue={currentEmployee?.name.split(' ')[1] || ''}
                    placeholder="Enter last name"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Position</Form.Label>
              <Form.Control 
                type="text" 
                defaultValue={currentEmployee?.position || ''}
                placeholder="Enter position"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Department</Form.Label>
              <Form.Control 
                type="text" 
                defaultValue={currentEmployee?.department || ''}
                placeholder="Enter department"
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control 
                    type="email" 
                    defaultValue={currentEmployee?.email || ''}
                    placeholder="Enter email"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control 
                    type="tel" 
                    defaultValue={currentEmployee?.phone || ''}
                    placeholder="Enter phone number"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Hire Date</Form.Label>
              <Form.Control 
                type="date" 
                defaultValue={currentEmployee?.hireDate || ''}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary">
            {currentEmployee ? 'Update Employee' : 'Add Employee'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default HR;