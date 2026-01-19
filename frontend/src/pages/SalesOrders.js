import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Dropdown } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEdit2, FiTrash2, FiEye, FiDownload, FiShoppingCart, FiClock, FiCheckCircle } from 'react-icons/fi';
import { salesAPI, customersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import { useI18n } from '../i18n/I18nProvider';

const SalesOrders = () => {
    const { t } = useI18n();
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
                {t('delete_sale_confirm')}
                <div className="mt-2 d-flex gap-2">
                    <Button size="sm" variant="danger" onClick={async () => {
                        try {
                            await salesAPI.deleteOrder(id); // Assuming there's a delete endpoint
                            setOrders(orders.filter(ord => ord.id !== id));
                            toast.dismiss(toastItem.id);
                            toast.success(t('sale_deleted'));
                        } catch (err) {
                            toast.dismiss(toastItem.id);
                            toast.error(t('register_failed'));
                            console.error('Error deleting sale:', err);
                        }
                    }}>
                        {t('delete_sale')}
                    </Button>
                    <Button size="sm" variant="light" onClick={() => toast.dismiss(toastItem.id)}>
                        {t('cancel')}
                    </Button>
                </div>
            </span>
        ), { duration: 3000 });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const orderData = {
            customer_id: parseInt(formData.get('customer_id')),
            order_date: formData.get('order_date'),
            status: formData.get('status').toUpperCase(),
            notes: formData.get('notes')
        };

        setIsSaving(true);
        try {
            if (currentOrder) {
                // Update existing order
                await salesAPI.updateOrder(currentOrder.id, orderData);
                toast.success(t('sale_updated'));
            } else {
                // Create new order
                // Note: createOrder expects items, which are not yet handled in this modal
                // For now, we'll just send the basic info
                await salesAPI.createOrder({ ...orderData, items: [] });
                toast.success(t('sale_created'));
            }
            fetchOrders(); // Refresh the list
            handleClose();
        } catch (err) {
            const errorMsg = err.response?.data?.error || t('register_failed');
            toast.error(errorMsg);
            console.error('Error saving sale:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await salesAPI.exportOrders();
            toast.success(response.data.message || t('export_success'));
            console.log('Export response:', response.data);
        } catch (err) {
            toast.error(t('export_failed'));
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
            case 'pending': return <Badge bg="warning" text="dark" className="fw-normal">{t('status_pending')}</Badge>;
            case 'confirmed': return <Badge bg="info" className="fw-normal">{t('status_confirmed')}</Badge>;
            case 'processing': return <Badge bg="primary" className="fw-normal">{t('status_processing')}</Badge>;
            case 'shipped': return <Badge bg="secondary" className="fw-normal">{t('status_shipped')}</Badge>;
            case 'delivered': return <Badge bg="success" className="fw-normal">{t('status_delivered')}</Badge>;
            case 'cancelled': return <Badge bg="danger" className="fw-normal">{t('status_cancelled')}</Badge>;
            default: return <Badge bg="secondary" className="fw-normal">{status}</Badge>;
        }
    };

    const getPaymentBadge = (payment) => {
        if (!payment) return null;
        const p = payment.toLowerCase();
        switch (p) {
            case 'paid': return <Badge pill bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25">{t('payment_paid')}</Badge>;
            case 'partial': return <Badge pill bg="warning" className="bg-opacity-10 text-warning border border-warning border-opacity-25">{t('payment_partial')}</Badge>;
            case 'unpaid': return <Badge pill bg="danger" className="bg-opacity-10 text-danger border border-danger border-opacity-25">{t('payment_unpaid')}</Badge>;
            default: return null;
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
                    <h2 className="fw-bold text-dark mb-1">{t('sales_orders_title')}</h2>
                    <p className="text-muted mb-0">{t('sales_orders_subtitle')}</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-secondary" className="d-flex align-items-center" onClick={handleExport}>
                        <FiDownload className="me-2" /> {t('export')}
                    </Button>
                    <Button variant="primary" className="d-flex align-items-center" onClick={() => {
                        setCurrentOrder(null);
                        setShowModal(true);
                    }}>
                        <FiPlus className="me-2" /> {t('new_sale')}
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
                                    <FiShoppingCart className="text-primary" size={20} />
                                </div>
                                <span className="text-muted fw-medium">{t('total_sales')}</span>
                            </div>
                            <h3 className="fw-bold mb-0">{orders.length}</h3>
                            <small className="text-success fw-medium">+8% from last month</small>
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
                                <span className="text-muted fw-medium">{t('pending_sales')}</span>
                            </div>
                            <h3 className="fw-bold mb-0">{orders.filter(o => o.status?.toLowerCase() === 'pending' || o.status?.toLowerCase() === 'processing').length}</h3>
                            <small className="text-muted">{t('status_pending')}</small>
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
                                <span className="text-muted fw-medium">{t('completed_sales')}</span>
                            </div>
                            <h3 className="fw-bold mb-0">{orders.filter(o => o.status?.toLowerCase() === 'delivered').length}</h3>
                            <small className="text-muted">{t('status_delivered')}</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                                    <FiShoppingCart className="text-info" size={20} />
                                </div>
                                <span className="text-muted fw-medium">{t('total_revenue')}</span>
                            </div>
                            <h3 className="fw-bold mb-0">{formatCurrency(orders.reduce((acc, curr) => acc + (curr.amount || curr.total_amount || 0), 0))}</h3>
                            <small className="text-muted">{t('total_revenue')}</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

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
                                    placeholder={t('search_sales_placeholder')}
                                    className="bg-light border-start-0 ps-0"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </div>
                        <div className="d-flex gap-2">
                            <Button variant="outline-light" className="text-dark border d-flex align-items-center">
                                <FiFilter className="me-2" /> {t('filter')}
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0 py-3 ps-4">{t('sale_id')}</th>
                                    <th className="border-0 py-3">{t('customer')}</th>
                                    <th className="border-0 py-3">{t('sale_date')}</th>
                                    <th className="border-0 py-3">{t('total_header')}</th>
                                    <th className="border-0 py-3">{t('status')}</th>
                                    <th className="border-0 py-3">{t('payment_status')}</th>
                                    <th className="border-0 py-3 text-end pe-4">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(order => (
                                    <tr key={order.id}>
                                        <td className="ps-4">
                                            <div className="fw-bold text-primary">{order.orderId || order.order_id}</div>
                                            <div className="small text-muted">{order.items?.length || order.items || 0} {t('cart_items')}</div>
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
                                            <Dropdown align="end">
                                                <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                                                    <FiMoreVertical size={20} />
                                                </Dropdown.Toggle>

                                                <Dropdown.Menu className="border-0 shadow-sm">
                                                    <Dropdown.Item onClick={() => handleView(order)} className="d-flex align-items-center py-2">
                                                        <FiEye className="me-2 text-muted" /> {t('view_details')}
                                                    </Dropdown.Item>
                                                    <Dropdown.Item onClick={() => handleView(order)} className="d-flex align-items-center py-2">
                                                        <FiEdit2 className="me-2 text-muted" /> {t('edit_sale')}
                                                    </Dropdown.Item>
                                                    <Dropdown.Divider />
                                                    <Dropdown.Item className="d-flex align-items-center py-2 text-danger" onClick={() => handleDelete(order.id)}>
                                                        <FiTrash2 className="me-2" /> {t('delete_sale')}
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

            {/* Order Modal */}
            <Modal show={showModal} onHide={handleClose} centered size="lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">{currentOrder ? `${t('sale_details')}: ${currentOrder.orderId || currentOrder.order_id}` : t('create_new_sale')}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-4">
                    <Form onSubmit={handleSave}>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">{t('customer')}</Form.Label>
                                    <Form.Select name="customer_id" defaultValue={currentOrder?.customer_id} required>
                                        <option value="">{t('select_customer_error')}</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.first_name} {c.last_name} {c.company && `(${c.company})`}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">{t('sale_date')}</Form.Label>
                                    <Form.Control type="date" name="order_date" defaultValue={currentOrder?.date || (currentOrder?.order_date ? currentOrder.order_date.split('T')[0] : '')} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">{t('status')}</Form.Label>
                                    <Form.Select name="status" defaultValue={currentOrder?.status?.toLowerCase()}>
                                        <option value="pending">{t('status_pending')}</option>
                                        <option value="confirmed">{t('status_confirmed')}</option>
                                        <option value="processing">{t('status_processing')}</option>
                                        <option value="shipped">{t('status_shipped')}</option>
                                        <option value="delivered">{t('status_delivered')}</option>
                                        <option value="cancelled">{t('status_cancelled')}</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">{t('payment_status')}</Form.Label>
                                    <Form.Select name="payment_status" defaultValue={currentOrder?.payment}>
                                        <option value="unpaid">{t('payment_unpaid')}</option>
                                        <option value="partial">{t('payment_partial')}</option>
                                        <option value="paid">{t('payment_paid')}</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">{t('notes')}</Form.Label>
                                    <Form.Control name="notes" as="textarea" rows={3} defaultValue={currentOrder?.notes} placeholder={t('notes')} />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Order Items Section */}
                        {currentOrder?.items && currentOrder.items.length > 0 && (
                            <div className="mt-4">
                                <h5 className="fw-bold mb-3">{t('sale_items')}</h5>
                                <div className="table-responsive">
                                    <Table bordered className="mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="py-2" style={{ width: '50%' }}>{t('product_header')}</th>
                                                <th className="py-2" style={{ width: '15%' }}>{t('quantity')}</th>
                                                <th className="py-2" style={{ width: '20%' }}>{t('unit_price_header')}</th>
                                                <th className="py-2" style={{ width: '15%' }}>{t('total_header')}</th>
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
                                            <span className="text-muted">{t('subtotal')}:</span>
                                            <span className="fw-medium">{formatCurrency(currentOrder.subtotal || 0)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between" style={{ width: '200px' }}>
                                            <span className="text-muted">{t('tax_rate')}:</span>
                                            <span className="fw-medium">{formatCurrency(currentOrder.tax_amount || 0)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between" style={{ width: '200px' }}>
                                            <span className="text-muted">{t('discount')}:</span>
                                            <span className="fw-medium">{formatCurrency(currentOrder.discount_amount || 0)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between" style={{ width: '200px' }}>
                                            <span className="text-muted fw-bold">{t('total_header')}:</span>
                                            <span className="fw-bold text-primary">{formatCurrency(currentOrder.total_amount || 0)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button variant="light" onClick={handleClose} className="px-4">{t('close')}</Button>
                            <Button variant="primary" type="submit" className="px-4" disabled={isSaving}>
                                {isSaving ? t('register_creating') : t('save_sale')}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default SalesOrders;
