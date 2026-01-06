import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge, Alert } from 'react-bootstrap';
import { purchasesAPI, inventoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import { FiPackage, FiPlus, FiDownload, FiTrash2, FiCheckSquare } from 'react-icons/fi';

const GoodsReceived = () => {
  const { formatCurrency } = useCurrency();
  const [goodsReceived, setGoodsReceived] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [receiptItems, setReceiptItems] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [receiptData, setReceiptData] = useState({
    receipt_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [newItem, setNewItem] = useState({
    product_id: '',
    ordered_quantity: 0,
    received_quantity: 0,
    unit_price: 0
  });

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch goods received records
        const response = await purchasesAPI.getPurchaseOrders({ status: 'shipped,partially_received' });
        setGoodsReceived(response.data.purchase_orders || []);
        
        // Fetch suppliers
        const suppliersResponse = await purchasesAPI.getSuppliers();
        setSuppliers(suppliersResponse.data.suppliers || []);
        
        // Fetch products
        const productsResponse = await inventoryAPI.getProducts();
        setProducts(productsResponse.data.products || []);
        
        setError(null);
      } catch (err) {
        setError('Failed to fetch goods received records. Please try again later.');
        console.error('Error fetching goods received records:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAdd = () => {
    setCurrentReceipt(null);
    setSelectedOrder('');
    setReceiptItems([]);
    setReceiptData({
      receipt_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setNewItem({
      product_id: '',
      ordered_quantity: 0,
      received_quantity: 0,
      unit_price: 0
    });
    setShowModal(true);
  };

  const handleEdit = async (receipt) => {
    setCurrentReceipt(receipt);
    setSelectedOrder(receipt.id);
    
    // Pre-populate items from the selected purchase order
    const items = receipt.items?.map(item => ({
      ...item,
      product_name: products.find(p => p.id === item.product_id)?.name || 'Unknown Product'
    })) || [];
    
    setReceiptItems(items);
    setReceiptData({
      receipt_date: receipt.order_date ? new Date(receipt.order_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notes: receipt.notes || ''
    });
    
    setNewItem({
      product_id: '',
      ordered_quantity: 0,
      received_quantity: 0,
      unit_price: 0
    });
    setShowModal(true);
  };

  const handleOrderChange = async (orderId) => {
    setSelectedOrder(orderId);
    
    // Load items from the selected purchase order
    try {
      const response = await purchasesAPI.getPurchaseOrder(orderId);
      const order = response.data.purchase_order;
      
      const items = order.items?.map(item => ({
        ...item,
        product_name: products.find(p => p.id === item.product_id)?.name || 'Unknown Product',
        received_quantity: 0 // Start with 0 received
      })) || [];
      
      setReceiptItems(items);
    } catch (err) {
      setError('Failed to load purchase order items.');
      toast.error('Failed to load purchase order items.');
      console.error('Error loading purchase order items:', err);
    }
  };

  const handleNewItemChange = (field, value) => {
    setNewItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddItem = () => {
    if (!newItem.product_id || newItem.received_quantity <= 0) {
      toast.error('Please select a product and enter valid received quantity');
      return;
    }

    // Get product details to show name in the list
    const product = products.find(p => p.id === parseInt(newItem.product_id));
    const productName = product ? product.name : 'Unknown Product';

    // Find the original order item to get ordered quantity
    const originalItem = currentReceipt?.items?.find(item => item.product_id === parseInt(newItem.product_id));
    const orderedQuantity = originalItem ? originalItem.quantity : 0;

    const newItemObj = {
      ...newItem,
      id: Date.now(), // Temporary ID for UI
      product_name: productName,
      ordered_quantity: orderedQuantity,
      unit_price: parseFloat(newItem.unit_price) || 0
    };

    // Check if item already exists in the list
    const existingIndex = receiptItems.findIndex(item => item.product_id === parseInt(newItem.product_id));
    if (existingIndex >= 0) {
      // Update existing item
      const updatedItems = [...receiptItems];
      updatedItems[existingIndex] = newItemObj;
      setReceiptItems(updatedItems);
    } else {
      // Add new item
      setReceiptItems(prev => [...prev, newItemObj]);
    }

    // Reset form
    setNewItem({
      product_id: '',
      ordered_quantity: 0,
      received_quantity: 0,
      unit_price: 0
    });
  };

  const handleRemoveItem = (itemId) => {
    setReceiptItems(prev => prev.filter(item => item.product_id !== itemId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedOrder || !receiptItems || receiptItems.length === 0) {
      toast.error('Please select a purchase order and add received items');
      return;
    }

    try {
      const receiptDataToSend = {
        order_id: parseInt(selectedOrder),
        items: receiptItems.map(item => ({
          product_id: parseInt(item.product_id),
          received_quantity: parseInt(item.received_quantity)
        })),
        receipt_date: receiptData.receipt_date,
        notes: receiptData.notes
      };

      // Submit goods receipt
      const response = await purchasesAPI.receiveGoods(receiptDataToSend);
      toast.success('Goods received successfully');
      
      // Refresh the list
      const updatedResponse = await purchasesAPI.getPurchaseOrders({ status: 'shipped,partially_received' });
      setGoodsReceived(updatedResponse.data.purchase_orders || []);
      
      setShowModal(false);
      setCurrentReceipt(null);
    } catch (err) {
      setError('Failed to record goods receipt. Please try again.');
      toast.error('Failed to record goods receipt. Please try again.');
      console.error('Error recording goods receipt:', err);
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
      toast.success(response.data.message || 'Goods received export initiated successfully');
      console.log('Export response:', response.data);
    } catch (err) {
      toast.error('Failed to export goods received records. Please try again.');
      console.error('Error exporting goods received records:', err);
    }
  };

  return (
    <Container fluid>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h1>Goods Received</h1>
          <p className="text-muted mb-0">Record and track received goods from purchase orders.</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Button variant="outline-secondary" onClick={handleExport}>
            <FiDownload className="me-2" /> Export
          </Button>
          <Button variant="primary" onClick={handleAdd}>
            <FiPlus className="me-2" /> Record Receipt
          </Button>
        </div>
      </div>
      
      <Row>
        <Col lg={12}>
          <Card>
            <Card.Header>
              <h5>Received Goods Records</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Receipt ID</th>
                      <th>Purchase Order</th>
                      <th>Supplier</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goodsReceived.map(order => (
                      <tr key={order.id}>
                        <td>{order.order_id ? `GR-${order.order_id}` : `GR-${order.id}`}</td>
                        <td>{order.order_id || order.id}</td>
                        <td>{order.supplier ? order.supplier.company_name : 'N/A'}</td>
                        <td>{order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}</td>
                        <td>{order.items ? order.items.length : 0}</td>
                        <td>{formatCurrency(order.total_amount)}</td>
                        <td>
                          <Badge bg={getStatusVariant(order.status)}>
                            {order.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </Badge>
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleEdit(order)}
                          >
                            <FiCheckSquare className="me-1" /> Receive
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

      {/* Goods Receipt Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {currentReceipt ? `Receive Goods: ${currentReceipt.order_id}` : 'Record New Goods Receipt'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Purchase Order</Form.Label>
              <Form.Select 
                value={selectedOrder}
                onChange={(e) => handleOrderChange(e.target.value)}
                disabled={!!currentReceipt}
              >
                <option value="">Select Purchase Order</option>
                {goodsReceived
                  .filter(po => po.status === 'shipped' || po.status === 'partially_received')
                  .map(order => (
                    <option key={order.id} value={order.id}>
                      {order.order_id} - {order.supplier?.company_name || 'Supplier'}
                    </option>
                  ))
                }
              </Form.Select>
            </Form.Group>
            
            {selectedOrder && (
              <>
                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6>Received Items</h6>
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
                        <Form.Label>Ordered Qty</Form.Label>
                        <Form.Control 
                          type="number" 
                          min="0"
                          value={newItem.ordered_quantity}
                          onChange={(e) => handleNewItemChange('ordered_quantity', parseInt(e.target.value) || 0)}
                          disabled
                        />
                      </Col>
                      <Col md={2}>
                        <Form.Label>Received Qty</Form.Label>
                        <Form.Control 
                          type="number" 
                          min="0"
                          value={newItem.received_quantity}
                          onChange={(e) => handleNewItemChange('received_quantity', parseInt(e.target.value) || 0)}
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
                      <Col md={3} className="d-flex align-items-end">
                        <Button variant="outline-primary" onClick={handleAddItem} className="w-100">
                          Add Item
                        </Button>
                      </Col>
                    </Row>
                  </div>
                  
                  {receiptItems.length > 0 && (
                    <div className="table-responsive">
                      <Table striped bordered>
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Ordered</th>
                            <th>Received</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {receiptItems.map(item => (
                            <tr key={item.product_id}>
                              <td>{item.product_name}</td>
                              <td>{item.ordered_quantity}</td>
                              <td>{item.received_quantity}</td>
                              <td>{formatCurrency(item.unit_price)}</td>
                              <td>{formatCurrency(item.received_quantity * item.unit_price)}</td>
                              <td>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => handleRemoveItem(item.product_id)}
                                >
                                  <FiTrash2 className="me-1" /> Remove
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Receipt Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    value={receiptData.receipt_date}
                    onChange={(e) => setReceiptData(prev => ({ ...prev, receipt_date: e.target.value }))}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3}
                    value={receiptData.notes}
                    onChange={(e) => setReceiptData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Enter any special instructions or notes"
                  />
                </Form.Group>
              </>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!selectedOrder}>
            Record Receipt
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default GoodsReceived;