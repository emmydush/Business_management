import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge } from 'react-bootstrap';
import { FiFileText, FiPlus, FiDownload, FiSearch, FiPrinter, FiEye, FiEdit2, FiTrash2, FiFilter, FiSend } from 'react-icons/fi';
import PermissionGuard from '../components/PermissionGuard';
import toast from 'react-hot-toast';
import { invoicesAPI, customersAPI, salesAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { INVOICE_STATUSES, INVOICE_STATUS_LABELS, PAYMENT_STATUSES, PAYMENT_STATUS_LABELS } from '../constants/statuses';
import SubscriptionGuard from '../components/SubscriptionGuard';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loadingForm, setLoadingForm] = useState(false);

    const { formatCurrency, currencySymbol } = useCurrency();

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchCustomersAndOrders = async () => {
        try {
            setLoadingForm(true);

            // Fetch customers
            const customersResponse = await customersAPI.getCustomers();
            setCustomers(customersResponse.data.customers || []);

            // Fetch orders
            const ordersResponse = await salesAPI.getOrders();
            setOrders(ordersResponse.data.orders || []);
        } catch (err) {
            console.error('Error fetching customers and orders:', err);
            toast.error('Failed to load customers and orders');
        } finally {
            setLoadingForm(false);
        }
    };

    const fetchInvoices = async () => {
        try {
            const response = await invoicesAPI.getInvoices();
            setInvoices(response.data.invoices || []);
        } catch (err) {
            console.error('Error fetching invoices:', err);
            // Set mock data as fallback with dynamic dates
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            setInvoices([
                { id: 1, invoiceId: `${currentYear}-001`, customer: 'Demo Customer', date: `${currentYear}-${currentMonth}-${day}`, dueDate: `${currentYear}-${currentMonth}-30`, amount: 1250.00, status: INVOICE_STATUSES.PAID, orderId: `${currentYear}-001` }
            ]);
        }
    };

    const handleViewDetails = async (invoice) => {
        try {
            // Fetch detailed invoice with items
            const response = await invoicesAPI.getInvoice(invoice.id);
            const detailedInvoice = response.data.invoice;
            
            // If we have order_id, fetch the order to get items
            if (detailedInvoice.order_id && !detailedInvoice.items) {
                try {
                    const orderResponse = await salesAPI.getOrder(detailedInvoice.order_id);
                    const order = orderResponse.data.order || orderResponse.data;
                    detailedInvoice.items = order.items || [];
                } catch (orderErr) {
                    console.error('Error fetching order details:', orderErr);
                    detailedInvoice.items = [];
                }
            }
            
            setCurrentInvoice(detailedInvoice);
            setShowViewModal(true);
        } catch (err) {
            console.error('Error fetching invoice details:', err);
            setCurrentInvoice(invoice);
            setShowViewModal(true);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleCreate = async () => {
        setCurrentInvoice(null);
        await fetchCustomersAndOrders();
        setShowModal(true);
    };

    const handleEdit = async (invoice) => {
        setCurrentInvoice(invoice);
        await fetchCustomersAndOrders();
        setShowModal(true);
    };

    const handleDelete = (id) => {
        toast((t) => (
            <span>
                Delete invoice?
                <div className="mt-2 d-flex gap-2">
                    <Button size="sm" variant="danger" onClick={async () => {
                        try {
                            await invoicesAPI.deleteInvoice(id);
                            setInvoices(invoices.filter(inv => inv.id !== id));
                            toast.dismiss(t.id);
                            toast.success('Invoice deleted');
                        } catch (err) {
                            toast.dismiss(t.id);
                            toast.error('Failed to delete invoice');
                            console.error('Error deleting invoice:', err);
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
        const formData = new FormData(e.target);

        const customerId = formData.get('customer_id');
        const orderId = formData.get('order_id');
        const totalAmountRaw = formData.get('total_amount');
        if (!customerId || customerId === '') {
            toast.error('Customer is required');
            return;
        }
        if (!orderId || orderId === '') {
            toast.error('Order is required');
            return;
        }
        if (!totalAmountRaw || isNaN(parseFloat(totalAmountRaw))) {
            toast.error('A valid total amount is required');
            return;
        }

        const issueDateRaw = formData.get('issue_date');
        let dueDateRaw = formData.get('due_date');
        if (!dueDateRaw) {
            const issue = issueDateRaw ? new Date(issueDateRaw) : new Date();
            const due = new Date(issue.getTime() + (30 * 24 * 60 * 60 * 1000));
            dueDateRaw = due.toISOString().split('T')[0];
        }

        const totalAmount = parseFloat(totalAmountRaw);
        const invoiceData = {
            customer_id: parseInt(customerId),
            order_id: parseInt(orderId),
            issue_date: issueDateRaw || new Date().toISOString().split('T')[0],
            due_date: dueDateRaw,
            status: formData.get('status'),
            total_amount: totalAmount,
            subtotal: totalAmount * 0.9,
            tax_amount: totalAmount * 0.1,
            notes: formData.get('notes')
        };

        setIsSaving(true);
        try {
            if (currentInvoice) {
                await invoicesAPI.updateInvoice(currentInvoice.id, invoiceData);
                toast.success('Invoice updated successfully!');
            } else {
                await invoicesAPI.createInvoice(invoiceData);
                toast.success('Invoice created successfully!');
            }
            fetchInvoices();
            handleClose();
        } catch (err) {
            const serverMsg = err?.response?.data?.error || err?.message || 'Failed to save invoice. Please try again.';
            toast.error(serverMsg);
            console.error('Error saving invoice:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setCurrentInvoice(null);
    };

    const filteredInvoices = invoices.filter(invoice => {
        const customerName = invoice.customer ? 
            `${invoice.customer.first_name || ''} ${invoice.customer.last_name || ''}`.toLowerCase() :
            (invoice.customer_name || '').toLowerCase();

        return (invoice.invoice_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            customerName.includes(searchTerm.toLowerCase());
    });

    const getStatusBadge = (status) => {
        // Handle invoice statuses
        if (Object.values(INVOICE_STATUSES).includes(status)) {
            switch (status) {
                case INVOICE_STATUSES.PAID: 
                    return <Badge bg="success" className="fw-normal">{INVOICE_STATUS_LABELS[INVOICE_STATUSES.PAID]}</Badge>;
                case INVOICE_STATUSES.UNPAID: 
                    return <Badge bg="warning" text="dark" className="fw-normal">{INVOICE_STATUS_LABELS[INVOICE_STATUSES.UNPAID]}</Badge>;
                case INVOICE_STATUSES.OVERDUE: 
                    return <Badge bg="danger" className="fw-normal">{INVOICE_STATUS_LABELS[INVOICE_STATUSES.OVERDUE]}</Badge>;
                case INVOICE_STATUSES.PARTIALLY_PAID: 
                    return <Badge bg="info" className="fw-normal">{INVOICE_STATUS_LABELS[INVOICE_STATUSES.PARTIALLY_PAID]}</Badge>;
                case INVOICE_STATUSES.DRAFT:
                    return <Badge bg="secondary" className="fw-normal">{INVOICE_STATUS_LABELS[INVOICE_STATUSES.DRAFT]}</Badge>;
                case INVOICE_STATUSES.SENT:
                    return <Badge bg="primary" className="fw-normal">{INVOICE_STATUS_LABELS[INVOICE_STATUSES.SENT]}</Badge>;
                case INVOICE_STATUSES.VIEWED:
                    return <Badge bg="light" text="dark" className="fw-normal">{INVOICE_STATUS_LABELS[INVOICE_STATUSES.VIEWED]}</Badge>;
                case INVOICE_STATUSES.CANCELLED:
                    return <Badge bg="dark" className="fw-normal">{INVOICE_STATUS_LABELS[INVOICE_STATUSES.CANCELLED]}</Badge>;
                default: 
                    return <Badge bg="secondary" className="fw-normal">{status}</Badge>;
            }
        }
        
        // Handle payment statuses
        if (Object.values(PAYMENT_STATUSES).includes(status)) {
            switch (status) {
                case PAYMENT_STATUSES.PAID: 
                    return <Badge bg="success" className="fw-normal">{PAYMENT_STATUS_LABELS[PAYMENT_STATUSES.PAID]}</Badge>;
                case PAYMENT_STATUSES.UNPAID: 
                    return <Badge bg="warning" text="dark" className="fw-normal">{PAYMENT_STATUS_LABELS[PAYMENT_STATUSES.UNPAID]}</Badge>;
                case PAYMENT_STATUSES.PARTIAL: 
                    return <Badge bg="info" className="fw-normal">{PAYMENT_STATUS_LABELS[PAYMENT_STATUSES.PARTIAL]}</Badge>;
                case PAYMENT_STATUSES.PENDING: 
                    return <Badge bg="secondary" className="fw-normal">{PAYMENT_STATUS_LABELS[PAYMENT_STATUSES.PENDING]}</Badge>;
                case PAYMENT_STATUSES.FAILED: 
                    return <Badge bg="danger" className="fw-normal">{PAYMENT_STATUS_LABELS[PAYMENT_STATUSES.FAILED]}</Badge>;
                case PAYMENT_STATUSES.REFUNDED: 
                    return <Badge bg="primary" className="fw-normal">{PAYMENT_STATUS_LABELS[PAYMENT_STATUSES.REFUNDED]}</Badge>;
                case PAYMENT_STATUSES.OVERDUE: 
                    return <Badge bg="danger" className="fw-normal">{PAYMENT_STATUS_LABELS[PAYMENT_STATUSES.OVERDUE]}</Badge>;
                case PAYMENT_STATUSES.CANCELLED: 
                    return <Badge bg="dark" className="fw-normal">{PAYMENT_STATUS_LABELS[PAYMENT_STATUSES.CANCELLED]}</Badge>;
                default: 
                    return <Badge bg="secondary" className="fw-normal">{status}</Badge>;
            }
        }
        
        // Default case
        return <Badge bg="secondary" className="fw-normal">{status}</Badge>;
    };

    const handleExport = async () => {
        try {
            toast.success('Exporting invoices...');
            console.log('Exporting invoices');
        } catch (err) {
            toast.error('Failed to export invoices. Please try again.');
            console.error('Error exporting invoices:', err);
        }
    };

    const [showViewModal, setShowViewModal] = useState(false);

    // ...

    return (
        <div className="invoices-wrapper">
            {/* Header Section */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Invoices</h2>
                    <p className="text-muted mb-0">Manage customer billing and payment tracking.</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <PermissionGuard module="invoices" action="export">
                        <Button variant="outline-secondary" className="d-flex align-items-center" onClick={handleExport}>
                            <FiDownload className="me-2" /> Export
                        </Button>
                    </PermissionGuard>
                    <SubscriptionGuard message="Renew your subscription to create invoices">
                        <PermissionGuard module="invoices" action="create">
                            <Button variant="primary" className="d-flex align-items-center" onClick={handleCreate}>
                                <FiPlus className="me-2" /> Create Invoice
                            </Button>
                        </PermissionGuard>
                    </SubscriptionGuard>
                </div>
            </div>

            {/* Add Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .invoice-view-modal, .invoice-view-modal * {
                        visibility: visible;
                    }
                    .invoice-view-modal {
                        position: fixed;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        background: white;
                        z-index: 9999;
                        padding: 20px;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Stats Cards - Responsive for Mobile */}
            <Row className="g-3 g-md-4 mb-4">
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100 card-responsive">
                        <Card.Body className="p-3 p-md-4">
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-primary bg-opacity-10 p-2 rounded me-2 me-md-3">
                                    <FiFileText className="text-primary" size={20} />
                                </div>
                                <span className="text-muted fw-medium small small-md">Total Invoiced</span>
                            </div>
                            <h3 className="fw-bold mb-0 h5 h4-md">{formatCurrency(invoices.reduce((acc, curr) => acc + (curr.amount || curr.total_amount || 0), 0))}</h3>
                            <small className="text-muted d-none d-md-block">Across {invoices.length} invoices</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100 card-responsive">
                        <Card.Body className="p-3 p-md-4">
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-success bg-opacity-10 p-2 rounded me-2 me-md-3">
                                    <FiFileText className="text-success" size={20} />
                                </div>
                                <span className="text-muted fw-medium small small-md">Paid Amount</span>
                            </div>
                            <h3 className="fw-bold mb-0 h5 h4-md">{formatCurrency(invoices.filter(i => i.status === INVOICE_STATUSES.PAID).reduce((acc, curr) => acc + (curr.amount || curr.total_amount || 0), 0))}</h3>
                            <small className="text-success fw-medium d-none d-md-block">75% collection rate</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100 card-responsive">
                        <Card.Body className="p-3 p-md-4">
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-warning bg-opacity-10 p-2 rounded me-2 me-md-3">
                                    <FiFileText className="text-warning" size={20} />
                                </div>
                                <span className="text-muted fw-medium small small-md">Pending</span>
                            </div>
                            <h3 className="fw-bold mb-0 h5 h4-md">{formatCurrency(invoices.filter(i => i.status === 'unpaid' || i.status === 'partially_paid').reduce((acc, curr) => acc + (curr.amount || curr.total_amount || 0), 0))}</h3>
                            <small className="text-muted d-none d-md-block">Awaiting payment</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100 card-responsive">
                        <Card.Body className="p-3 p-md-4">
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-danger bg-opacity-10 p-2 rounded me-2 me-md-3">
                                    <FiFileText className="text-danger" size={20} />
                                </div>
                                <span className="text-muted fw-medium small small-md">{INVOICE_STATUS_LABELS[INVOICE_STATUSES.OVERDUE]}</span>
                            </div>
                            <h3 className="fw-bold mb-0 h5 h4-md">{formatCurrency(invoices.filter(i => i.status === INVOICE_STATUSES.OVERDUE).reduce((acc, curr) => acc + (curr.amount || curr.total_amount || 0), 0))}</h3>
                            <small className="text-danger fw-medium d-none d-md-block">Requires attention</small>
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
                                    placeholder="Search by Invoice ID or Customer..."
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

                    <div className="table-responsive" style={{ minHeight: '400px' }}>
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0 py-3 ps-4">Invoice ID</th>
                                    <th className="border-0 py-3">Customer</th>
                                    <th className="border-0 py-3">Date</th>
                                    <th className="border-0 py-3">Due Date</th>
                                    <th className="border-0 py-3">Amount</th>
                                    <th className="border-0 py-3">Status</th>
                                    <th className="border-0 py-3 text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.map(invoice => (
                                    <tr key={invoice.id}>
                                        <td className="ps-4">
                                            <div className="fw-bold text-primary">{invoice.invoice_id}</div>
                                            <div className="small text-muted">Ref: {invoice.order_id}</div>
                                        </td>
                                        <td>
                                            <div className="fw-medium text-dark">
                                                {invoice.customer ? (
                                                    `${invoice.customer.first_name || ''} ${invoice.customer.last_name || ''}`.trim() || 'N/A'
                                                ) : (
                                                    invoice.customer_name || 'Walk-in Customer'
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-muted small">{invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : 'N/A'}</div>
                                        </td>
                                        <td>
                                            <div className="text-muted small">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</div>
                                        </td>
                                        <td>
                                            <div className="fw-bold text-dark">{formatCurrency(invoice.amount || invoice.total_amount || 0)}</div>
                                        </td>
                                        <td>
                                            {getStatusBadge(invoice.status)}
                                        </td>
                                        <td className="text-end pe-4">
                                            <div className="d-flex gap-2 justify-content-end">
                                                <Button variant="outline-primary" size="sm" className="d-flex align-items-center" onClick={() => handleViewDetails(invoice)} title="View Details">
                                                    <FiEye size={16} />
                                                </Button>
                                                <Button variant="outline-secondary" size="sm" className="d-flex align-items-center" onClick={() => { setCurrentInvoice(invoice); setShowViewModal(true); setTimeout(handlePrint, 500); }} title="Print">
                                                    <FiPrinter size={16} />
                                                </Button>
                                                <Button variant="outline-secondary" size="sm" className="d-flex align-items-center" onClick={() => toast.success('Emailing invoice...')} title="Send to Customer">
                                                    <FiSend size={16} />
                                                </Button>
                                                <Button variant="outline-warning" size="sm" className="d-flex align-items-center" onClick={() => handleEdit(invoice)} title="Edit">
                                                    <FiEdit2 size={16} />
                                                </Button>
                                                <Button variant="outline-danger" size="sm" className="d-flex align-items-center" onClick={() => handleDelete(invoice.id)} title="Delete">
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

            {/* Edit/Create Modal (Existing) */}
            <Modal show={showModal} onHide={handleClose} centered size="lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">{currentInvoice ? `Invoice: ${currentInvoice.invoiceId}` : 'Create New Invoice'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-4">
                    <Form onSubmit={handleSave}>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Customer</Form.Label>
                                    {loadingForm ? (
                                        <Form.Control type="text" placeholder="Loading customers..." disabled />
                                    ) : (
                                        <Form.Select name="customer_id" defaultValue={currentInvoice?.customer_id || ''} required>
                                            <option value="">Select a customer</option>
                                            {customers.map(customer => (
                                                <option key={customer.id} value={customer.id}>
                                                    {customer.first_name} {customer.last_name} {customer.company_name ? `(${customer.company_name})` : ''}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Sale Ref</Form.Label>
                                    {loadingForm ? (
                                        <Form.Control type="text" placeholder="Loading orders..." disabled />
                                    ) : (
                                        <Form.Select name="order_id" defaultValue={currentInvoice?.order_id || ''}>
                                            <option value="">Select an order</option>
                                            {orders.map(order => (
                                                <option key={order.id} value={order.id}>
                                                    {order.order_id || `Order #${order.id}`}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Invoice Date</Form.Label>
                                    <Form.Control type="date" name="issue_date" defaultValue={currentInvoice?.issue_date || currentInvoice?.date || new Date().toISOString().split('T')[0]} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Due Date</Form.Label>
                                    <Form.Control type="date" name="due_date" defaultValue={currentInvoice?.due_date || currentInvoice?.dueDate} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Status</Form.Label>
                                    <Form.Select name="status" defaultValue={currentInvoice?.status}>
                                        <option value={INVOICE_STATUSES.UNPAID}>{INVOICE_STATUS_LABELS[INVOICE_STATUSES.UNPAID]}</option>
                                        <option value={INVOICE_STATUSES.PARTIALLY_PAID}>{INVOICE_STATUS_LABELS[INVOICE_STATUSES.PARTIALLY_PAID]}</option>
                                        <option value={INVOICE_STATUSES.PAID}>{INVOICE_STATUS_LABELS[INVOICE_STATUSES.PAID]}</option>
                                        <option value={INVOICE_STATUSES.OVERDUE}>{INVOICE_STATUS_LABELS[INVOICE_STATUSES.OVERDUE]}</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Total Amount</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>{currencySymbol}</InputGroup.Text>
                                        <Form.Control type="number" step="0.01" name="total_amount" defaultValue={currentInvoice?.total_amount || currentInvoice?.amount || ''} required />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button variant="light" onClick={handleClose} className="px-4">Close</Button>
                            <Button variant="primary" type="submit" className="px-4" disabled={isSaving || loadingForm}>
                                {isSaving || loadingForm ? 'Saving...' : 'Save Invoice'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* View/Print Modal - Supermarket Style */}
            <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg" className="invoice-view-modal-container">
                <Modal.Header closeButton className="border-0 pb-0 no-print">
                    <Modal.Title className="fw-bold">Invoice Details</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                    <div className="invoice-view-modal p-4" style={{ 
                        background: 'white', 
                        fontFamily: 'monospace', 
                        fontSize: '12px',
                        maxWidth: '400px',
                        margin: '0 auto'
                    }}>
                        {currentInvoice && (
                            <>
                                {/* Header */}
                                <div className="text-center mb-4">
                                    <h3 className="fw-bold mb-1" style={{ fontSize: '18px' }}>
                                        {currentInvoice.business?.name || 'SUPERMARKET STORE'}
                                    </h3>
                                    <div className="text-muted small mb-2">
                                        {currentInvoice.business?.address || '123 Main Street, City'}
                                    </div>
                                    <div className="text-muted small mb-1">
                                        Tel: {currentInvoice.business?.phone || '+250 788 123 456'}
                                    </div>
                                    <div className="text-muted small mb-3">
                                        Email: {currentInvoice.business?.email || 'info@supermarket.rw'}
                                    </div>
                                    <div className="border-top border-bottom py-2">
                                        <strong style={{ fontSize: '16px' }}>INVOICE</strong>
                                    </div>
                                    <div className="text-start mt-2">
                                        <div><strong>Invoice #:</strong> {currentInvoice.invoice_id}</div>
                                        <div><strong>Date:</strong> {currentInvoice.issue_date ? new Date(currentInvoice.issue_date).toLocaleDateString() : 'N/A'}</div>
                                        <div><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
                                        <div><strong>Cashier:</strong> System</div>
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <div className="mb-4">
                                    <div className="border-top border-bottom py-2 mb-2">
                                        <strong style={{ fontSize: '14px' }}>CUSTOMER DETAILS</strong>
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                                        {currentInvoice.customer ? (
                                            `${currentInvoice.customer.first_name || ''} ${currentInvoice.customer.last_name || ''}`.trim() || 'Walk-in Customer'
                                        ) : (
                                            currentInvoice.customer_name || 'Walk-in Customer'
                                        )}
                                    </div>
                                    {currentInvoice.customer && (
                                        <div className="text-muted" style={{ fontSize: '11px' }}>
                                            {currentInvoice.customer.phone && `📱 ${currentInvoice.customer.phone}`}
                                            {currentInvoice.customer.email && ` | ✉️ ${currentInvoice.customer.email}`}
                                            {currentInvoice.customer.company && ` | 🏢 ${currentInvoice.customer.company}`}
                                        </div>
                                    )}
                                </div>

                                {/* Items Table */}
                                <div className="mb-3">
                                    <table style={{ width: '100%', fontSize: '11px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #000' }}>
                                                <th style={{ textAlign: 'left', padding: '4px 0' }}>Item</th>
                                                <th style={{ textAlign: 'center', padding: '4px 0' }}>Qty</th>
                                                <th style={{ textAlign: 'right', padding: '4px 0' }}>Price</th>
                                                <th style={{ textAlign: 'right', padding: '4px 0' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentInvoice.items && currentInvoice.items.length > 0 ? (
                                                currentInvoice.items.map((item, index) => (
                                                    <tr key={index} style={{ borderBottom: '1px dotted #ccc' }}>
                                                        <td style={{ padding: '6px 0', verticalAlign: 'top' }}>
                                                            <div>{item.product_name || item.name || 'Item'}</div>
                                                            {item.product_sku && (
                                                                <div className="text-muted" style={{ fontSize: '9px' }}>
                                                                    SKU: {item.product_sku}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td style={{ textAlign: 'center', padding: '6px 0' }}>
                                                            {item.quantity}
                                                        </td>
                                                        <td style={{ textAlign: 'right', padding: '6px 0' }}>
                                                            {formatCurrency(item.unit_price)}
                                                        </td>
                                                        <td style={{ textAlign: 'right', padding: '6px 0', fontWeight: 'bold' }}>
                                                            {formatCurrency(item.line_total || (item.quantity * item.unit_price))}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px 0' }}>
                                                        <div className="text-muted">
                                                            Order Reference: #{currentInvoice.order_id}
                                                        </div>
                                                        <div className="text-muted">
                                                            No detailed items available
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Totals */}
                                <div className="border-top pt-2">
                                    <table style={{ width: '100%', fontSize: '11px' }}>
                                        <tbody>
                                            <tr>
                                                <td style={{ textAlign: 'right', padding: '2px 0' }}>Subtotal:</td>
                                                <td style={{ textAlign: 'right', padding: '2px 0', width: '80px' }}>
                                                    {formatCurrency(currentInvoice.subtotal || (currentInvoice.total_amount || 0))}
                                                </td>
                                            </tr>
                                            {currentInvoice.discount_amount > 0 && (
                                                <tr>
                                                    <td style={{ textAlign: 'right', padding: '2px 0' }}>Discount:</td>
                                                    <td style={{ textAlign: 'right', padding: '2px 0', color: 'red' }}>
                                                        -{formatCurrency(currentInvoice.discount_amount)}
                                                    </td>
                                                </tr>
                                            )}
                                            {currentInvoice.tax_amount > 0 && (
                                                <tr>
                                                    <td style={{ textAlign: 'right', padding: '2px 0' }}>Tax:</td>
                                                    <td style={{ textAlign: 'right', padding: '2px 0' }}>
                                                        {formatCurrency(currentInvoice.tax_amount)}
                                                    </td>
                                                </tr>
                                            )}
                                            <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold' }}>
                                                <td style={{ textAlign: 'right', padding: '4px 0', fontSize: '13px' }}>TOTAL:</td>
                                                <td style={{ textAlign: 'right', padding: '4px 0', fontSize: '13px', width: '80px' }}>
                                                    {formatCurrency(currentInvoice.total_amount || 0)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ textAlign: 'right', padding: '2px 0' }}>Paid:</td>
                                                <td style={{ textAlign: 'right', padding: '2px 0', color: 'green' }}>
                                                    {formatCurrency(currentInvoice.amount_paid || 0)}
                                                </td>
                                            </tr>
                                            <tr style={{ fontWeight: 'bold', fontSize: '12px' }}>
                                                <td style={{ textAlign: 'right', padding: '2px 0' }}>Due:</td>
                                                <td style={{ textAlign: 'right', padding: '2px 0', color: currentInvoice.amount_due > 0 ? 'red' : 'green' }}>
                                                    {formatCurrency(currentInvoice.amount_due || 0)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Payment Status */}
                                <div className="text-center mt-3 p-2" style={{ 
                                    background: currentInvoice.status === 'paid' ? '#d4edda' : 
                                              currentInvoice.status === 'partially_paid' ? '#fff3cd' : '#f8d7da',
                                    border: `1px solid ${currentInvoice.status === 'paid' ? '#c3e6cb' : 
                                                      currentInvoice.status === 'partially_paid' ? '#ffeaa7' : '#f5c6cb'}`
                                }}>
                                    <strong style={{ 
                                        color: currentInvoice.status === 'paid' ? '#155724' : 
                                               currentInvoice.status === 'partially_paid' ? '#856404' : '#721c24'
                                    }}>
                                        {getStatusBadge(currentInvoice.status)}
                                    </strong>
                                </div>

                                {/* Notes */}
                                {currentInvoice.notes && (
                                    <div className="mt-3 p-2" style={{ background: '#f8f9fa', fontSize: '10px' }}>
                                        <strong>Notes:</strong> {currentInvoice.notes}
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="text-center mt-4 pt-3 border-top">
                                    <div className="mb-2">
                                        <strong>Thank you for shopping with us!</strong>
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '10px' }}>
                                        Please come again soon
                                    </div>
                                    <div className="text-muted mt-2" style={{ fontSize: '9px' }}>
                                        * This is a computer-generated invoice *
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '9px' }}>
                                        * All prices are in {currencySymbol} *
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0 no-print">
                    <Button variant="light" onClick={() => setShowViewModal(false)}>Close</Button>
                    <Button variant="primary" onClick={handlePrint}>
                        <FiPrinter className="me-2" /> Print Invoice
                    </Button>
                </Modal.Footer>
            </Modal>
            
            <style dangerouslySetInnerHTML={{
                __html: `
                /* Mobile Responsive Styles for Invoice Cards */
                @media (max-width: 767.98px) {
                    .card-responsive {
                        min-height: 120px;
                        margin-bottom: 10px;
                    }
                    
                    .card-responsive .card-body {
                        padding: 12px !important;
                    }
                    
                    .small-md {
                        font-size: 0.75rem !important;
                    }
                    
                    .h4-md {
                        font-size: 1.25rem !important;
                    }
                    
                    .h5 {
                        font-size: 1rem !important;
                    }
                    
                    /* Adjust icon sizes for mobile */
                    .card-responsive svg {
                        width: 16px !important;
                        height: 16px !important;
                    }
                    
                    /* Reduce spacing between cards on mobile */
                    .row.g-3 {
                        --bs-gutter-x: 1rem;
                        --bs-gutter-y: 1rem;
                    }
                    
                    /* Ensure cards stack properly on very small screens */
                    @media (max-width: 575.98px) {
                        .card-responsive {
                            min-height: 100px;
                        }
                        
                        .card-responsive .card-body {
                            padding: 10px !important;
                        }
                        
                        .small-md {
                            font-size: 0.7rem !important;
                        }
                        
                        .h5 {
                            font-size: 0.9rem !important;
                        }
                    }
                }
                
                /* Desktop styles */
                @media (min-width: 768px) {
                    .small-md {
                        font-size: 0.875rem !important;
                    }
                    
                    .h4-md {
                        font-size: 1.5rem !important;
                    }
                }
                
                /* Smooth transitions */
                .card-responsive {
                    transition: all 0.2s ease-in-out;
                }
                
                .card-responsive:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1) !important;
                }
                `}} />
        </div>
    );
};

export default Invoices;
