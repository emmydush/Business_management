import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge, Alert } from 'react-bootstrap';
import { purchasesAPI, inventoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';

const Purchases = () => {
  const { formatCurrency } = useCurrency();
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
        setError('Failed to fetch purchase orders. Please try again later.');
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
      order_date: purchase.order_date ? new Date(purchase.order_date).toISOString().split('T')[0] : '',
      required_date: purchase.required_date ? new Date(purchase.required_date).toISOString().split('T')[0] : '',
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

  const handleAdd = async () => {
    setCurrentPurchase(null);
    await fetchData();
    setSelectedSupplier('');
    setOrderItems([]);
    setOrderData({
      order_id: '',
      status: 'pending',
      order_date: new Date().toISOString().split('T')[0],
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
      toast.error('Please select a product and enter valid quantity and price');
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

  const calculateTaxAmount = (taxRate = 0) => {
    return calculateSubtotal() * (taxRate / 100);
  };

  const calculateTotal = (taxRate = 0, discountAmount = 0, shippingCost = 0) => {
    const subtotal = calculateSubtotal();
    const taxAmount = subtotal * (taxRate / 100);
    return subtotal + taxAmount - discountAmount + shippingCost;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that there are items in the order
    if (!orderItems || orderItems.length === 0) {
      toast.error('Please add at least one item to the purchase order');
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
        toast.success('Purchase order updated successfully');
        setPurchases(purchases.map(p => p.id === currentPurchase.id ? response.data.purchase_order : p));
      } else {
        // Create new purchase order
        const response = await purchasesAPI.createPurchaseOrder(orderDataToSend);
        toast.success('Purchase order created successfully');
        setPurchases([response.data.purchase_order, ...purchases]);
      }
      
      setShowModal(false);
      setCurrentPurchase(null);
    } catch (err) {
      setError('Failed to save purchase order. Please try again.');
      toast.error('Failed to save purchase order. Please try again.');
      console.error('Error saving purchase order:', err);
    }
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
                        <td>{formatCurrency(purchase.total_amount)}</td>
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
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Purchase ID</Form.Label>
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
                  <Form.Label>Status</Form.Label>
                  <Form.Select 
                    value={orderData.status}
                    onChange={(e) => handleOrderDataChange('status', e.target.value)}
                  >
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
              <Form.Select 
                value={selectedSupplier}
                onChange={(e) => handleSupplierChange(e.target.value)}
                disabled={!!currentPurchase}
              >
                <option value="">Select Supplier</option>
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
                  <Form.Label>Order Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    value={orderData.order_date}
                    onChange={(e) => handleOrderDataChange('order_date', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Required Date</Form.Label>
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
                <h6>Order Items</h6>
              </div>
              <div className="mb-3">
                <Row>
                  <Col md={3}>
                    <Form.Label>Product</Form.Label>
                    <Form.Select 
                      value={newItem.product_id}
                      onChange={(e) => handleNewItemChange('product_id', e.target.value)}
                    >
                      <option value="">Select Product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={2}>
                    <Form.Label>Quantity</Form.Label>
                    <Form.Control 
                      type="number" 
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => handleNewItemChange('quantity', parseInt(e.target.value) || 1)}
                    />
                  </Col>
                  <Col md={2}>
                    <Form.Label>Unit Price</Form.Label>
                    <Form.Control 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={newItem.unit_price}
                      onChange={(e) => handleNewItemChange('unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </Col>
                  <Col md={2}>
                    <Form.Label>Discount (%)</Form.Label>
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
                      Add Item
                    </Button>
                  </Col>
                </Row>
              </div>
              
              {orderItems.length > 0 && (
                <div className="table-responsive">
                  <Table striped bordered>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Discount</th>
                        <th>Line Total</th>
                        <th>Action</th>
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
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                      <tr className="fw-bold">
                        <td colSpan="4" className="text-end">Subtotal:</td>
                        <td>{formatCurrency(calculateSubtotal())}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              )}
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                value={orderData.notes}
                onChange={(e) => handleOrderDataChange('notes', e.target.value)}
                placeholder="Enter any special instructions or notes"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {currentPurchase ? 'Update Purchase Order' : 'Create Purchase Order'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Purchases;