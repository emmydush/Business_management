import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, ListGroup } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiEdit2, FiTrash2, FiEye, FiDownload, FiRotateCcw, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { returnsAPI, salesAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';

const Returns = () => {
    const [returns, setReturns] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentReturn, setCurrentReturn] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [salesOrderSearch, setSalesOrderSearch] = useState('');
    const [salesOrders, setSalesOrders] = useState([]);
    const [showOrderDropdown, setShowOrderDropdown] = useState(false);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState('');
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    const { formatCurrency } = useCurrency();

    useEffect(() => {
        fetchReturns();
    }, []);

    const loadAllOrders = async () => {
        try {
            setIsLoadingOrders(true);
            const response = await salesAPI.getOrders({
                limit: 20
            });
            const orders = response.data.orders || [];
            console.log('Loaded all orders:', orders); // Debug log
            setSalesOrders(orders);
            setShowOrderDropdown(orders.length > 0);
        } catch (err) {
            console.error('Error loading orders:', err);
            setSalesOrders([]);
            setShowOrderDropdown(false);
        } finally {
            setIsLoadingOrders(false);
        }
    };

    const searchSalesOrders = useCallback(async () => {
        console.log('Searching for:', salesOrderSearch); // Debug log
        try {
            setIsLoadingOrders(true);
            const response = await salesAPI.getOrders({
                search: salesOrderSearch,
                limit: 10
            });
            const orders = response.data.orders || [];
            console.log('Found orders:', orders); // Debug log
            setSalesOrders(orders);
            setShowOrderDropdown(orders.length > 0);
        } catch (err) {
            console.error('Error searching sales orders:', err);
            setSalesOrders([]);
            setShowOrderDropdown(false);
        } finally {
            setIsLoadingOrders(false);
        }
    }, [salesOrderSearch]);

    useEffect(() => {
        if (salesOrderSearch.length > 1) {
            searchSalesOrders();
        } else {
            setSalesOrders([]);
            setShowOrderDropdown(false);
        }
    }, [salesOrderSearch, searchSalesOrders]);

    const handleSalesOrderSelect = (order) => {
        console.log('Selected order:', order); // Debug log
        setSalesOrderSearch(`${order.order_id} - ${order.customer_name || (order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'Unknown Customer')}`);
        setShowOrderDropdown(false);
        
        // Use React state to populate form fields
        const customerName = order.customer_name || 
            (order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'Unknown Customer');
        setSelectedCustomer(customerName);
        setSelectedOrderId(order.id); // Store the order ID
        if (order.invoice_id) {
            setSelectedInvoice(order.invoice_id);
        }
    };

    const fetchReturns = async () => {
        try {
            setLoading(true);
            const response = await returnsAPI.getReturns();
            setReturns(response.data.returns || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching returns:', err);
            setError('Failed to load returns.');
        } finally {
            setLoading(false);
        }
    };

    const handleView = (ret) => {
        setCurrentReturn(ret);
        setShowModal(true);
    };

    const handleEdit = (ret) => {
        setCurrentReturn(ret);
        // Pre-populate form fields with existing return data
        setSelectedCustomer(ret.customer || '');
        setSelectedInvoice(ret.invoiceId || '');
        setSelectedOrderId(ret.order_id || null);
        setSalesOrderSearch(ret.order_id ? `${ret.order_id} - ${ret.customer}` : '');
        setShowModal(true);
    };

    const handleDelete = (id) => {
        toast((t) => (
            <span>
                Delete return record?
                <div className="mt-2 d-flex gap-2">
                    <Button size="sm" variant="danger" onClick={async () => {
                        try {
                            await returnsAPI.deleteReturn(id); // Assuming there's a delete endpoint
                            setReturns(returns.filter(r => r.id !== id));
                            toast.dismiss(t.id);
                            toast.success('Return record deleted');
                        } catch (err) {
                            toast.dismiss(t.id);
                            toast.error('Failed to delete return');
                            console.error('Error deleting return:', err);
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

    const handleSave = async (e) => {
        e.preventDefault();
        
        console.log('=== Starting Return Save Process ==='); // Debug log
        
        if (!selectedOrderId) {
            console.log('No order selected'); // Debug log
            toast.error('Please select a sales order first');
            return;
        }

        const formData = new FormData(e.target);
        const refundAmount = parseFloat(formData.get('refund_amount')) || 0;
        
        console.log('Selected order ID:', selectedOrderId); // Debug log
        
        // Find the selected order to get its items
        const selectedOrder = salesOrders.find(order => order.id === selectedOrderId);
        if (!selectedOrder) {
            console.log('Selected order not found in salesOrders:', salesOrders); // Debug log
            toast.error('Selected order not found');
            return;
        }

        console.log('Selected order details:', selectedOrder); // Debug log

        // Use the first item from the order for the return
        const firstOrderItem = selectedOrder.items && selectedOrder.items[0];
        if (!firstOrderItem) {
            console.log('No items found in selected order'); // Debug log
            toast.error('No items found in the selected order');
            return;
        }

        console.log('First order item:', firstOrderItem); // Debug log

        // Get customer ID - handle both registered customers and walk-in customers
        let customerId = selectedOrder.customer?.id || selectedOrder.customer_id;
        
        // For walk-in customers, we'll send null as customer_id
        if (!customerId) {
            customerId = null;
        }

        // Create return data with valid product_id from the order
        const returnData = {
            order_id: selectedOrderId,
            ...(customerId && { customer_id: customerId }), // Only include customer_id if it exists
            return_date: formData.get('return_date') ? new Date(formData.get('return_date')).toISOString().split('T')[0] : null,
            status: formData.get('status'),
            reason: formData.get('reason'),
            refund_amount: refundAmount,
            total_amount: refundAmount,
            notes: formData.get('notes'),
            items: [
                {
                    product_id: firstOrderItem.product_id,
                    quantity: 1,
                    unit_price: refundAmount,
                    reason: formData.get('reason')
                }
            ]
        };

        console.log('=== Return Data Prepared ==='); // Debug log
        console.log('Customer ID:', customerId); // Debug log
        console.log('Sending return data:', returnData); // Debug log

        setIsSaving(true);
        try {
            console.log('=== Sending API Request ==='); // Debug log
            if (currentReturn) {
                // Update existing return
                await returnsAPI.updateReturn(currentReturn.id, returnData);
                toast.success('Return updated successfully!');
            } else {
                // Create new return
                const response = await returnsAPI.createReturn(returnData);
                console.log('API Response:', response); // Debug log
                toast.success('Return initiated successfully!');
            }
            fetchReturns(); // Refresh the list
            handleClose();
        } catch (err) {
            console.log('=== API Error ==='); // Debug log
            console.error('Full error object:', err); // Debug log
            console.error('Error response:', err.response); // Debug log
            console.error('Error response data:', err.response?.data); // Debug log
            const errorMessage = err.response?.data?.error || err.message || 'Failed to save return. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setCurrentReturn(null);
        setSalesOrderSearch('');
        setSalesOrders([]);
        setShowOrderDropdown(false);
        setSelectedCustomer('');
        setSelectedInvoice('');
        setSelectedOrderId(null);
    };

    const filteredReturns = returns.filter(ret =>
        (ret.returnId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ret.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ret.invoiceId || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status) => {
        const s = (status || '').toLowerCase();
        switch (s) {
            case 'processed':
            case 'completed': return <Badge bg="success" className="fw-normal">Processed</Badge>;
            case 'pending': return <Badge bg="warning" text="dark" className="fw-normal">Pending</Badge>;
            case 'approved':
            case 'processing': return <Badge bg="primary" className="fw-normal">Approved</Badge>;
            case 'rejected': return <Badge bg="danger" className="fw-normal">Rejected</Badge>;
            default: return <Badge bg="secondary" className="fw-normal">{status}</Badge>;
        }
    };

    const handleExport = async () => {
        try {
            // Assuming there's an export endpoint
            toast.success('Exporting returns...');
            console.log('Exporting returns');
        } catch (err) {
            toast.error('Failed to export returns. Please try again.');
            console.error('Error exporting returns:', err);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-5">
                <div className="container"><div className="alert alert-danger">{error}</div></div>
            </div>
        );
    }

    return (
        <div className="returns-wrapper">
            {/* Header Section */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Sales Returns</h2>
                    <p className="text-muted mb-0">Manage product returns and credit notes.</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-secondary" className="d-flex align-items-center" onClick={handleExport}>
                        <FiDownload className="me-2" /> Export
                    </Button>
                    <Button variant="primary" className="d-flex align-items-center" onClick={() => {
                        setCurrentReturn(null);
                        setSalesOrderSearch('');
                        setSalesOrders([]);
                        setShowOrderDropdown(false);
                        setSelectedCustomer('');
                        setSelectedInvoice('');
                        setSelectedOrderId(null);
                        setShowModal(true);
                    }}>
                        <FiPlus className="me-2" /> Initiate Return
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <Row className="g-4 mb-4">
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                                    <FiRotateCcw className="text-primary" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Total Returns</span>
                            </div>
                            <h3 className="fw-bold mb-0">{returns.length}</h3>
                            <small className="text-muted">This month</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                                    <FiRotateCcw className="text-warning" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Pending Processing</span>
                            </div>
                            <h3 className="fw-bold mb-0">{returns.filter(r => ['pending', 'approved', 'processing'].includes((r.status || '').toLowerCase())).length}</h3>
                            <small className="text-muted">Awaiting action</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                                    <FiCheckCircle className="text-success" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Refunded Amount</span>
                            </div>
                            <h3 className="fw-bold mb-0">{formatCurrency(returns.filter(r => ['processed', 'completed'].includes((r.status || '').toLowerCase())).reduce((acc, curr) => acc + (curr.amount || curr.total_amount || 0), 0))}</h3>
                            <small className="text-muted">Total value returned</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-danger bg-opacity-10 p-2 rounded me-3">
                                    <FiXCircle className="text-danger" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Return Rate</span>
                            </div>
                            <h3 className="fw-bold mb-0">{((returns.filter(r => r.status === 'completed').length / (returns.length || 1)) * 100).toFixed(1)}%</h3>
                            <small className="text-muted">Of total sales</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Main Content Card */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <div className="p-3 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '400px' }}>
                            <InputGroup>
                                <InputGroup.Text className="bg-light border-end-0">
                                    <FiSearch className="text-muted" />
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Search by Return ID, Customer or Invoice..."
                                    className="bg-light border-start-0 ps-0"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </div>
                        <div className="d-flex gap-2">
                            <Button variant="outline-secondary" className="d-flex align-items-center">
                                <FiFilter className="me-2" /> Filter
                            </Button>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0 py-3 ps-4">Return ID</th>
                                    <th className="border-0 py-3">Customer</th>
                                    <th className="border-0 py-3">Invoice Ref</th>
                                    <th className="border-0 py-3">Date</th>
                                    <th className="border-0 py-3">Reason</th>
                                    <th className="border-0 py-3">Amount</th>
                                    <th className="border-0 py-3">Status</th>
                                    <th className="border-0 py-3 text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReturns.map(ret => (
                                    <tr key={ret.id}>
                                        <td className="ps-4">
                                            <div className="fw-bold text-primary">{ret.returnId}</div>
                                        </td>
                                        <td>
                                            <div className="fw-medium text-dark">{ret.customer}</div>
                                        </td>
                                        <td>
                                            <div className="text-muted small">{ret.invoiceId}</div>
                                        </td>
                                        <td>
                                            <div className="text-muted small">{ret.date}</div>
                                        </td>
                                        <td>
                                            <div className="text-muted small text-truncate" style={{ maxWidth: '150px' }}>{ret.reason}</div>
                                        </td>
                                        <td>
                                            <div className="fw-bold text-dark">{formatCurrency(ret.amount || ret.total_amount || 0)}</div>
                                        </td>
                                        <td>
                                            {getStatusBadge(ret.status)}
                                        </td>
                                        <td className="text-end pe-4">
                                            <div className="d-flex gap-2 justify-content-end">
                                                <Button variant="outline-primary" size="sm" className="d-flex align-items-center" onClick={() => handleView(ret)} title="View Details">
                                                    <FiEye size={16} />
                                                </Button>
                                                <Button variant="outline-warning" size="sm" className="d-flex align-items-center" onClick={() => handleEdit(ret)} title="Edit Record">
                                                    <FiEdit2 size={16} />
                                                </Button>
                                                <Button variant="outline-danger" size="sm" className="d-flex align-items-center" onClick={() => handleDelete(ret.id)} title="Delete Record">
                                                    <FiTrash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Return Modal */}
            <Modal show={showModal} onHide={handleClose} centered size="lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">{currentReturn ? `Return Record: ${currentReturn.returnId}` : 'Initiate New Return'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-4">
                    <Form id="returnForm" onSubmit={handleSave}>
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Search Sales Order / Invoice</Form.Label>
                                    <div className="position-relative">
                                        <Form.Control
                                            type="text"
                                            placeholder="Type order ID, customer name, or invoice number..."
                                            value={salesOrderSearch}
                                            onChange={(e) => setSalesOrderSearch(e.target.value)}
                                            onFocus={() => salesOrders.length > 0 && setShowOrderDropdown(true)}
                                        />
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            className="position-absolute end-0 top-50 translate-middle-y me-1"
                                            onClick={loadAllOrders}
                                            disabled={isLoadingOrders}
                                        >
                                            {isLoadingOrders ? '...' : 'Show All'}
                                        </Button>
                                        {isLoadingOrders && (
                                            <div className="position-absolute end-0 top-50 translate-middle-y me-16">
                                                <div className="spinner-border spinner-border-sm" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                            </div>
                                        )}
                                        {showOrderDropdown && salesOrders.length > 0 && (
                                            <div className="position-absolute w-100 bg-white border rounded shadow-lg mt-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                                                <ListGroup className="mb-0">
                                                    {salesOrders.map((order) => (
                                                        <ListGroup.Item
                                                            key={order.id}
                                                            action
                                                            onClick={() => handleSalesOrderSelect(order)}
                                                            className="py-2"
                                                        >
                                                            <div className="fw-bold">{order.order_id}</div>
                                                            <div className="text-muted small">
                                                                {order.customer_name || (order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'Unknown Customer')}
                                                            </div>
                                                            {order.invoice_id && (
                                                                <div className="text-primary small">Invoice: {order.invoice_id}</div>
                                                            )}
                                                        </ListGroup.Item>
                                                    ))}
                                                </ListGroup>
                                            </div>
                                        )}
                                    </div>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Customer</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="customer_id" 
                                        value={selectedCustomer || (currentReturn?.customer || currentReturn?.customer_id) || ''}
                                        onChange={(e) => setSelectedCustomer(e.target.value)}
                                        placeholder="Select customer" 
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Invoice Reference</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="invoice_id" 
                                        value={selectedInvoice || (currentReturn?.invoiceId || currentReturn?.invoice_id) || ''}
                                        onChange={(e) => setSelectedInvoice(e.target.value)}
                                        placeholder="INV-XXXXX" 
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Return Date</Form.Label>
                                    <Form.Control type="date" name="return_date" defaultValue={currentReturn?.date || currentReturn?.return_date || new Date().toISOString().split('T')[0]} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Status</Form.Label>
                                    <Form.Select name="status" defaultValue={currentReturn?.status || 'pending'}>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="processed">Processed</option>
                                        <option value="rejected">Rejected</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Reason for Return</Form.Label>
                                    <Form.Control as="textarea" rows={2} name="reason" defaultValue={currentReturn?.reason} placeholder="Explain why the item is being returned..." required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Refund Amount</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text></InputGroup.Text>
                                        <Form.Control type="number" step="0.01" name="refund_amount" defaultValue={currentReturn?.amount || currentReturn?.refund_amount} required />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button variant="light" onClick={handleClose} className="px-4">Close</Button>
                            <Button variant="primary" type="submit" className="px-4" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Return'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Returns;
