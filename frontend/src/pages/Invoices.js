import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Dropdown } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEdit2, FiTrash2, FiEye, FiDownload, FiFileText, FiPrinter, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { invoicesAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const { formatCurrency } = useCurrency();

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const response = await invoicesAPI.getInvoices();
            setInvoices(response.data.invoices || []);
        } catch (err) {
            console.error('Error fetching invoices:', err);
            // Set mock data as fallback
            setInvoices([
                { id: 1, invoiceId: 'INV-2025-001', customer: 'John Doe', date: '2025-12-15', dueDate: '2025-12-30', amount: 1250.00, status: 'paid', orderId: 'SO-2025-001' },
                { id: 2, invoiceId: 'INV-2025-002', customer: 'Jane Smith', date: '2025-12-18', dueDate: '2026-01-02', amount: 890.50, status: 'unpaid', orderId: 'SO-2025-002' },
                { id: 3, invoiceId: 'INV-2025-003', customer: 'Robert Johnson', date: '2025-12-20', dueDate: '2026-01-04', amount: 2100.00, status: 'overdue', orderId: 'SO-2025-003' },
                { id: 4, invoiceId: 'INV-2025-004', customer: 'Emily Davis', date: '2025-12-22', dueDate: '2026-01-06', amount: 650.75, status: 'paid', orderId: 'SO-2025-004' },
                { id: 5, invoiceId: 'INV-2025-005', customer: 'Michael Wilson', date: '2025-12-24', dueDate: '2026-01-08', amount: 1800.25, status: 'partially_paid', orderId: 'SO-2025-005' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleView = (invoice) => {
        setCurrentInvoice(invoice);
        setShowModal(true);
    };

    const handleDelete = (id) => {
        toast((t) => (
            <span>
                Delete invoice?
                <div className="mt-2 d-flex gap-2">
                    <Button size="sm" variant="danger" onClick={async () => {
                        try {
                            await invoicesAPI.deleteInvoice(id); // Assuming there's a delete endpoint
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
        ), { duration: 5000 });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const invoiceData = {
            // Map form fields to invoice data
            customer_id: formData.get('customer_id'), // This would be from a dropdown
            order_id: formData.get('order_id'),
            issue_date: formData.get('issue_date'),
            due_date: formData.get('due_date'),
            status: formData.get('status'),
            total_amount: parseFloat(formData.get('total_amount')),
            subtotal: parseFloat(formData.get('total_amount')) * 0.9, // Example calculation
            tax_amount: parseFloat(formData.get('total_amount')) * 0.1, // Example calculation
            notes: formData.get('notes')
        };

        setIsSaving(true);
        try {
            if (currentInvoice) {
                // Update existing invoice
                await invoicesAPI.updateInvoice(currentInvoice.id, invoiceData);
                toast.success('Invoice updated successfully!');
            } else {
                // Create new invoice
                await invoicesAPI.createInvoice(invoiceData);
                toast.success('Invoice created successfully!');
            }
            fetchInvoices(); // Refresh the list
            handleClose();
        } catch (err) {
            toast.error('Failed to save invoice. Please try again.');
            console.error('Error saving invoice:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setCurrentInvoice(null);
    };

    const filteredInvoices = invoices.filter(invoice =>
        (invoice.invoiceId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.customer || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid': return <Badge bg="success" className="fw-normal">Paid</Badge>;
            case 'unpaid': return <Badge bg="warning" text="dark" className="fw-normal">Unpaid</Badge>;
            case 'overdue': return <Badge bg="danger" className="fw-normal">Overdue</Badge>;
            case 'partially_paid': return <Badge bg="info" className="fw-normal">Partially Paid</Badge>;
            default: return <Badge bg="secondary" className="fw-normal">{status}</Badge>;
        }
    };

    const handleExport = async () => {
        try {
            // Assuming there's an export endpoint
            toast.success('Exporting invoices...');
            console.log('Exporting invoices');
        } catch (err) {
            toast.error('Failed to export invoices. Please try again.');
            console.error('Error exporting invoices:', err);
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
                    <Button variant="primary" className="d-flex align-items-center" onClick={() => {
                        setCurrentInvoice(null);
                        setShowModal(true);
                    }}>
                        <FiPlus className="me-2" /> Create Invoice
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
                            <h3 className="fw-bold mb-0">{formatCurrency(invoices.filter(i => i.status === 'paid').reduce((acc, curr) => acc + (curr.amount || curr.total_amount || 0), 0))}</h3>
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
                                <span className="text-muted fw-medium">Overdue</span>
                            </div>
                            <h3 className="fw-bold mb-0">{formatCurrency(invoices.filter(i => i.status === 'overdue').reduce((acc, curr) => acc + (curr.amount || curr.total_amount || 0), 0))}</h3>
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

                    <div className="table-responsive">
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
                                            <div className="fw-medium text-dark">{invoice.customer}</div>
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

                                                <Dropdown.Menu className="border-0 shadow-sm">
                                                    <Dropdown.Item onClick={() => handleView(invoice)} className="d-flex align-items-center py-2">
                                                        <FiEye className="me-2 text-muted" /> View Details
                                                    </Dropdown.Item>
                                                    <Dropdown.Item className="d-flex align-items-center py-2" onClick={() => toast.success('Printing invoice...')}>
                                                        <FiPrinter className="me-2 text-muted" /> Print
                                                    </Dropdown.Item>
                                                    <Dropdown.Item className="d-flex align-items-center py-2" onClick={() => toast.success('Emailing invoice...')}>
                                                        <FiSend className="me-2 text-muted" /> Send to Customer
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

            {/* Invoice Modal */}
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
                                    <Form.Control type="text" name="customer_id" defaultValue={currentInvoice?.customer || currentInvoice?.customer_id} placeholder="Select customer" required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Sales Order Ref</Form.Label>
                                    <Form.Control type="text" name="order_id" defaultValue={currentInvoice?.orderId || currentInvoice?.order_id} placeholder="SO-XXXXX" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Invoice Date</Form.Label>
                                    <Form.Control type="date" name="issue_date" defaultValue={currentInvoice?.date || currentInvoice?.issue_date} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Due Date</Form.Label>
                                    <Form.Control type="date" name="due_date" defaultValue={currentInvoice?.dueDate || currentInvoice?.due_date} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Status</Form.Label>
                                    <Form.Select name="status" defaultValue={currentInvoice?.status}>
                                        <option value="unpaid">Unpaid</option>
                                        <option value="partially_paid">Partially Paid</option>
                                        <option value="paid">Paid</option>
                                        <option value="overdue">Overdue</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Total Amount</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text></InputGroup.Text>
                                        <Form.Control type="number" step="0.01" name="total_amount" defaultValue={currentInvoice?.amount || currentInvoice?.total_amount} required />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button variant="light" onClick={handleClose} className="px-4">Close</Button>
                            <Button variant="primary" type="submit" className="px-4" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Invoice'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Invoices;
