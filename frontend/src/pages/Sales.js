import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge } from 'react-bootstrap';

const Sales = () => {
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data for orders
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setOrders([
        { id: 1, orderId: 'ORD0001', customer: 'John Doe', date: '2023-07-15', amount: 1250.00, status: 'completed', items: 3 },
        { id: 2, orderId: 'ORD0002', customer: 'Jane Smith', date: '2023-07-14', amount: 890.50, status: 'processing', items: 2 },
        { id: 3, orderId: 'ORD0003', customer: 'Bob Johnson', date: '2023-07-13', amount: 2100.00, status: 'shipped', items: 5 }
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
      setOrders(orders.filter(order => order.id !== id));
    }
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
      case 'completed': return 'success';
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
      <Row>
        <Col lg={12}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5>Sales Management</h5>
              <Button variant="primary">
                Create Order
              </Button>
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
          <Modal.Title>Order Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentOrder && (
            <div>
              <h5>Order: {currentOrder.orderId}</h5>
              <p><strong>Customer:</strong> {currentOrder.customer}</p>
              <p><strong>Date:</strong> {currentOrder.date}</p>
              <p><strong>Amount:</strong> ${currentOrder.amount.toFixed(2)}</p>
              <p><strong>Status:</strong> {currentOrder.status}</p>
              <h6 className="mt-3">Items:</h6>
              <Table striped>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Laptop</td>
                    <td>1</td>
                    <td>$999.99</td>
                    <td>$999.99</td>
                  </tr>
                  <tr>
                    <td>Mouse</td>
                    <td>2</td>
                    <td>$25.00</td>
                    <td>$50.00</td>
                  </tr>
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary">
            Update Status
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Sales;