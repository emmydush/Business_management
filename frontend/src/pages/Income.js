import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, InputGroup, Form, Badge, Alert } from 'react-bootstrap';
import { FiTrendingUp, FiSearch, FiFilter, FiDollarSign, FiCalendar, FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';
import { salesAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';

const Income = () => {
    const { formatCurrency } = useCurrency();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchIncome();
    }, []);

    const fetchIncome = async () => {
        try {
            setLoading(true);
            const response = await salesAPI.getOrders();
            // Filter for completed/paid orders as income
            const completedOrders = (response.data.orders || []).filter(o =>
                ['COMPLETED', 'SHIPPED', 'DELIVERED'].includes(o.status)
            );
            setOrders(completedOrders);
            setError(null);
        } catch (err) {
            setError('Failed to fetch income data.');
        } finally {
            setLoading(false);
        }
    };

    const totalIncome = orders.reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);
    const averageOrder = orders.length > 0 ? totalIncome / orders.length : 0;

    const filteredOrders = orders.filter(order =>
        order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer && `${order.customer.first_name} ${order.customer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
        <div className="income-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Income / Revenue</h2>
                    <p className="text-muted mb-0">Monitor your business revenue and cash inflows.</p>
                </div>
                <Button variant="outline-primary" className="d-flex align-items-center mt-3 mt-md-0" onClick={fetchIncome}>
                    <FiTrendingUp className="me-2" /> Refresh Data
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="g-4 mb-4">
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                                    <FiDollarSign className="text-success" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Total Revenue</span>
                            </div>
                            <h3 className="fw-bold mb-0">{formatCurrency(totalIncome)}</h3>
                            <div className="text-success small mt-2 fw-medium">
                                <FiArrowUpRight className="me-1" /> +12.5% from last month
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                                    <FiTrendingUp className="text-primary" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Average Sale</span>
                            </div>
                            <h3 className="fw-bold mb-0">{formatCurrency(averageOrder)}</h3>
                            <small className="text-muted">Per completed order</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                                    <FiCalendar className="text-info" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Total Transactions</span>
                            </div>
                            <h3 className="fw-bold mb-0">{orders.length}</h3>
                            <small className="text-muted">Completed sales</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <div className="p-3 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                        <InputGroup style={{ maxWidth: '400px' }}>
                            <InputGroup.Text className="bg-light border-0">
                                <FiSearch className="text-muted" />
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Search by order ID or customer..."
                                className="bg-light border-0 ps-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                        <Button variant="outline-light" className="text-dark border d-flex align-items-center">
                            <FiFilter className="me-2" /> Filter Period
                        </Button>
                    </div>

                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0 py-3 ps-4">Order ID</th>
                                    <th className="border-0 py-3">Customer</th>
                                    <th className="border-0 py-3">Date</th>
                                    <th className="border-0 py-3">Amount</th>
                                    <th className="border-0 py-3">Status</th>
                                    <th className="border-0 py-3 text-end pe-4">Method</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(order => (
                                    <tr key={order.id}>
                                        <td className="ps-4 fw-bold text-primary">{order.order_id}</td>
                                        <td>
                                            <div className="fw-medium text-dark">
                                                {order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'Walk-in Customer'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-muted small">{order.order_date}</div>
                                        </td>
                                        <td>
                                            <div className="fw-bold text-success">{formatCurrency(order.total_amount)}</div>
                                        </td>
                                        <td>
                                            <Badge bg="success" className="fw-normal">Paid</Badge>
                                        </td>
                                        <td className="text-end pe-4">
                                            <span className="small text-muted">Bank Transfer</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Income;
