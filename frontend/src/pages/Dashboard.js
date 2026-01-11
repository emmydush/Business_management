import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Dropdown, Form } from 'react-bootstrap';
import {
    FiShoppingCart,
    FiUsers,
    FiBox,
    FiDollarSign,
    FiTrendingUp,
    FiAlertCircle,
    FiPlus,
    FiBarChart2,
    FiArrowRight,
    FiAlertTriangle
} from 'react-icons/fi';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    BarElement,
    Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { dashboardAPI, healthAPI } from '../services/api';
import { useAuth } from '../components/auth/AuthContext';
import { useI18n } from '../i18n/I18nProvider';
import { useCurrency } from '../context/CurrencyContext';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState(null);
    const [salesData, setSalesData] = useState(null);
    const [revenueExpenseData, setRevenueExpenseData] = useState(null);
    const [productPerformanceData, setProductPerformanceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showQuickAction, setShowQuickAction] = useState(false);
    const [period, setPeriod] = useState('monthly');

    const { user } = useAuth();
    const { t } = useI18n();
    const { formatCurrency } = useCurrency();

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const [statsRes, activityRes, salesRes, revenueExpenseRes, productPerformanceRes] = await Promise.all([
                dashboardAPI.getStats(),
                dashboardAPI.getRecentActivity(),
                dashboardAPI.getSalesChart(period),
                dashboardAPI.getRevenueExpenseChart(period),
                dashboardAPI.getProductPerformanceChart(period)
            ]);

            setStats(statsRes.data.stats);
            setActivity(activityRes.data.activity);
            setSalesData(salesRes.data.sales_data);
            setRevenueExpenseData(revenueExpenseRes.data.chart_data);
            setProductPerformanceData(productPerformanceRes.data.chart_data);
            setError(null);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            let errorMessage = 'Failed to load dashboard data. Please try again later.';

            if (err.response) {
                if (err.response.status === 401) {
                    errorMessage = 'Session expired. Please login again.';
                    setTimeout(() => {
                        sessionStorage.removeItem('token');
                        sessionStorage.removeItem('user');
                        window.location.href = '/';
                    }, 2000);
                } else if (err.response.status === 403) {
                    errorMessage = 'You do not have permission to access the dashboard.';
                } else if (err.response.data?.error) {
                    errorMessage = `Error: ${err.response.data.error}`;
                }
            } else if (err.request) {
                errorMessage = 'Cannot connect to server. Backend may be down — we will retry automatically. Click Retry to try now.';
            } else {
                errorMessage = `Error: ${err.message}`;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        if (!error) return;
        let healthInterval = setInterval(async () => {
            try {
                const res = await healthAPI.getHealth();
                if (res.status === 200) {
                    setError(null);
                    fetchDashboardData();
                    clearInterval(healthInterval);
                }
            } catch (healthErr) {
            }
        }, 30000);
        return () => clearInterval(healthInterval);
    }, [error, fetchDashboardData]);

    const lineData = {
        labels: salesData ? salesData.map(d => d.label) : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [
            {
                label: 'Revenue',
                data: salesData ? salesData.map(d => d.revenue) : [0, 0, 0, 0, 0, 0, 0],
                fill: true,
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderColor: '#2563eb',
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#2563eb',
                pointBorderWidth: 2,
            }
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: '#1e293b',
                padding: 12,
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 13 },
                cornerRadius: 8,
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8' }
            },
            y: {
                grid: { color: '#f1f5f9' },
                ticks: { color: '#94a3b8' }
            }
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    if (error) {
        return (
            <Container className="mt-5">
                <Card className="border-0 shadow-sm">
                    <Card.Body className="text-center py-5">
                        <FiAlertCircle size={50} className="text-danger mb-3" />
                        <h4>{error}</h4>
                        <Button variant="primary" className="mt-3" onClick={() => { setError(null); fetchDashboardData(); }}>
                            {t('refresh')}
                        </Button>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    return (
        <div className="dashboard-wrapper py-4">
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold text-dark mb-1">{t('dashboard_welcome_back')} {user ? user.first_name || user.username || 'User' : 'Admin'}</h2>
                        <p className="text-primary fw-semibold mb-0">{user?.business_name}</p>
                        <p className="text-muted mb-0">{t('dashboard_sub')}</p>
                    </div>
                    <div className="d-flex gap-2">
                        <Form.Select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="w-auto shadow-sm border-primary"
                            style={{ minWidth: '150px' }}
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </Form.Select>
                        <Dropdown show={showQuickAction} onMouseEnter={() => setShowQuickAction(true)} onMouseLeave={() => setShowQuickAction(false)}>
                            <Dropdown.Toggle variant="primary" className="shadow-sm d-flex align-items-center gap-2 no-caret">
                                <FiPlus /> Quick Action
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="border-0 shadow-lg rounded-3 mt-2 animate-dropdown">
                                <Dropdown.Item href="/projects" className="py-2 d-flex align-items-center gap-2 dropdown-item-hover">
                                    <FiBox className="text-primary" /> New Project
                                </Dropdown.Item>
                                <Dropdown.Item href="/customers" className="py-2 d-flex align-items-center gap-2 dropdown-item-hover">
                                    <FiUsers className="text-success" /> New Customer
                                </Dropdown.Item>
                                <Dropdown.Item href="/sales-orders" className="py-2 d-flex align-items-center gap-2 dropdown-item-hover">
                                    <FiShoppingCart className="text-warning" /> New Order
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item href="/reports" className="py-2 d-flex align-items-center gap-2 dropdown-item-hover">
                                    <FiBarChart2 className="text-info" /> Generate Report
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </div>

                <Row className="g-3 mb-4 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4">
                    {[
                        { title: 'Total Revenue', value: stats ? formatCurrency(stats.total_revenue || 0) : formatCurrency(0), icon: <FiDollarSign />, color: 'primary', gradient: 'grad-primary' },
                        { title: 'Active Sales', value: stats ? stats.total_orders : '0', icon: <FiShoppingCart />, color: 'purple', gradient: 'grad-purple' },
                        { title: 'Total Products', value: stats ? stats.total_products : '0', icon: <FiBox />, color: 'info', gradient: 'grad-info', link: '/products' },
                        { title: 'Total Customers', value: stats ? stats.total_customers : '0', icon: <FiUsers />, color: 'success', gradient: 'grad-success' },

                    ].map((kpi, idx) => (
                        <Col key={idx}>
                            <Card
                                className={`border-0 shadow-sm h-100 kpi-card-v2 ${kpi.gradient} text-white overflow-hidden`}
                                onClick={() => kpi.link && (window.location.href = kpi.link)}
                                style={{ cursor: kpi.link ? 'pointer' : 'default' }}
                            >
                                <Card.Body className="p-3 position-relative d-flex flex-column justify-content-center" style={{ minHeight: '90px' }}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="kpi-content">
                                            <h4 className="fw-bold mb-0 text-white">{kpi.value}</h4>
                                            <p className="text-white-50 small mb-0 fw-medium mt-1">{kpi.title}</p>
                                        </div>
                                        <div className="kpi-icon-v2">
                                            {kpi.icon}
                                        </div>
                                    </div>

                                    {/* Decorative circles */}
                                    <div className="decoration-circle circle-1"></div>
                                    <div className="decoration-circle circle-2"></div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                <Row className="g-4 mb-4">
                    <Col lg={8}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header className="bg-white border-0 p-4 d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold mb-0">Revenue Overview</h5>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0">
                                <div style={{ height: '300px' }}>
                                    <Line data={lineData} options={chartOptions} />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header className="bg-white border-0 p-4">
                                <h5 className="fw-bold mb-0">Revenue Distribution</h5>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0 d-flex flex-column align-items-center">
                                <div style={{ height: '220px', width: '220px' }} className="mb-4">
                                    <Doughnut
                                        data={{
                                            labels: stats && stats.revenue_distribution ? Object.keys(stats.revenue_distribution) : [],
                                            datasets: [{
                                                data: stats && stats.revenue_distribution ? Object.values(stats.revenue_distribution) : [],
                                                backgroundColor: ['#2563eb', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#84cc16'],
                                                borderWidth: 0,
                                            }]
                                        }}
                                        options={{ ...chartOptions, cutout: '75%' }}
                                    />
                                </div>
                                <div className="w-100">
                                    {stats && stats.revenue_distribution && Object.entries(stats.revenue_distribution).map(([label, value], i) => (
                                        <div key={label} className="d-flex justify-content-between align-items-center mb-2">
                                            <div className="d-flex align-items-center gap-2 small">
                                                <span className="dot" style={{ backgroundColor: ['#2563eb', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#84cc16'][i % 8] }}></span>
                                                {label}
                                            </div>
                                            <span className="fw-bold small">{formatCurrency(value)}</span>
                                        </div>
                                    ))}
                                    {(!stats || !stats.revenue_distribution || Object.keys(stats.revenue_distribution).length === 0) && (
                                        <p className="text-center text-muted small">No revenue data available</p>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row className="g-4 mb-4">
                    <Col lg={6}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header className="bg-white border-0 p-4">
                                <h5 className="fw-bold mb-0">Revenue vs Expense</h5>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0">
                                <div style={{ height: '300px' }}>
                                    {revenueExpenseData ? (
                                        <Bar
                                            data={{
                                                labels: revenueExpenseData.labels,
                                                datasets: [
                                                    {
                                                        label: 'Revenue',
                                                        data: revenueExpenseData.revenue,
                                                        backgroundColor: '#10b981',
                                                        borderRadius: 4,
                                                    },
                                                    {
                                                        label: 'Expense',
                                                        data: revenueExpenseData.expense,
                                                        backgroundColor: '#ef4444',
                                                        borderRadius: 4,
                                                    }
                                                ]
                                            }}
                                            options={chartOptions}
                                        />
                                    ) : <p className="text-center py-5 text-muted">No data available</p>}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={6}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header className="bg-white border-0 p-4">
                                <h5 className="fw-bold mb-0">Top Products</h5>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0">
                                <div style={{ height: '300px' }}>
                                    {productPerformanceData ? (
                                        <Bar
                                            data={{
                                                labels: productPerformanceData.top_products.map(p => p.name),
                                                datasets: [{
                                                    label: 'Quantity Sold',
                                                    data: productPerformanceData.top_products.map(p => p.quantity),
                                                    backgroundColor: '#2563eb',
                                                    borderRadius: 4,
                                                }]
                                            }}
                                            options={{ ...chartOptions, indexAxis: 'y' }}
                                        />
                                    ) : <p className="text-center py-5 text-muted">No data available</p>}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row className="g-4">
                    <Col lg={6}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header className="bg-white border-0 p-4 d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold mb-0">Recent Sales</h5>
                                <Button variant="link" href="/sales-orders" className="text-decoration-none p-0">View All</Button>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="ps-4 border-0">SALE ID</th>
                                                <th className="border-0">CUSTOMER</th>
                                                <th className="border-0">TOTAL</th>
                                                <th className="border-0">STATUS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activity?.recent_orders.map(order => (
                                                <tr key={order.id}>
                                                    <td className="ps-4 fw-medium">{order.order_id}</td>
                                                    <td>{order.customer_name}</td>
                                                    <td>{formatCurrency(order.total_amount)}</td>
                                                    <td>
                                                        <span className={`badge rounded-pill bg-${order.status === 'DELIVERED' ? 'success' :
                                                            order.status === 'PENDING' ? 'warning' :
                                                                order.status === 'CANCELLED' ? 'danger' : 'info'
                                                            }-light text-${order.status === 'DELIVERED' ? 'success' :
                                                                order.status === 'PENDING' ? 'warning' :
                                                                    order.status === 'CANCELLED' ? 'danger' : 'info'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={6}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header className="bg-white border-0 p-4 d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold mb-0">Recent Customers</h5>
                                <Button variant="link" href="/customers" className="text-decoration-none p-0">View All</Button>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="ps-4 border-0">NAME</th>
                                                <th className="border-0">COMPANY</th>
                                                <th className="border-0">JOINED</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activity?.recent_customers.map(customer => (
                                                <tr key={customer.id}>
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="avatar-sm bg-primary-light text-primary rounded-circle d-flex align-items-center justify-content-center">
                                                                {customer.first_name[0]}{customer.last_name[0]}
                                                            </div>
                                                            {customer.first_name} {customer.last_name}
                                                        </div>
                                                    </td>
                                                    <td>{customer.company || 'N/A'}</td>
                                                    <td className="text-muted small">{new Date(customer.created_at).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <style dangerouslySetInnerHTML={{
                __html: `
                .kpi-card-v2 {
                    transition: all 0.3s ease;
                    border-radius: 12px;
                    height: 90px !important;
                }
                .kpi-card-v2:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(0,0,0,0.12) !important;
                }
                .grad-primary { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); }
                .grad-purple { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
                .grad-info { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); }
                .grad-success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
                .grad-danger { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }

                .kpi-icon-v2 {
                    width: 28px;
                    height: 28px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    backdrop-filter: blur(4px);
                }
                
                .kpi-content {
                    flex: 1;
                }
                
                .kpi-content h4 {
                    font-size: 1rem;
                    margin-bottom: 0.1rem;
                }
                
                .kpi-content p {
                    font-size: 0.75rem;
                    margin-bottom: 0;
                }

                .decoration-circle {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    z-index: 0;
                }
                .circle-1 {
                    width: 100px;
                    height: 100px;
                    top: -20px;
                    right: -20px;
                }
                .circle-2 {
                    width: 60px;
                    height: 60px;
                    bottom: -10px;
                    right: 20px;
                }
                .kpi-card-v2 * {
                    position: relative;
                    z-index: 1;
                }
            `}} />
        </div>
    );
};

export default Dashboard;
