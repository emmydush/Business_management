import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge, Alert } from 'react-bootstrap';
import { purchasesAPI, inventoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import { useI18n } from '../i18n/I18nProvider';

import SubscriptionGuard from '../components/SubscriptionGuard';

const Purchases = () => {
  
  const { formatCurrency } = useCurrency();
  const { t } = useI18n();
  const [purchases, setPurchases] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentPurchase, setCurrentPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [newItem, setNewItem] = useState({
    product_id: '',
    quantity: 1,
    unit_price: 0,
    discount_percent: 0
  });
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [orderData, setOrderData] = useState({
    order_id: '',
    status: 'pending',
    order_date: '',
    required_date: '',
    notes: ''
  });

  // Fetch real data from API
  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        setLoading(true);
        const response = await purchasesAPI.getPurchaseOrders();
        setPurchases(response.data.purchase_orders || []);
        setError(null);
      } catch (err) {
        setError("purchase_fetch_failed");
        console.error('Error fetching purchase orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch suppliers
      const suppliersResponse = await purchasesAPI.getSuppliers();
      setSuppliers(suppliersResponse.data.suppliers || []);

      // Fetch products
      const productsResponse = await inventoryAPI.getProducts({ per_page: 1000 });
      setProducts(productsResponse.data.products || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleEdit = async (purchase) => {
    setCurrentPurchase(purchase);
    await fetchData();
    setSelectedSupplier(purchase.supplier_id || '');
    setOrderItems(purchase.items || []);
    setOrderData({
      order_id: purchase.order_id || '',
      status: purchase.status || 'pending',
      order_date: purchase.order_date ? new Date(purchase.order_date).toISOString().split("T")[0] : '',
      required_date: purchase.required_date ? new Date(purchase.required_date).toISOString().split("T")[0] : '',
      notes: purchase.notes || ''
    });
    setNewItem({
      product_id: '',
      quantity: 1,
      unit_price: 0,
      discount_percent: 0
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("delete_purchase_confirm")) {
      try {
        await purchasesAPI.deletePurchaseOrder(id);
        setPurchases(purchases.filter(pur => pur.id !== id));
        toast.success("purchase_deleted");
      } catch (err) {
        setError("purchase_delete_failed");
        toast.error("purchase_delete_failed");
        console.error('Error deleting purchase order:', err);
      }
    }
  };

  const handleAdd = async () => {
    setCurrentPurchase(null);
    await fetchData();
    setSelectedSupplier('');
    setOrderItems([]);
    setOrderData({
      order_id: '',
      status: 'pending',
      order_date: new Date().toISOString().split("T")[0],
      required_date: '',
      notes: ''
    });
    setNewItem({
      product_id: '',
      quantity: 1,
      unit_price: 0,
      discount_percent: 0
    });
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setCurrentPurchase(null);
  };

  const handleOrderDataChange = (field, value) => {
    setOrderData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSupplierChange = (supplierId) => {
    setSelectedSupplier(supplierId);
  };

  const handleNewItemChange = (field, value) => {
    setNewItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddItem = () => {
    if (!newItem.product_id || newItem.quantity <= 0 || newItem.unit_price < 0) {
      toast.error("add_item_error");
      return;
    }

    // Get product details to show name in the list
    const product = products.find(p => p.id === parseInt(newItem.product_id));
    const productName = product ? product.name : 'Unknown Product';

    const newItemObj = {
      ...newItem,
      id: Date.now(), // Temporary ID for UI
      product_name: productName,
      line_total: (newItem.quantity * newItem.unit_price * (1 - newItem.discount_percent / 100)).toFixed(2)
    };

    setOrderItems(prev => [...prev, newItemObj]);

    // Reset form
    setNewItem({
      product_id: '',
      quantity: 1,
      unit_price: 0,
      discount_percent: 0
    });
  };

  const handleRemoveItem = (itemId) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => {
      return sum + parseFloat(item.line_total || 0);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that there are items in the order
    if (!orderItems || orderItems.length === 0) {
      toast.error("add_item_required");
      return;
    }

    try {
      // Prepare items for submission (remove temporary UI properties)
      const itemsForSubmission = orderItems.map(item => ({
        product_id: parseInt(item.product_id),
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unit_price),
        discount_percent: parseFloat(item.discount_percent)
      }));

      const orderDataToSend = {
        supplier_id: parseInt(selectedSupplier),
        items: itemsForSubmission,
        status: orderData.status,
        order_date: orderData.order_date,
        required_date: orderData.required_date,
        notes: orderData.notes
      };

      if (currentPurchase) {
        // Update existing purchase order
        const response = await purchasesAPI.updatePurchaseOrder(currentPurchase.id, orderDataToSend);
        toast.success("purchase_updated");
        setPurchases(purchases.map(p => p.id === currentPurchase.id ? response.data.purchase_order : p));
      } else {
        // Create new purchase order
        const response = await purchasesAPI.createPurchaseOrder(orderDataToSend);
        toast.success("purchase_created");
        setPurchases([response.data.purchase_order, ...purchases]);
      }

      setShowModal(false);
      setCurrentPurchase(null);
    } catch (err) {
      setError("purchase_save_failed");
      toast.error("purchase_save_failed");
      console.error('Error saving purchase order:', err);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
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
      toast.success(response.data.message || "export_purchases_success");
      console.log('Export response:', response.data);
    } catch (err) {
      toast.error("export_purchases_failed");
      console.error('Error exporting purchase orders:', err);
    }
  };

  return (
    <Container fluid>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <h1>{t('purchase_management')}</h1>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Button variant="outline-secondary" onClick={handleExport}>
            {t('export')}
          </Button>
          <SubscriptionGuard message="Renew your subscription to create purchase orders">
            <Button variant="primary" onClick={handleAdd}>{t('new_purchase_order')}</Button>
          </SubscriptionGuard>
        </div>
      </div>

      <Row>
        <Col lg={12}>
          <Card>
            <Card.Header>
              <h5>{t('purchase_orders')}</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>{t('purchase_id')}</th>
                      <th>{t('supplier')}</th>
                      <th>{t('sale_date')}</th>
                      <th>{t('total')}</th>
                      <th>{t('items')}</th>
                      <th>{t('status')}</th>
                      <th>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map(purchase => (
                      <tr key={purchase.id}>
                        <td>{purchase.order_id}</td>
                        <td>{purchase.supplier ? purchase.supplier.company_name : 'N/A'}</td>
                        <td>{purchase.order_date ? new Date(purchase.order_date).toLocaleDateString() : 'N/A'}</td>
                        <td>{formatCurrency(purchase.total_amount)}</td>
                        <td>{purchase.items ? purchase.items.length : 0}</td>
                        <td>
                          <Badge bg={getStatusVariant(purchase.status)}>
                            {purchase.status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(purchase)}
                          >
                            {t('view')}
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(purchase.id)}
                          >
                            {t('delete_sale')}
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
            {currentPurchase ? `${t('purchase_orders')}: ${currentPurchase.order_id}` : t('new_purchase_order')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('purchase_id')}</Form.Label>
                  <Form.Control
                    type="text"
                    value={orderData.order_id || ''}
                    onChange={(e) => handleOrderDataChange('order_id', e.target.value)}
                    placeholder="PUR001"
                    disabled={!!currentPurchase}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('status')}</Form.Label>
                  <Form.Select
                    value={orderData.status}
                    onChange={(e) => handleOrderDataChange('status', e.target.value)}
                  >
                    <option value="pending">{t('status_pending')}</option>
                    <option value="confirmed">{t('status_confirmed')}</option>
                    <option value="shipped">{t('status_shipped')}</option>
                    <option value="partially_received">{t('partially_received')}</option>
                    <option value="received">{t('received')}</option>
                    <option value="cancelled">{t('status_cancelled')}</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>{t('supplier')}</Form.Label>
              <Form.Select
                value={selectedSupplier}
                onChange={(e) => handleSupplierChange(e.target.value)}
                disabled={!!currentPurchase}
              >
                <option value="">{t('select_supplier')}</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.company_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('sale_date')}</Form.Label>
                  <Form.Control
                    type="date"
                    value={orderData.order_date}
                    onChange={(e) => handleOrderDataChange('order_date', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('required_date')}</Form.Label>
                  <Form.Control
                    type="date"
                    value={orderData.required_date}
                    onChange={(e) => handleOrderDataChange('required_date', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6>{t('sale_items')}</h6>
              </div>
              <div className="mb-3">
                <Row>
                  <Col md={3}>
                    <Form.Label>{t('product_header')}</Form.Label>
                    <Form.Select
                      value={newItem.product_id}
                      onChange={(e) => handleNewItemChange('product_id', e.target.value)}
                    >
                      <option value="">{t('select_product')}</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={2}>
                    <Form.Label>{t('quantity')}</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => handleNewItemChange('quantity', parseInt(e.target.value) || 1)}
                    />
                  </Col>
                  <Col md={2}>
                    <Form.Label>{t('unit_price_header')}</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.unit_price}
                      onChange={(e) => handleNewItemChange('unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </Col>
                  <Col md={2}>
                    <Form.Label>{t('discount')} (%)</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      max="100"
                      value={newItem.discount_percent}
                      onChange={(e) => handleNewItemChange('discount_percent', parseFloat(e.target.value) || 0)}
                    />
                  </Col>
                  <Col md={3} className="d-flex align-items-end">
                    <Button variant="outline-primary" onClick={handleAddItem} className="w-100">
                      {t('add_item')}
                    </Button>
                  </Col>
                </Row>
              </div>

              {orderItems.length > 0 && (
                <div className="table-responsive">
                  <Table striped bordered>
                    <thead>
                      <tr>
                        <th>{t('product_header')}</th>
                        <th>{t('quantity')}</th>
                        <th>{t('unit_price_header')}</th>
                        <th>{t('discount')}</th>
                        <th>{t('line_total')}</th>
                        <th>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map(item => (
                        <tr key={item.id}>
                          <td>{item.product_name}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.unit_price)}</td>
                          <td>{item.discount_percent}%</td>
                          <td>{formatCurrency(item.line_total)}</td>
                          <td>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              {"remove_supplier"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                      <tr className="fw-bold">
                        <td colSpan="4" className="text-end">{t('subtotal')}:</td>
                        <td>{formatCurrency(calculateSubtotal())}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('notes')}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={orderData.notes}
                onChange={(e) => handleOrderDataChange('notes', e.target.value)}
                placeholder={t('notes')}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            {t('cancel')}
          </Button>
          <Button variant="primary" type="submit" onClick={handleSubmit}>
            {currentPurchase ? t('update_purchase_order') : t('create_purchase_order')}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Purchases;

