import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Dropdown, Table } from 'react-bootstrap';
import moment from 'moment';
import './Dashboard.css'; // Import custom styles
import {
    FiAlertCircle,
    FiPlus,
    FiBarChart2,
    FiSun,
    FiMoon,
    FiRefreshCw,
    FiFilter
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
import { dashboardAPI, branchesAPI } from '../services/api';
import { useAuth } from '../components/auth/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import {
    colorPalettes,
    lineChartOptions,
    barChartOptions,
    doughnutChartOptions,
    createGradient,
    hexToRgb,
    animationConfig
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
    const [salesByCategoryData, setSalesByCategoryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [branches, setBranches] = useState([]);
    const [currentPeriod, setCurrentPeriod] = useState('weekly');
    const [selectedMetric, setSelectedMetric] = useState('revenue');
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [animateCharts, setAnimateCharts] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const [showPeriodDrop, setShowPeriodDrop] = useState(false);
    const [showMetricDrop, setShowMetricDrop] = useState(false);
    const [showBranchDrop, setShowBranchDrop] = useState(false);

    const { user } = useAuth();
    
    const { formatCurrency, currencySymbol } = useCurrency();

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Calculate date range based on period
            const endDate = moment().endOf('day');
            let startDate;
            
            switch (currentPeriod) {
                case 'daily':
                    startDate = moment().subtract(30, 'days').startOf('day');
                    break;
                case 'weekly':
                    startDate = moment().subtract(12, 'weeks').startOf('week');
                    break;
                case 'monthly':
                    startDate = moment().subtract(12, 'months').startOf('month');
                    break;
                case 'yearly':
                    startDate = moment().subtract(5, 'years').startOf('year');
                    break;
                default:
                    startDate = moment().subtract(7, 'days').startOf('day');
            }
            
            const apiParams = {
                start_date: startDate.format("YYYY-MM-DD"),
                end_date: endDate.format("YYYY-MM-DD"),
                period: currentPeriod
            };
            
            // Add branch filter if not 'all'
            if (selectedBranch !== 'all') {
                apiParams.branch_id = selectedBranch;
            }
            
            const [statsRes, salesRes, revenueExpenseRes] = await Promise.all([
                dashboardAPI.getStats(apiParams),
                dashboardAPI.getSalesChart(currentPeriod, apiParams),
                dashboardAPI.getRevenueExpenseChart(currentPeriod, apiParams)
            ]);

            setStats(statsRes.data.stats);
            setSalesData(salesRes.data.sales_data);
            setPreviousSalesData(salesRes.data.previous_sales_data);
            setRevenueExpenseData(revenueExpenseRes.data.chart_data);
            
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
            let errorMessage = "dashboard_load_error";

            if (err.response) {
                if (err.response.status === 401) {
                    errorMessage = "session_expired";
                } else if (err.response.status === 403) {
                    errorMessage = err.response.data?.message || err.response.data?.error || "dashboard_permission_error";
                } else if (err.response.data?.error) {
                    errorMessage = `Error: ${err.response.data.error}`;
                }
            } else if (err.request) {
                errorMessage = "server_connection_error";
            } else {
                errorMessage = `Error: ${err.message}`;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [currentPeriod, selectedBranch]);

    useEffect(() => {
        fetchDashboardData();
        // Trigger chart animations after data loads
        setTimeout(() => setAnimateCharts(true), 1000);
    }, [fetchDashboardData]);

    useEffect(() => {
        const saved = localStorage.getItem('dashboardDarkMode');
        if (saved) {
            setDarkMode(saved === 'true');
        }
    }, []);

    const toggleDarkMode = () => {
        const next = !darkMode;
        setDarkMode(next);
        localStorage.setItem('dashboardDarkMode', String(next));
    };

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch branches for quick action menu
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const response = await branchesAPI.getAccessibleBranches();
                setBranches(response.data.branches || []);
            } catch (err) {
                console.error('Error fetching branches:', err);
            }
        };
        fetchBranches();
    }, []);

    const formatNumberAmount = (amount) => {
        const num = parseFloat(amount) || 0;
        const locale = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en-US';
        return num.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatInteger = (value) => {
        const num = parseInt(value || 0, 10) || 0;
        const locale = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en-US';
        return num.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };


    const lineData = {
        labels: salesData ? salesData.map(d => d.label) : [],
        datasets: [
            {
                label: "current_period" || 'Current Period',
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
                label: "previous_period" || 'Previous Period',
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

    const getThemedOptions = (base) => {
        const legendColor = darkMode ? '#cbd5e1' : '#475569';
        const tickColor = darkMode ? '#cbd5e1' : '#475569';
        const gridColor = darkMode ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.1)';
        return {
            ...base,
            plugins: {
                ...base.plugins,
                legend: base.plugins && base.plugins.legend ? {
                    ...base.plugins.legend,
                    labels: {
                        ...(base.plugins.legend.labels || {}),
                        color: legendColor
                    }
                } : undefined,
                tooltip: base.plugins && base.plugins.tooltip ? {
                    ...base.plugins.tooltip,
                    titleColor: darkMode ? '#e2e8f0' : base.plugins.tooltip.titleColor,
                    bodyColor: darkMode ? '#cbd5e1' : base.plugins.tooltip.bodyColor,
                    backgroundColor: darkMode ? 'rgba(15,23,42,0.9)' : base.plugins.tooltip.backgroundColor,
                    borderColor: darkMode ? '#334155' : base.plugins.tooltip.borderColor
                } : undefined
            },
            scales: base.scales ? {
                ...base.scales,
                x: base.scales.x ? {
                    ...base.scales.x,
                    ticks: {
                        ...(base.scales.x.ticks || {}),
                        color: tickColor
                    },
                    grid: {
                        ...(base.scales.x.grid || {}),
                        color: gridColor
                    }
                } : undefined,
                y: base.scales.y ? {
                    ...base.scales.y,
                    ticks: {
                        ...(base.scales.y.ticks || {}),
                        color: tickColor
                    },
                    grid: {
                        ...(base.scales.y.grid || {}),
                        color: gridColor
                    }
                } : undefined
            } : undefined
        };
    };

    const themedLineOptions = getThemedOptions(enhancedLineChartOptions);
    const themedBarOptions = getThemedOptions(barChartOptions);
    const themedDoughnutOptions = {
        ...doughnutChartOptions,
        plugins: {
            ...(doughnutChartOptions.plugins || {}),
            legend: doughnutChartOptions.plugins && doughnutChartOptions.plugins.legend ? {
                ...doughnutChartOptions.plugins.legend,
                labels: {
                    ...(doughnutChartOptions.plugins.legend.labels || {}),
                    color: darkMode ? '#cbd5e1' : '#475569'
                }
            } : undefined,
            tooltip: doughnutChartOptions.plugins && doughnutChartOptions.plugins.tooltip ? {
                ...doughnutChartOptions.plugins.tooltip,
                titleColor: darkMode ? '#e2e8f0' : doughnutChartOptions.plugins.tooltip.titleColor,
                bodyColor: darkMode ? '#cbd5e1' : doughnutChartOptions.plugins.tooltip.bodyColor,
                backgroundColor: darkMode ? 'rgba(15,23,42,0.9)' : doughnutChartOptions.plugins.tooltip.backgroundColor,
                borderColor: darkMode ? '#334155' : doughnutChartOptions.plugins.tooltip.borderColor
            } : undefined
        }
    };

    const chartHeights = (() => {
        if (windowWidth < 576) {
            return { main: 220, side: 200, bar: 220, orders: 200 };
        }
        if (windowWidth < 768) {
            return { main: 280, side: 240, bar: 260, orders: 240 };
        }
        return { main: 350, side: 350, bar: 300, orders: 300 };
    })();

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
                            {"Refresh"}
                        </Button>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const getEncouragementMessage = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Ready to tackle the day?';
        if (hour < 18) return 'Keep up the great work!';
        return 'Great job today!';
    };



    const greeting = getGreeting();
    const encouragement = getEncouragementMessage();

    return (
        <div className={`dashboard-modern min-vh-100 ${darkMode ? 'dark-theme' : ''}`}>
            <Container fluid className="p-0">
                {/* Modern Header with Gradient */}
                <div className="dashboard-header-gradient position-relative overflow-hidden">
                    <div className="header-pattern-bg"></div>
                    <Container fluid className="position-relative">
                        <Row className="align-items-center py-4">
                            <Col lg={8}>
                                <div className="welcome-section-modern">
                                    <div className="d-flex align-items-center gap-3 mb-3">
                                        <div>
                                            <h1 className="welcome-title-modern mb-0">
                                                {greeting}, {user ? user.first_name || user.username || 'User' : 'Admin'}
                                            </h1>
                                            <p className="welcome-subtitle-modern text-muted mb-0">{encouragement}</p>
                                        </div>
                                    </div>
                                    <p className="welcome-desc-modern text-muted mb-0">Real-time business insights and performance metrics</p>
                                </div>
                            </Col>
                            <Col lg={4} className="text-lg-end mt-3 mt-lg-0">
                                <div className="header-actions-modern d-flex gap-2 justify-content-lg-end flex-wrap">
                                    <Button
                                        variant="light"
                                        className="action-btn-modern"
                                        onClick={() => setShowFilters(!showFilters)}
                                    >
                                        <FiFilter size={16} className="me-2" />
                                        Filters
                                    </Button>
                                    <Button
                                        variant="light"
                                        className="action-btn-modern"
                                        onClick={toggleDarkMode}
                                    >
                                        {darkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
                                    </Button>
                                    <Button
                                        variant="light"
                                        className="action-btn-modern"
                                        onClick={() => fetchDashboardData()}
                                        disabled={loading}
                                    >
                                        <FiRefreshCw size={16} className={loading ? 'spin-icon' : ''} />
                                    </Button>
                                    <Dropdown>
                                        <Dropdown.Toggle variant="primary" className="action-btn-modern-primary">
                                            <FiPlus size={16} className="me-2" />
                                            Quick Action
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu className="dropdown-menu-modern">
                                            <Dropdown.Item href="/sales" className="dropdown-item-modern">
                                                New Sale
                                            </Dropdown.Item>
                                            <Dropdown.Item href="/customers" className="dropdown-item-modern">
                                                Add Customer
                                            </Dropdown.Item>
                                            <Dropdown.Item href="/products" className="dropdown-item-modern">
                                                Add Product
                                            </Dropdown.Item>
                                            <Dropdown.Divider />
                                            <Dropdown.Item href="/reports" className="dropdown-item-modern">
                                                <FiBarChart2 className="text-warning me-2" /> Generate Report
                                            </Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <Container fluid className="filter-panel-modern mb-4">
                        <Card className="border-0 shadow-sm">
                            <Card.Body className="p-3">
                                <Row className="align-items-center">
                                    <Col md={3}>
                                        <label className="filter-label">Period</label>
                                        <Dropdown
                                            onMouseEnter={() => setShowPeriodDrop(true)}
                                            onMouseLeave={() => setShowPeriodDrop(false)}
                                            onToggle={(isOpen) => setShowPeriodDrop(isOpen)}
                                            show={showPeriodDrop}
                                        >
                                            <Dropdown.Toggle variant="outline-secondary" className="filter-dropdown w-100">
                                                {currentPeriod === 'daily' ? 'Last 30 Days' : 
                                                 currentPeriod === 'weekly' ? 'Last 12 Weeks' : 
                                                 currentPeriod === 'monthly' ? 'Last 12 Months' : 'Last 5 Years'}
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="w-100">
                                                <Dropdown.Item onClick={() => setCurrentPeriod('daily')}>
                                                    Last 30 Days
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => setCurrentPeriod('weekly')}>
                                                    Last 12 Weeks
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => setCurrentPeriod('monthly')}>
                                                    Last 12 Months
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => setCurrentPeriod('yearly')}>
                                                    Last 5 Years
                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </Col>
                                    <Col md={3}>
                                        <label className="filter-label">Metric Focus</label>
                                        <Dropdown
                                            onMouseEnter={() => setShowMetricDrop(true)}
                                            onMouseLeave={() => setShowMetricDrop(false)}
                                            onToggle={(isOpen) => setShowMetricDrop(isOpen)}
                                            show={showMetricDrop}
                                        >
                                            <Dropdown.Toggle variant="outline-secondary" className="filter-dropdown w-100">
                                                {selectedMetric === 'revenue' ? 'Revenue' : 
                                                 selectedMetric === 'profit' ? 'Profit' : 
                                                 selectedMetric === 'orders' ? 'Orders' : 'Customers'}
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="w-100">
                                                <Dropdown.Item onClick={() => setSelectedMetric('revenue')}>
                                                    Revenue
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => setSelectedMetric('profit')}>
                                                    Profit
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => setSelectedMetric('orders')}>
                                                    Orders
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => setSelectedMetric('customers')}>
                                                    Customers
                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </Col>
                                    <Col md={3}>
                                        <label className="filter-label">Branch</label>
                                        <Dropdown
                                            onMouseEnter={() => setShowBranchDrop(true)}
                                            onMouseLeave={() => setShowBranchDrop(false)}
                                            onToggle={(isOpen) => setShowBranchDrop(isOpen)}
                                            show={showBranchDrop}
                                        >
                                            <Dropdown.Toggle variant="outline-secondary" className="filter-dropdown w-100">
                                                {selectedBranch === 'all' ? 'All Branches' : 
                                                 branches.find(b => b.id === selectedBranch)?.name || 'All Branches'}
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="w-100">
                                                <Dropdown.Item onClick={() => setSelectedBranch('all')}>
                                                    All Branches
                                                </Dropdown.Item>
                                                {branches.map(branch => (
                                                    <Dropdown.Item key={branch.id} onClick={() => setSelectedBranch(branch.id)}>
                                                        {branch.name}
                                                    </Dropdown.Item>
                                                ))}
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </Col>
                                    <Col md={3} className="text-end">
                                        <Button variant="outline-secondary" size="sm" className="mt-3" onClick={() => setShowFilters(false)}>
                                            Close
                                        </Button>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Container>
                )}

                <Container fluid className="px-4">
                    {/* Modern KPI Cards */}
                    <Row className="g-3 mb-4 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5">
                        {[ 
                            {
                                title: "Total Revenue",
                                amount: stats ? (stats.total_revenue || 0) : 0,
                                showCurrency: true,
                                change: stats?.changes?.revenue || 0,
                                color: 'primary',
                                trend: 'up'
                            },
                            {
                                title: "Net Profit",
                                amount: stats ? (stats.net_profit || 0) : 0,
                                showCurrency: true,
                                change: stats?.changes?.profit || 0,
                                color: 'success',
                                trend: 'up'
                            },
                            {
                                title: "Active Orders",
                                amount: stats ? stats.total_orders : 0,
                                showCurrency: false,
                                change: 12.5,
                                color: 'info',
                                trend: 'up'
                            },
                            {
                                title: "Total Products",
                                amount: stats ? stats.total_products : 0,
                                showCurrency: false,
                                change: 5.2,
                                color: 'warning',
                                trend: 'up'
                            },
                            {
                                title: "Active Customers",
                                amount: stats ? stats.total_customers : 0,
                                showCurrency: false,
                                change: 8.7,
                                color: 'purple',
                                trend: 'up'
                            }
                        ].map((kpi, idx) => (
                            <Col key={idx} className="d-flex">
                                <div className={`kpi-card-modern kpi-${kpi.color} ${animateCharts ? 'animate-in' : ''} h-100`} style={{ animationDelay: `${idx * 100}ms` }}>
                                    <div className="kpi-content-modern">
                                        <p className="kpi-title-modern text-muted">{kpi.title}</p>
                                        <h3 className="kpi-value-modern">
                                            {kpi.showCurrency ? formatNumberAmount(kpi.amount) : formatInteger(kpi.amount)}
                                        </h3>
                                        {kpi.showCurrency && (
                                            <p className="kpi-currency-modern text-muted">{currencySymbol}</p>
                                        )}
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>

                    {/* Advanced Charts Section */}
                    <Row className="g-4 mb-4">
                        <Col xl={8}>
                            <div className="chart-container-modern">
                                <div className="chart-header-modern">
                                    <div>
                                        <h3 className="chart-title-modern">Revenue Analytics</h3>
                                        <p className="chart-subtitle-modern text-muted">Performance trends and comparisons</p>
                                    </div>
                                    <div className="chart-metrics">
                                        <div className="metric-item">
                                            <span className="metric-value">{salesData ? formatCurrency(salesData.reduce((acc, curr) => acc + curr.revenue, 0)) : formatCurrency(0)}</span>
                                            <span className="metric-label">Total Revenue</span>
                                        </div>
                                        <div className="metric-item">
                                            <span className={`metric-change ${(() => {
                                                const currentTotal = salesData ? salesData.reduce((acc, curr) => acc + curr.revenue, 0) : 0;
                                                const prevTotal = previousSalesData ? previousSalesData.reduce((acc, curr) => acc + curr, 0) : 0;
                                                const growth = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
                                                return growth >= 0 ? 'positive' : 'negative';
                                            })()}`}>
                                                {(() => {
                                                    const currentTotal = salesData ? salesData.reduce((acc, curr) => acc + curr.revenue, 0) : 0;
                                                    const prevTotal = previousSalesData ? previousSalesData.reduce((acc, curr) => acc + curr, 0) : 0;
                                                    const growth = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
                                                    return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
                                                })()}
                                            </span>
                                            <span className="metric-label">vs Previous</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="chart-body-modern" style={{ height: `${chartHeights.main}px` }}>
                                    {loading ? (
                                        <div className="d-flex justify-content-center align-items-center h-100">
                                            <Spinner animation="border" variant="primary" />
                                        </div>
                                    ) : (
                                        <Line
                                            data={lineData}
                                            options={{
                                                ...themedLineOptions,
                                                ...animationConfig
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        </Col>
                        <Col xl={4}>
                            <div className="chart-container-modern">
                                <div className="chart-header-modern">
                                    <div>
                                        <h3 className="chart-title-modern">Sales by Category</h3>
                                        <p className="chart-subtitle-modern text-muted">Revenue distribution</p>
                                    </div>
                                </div>
                                <div className="chart-body-modern" style={{ height: `${chartHeights.side}px` }}>
                                    {loading ? (
                                        <div className="d-flex justify-content-center align-items-center h-100">
                                            <Spinner animation="border" variant="primary" />
                                        </div>
                                    ) : salesByCategoryData && salesByCategoryData.length > 0 ? (
                                        <Doughnut
                                            data={{
                                                labels: salesByCategoryData.map(d => d.category),
                                                datasets: [{
                                                    data: salesByCategoryData.map(d => d.sales),
                                                    backgroundColor: [
                                                        colorPalettes.vibrant[0],
                                                        colorPalettes.vibrant[1],
                                                        colorPalettes.vibrant[2],
                                                        colorPalettes.vibrant[3],
                                                        colorPalettes.vibrant[4],
                                                    ],
                                                    borderWidth: 0,
                                                    hoverOffset: 4
                                                }]
                                            }}
                                            options={{
                                                ...themedDoughnutOptions,
                                                ...animationConfig,
                                                plugins: {
                                                    ...(themedDoughnutOptions.plugins || {}),
                                                    tooltip: {
                                                        ...((themedDoughnutOptions.plugins && themedDoughnutOptions.plugins.tooltip) || {}),
                                                        callbacks: {
                                                            label: function(context) {
                                                                const label = context.label || '';
                                                                const value = formatCurrency(context.parsed);
                                                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                                                return `${label}: ${value} (${percentage}%)`;
                                                            }
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="d-flex justify-content-center align-items-center h-100">
                                            <p className="text-muted">No data available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Secondary Charts Row */}
                    <Row className="g-4 mb-4">
                        <Col xl={6}>
                            <div className="chart-container-modern">
                                <div className="chart-header-modern">
                                    <div>
                                        <h3 className="chart-title-modern">Revenue vs Expenses</h3>
                                        <p className="chart-subtitle-modern text-muted">Financial performance comparison</p>
                                    </div>
                                </div>
                                <div className="chart-body-modern" style={{ height: `${chartHeights.bar}px` }}>
                                    {loading ? (
                                        <div className="d-flex justify-content-center align-items-center h-100">
                                            <Spinner animation="border" variant="primary" />
                                        </div>
                                    ) : (
                                        <Bar
                                            data={{
                                                labels: revenueExpenseData ? revenueExpenseData.labels : [],
                                                datasets: [
                                                    {
                                                        label: "Revenue",
                                                        data: revenueExpenseData ? revenueExpenseData.revenue : [],
                                                        backgroundColor: (context) => {
                                                            const { ctx, chartArea } = context.chart;
                                                            if (!chartArea) return colorPalettes.comparison.revenue;
                                                            return createGradient(ctx, chartArea, colorPalettes.comparison.revenue, '#059669');
                                                        },
                                                        borderRadius: 8,
                                                        borderSkipped: false,
                                                    },
                                                    {
                                                        label: "Expenses",
                                                        data: revenueExpenseData ? revenueExpenseData.expense : [],
                                                        backgroundColor: (context) => {
                                                            const { ctx, chartArea } = context.chart;
                                                            if (!chartArea) return colorPalettes.comparison.expense;
                                                            return createGradient(ctx, chartArea, colorPalettes.comparison.expense, '#b91c1c');
                                                        },
                                                        borderRadius: 8,
                                                        borderSkipped: false,
                                                    }
                                                ]
                                            }}
                                            options={{
                                                ...themedBarOptions,
                                                ...animationConfig,
                                                plugins: {
                                                    ...(themedBarOptions.plugins || {}),
                                                    tooltip: {
                                                        ...((themedBarOptions.plugins && themedBarOptions.plugins.tooltip) || {}),
                                                        callbacks: {
                                                            label: function(context) {
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
                                                }
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        </Col>
                        <Col xl={6}>
                            <div className="chart-container-modern">
                                <div className="chart-header-modern">
                                    <div>
                                        <h3 className="chart-title-modern">Sales Volume Trend</h3>
                                        <p className="chart-subtitle-modern text-muted">Order quantity over time</p>
                                    </div>
                                </div>
                                <div className="chart-body-modern" style={{ height: `${chartHeights.orders}px` }}>
                                    {loading ? (
                                        <div className="d-flex justify-content-center align-items-center h-100">
                                            <Spinner animation="border" variant="primary" />
                                        </div>
                                    ) : (
                                        <Bar
                                            data={{
                                                labels: salesData ? salesData.map(d => d.label) : [],
                                                datasets: [{
                                                    label: "Orders",
                                                    data: salesData ? salesData.map(d => d.orders) : [],
                                                    backgroundColor: (context) => {
                                                        const { ctx, chartArea } = context.chart;
                                                        if (!chartArea) return colorPalettes.gradients.purple[0];
                                                        return createGradient(ctx, chartArea, colorPalettes.gradients.purple[0], colorPalettes.gradients.purple[1]);
                                                    },
                                                    borderRadius: 8,
                                                    borderSkipped: false,
                                                }]
                                            }}
                                            options={{
                                                ...themedBarOptions,
                                                ...animationConfig,
                                                plugins: {
                                                    ...(themedBarOptions.plugins || {}),
                                                    legend: { display: false }
                                                }
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Financial Summary */}
                    <Row className="g-4 mb-4">
                        <Col xl={12}>
                            <div className="chart-container-modern">
                                <div className="chart-header-modern">
                                    <div>
                                        <h3 className="chart-title-modern">Financial Summary</h3>
                                        <p className="chart-subtitle-modern text-muted">Key financial totals</p>
                                    </div>
                                </div>
                                <div className="chart-body-modern">
                                    {(() => {
                                        const revenueTotal = revenueExpenseData ? (revenueExpenseData.revenue || []).reduce((a, b) => a + b, 0) : 0;
                                        const expenseTotal = revenueExpenseData ? (revenueExpenseData.expense || []).reduce((a, b) => a + b, 0) : 0;
                                        const netProfitTotal = revenueTotal - expenseTotal;
                                        const cashFlowTotal = netProfitTotal;
                                        return (
                                            <div className="table-responsive">
                                                <Table bordered hover size="sm" className="financial-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Metric</th>
                                                            <th className="text-end">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>Net Sales</td>
                                                            <td className="text-end">{formatCurrency(revenueTotal)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Total Expenses</td>
                                                            <td className="text-end">{formatCurrency(expenseTotal)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Net Profit</td>
                                                            <td className="text-end">{formatCurrency(netProfitTotal)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Operating Cash Flow</td>
                                                            <td className="text-end">{formatCurrency(cashFlowTotal)}</td>
                                                        </tr>
                                                    </tbody>
                                                </Table>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </Container>
        </div>
    );
};

export default Dashboard;

