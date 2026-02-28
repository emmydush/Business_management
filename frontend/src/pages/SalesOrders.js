import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiEdit2, FiTrash2, FiEye, FiDownload, FiShoppingCart, FiClock, FiCheckCircle } from 'react-icons/fi';
import { salesAPI, customersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';

import { PAYMENT_STATUSES, PAYMENT_STATUS_LABELS } from '../constants/statuses';

const SalesOrders = () => {
    
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const { formatCurrency } = useCurrency();

    useEffect(() => {
        fetchOrders();
        fetchCustomers();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await salesAPI.getOrders();
            setOrders(response.data.orders || []);
        } catch (err) {
            console.error('Error fetching orders:', err);
            // Set mock data as fallback
            setOrders([
                { id: 1, orderId: 'S-2025-001', customer: 'John Doe', customer_id: 1, date: '2025-12-15', amount: 1250.00, status: 'delivered', items: 3, payment: 'paid' },
                { id: 2, orderId: 'S-2025-002', customer: 'Jane Smith', customer_id: 2, date: '2025-12-18', amount: 890.50, status: 'shipped', items: 2, payment: 'partial' },
                { id: 3, orderId: 'S-2025-003', customer: 'Robert Johnson', customer_id: 3, date: '2025-12-20', amount: 2100.00, status: 'processing', items: 5, payment: 'unpaid' },
                { id: 4, orderId: 'S-2025-004', customer: 'Emily Davis', customer_id: 4, date: '2025-12-22', amount: 650.75, status: 'confirmed', items: 1, payment: 'paid' },
                { id: 5, orderId: 'S-2025-005', customer: 'Michael Wilson', customer_id: 5, date: '2025-12-24', amount: 1800.25, status: 'pending', items: 4, payment: 'unpaid' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await customersAPI.getCustomers();
            setCustomers(response.data.customers || []);
        } catch (err) {
            console.error('Error fetching customers:', err);
        }
    };

    const handleView = async (order) => {
        try {
            // If the order doesn't have items, fetch the detailed order
            if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
                const response = await salesAPI.getOrder(order.id);
                setCurrentOrder(response.data.order);
            } else {
                setCurrentOrder(order);
            }
        } catch (err) {
            console.error('Error fetching order details:', err);
            // Fallback to the order passed in
            setCurrentOrder(order);
        }
        setShowModal(true);
    };

    const handleDelete = (id) => {
        toast((toastItem) => (
            <span>
                {"delete_sale_confirm"}
                <div className="mt-2 d-flex gap-2">
                    <Button size="sm" variant="danger" onClick={async () => {
                        try {
                            await salesAPI.deleteOrder(id); // Assuming there's a delete endpoint
                            setOrders(orders.filter(ord => ord.id !== id));
                            toast.dismiss(toastItem.id);
                            toast.success("sale_deleted");
                        } catch (err) {
                            toast.dismiss(toastItem.id);
                            toast.error("register_failed");
                            console.error('Error deleting sale:', err);
                        }
                    }}>
                        {"delete_sale"}
                    </Button>
                    <Button size="sm" variant="light" onClick={() => toast.dismiss(toastItem.id)}>
                        {"Cancel"}
                    </Button>
                </div>
            </span>
        ), { duration: 3000 });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const orderData = {
            customer_id: parseInt(formData.get('')),
            order_date: formData.get(''),
            status: formData.get('').toUpperCase(),
            payment_status: formData.get('').toUpperCase(),
            notes: formData.get(''),
            // Send DRAFT status when creating without items
            items: currentOrder ? undefined : [] // Will be handled by backend as draft
        };

        setIsSaving(true);
        try {
            if (currentOrder) {
                // Update existing order
                await salesAPI.updateOrder(currentOrder.id, orderData);
                toast.success("sale_updated");
            } else {
                // Create new order - use DRAFT status for orders without items
                await salesAPI.createOrder({ 
                    ...orderData, 
                    status: 'DRAFT',
                    items: [] 
                });
                toast.success("sale_created");
            }
            fetchOrders(); // Refresh the list
            handleClose();
        } catch (err) {
            const errorMsg = err.response?.data?.error || "register_failed";
            toast.error(errorMsg);
            console.error('Error saving sale:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await salesAPI.exportOrders();
            toast.success(response.data.message || "export_success");
            console.log('Export response:', response.data);
        } catch (err) {
            toast.error("export_failed");
            console.error('Error exporting sales:', err);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setCurrentOrder(null);
    };

    const filteredOrders = orders.filter(order => {
        const orderId = (order.orderId || order.order_id || '').toLowerCase();
        const customerName = typeof order.customer === 'string'
            ? order.customer.toLowerCase()
            : `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.toLowerCase();

        return orderId.includes(searchTerm.toLowerCase()) ||
            customerName.includes(searchTerm.toLowerCase());
    });

    const getStatusBadge = (status) => {
        const s = status?.toLowerCase();
        switch (s) {
            case 'pending': return <Badge bg="warning" text="dark" className="fw-normal">{"status_pending"}</Badge>;
            case 'confirmed': return <Badge bg="info" className="fw-normal">{"status_confirmed"}</Badge>;
            case 'processing': return <Badge bg="primary" className="fw-normal">{"status_processing"}</Badge>;
            case 'shipped': return <Badge bg="secondary" className="fw-normal">{"status_shipped"}</Badge>;
            case 'delivered': return <Badge bg="success" className="fw-normal">{"status_delivered"}</Badge>;
            case 'cancelled': return <Badge bg="danger" className="fw-normal">{"status_cancelled"}</Badge>;
            default: return <Badge bg="secondary" className="fw-normal">{status}</Badge>;
        }
    };

    const getPaymentBadge = (payment) => {
        if (!payment) return null;
        const p = payment.toLowerCase();
        
        // Map legacy values to our constants
        let paymentStatus = p;
        if (p === 'partial') paymentStatus = PAYMENT_STATUSES.PARTIAL;
        else if (p === 'paid') paymentStatus = PAYMENT_STATUSES.PAID;
        else if (p === 'unpaid') paymentStatus = PAYMENT_STATUSES.UNPAID;
        
        switch (paymentStatus) {
            case PAYMENT_STATUSES.PAID: 
                return <Badge pill bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25">{"payment_paid" || PAYMENT_STATUS_LABELS[PAYMENT_STATUSES.PAID]}</Badge>;
            case PAYMENT_STATUSES.PARTIAL: 
                return <Badge pill bg="warning" className="bg-opacity-10 text-warning border border-warning border-opacity-25">{"payment_partial" || PAYMENT_STATUS_LABELS[PAYMENT_STATUSES.PARTIAL]}</Badge>;
            case PAYMENT_STATUSES.UNPAID: 
                return <Badge pill bg="danger" className="bg-opacity-10 text-danger border border-danger border-opacity-25">{"payment_unpaid" || PAYMENT_STATUS_LABELS[PAYMENT_STATUSES.UNPAID]}</Badge>;
            case PAYMENT_STATUSES.PENDING:
                return <Badge pill bg="secondary" className="bg-opacity-10 text-secondary border border-secondary border-opacity-25">{"payment_pending" || PAYMENT_STATUS_LABELS[PAYMENT_STATUSES.PENDING]}</Badge>;
            case PAYMENT_STATUSES.FAILED:
                return <Badge pill bg="danger" className="bg-opacity-10 text-danger border border-danger border-opacity-25">{"payment_failed" || PAYMENT_STATUS_LABELS[PAYMENT_STATUSES.FAILED]}</Badge>;
            case PAYMENT_STATUSES.REFUNDED:
                return <Badge pill bg="primary" className="bg-opacity-10 text-primary border border-primary border-opacity-25">{"payment_refunded" || PAYMENT_STATUS_LABELS[PAYMENT_STATUSES.REFUNDED]}</Badge>;
            case PAYMENT_STATUSES.OVERDUE:
                return <Badge pill bg="danger" className="bg-opacity-10 text-danger border border-danger border-opacity-25">{"payment_overdue" || PAYMENT_STATUS_LABELS[PAYMENT_STATUSES.OVERDUE]}</Badge>;
            case PAYMENT_STATUSES.CANCELLED:
                return <Badge pill bg="dark" className="bg-opacity-10 text-dark border border-dark border-opacity-25">{"payment_cancelled" || PAYMENT_STATUS_LABELS[PAYMENT_STATUSES.CANCELLED]}</Badge>;
            default: 
                return <Badge pill bg="secondary" className="bg-opacity-10 text-secondary border border-secondary border-opacity-25">{payment}</Badge>;
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
        <div className="sales-orders-wrapper">
            {/* Header Section */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Sales Order</h2>
                    <p className="text-muted mb-0">Manage and track customer orders and fulfillment.</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-secondary" className="d-flex align-items-center" onClick={handleExport}>
                        <FiDownload className="me-2" /> Export
                    </Button>
                    <Button variant="primary" className="d-flex align-items-center" onClick={() => {
                        setCurrentOrder(null);
                        setShowModal(true);
                    }}>
                        <FiPlus className="me-2" /> New Sale
                    </Button>
                </div>
            </div>

            {/* Stats Cards - Responsive for Mobile */}
            <Row className="g-3 g-md-4 mb-4">
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100 card-responsive">
                        <Card.Body className="p-3 p-md-4">
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-primary bg-opacity-10 p-2 rounded me-2 me-md-3">
                                    <FiShoppingCart className="text-primary" size={20} />
                                </div>
                                <span className="text-muted fw-medium small small-md">Total Sales</span>
                            </div>
                            <h3 className="fw-bold mb-0 h5 h4-md">{orders.length}</h3>
                            <small className="text-success fw-medium d-none d-md-block">+8% from last month</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100 card-responsive">
                        <Card.Body className="p-3 p-md-4">
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-warning bg-opacity-10 p-2 rounded me-2 me-md-3">
                                    <FiClock className="text-warning" size={20} />
                                </div>
                                <span className="text-muted fw-medium small small-md">{`pending_sales`}</span>
                            </div>
                            <h3 className="fw-bold mb-0 h5 h4-md">{orders.filter(o => o.status?.toLowerCase() === 'pending' || o.status?.toLowerCase() === 'processing').length}</h3>
                            <small className="text-muted d-none d-md-block">Pending</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100 card-responsive">
                        <Card.Body className="p-3 p-md-4">
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-success bg-opacity-10 p-2 rounded me-2 me-md-3">
                                    <FiCheckCircle className="text-success" size={20} />
                                </div>
                                <span className="text-muted fw-medium small small-md">Completed Sales</span>
                            </div>
                            <h3 className="fw-bold mb-0 h5 h4-md">{orders.filter(o => o.status?.toLowerCase() === 'delivered').length}</h3>
                            <small className="text-muted d-none d-md-block">Delivered</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100 card-responsive">
                        <Card.Body className="p-3 p-md-4">
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-info bg-opacity-10 p-2 rounded me-2 me-md-3">
                                    <FiShoppingCart className="text-info" size={20} />
                                </div>
                                <span className="text-muted fw-medium small small-md">Total Revenue</span>
                            </div>
                            <h3 className="fw-bold mb-0 h5 h4-md">{formatCurrency(orders.reduce((acc, curr) => acc + (curr.amount || curr.total_amount || 0), 0))}</h3>
                            <small className="text-muted d-none d-md-block">Revenue</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            <style dangerouslySetInnerHTML={{
                __html: `
                /* Mobile Responsive Styles for Sales Cards */
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

            {/* Main Content Card */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    {/* Toolbar */}
                    <div className="p-3 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '400px' }}>
                            <InputGroup>
                                <InputGroup.Text className="bg-light border-end-0">
                                    <FiSearch className="text-muted" />
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Search sales..."
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

                    {/* Table */}
                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0 py-3 ps-4">Sale ID</th>
                                    <th className="border-0 py-3">Customer</th>
                                    <th className="border-0 py-3">Sale Date</th>
                                    <th className="border-0 py-3">Total</th>
                                    <th className="border-0 py-3">Status</th>
                                    <th className="border-0 py-3">Payment Status</th>
                                    <th className="border-0 py-3 text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(order => (
                                    <tr key={order.id}>
                                        <td className="ps-4">
                                            <div className="fw-bold text-primary">{order.orderId || order.order_id}</div>
                                            <div className="small text-muted">{order.items?.length || order.items || 0} items</div>
                                        </td>
                                        <td>
                                            <div className="fw-medium text-dark">
                                                {typeof order.customer === 'string'
                                                    ? order.customer
                                                    : `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-muted small">{order.date || order.order_date}</div>
                                        </td>
                                        <td>
                                            <div className="fw-bold text-dark">{formatCurrency(order.amount || order.total_amount || 0)}</div>
                                        </td>
                                        <td>
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td>
                                            {getPaymentBadge(order.payment)}
                                        </td>
                                        <td className="text-end pe-4">
                                            <div className="d-flex gap-2 justify-content-end">
                                                <Button variant="outline-primary" size="sm" className="d-flex align-items-center" onClick={() => handleView(order)} title="View details">
                                                    <FiEye size={16} />
                                                </Button>
                                                <Button variant="outline-warning" size="sm" className="d-flex align-items-center" onClick={() => handleView(order)} title="Edit sale">
                                                    <FiEdit2 size={16} />
                                                </Button>
                                                <Button variant="outline-danger" size="sm" className="d-flex align-items-center" onClick={() => handleDelete(order.id)} title="Delete sale">
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

            {/* Order Modal */}
            <Modal show={showModal} onHide={handleClose} centered size="lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">{currentOrder ? `Sale Details: ${currentOrder.orderId || currentOrder.order_id}` : "Create New Sale"}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-4">
                    <Form onSubmit={handleSave}>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Customer</Form.Label>
                                    <Form.Select name="customer_id" defaultValue={currentOrder?.customer_id} required>
                                        <option value="">Select a customer</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.first_name} {c.last_name} {c.company && `(${c.company})`}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Sale Date</Form.Label>
                                    <Form.Control type="date" name="order_date" defaultValue={currentOrder?.date || (currentOrder?.order_date ? currentOrder.order_date.split("T")[0] : '')} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Status</Form.Label>
                                    <Form.Select name="status" defaultValue={currentOrder?.status?.toLowerCase()}>
                                        <option value="draft">Draft</option>
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Payment Status</Form.Label>
                                    <Form.Select name="payment_status" defaultValue={currentOrder?.payment}>
                                        <option value="unpaid">Unpaid</option>
                                        <option value="partial">Partial</option>
                                        <option value="paid">Paid</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">{"notes"}</Form.Label>
                                    <Form.Control name="notes" as="textarea" rows={3} defaultValue={currentOrder?.notes} placeholder={"notes"} />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Order Items Section */}
                        {currentOrder?.items && currentOrder.items.length > 0 && (
                            <div className="mt-4">
                                <h5 className="fw-bold mb-3">{"sale_items"}</h5>
                                <div className="table-responsive">
                                    <Table bordered className="mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="py-2" style={{ width: '50%' }}>{"product_header"}</th>
                                                <th className="py-2" style={{ width: '15%' }}>{"quantity"}</th>
                                                <th className="py-2" style={{ width: '20%' }}>{"unit_price_header"}</th>
                                                <th className="py-2" style={{ width: '15%' }}>{"total_header"}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentOrder.items.map((item, index) => (
                                                <tr key={item.id || index}>
                                                    <td>
                                                        <div className="fw-medium">{item.product_name || item.product?.name || 'N/A'}</div>
                                                        <div className="text-muted small">{item.product_description || item.product?.description || ''}</div>
                                                    </td>
                                                    <td>{item.quantity}</td>
                                                    <td>{formatCurrency(item.unit_price)}</td>
                                                    <td>{formatCurrency(item.line_total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                                <div className="d-flex justify-content-end mt-3">
                                    <div className="text-end">
                                        <div className="d-flex justify-content-between" style={{ width: '200px' }}>
                                            <span className="text-muted">{"subtotal"}:</span>
                                            <span className="fw-medium">{formatCurrency(currentOrder.subtotal || 0)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between" style={{ width: '200px' }}>
                                            <span className="text-muted">{"tax_rate"}:</span>
                                            <span className="fw-medium">{formatCurrency(currentOrder.tax_amount || 0)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between" style={{ width: '200px' }}>
                                            <span className="text-muted">{"discount"}:</span>
                                            <span className="fw-medium">{formatCurrency(currentOrder.discount_amount || 0)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between" style={{ width: '200px' }}>
                                            <span className="text-muted fw-bold">{"total_header"}:</span>
                                            <span className="fw-bold text-primary">{formatCurrency(currentOrder.total_amount || 0)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button variant="light" onClick={handleClose} className="px-4">{"Close"}</Button>
                            <Button variant="primary" type="submit" className="px-4" disabled={isSaving}>
                                {isSaving ? "register_creating" : "save_sale"}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default SalesOrders;


