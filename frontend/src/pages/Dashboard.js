import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Dropdown, Table, Badge } from 'react-bootstrap';
import './Dashboard.css'; // Import custom styles
import {
    FiAlertCircle,
    FiPlus,
    FiBarChart2,
    FiRefreshCw,
    FiFilter,
    FiMapPin,
    FiTrendingUp,
    FiDollarSign,
    FiShoppingBag,
    FiUsers,
    FiMoon,
    FiSun
} from 'react-icons/fi';
import DateRangeSelector from '../components/DateRangeSelector';
import { DATE_RANGES, calculateDateRange, formatDateForAPI, getDateRangeLabel } from '../utils/dateRanges';
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
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { formatNumberAmount } from '../utils/formatters';
import {
    colorPalettes,
    lineChartOptions,
    barChartOptions,
    doughnutChartOptions,
    createGradient,
    hexToRgb,
    animationConfig
} from '../config/chartConfig';
import heroBg from '../assets/images/dashboard_hero.png';

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
    const [financialSummary, setFinancialSummary] = useState(null);
    const [salesByCategoryData, setSalesByCategoryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [branches, setBranches] = useState([]);
    const [dateRange, setDateRange] = useState(DATE_RANGES.THIS_MONTH);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedMetric, setSelectedMetric] = useState('revenue');
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [animateCharts, setAnimateCharts] = useState(false);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const [showMetricDrop, setShowMetricDrop] = useState(false);
    const [showBranchDrop, setShowBranchDrop] = useState(false);
    const [showQuickBranchDrop, setShowQuickBranchDrop] = useState(false);
    const [currentBranch, setCurrentBranch] = useState(null);
    const [switchingBranch, setSwitchingBranch] = useState(false);
    const { user } = useAuth();
    const { theme, toggleTheme: toggleGlobalTheme } = useTheme();
    const darkMode = theme === 'dark';
    
    const { formatCurrency, currencySymbol } = useCurrency();

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Calculate date range based on selection
            const dateRangeObj = calculateDateRange(dateRange, customStartDate, customEndDate);
            
            const apiParams = {
                start_date: formatDateForAPI(dateRangeObj.startDate),
                end_date: formatDateForAPI(dateRangeObj.endDate),
                // pass a dummy period since we override with start/end dates anyway
                period: 'custom'
            };
            
            // Add branch filter if not 'all'
            if (selectedBranch !== 'all') {
                apiParams.branch_id = selectedBranch;
            }
            
            const [statsRes, salesRes, revenueExpenseRes] = await Promise.all([
                dashboardAPI.getStats(apiParams),
                dashboardAPI.getSalesChart('custom', apiParams),
                dashboardAPI.getRevenueExpenseChart('custom', apiParams)
            ]);

            setStats(statsRes.data.stats);
            setSalesData(salesRes.data.sales_data);
            setPreviousSalesData(salesRes.data.previous_sales_data);
            setRevenueExpenseData(revenueExpenseRes.data.chart_data);
            setFinancialSummary(revenueExpenseRes.data.financial_summary);
            
            // Set sales by category data using backend revenue_distribution
            if (statsRes.data.stats?.revenue_distribution) {
                const dist = statsRes.data.stats.revenue_distribution || {};
                const transformed = Object.entries(dist)
                    .map(([category, amount]) => ({ category, sales: amount }))
                    .sort((a, b) => (b.sales || 0) - (a.sales || 0));
                setSalesByCategoryData(transformed);
            } else {
                setSalesByCategoryData([]);
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            let errorMessage = "Failed to load dashboard data. Please try again.";

            if (err.response) {
                if (err.response.status === 401) {
                    errorMessage = "Your session has expired. Please login again.";
                } else if (err.response.status === 403) {
                    errorMessage = err.response.data?.message || err.response.data?.error || "You don't have permission to access the dashboard.";
                } else if (err.response.data?.error) {
                    errorMessage = `Error: ${err.response.data.error}`;
                }
            } else if (err.request) {
                errorMessage = "Cannot connect to the server. Please check your internet connection.";
            } else {
                errorMessage = `Error: ${err.message}`;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [dateRange, customStartDate, customEndDate, selectedBranch]);

    useEffect(() => {
        fetchDashboardData();
        // Trigger chart animations after data loads
        setTimeout(() => setAnimateCharts(true), 1000);
    }, [fetchDashboardData]);

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
                const branchesList = response.data.branches || [];
                setBranches(branchesList);
                
                // Set current branch (default branch)
                const defaultBranch = branchesList.find(b => b.is_default);
                if (defaultBranch) {
                    setCurrentBranch(defaultBranch);
                } else if (branchesList.length > 0) {
                    setCurrentBranch(branchesList[0]);
                }
            } catch (err) {
                console.error('Error fetching branches:', err);
            }
        };
        fetchBranches();
    }, []);

    const formatInteger = (value) => {
        const num = parseInt(value || 0, 10) || 0;
        const locale = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en-US';
        return num.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };

    const handleBranchSwitch = async (branchId) => {
        if (currentBranch && currentBranch.id === branchId) {
            return; // Already on this branch
        }

        setSwitchingBranch(true);
        try {
            const response = await branchesAPI.switchBranch(branchId);
            const newBranch = response.data.branch;
            setCurrentBranch(newBranch);

            // Show success message
            toast.success(`Switched to ${newBranch.name}`, {
                icon: '🏢',
                duration: 3000
            });

            // Reload page to refresh branch-specific data
            setTimeout(() => {
                window.location.reload();
            }, 500);

        } catch (error) {
            console.error('Error switching branch:', error);
            toast.error(error.response?.data?.error || 'Failed to switch branch');
        } finally {
            setSwitchingBranch(false);
        }
    };


    const lineData = {
        labels: salesData ? salesData.map(d => d.label) : [],
        datasets: [
            {
                label: 'Current Period',
                data: salesData ? salesData.map(d => d.revenue) : [],
                fill: true,
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return 'rgba(16, 185, 129, 0.1)';
                    const color = '#10b981';
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, `rgba(${hexToRgb(color)}, 0)`);
                    gradient.addColorStop(1, `rgba(${hexToRgb(color)}, 0.2)`);
                    return gradient;
                },
                borderColor: '#10b981',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#10b981',
                pointBorderWidth: 2,
                pointHoverBorderWidth: 3,
                zIndex: 2
            },
            {
                label: 'Previous Period',
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

    const toggleDarkMode = () => {
        toggleGlobalTheme();
    };

    const getThemedOptions = (base) => {
        const legendColor = darkMode ? '#e2e8f0' : '#475569';
        const tickColor = darkMode ? '#e2e8f0' : '#475569';
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
                    backgroundColor: base.plugins.tooltip.backgroundColor,
                    borderColor: base.plugins.tooltip.borderColor
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
                    color: '#475569'
                }
            } : undefined,
            tooltip: doughnutChartOptions.plugins && doughnutChartOptions.plugins.tooltip ? {
                ...doughnutChartOptions.plugins.tooltip,
                backgroundColor: doughnutChartOptions.plugins.tooltip.backgroundColor,
                borderColor: doughnutChartOptions.plugins.tooltip.borderColor
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
                {/* Premium Hero Section - Clean Style */}
                <div className="dashboard-hero-section position-relative overflow-hidden mb-4">
                    <Container fluid className="position-relative z-index-2">
                        <Row className="align-items-center py-5 px-4">
                            <Col lg={8}>
                                <div className="hero-content-modern animate-in">
                                    <div className="d-flex align-items-center gap-3 mb-2">
                                        <div className="greeting-pill px-3 py-1 rounded-pill bg-primary bg-opacity-10 text-primary small fw-bold text-uppercase">
                                            {greeting}
                                        </div>
                                    </div>
                                    <h1 className="hero-title-modern mb-2">
                                        Welcome back, <span className="text-primary">{user ? user.first_name || user.username || 'User' : 'Admin'}</span>
                                    </h1>
                                    <p className="hero-subtitle-modern text-muted h5 fw-normal mb-4">
                                        {encouragement} You have <span className="fw-bold text-dark">{stats ? stats.total_orders : 0} active orders</span> to review today.
                                    </p>
                                    
                                    <div className="hero-quick-stats d-flex gap-4 flex-wrap">
                                        <div className="quick-stat-item">
                                            <span className="d-block text-muted small text-uppercase fw-bold">Daily Revenue</span>
                                            <span className="h4 mb-0 fw-bold">{formatCurrency(stats?.total_revenue || 0)}</span>
                                        </div>
                                        <div className="quick-stat-item border-start ps-4">
                                            <span className="d-block text-muted small text-uppercase fw-bold">Active Branch</span>
                                            <span className="h4 mb-0 fw-bold text-info"><FiMapPin className="me-1" /> {currentBranch?.name || 'Main'}</span>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                            <Col lg={4} className="text-lg-end mt-4 mt-lg-0">
                                <div className="hero-actions-container d-flex flex-column gap-3 align-items-lg-end">
                                    <div className="d-flex gap-2">
                                        <Button
                                            variant="light"
                                            className="hero-action-btn shadow-sm border-0"
                                            onClick={toggleDarkMode}
                                        >
                                            {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
                                        </Button>
                                        <Button
                                            variant="light"
                                            className="hero-action-btn shadow-sm border-0"
                                            onClick={() => setShowFilters(!showFilters)}
                                        >
                                            <FiFilter size={18} />
                                        </Button>
                                        <Button
                                            variant="light"
                                            className="hero-action-btn shadow-sm border-0"
                                            onClick={() => fetchDashboardData()}
                                            disabled={loading}
                                        >
                                            <FiRefreshCw size={18} className={loading ? 'spin-icon' : ''} />
                                        </Button>
                                    </div>
                                    <Dropdown>
                                        <Dropdown.Toggle variant="primary" className="hero-primary-btn shadow border-0 px-4 py-2 rounded-3">
                                            <FiPlus size={20} className="me-2" />
                                            Business Actions
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu className="dropdown-menu-modern shadow-lg border-0 rounded-4 p-2">
                                            <Dropdown.Item href="/sales" className="rounded-3 py-2"><FiShoppingBag className="me-2 text-primary" /> New Sale</Dropdown.Item>
                                            <Dropdown.Item href="/customers" className="rounded-3 py-2"><FiUsers className="me-1 text-success" /> Add Customer</Dropdown.Item>
                                            <Dropdown.Item href="/reports" className="rounded-3 py-2"><FiBarChart2 className="me-2 text-warning" /> Reports</Dropdown.Item>
                                            <Dropdown.Divider />
                                            <div className="px-3 py-1">
                                                <Dropdown
                                                    drop="end"
                                                    show={showQuickBranchDrop}
                                                    onToggle={(isOpen) => setShowQuickBranchDrop(isOpen)}
                                                >
                                                    <Dropdown.Toggle 
                                                        variant="link" 
                                                        className="dropdown-item p-0 text-decoration-none d-flex align-items-center w-100 text-dark"
                                                    >
                                                        <FiMapPin className="text-info me-2" /> Switch Branch
                                                    </Dropdown.Toggle>
                                                    <Dropdown.Menu className="shadow-lg border-0 rounded-4">
                                                        <div className="px-3 py-2 border-bottom bg-light">
                                                            <h6 className="mb-0 fw-bold small">Select Branch</h6>
                                                            <small className="text-muted">Current: {currentBranch?.name || 'None'}</small>
                                                        </div>
                                                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                            {branches.map((branch) => (
                                                                <Dropdown.Item
                                                                    key={branch.id}
                                                                    onClick={() => handleBranchSwitch(branch.id)}
                                                                    disabled={switchingBranch || (currentBranch && currentBranch.id === branch.id)}
                                                                    className={`small ${currentBranch && currentBranch.id === branch.id ? 'active' : ''}`}
                                                                >
                                                                    {branch.name}
                                                                </Dropdown.Item>
                                                            ))}
                                                        </div>
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </div>
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
                                        <label className="filter-label mb-2 d-block text-muted small fw-bold">Period</label>
                                        <DateRangeSelector
                                            value={dateRange}
                                            onChange={(range, start, end) => {
                                                setDateRange(range);
                                                if (range === DATE_RANGES.CUSTOM_RANGE && start && end) {
                                                    setCustomStartDate(start);
                                                    setCustomEndDate(end);
                                                }
                                            }}
                                            className="w-100"
                                        />
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
                    <Row className="kpi-row-modern g-3 mb-4 row-cols-2 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-4 row-cols-xxl-5">
                        {[ 
                            {
                                title: "Total Revenue",
                                amount: stats ? (stats.total_revenue || 0) : 0,
                                showCurrency: true,
                                icon: <FiTrendingUp />,
                                color: 'primary'
                            },
                            {
                                title: "Final Profit",
                                amount: stats ? (stats.net_profit || 0) : 0,
                                showCurrency: true,
                                icon: <FiDollarSign />,
                                color: 'success'
                            },
                            {
                                title: "Active Orders",
                                amount: stats ? stats.total_orders : 0,
                                showCurrency: false,
                                icon: <FiShoppingBag />,
                                color: 'warning'
                            },
                            {
                                title: "Total Products",
                                amount: stats ? stats.total_products : 0,
                                showCurrency: false,
                                icon: <FiAlertCircle />,
                                color: 'danger'
                            },
                            {
                                title: "Active Customers",
                                amount: stats ? stats.total_customers : 0,
                                showCurrency: false,
                                icon: <FiUsers />,
                                color: 'info'
                            }
                        ].map((kpi, idx) => (
                            <Col key={idx} className="d-flex">
                                <div className={`kpi-card-modern kpi-${kpi.color} ${animateCharts ? 'animate-in' : ''} h-100`} style={{ animationDelay: `${idx * 100}ms` }}>
                                    <div className="kpi-header-modern mb-2">
                                        <div className={`kpi-icon-modern icon-${kpi.color}`}>
                                            {kpi.icon}
                                        </div>
                                    </div>
                                    <div className="kpi-content-modern text-start">
                                        <p className="kpi-title-modern text-muted mb-1">{kpi.title}</p>
                                        <div className="d-flex align-items-baseline gap-1">
                                            {kpi.showCurrency && <span className="kpi-currency-modern">{currencySymbol}</span>}
                                            <h3 className="kpi-value-modern">
                                                {kpi.showCurrency ? formatNumberAmount(kpi.amount) : formatInteger(kpi.amount)}
                                            </h3>
                                        </div>
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

                    {/* Enhanced Financial Summary Table */}
                    <Row className="g-4 mb-5">
                        <Col xl={12}>
                            <div className="chart-container-modern">
                                <div className="chart-header-modern border-bottom pb-4 mb-4">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="kpi-icon-modern bg-primary-subtle text-primary p-3 rounded-4">
                                            <FiBarChart2 size={24} />
                                        </div>
                                        <div>
                                            <h3 className="chart-title-modern fs-4">Financial Performance Summary</h3>
                                            <p className="chart-subtitle-modern text-muted">A detailed breakdown of your business profitability for the selected period.</p>
                                        </div>
                                    </div>
                                    <div className="chart-actions">
                                        <Badge bg="primary" className="px-3 py-2 rounded-pill">
                                            {getDateRangeLabel(dateRange).toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="table-responsive">
                                    {loading ? (
                                        <div className="d-flex justify-content-center align-items-center py-5">
                                            <Spinner animation="border" variant="primary" />
                                        </div>
                                    ) : financialSummary ? (
                                        <Table hover borderless className="financial-summary-table align-middle">
                                            <thead>
                                                <tr>
                                                    <th className="ps-4" style={{width: '60%'}}>FINANCIAL METRIC</th>
                                                    <th className="text-end pe-4">VALUE</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="border-bottom-0">
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="dot-indicator bg-primary"></div>
                                                            <div>
                                                                <div className="fw-bold text-dark-emphasis">Total Revenue</div>
                                                                <small className="text-muted d-block mt-n1 small">Gross sales value from all completed transactions</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        <span className="fw-bold fs-5 text-primary">{formatCurrency(financialSummary.total_revenue)}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="dot-indicator bg-danger"></div>
                                                            <div>
                                                                <div className="fw-bold text-dark-emphasis">Cost of Goods Sold (COGS)</div>
                                                                <small className="text-muted d-block mt-n1 small">Total acquisition cost of inventory sold</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        <span className="fw-semibold text-danger">({formatCurrency(financialSummary.total_cogs)})</span>
                                                    </td>
                                                </tr>
                                                <tr className="bg-light-subtle rounded-3">
                                                    <td className="ps-4 py-3">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="dot-indicator bg-success"></div>
                                                            <div>
                                                                <div className="fw-black text-dark fs-6 text-uppercase letter-spacing-1">Gross Profit</div>
                                                                <small className="text-muted d-block mt-n1 small">Revenue minus production/inventory costs</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-end pe-4 py-3">
                                                        <span className="fw-black fs-5 text-success">{formatCurrency(financialSummary.total_revenue - financialSummary.total_cogs)}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="dot-indicator bg-warning"></div>
                                                            <div>
                                                                <div className="fw-bold text-dark-emphasis">Operating Expenses</div>
                                                                <small className="text-muted d-block mt-n1 small">Rent, utilities, marketing, and other overheads</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        <span className="fw-semibold text-danger">({formatCurrency(financialSummary.total_expenses)})</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="dot-indicator bg-info"></div>
                                                            <div>
                                                                <div className="fw-bold text-dark-emphasis">Payroll Costs</div>
                                                                <small className="text-muted d-block mt-n1 small">Employee salaries and gross pay compensation</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        <span className="fw-semibold text-danger">({formatCurrency(financialSummary.total_payroll || 0)})</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="dot-indicator" style={{backgroundColor: '#8b5cf6'}}></div>
                                                            <div>
                                                                <div className="fw-bold text-dark-emphasis">Tax Deductions</div>
                                                                <small className="text-muted d-block mt-n1 small">Tax collected from completed orders</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        <span className="fw-semibold text-danger">({formatCurrency(financialSummary.total_tax || 0)})</span>
                                                    </td>
                                                </tr>
                                                <tr className="highlight-row border-top border-bottom border-success-subtle">
                                                    <td className="ps-4 py-4">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="metric-icon-sm bg-success text-white">Σ</div>
                                                            <div>
                                                                <div className="fw-black text-dark fs-5">FINAL PROFIT</div>
                                                                <small className="text-muted d-block mt-n1 small">Your actual earnings after ALL cost deductions</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-end pe-4 py-4">
                                                        <div className="d-flex flex-column align-items-end">
                                                            <span className="fw-black fs-4 text-success">{formatCurrency(financialSummary.net_profit)}</span>
                                                            <Badge bg="success" className="rounded-pill opacity-75 small">
                                                                {financialSummary.total_revenue > 0 
                                                                    ? ((financialSummary.net_profit / financialSummary.total_revenue) * 100).toFixed(1) 
                                                                    : '0.0'}% MARGIN
                                                            </Badge>
                                                        </div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="ps-4 border-top-0 pt-4">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="dot-indicator bg-info"></div>
                                                            <div>
                                                                <div className="fw-bold text-dark-emphasis">Operating Cash Flow</div>
                                                                <small className="text-muted d-block mt-n1 small">Actual liquid cash movement (inflow - outflow)</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-end pe-4 pt-4">
                                                        <span className={`fw-bold fs-5 ${financialSummary.operating_cash_flow >= 0 ? 'text-info' : 'text-danger'}`}>
                                                            {formatCurrency(financialSummary.operating_cash_flow)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    ) : (
                                        <div className="text-center py-5 text-muted bg-light rounded-4">
                                            <FiBarChart2 size={48} className="opacity-25 mb-3" />
                                            <p className="fw-medium mb-0">Financial summary metrics are currently unavailable for this range.</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-4 p-3 bg-light-subtle rounded-3 border">
                                    <div className="row align-items-center">
                                        <div className="col-auto">
                                            <FiAlertCircle className="text-primary" size={20} />
                                        </div>
                                        <div className="col">
                                            <small className="text-muted fw-medium">
                                                <strong>Note:</strong> Final Profit Margin reflects your overall profitability efficiency. A margin above 15% is generally considered healthy for this industry.
                                            </small>
                                        </div>
                                    </div>
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

