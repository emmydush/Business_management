import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form } from 'react-bootstrap';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data for suppliers
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSuppliers([
        { id: 1, name: 'ABC Supplier', contact: 'John Smith', email: 'john@abc.com', phone: '123-456-7890', address: '123 Main St', status: 'active', products: 45 },
        { id: 2, name: 'XYZ Distributor', contact: 'Jane Doe', email: 'jane@xyz.com', phone: '098-765-4321', address: '456 Oak Ave', status: 'active', products: 78 },
        { id: 3, name: 'Tech Solutions', contact: 'Bob Johnson', email: 'bob@tech.com', phone: '555-123-4567', address: '789 Pine Rd', status: 'active', products: 23 },
        { id: 4, name: 'Office Supplies Co', contact: 'Alice Brown', email: 'alice@office.com', phone: '555-987-6543', address: '321 Elm St', status: 'inactive', products: 56 },
        { id: 5, name: 'Global Imports', contact: 'Charlie Wilson', email: 'charlie@global.com', phone: '555-456-7890', address: '654 Cedar Ln', status: 'active', products: 34 }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleEdit = (supplier) => {
    setCurrentSupplier(supplier);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      setSuppliers(suppliers.filter(sup => sup.id !== id));
    }
  };

  const handleAdd = () => {
    setCurrentSupplier(null);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setCurrentSupplier(null);
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
      <h1 className="mb-4">Supplier & Vendor Management</h1>
      
      <Row>
        <Col lg={12}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5>Suppliers List</h5>
              <Button variant="primary" onClick={handleAdd}>Add Supplier</Button>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Products</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map(supplier => (
                      <tr key={supplier.id}>
                        <td>{supplier.id}</td>
                        <td>{supplier.name}</td>
                        <td>{supplier.contact}</td>
                        <td>{supplier.email}</td>
                        <td>{supplier.phone}</td>
                        <td>
                          <span className={`badge bg-${getStatusVariant(supplier.status)}`}>
                            {supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}
                          </span>
                        </td>
                        <td>{supplier.products}</td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleEdit(supplier)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(supplier.id)}
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

      {/* Supplier Modal */}
      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {currentSupplier ? `Edit Supplier: ${currentSupplier.name}` : 'Add New Supplier'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    defaultValue={currentSupplier?.name || ''}
                    placeholder="Enter supplier name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select defaultValue={currentSupplier?.status || 'active'}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Contact Person</Form.Label>
              <Form.Control 
                type="text" 
                defaultValue={currentSupplier?.contact || ''}
                placeholder="Enter contact person name"
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control 
                    type="email" 
                    defaultValue={currentSupplier?.email || ''}
                    placeholder="Enter email address"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control 
                    type="tel" 
                    defaultValue={currentSupplier?.phone || ''}
                    placeholder="Enter phone number"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                defaultValue={currentSupplier?.address || ''}
                placeholder="Enter supplier address"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary">
            {currentSupplier ? 'Update Supplier' : 'Add Supplier'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Suppliers;