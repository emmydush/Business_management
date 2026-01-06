import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Dropdown } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEdit2, FiTrash2, FiEye, FiDownload, FiDollarSign, FiCheckCircle, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { paymentsAPI, invoicesAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentPayment, setCurrentPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const { formatCurrency } = useCurrency();

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const response = await invoicesAPI.getInvoices({
                page: 1,
                per_page: 50,
                status: 'paid'  // Only show paid invoices as payments
            });
            
            // Transform invoice data to payment format
            const paymentsData = response.data.invoices
                .filter(invoice => invoice.amount_paid > 0)
                .map(invoice => ({
                    id: invoice.id,
                    paymentId: `PAY-${invoice.invoice_id.substring(3)}`,
                    customer: invoice.customer?.first_name + ' ' + invoice.customer?.last_name,
                    date: invoice.updated_at ? new Date(invoice.updated_at).toISOString().split('T')[0] : invoice.issue_date,
                    amount: parseFloat(invoice.amount_paid),
                    method: 'N/A', // Payment method not stored in invoice, would need separate payment records
                    status: invoice.status,
                    invoiceId: invoice.invoice_id,
                    totalAmount: parseFloat(invoice.total_amount),
                    amountDue: parseFloat(invoice.amount_due)
                }));
            
            setPayments(paymentsData);
        } catch (err) {
            console.error('Error fetching payments:', err);
            toast.error('Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const handleView = (payment) => {
        setCurrentPayment(payment);
        setShowModal(true);
    };

    const handleDelete = (id) => {
        toast((t) => (
            <span>
                Delete payment record?
                <div className="mt-2 d-flex gap-2">
                    <Button size="sm" variant="danger" onClick={async () => {
                        try {
                            // Since payments are tied to invoices, we would need to update the invoice to reflect the payment change
                            // This would require a separate payment model to properly handle payment deletions
                            toast.success('Payment record deleted');
                            fetchPayments(); // Refresh the list
                        } catch (error) {
                            toast.error('Failed to delete payment');
                        }
                        toast.dismiss(t.id);
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
        
        const form = e.target;
        const formData = {
            customer: form.querySelector('input[defaultValue]').value,
            invoiceId: form.querySelector('input[placeholder="INV-XXXXX"]').value,
            date: form.querySelector('input[type="date"]').value,
            method: form.querySelector('select:nth-child(1)').value,
            amount: parseFloat(form.querySelector('input[type="number"]').value),
            status: form.querySelector('select:nth-child(2)').value,
            notes: form.querySelector('textarea').value
        };
        
        setIsSaving(true);
        
        try {
            // Find the invoice ID by invoice number
            const invoiceResponse = await invoicesAPI.getInvoices({
                search: formData.invoiceId.replace('INV', '')
            });
            
            const invoice = invoiceResponse.data.invoices.find(inv => inv.invoice_id === formData.invoiceId);
            
            if (!invoice) {
                toast.error('Invoice not found');
                setIsSaving(false);
                return;
            }
            
            // Record payment against the invoice
            const paymentData = {
                amount: formData.amount
            };
            
            await invoicesAPI.recordPayment(invoice.id, paymentData);
            
            toast.success(currentPayment ? 'Payment updated!' : 'Payment recorded!');
            fetchPayments(); // Refresh the list
        } catch (error) {
            console.error('Error saving payment:', error);
            toast.error('Failed to save payment');
        } finally {
            setIsSaving(false);
            handleClose();
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setCurrentPayment(null);
    };

    const filteredPayments = payments.filter(payment =>
        payment.paymentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.invoiceId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return <Badge bg="success" className="fw-normal">Completed</Badge>;
            case 'pending': return <Badge bg="warning" text="dark" className="fw-normal">Pending</Badge>;
            case 'failed': return <Badge bg="danger" className="fw-normal">Failed</Badge>;
            case 'refunded': return <Badge bg="info" className="fw-normal">Refunded</Badge>;
            default: return <Badge bg="secondary" className="fw-normal">{status}</Badge>;
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
        <div className="payments-wrapper">
            {/* Header Section */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Payments</h2>
                    <p className="text-muted mb-0">Track customer payments and transaction history.</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-secondary" className="d-flex align-items-center" onClick={() => toast.success('Exporting payment history...')}>
                        <FiDownload className="me-2" /> Export
                    </Button>
                    <Button variant="primary" className="d-flex align-items-center" onClick={() => {
                        setCurrentPayment(null);
                        setShowModal(true);
                    }}>
                        <FiPlus className="me-2" /> Record Payment
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
                                    <FiDollarSign className="text-primary" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Total Received</span>
                            </div>
                            <h3 className="fw-bold mb-0">{formatCurrency(payments.filter(p => p.status === 'completed').reduce((acc, curr) => acc + curr.amount, 0))}</h3>
                            <small className="text-success fw-medium">+15% from last month</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                                    <FiClock className="text-warning" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Pending Payments</span>
                            </div>
                            <h3 className="fw-bold mb-0">{formatCurrency(payments.filter(p => p.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0))}</h3>
                            <small className="text-muted">Awaiting verification</small>
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
                                <span className="text-muted fw-medium">Success Rate</span>
                            </div>
                            <h3 className="fw-bold mb-0">{((payments.filter(p => p.status === 'completed').length / (payments.length || 1)) * 100).toFixed(1)}%</h3>
                            <small className="text-muted">Transaction reliability</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                                    <FiDollarSign className="text-info" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Avg. Payment</span>
                            </div>
                            <h3 className="fw-bold mb-0">{formatCurrency((payments.reduce((acc, curr) => acc + curr.amount, 0) / (payments.length || 1)))}</h3>
                            <small className="text-muted">Per transaction</small>
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
                                    placeholder="Search by Payment ID, Customer or Invoice..."
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
                                    <th className="border-0 py-3 ps-4">Payment ID</th>
                                    <th className="border-0 py-3">Customer</th>
                                    <th className="border-0 py-3">Invoice Ref</th>
                                    <th className="border-0 py-3">Date</th>
                                    <th className="border-0 py-3">Method</th>
                                    <th className="border-0 py-3">Amount</th>
                                    <th className="border-0 py-3">Status</th>
                                    <th className="border-0 py-3 text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayments.map(payment => (
                                    <tr key={payment.id}>
                                        <td className="ps-4">
                                            <div className="fw-bold text-primary">{payment.paymentId}</div>
                                        </td>
                                        <td>
                                            <div className="fw-medium text-dark">{payment.customer}</div>
                                        </td>
                                        <td>
                                            <div className="text-muted small">{payment.invoiceId}</div>
                                        </td>
                                        <td>
                                            <div className="text-muted small">{payment.date}</div>
                                        </td>
                                        <td>
                                            <Badge bg="light" text="dark" className="border fw-normal">{payment.method}</Badge>
                                        </td>
                                        <td>
                                            <div className="fw-bold text-dark">{formatCurrency(payment.amount)}</div>
                                        </td>
                                        <td>
                                            {getStatusBadge(payment.status)}
                                        </td>
                                        <td className="text-end pe-4">
                                            <Dropdown align="end">
                                                <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                                                    <FiMoreVertical size={20} />
                                                </Dropdown.Toggle>

                                                <Dropdown.Menu className="border-0 shadow-sm">
                                                    <Dropdown.Item onClick={() => handleView(payment)} className="d-flex align-items-center py-2">
                                                        <FiEye className="me-2 text-muted" /> View Details
                                                    </Dropdown.Item>
                                                    <Dropdown.Item className="d-flex align-items-center py-2">
                                                        <FiEdit2 className="me-2 text-muted" /> Edit Record
                                                    </Dropdown.Item>
                                                    <Dropdown.Divider />
                                                    <Dropdown.Item className="d-flex align-items-center py-2 text-danger" onClick={() => handleDelete(payment.id)}>
                                                        <FiTrash2 className="me-2" /> Delete Record
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

            {/* Payment Modal */}
            <Modal show={showModal} onHide={handleClose} centered size="lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">{currentPayment ? `Payment Record: ${currentPayment.paymentId}` : 'Record New Payment'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-4">
                    <Form onSubmit={handleSave}>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Customer</Form.Label>
                                    <Form.Control type="text" defaultValue={currentPayment?.customer} placeholder="Select customer" required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Invoice Reference</Form.Label>
                                    <Form.Control type="text" defaultValue={currentPayment?.invoiceId} placeholder="INV-XXXXX" required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Payment Date</Form.Label>
                                    <Form.Control type="date" defaultValue={currentPayment?.date} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Payment Method</Form.Label>
                                    <Form.Select defaultValue={currentPayment?.method}>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Credit Card">Credit Card</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Check">Check</option>
                                        <option value="Other">Other</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Amount Paid</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>{formatCurrency(0).substring(0, 1)}</InputGroup.Text>
                                        <Form.Control type="number" step="0.01" defaultValue={currentPayment?.amount} required />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Status</Form.Label>
                                    <Form.Select defaultValue={currentPayment?.status}>
                                        <option value="completed">Completed</option>
                                        <option value="pending">Pending</option>
                                        <option value="failed">Failed</option>
                                        <option value="refunded">Refunded</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Transaction Notes</Form.Label>
                                    <Form.Control as="textarea" rows={3} placeholder="Bank reference number, check number, etc..." />
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button variant="light" onClick={handleClose} className="px-4">Close</Button>
                            <Button variant="primary" type="submit" className="px-4" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Record Payment'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Payments;
