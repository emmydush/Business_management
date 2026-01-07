import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Dropdown, Modal, Form } from 'react-bootstrap';
import { FiPlus, FiMoreVertical, FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { salesAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';

const EasySales = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const { formatCurrency } = useCurrency();

    useEffect(() => {
        fetchOrders();
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
                { id: 3, order_id: 'ORD0003', date: '2026-01-07', total_amount: 10000.00, status: 'pending', payment_status: 'unpaid', items: 0 },
                { id: 2, order_id: 'ORD0002', date: '2026-01-07', total_amount: 10800.00, status: 'pending', payment_status: 'unpaid', items: 0 },
                { id: 1, order_id: 'ORD0001', date: '2026-01-07', total_amount: 5400.00, status: 'pending', payment_status: 'unpaid', items: 0 }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return <Badge bg="warning" text="dark" className="fw-normal">Pending</Badge>;
            case 'confirmed': return <Badge bg="info" className="fw-normal">Confirmed</Badge>;
            case 'processing': return <Badge bg="primary" className="fw-normal">Processing</Badge>;
            case 'shipped': return <Badge bg="secondary" className="fw-normal">Shipped</Badge>;
            case 'delivered': return <Badge bg="success" className="fw-normal">Delivered</Badge>;
            case 'cancelled': return <Badge bg="danger" className="fw-normal">Cancelled</Badge>;
            default: return <Badge bg="secondary" className="fw-normal">{status}</Badge>;
        }
    };

    const getPaymentBadge = (payment_status) => {
        switch (payment_status) {
            case 'paid': return <Badge pill bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25">Paid</Badge>;
            case 'partial': return <Badge pill bg="warning" className="bg-opacity-10 text-warning border border-warning border-opacity-25">Partial</Badge>;
            case 'unpaid': return <Badge pill bg="danger" className="bg-opacity-10 text-danger border border-danger border-opacity-25">Unpaid</Badge>;
            default: return <Badge pill bg="secondary" className="bg-opacity-10 text-secondary border border-secondary border-opacity-25">Unknown</Badge>;
        }
    };

    const handleDelete = (id) => {
        toast((t) => (
            <span>
                Delete order?
                <div className="mt-2 d-flex gap-2">
                    <Button size="sm" variant="danger" onClick={async () => {
                        try {
                            await salesAPI.deleteOrder(id);
                            setOrders(orders.filter(ord => ord.id !== id));
                            toast.dismiss(t.id);
                            toast.success('Order deleted');
                        } catch (err) {
                            toast.dismiss(t.id);
                            toast.error('Failed to delete order');
                            console.error('Error deleting order:', err);
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

    const handleEdit = (order) => {
        setCurrentOrder({
            ...order,
            status: order.status || 'pending',
            payment_status: order.payment_status || 'unpaid'
        });
        setShowEditModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const updatedData = {
            status: formData.get('status'),
            payment_status: formData.get('payment_status'),
            notes: formData.get('notes')
        };
        
        setIsSaving(true);
        try {
            await salesAPI.updateOrder(currentOrder.id, updatedData);
            toast.success('Order updated successfully!');
            
            // Update the order in the local state
            setOrders(orders.map(order => 
                order.id === currentOrder.id 
                    ? { ...order, ...updatedData }
                    : order
            ));
            
            setShowEditModal(false);
            setCurrentOrder(null);
        } catch (err) {
            console.error('Error updating order:', err);
            toast.error('Failed to update order');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCloseModal = () => {
        setShowEditModal(false);
        setCurrentOrder(null);
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
        <Container fluid className="py-4">
            <div className="mb-4">
                <h2 className="fw-bold text-dark mb-1">Sales Orders</h2>
                <p className="text-muted mb-0">Track and manage customer purchase orders.</p>
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold">All Orders</h5>
                        <Button variant="primary" className="d-flex align-items-center">
                            <FiPlus className="me-2" /> New Order
                        </Button>
                    </div>

                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0 py-3 ps-4">Order ID</th>
                                    <th className="border-0 py-3">Date</th>
                                    <th className="border-0 py-3">Amount</th>
                                    <th className="border-0 py-3">Status</th>
                                    <th className="border-0 py-3">Payment</th>
                                    <th className="border-0 py-3 text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id}>
                                        <td className="ps-4">
                                            <div className="fw-bold text-primary">{order.order_id}</div>
                                            <div className="small text-muted">{order.items || 0} items</div>
                                        </td>
                                        <td>
                                            <div className="text-muted small">{order.date}</div>
                                        </td>
                                        <td>
                                            <div className="fw-bold text-dark">{formatCurrency(order.total_amount || 0)}</div>
                                        </td>
                                        <td>
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td>
                                            {getPaymentBadge(order.payment_status)}
                                        </td>
                                        <td className="text-end pe-4">
                                            <Dropdown align="end">
                                                <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                                                    <FiMoreVertical size={20} />
                                                </Dropdown.Toggle>

                                                <Dropdown.Menu className="border-0 shadow-sm">
                                                    <Dropdown.Item className="d-flex align-items-center py-2">
                                                        <FiEye className="me-2 text-muted" /> View Details
                                                    </Dropdown.Item>
                                                    <Dropdown.Item onClick={() => handleEdit(order)} className="d-flex align-items-center py-2">
                                                        <FiEdit2 className="me-2 text-muted" /> Edit Order
                                                    </Dropdown.Item>
                                                    <Dropdown.Divider />
                                                    <Dropdown.Item 
                                                        className="d-flex align-items-center py-2 text-danger" 
                                                        onClick={() => handleDelete(order.id)}
                                                    >
                                                        <FiTrash2 className="me-2" /> Delete Order
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
            
            {/* Edit Order Modal */}
            <Modal show={showEditModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Edit Order</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleUpdate}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small">Order ID</Form.Label>
                            <Form.Control 
                                type="text" 
                                value={currentOrder?.order_id || ''} 
                                readOnly 
                                disabled
                            />
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small">Status</Form.Label>
                            <Form.Select name="status" defaultValue={currentOrder?.status} required>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </Form.Select>
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small">Payment Status</Form.Label>
                            <Form.Select name="payment_status" defaultValue={currentOrder?.payment_status} required>
                                <option value="unpaid">Unpaid</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                            </Form.Select>
                        </Form.Group>
                        
                        <Form.Group>
                            <Form.Label className="fw-semibold small">Notes</Form.Label>
                            <Form.Control 
                                as="textarea" 
                                rows={3} 
                                name="notes" 
                                placeholder="Order notes..."
                                defaultValue={currentOrder?.notes || ''}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-0">
                        <Button variant="light" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={isSaving}>
                            {isSaving ? 'Updating...' : 'Update Order'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default EasySales;