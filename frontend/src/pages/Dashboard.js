import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Dropdown, Spinner } from 'react-bootstrap';
import { dashboardAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import {
    FiTrendingUp,
    FiUsers,
    FiBox,
    FiDollarSign,
    FiArrowUpRight,
    FiArrowDownRight,
    FiPlus,
    FiClock,
    FiCheckCircle,
    FiAlertCircle,
    FiShoppingCart,
    FiBarChart2
} from 'react-icons/fi';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

// Register ChartJS components
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

    const { formatCurrency } = useCurrency();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [statsRes, activityRes, salesRes, revenueExpenseRes, productPerformanceRes] = await Promise.all([
                    dashboardAPI.getStats(),
                    dashboardAPI.getRecentActivity(),
                    dashboardAPI.getSalesChart(),
                    dashboardAPI.getRevenueExpenseChart(),
                    dashboardAPI.getProductPerformanceChart()
                ]);

                setStats(statsRes.data.stats);
                setActivity(activityRes.data.activity);
                setSalesData(salesRes.data.sales_data);
                setRevenueExpenseData(revenueExpenseRes.data.chart_data);
                setProductPerformanceData(productPerformanceRes.data.chart_data);
                setError(null);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Failed to load dashboard data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Mock data for charts if real data is not available or incomplete
    const lineData = {
        labels: salesData ? salesData.map(d => d.month) : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [
            {
                label: 'Revenue',
                data: salesData ? salesData.map(d => d.revenue) : [35000, 42000, 38000, 50000, 48000, 62000, 75000],
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

    const doughnutData = {
        labels: ['Electronics', 'Fashion', 'Home', 'Beauty'],
        datasets: [
            {
                data: [45, 25, 20, 10],
                backgroundColor: [
                    '#2563eb',
                    '#8b5cf6',
                    '#ec4899',
                    '#f59e0b',
                ],
                borderWidth: 0,
                hoverOffset: 10,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
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
                        <Button variant="primary" className="mt-3" onClick={() => window.location.reload()}>
                            Retry
                        </Button>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    return (
        <div className="dashboard-wrapper py-4">
            <Container fluid>
                {/* Header Section */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold text-dark mb-1">Welcome Back, Admin</h2>
                        <p className="text-muted mb-0">Here's what's happening with your business today.</p>
                    </div>
                    <div className="d-flex gap-2">
                        <Button variant="light" className="bg-white border shadow-sm d-flex align-items-center gap-2">
                            <FiClock /> Last 30 Days
                        </Button>
                        <Dropdown>
                            <Dropdown.Toggle variant="primary" className="shadow-sm d-flex align-items-center gap-2 no-caret">
                                <FiPlus /> Quick Action
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="border-0 shadow-lg rounded-3 mt-2">
                                <Dropdown.Item href="/projects" className="py-2 d-flex align-items-center gap-2">
                                    <FiBox className="text-primary" /> New Project
                                </Dropdown.Item>
                                <Dropdown.Item href="/customers" className="py-2 d-flex align-items-center gap-2">
                                    <FiUsers className="text-success" /> New Customer
                                </Dropdown.Item>
                                <Dropdown.Item href="/sales-orders" className="py-2 d-flex align-items-center gap-2">
                                    <FiShoppingCart className="text-warning" /> New Order
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item href="/reports" className="py-2 d-flex align-items-center gap-2">
                                    <FiBarChart2 className="text-info" /> Generate Report
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </div>

                {/* KPI Cards */}
                <Row className="g-4 mb-4">
                    {[
                        { title: 'Total Revenue', value: stats ? formatCurrency(stats.total_revenue || 0) : formatCurrency(0), trend: '+12.5%', icon: <FiDollarSign />, color: 'primary', trendUp: true },
                        { title: 'Active Orders', value: stats ? stats.total_orders : '0', trend: '+5.2%', icon: <FiShoppingCart />, color: 'purple', trendUp: true },
                        { title: 'Total Customers', value: stats ? stats.total_customers : '0', trend: '-2.4%', icon: <FiUsers />, color: 'pink', trendUp: false },
                        { title: 'Total Products', value: stats ? stats.total_products : '0', trend: '+8.1%', icon: <FiBox />, color: 'orange', trendUp: true },
                    ].map((kpi, idx) => (
                        <Col key={idx} xl={3} md={6}>
                            <Card className="border-0 shadow-sm h-100 kpi-card overflow-hidden">
                                <Card.Body className="p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className={`kpi-icon-wrapper bg-${kpi.color}-light text-${kpi.color}`}>
                                            {kpi.icon}
                                        </div>
                                        <Badge bg={kpi.trendUp ? 'success-light' : 'danger-light'} className={`text-${kpi.trendUp ? 'success' : 'danger'} border-0`}>
                                            {kpi.trendUp ? <FiArrowUpRight className="me-1" /> : <FiArrowDownRight className="me-1" />}
                                            {kpi.trend}
                                        </Badge>
                                    </div>
                                    <h3 className="fw-bold mb-1">{kpi.value}</h3>
                                    <p className="text-muted small mb-0">{kpi.title}</p>
                                </Card.Body>
                                <div className={`kpi-bottom-bar bg-${kpi.color}`}></div>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Charts Row */}
                <Row className="g-4 mb-4">
                    <Col lg={8}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header className="bg-white border-0 p-4 d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold mb-0">Revenue Overview</h5>
                                <div className="d-flex gap-3">
                                    <div className="d-flex align-items-center gap-2 small">
                                        <span className="dot bg-primary"></span> Revenue
                                    </div>
                                </div>
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
                                <h5 className="fw-bold mb-0">Orders by Status</h5>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0 d-flex flex-column align-items-center">
                                <div style={{ height: '220px', width: '220px' }} className="mb-4">
                                    <Doughnut
                                        data={{
                                            labels: stats ? Object.keys(stats.orders_by_status) : [],
                                            datasets: [{
                                                data: stats ? Object.values(stats.orders_by_status) : [],
                                                backgroundColor: ['#2563eb', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'],
                                                borderWidth: 0,
                                            }]
                                        }}
                                        options={{ ...chartOptions, cutout: '75%' }}
                                    />
                                </div>
                                <div className="w-100">
                                    {stats && Object.entries(stats.orders_by_status).map(([label, value], i) => (
                                        <div key={label} className="d-flex justify-content-between align-items-center mb-2">
                                            <div className="d-flex align-items-center gap-2 small">
                                                <span className="dot" style={{ backgroundColor: ['#2563eb', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'][i] }}></span>
                                                {label.charAt(0).toUpperCase() + label.slice(1)}
                                            </div>
                                            <span className="fw-bold small">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
                
                {/* Additional Charts Row */}
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
                                                labels: revenueExpenseData.months,
                                                datasets: [
                                                    {
                                                        label: 'Revenue',
                                                        data: revenueExpenseData.revenue,
                                                        backgroundColor: 'rgba(37, 99, 235, 0.6)',
                                                        borderColor: '#2563eb',
                                                        borderWidth: 1,
                                                    },
                                                    {
                                                        label: 'Expense',
                                                        data: revenueExpenseData.expense,
                                                        backgroundColor: 'rgba(239, 68, 68, 0.6)',
                                                        borderColor: '#ef4444',
                                                        borderWidth: 1,
                                                    }
                                                ],
                                            }}
                                            options={{
                                                ...chartOptions,
                                                scales: {
                                                    ...chartOptions.scales,
                                                    y: {
                                                        ...chartOptions.scales.y,
                                                        ticks: {
                                                            ...chartOptions.scales.y.ticks,
                                                            callback: function(value) {
                                                                return formatCurrency(value).split(' ')[0];
                                                            }
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="d-flex justify-content-center align-items-center h-100">
                                            <div className="text-muted">Loading chart data...</div>
                                        </div>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={6}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header className="bg-white border-0 p-4">
                                <h5 className="fw-bold mb-0">Top vs Slow Products</h5>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0">
                                <div style={{ height: '300px' }}>
                                    {productPerformanceData ? (
                                        <Bar
                                            data={{
                                                labels: [
                                                    ...productPerformanceData.top_products.map(p => p.name),
                                                    ...productPerformanceData.slow_products.map(p => p.name)
                                                ],
                                                datasets: [
                                                    {
                                                        label: 'Top Products',
                                                        data: [
                                                            ...productPerformanceData.top_products.map(p => p.quantity),
                                                            ...Array(productPerformanceData.slow_products.length).fill(0)
                                                        ],
                                                        backgroundColor: 'rgba(16, 185, 129, 0.6)',
                                                        borderColor: '#10b981',
                                                        borderWidth: 1,
                                                    },
                                                    {
                                                        label: 'Slow Products',
                                                        data: [
                                                            ...Array(productPerformanceData.top_products.length).fill(0),
                                                            ...productPerformanceData.slow_products.map(p => p.quantity)
                                                        ],
                                                        backgroundColor: 'rgba(245, 158, 11, 0.6)',
                                                        borderColor: '#f59e0b',
                                                        borderWidth: 1,
                                                    }
                                                ],
                                            }}
                                            options={{
                                                ...chartOptions,
                                                scales: {
                                                    ...chartOptions.scales,
                                                    y: {
                                                        ...chartOptions.scales.y,
                                                        ticks: {
                                                            ...chartOptions.scales.y.ticks,
                                                            callback: function(value) {
                                                                return value;
                                                            }
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="d-flex justify-content-center align-items-center h-100">
                                            <div className="text-muted">Loading chart data...</div>
                                        </div>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Recent Activity & Transactions */}
                <Row className="g-4">
                    <Col lg={7}>
                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-white border-0 p-4 d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold mb-0">Recent Orders</h5>
                                <Button href="/orders" variant="link" className="text-primary p-0 text-decoration-none small fw-bold">View All</Button>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <Table responsive hover className="mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="px-4 py-3 border-0 small text-muted">ORDER ID</th>
                                            <th className="py-3 border-0 small text-muted">CUSTOMER</th>
                                            <th className="py-3 border-0 small text-muted">AMOUNT</th>
                                            <th className="py-3 border-0 small text-muted">STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activity && activity.recent_orders.map((order, i) => (
                                            <tr key={i}>
                                                <td className="px-4 py-3">
                                                    <div className="fw-bold">{order.order_id}</div>
                                                    <div className="text-muted small">{new Date(order.created_at).toLocaleDateString()}</div>
                                                </td>
                                                <td className="py-3 text-muted small">{order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'N/A'}</td>
                                                <td className="py-3 fw-bold">{formatCurrency(order.total_amount)}</td>
                                                <td className="py-3">
                                                    <Badge bg="primary-light" className="text-primary border-0">
                                                        {order.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={5}>
                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-white border-0 p-4">
                                <h5 className="fw-bold mb-0">Recent Customers</h5>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0">
                                <div className="activity-timeline">
                                    {activity && activity.recent_customers.map((customer, i) => (
                                        <div key={i} className="activity-item d-flex gap-3 mb-4">
                                            <div className={`activity-icon bg-primary-light text-primary`}>
                                                <FiUsers />
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <h6 className="fw-bold mb-0 small">{customer.first_name} {customer.last_name}</h6>
                                                    <span className="text-muted" style={{ fontSize: '11px' }}>{new Date(customer.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-muted small mb-0">{customer.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <style dangerouslySetInnerHTML={{
                __html: `
        .bg-primary-light { background-color: rgba(37, 99, 235, 0.1); }
        .bg-purple-light { background-color: rgba(139, 92, 246, 0.1); }
        .bg-pink-light { background-color: rgba(236, 72, 153, 0.1); }
        .bg-orange-light { background-color: rgba(245, 158, 11, 0.1); }
        .bg-success-light { background-color: rgba(16, 185, 129, 0.1); }
        .bg-warning-light { background-color: rgba(245, 158, 11, 0.1); }
        .bg-danger-light { background-color: rgba(239, 68, 68, 0.1); }
        .bg-info-light { background-color: rgba(6, 182, 212, 0.1); }

        .text-primary { color: #2563eb !important; }
        .text-purple { color: #8b5cf6 !important; }
        .text-pink { color: #ec4899 !important; }
        .text-orange { color: #f59e0b !important; }
        .text-success { color: #10b981 !important; }
        .text-warning { color: #f59e0b !important; }
        .text-danger { color: #ef4444 !important; }
        .text-info { color: #06b2d4 !important; }

        .bg-purple { background-color: #8b5cf6 !important; }
        .bg-pink { background-color: #ec4899 !important; }
        .bg-orange { background-color: #f59e0b !important; }

        .kpi-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border-radius: 16px;
        }
        .kpi-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
        }
        .kpi-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        .kpi-bottom-bar {
          height: 4px;
          width: 100%;
          position: absolute;
          bottom: 0;
          left: 0;
        }
        .dot {
          height: 8px;
          width: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .activity-icon {
          width: 36px;
          height: 36px;
          min-width: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
        .activity-item {
          position: relative;
        }
        .activity-item:not(:last-child):after {
          content: '';
          position: absolute;
          left: 18px;
          top: 36px;
          bottom: -24px;
          width: 2px;
          background-color: #f1f5f9;
        }
      `}} />
        </div>
    );
};

export default Dashboard;
