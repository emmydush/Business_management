import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge, Alert } from 'react-bootstrap';
import { salesAPI } from '../services/api';

const Sales = () => {
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real data from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await salesAPI.getOrders();
        setOrders(response.data.orders || []);
        setError(null);
      } catch (err) {
        setError('Failed to fetch orders. Please try again later.');
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleEdit = (order) => {
    setCurrentOrder(order);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        // In a real app, you would make an API call to delete the order
        // await salesAPI.deleteOrder(id);
        
        // For now, we'll just update the local state
        setOrders(orders.filter(order => order.id !== id));
      } catch (err) {
        setError('Failed to delete order. Please try again.');
        console.error('Error deleting order:', err);
      }
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

  if (error) {
    return (
      <Container fluid>
        <Alert variant="danger">{error}</Alert>
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
                        <td>{order.order_id}</td>
                        <td>{order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'N/A'}</td>
                        <td>{order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}</td>
                        <td>${order.total_amount ? parseFloat(order.total_amount).toFixed(2) : '0.00'}</td>
                        <td>{order.items ? order.items.length : 0}</td>
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
              <h5>Order: {currentOrder.order_id}</h5>
              <p><strong>Customer:</strong> {currentOrder.customer ? `${currentOrder.customer.first_name} ${currentOrder.customer.last_name}` : 'N/A'}</p>
              <p><strong>Date:</strong> {currentOrder.order_date ? new Date(currentOrder.order_date).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Amount:</strong> ${currentOrder.total_amount ? parseFloat(currentOrder.total_amount).toFixed(2) : '0.00'}</p>
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
                  {currentOrder.items && currentOrder.items.length > 0 ? (
                    currentOrder.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product ? item.product.name : 'N/A'}</td>
                        <td>{item.quantity}</td>
                        <td>${item.unit_price ? parseFloat(item.unit_price).toFixed(2) : '0.00'}</td>
                        <td>${item.line_total ? parseFloat(item.line_total).toFixed(2) : '0.00'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center">No items in this order</td>
                    </tr>
                  )}
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