import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Dropdown, Form } from 'react-bootstrap';
import moment from 'moment';
import './Dashboard.css'; // Import custom styles
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
    FiAlertTriangle,
    FiSun,
    FiMoon,
    FiSunrise,
    FiCheckCircle,
    FiClock
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
import {
    colorPalettes,
    lineChartOptions,
    barChartOptions,
    doughnutChartOptions,
    createGradient,
    createAreaGradient,
    hexToRgb
} from '../config/chartConfig';

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
    const [salesData, setSalesData] = useState(null);
    const [previousSalesData, setPreviousSalesData] = useState(null);
    const [revenueExpenseData, setRevenueExpenseData] = useState(null);
    const [productPerformanceData, setProductPerformanceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showQuickAction, setShowQuickAction] = useState(false);
    const [period, setPeriod] = useState('daily');

    const { user } = useAuth();
    const { t } = useI18n();
    const { formatCurrency } = useCurrency();

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const [statsRes, salesRes, revenueExpenseRes, productPerformanceRes] = await Promise.all([
                dashboardAPI.getStats(),
                dashboardAPI.getSalesChart(period),
                dashboardAPI.getRevenueExpenseChart(period),
                dashboardAPI.getProductPerformanceChart(period)
            ]);

            setStats(statsRes.data.stats);
            setSalesData(salesRes.data.sales_data);
            setPreviousSalesData(salesRes.data.previous_sales_data);
            setRevenueExpenseData(revenueExpenseRes.data.chart_data);
            setProductPerformanceData(productPerformanceRes.data.chart_data);
            setError(null);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            let errorMessage = t('dashboard_load_error');

            if (err.response) {
                if (err.response.status === 401) {
                    errorMessage = t('session_expired');
                    setTimeout(() => {
                        sessionStorage.removeItem('token');
                        sessionStorage.removeItem('user');
                        window.location.href = '/';
                    }, 2000);
                } else if (err.response.status === 403) {
                    errorMessage = t('dashboard_permission_error');
                } else if (err.response.data?.error) {
                    errorMessage = `Error: ${err.response.data.error}`;
                }
            } else if (err.request) {
                errorMessage = t('server_connection_error');
            } else {
                errorMessage = `Error: ${err.message}`;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [t, period]);

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
        labels: salesData ? salesData.map(d => d.label) : [],
        datasets: [
            {
                label: t('current_period') || 'Current Period',
                data: salesData ? salesData.map(d => d.revenue) : [],
                fill: true,
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return 'rgba(79, 70, 229, 0.1)';
                    const color = '#4f46e5';
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, `rgba(${hexToRgb(color)}, 0)`);
                    gradient.addColorStop(1, `rgba(${hexToRgb(color)}, 0.2)`);
                    return gradient;
                },
                borderColor: '#4f46e5',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: period === 'daily' ? 0 : 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#4f46e5',
                pointBorderWidth: 2,
                pointHoverBorderWidth: 3,
                zIndex: 2
            },
            {
                label: t('previous_period') || 'Previous Period',
                data: previousSalesData || [],
                borderColor: 'rgba(148, 163, 184, 0.4)',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 0,
                zIndex: 1
            }
        ],
    };

    const enhancedLineChartOptions = {
        ...lineChartOptions,
        plugins: {
            ...lineChartOptions.plugins,
            legend: {
                display: true,
                position: 'top',
                align: 'end',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: { size: 12, weight: '500' }
                }
            },
            tooltip: {
                ...lineChartOptions.plugins.tooltip,
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += formatCurrency(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            ...lineChartOptions.scales,
            x: {
                ...lineChartOptions.scales.x,
                ticks: {
                    ...lineChartOptions.scales.x.ticks,
                    maxTicksLimit: 10,
                    maxRotation: 0,
                    minRotation: 0,
                    autoSkip: true,
                }
            }
        },
        animation: {
            duration: 1500,
            easing: 'easeInOutQuart',
        },
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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('good_morning') || 'Good morning';
        if (hour < 18) return t('good_afternoon') || 'Good afternoon';
        return t('good_evening') || 'Good evening';
    };

    const greeting = getGreeting();

    return (
        <div className="dashboard-wrapper py-4">
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold text-dark mb-1">
                            {greeting}, {user ? user.first_name || user.username || 'User' : 'Admin'}
                        </h2>
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
                            <option value="daily">{t('daily')}</option>
                            <option value="weekly">{t('weekly')}</option>
                            <option value="monthly">{t('monthly')}</option>
                        </Form.Select>
                        <Dropdown show={showQuickAction} onMouseEnter={() => setShowQuickAction(true)} onMouseLeave={() => setShowQuickAction(false)}>
                            <Dropdown.Toggle variant="primary" className="shadow-sm d-flex align-items-center gap-2 no-caret">
                                <FiPlus /> {t('quick_action')}
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="border-0 shadow-lg rounded-3 mt-2 animate-dropdown">
                                <Dropdown.Item href="/projects" className="py-2 d-flex align-items-center gap-2 dropdown-item-hover">
                                    <FiBox className="text-primary" /> {t('new_project')}
                                </Dropdown.Item>
                                <Dropdown.Item href="/customers" className="py-2 d-flex align-items-center gap-2 dropdown-item-hover">
                                    <FiUsers className="text-success" /> {t('new_customer')}
                                </Dropdown.Item>
                                <Dropdown.Item href="/sales-orders" className="py-2 d-flex align-items-center gap-2 dropdown-item-hover">
                                    <FiShoppingCart className="text-warning" /> {t('new_order')}
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item href="/reports" className="py-2 d-flex align-items-center gap-2 dropdown-item-hover">
                                    <FiBarChart2 className="text-info" /> {t('generate_report')}
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </div>

                <Row className="g-3 mb-4 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5">
                    {[
                        { title: t('total_revenue'), value: stats ? formatCurrency(stats.total_revenue || 0) : formatCurrency(0), icon: <FiDollarSign />, color: 'primary', gradient: 'grad-primary' },
                        { title: t('net_profit'), value: stats ? formatCurrency(stats.net_profit || 0) : formatCurrency(0), icon: <FiTrendingUp />, color: 'danger', gradient: 'grad-danger' },
                        { title: t('active_sales'), value: stats ? stats.total_orders : '0', icon: <FiShoppingCart />, color: 'purple', gradient: 'grad-purple' },
                        { title: t('total_products'), value: stats ? stats.total_products : '0', icon: <FiBox />, color: 'info', gradient: 'grad-info', link: '/products' },
                        { title: t('total_customers'), value: stats ? stats.total_customers : '0', icon: <FiUsers />, color: 'success', gradient: 'grad-success' },
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
                        <Card className="border-0 shadow-sm h-100 chart-fade-in">
                            <Card.Header className="bg-white border-0 p-4 d-flex justify-content-between align-items-start">
                                <div>
                                    <h5 className="fw-bold mb-1">{t('revenue_overview')}</h5>
                                    <p className="text-muted small mb-0">Comparison with previous {period === 'daily' ? '30 days' : period === 'weekly' ? '12 weeks' : 'year'}</p>
                                </div>
                                <div className="text-end">
                                    <h4 className="fw-bold mb-0 text-dark">
                                        {salesData ? formatCurrency(salesData.reduce((acc, curr) => acc + curr.revenue, 0)) : formatCurrency(0)}
                                    </h4>
                                    {(() => {
                                        const currentTotal = salesData ? salesData.reduce((acc, curr) => acc + curr.revenue, 0) : 0;
                                        const prevTotal = previousSalesData ? previousSalesData.reduce((acc, curr) => acc + curr, 0) : 0;
                                        const growth = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
                                        return (
                                            <span className={`small fw-bold ${growth >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {growth >= 0 ? <FiTrendingUp /> : <FiAlertTriangle />} {Math.abs(growth).toFixed(1)}%
                                                <span className="text-muted fw-normal ms-1">vs prev.</span>
                                            </span>
                                        );
                                    })()}
                                </div>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0">
                                <div style={{ height: '300px' }}>
                                    <Line data={lineData} options={enhancedLineChartOptions} />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm h-100 chart-scale-in">
                            <Card.Header className="bg-white border-0 p-4">
                                <div>
                                    <h5 className="fw-bold mb-1">{t('sales_volume_trend') || 'Sales Volume Trend'}</h5>
                                    <p className="text-muted small mb-0">Number of orders over time</p>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0">
                                <div style={{ height: '300px' }}>
                                    <Bar
                                        data={{
                                            labels: salesData ? salesData.map(d => d.label) : [],
                                            datasets: [{
                                                label: t('total_orders') || 'Total Orders',
                                                data: salesData ? salesData.map(d => d.orders) : [],
                                                backgroundColor: (context) => {
                                                    const { ctx, chartArea } = context.chart;
                                                    if (!chartArea) return colorPalettes.gradients.purple[0];
                                                    return createGradient(ctx, chartArea, colorPalettes.gradients.purple[0], colorPalettes.gradients.purple[1]);
                                                },
                                                borderRadius: 6,
                                            }]
                                        }}
                                        options={{
                                            ...barChartOptions,
                                            plugins: {
                                                ...barChartOptions.plugins,
                                                legend: { display: false }
                                            },
                                            scales: {
                                                ...barChartOptions.scales,
                                                x: {
                                                    ...barChartOptions.scales.x,
                                                    ticks: {
                                                        ...barChartOptions.scales.x.ticks,
                                                        maxTicksLimit: 6,
                                                        maxRotation: 0,
                                                        minRotation: 0,
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row className="g-4 mb-4">
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm h-100 chart-scale-in">
                            <Card.Header className="bg-white border-0 p-4">
                                <div>
                                    <h5 className="fw-bold mb-1">{t('revenue_distribution')}</h5>
                                    <p className="text-muted small mb-0">Revenue breakdown by category</p>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0 d-flex flex-column align-items-center">
                                <div style={{ height: '220px', width: '220px' }} className="mb-4">
                                    <Doughnut
                                        data={{
                                            labels: stats && stats.revenue_distribution ? Object.keys(stats.revenue_distribution) : [],
                                            datasets: [{
                                                data: stats && stats.revenue_distribution ? Object.values(stats.revenue_distribution) : [],
                                                backgroundColor: colorPalettes.vibrant,
                                                borderWidth: 0,
                                                hoverOffset: 8,
                                            }]
                                        }}
                                        options={{
                                            ...doughnutChartOptions,
                                            plugins: {
                                                ...doughnutChartOptions.plugins,
                                                tooltip: {
                                                    ...doughnutChartOptions.plugins.tooltip,
                                                    callbacks: {
                                                        label: function (context) {
                                                            const label = context.label || '';
                                                            const value = context.parsed;
                                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                            const percentage = ((value / total) * 100).toFixed(1) + '%';
                                                            return `${label}: ${formatCurrency(value)} (${percentage})`;
                                                        }
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                                <div className="w-100">
                                    {stats && stats.revenue_distribution && Object.entries(stats.revenue_distribution).slice(0, 3).map(([key, value], idx) => (
                                        <div key={idx} className="d-flex justify-content-between align-items-center mb-2">
                                            <div className="d-flex align-items-center">
                                                <span className="d-inline-block rounded-circle me-2" style={{ width: '10px', height: '10px', backgroundColor: colorPalettes.vibrant[idx % colorPalettes.vibrant.length] }}></span>
                                                <span className="small text-muted">{key}</span>
                                            </div>
                                            <span className="small fw-bold">{formatCurrency(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>


                <Row className="g-4">
                    <Col lg={6}>
                        <Card className="border-0 shadow-sm h-100 chart-fade-in">
                            <Card.Header className="bg-white border-0 p-4">
                                <h5 className="fw-bold mb-1">{t('revenue_vs_expenses') || 'Revenue vs Expenses'}</h5>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0">
                                <div style={{ height: '250px' }}>
                                    <Bar
                                        data={{
                                            labels: revenueExpenseData ? revenueExpenseData.labels : [],
                                            datasets: [
                                                {
                                                    label: t('total_revenue'),
                                                    data: revenueExpenseData ? revenueExpenseData.revenue : [],
                                                    backgroundColor: (context) => {
                                                        const { ctx, chartArea } = context.chart;
                                                        if (!chartArea) return colorPalettes.comparison.revenue;
                                                        return createGradient(ctx, chartArea, colorPalettes.comparison.revenue, '#059669');
                                                    },
                                                    borderRadius: 6,
                                                },
                                                {
                                                    label: t('sidebar_expenses'),
                                                    data: revenueExpenseData ? revenueExpenseData.expense : [],
                                                    backgroundColor: (context) => {
                                                        const { ctx, chartArea } = context.chart;
                                                        if (!chartArea) return colorPalettes.comparison.expense;
                                                        return createGradient(ctx, chartArea, colorPalettes.comparison.expense, '#b91c1c');
                                                    },
                                                    borderRadius: 6,
                                                }
                                            ]
                                        }}
                                        options={barChartOptions}
                                    />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={6}>
                        <Card className="border-0 shadow-sm h-100 chart-fade-in">
                            <Card.Header className="bg-white border-0 p-4">
                                <h5 className="fw-bold mb-1">{t('top_selling_products') || 'Top Selling Products'}</h5>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0">
                                <div style={{ height: '250px' }}>
                                    <Bar
                                        data={{
                                            labels: productPerformanceData && productPerformanceData.top_products ? productPerformanceData.top_products.map(p => p.name) : [],
                                            datasets: [{
                                                label: t('quantity_sold'),
                                                data: productPerformanceData && productPerformanceData.top_products ? productPerformanceData.top_products.map(p => p.quantity) : [],
                                                backgroundColor: (context) => {
                                                    const { ctx, chartArea } = context.chart;
                                                    if (!chartArea) return colorPalettes.vibrant[0];
                                                    return createGradient(ctx, chartArea, colorPalettes.vibrant[0], colorPalettes.vibrant[1]);
                                                },
                                                borderRadius: 6,
                                            }]
                                        }}
                                        options={{
                                            ...barChartOptions,
                                            indexAxis: 'y',
                                            plugins: {
                                                ...barChartOptions.plugins,
                                                legend: { display: false }
                                            },
                                            scales: {
                                                x: {
                                                    ...barChartOptions.scales.y, // Use value formatting for X axis
                                                    grid: { display: true, drawBorder: false }
                                                },
                                                y: {
                                                    ...barChartOptions.scales.x, // Use category formatting for Y axis
                                                    grid: { display: false }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
                {/* Financial Summary Section */}
                <Row className="mt-4">
                    <Col xs={12}>
                        <Card className="border-0 shadow-sm bg-white overflow-hidden">
                            <Card.Header className="bg-white border-0 p-4 d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="fw-bold mb-0 text-dark">{t('financial_summary') || 'Financial Summary'}</h5>
                                    <p className="text-muted small mb-0">Detailed breakdown of your business performance</p>
                                </div>
                                <Button variant="light" size="sm" className="text-primary fw-bold" onClick={() => window.location.href = '/reports'}>
                                    View Full Report <FiArrowRight className="ms-1" />
                                </Button>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0 align-middle financial-table">
                                        <thead className="bg-light text-uppercase">
                                            <tr>
                                                <th className="border-0 px-4 py-3 text-muted x-small fw-bold" style={{ letterSpacing: '0.05em' }}>{t('metric')}</th>
                                                <th className="border-0 px-4 py-3 text-muted x-small fw-bold text-end" style={{ letterSpacing: '0.05em' }}>{t('value')}</th>
                                                <th className="border-0 px-4 py-3 text-muted x-small fw-bold text-center" style={{ letterSpacing: '0.05em' }}>Performance</th>
                                                <th className="border-0 px-4 py-3 text-muted x-small fw-bold text-end" style={{ letterSpacing: '0.05em' }}>{t('change')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                {
                                                    label: t('total_revenue') || 'Total Revenue',
                                                    value: stats ? formatCurrency(stats.total_revenue || 0) : formatCurrency(0),
                                                    change: '+12.5%',
                                                    isPositive: true,
                                                    icon: <FiDollarSign />,
                                                    color: 'primary',
                                                    progress: 85
                                                },
                                                {
                                                    label: t('net_profit') || 'Net Profit',
                                                    value: stats ? formatCurrency(stats.net_profit || 0) : formatCurrency(0),
                                                    change: '+8.2%',
                                                    isPositive: true,
                                                    icon: <FiTrendingUp />,
                                                    color: 'success',
                                                    progress: 65
                                                },
                                                {
                                                    label: t('total_expenses') || 'Total Expenses',
                                                    value: stats ? formatCurrency(stats.total_expenses || 0) : formatCurrency(0),
                                                    change: '-3.1%',
                                                    isPositive: false,
                                                    icon: <FiDollarSign />,
                                                    color: 'danger',
                                                    progress: 45
                                                },
                                                {
                                                    label: t('gross_profit_margin') || 'Gross Profit Margin',
                                                    value: stats ? ((stats.total_revenue && stats.total_revenue > 0) ? Math.round(((stats.total_revenue - stats.total_cogs) / stats.total_revenue) * 100) : 0) + '%' : '0%',
                                                    change: '+2.4%',
                                                    isPositive: true,
                                                    icon: <FiShoppingCart />,
                                                    color: 'info',
                                                    progress: stats ? ((stats.total_revenue && stats.total_revenue > 0) ? Math.round(((stats.total_revenue - stats.total_cogs) / stats.total_revenue) * 100) : 0) : 0
                                                },
                                                {
                                                    label: t('total_inventory_value') || 'Total Inventory Value',
                                                    value: stats ? formatCurrency(stats.total_inventory_value || 0) : formatCurrency(0),
                                                    change: '+5.7%',
                                                    isPositive: true,
                                                    icon: <FiBox />,
                                                    color: 'warning',
                                                    progress: 70
                                                },
                                                {
                                                    label: t('outstanding_invoices') || 'Outstanding Invoices',
                                                    value: stats ? formatCurrency(stats.outstanding_invoices || 0) : formatCurrency(0),
                                                    change: '-1.2%',
                                                    isPositive: false,
                                                    icon: <FiClock />,
                                                    color: 'purple',
                                                    progress: 30
                                                }
                                            ].map((item, idx) => (
                                                <tr key={idx} className="financial-row">
                                                    <td className="px-4 py-3">
                                                        <div className="d-flex align-items-center">
                                                            <div className={`rounded-circle bg-${item.color}-soft p-2 me-3 text-${item.color} d-flex align-items-center justify-content-center shadow-sm`} style={{ width: '40px', height: '40px' }}>
                                                                {item.icon}
                                                            </div>
                                                            <span className="fw-semibold text-dark">{item.label}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-end fw-bold text-dark">{item.value}</td>
                                                    <td className="px-4 py-3" style={{ minWidth: '150px' }}>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="progress flex-grow-1" style={{ height: '6px', borderRadius: '10px', backgroundColor: '#f1f5f9' }}>
                                                                <div
                                                                    className={`progress-bar bg-${item.color}`}
                                                                    role="progressbar"
                                                                    style={{ width: `${item.progress}%`, borderRadius: '10px' }}
                                                                    aria-valuenow={item.progress}
                                                                    aria-valuemin="0"
                                                                    aria-valuemax="100"
                                                                ></div>
                                                            </div>
                                                            <span className="small text-muted fw-medium">{item.progress}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-end">
                                                        <span className={`badge rounded-pill bg-${item.isPositive ? 'success' : 'danger'}-soft text-${item.isPositive ? 'success' : 'danger'} px-3 py-2 fw-bold`}>
                                                            {item.isPositive ? <FiTrendingUp className="me-1" /> : <FiAlertTriangle className="me-1" />}
                                                            {item.change}
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
                </Row>
            </Container>
        </div>
    );
};

export default Dashboard;
