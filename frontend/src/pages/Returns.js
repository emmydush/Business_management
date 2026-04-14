import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, ListGroup } from 'react-bootstrap';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye, FiRotateCcw, FiCheckCircle, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { returnsAPI, salesAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';
import PermissionGuard from '../components/PermissionGuard';

const Returns = () => {
    const [returns, setReturns] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentReturn, setCurrentReturn] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [salesOrderSearch, setSalesOrderSearch] = useState('');
    const [salesOrders, setSalesOrders] = useState([]);
    const [showOrderDropdown, setShowOrderDropdown] = useState(false);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    const { formatCurrency } = useCurrency();

    useEffect(() => {
        fetchReturns();
    }, []);

    const loadAllOrders = async () => {
        try {
            setIsLoadingOrders(true);
            const response = await salesAPI.getOrders({ limit: 20 });
            const orders = response.data.orders || [];
            setSalesOrders(orders);
            setShowOrderDropdown(orders.length > 0);
        } catch (err) {
            setSalesOrders([]);
            setShowOrderDropdown(false);
        } finally {
            setIsLoadingOrders(false);
        }
    };

    const searchSalesOrders = useCallback(async () => {
        try {
            setIsLoadingOrders(true);
            const response = await salesAPI.getOrders({
                search: salesOrderSearch,
                limit: 10
            });
            const orders = response.data.orders || [];
            setSalesOrders(orders);
            setShowOrderDropdown(orders.length > 0);
        } catch (err) {
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
        setSalesOrderSearch(`${order.order_id} - ${order.customer_name || (order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'Unknown Customer')}`);
        setShowOrderDropdown(false);
        const customerName = order.customer_name || (order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'Unknown Customer');
        setSelectedCustomer(customerName);
        setSelectedOrderId(order.id);
    };

    const fetchReturns = async () => {
        try {
            const response = await returnsAPI.getReturns();
            setReturns(response.data.returns || []);
        } catch (err) {
            console.error('Error fetching returns:', err);
        }
    };

    const handleView = (ret) => {
        setCurrentReturn(ret);
        setShowModal(true);
    };

    const handleEdit = (ret) => {
        setCurrentReturn(ret);
        setSelectedCustomer(ret.customer || '');
        setSelectedOrderId(ret.order_id || null);
        setSalesOrderSearch(ret.order_id ? `${ret.order_id} - ${ret.customer}` : '');
        setShowModal(true);
    };

    const handleDelete = (id) => {
        toast((t) => (
            <div className="p-1">
                <p className="mb-2 fw-bold">Delete return record?</p>
                <div className="d-flex gap-2 justify-content-end">
                    <Button size="sm" variant="danger" className="rounded-pill px-3" onClick={async () => {
                        try {
                            await returnsAPI.deleteReturn(id);
                            setReturns(returns.filter(r => r.id !== id));
                            toast.dismiss(t.id);
                            toast.success('Return deleted');
                        } catch (err) {
                            toast.error('Failed to delete');
                        }
                    }}>Delete</Button>
                    <Button size="sm" variant="light" className="rounded-pill px-3" onClick={() => toast.dismiss(t.id)}>Cancel</Button>
                </div>
            </div>
        ));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedOrderId) {
            toast.error('Please select an order');
            return;
        }

        const formData = new FormData(e.target);
        const refundAmount = parseFloat(formData.get('refund_amount')) || 0;
        const selectedOrder = salesOrders.find(order => order.id === selectedOrderId);
        
        if (!selectedOrder) {
            toast.error('Order not found');
            return;
        }

        const firstOrderItem = selectedOrder.items && selectedOrder.items[0];
        let customerId = selectedOrder.customer?.id || selectedOrder.customer_id;

        const returnData = {
            order_id: selectedOrderId,
            ...(customerId && { customer_id: customerId }),
            return_date: formData.get('return_date') ? new Date(formData.get('return_date')).toISOString().split('T')[0] : null,
            status: formData.get('status'),
            reason: formData.get('reason'),
            refund_amount: refundAmount,
            total_amount: refundAmount,
            notes: formData.get('notes'),
            items: [
                {
                    product_id: firstOrderItem?.product_id,
                    quantity: 1,
                    unit_price: refundAmount,
                    reason: formData.get('reason')
                }
            ]
        };

        setIsSaving(true);
        try {
            if (currentReturn) {
                await returnsAPI.updateReturn(currentReturn.id, returnData);
                toast.success('Updated successfully');
            } else {
                await returnsAPI.createReturn(returnData);
                toast.success('Return initiated');
            }
            fetchReturns();
            handleClose();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save');
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
        setSelectedOrderId(null);
    };

    const filteredReturns = returns.filter(ret =>
        (ret.returnId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ret.customer || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status) => {
        const s = (status || '').toLowerCase();
        switch (s) {
            case 'processed':
            case 'completed': return { bg: '#dcfce7', color: '#166534', label: 'Processed' };
            case 'pending': return { bg: '#fef3c7', color: '#92400e', label: 'Pending' };
            case 'approved': return { bg: '#dbeafe', color: '#1e40af', label: 'Approved' };
            case 'rejected': return { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' };
            case 'processing': return { bg: '#ede9fe', color: '#5b21b6', label: 'Processing' };
            default: return { 
                bg: status ? '#f3f4f6' : '#fee2e2', 
                color: status ? '#111827' : '#991b1b', 
                label: status || 'Unknown' 
            };
        }
    };

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
            className="returns-wrapper p-4"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 mt-4">
                <motion.div variants={itemVariants}>
                    <h1 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.02em' }}>Sales Returns</h1>
                    <p className="text-muted mb-0">Manage customer returns and reverse inventory movements.</p>
                </motion.div>
                <motion.div variants={itemVariants} className="d-flex gap-2">
                    <Button variant="light" className="px-4 py-2 border-0 shadow-sm rounded-4 fw-bold" onClick={() => fetchReturns()}>
                         <FiRotateCcw className="me-2" /> Refresh
                    </Button>
                    <PermissionGuard module="returns" action="create">
                        <Button variant="dark" className="px-4 py-2 border-0 shadow-sm rounded-4 fw-bold" onClick={() => setShowModal(true)}>
                             <FiPlus className="me-2" /> New Return
                        </Button>
                    </PermissionGuard>
                </motion.div>
            </div>

            <Row className="g-4 mb-5">
                {[
                    { label: 'Returns This Month', value: returns.length, icon: FiRotateCcw, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
                    { label: 'Awaiting Action', value: returns.filter(r => ['pending', 'processing'].includes(r.status?.toLowerCase())).length, icon: FiPackage, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
                    { label: 'Total Refunded', value: formatCurrency(returns.reduce((acc, r) => acc + (r.amount || r.total_amount || 0), 0)), icon: FiCheckCircle, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' }
                ].map((stat, idx) => (
                    <Col md={4} key={idx}>
                        <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
                            <Card className="border-0 shadow-sm" style={{ borderRadius: '24px' }}>
                                <Card.Body className="p-4 d-flex align-items-center">
                                    <div className="p-3 rounded-4 me-4" style={{ backgroundColor: stat.bg }}>
                                        <stat.icon style={{ color: stat.color }} size={24} />
                                    </div>
                                    <div>
                                        <div className="text-muted small fw-bold text-uppercase mb-1">{stat.label}</div>
                                        <h3 className="fw-bold mb-0">{stat.value}</h3>
                                    </div>
                                </Card.Body>
                            </Card>
                        </motion.div>
                    </Col>
                ))}
            </Row>

            <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="p-4 border-bottom bg-white d-flex justify-content-between align-items-center">
                        <InputGroup className="bg-light rounded-pill overflow-hidden border-0" style={{ maxWidth: '400px' }}>
                            <InputGroup.Text className="bg-light border-0 ps-3">
                                <FiSearch className="text-muted" />
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Search returns..."
                                className="bg-light border-0 py-2 shadow-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                        <div className="text-muted small fw-medium">Showing {filteredReturns.length} records</div>
                    </div>

                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0 py-4 ps-4 text-muted small text-uppercase">Return Ref</th>
                                    <th className="border-0 py-4 text-muted small text-uppercase">Customer</th>
                                    <th className="border-0 py-4 text-muted small text-uppercase">Invoice</th>
                                    <th className="border-0 py-4 text-muted small text-uppercase">Amount</th>
                                    <th className="border-0 py-4 text-muted small text-uppercase">Status</th>
                                    <th className="border-0 py-4 pe-4 text-end text-muted small text-uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {filteredReturns.length > 0 ? (
                                        filteredReturns.map((ret, index) => {
                                            const status = getStatusStyle(ret.status);
                                            return (
                                                <motion.tr 
                                                    key={ret.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="border-bottom"
                                                >
                                                    <td className="ps-4">
                                                        <div className="fw-bold">{ret.returnId || `#${ret.id}`}</div>
                                                        <div className="text-muted x-small">{ret.date}</div>
                                                    </td>
                                                    <td className="fw-semibold">{ret.customer}</td>
                                                    <td className="text-muted small">{ret.invoiceId}</td>
                                                    <td className="fw-bold text-dark">{formatCurrency(ret.amount || ret.total_amount || 0)}</td>
                                                    <td>
                                                        <Badge pill 
                                                            style={{ 
                                                                backgroundColor: status.bg, 
                                                                color: status.color, 
                                                                fontWeight: '700', 
                                                                fontSize: '0.8rem',
                                                                padding: '6px 12px',
                                                                minWidth: '80px',
                                                                textAlign: 'center',
                                                                border: `1px solid ${status.color}20`,
                                                                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                                            }}
                                                        >
                                                            {status.label ? status.label.toUpperCase() : 'NO STATUS'}
                                                        </Badge>
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        <div className="d-flex gap-2 justify-content-end">
                                                        <Button variant="outline-primary" size="sm" className="d-flex align-items-center" onClick={() => handleView(ret)} title="View Details">
                                                            <FiEye size={16} />
                                                        </Button>
                                                        <PermissionGuard module="returns" action="edit">
                                                            <Button variant="outline-warning" size="sm" className="d-flex align-items-center" onClick={() => handleEdit(ret)} title="Edit">
                                                                <FiEdit2 size={16} />
                                                            </Button>
                                                        </PermissionGuard>
                                                        <PermissionGuard module="returns" action="delete">
                                                            <Button variant="outline-danger" size="sm" className="d-flex align-items-center" onClick={() => handleDelete(ret.id)} title="Delete">
                                                                <FiTrash2 size={16} />
                                                            </Button>
                                                        </PermissionGuard>
                                                    </div>
                                                </td>
                                                </motion.tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5">
                                                <FiRotateCcw size={48} className="text-muted opacity-25 mb-3" />
                                                <p className="text-muted">No return records found.</p>
                                            </td>
                                        </tr>
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </Table>
                    </div>
                </Card>
            </motion.div>

            {/* Modernized Modal */}
            <Modal show={showModal} onHide={handleClose} centered size="lg" className="custom-modern-modal">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Modal.Header closeButton className="border-0 px-4 pt-4">
                        <Modal.Title className="fw-bold fs-4">
                            {currentReturn ? `Return Record: ${currentReturn.returnId}` : 'Initiate New Return'}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="px-4 pb-4">
                        <Form onSubmit={handleSave}>
                            <div className="p-4 bg-light rounded-4 mb-4 border">
                                <Form.Group className="mb-0">
                                    <Form.Label className="small text-muted fw-bold text-uppercase">Step 1: Link Sales Order</Form.Label>
                                    <div className="position-relative mt-2">
                                        <Form.Control
                                            type="text"
                                            placeholder="Type order ID, customer name, or invoice number..."
                                            value={salesOrderSearch}
                                            onChange={(e) => setSalesOrderSearch(e.target.value)}
                                            onFocus={() => salesOrders.length > 0 && setShowOrderDropdown(true)}
                                            className="py-3 bg-white border-0 shadow-none px-3"
                                            style={{ borderRadius: '12px' }}
                                        />
                                        <Button
                                            variant="light"
                                            size="sm"
                                            className="position-absolute end-0 top-50 translate-middle-y me-2 rounded-3"
                                            onClick={loadAllOrders}
                                            disabled={isLoadingOrders}
                                        >
                                            {isLoadingOrders ? '...' : 'Show All'}
                                        </Button>
                                        <AnimatePresence>
                                            {showOrderDropdown && salesOrders.length > 0 && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 5 }}
                                                    className="position-absolute w-100 bg-white border rounded-4 shadow-lg mt-2 overflow-hidden" 
                                                    style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}
                                                >
                                                    <ListGroup variant="flush">
                                                        {salesOrders.map((order) => (
                                                            <ListGroup.Item
                                                                key={order.id}
                                                                action
                                                                onClick={() => handleSalesOrderSelect(order)}
                                                                className="py-3 px-4 border-bottom"
                                                            >
                                                                <div className="d-flex justify-content-between">
                                                                    <div className="fw-bold text-dark">{order.order_id}</div>
                                                                    <div className="text-primary small fw-semibold">{order.invoice_id}</div>
                                                                </div>
                                                                <div className="text-muted small">
                                                                    {order.customer_name || (order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'Walk-in Customer')}
                                                                </div>
                                                            </ListGroup.Item>
                                                        ))}
                                                    </ListGroup>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </Form.Group>
                            </div>

                            {selectedOrderId && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    <Row className="g-3 mb-4">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="small text-muted fw-bold">CUSTOMER</Form.Label>
                                                <Form.Control type="text" value={selectedCustomer} disabled className="bg-light border-0 py-2 rounded-3" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="small text-muted fw-bold">DATE</Form.Label>
                                                <Form.Control type="date" name="return_date" defaultValue={new Date().toISOString().split('T')[0]} className="bg-light border-0 py-2 rounded-3" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="small text-muted fw-bold">REASON FOR RETURN</Form.Label>
                                                <Form.Control as="textarea" rows={2} name="reason" placeholder="Why is this being returned?" className="bg-light border-0 py-3 rounded-4" required />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="small text-muted fw-bold">REFUND AMOUNT</Form.Label>
                                                <Form.Control type="number" step="0.01" name="refund_amount" className="bg-light border-0 py-2 rounded-3 fw-bold" required />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="small text-muted fw-bold">STATUS</Form.Label>
                                                <Form.Select name="status" className="bg-light border-0 py-2 rounded-3">
                                                    <option value="pending">Pending Review</option>
                                                    <option value="approved">Approved</option>
                                                    <option value="processed">Processed (Stock Updated)</option>
                                                    <option value="rejected">Rejected</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <div className="d-flex justify-content-end gap-2">
                                        <Button variant="light" onClick={handleClose} className="px-4 py-2 border-0 rounded-3">Cancel</Button>
                                        <Button variant="dark" type="submit" className="px-4 py-2 border-0 rounded-3 fw-bold" disabled={isSaving}>
                                            {isSaving ? 'Processing...' : 'Complete Return'}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </Form>
                    </Modal.Body>
                </motion.div>
            </Modal>

            <style>{`
                .returns-wrapper { background-color: #f8fafc; min-height: 100vh; }
                .custom-modern-modal .modal-content { border-radius: 28px; border: none; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.2); }
                .x-small { font-size: 0.65rem; }
            `}</style>
        </motion.div>
    );
};

export default Returns;

