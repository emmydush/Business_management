import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge, Alert } from 'react-bootstrap';
import { purchasesAPI, inventoryAPI, supplierBillsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import { FiFileText, FiPlus, FiDownload, FiEdit2, FiTrash2, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const SupplierBills = () => {
  const { formatCurrency } = useCurrency();
  const [bills, setBills] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentBill, setCurrentBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [billData, setBillData] = useState({
    bill_number: '',
    supplier_id: '',
    purchase_order_id: '',
    bill_date: new Date().toISOString().split('T')[0],
    due_date: '',
    subtotal: 0,
    tax_amount: 0,
    discount_amount: 0,
    shipping_cost: 0,
    total_amount: 0,
    status: 'pending',
    notes: ''
  });

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch supplier bills
        const billsResponse = await supplierBillsAPI.getSupplierBills();
        setBills(billsResponse.data.supplier_bills || []);
        
        // Fetch suppliers
        const suppliersResponse = await purchasesAPI.getSuppliers();
        setSuppliers(suppliersResponse.data.suppliers || []);
        
        // Fetch purchase orders to link with bills
        const ordersResponse = await purchasesAPI.getPurchaseOrders();
        setPurchaseOrders(ordersResponse.data.purchase_orders || []);
        
        setError(null);
      } catch (err) {
        if (err.response?.status === 403) {
          setError(err.response.data?.message || err.response.data?.error || 'Access denied');
        } else {
          setError('Failed to fetch supplier bills. Please try again later.');
        }
        console.error('Error fetching supplier bills:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addDaysToDate = (dateString, days) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const calculateBillStatus = (orderStatus) => {
    if (orderStatus === 'received') return 'paid';
    if (orderStatus === 'partially_received') return 'partial';
    if (['confirmed', 'shipped'].includes(orderStatus)) return 'pending';
    return 'pending';
  };

  const handleAdd = () => {
    setCurrentBill(null);
    setBillData({
      bill_number: generateBillNumber(),
      supplier_id: '',
      purchase_order_id: '',
      bill_date: new Date().toISOString().split('T')[0],
      due_date: addDaysToDate(new Date().toISOString().split('T')[0], 30),
      subtotal: 0,
      tax_amount: 0,
      discount_amount: 0,
      shipping_cost: 0,
      total_amount: 0,
      status: 'pending',
      notes: ''
    });
    setShowModal(true);
  };

  const generateBillNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `BILL-${year}${month}${day}-${randomNum}`;
  };

  const handleEdit = (bill) => {
    setCurrentBill(bill);
    setBillData({
      bill_number: bill.bill_number,
      supplier_id: bill.supplier_id || '',
      purchase_order_id: bill.purchase_order_id || '',
      bill_date: bill.bill_date || new Date().toISOString().split('T')[0],
      due_date: bill.due_date || addDaysToDate(new Date().toISOString().split('T')[0], 30),
      subtotal: bill.subtotal || 0,
      tax_amount: bill.tax_amount || 0,
      discount_amount: bill.discount_amount || 0,
      shipping_cost: bill.shipping_cost || 0,
      total_amount: bill.total_amount || 0,
      status: bill.status || 'pending',
      notes: bill.notes || ''
    });
    setShowModal(true);
  };

  const handleBillDataChange = (field, value) => {
    setBillData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (currentBill) {
        // Update existing bill
        await supplierBillsAPI.updateSupplierBill(currentBill.id, billData);
        toast.success('Bill updated successfully');
      } else {
        // Create new bill
        await supplierBillsAPI.createSupplierBill(billData);
        toast.success('Bill created successfully');
      }
      
      // Refresh the list
      const billsResponse = await supplierBillsAPI.getSupplierBills();
      setBills(billsResponse.data.supplier_bills || []);
      
      setShowModal(false);
      setCurrentBill(null);
    } catch (err) {
      setError('Failed to save supplier bill. Please try again.');
      toast.error(err.response?.data?.error || 'Failed to save supplier bill. Please try again.');
      console.error('Error saving supplier bill:', err);
    }
  };

  const getStatusVariant = (status) => {
    switch(status) {
      case 'paid': return 'success';
      case 'partial': return 'warning';
      case 'pending': return 'info';
      case 'overdue': return 'danger';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const handleExport = async () => {
    try {
      const response = await supplierBillsAPI.exportSupplierBills();
      // Create a download link for the exported file
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `supplier_bills_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      
      toast.success('Supplier bills export downloaded successfully');
    } catch (err) {
      toast.error('Failed to export supplier bills. Please try again.');
      console.error('Error exporting supplier bills:', err);
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
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h1>Supplier Bills</h1>
          <p className="text-muted mb-0">Manage and track bills from suppliers.</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Button variant="outline-secondary" onClick={handleExport}>
            <FiDownload className="me-2" /> Export
          </Button>
          <Button variant="primary" onClick={handleAdd}>
            <FiPlus className="me-2" /> Create Bill
          </Button>
        </div>
      </div>
      
      <Row>
        <Col lg={12}>
          <Card>
            <Card.Header>
              <h5>Supplier Bills</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Bill Number</th>
                      <th>Supplier</th>
                      <th>PO Number</th>
                      <th>Bill Date</th>
                      <th>Due Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map(bill => {
                      // Find supplier name based on supplier_id
                      const supplier = suppliers.find(s => s.id === bill.supplier_id);
                      const supplierName = supplier ? supplier.company_name : 'Unknown Supplier';
                      
                      // Find purchase order number based on purchase_order_id
                      const purchaseOrder = purchaseOrders.find(po => po.id === bill.purchase_order_id);
                      const poNumber = purchaseOrder ? (purchaseOrder.order_id || purchaseOrder.id) : bill.purchase_order_number || 'N/A';
                      
                      return (
                        <tr key={bill.id}>
                          <td>{bill.bill_number}</td>
                          <td>{supplierName}</td>
                          <td>{poNumber}</td>
                          <td>{bill.bill_date ? new Date(bill.bill_date).toLocaleDateString() : 'N/A'}</td>
                          <td>{bill.due_date ? new Date(bill.due_date).toLocaleDateString() : 'N/A'}</td>
                          <td>{formatCurrency(bill.total_amount)}</td>
                          <td>
                            <Badge bg={getStatusVariant(bill.status)}>
                              {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                            </Badge>
                          </td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              className="me-2"
                              onClick={() => handleEdit(bill)}
                            >
                              <FiEdit2 className="me-1" /> Edit
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Bill Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {currentBill ? `Edit Bill: ${currentBill.bill_number}` : 'Create New Bill'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bill Number</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={billData.bill_number}
                    onChange={(e) => handleBillDataChange('bill_number', e.target.value)}
                    placeholder="BILL-YYYYMMDD-XXXX"
                    disabled={!!currentBill}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select 
                    value={billData.status}
                    onChange={(e) => handleBillDataChange('status', e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partial Payment</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Supplier</Form.Label>
                  <Form.Select 
                    value={billData.supplier_id}
                    onChange={(e) => handleBillDataChange('supplier_id', e.target.value)}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.company_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Purchase Order</Form.Label>
                  <Form.Select 
                    value={billData.purchase_order_id}
                    onChange={(e) => handleBillDataChange('purchase_order_id', e.target.value)}
                  >
                    <option value="">Select Purchase Order</option>
                    {purchaseOrders.map(order => (
                      <option key={order.id} value={order.id}>
                        {order.order_id || order.id}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bill Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    value={billData.bill_date}
                    onChange={(e) => handleBillDataChange('bill_date', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Due Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    value={billData.due_date}
                    onChange={(e) => handleBillDataChange('due_date', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Subtotal</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01"
                    value={billData.subtotal}
                    onChange={(e) => handleBillDataChange('subtotal', parseFloat(e.target.value) || 0)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tax Amount</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01"
                    value={billData.tax_amount}
                    onChange={(e) => handleBillDataChange('tax_amount', parseFloat(e.target.value) || 0)}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Amount</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01"
                    value={billData.discount_amount}
                    onChange={(e) => handleBillDataChange('discount_amount', parseFloat(e.target.value) || 0)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Shipping Cost</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01"
                    value={billData.shipping_cost}
                    onChange={(e) => handleBillDataChange('shipping_cost', parseFloat(e.target.value) || 0)}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Amount</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01"
                    value={billData.total_amount}
                    onChange={(e) => handleBillDataChange('total_amount', parseFloat(e.target.value) || 0)}
                    disabled
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                value={billData.notes}
                onChange={(e) => handleBillDataChange('notes', e.target.value)}
                placeholder="Enter any special instructions or notes"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {currentBill ? 'Update Bill' : 'Create Bill'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SupplierBills;
