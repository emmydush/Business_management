import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Dropdown } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEdit2, FiTrash2, FiEye, FiDownload, FiRotateCcw, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { returnsAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';

const Returns = () => {
    const [returns, setReturns] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentReturn, setCurrentReturn] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const { formatCurrency } = useCurrency();

    useEffect(() => {
        fetchReturns();
    }, []);

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
        ), { duration: 5000 });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const returnData = {
            // Map form fields to return data
            customer_id: formData.get('customer_id'), // This would be from a dropdown
            invoice_id: formData.get('invoice_id'),
            return_date: formData.get('return_date'),
            status: formData.get('status'),
            reason: formData.get('reason'),
            total_amount: parseFloat(formData.get('total_amount')),
            refund_amount: parseFloat(formData.get('refund_amount')),
            notes: formData.get('notes')
        };

        setIsSaving(true);
        try {
            if (currentReturn) {
                // Update existing return
                await returnsAPI.updateReturn(currentReturn.id, returnData);
                toast.success('Return updated successfully!');
            } else {
                // Create new return
                await returnsAPI.createReturn(returnData);
                toast.success('Return initiated successfully!');
            }
            fetchReturns(); // Refresh the list
            handleClose();
        } catch (err) {
            toast.error('Failed to save return. Please try again.');
            console.error('Error saving return:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setCurrentReturn(null);
    };

    const filteredReturns = returns.filter(ret =>
        (ret.returnId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ret.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ret.invoiceId || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return <Badge bg="success" className="fw-normal">Completed</Badge>;
            case 'pending': return <Badge bg="warning" text="dark" className="fw-normal">Pending</Badge>;
            case 'processing': return <Badge bg="primary" className="fw-normal">Processing</Badge>;
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
                            <h3 className="fw-bold mb-0">{returns.filter(r => r.status === 'pending' || r.status === 'processing').length}</h3>
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
                            <h3 className="fw-bold mb-0">{formatCurrency(returns.filter(r => r.status === 'completed').reduce((acc, curr) => acc + (curr.amount || curr.total_amount || 0), 0))}</h3>
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
                            <h3 className="fw-bold mb-0">2.4%</h3>
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
                            <Button variant="outline-light" className="text-dark border d-flex align-items-center">
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
                                            <Dropdown align="end">
                                                <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                                                    <FiMoreVertical size={20} />
                                                </Dropdown.Toggle>

                                                <Dropdown.Menu className="border-0 shadow-sm">
                                                    <Dropdown.Item onClick={() => handleView(ret)} className="d-flex align-items-center py-2">
                                                        <FiEye className="me-2 text-muted" /> View Details
                                                    </Dropdown.Item>
                                                    <Dropdown.Item className="d-flex align-items-center py-2">
                                                        <FiEdit2 className="me-2 text-muted" /> Edit Record
                                                    </Dropdown.Item>
                                                    <Dropdown.Divider />
                                                    <Dropdown.Item className="d-flex align-items-center py-2 text-danger" onClick={() => handleDelete(ret.id)}>
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

            {/* Return Modal */}
            <Modal show={showModal} onHide={handleClose} centered size="lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">{currentReturn ? `Return Record: ${currentReturn.returnId}` : 'Initiate New Return'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-4">
                    <Form onSubmit={handleSave}>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Customer</Form.Label>
                                    <Form.Control type="text" name="customer_id" defaultValue={currentReturn?.customer || currentReturn?.customer_id} placeholder="Select customer" required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Invoice Reference</Form.Label>
                                    <Form.Control type="text" name="invoice_id" defaultValue={currentReturn?.invoiceId || currentReturn?.invoice_id} placeholder="INV-XXXXX" required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Return Date</Form.Label>
                                    <Form.Control type="date" name="return_date" defaultValue={currentReturn?.date || currentReturn?.return_date} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Status</Form.Label>
                                    <Form.Select name="status" defaultValue={currentReturn?.status}>
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="completed">Completed</option>
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
