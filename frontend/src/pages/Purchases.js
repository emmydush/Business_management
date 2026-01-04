import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge, Alert } from 'react-bootstrap';
import { purchasesAPI } from '../services/api';
import toast from 'react-hot-toast';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentPurchase, setCurrentPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real data from API
  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        setLoading(true);
        const response = await purchasesAPI.getPurchaseOrders();
        setPurchases(response.data.purchase_orders || []);
        setError(null);
      } catch (err) {
        setError('Failed to fetch purchase orders. Please try again later.');
        console.error('Error fetching purchase orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  const handleEdit = (purchase) => {
    setCurrentPurchase(purchase);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      try {
        await purchasesAPI.deletePurchaseOrder(id);
        setPurchases(purchases.filter(pur => pur.id !== id));
        toast.success('Purchase order deleted successfully');
      } catch (err) {
        setError('Failed to delete purchase order. Please try again.');
        toast.error('Failed to delete purchase order. Please try again.');
        console.error('Error deleting purchase order:', err);
      }
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

  if (error) {
    return (
      <Container fluid>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  const handleExport = async () => {
    try {
      const response = await purchasesAPI.exportPurchases();
      toast.success(response.data.message || 'Purchase orders export initiated successfully');
      console.log('Export response:', response.data);
    } catch (err) {
      toast.error('Failed to export purchase orders. Please try again.');
      console.error('Error exporting purchase orders:', err);
    }
  };

  return (
    <Container fluid>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <h1>Purchase Management</h1>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Button variant="outline-secondary" onClick={handleExport}>
            Export
          </Button>
          <Button variant="primary" onClick={handleAdd}>New Purchase Order</Button>
        </div>
      </div>
      
      <Row>
        <Col lg={12}>
          <Card>
            <Card.Header>
              <h5>Purchase Orders</h5>
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
                        <td>{purchase.order_id}</td>
                        <td>{purchase.supplier ? purchase.supplier.company_name : 'N/A'}</td>
                        <td>{purchase.order_date ? new Date(purchase.order_date).toLocaleDateString() : 'N/A'}</td>
                        <td>${purchase.total_amount ? parseFloat(purchase.total_amount).toFixed(2) : '0.00'}</td>
                        <td>{purchase.items ? purchase.items.length : 0}</td>
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
            {currentPurchase ? `Purchase Order: ${currentPurchase.order_id}` : 'New Purchase Order'}
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
                    defaultValue={currentPurchase?.order_id || 'PUR001'}
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
                defaultValue={currentPurchase?.supplier ? currentPurchase.supplier.company_name : ''}
                placeholder="Enter supplier name"
                disabled={!!currentPurchase}
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Order Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    defaultValue={currentPurchase?.order_date || ''}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Required Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    defaultValue={currentPurchase?.required_date || ''}
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