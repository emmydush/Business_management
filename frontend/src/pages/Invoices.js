import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Dropdown } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEdit2, FiTrash2, FiEye, FiDownload, FiFileText, FiPrinter, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { invoicesAPI, customersAPI, salesAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { INVOICE_STATUSES, INVOICE_STATUS_LABELS } from '../constants/statuses';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loadingForm, setLoadingForm] = useState(false);

    const { formatCurrency } = useCurrency();

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
            setLoading(true);
            const response = await invoicesAPI.getInvoices();
            setInvoices(response.data.invoices || []);
        } catch (err) {
            console.error('Error fetching invoices:', err);
            // Set mock data as fallback
            setInvoices([
                { id: 1, invoiceId: 'INV-2025-001', customer: 'John Doe', date: '2025-12-15', dueDate: '2025-12-30', amount: 1250.00, status: INVOICE_STATUSES.PAID, orderId: 'SO-2025-001' },
                { id: 2, invoiceId: 'INV-2025-002', customer: 'Jane Smith', date: '2025-12-18', dueDate: '2026-01-02', amount: 890.50, status: INVOICE_STATUSES.UNPAID, orderId: 'SO-2025-002' },
                { id: 3, invoiceId: 'INV-2025-003', customer: 'Robert Johnson', date: '2025-12-20', dueDate: '2026-01-04', amount: 2100.00, status: INVOICE_STATUSES.OVERDUE, orderId: 'SO-2025-003' },
                { id: 4, invoiceId: 'INV-2025-004', customer: 'Emily Davis', date: '2025-12-22', dueDate: '2026-01-06', amount: 650.75, status: 'paid', orderId: 'SO-2025-004' },
                { id: 5, invoiceId: 'INV-2025-005', customer: 'Michael Wilson', date: '2025-12-24', dueDate: '2026-01-08', amount: 1800.25, status: INVOICE_STATUSES.PARTIALLY_PAID, orderId: 'SO-2025-005' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (invoice) => {
        setCurrentInvoice(invoice);
        setShowViewModal(true);
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
        const customerName = typeof invoice.customer === 'string'
            ? invoice.customer
            : `${invoice.customer?.first_name || ''} ${invoice.customer?.last_name || ''}`;

        return (invoice.invoiceId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case INVOICE_STATUSES.PAID: return <Badge bg="success" className="fw-normal">{INVOICE_STATUS_LABELS[INVOICE_STATUSES.PAID]}</Badge>;
            case INVOICE_STATUSES.UNPAID: return <Badge bg="warning" text="dark" className="fw-normal">{INVOICE_STATUS_LABELS[INVOICE_STATUSES.UNPAID]}</Badge>;
            case INVOICE_STATUSES.OVERDUE: return <Badge bg="danger" className="fw-normal">{INVOICE_STATUS_LABELS[INVOICE_STATUSES.OVERDUE]}</Badge>;
            case INVOICE_STATUSES.PARTIALLY_PAID: return <Badge bg="info" className="fw-normal">{INVOICE_STATUS_LABELS[INVOICE_STATUSES.PARTIALLY_PAID]}</Badge>;
            default: return <Badge bg="secondary" className="fw-normal">{status}</Badge>;
        }
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
                    <Button variant="outline-secondary" className="d-flex align-items-center" onClick={handleExport}>
                        <FiDownload className="me-2" /> Export
                    </Button>
                    <Button variant="primary" className="d-flex align-items-center" onClick={handleCreate}>
                        <FiPlus className="me-2" /> Create Invoice
                    </Button>
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

            {/* Stats Cards */}
            <Row className="g-4 mb-4">
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                                    <FiFileText className="text-primary" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Total Invoiced</span>
                            </div>
                            <h3 className="fw-bold mb-0">{formatCurrency(invoices.reduce((acc, curr) => acc + (curr.amount || curr.total_amount || 0), 0))}</h3>
                            <small className="text-muted">Across {invoices.length} invoices</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                                    <FiFileText className="text-success" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Paid Amount</span>
                            </div>
                            <h3 className="fw-bold mb-0">{formatCurrency(invoices.filter(i => i.status === INVOICE_STATUSES.PAID).reduce((acc, curr) => acc + (curr.amount || curr.total_amount || 0), 0))}</h3>
                            <small className="text-success fw-medium">75% collection rate</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                                    <FiFileText className="text-warning" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Pending</span>
                            </div>
                            <h3 className="fw-bold mb-0">{formatCurrency(invoices.filter(i => i.status === 'unpaid' || i.status === 'partially_paid').reduce((acc, curr) => acc + (curr.amount || curr.total_amount || 0), 0))}</h3>
                            <small className="text-muted">Awaiting payment</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-danger bg-opacity-10 p-2 rounded me-3">
                                    <FiFileText className="text-danger" size={20} />
                                </div>
                                <span className="text-muted fw-medium">{INVOICE_STATUS_LABELS[INVOICE_STATUSES.OVERDUE]}</span>
                            </div>
                            <h3 className="fw-bold mb-0">{formatCurrency(invoices.filter(i => i.status === INVOICE_STATUSES.OVERDUE).reduce((acc, curr) => acc + (curr.amount || curr.total_amount || 0), 0))}</h3>
                            <small className="text-danger fw-medium">Requires attention</small>
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
                            <Button variant="outline-light" className="text-dark border d-flex align-items-center">
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
                                            <div className="fw-bold text-primary">{invoice.invoiceId}</div>
                                            <div className="small text-muted">Ref: {invoice.orderId}</div>
                                        </td>
                                        <td>
                                            <div className="fw-medium text-dark">
                                                {typeof invoice.customer === 'string'
                                                    ? invoice.customer
                                                    : `${invoice.customer?.first_name || ''} ${invoice.customer?.last_name || ''}`}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-muted small">{invoice.date}</div>
                                        </td>
                                        <td>
                                            <div className="text-muted small">{invoice.dueDate}</div>
                                        </td>
                                        <td>
                                            <div className="fw-bold text-dark">{formatCurrency(invoice.amount || invoice.total_amount || 0)}</div>
                                        </td>
                                        <td>
                                            {getStatusBadge(invoice.status)}
                                        </td>
                                        <td className="text-end pe-4">
                                            <Dropdown align="end">
                                                <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                                                    <FiMoreVertical size={20} />
                                                </Dropdown.Toggle>

                                                <Dropdown.Menu className="border-0 shadow-sm" style={{ zIndex: 1000 }}>
                                                    <Dropdown.Item onClick={() => handleViewDetails(invoice)} className="d-flex align-items-center py-2">
                                                        <FiEye className="me-2 text-muted" /> View Details
                                                    </Dropdown.Item>
                                                    <Dropdown.Item className="d-flex align-items-center py-2" onClick={() => { setCurrentInvoice(invoice); setShowViewModal(true); setTimeout(handlePrint, 500); }}>
                                                        <FiPrinter className="me-2 text-muted" /> Print
                                                    </Dropdown.Item>
                                                    <Dropdown.Item className="d-flex align-items-center py-2" onClick={() => toast.success('Emailing invoice...')}>
                                                        <FiSend className="me-2 text-muted" /> Send to Customer
                                                    </Dropdown.Item>
                                                    <Dropdown.Item onClick={() => handleEdit(invoice)} className="d-flex align-items-center py-2">
                                                        <FiEdit2 className="me-2 text-muted" /> Edit
                                                    </Dropdown.Item>
                                                    <Dropdown.Divider />
                                                    <Dropdown.Item className="d-flex align-items-center py-2 text-danger" onClick={() => handleDelete(invoice.id)}>
                                                        <FiTrash2 className="me-2" /> Delete Invoice
                                                    </Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
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
                                        <InputGroup.Text></InputGroup.Text>
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

            {/* View/Print Modal */}
            <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg" className="invoice-view-modal-container">
                <Modal.Header closeButton className="border-0 pb-0 no-print">
                    <Modal.Title className="fw-bold">Invoice Details</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                    <div className="invoice-view-modal p-5">
                        {currentInvoice && (
                            <>
                                <div className="d-flex justify-content-between mb-5">
                                    <div>
                                        <h2 className="fw-bold text-primary mb-1">INVOICE</h2>
                                        <p className="text-muted mb-0">#{currentInvoice.invoiceId}</p>
                                    </div>
                                    <div className="text-end">
                                        <h5 className="fw-bold">{currentInvoice.business?.name || 'Business Name'}</h5>
                                        <p className="text-muted mb-0">{currentInvoice.business?.address || 'Address'}</p>
                                        <p className="text-muted mb-0">{currentInvoice.business?.email || ''}</p>
                                        <p className="text-muted mb-0">{currentInvoice.business?.phone || ''}</p>
                                    </div>
                                </div>

                                <Row className="mb-5">
                                    <Col md={6}>
                                        <h6 className="text-muted text-uppercase small fw-bold mb-3">Bill To</h6>
                                        <h5 className="fw-bold mb-1">
                                            {typeof currentInvoice.customer === 'string'
                                                ? currentInvoice.customer
                                                : `${currentInvoice.customer?.first_name || ''} ${currentInvoice.customer?.last_name || ''}`}
                                        </h5>
                                        {typeof currentInvoice.customer !== 'string' && (
                                            <>
                                                <p className="text-muted mb-0">{currentInvoice.customer?.company}</p>
                                                <p className="text-muted mb-0">{currentInvoice.customer?.email}</p>
                                                <p className="text-muted mb-0">{currentInvoice.customer?.phone}</p>
                                            </>
                                        )}
                                    </Col>
                                    <Col md={6} className="text-md-end">
                                        <div className="mb-2">
                                            <span className="text-muted me-3">Issue Date:</span>
                                            <span className="fw-bold">{currentInvoice.date || currentInvoice.issue_date}</span>
                                        </div>
                                        <div className="mb-2">
                                            <span className="text-muted me-3">Due Date:</span>
                                            <span className="fw-bold">{currentInvoice.dueDate || currentInvoice.due_date}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted me-3">Status:</span>
                                            {getStatusBadge(currentInvoice.status)}
                                        </div>
                                    </Col>
                                </Row>

                                <Table bordered className="mb-4">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="py-2">Description</th>
                                            <th className="py-2 text-end">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentInvoice.items && currentInvoice.items.length > 0 ? (
                                            currentInvoice.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <div>{item.product_name || 'Product'}</div>
                                                        <small className="text-muted">Qty: {item.quantity} x {formatCurrency(item.unit_price)}</small>
                                                    </td>
                                                    <td className="text-end">{formatCurrency(item.line_total)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td>Order Reference: {currentInvoice.orderId || `#${currentInvoice.order_id}`}</td>
                                                <td className="text-end">{formatCurrency(currentInvoice.amount || currentInvoice.total_amount || 0)}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td className="text-end fw-bold">Total</td>
                                            <td className="text-end fw-bold">{formatCurrency(currentInvoice.amount || currentInvoice.total_amount || 0)}</td>
                                        </tr>
                                    </tfoot>
                                </Table>

                                {currentInvoice.notes && (
                                    <div className="mb-4">
                                        <h6 className="fw-bold small text-muted">Notes</h6>
                                        <p className="small">{currentInvoice.notes}</p>
                                    </div>
                                )}

                                <div className="text-center mt-5 pt-5 border-top">
                                    <p className="text-muted small mb-0">Thank you for your business!</p>
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
        </div>
    );
};

export default Invoices;
