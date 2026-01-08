import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Dropdown, Modal, Form } from 'react-bootstrap';
import { FiMoreVertical, FiEdit2, FiTrash2, FiPlus, FiSearch } from 'react-icons/fi';
import { salesAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import toast from 'react-hot-toast';

const EasySales = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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
            console.error('Error fetching sales:', err);
            // Fallback to mock data
            setOrders([
                { id: 1, order_id: 'S0001', customer: 'John Doe', date: '2025-12-15', total_amount: 1250.00, status: 'delivered', payment_status: 'paid' },
                { id: 2, order_id: 'S0002', customer: 'Jane Smith', date: '2025-12-18', total_amount: 890.50, status: 'shipped', payment_status: 'partial' },
                { id: 3, order_id: 'S0003', customer: 'Robert Johnson', date: '2025-12-20', total_amount: 2100.00, status: 'processing', payment_status: 'unpaid' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const s = status?.toLowerCase();
        switch (s) {
            case 'pending': return <Badge bg="warning" text="dark">Pending</Badge>;
            case 'confirmed': return <Badge bg="info">Confirmed</Badge>;
            case 'processing': return <Badge bg="primary">Processing</Badge>;
            case 'shipped': return <Badge bg="secondary">Shipped</Badge>;
            case 'delivered': return <Badge bg="success">Delivered</Badge>;
            case 'cancelled': return <Badge bg="danger">Cancelled</Badge>;
            default: return <Badge bg="secondary">{status}</Badge>;
        }
    };

    const getPaymentBadge = (status) => {
        const s = status?.toLowerCase();
        switch (s) {
            case 'paid': return <Badge bg="success" className="bg-opacity-10 text-success border border-success">Paid</Badge>;
            case 'partial': return <Badge bg="warning" className="bg-opacity-10 text-warning border border-warning">Partial</Badge>;
            case 'unpaid': return <Badge bg="danger" className="bg-opacity-10 text-danger border border-danger">Unpaid</Badge>;
            default: return <Badge bg="secondary">{status}</Badge>;
        }
    };

    const handleEdit = (order) => {
        setCurrentOrder({
            ...order,
            status: order.status || 'pending',
            payment_status: order.payment_status || 'unpaid'
        });
        setShowEditModal(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete sale?')) {
            salesAPI.deleteOrder(id)
                .then(() => {
                    setOrders(orders.filter(o => o.id !== id));
                    toast.success('Sale deleted');
                })
                .catch(err => {
                    console.error('Error deleting sale:', err);
                    toast.error('Failed to delete sale');
                });
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const updatedData = {
            status: formData.get('status').toUpperCase(),
            payment_status: formData.get('payment_status'),
            notes: formData.get('notes')
        };

        setIsSaving(true);
        try {
            await salesAPI.updateOrder(currentOrder.id, updatedData);
            toast.success('Sale updated successfully!');

            // Refresh orders to get updated data
            fetchOrders();

            setShowEditModal(false);
            setCurrentOrder(null);
        } catch (err) {
            console.error('Error updating sale:', err);
            toast.error('Failed to update sale');
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

    const filteredOrders = orders.filter(order =>
        (order.order_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Container fluid className="py-4">
            <div className="mb-4">
                <h2 className="fw-bold text-dark mb-1">Sales</h2>
                <p className="text-muted mb-0">Track and manage customer sales.</p>
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white py-3 border-0">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold">All Sales</h5>
                        <div className="d-flex gap-2">
                            <div className="position-relative">
                                <FiSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                                <Form.Control
                                    type="text"
                                    placeholder="Search sales..."
                                    className="ps-5 bg-light border-0"
                                    style={{ width: '250px' }}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="primary" className="d-flex align-items-center">
                                <FiPlus className="me-2" /> New Sale
                            </Button>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body className="p-0">
                    <Table responsive hover className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="ps-4">Sale ID</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Payment</th>
                                <th className="text-end pe-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <tr key={order.id}>
                                    <td className="ps-4 fw-bold text-primary">{order.order_id}</td>
                                    <td>{order.customer}</td>
                                    <td>{order.date || order.order_date}</td>
                                    <td className="fw-bold">{formatCurrency(order.total_amount || order.amount || 0)}</td>
                                    <td>{getStatusBadge(order.status)}</td>
                                    <td>{getPaymentBadge(order.payment_status || order.payment)}</td>
                                    <td className="text-end pe-4">
                                        <Dropdown align="end">
                                            <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                                                <FiMoreVertical size={20} />
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="border-0 shadow-sm">
                                                <Dropdown.Item onClick={() => handleEdit(order)} className="d-flex align-items-center py-2">
                                                    <FiEdit2 className="me-2 text-muted" /> Edit Sale
                                                </Dropdown.Item>
                                                <Dropdown.Divider />
                                                <Dropdown.Item onClick={() => handleDelete(order.id)} className="d-flex align-items-center py-2 text-danger">
                                                    <FiTrash2 className="me-2" /> Delete Sale
                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Edit Order Modal */}
            <Modal show={showEditModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Edit Sale</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleUpdate}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small">Sale ID</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentOrder?.order_id || ''}
                                readOnly
                                disabled
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small">Status</Form.Label>
                            <Form.Select name="status" defaultValue={currentOrder?.status?.toLowerCase()} required>
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
                            <Form.Select name="payment_status" defaultValue={currentOrder?.payment_status?.toLowerCase()} required>
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
                                placeholder="Sale notes..."
                                defaultValue={currentOrder?.notes || ''}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-0">
                        <Button variant="light" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={isSaving}>
                            {isSaving ? 'Updating...' : 'Update Sale'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default EasySales;