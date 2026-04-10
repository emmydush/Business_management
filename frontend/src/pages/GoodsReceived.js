import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, Badge, InputGroup } from 'react-bootstrap';
import { purchasesAPI, inventoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import { FiPlus, FiTrash2, FiCheckSquare, FiPackage, FiTruck, FiBox, FiSearch, FiArrowRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const GoodsReceived = () => {
  const { formatCurrency } = useCurrency();
  const [goodsReceived, setGoodsReceived] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [products, setProducts] = useState([]);
  const [receiptItems, setReceiptItems] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [poRes, productsRes] = await Promise.all([
        purchasesAPI.getPurchaseOrders({ status: 'shipped,partially_received' }),
        inventoryAPI.getProducts({ per_page: 1000 })
      ]);
      
      setGoodsReceived(poRes.data.purchase_orders || []);
      setProducts(productsRes.data.products || []);
    } catch (err) {
      console.error('Error fetching goods received records:', err);
    }
  };

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
    if (!orderId) {
        setReceiptItems([]);
        return;
    }
    
    try {
      const response = await purchasesAPI.getPurchaseOrder(orderId);
      const order = response.data.purchase_order;
      
      const items = order.items?.map(item => ({
        ...item,
        product_name: products.find(p => p.id === item.product_id)?.name || 'Unknown Product',
        received_quantity: item.quantity // Default to fully received for convenience
      })) || [];
      
      setReceiptItems(items);
      toast.success('Items pre-populated');
    } catch (err) {
      toast.error('Failed to load items.');
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
      toast.error('Please select product and quantity');
      return;
    }

    const product = products.find(p => p.id === parseInt(newItem.product_id));
    const productName = product ? product.name : 'Unknown Product';
    const originalItem = currentReceipt?.items?.find(item => item.product_id === parseInt(newItem.product_id));
    const orderedQuantity = originalItem ? originalItem.quantity : 0;

    const newItemObj = {
      ...newItem,
      id: Date.now(),
      product_name: productName,
      ordered_quantity: orderedQuantity,
      unit_price: parseFloat(newItem.unit_price) || 0
    };

    const existingIndex = receiptItems.findIndex(item => item.product_id === parseInt(newItem.product_id));
    if (existingIndex >= 0) {
      const updatedItems = [...receiptItems];
      updatedItems[existingIndex] = newItemObj;
      setReceiptItems(updatedItems);
    } else {
      setReceiptItems(prev => [...prev, newItemObj]);
    }

    setNewItem({
      product_id: '',
      ordered_quantity: 0,
      received_quantity: 0,
      unit_price: 0
    });
  };

  const handleRemoveItem = (productId) => {
    setReceiptItems(prev => prev.filter(item => item.product_id !== productId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder || receiptItems.length === 0) {
      toast.error('Please select order and add items');
      return;
    }

    try {
      const payload = {
        order_id: parseInt(selectedOrder),
        items: receiptItems.map(item => ({
          product_id: parseInt(item.product_id),
          received_quantity: parseInt(item.received_quantity)
        })),
        receipt_date: receiptData.receipt_date,
        notes: receiptData.notes
      };

      await purchasesAPI.receiveGoods(payload);
      toast.success('Goods received successfully');
      fetchData();
      setShowModal(false);
    } catch (err) {
      toast.error('Failed to record receipt');
    }
  };

  const getStatusVariant = (status) => {
    switch(status) {
      case 'pending': return { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706' };
      case 'shipped': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' };
      case 'partially_received': return { bg: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5' };
      case 'received': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669' };
      default: return { bg: 'rgba(107, 114, 128, 0.1)', color: '#4b5563' };
    }
  };

  const filteredOrders = goodsReceived.filter(o => 
    (o.order_id?.toString() || o.id.toString()).includes(searchTerm) ||
    (o.supplier?.company_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
        className="goods-received-wrapper p-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
    >
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 mt-4">
        <motion.div variants={itemVariants}>
          <h1 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.02em' }}>Goods Received</h1>
          <p className="text-muted mb-0">Track and record inventory replenishments from suppliers.</p>
        </motion.div>
        <motion.div variants={itemVariants} className="d-flex gap-2">
          <Button variant="light" className="px-4 py-2 border-0 shadow-sm" style={{ borderRadius: '12px', fontWeight: '600' }} onClick={() => fetchData()}>
             <FiTruck className="me-2" /> Refresh
          </Button>
          <Button variant="dark" className="px-4 py-2 border-0 shadow-sm" style={{ borderRadius: '12px', fontWeight: '600' }} onClick={handleAdd}>
             <FiPlus className="me-2" /> Record Receipt
          </Button>
        </motion.div>
      </div>

      <Row className="g-4 mb-5">
          {[
              { label: 'Pending Shipments', value: goodsReceived.filter(o => o.status === 'shipped').length, icon: FiTruck, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
              { label: 'Inbound Value', value: formatCurrency(goodsReceived.reduce((sum, o) => sum + o.total_amount, 0)), icon: FiBox, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
              { label: 'Active Suppliers', value: new Set(goodsReceived.map(o => o.supplier_id)).size, icon: FiTruck, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' }
          ].map((stat, idx) => (
              <Col md={4} key={idx}>
                  <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
                      <Card className="border-0 shadow-sm" style={{ borderRadius: '20px' }}>
                          <Card.Body className="p-4">
                              <div className="d-flex align-items-center mb-3">
                                  <div className="p-3 rounded-3" style={{ backgroundColor: stat.bg }}>
                                      <stat.icon style={{ color: stat.color }} size={24} />
                                  </div>
                              </div>
                              <div className="text-muted small fw-bold text-uppercase mb-1">{stat.label}</div>
                              <h3 className="fw-bold mb-0">{stat.value}</h3>
                          </Card.Body>
                      </Card>
                  </motion.div>
              </Col>
          ))}
      </Row>
      
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm" style={{ borderRadius: '24px', overflow: 'hidden' }}>
          <Card.Body className="p-0">
            <div className="p-4 border-bottom bg-white d-flex justify-content-between align-items-center">
                <InputGroup className="bg-light rounded-pill overflow-hidden border-0" style={{ maxWidth: '400px' }}>
                    <InputGroup.Text className="bg-light border-0 ps-3">
                        <FiSearch className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                        placeholder="Search by Order ID or Supplier..."
                        className="bg-light border-0 py-2 shadow-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </InputGroup>
                <div className="text-muted small fw-medium">Showing {filteredOrders.length} pending receipts</div>
            </div>

            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead style={{ backgroundColor: '#f8fafc' }}>
                  <tr>
                    <th className="border-0 py-4 ps-4 text-muted small text-uppercase">Receipt Ref</th>
                    <th className="border-0 py-4 text-muted small text-uppercase">Supplier</th>
                    <th className="border-0 py-4 text-muted small text-uppercase">Items</th>
                    <th className="border-0 py-4 text-muted small text-uppercase">Total Value</th>
                    <th className="border-0 py-4 text-muted small text-uppercase">Status</th>
                    <th className="border-0 py-4 pe-4 text-end text-muted small text-uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order, index) => {
                        const style = getStatusVariant(order.status);
                        return (
                          <motion.tr 
                            key={order.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-bottom"
                          >
                            <td className="ps-4">
                                <div className="fw-bold text-dark">GR-{order.order_id || order.id}</div>
                                <div className="text-muted small">#{order.id}</div>
                            </td>
                            <td>
                                <div className="fw-semibold">{order.supplier ? order.supplier.company_name : 'N/A'}</div>
                                <div className="text-muted x-small">{order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}</div>
                            </td>
                            <td>
                                <Badge bg="light" text="dark" pill className="border fw-normal px-2">
                                    {order.items ? order.items.length : 0} Unique Items
                                </Badge>
                            </td>
                            <td className="fw-bold">{formatCurrency(order.total_amount)}</td>
                            <td>
                                <Badge pill style={{ backgroundColor: style.bg, color: style.color, fontWeight: '600', fontSize: '0.7rem' }}>
                                    {order.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                            </td>
                            <td className="text-end pe-4">
                              <Button 
                                variant="outline-dark" 
                                size="sm" 
                                className="border-0 rounded-3 px-3 fw-bold"
                                style={{ backgroundColor: '#f1f5f9' }}
                                onClick={() => handleEdit(order)}
                              >
                                <FiCheckSquare className="me-2" /> Receive
                              </Button>
                            </td>
                          </motion.tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-5">
                            <FiPackage size={48} className="text-muted opacity-25 mb-3" />
                            <p className="text-muted">No pending receipts found matching your search.</p>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </motion.div>

      {/* Modal Modernized */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered className="custom-modern-modal">
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            <Modal.Header closeButton className="border-0 px-4 pt-4">
                <Modal.Title className="fw-bold fs-4">
                    {currentReceipt ? `Receive Goods: #${currentReceipt.order_id}` : 'Manual Goods Entry'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 pb-4">
            <Form onSubmit={handleSubmit}>
                <div className="p-4 bg-light rounded-4 mb-4 border">
                    <Form.Group className="mb-0">
                        <Form.Label className="small text-muted fw-bold text-uppercase">Step 1: Link Purchase Order</Form.Label>
                        <Form.Select 
                            value={selectedOrder}
                            onChange={(e) => handleOrderChange(e.target.value)}
                            disabled={!!currentReceipt}
                            className="py-3 bg-white border-0 shadow-none px-3 mt-2"
                            style={{ borderRadius: '12px' }}
                        >
                            <option value="">Select Inbound Shipment...</option>
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
                </div>
                
                {selectedOrder && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="mb-4">
                        <h6 className="fw-bold text-dark mb-3">Step 2: Validate Quantities</h6>
                        <div className="p-3 bg-white rounded-4 border">
                            <Row className="g-2">
                                <Col md={4}>
                                    <Form.Select 
                                    value={newItem.product_id}
                                    onChange={(e) => handleNewItemChange('product_id', e.target.value)}
                                    className="border-0 bg-light py-2 rounded-3"
                                    >
                                    <option value="">Select Product</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </Form.Select>
                                </Col>
                                <Col md={3}>
                                    <Form.Control 
                                    type="number" 
                                    placeholder="Qty Received"
                                    value={newItem.received_quantity || ''}
                                    onChange={(e) => handleNewItemChange('received_quantity', e.target.value)}
                                    className="border-0 bg-light py-2 rounded-3"
                                    />
                                </Col>
                                <Col md={3}>
                                    <Form.Control 
                                    type="number" 
                                    placeholder="Unit Cost"
                                    value={newItem.unit_price || ''}
                                    onChange={(e) => handleNewItemChange('unit_price', e.target.value)}
                                    className="border-0 bg-light py-2 rounded-3"
                                    />
                                </Col>
                                <Col md={2}>
                                    <Button variant="dark" onClick={handleAddItem} className="w-100 py-2 border-0 rounded-3">Add</Button>
                                </Col>
                            </Row>
                        </div>
                    </div>
                    
                    {receiptItems.length > 0 && (
                        <div className="table-responsive mb-4 rounded-4 border overflow-hidden">
                        <Table className="mb-0 small align-middle">
                            <thead className="bg-light">
                            <tr>
                                <th className="border-0">Product</th>
                                <th className="border-0">Ordered</th>
                                <th className="border-0">Received</th>
                                <th className="border-0">Cost</th>
                                <th className="border-0 text-end">Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {receiptItems.map(item => (
                                <tr key={item.product_id}>
                                <td className="fw-bold">{item.product_name}</td>
                                <td>{item.ordered_quantity}</td>
                                <td className="text-success fw-bold">{item.received_quantity}</td>
                                <td>{formatCurrency(item.unit_price)}</td>
                                <td className="text-end">
                                    <Button 
                                    variant="link" 
                                    className="text-danger p-0 border-0"
                                    onClick={() => handleRemoveItem(item.product_id)}
                                    >
                                    <FiTrash2 />
                                    </Button>
                                </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                        </div>
                    )}

                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="small text-muted fw-bold">RECEIPT DATE</Form.Label>
                                <Form.Control 
                                    type="date" 
                                    value={receiptData.receipt_date}
                                    onChange={(e) => setReceiptData(prev => ({ ...prev, receipt_date: e.target.value }))}
                                    className="border-0 bg-light py-2 rounded-3"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label className="small text-muted fw-bold">NOTES</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={2}
                                    value={receiptData.notes}
                                    onChange={(e) => setReceiptData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Delivery note numbers, damage reports, etc."
                                    className="border-0 bg-light py-3 rounded-4"
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </motion.div>
                )}
            </Form>
            </Modal.Body>
            <Modal.Footer className="border-0 px-4 pb-4">
            <Button variant="light" className="px-4 py-2 rounded-3 border-0" onClick={() => setShowModal(false)}>
                Discard
            </Button>
            <Button variant="dark" className="px-4 py-2 rounded-3 border-0" onClick={handleSubmit} disabled={!selectedOrder || receiptItems.length === 0}>
                Finalize Receipt <FiArrowRight className="ms-2" />
            </Button>
            </Modal.Footer>
        </motion.div>
      </Modal>

      <style>{`
        .goods-received-wrapper { background-color: #f8fafc; min-height: 100vh; }
        .custom-modern-modal .modal-content { border-radius: 28px; border: none; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.2); }
        .x-small { font-size: 0.65rem; }
      `}</style>
    </motion.div>
  );
};

export default GoodsReceived;

