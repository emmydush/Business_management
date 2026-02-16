import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge, Alert } from 'react-bootstrap';
import { salesAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { useI18n } from '../i18n/I18nProvider';
import SubscriptionGuard from '../components/SubscriptionGuard';

const Sales = () => {
  const { t } = useI18n();
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { formatCurrency } = useCurrency();

  // Fetch real data from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await salesAPI.getOrders();
        setOrders(response.data.orders || []);
        setError(null);
      } catch (err) {
        if (err && err.response && err.response.status === 403) {
          setError(err.response.data?.message || err.response.data?.error || t('no_data_available'));
        } else {
          setError(t('no_data_available'));
        }
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [t]);

  const handleEdit = (order) => {
    setCurrentOrder(order);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('delete_confirm_title'))) {
      try {
        // In a real app, you would make an API call to delete the order
        // await salesAPI.deleteOrder(id);

        // For now, we'll just update the local state
        setOrders(orders.filter(order => order.id !== id));
        setError(null);
      } catch (err) {
        setError(t('no_data_available'));
        console.error('Error deleting order:', err);
      }
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setCurrentOrder(null);
  };

  const handleUpdateStatus = async () => {
    if (!currentOrder) return;
    try {
      setIsSaving(true);
      const status = document.getElementById('orderStatusSelect').value;
      await salesAPI.updateOrder(currentOrder.id, { status: status.toUpperCase() });

      // Update local state
      setOrders(orders.map(o => o.id === currentOrder.id ? { ...o, status: status.toLowerCase() } : o));

      handleClose();
      // toast.success(t('sale_updated')); // toast is not imported here, but we can add it if needed
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
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
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0 fw-bold">{t('sales_management')}</h5>
              <SubscriptionGuard message="Renew your subscription to create new orders">
                <Button variant="primary">
                  {t('create_order')}
                </Button>
              </SubscriptionGuard>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0">{t('order_id')}</th>
                      <th className="border-0">{t('customer')}</th>
                      <th className="border-0">{t('joined')}</th>
                      <th className="border-0">{t('total')}</th>
                      <th className="border-0">{t('items')}</th>
                      <th className="border-0">{t('status')}</th>
                      <th className="border-0 text-end">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td>{order.order_id}</td>
                        <td>{order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'N/A'}</td>
                        <td>{order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}</td>
                        <td className="fw-bold">{formatCurrency(order.total_amount || 0)}</td>
                        <td>{order.items?.length || order.items || 0}</td>
                        <td>
                          <Badge bg={getStatusVariant(order.status)}>
                            {t(`status_${order.status?.toLowerCase()}`) || order.status}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(order)}
                          >
                            {t('view')}
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(order.id)}
                          >
                            {t('logout')}
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
          <Modal.Title className="fw-bold">{t('order_details')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          {currentOrder && (
            <div>
              <div className="d-flex justify-content-between mb-4">
                <div>
                  <h6 className="text-muted mb-1">{t('order_id')}</h6>
                  <h5 className="fw-bold">{currentOrder.order_id}</h5>
                </div>
                <div className="text-end">
                  <h6 className="text-muted mb-1">{t('status')}</h6>
                  <Badge bg={getStatusVariant(currentOrder.status)} className="px-3 py-2">
                    {t(`status_${currentOrder.status?.toLowerCase()}`) || currentOrder.status}
                  </Badge>
                </div>
              </div>

              <Row className="mb-4">
                <Col md={6}>
                  <h6 className="fw-bold mb-2">{t('customer')}</h6>
                  <p className="mb-0">{currentOrder.customer ? `${currentOrder.customer.first_name} ${currentOrder.customer.last_name}` : 'N/A'}</p>
                </Col>
                <Col md={6} className="text-md-end">
                  <h6 className="fw-bold mb-2">{t('joined')}</h6>
                  <p className="mb-0">{currentOrder.order_date ? new Date(currentOrder.order_date).toLocaleDateString() : 'N/A'}</p>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold small">{t('update_status')}</Form.Label>
                    <Form.Select id="orderStatusSelect" defaultValue={currentOrder.status?.toLowerCase()}>
                      <option value="pending">{t('status_pending')}</option>
                      <option value="confirmed">{t('status_confirmed')}</option>
                      <option value="processing">{t('status_processing')}</option>
                      <option value="shipped">{t('status_shipped')}</option>
                      <option value="delivered">{t('status_delivered')}</option>
                      <option value="cancelled">{t('status_cancelled')}</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <h6 className="fw-bold mb-3">{t('items')}</h6>
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0">{t('product')}</th>
                      <th className="border-0">{t('quantity')}</th>
                      <th className="border-0">{t('price')}</th>
                      <th className="border-0 text-end">{t('total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrder.items && currentOrder.items.length > 0 ? (
                      currentOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.product ? item.product.name : 'N/A'}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.unit_price || 0)}</td>
                          <td className="text-end fw-bold">{formatCurrency(item.line_total || 0)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-4 text-muted">{t('no_items_order')}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="border-top">
                    <tr>
                      <td colSpan="3" className="text-end fw-bold py-3">{t('total')}</td>
                      <td className="text-end fw-bold py-3 text-primary" style={{ fontSize: '1.2rem' }}>
                        {formatCurrency(currentOrder.total_amount || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={handleClose} className="px-4">
            {t('cancel')}
          </Button>
          <Button variant="primary" className="px-4" onClick={handleUpdateStatus} disabled={isSaving}>
            {isSaving ? t('login_signing') : t('update_status')}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Sales;
