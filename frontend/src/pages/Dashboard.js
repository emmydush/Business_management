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
    FiCheck,
    FiClock,
    FiMapPin,
    FiSmile,
    FiHeart,
    FiStar,
    FiThumbsUp,
    FiCoffee,
    FiAward,
    FiGrid,
    FiList,
    FiRefreshCw,
    FiDownload
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
import toast from 'react-hot-toast';
import { dashboardAPI, branchesAPI } from '../services/api';
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
    const [salesByCategoryData, setSalesByCategoryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showQuickAction, setShowQuickAction] = useState(false);
    const [branches, setBranches] = useState([]);
    const [currentBranch, setCurrentBranch] = useState(null);
    const [showBranchSubmenu, setShowBranchSubmenu] = useState(false);
    const [branchesLoading, setBranchesLoading] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [currentPeriod, setCurrentPeriod] = useState('weekly');

    const { user } = useAuth();
    const { t } = useI18n();
    const { formatCurrency } = useCurrency();

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Calculate last 7 days
            const endDate = moment().endOf('day');
            const startDate = moment().subtract(7, 'days').startOf('day');
            
            // Current period is weekly for 7 days
            setCurrentPeriod('weekly');
            const currentPeriodValue = 'weekly';
            
            const apiParams = {
                start_date: startDate.format('YYYY-MM-DD'),
                end_date: endDate.format('YYYY-MM-DD')
            };
            
            const [statsRes, salesRes, revenueExpenseRes, productPerformanceRes] = await Promise.all([
                dashboardAPI.getStats(apiParams),
                dashboardAPI.getSalesChart(currentPeriodValue, apiParams),
                dashboardAPI.getRevenueExpenseChart(currentPeriodValue, apiParams),
                dashboardAPI.getProductPerformanceChart(currentPeriodValue, apiParams)
            ]);

            setStats(statsRes.data.stats);
            setSalesData(salesRes.data.sales_data);
            setPreviousSalesData(salesRes.data.previous_sales_data);
            setRevenueExpenseData(revenueExpenseRes.data.chart_data);
            setProductPerformanceData(productPerformanceRes.data.chart_data);
            
            // Set sales by category data
            if (statsRes.data.stats?.sales_by_category) {
                setSalesByCategoryData(statsRes.data.stats.sales_by_category);
            } else {
                setSalesByCategoryData([
                    { category: 'Electronics', sales: 45000, orders: 120 },
                    { category: 'Clothing', sales: 32000, orders: 280 },
                    { category: 'Groceries', sales: 28000, orders: 320 },
                    { category: 'Home', sales: 18000, orders: 95 },
                    { category: 'Other', sales: 12000, orders: 60 }
                ]);
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            let errorMessage = t('dashboard_load_error');

            if (err.response) {
                if (err.response.status === 401) {
                    errorMessage = t('session_expired');
                    // Don't auto-logout - instead show error and let user retry
                    // The token might still be valid for other operations
                } else if (err.response.status === 403) {
                    errorMessage = err.response.data?.message || err.response.data?.error || t('dashboard_permission_error');
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
    }, [t]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Fetch branches for quick action menu
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const response = await branchesAPI.getAccessibleBranches();
                setBranches(response.data.branches || []);
                const defaultBranch = response.data.branches?.find(b => b.is_default);
                if (defaultBranch) {
                    setCurrentBranch(defaultBranch);
                } else if (response.data.branches?.length > 0) {
                    setCurrentBranch(response.data.branches[0]);
                }
            } catch (err) {
                console.error('Error fetching branches:', err);
            }
        };
        fetchBranches();
    }, []);

    const handleBranchSwitch = async (branchId) => {
        if (currentBranch && currentBranch.id === branchId) {
            return;
        }

        setBranchesLoading(true);
        try {
            const response = await branchesAPI.switchBranch(branchId);
            const newBranch = response.data.branch;
            setCurrentBranch(newBranch);
            setBranches(prevBranches =>
                prevBranches.map(b => ({
                    ...b,
                    is_default: b.id === branchId
                }))
            );
            toast.success(`Switched to ${newBranch.name}`, { icon: '🏢', duration: 2000 });
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (err) {
            console.error('Error switching branch:', err);
            toast.error(err.response?.data?.error || 'Failed to switch branch');
        } finally {
            setBranchesLoading(false);
        }
    };

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
                pointRadius: currentPeriod === 'daily' ? 0 : 4,
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
                    font: { size: 13, weight: '600' }
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

    // Show initial loading spinner only on first load
    if (loading && !stats) {
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

    const getGreetingReaction = () => {
        const hour = new Date().getHours();
        if (hour < 12) return { icon: <FiCoffee className="text-warning" />, text: '☕' };
        if (hour < 18) return { icon: <FiSun className="text-warning" />, text: '☀️' };
        return { icon: <FiMoon className="text-info" />, text: '🌙' };
    };

    const getEncouragementMessage = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('great_start') || 'Ready to tackle the day?';
        if (hour < 18) return t('keep_going') || 'Keep up the great work!';
        return t('well_done') || 'Great job today!';
    };



    const greeting = getGreeting();
    const greetingReaction = getGreetingReaction();
    const encouragement = getEncouragementMessage();

    return (
        <div className="dashboard-wrapper py-4">
            <Container fluid>
                {/* Modern Dashboard Header */}
                <div className="dashboard-header-modern mb-4">
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                        <div className="greeting-section">
                            <div className="welcome-message">
                                <h2 className="welcome-name text-dark">
                                    {greeting}, {user ? user.first_name || user.username || 'User' : 'Admin'}
                                </h2>
                                <p className="welcome-subtext text-muted">{encouragement}</p>
                                <p className="welcome-description text-muted">{t('dashboard_sub')}</p>
                            </div>
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-wrap dashboard-actions">
                            {/* View Mode Toggle */}
                            <div className="view-mode-toggle-group">
                                <Button
                                    variant={viewMode === 'grid' ? 'primary' : 'light'}
                                    className="view-mode-btn"
                                    onClick={() => setViewMode('grid')}
                                    title="Grid View"
                                >
                                    <FiGrid size={16} />
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'primary' : 'light'}
                                    className="view-mode-btn"
                                    onClick={() => setViewMode('list')}
                                    title="List View"
                                >
                                    <FiList size={16} />
                                </Button>
                            </div>

                            {/* Refresh */}
                            <Button
                                variant="outline-secondary"
                                className="modern-refresh-btn d-flex align-items-center gap-2"
                                onClick={() => fetchDashboardData()}
                                disabled={loading}
                            >
                                <FiRefreshCw size={16} className={loading ? 'spin-icon' : ''} />
                            </Button>

                            {/* Quick Actions */}
                            <Dropdown show={showQuickAction} onMouseEnter={() => setShowQuickAction(true)} onMouseLeave={() => setShowQuickAction(false)}>
                                <Dropdown.Toggle variant="primary" className="shadow-sm d-flex align-items-center gap-2 no-caret modern-action-btn">
                                    <FiPlus /> <span className="d-none d-md-inline">{t('quick_action')}</span>
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
                                    <Dropdown.Item 
                                        onClick={() => setShowBranchSubmenu(!showBranchSubmenu)} 
                                        className="py-2 d-flex align-items-center gap-2 dropdown-item-hover"
                                    >
                                        <FiMapPin className="text-info" /> {t('switch_branch')}
                                    </Dropdown.Item>
                                    {showBranchSubmenu && branches.length > 0 && (
                                        <>
                                            <Dropdown.Divider />
                                            {branches.map((branch) => (
                                                <Dropdown.Item
                                                    key={branch.id}
                                                    onClick={() => handleBranchSwitch(branch.id)}
                                                    disabled={branchesLoading || (currentBranch?.id === branch.id)}
                                                    className="py-2 ps-5 d-flex align-items-center gap-2 dropdown-item-hover small"
                                                >
                                                    {currentBranch?.id === branch.id && <FiCheck className="text-success" />}
                                                    {!currentBranch?.id || currentBranch?.id !== branch.id ? <span className="opacity-0"><FiCheck /></span> : null}
                                                    {branch.name}
                                                </Dropdown.Item>
                                            ))}
                                        </>
                                    )}
                                    <Dropdown.Item href="/reports" className="py-2 d-flex align-items-center gap-2 dropdown-item-hover">
                                        <FiBarChart2 className="text-info" /> {t('generate_report')}
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    </div>
                </div>

                <Row className={`g-3 mb-4 ${viewMode === 'grid' ? 'row-cols-1 row-cols-sm-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-5' : 'row-cols-1'}`}>
                    {[
                        { title: t('total_revenue'), value: stats ? formatCurrency(stats.total_revenue || 0) : formatCurrency(0), color: 'primary', gradient: 'grad-primary' },
                        { title: t('net_profit'), value: stats ? formatCurrency(stats.net_profit || 0) : formatCurrency(0), color: 'danger', gradient: 'grad-danger' },
                        { title: t('active_sales'), value: stats ? stats.total_orders : '0', color: 'purple', gradient: 'grad-purple' },
                        { title: t('total_products'), value: stats ? stats.total_products : '0', color: 'info', gradient: 'grad-info', link: '/products' },
                        { title: t('total_customers'), value: stats ? stats.total_customers : '0', color: 'success', gradient: 'grad-success' },
                    ].map((kpi, idx) => (
                        <Col key={idx}>
                            <Card
                                className={`border-0 shadow-sm h-100 kpi-card-v2 ${kpi.gradient} text-white overflow-hidden`}
                                onClick={() => kpi.link && (window.location.href = kpi.link)}
                                style={{ cursor: kpi.link ? 'pointer' : 'default' }}
                            >
                                <Card.Body className="p-3 position-relative d-flex flex-column justify-content-center" style={{ minHeight: '90px' }}>
                                    <div className="kpi-content text-center">
                                        <h4 className="fw-bold mb-0 text-white kpi-value">{kpi.value}</h4>
                                        <p className="text-white-50 small mb-0 fw-medium mt-1 kpi-title">{kpi.title}</p>
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
                    <Col lg={6}>
                        <Card className="border-0 chart-card chart-card-indigo h-100 chart-fade-in">
                            <Card.Header className="bg-white border-0 p-4 d-flex justify-content-between align-items-start">
                                <div>
                                    <h5 className="fw-bold mb-1">{t('revenue_overview')}</h5>
                                    <p className="text-muted small mb-0">Comparison with previous {currentPeriod === 'daily' ? '30 days' : currentPeriod === 'weekly' ? '12 weeks' : 'year'}</p>
                                </div>
                                <div className="text-end">
                                    {loading ? (
                                        <Spinner animation="border" variant="primary" size="sm" />
                                    ) : (
                                        <>
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
                                        </>
                                    )}
                                </div>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0">
                                <div style={{ height: '300px' }}>
                                    {loading ? (
                                        <div className="d-flex justify-content-center align-items-center h-100">
                                            <Spinner animation="border" variant="primary" />
                                        </div>
                                    ) : (
                                        <Line id="revenue-overview-chart" data={lineData} options={enhancedLineChartOptions} />
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={6}>
                        <Card className="border-0 chart-card chart-card-success h-100 chart-fade-in">
                            <Card.Header className="bg-white border-0 p-4">
                                <h5 className="fw-bold mb-1">{t('revenue_vs_expenses') || 'Revenue vs Expenses'}</h5>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0">
                                <div style={{ height: '300px' }}>
                                    {loading ? (
                                        <div className="d-flex justify-content-center align-items-center h-100">
                                            <Spinner animation="border" variant="primary" />
                                        </div>
                                    ) : (
                                        <Bar
                                            id="revenue-vs-expenses-chart"
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
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row className="g-4 mb-4">
                    <Col lg={6}>
                        <Card className="border-0 chart-card chart-card-purple h-100 chart-scale-in">
                            <Card.Header className="bg-white border-0 p-4">
                                <div>
                                    <h5 className="fw-bold mb-1">{t('sales_volume_trend') || 'Sales Volume Trend'}</h5>
                                    <p className="text-muted small mb-0">Number of orders over time</p>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0">
                                <div style={{ height: '300px' }}>
                                    {loading ? (
                                        <div className="d-flex justify-content-center align-items-center h-100">
                                            <Spinner animation="border" variant="primary" />
                                        </div>
                                    ) : (
                                        <Bar
                                            id="sales-volume-chart"
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
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={6}>
                        <Card className="border-0 chart-card chart-card-indigo h-100 chart-fade-in">
                            <Card.Header className="bg-white border-0 p-4">
                                <h5 className="fw-bold mb-1">{t('product_velocity') || 'Product Velocity (Fast vs Slow)'}</h5>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0">
                                <div style={{ height: '300px' }}>
                                    {loading ? (
                                        <div className="d-flex justify-content-center align-items-center h-100">
                                            <Spinner animation="border" variant="primary" />
                                        </div>
                                    ) : (
                                        <Bar
                                            id="product-velocity-chart"
                                            data={{
                                                labels: [
                                                    ...(productPerformanceData?.fast_products?.map(p => p.name) || []),
                                                    ...(productPerformanceData?.slow_products?.map(p => p.name) || [])
                                                ],
                                                datasets: [
                                                    {
                                                        label: t('fast_moving') || 'Fast Moving',
                                                        data: [
                                                            ...(productPerformanceData?.fast_products?.map(p => p.quantity) || []),
                                                            ...(productPerformanceData?.slow_products?.map(() => 0) || [])
                                                        ],
                                                        backgroundColor: (context) => {
                                                            const { ctx, chartArea } = context.chart;
                                                            if (!chartArea) return colorPalettes.gradients.indigo[0];
                                                            return createGradient(ctx, chartArea, colorPalettes.gradients.indigo[0], colorPalettes.gradients.indigo[1]);
                                                        },
                                                        borderRadius: 6,
                                                    },
                                                    {
                                                        label: t('slow_moving') || 'Slow Moving',
                                                        data: [
                                                            ...(productPerformanceData?.fast_products?.map(() => 0) || []),
                                                            ...(productPerformanceData?.slow_products?.map(p => p.quantity) || [])
                                                        ],
                                                        backgroundColor: (context) => {
                                                            const { ctx, chartArea } = context.chart;
                                                            if (!chartArea) return colorPalettes.gradients.orange[0];
                                                            return createGradient(ctx, chartArea, colorPalettes.gradients.orange[0], colorPalettes.gradients.orange[1]);
                                                        },
                                                        borderRadius: 6,
                                                    }
                                                ]
                                            }}
                                            options={{
                                                ...barChartOptions,
                                                indexAxis: 'y',
                                                plugins: {
                                                    ...barChartOptions.plugins,
                                                    legend: {
                                                        display: true,
                                                        position: 'bottom',
                                                        labels: { usePointStyle: true, pointStyle: 'circle' }
                                                    }
                                                },
                                                scales: {
                                                    x: {
                                                        ...barChartOptions.scales.y,
                                                        grid: { display: true, drawBorder: false },
                                                        stacked: true
                                                    },
                                                    y: {
                                                        ...barChartOptions.scales.x,
                                                        grid: { display: false },
                                                        stacked: true
                                                    }
                                                }
                                            }}
                                        />
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row className="g-4 mb-4">
                    <Col lg={6}>
                        <Card className="border-0 chart-card chart-card-purple h-100 chart-scale-in">
                            <Card.Header className="bg-white border-0 p-4">
                                <div>
                                    <h5 className="fw-bold mb-1">{t('revenue_distribution')}</h5>
                                    <p className="text-muted small mb-0">Revenue breakdown by category</p>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0 d-flex flex-column align-items-center">
                                <div style={{ height: '220px', width: '220px' }} className="mb-4">
                                    <Doughnut
                                        id="revenue-distribution-chart"
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
                                <div className="w-100 mt-auto">
                                    {stats && stats.revenue_distribution && Object.entries(stats.revenue_distribution).map(([key, value], idx) => (
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

                {/* Sales by Category */}
                <Row className="g-4 mb-4">
                    <Col lg={12}>
                        <Card className="border-0 chart-card chart-card-cyan h-100 chart-slide-in">
                            <Card.Header className="bg-white border-0 p-4">
                                <div>
                                    <h5 className="fw-bold mb-1">{t('sales_by_category') || 'Sales by Category'}</h5>
                                    <p className="text-muted small mb-0">Revenue and orders breakdown by product category</p>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0">
                                <div style={{ height: '300px' }}>
                                    {loading ? (
                                        <div className="d-flex justify-content-center align-items-center h-100">
                                            <Spinner animation="border" variant="primary" />
                                        </div>
                                    ) : salesByCategoryData && salesByCategoryData.length > 0 ? (
                                        <Bar
                                            id="sales-by-category-chart"
                                            data={{
                                                labels: salesByCategoryData.map(d => d.category),
                                                datasets: [
                                                    {
                                                        label: t('sales_amount') || 'Sales Amount',
                                                        data: salesByCategoryData.map(d => d.sales),
                                                        backgroundColor: (context) => {
                                                            const { ctx, chartArea } = context.chart;
                                                            if (!chartArea) return colorPalettes.gradients.cyan[0];
                                                            return createGradient(ctx, chartArea, colorPalettes.gradients.cyan[0], colorPalettes.gradients.cyan[1]);
                                                        },
                                                        borderRadius: 6,
                                                        borderSkipped: false,
                                                        yAxisID: 'y',
                                                    },
                                                    {
                                                        label: t('orders') || 'Orders',
                                                        data: salesByCategoryData.map(d => d.orders),
                                                        backgroundColor: 'rgba(236, 72, 153, 0.6)',
                                                        borderRadius: 6,
                                                        borderSkipped: false,
                                                        yAxisID: 'y1',
                                                    }
                                                ]
                                            }}
                                            options={{
                                                ...barChartOptions,
                                                plugins: {
                                                    ...barChartOptions.plugins,
                                                    legend: {
                                                        display: true,
                                                        position: 'top',
                                                        labels: { usePointStyle: true, pointStyle: 'circle', padding: 20 }
                                                    }
                                                },
                                                scales: {
                                                    y: {
                                                        type: 'linear',
                                                        position: 'left',
                                                        title: {
                                                            display: true,
                                                            text: t('sales_amount') || 'Sales Amount',
                                                            font: { size: 12, weight: 'bold' }
                                                        },
                                                        ticks: {
                                                            callback: (value) => formatCurrency(value)
                                                        }
                                                    },
                                                    y1: {
                                                        type: 'linear',
                                                        position: 'right',
                                                        title: {
                                                            display: true,
                                                            text: t('orders') || 'Orders',
                                                            font: { size: 12, weight: 'bold' }
                                                        },
                                                        grid: { drawOnChartArea: false }
                                                    }
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="d-flex justify-content-center align-items-center h-100">
                                            <p className="text-muted">{t('no_data_available') || 'No data available'}</p>
                                        </div>
                                    )}
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
                                                    change: stats?.changes?.revenue >= 0 ? `+${stats.changes.revenue}%` : `${stats.changes.revenue}%`,
                                                    isPositive: stats?.changes?.revenue >= 0,
                                                    icon: <FiDollarSign />,
                                                    color: 'primary',
                                                    progress: stats?.progress?.revenue || 0
                                                },
                                                {
                                                    label: t('net_profit') || 'Net Profit',
                                                    value: stats ? formatCurrency(stats.net_profit || 0) : formatCurrency(0),
                                                    change: stats?.changes?.profit >= 0 ? `+${stats.changes.profit}%` : `${stats.changes.profit}%`,
                                                    isPositive: stats?.changes?.profit >= 0,
                                                    icon: <FiTrendingUp />,
                                                    color: 'success',
                                                    progress: stats?.progress?.profit || 0
                                                },
                                                {
                                                    label: t('total_expenses') || 'Total Expenses',
                                                    value: stats ? formatCurrency(stats.total_expenses || 0) : formatCurrency(0),
                                                    change: stats?.changes?.expenses >= 0 ? `+${stats.changes.expenses}%` : `${stats.changes.expenses}%`,
                                                    isPositive: stats?.changes?.expenses < 0, // Expenses decreasing is positive
                                                    icon: <FiDollarSign />,
                                                    color: 'danger',
                                                    progress: stats?.progress?.expenses || 0
                                                },
                                                {
                                                    label: t('gross_profit_margin') || 'Gross Profit Margin',
                                                    value: stats?.progress?.margin ? `${stats.progress.margin}%` : '0%',
                                                    change: stats?.changes?.margin >= 0 ? `+${stats.changes.margin}%` : `${stats.changes.margin}%`,
                                                    isPositive: stats?.changes?.margin >= 0,
                                                    icon: <FiShoppingCart />,
                                                    color: 'info',
                                                    progress: stats?.progress?.margin || 0
                                                },
                                                {
                                                    label: t('total_inventory_value') || 'Total Inventory Value',
                                                    value: stats ? formatCurrency(stats.total_inventory_value || 0) : formatCurrency(0),
                                                    change: stats?.changes?.inventory >= 0 ? `+${stats.changes.inventory}%` : `${stats.changes.inventory}%`,
                                                    isPositive: stats?.changes?.inventory >= 0,
                                                    icon: <FiBox />,
                                                    color: 'warning',
                                                    progress: stats?.progress?.inventory || 0
                                                },
                                                {
                                                    label: t('outstanding_invoices') || 'Outstanding Invoices',
                                                    value: stats ? formatCurrency(stats.outstanding_invoices || 0) : formatCurrency(0),
                                                    change: stats?.changes?.invoices >= 0 ? `+${stats.changes.invoices}%` : `${stats.changes.invoices}%`,
                                                    isPositive: stats?.changes?.invoices < 0,
                                                    icon: <FiClock />,
                                                    color: 'purple',
                                                    progress: stats?.progress?.invoices || 0
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
