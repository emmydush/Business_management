import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Container } from 'react-bootstrap';
import { FiDownload, FiPieChart, FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers, FiShoppingBag, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { reportsAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import DateRangeSelector from '../components/DateRangeSelector';
import { DATE_RANGES, calculateDateRange, formatDateForAPI } from '../utils/dateRanges';
import {
    Chart as ChartJS,
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
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    colorPalettes,
    lineChartOptions,
    barChartOptions,
    doughnutChartOptions,
    createGradient
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

const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
};

const SalesReports = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState(DATE_RANGES.TODAY);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const { formatCurrency } = useCurrency();

    useEffect(() => {
        fetchReportData();
    }, [dateRange, customStartDate, customEndDate]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            
            // Calculate date range
            const dateRangeObj = calculateDateRange(dateRange, customStartDate, customEndDate);
            const apiParams = {
                start_date: formatDateForAPI(dateRangeObj.startDate),
                end_date: formatDateForAPI(dateRangeObj.endDate)
            };
            
            const response = await reportsAPI.getSalesReport(apiParams);
            // Backend returns { sales_report: {...} }
            setReportData(response.data.sales_report || {});
            setError(null);
        } catch (err) {
            console.error('Error fetching sales report:', err);
            setError('Failed to load sales report.');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            toast.success('Generating sales report PDF...');
            // In a real app, this might call a different endpoint for PDF generation
            const response = await reportsAPI.getSalesReport();
            console.log('Export response:', response.data);
        } catch (err) {
            toast.error('Failed to export sales report. Please try again.');
            console.error('Error exporting sales report:', err);
        }
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

    if (error) {
        return (
            <div className="py-5">
                <div className="container"><div className="alert alert-danger">{error}</div></div>
            </div>
        );
    }

    return (
        <div className="sales-reports-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Sales Reports</h2>
                    <p className="text-muted mb-0">Analyze your sales performance and trends.</p>
                </div>
                <div className="d-flex gap-2">
                    <DateRangeSelector
                        value={dateRange}
                        onChange={(range, start, end) => {
                            setDateRange(range);
                            if (range === DATE_RANGES.CUSTOM_RANGE && start && end) {
                                setCustomStartDate(start);
                                setCustomEndDate(end);
                            }
                        }}
                    />
                    <Button variant="primary" onClick={handleExport}>
                        <FiDownload className="me-2" /> Export Report
                    </Button>
                </div>
            </div>

            <Row className="g-3 g-md-4 mb-4">
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100 card-responsive">
                        <Card.Body className="p-3 p-md-4">
                            <div className="d-flex align-items-center mb-2 mb-md-3">
                                <div className="bg-primary bg-opacity-10 p-2 rounded me-2 me-md-3">
                                    <FiTrendingUp className="text-primary" size={24} />
                                </div>
                                <h6 className="mb-0 fw-bold small small-md">Revenue Growth</h6>
                            </div>
                            <h3 className="fw-bold mb-1 h5 h4-md">{formatCurrency(reportData?.total_sales || 0)}</h3>
                            <p className="text-muted small mb-0 font-monospace d-none d-md-block">Total sales (period)</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100 card-responsive">
                        <Card.Body className="p-3 p-md-4">
                            <div className="d-flex align-items-center mb-2 mb-md-3">
                                <div className="bg-success bg-opacity-10 p-2 rounded me-2 me-md-3">
                                    <FiDollarSign className="text-success" size={24} />
                                </div>
                                <h6 className="mb-0 fw-bold small small-md">Avg. Order Value</h6>
                            </div>
                            <h3 className="fw-bold mb-1 h5 h4-md">{formatCurrency(reportData?.average_order_value || 0)}</h3>
                            <p className="text-muted small mb-0 font-monospace d-none d-md-block">Average order value</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100 card-responsive">
                        <Card.Body className="p-3 p-md-4">
                            <div className="d-flex align-items-center mb-2 mb-md-3">
                                <div className="bg-warning bg-opacity-10 p-2 rounded me-2 me-md-3">
                                    <FiShoppingBag className="text-warning" size={24} />
                                </div>
                                <h6 className="mb-0 fw-bold small small-md">Total Orders</h6>
                            </div>
                            <h3 className="fw-bold mb-1 h5 h4-md">{reportData?.total_orders || 0}</h3>
                            <p className="text-muted small mb-0 font-monospace d-none d-md-block">Total orders (period)</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100 card-responsive">
                        <Card.Body className="p-3 p-md-4">
                            <div className="d-flex align-items-center mb-2 mb-md-3">
                                <div className="bg-info bg-opacity-10 p-2 rounded me-2 me-md-3">
                                    <FiUsers className="text-info" size={24} />
                                </div>
                                <h6 className="mb-0 fw-bold small small-md">New Customers</h6>
                            </div>
                            <h3 className="fw-bold mb-1 h5 h4-md">{reportData?.new_customers || 0}</h3>
                            <p className="text-muted small mb-0 font-monospace d-none d-md-block">New customers (period)</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Charts Section */}
            <Row className="g-4 mb-4">
                <Col lg={8}>
                    <Card className="border-0 shadow-sm h-100 chart-fade-in">
                        <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-start">
                            <div>
                                <h5 className="fw-bold mb-1">Sales Trend Analysis</h5>
                                <p className="text-muted small mb-0">Revenue performance comparison</p>
                            </div>
                            <div className="text-end">
                                <h5 className="fw-bold mb-0 text-dark">
                                    {formatCurrency(reportData.total_sales)}
                                </h5>
                                {reportData.previous_sales_trend && (
                                    <span className={`small fw-bold ${reportData.total_sales >= reportData.previous_sales_trend.reduce((a, b) => a + b, 0) ? 'text-success' : 'text-danger'}`}>
                                        {reportData.total_sales >= reportData.previous_sales_trend.reduce((a, b) => a + b, 0) ? <FiTrendingUp /> : <FiAlertTriangle />}
                                        {(() => {
                                            const prevTotal = reportData.previous_sales_trend.reduce((a, b) => a + b, 0);
                                            const growth = prevTotal > 0 ? ((reportData.total_sales - prevTotal) / prevTotal) * 100 : 0;
                                            return Math.abs(growth).toFixed(1);
                                        })()}%
                                    </span>
                                )}
                            </div>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <div style={{ height: '300px' }}>
                                {reportData?.sales_trend ? (
                                    <Line
                                        id="sales-trend-chart"
                                        data={{
                                            labels: reportData.sales_trend.map(item => item.period),
                                            datasets: [{
                                                label: 'Current Period',
                                                data: reportData.sales_trend.map(item => item.revenue),
                                                fill: true,
                                                backgroundColor: (context) => {
                                                    const { ctx, chartArea } = context.chart;
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
                                                pointRadius: reportData.sales_trend.length > 15 ? 0 : 4,
                                                pointHoverRadius: 6,
                                                pointBackgroundColor: '#fff',
                                                pointBorderColor: '#4f46e5',
                                                pointBorderWidth: 2,
                                            },
                                            {
                                                label: 'Previous Period',
                                                data: reportData.previous_sales_trend || [],
                                                borderColor: 'rgba(148, 163, 184, 0.4)',
                                                borderWidth: 2,
                                                borderDash: [5, 5],
                                                fill: false,
                                                tension: 0.4,
                                                pointRadius: 0,
                                                pointHoverRadius: 0,
                                                zIndex: 1
                                            }]
                                        }}
                                        options={{
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
                                                            return `Revenue: ${formatCurrency(context.parsed.y)}`;
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
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="chart-empty">
                                        <FiTrendingUp className="chart-empty-icon" />
                                        <p className="chart-empty-text">No sales trend data available</p>
                                        <p className="chart-empty-subtext">Sales data will appear here once transactions are recorded</p>
                                    </div>
                                )}
                            </div>


                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4}>
                    <Card className="border-0 shadow-sm h-100 chart-scale-in">
                        <Card.Header className="bg-white border-0 py-3">
                            <div>
                                <h5 className="fw-bold mb-1">Sales Volume Trend</h5>
                                <p className="text-muted small mb-0">Number of orders over time</p>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <div style={{ height: '300px' }}>
                                {reportData?.sales_trend ? (
                                    <Bar
                                        id="sales-volume-trend-chart"
                                        data={{
                                            labels: reportData.sales_trend.map(item => item.period),
                                            datasets: [{
                                                label: 'Orders',
                                                data: reportData.sales_trend.map(item => item.orders),
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
                                                        autoSkip: true,
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="chart-empty">
                                        <FiTrendingUp className="chart-empty-icon" />
                                        <p className="chart-empty-text">No volume data</p>
                                    </div>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4 mb-4">
                <Col lg={4}>
                    <Card className="border-0 shadow-sm h-100 chart-scale-in">
                        <Card.Header className="bg-white border-0 py-3">
                            <div>
                                <h5 className="fw-bold mb-1">Category Distribution</h5>
                                <p className="text-muted small mb-0">Sales breakdown by category</p>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-4 d-flex flex-column align-items-center">
                            <div style={{ height: '220px', width: '220px' }} className="mb-3">
                                {Array.isArray(reportData?.sales_by_category) && reportData.sales_by_category.length > 0 ? (
                                    <Doughnut
                                        id="category-distribution-chart"
                                        data={{
                                            labels: reportData.sales_by_category.map(cat => cat.category),
                                            datasets: [{
                                                data: reportData.sales_by_category.map(cat => cat.percentage),
                                                backgroundColor: colorPalettes.vibrant,
                                                borderWidth: 0,
                                                hoverOffset: 8,
                                            }]
                                        }}
                                        options={{
                                            ...doughnutChartOptions,
                                            plugins: {
                                                ...doughnutChartOptions.plugins,
                                                legend: { display: false }
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="chart-empty" style={{ height: '220px' }}>
                                        <FiPieChart className="chart-empty-icon" style={{ fontSize: '2rem' }} />
                                        <p className="chart-empty-text" style={{ fontSize: '0.875rem' }}>No category data</p>
                                    </div>
                                )}
                            </div>
                            <div className="w-100">
                                {Array.isArray(reportData?.sales_by_category) && reportData.sales_by_category.length > 0 ? (
                                    reportData.sales_by_category.map((category, index) => (
                                        <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                                            <div className="d-flex align-items-center gap-2 small">
                                                <span className="dot" style={{ backgroundColor: colorPalettes.vibrant[index % colorPalettes.vibrant.length] }}></span>
                                                <span className="fw-medium">{category.category}</span>
                                            </div>
                                            <span className="fw-bold small text-primary">{category.percentage}%</span>
                                        </div>
                                    ))
                                ) : null}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={8}>
                    <Card className="border-0 shadow-sm h-100 chart-scale-in">
                        <Card.Header className="bg-white border-0 py-3">
                            <div>
                                <h5 className="fw-bold mb-1">Sales by Day of Week</h5>
                                <p className="text-muted small mb-0">Revenue distribution by day</p>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <div style={{ height: '220px' }}>
                                {Array.isArray(reportData?.sales_by_day) && reportData.sales_by_day.length > 0 ? (
                                    <Bar
                                        id="sales-by-day-chart"
                                        data={{
                                            labels: reportData.sales_by_day.map(d => d.day.substring(0, 3)),
                                            datasets: [{
                                                label: 'Revenue',
                                                data: reportData.sales_by_day.map(d => d.revenue),
                                                backgroundColor: colorPalettes.gradients.indigo[0],
                                                borderRadius: 4,
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
                                                        maxRotation: 0,
                                                        minRotation: 0,
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="chart-empty">
                                        <FiTrendingUp className="chart-empty-icon" />
                                        <p className="chart-empty-text">No day data</p>
                                    </div>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>


            <Row className="g-4">
                <Col lg={12}>
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Top Selling Products</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table hover responsive className="mb-0 align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="border-0 py-3 ps-4">Product</th>
                                        <th className="border-0 py-3">Category</th>
                                        <th className="border-0 py-3">Orders</th>
                                        <th className="border-0 py-3">Revenue</th>
                                        <th className="border-0 py-3">Profit</th>
                                        <th className="border-0 py-3 text-end pe-4">Trend</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(reportData?.top_products) && reportData.top_products.length > 0 ? (
                                        reportData.top_products.map((product, index) => (
                                            <tr key={index}>
                                                <td className="ps-4 fw-bold">{product.name}</td>
                                                <td>{product.category}</td>
                                                <td>{product.orders}</td>
                                                <td className="fw-bold text-primary">{formatCurrency(product.revenue || 0)}</td>
                                                <td className="fw-bold text-success">{formatCurrency(product.profit || 0)}</td>
                                                <td className={`text-end pe-4 ${product.trend >= 0 ? 'text-success' : 'text-danger'}`}>
                                                    {product.trend >= 0 ? <FiTrendingUp /> : <FiTrendingDown />} {Math.abs(product.trend)}%
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="text-center text-muted py-4">No top products data available for this period.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            <style dangerouslySetInnerHTML={{
                __html: `
                /* Mobile Responsive Styles for Sales Report Cards */
                @media (max-width: 767.98px) {
                    .card-responsive {
                        min-height: 120px;
                        margin-bottom: 10px;
                    }
                    
                    .card-responsive .card-body {
                        padding: 12px !important;
                    }
                    
                    .small-md {
                        font-size: 0.75rem !important;
                    }
                    
                    .h4-md {
                        font-size: 1.25rem !important;
                    }
                    
                    .h5 {
                        font-size: 1rem !important;
                    }
                    
                    /* Adjust icon sizes for mobile */
                    .card-responsive svg {
                        width: 16px !important;
                        height: 16px !important;
                    }
                    
                    /* Reduce spacing between cards on mobile */
                    .row.g-3 {
                        --bs-gutter-x: 1rem;
                        --bs-gutter-y: 1rem;
                    }
                    
                    /* Ensure cards stack properly on very small screens */
                    @media (max-width: 575.98px) {
                        .card-responsive {
                            min-height: 100px;
                        }
                        
                        .card-responsive .card-body {
                            padding: 10px !important;
                        }
                        
                        .small-md {
                            font-size: 0.7rem !important;
                        }
                        
                        .h5 {
                            font-size: 0.9rem !important;
                        }
                    }
                }
                
                /* Desktop styles */
                @media (min-width: 768px) {
                    .small-md {
                        font-size: 0.875rem !important;
                    }
                    
                    .h4-md {
                        font-size: 1.5rem !important;
                    }
                }
                
                /* Smooth transitions */
                .card-responsive {
                    transition: all 0.2s ease-in-out;
                }
                
                .card-responsive:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1) !important;
                }
                `}} />
        </div>
    );
};

export default SalesReports;
