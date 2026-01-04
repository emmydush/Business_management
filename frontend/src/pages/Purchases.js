import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge } from 'react-bootstrap';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentPurchase, setCurrentPurchase] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data for purchases
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPurchases([
        { id: 1, purchaseId: 'PUR001', supplier: 'ABC Supplier', date: '2023-07-15', amount: 2500.00, status: 'received', items: 5 },
        { id: 2, purchaseId: 'PUR002', supplier: 'XYZ Distributor', date: '2023-07-14', amount: 1800.50, status: 'pending', items: 3 },
        { id: 3, purchaseId: 'PUR003', supplier: 'Tech Solutions', date: '2023-07-13', amount: 4200.00, status: 'confirmed', items: 8 },
        { id: 4, purchaseId: 'PUR004', supplier: 'Office Supplies Co', date: '2023-07-12', amount: 950.75, status: 'partially_received', items: 4 },
        { id: 5, purchaseId: 'PUR005', supplier: 'Global Imports', date: '2023-07-11', amount: 3200.25, status: 'shipped', items: 6 }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleEdit = (purchase) => {
    setCurrentPurchase(purchase);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      setPurchases(purchases.filter(pur => pur.id !== id));
    }
  };

  const handleAdd = () => {
    setCurrentPurchase(null);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setCurrentPurchase(null);
  };

  const getStatusVariant = (status) => {
    switch(status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'shipped': return 'primary';
      case 'partially_received': return 'secondary';
      case 'received': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
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
      <h1 className="mb-4">Purchase Management</h1>
      
      <Row>
        <Col lg={12}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5>Purchase Orders</h5>
              <Button variant="primary" onClick={handleAdd}>New Purchase Order</Button>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Purchase ID</th>
                      <th>Supplier</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Items</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map(purchase => (
                      <tr key={purchase.id}>
                        <td>{purchase.purchaseId}</td>
                        <td>{purchase.supplier}</td>
                        <td>{purchase.date}</td>
                        <td>${purchase.amount.toFixed(2)}</td>
                        <td>{purchase.items}</td>
                        <td>
                          <Badge bg={getStatusVariant(purchase.status)}>
                            {purchase.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </Badge>
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleEdit(purchase)}
                          >
                            View
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(purchase.id)}
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

      {/* Purchase Modal */}
      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {currentPurchase ? `Purchase Order: ${currentPurchase.purchaseId}` : 'New Purchase Order'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Purchase ID</Form.Label>
                  <Form.Control 
                    type="text" 
                    defaultValue={currentPurchase?.purchaseId || 'PUR001'}
                    placeholder="PUR001"
                    disabled={!!currentPurchase}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select defaultValue={currentPurchase?.status || 'pending'}>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="partially_received">Partially Received</option>
                    <option value="received">Received</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Supplier</Form.Label>
              <Form.Control 
                type="text" 
                defaultValue={currentPurchase?.supplier || ''}
                placeholder="Enter supplier name"
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Order Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    defaultValue={currentPurchase?.date || ''}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Required Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    defaultValue={currentPurchase?.date || ''}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                placeholder="Enter any special instructions or notes"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary">
            {currentPurchase ? 'Update Purchase Order' : 'Create Purchase Order'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Purchases;