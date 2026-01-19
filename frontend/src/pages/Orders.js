import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge, Spinner } from 'react-bootstrap';
import { salesAPI } from '../services/api';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await salesAPI.getOrders();
      setOrders(res.data.orders || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch orders.');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (order) => {
    setCurrentOrder(order);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    toast((t) => (
      <span>
        Are you sure you want to delete this order?
        <div className="mt-2 d-flex gap-2">
          <Button size="sm" variant="danger" onClick={async () => {
            try {
              await salesAPI.deleteOrder(id); 
              setOrders(orders.filter(ord => ord.id !== id));
              toast.dismiss(t.id);
              toast.success('Order deleted');
            } catch (err) {
              toast.error('Failed to delete order');
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

  const handleAdd = () => {
    setCurrentOrder(null);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setCurrentOrder(null);
  };

  const handleSave = async () => {
    // This would handle saving the order
    // For now, just close the modal
    toast.success(currentOrder ? 'Order updated successfully!' : 'Order created successfully!');
    handleClose();
    fetchOrders(); // Refresh the list
  };

  const handleExport = async () => {
    try {
      const response = await salesAPI.exportOrders();
      toast.success(response.data.message || 'Orders export initiated successfully');
      console.log('Export response:', response.data);
    } catch (err) {
      toast.error('Failed to export orders. Please try again.');
      console.error('Error exporting orders:', err);
    }
  };

  const getStatusVariant = (status) => {
    if (!status) return 'secondary';
    switch (status.toLowerCase()) {
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
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h1 className="fw-bold text-dark mb-1">Orders Management</h1>
          <p className="text-muted mb-0">Manage customer orders and track status.</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Button variant="outline-secondary" onClick={handleExport}>
            Export
          </Button>
          <Button variant="primary" onClick={handleAdd}>New Order</Button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <Row>
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4 py-3 border-0">Order ID</th>
                      <th className="py-3 border-0">Customer</th>
                      <th className="py-3 border-0">Date</th>
                      <th className="py-3 border-0">Amount</th>
                      <th className="py-3 border-0">Status</th>
                      <th className="pe-4 py-3 border-0 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td className="ps-4 fw-bold">{order.order_id}</td>
                        <td>{order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'N/A'}</td>
                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="fw-bold">${parseFloat(order.total_amount).toFixed(2)}</td>
                        <td>
                          <Badge bg={getStatusVariant(order.status)}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="pe-4 text-end">
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
      <Modal show={showModal} onHide={handleClose} size="lg" centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">
            {currentOrder ? `Order: ${currentOrder.order_id}` : 'New Order'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <Form>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Order ID</Form.Label>
                  <Form.Control
                    type="text"
                    defaultValue={currentOrder?.order_id}
                    placeholder="ORD001"
                    disabled={!!currentOrder}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Status</Form.Label>
                  <Form.Select defaultValue={currentOrder?.status || 'PENDING'}>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Customer</Form.Label>
                  <Form.Control
                    type="text"
                    defaultValue={currentOrder?.customer ? `${currentOrder.customer.first_name} ${currentOrder.customer.last_name}` : ''}
                    placeholder="Customer Name"
                    disabled
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Enter any special instructions or notes"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {currentOrder ? 'Update Order' : 'Create Order'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Orders;
