import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form } from 'react-bootstrap';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data for customers
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCustomers([
        { id: 1, customerId: 'CUST0001', firstName: 'John', lastName: 'Doe', company: 'ABC Corp', email: 'john@abc.com', phone: '+1234567890', balance: 1500.00, isActive: true },
        { id: 2, customerId: 'CUST0002', firstName: 'Jane', lastName: 'Smith', company: 'XYZ Ltd', email: 'jane@xyz.com', phone: '+1987654321', balance: 2300.50, isActive: true },
        { id: 3, customerId: 'CUST0003', firstName: 'Bob', lastName: 'Johnson', company: 'Tech Solutions', email: 'bob@tech.com', phone: '+1555123456', balance: 0.00, isActive: true }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleEdit = (customer) => {
    setCurrentCustomer(customer);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      setCustomers(customers.filter(customer => customer.id !== id));
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setCurrentCustomer(null);
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
      <Row>
        <Col lg={12}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5>Customer Management (CRM)</h5>
              <Button variant="primary" onClick={() => {
                setCurrentCustomer(null);
                setShowModal(true);
              }}>
                Add Customer
              </Button>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer ID</th>
                      <th>Name</th>
                      <th>Company</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(customer => (
                      <tr key={customer.id}>
                        <td>{customer.id}</td>
                        <td>{customer.customerId}</td>
                        <td>{customer.firstName} {customer.lastName}</td>
                        <td>{customer.company}</td>
                        <td>{customer.email}</td>
                        <td>{customer.phone}</td>
                        <td>${customer.balance.toFixed(2)}</td>
                        <td>
                          <span className={`badge ${customer.isActive ? 'bg-success' : 'bg-secondary'}`}>
                            {customer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleEdit(customer)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(customer.id)}
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

      {/* Customer Modal */}
      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{currentCustomer ? 'Edit Customer' : 'Add Customer'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Customer ID</Form.Label>
              <Form.Control
                type="text"
                defaultValue={currentCustomer?.customerId || ''}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                defaultValue={currentCustomer?.firstName || ''}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                defaultValue={currentCustomer?.lastName || ''}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Company</Form.Label>
              <Form.Control
                type="text"
                defaultValue={currentCustomer?.company || ''}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                defaultValue={currentCustomer?.email || ''}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="text"
                defaultValue={currentCustomer?.phone || ''}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                defaultValue={currentCustomer?.address || ''}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="status-switch"
                label="Active"
                defaultChecked={currentCustomer?.isActive !== false}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary">
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Customers;