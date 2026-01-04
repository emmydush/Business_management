import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge } from 'react-bootstrap';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data for orders
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setOrders([
        { id: 1, orderId: 'ORD001', customer: 'John Doe', date: '2023-07-15', amount: 1250.00, status: 'delivered', items: 3 },
        { id: 2, orderId: 'ORD002', customer: 'Jane Smith', date: '2023-07-14', amount: 890.50, status: 'shipped', items: 2 },
        { id: 3, orderId: 'ORD003', customer: 'Bob Johnson', date: '2023-07-13', amount: 2100.00, status: 'processing', items: 5 },
        { id: 4, orderId: 'ORD004', customer: 'Alice Brown', date: '2023-07-12', amount: 650.75, status: 'confirmed', items: 1 },
        { id: 5, orderId: 'ORD005', customer: 'Charlie Wilson', date: '2023-07-11', amount: 1800.25, status: 'pending', items: 4 }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleEdit = (order) => {
    setCurrentOrder(order);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      setOrders(orders.filter(ord => ord.id !== id));
    }
  };

  const handleAdd = () => {
    setCurrentOrder(null);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setCurrentOrder(null);
  };

  const getStatusVariant = (status) => {
    switch(status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'processing': return 'primary';
      case 'shipped': return 'secondary';
      case 'delivered': return 'success';
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
      <h1 className="mb-4">Orders Management</h1>
      
      <Row>
        <Col lg={12}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5>Orders List</h5>
              <Button variant="primary" onClick={handleAdd}>New Order</Button>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Items</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td>{order.orderId}</td>
                        <td>{order.customer}</td>
                        <td>{order.date}</td>
                        <td>${order.amount.toFixed(2)}</td>
                        <td>{order.items}</td>
                        <td>
                          <Badge bg={getStatusVariant(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleEdit(order)}
                          >
                            View
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(order.id)}
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

      {/* Order Modal */}
      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {currentOrder ? `Order: ${currentOrder.orderId}` : 'New Order'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Order ID</Form.Label>
                  <Form.Control 
                    type="text" 
                    defaultValue={currentOrder?.orderId || 'ORD001'}
                    placeholder="ORD001"
                    disabled={!!currentOrder}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select defaultValue={currentOrder?.status || 'pending'}>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Customer</Form.Label>
              <Form.Control 
                type="text" 
                defaultValue={currentOrder?.customer || ''}
                placeholder="Enter customer name"
              />
            </Form.Group>
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
            {currentOrder ? 'Update Order' : 'Create Order'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Orders;