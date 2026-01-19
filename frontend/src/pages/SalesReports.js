import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge } from 'react-bootstrap';
import { FiDownload, FiPieChart, FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers, FiShoppingBag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { reportsAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
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
    doughnutChartOptions
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

const SalesReports = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { formatCurrency } = useCurrency();

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const response = await reportsAPI.getSalesReport();
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
                <Button variant="primary" onClick={handleExport}>
                    <FiDownload className="me-2" /> Export Report
                </Button>
            </div>

            <Row className="g-4 mb-4">
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                                    <FiTrendingUp className="text-primary" size={24} />
                                </div>
                                <h6 className="mb-0 fw-bold">Revenue Growth</h6>
                            </div>
                            <h3 className="fw-bold mb-1">{formatCurrency(reportData?.total_sales || 0)}</h3>
                            <p className="text-muted small mb-0 font-monospace">Total sales (period)</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                                    <FiDollarSign className="text-success" size={24} />
                                </div>
                                <h6 className="mb-0 fw-bold">Avg. Order Value</h6>
                            </div>
                            <h3 className="fw-bold mb-1">{formatCurrency(reportData?.average_order_value || 0)}</h3>
                            <p className="text-muted small mb-0 font-monospace">Average order value</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                                    <FiShoppingBag className="text-warning" size={24} />
                                </div>
                                <h6 className="mb-0 fw-bold">Total Orders</h6>
                            </div>
                            <h3 className="fw-bold mb-1">{reportData?.total_orders || 0}</h3>
                            <p className="text-muted small mb-0 font-monospace">Total orders (period)</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                                    <FiUsers className="text-info" size={24} />
                                </div>
                                <h6 className="mb-0 fw-bold">New Customers</h6>
                            </div>
                            <h3 className="fw-bold mb-1">{reportData?.new_customers || 0}</h3>
                            <p className="text-muted small mb-0 font-monospace">New customers (period)</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Charts Section */}
            <Row className="g-4 mb-4">
                <Col lg={8}>
                    <Card className="border-0 shadow-sm h-100 chart-fade-in">
                        <Card.Header className="bg-white border-0 py-3">
                            <div>
                                <h5 className="fw-bold mb-1">Sales Trend Analysis</h5>
                                <p className="text-muted small mb-0">Track sales performance over time</p>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <div style={{ height: '300px' }}>
                                {reportData?.sales_trend ? (
                                    <Line
                                        data={{
                                            labels: reportData.sales_trend.map(item => item.period),
                                            datasets: [{
                                                label: 'Sales Revenue',
                                                data: reportData.sales_trend.map(item => item.revenue),
                                                fill: true,
                                                backgroundColor: (context) => {
                                                    const chart = context.chart;
                                                    const { ctx, chartArea } = chart;
                                                    if (!chartArea) return colorPalettes.backgrounds.blue;
                                                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                                                    gradient.addColorStop(0, 'rgba(59, 130, 246, 0)');
                                                    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.2)');
                                                    return gradient;
                                                },
                                                borderColor: colorPalettes.semantic.info,
                                                borderWidth: 3,
                                                tension: 0.4,
                                                pointRadius: 5,
                                                pointHoverRadius: 7,
                                                pointBackgroundColor: '#fff',
                                                pointBorderColor: colorPalettes.semantic.info,
                                                pointBorderWidth: 3,
                                            }]
                                        }}
                                        options={{
                                            ...lineChartOptions,
                                            plugins: {
                                                ...lineChartOptions.plugins,
                                                legend: { display: false },
                                                tooltip: {
                                                    ...lineChartOptions.plugins.tooltip,
                                                    callbacks: {
                                                        label: function (context) {
                                                            return `Revenue: ${formatCurrency(context.parsed.y)}`;
                                                        }
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
                                <h5 className="fw-bold mb-1">Category Distribution</h5>
                                <p className="text-muted small mb-0">Sales breakdown by category</p>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-4 d-flex flex-column align-items-center">
                            <div style={{ height: '220px', width: '220px' }} className="mb-3">
                                {Array.isArray(reportData?.sales_by_category) && reportData.sales_by_category.length > 0 ? (
                                    <Doughnut
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
        </div>
    );
};

export default SalesReports;
