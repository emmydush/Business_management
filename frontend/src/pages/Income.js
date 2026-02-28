import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, InputGroup, Form, Badge, Alert } from 'react-bootstrap';
import { FiTrendingUp, FiSearch, FiFilter, FiDollarSign, FiCalendar, FiArrowUpRight } from 'react-icons/fi';
import { salesAPI, expensesAPI, hrAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';

const Income = () => {
    const { formatCurrency } = useCurrency();
    const [orders, setOrders] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [payroll, setPayroll] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchIncome();
    }, []);

    const fetchIncome = async () => {
        try {
            setLoading(true);
            // Fetch orders, expenses, and payroll independently to handle errors separately
            let ordersData = [];
            let expensesData = [];
            let payrollData = [];
            let ordersError = null;
            let expensesError = null;
            let payrollError = null;
            
            try {
                const ordersResponse = await salesAPI.getOrders();
                ordersData = ordersResponse.data.orders || [];
            } catch (err) {
                console.error('Error fetching orders:', err);
                ordersError = err.response?.data?.error || 'Failed to fetch orders';
            }
            
            try {
                const expensesResponse = await expensesAPI.getExpenses();
                expensesData = expensesResponse.data.expenses || [];
            } catch (err) {
                console.error('Error fetching expenses:', err);
                expensesError = err.response?.data?.error || 'Failed to fetch expenses';
            }

            try {
                const payrollResponse = await hrAPI.getPayroll();
                payrollData = payrollResponse.data.payroll || [];
            } catch (err) {
                console.error('Error fetching payroll:', err);
                payrollError = err.response?.data?.error || 'Failed to fetch payroll';
            }

            // Filter for completed/paid orders as income
            // We use toUpperCase() to handle case sensitivity and include PENDING
            const completedOrders = ordersData.filter(o =>
                ['PENDING', 'COMPLETED', 'SHIPPED', 'DELIVERED', 'CONFIRMED', 'PROCESSING'].includes(o.status?.toUpperCase())
            );

            // Filter for approved/paid expenses
            const approvedExpenses = expensesData.filter(e =>
                ['APPROVED', 'PAID'].includes(e.status?.toUpperCase())
            );

            // Filter for paid payroll
            const paidPayroll = payrollData.filter(p =>
                ['PAID', 'DISBURSED'].includes(p.status?.toUpperCase())
            );

            setOrders(completedOrders);
            setExpenses(approvedExpenses);
            setPayroll(paidPayroll);
            
            // Set error message only if all failed, otherwise show partial data
            const allFailed = ordersError && expensesError && payrollError;
            if (allFailed) {
                setError('Failed to fetch financial data. Please check your permissions.');
            } else if (ordersError) {
                setError('Warning: Could not load orders data. ' + ordersError);
            } else if (expensesError) {
                setError('Warning: Could not load expenses data. ' + expensesError);
            } else if (payrollError) {
                setError('Warning: Could not load payroll data. ' + payrollError);
            } else {
                setError(null);
            }
        } catch (err) {
            console.error('Error fetching financial data:', err);
            setError('Failed to fetch financial data. Please check your permissions.');
        } finally {
            setLoading(false);
        }
    };

    const totalIncome = orders.reduce((acc, curr) => acc + parseFloat(curr.total_amount || 0), 0);
    const totalCost = orders.reduce((acc, curr) => acc + parseFloat(curr.total_cost || 0), 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
    const totalSalary = payroll.reduce((acc, curr) => acc + parseFloat(curr.gross_pay || 0), 0);
    const totalGrossProfit = totalIncome - totalCost;
    const totalOperatingExpenses = totalExpenses + totalSalary;
    const netProfit = totalGrossProfit - totalOperatingExpenses;

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

            {error && (
                <Alert
                    variant={error.startsWith('Warning') ? 'warning' : 'danger'}
                    className="border-0 shadow-sm d-flex flex-column flex-md-row align-items-start gap-2"
                >
                    <div className="me-2 mt-1">
                        <FiTrendingUp className={error.startsWith('Warning') ? 'text-warning' : 'text-danger'} size={18} />
                    </div>
                    <div>
                        <div className="fw-bold mb-1">
                            {error === 'Failed to fetch financial data. Please check your permissions.'
                                ? 'Failed to fetch financial data'
                                : 'Financial data notice'}
                        </div>
                        <div className="small text-muted">
                            {error === 'Failed to fetch financial data. Please check your permissions.'
                                ? 'We could not load your income, expenses, and payroll data. Please make sure you have access to the Sales, Expenses, and HR modules or contact your administrator.'
                                : error}
                        </div>
                    </div>
                </Alert>
            )}

            <Row className="g-4 mb-4">
                <Col md={2}>
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
                <Col md={2}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                                    <FiDollarSign className="text-warning" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Cost of Goods</span>
                            </div>
                            <h3 className="fw-bold mb-0">{formatCurrency(totalCost)}</h3>
                            <div className="text-muted small mt-2">
                                Direct costs
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={2}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                                    <FiTrendingUp className="text-primary" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Gross Profit</span>
                            </div>
                            <h3 className="fw-bold mb-0" style={{ color: totalGrossProfit >= 0 ? '#28a745' : '#dc3545' }}>
                                {formatCurrency(totalGrossProfit)}
                            </h3>
                            <div className="text-success small mt-2 fw-medium">
                                <FiArrowUpRight className="me-1" /> {totalIncome > 0 ? ((totalGrossProfit / totalIncome) * 100).toFixed(1) : 0}% margin
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={2}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-danger bg-opacity-10 p-2 rounded me-3">
                                    <FiDollarSign className="text-danger" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Expenses</span>
                            </div>
                            <h3 className="fw-bold mb-0">{formatCurrency(totalExpenses)}</h3>
                            <div className="text-muted small mt-2">
                                Operating costs
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={2}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-secondary bg-opacity-10 p-2 rounded me-3">
                                    <FiDollarSign className="text-secondary" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Salary</span>
                            </div>
                            <h3 className="fw-bold mb-0">{formatCurrency(totalSalary)}</h3>
                            <div className="text-muted small mt-2">
                                {payroll.length} payroll(s)
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={2}>
                    <Card className="border-0 shadow-sm bg-light">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-dark bg-opacity-10 p-2 rounded me-3">
                                    <FiDollarSign className="text-dark" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Net Profit</span>
                            </div>
                            <h3 className="fw-bold mb-0" style={{ color: netProfit >= 0 ? '#28a745' : '#dc3545' }}>
                                {formatCurrency(netProfit)}
                            </h3>
                            <div className="small mt-2 fw-medium">
                                <span className={netProfit >= 0 ? 'text-success' : 'text-danger'}>
                                    <FiArrowUpRight className="me-1" /> {totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0}% net margin
                                </span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={2}>
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
                        <Button variant="outline-secondary" className="d-flex align-items-center">
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
                                    <th className="border-0 py-3">Revenue</th>
                                    <th className="border-0 py-3">Cost</th>
                                    <th className="border-0 py-3">Gross Profit</th>
                                    <th className="border-0 py-3">Status</th>
                                    <th className="border-0 py-3 text-end pe-4">Method</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(order => {
                                    const grossProfit = order.total_amount - order.total_cost;
                                    return (
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
                                                <div className="fw-bold text-warning">{formatCurrency(order.total_cost)}</div>
                                            </td>
                                            <td>
                                                <div className={`fw-bold ${grossProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                                                    {formatCurrency(grossProfit)}
                                                </div>
                                            </td>
                                            <td>
                                                <Badge bg={order.status.toUpperCase() === 'PENDING' ? 'warning' : 'success'} className="fw-normal">
                                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                </Badge>
                                            </td>
                                            <td className="text-end pe-4">
                                                <span className="small text-muted">Bank Transfer</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Income;
