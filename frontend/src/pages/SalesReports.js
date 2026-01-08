import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge } from 'react-bootstrap';
import { FiDownload, FiPieChart, FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers, FiShoppingBag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { reportsAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';

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

            <Row className="g-4">
                <Col lg={8}>
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
                                                <td className="fw-bold">{formatCurrency(product.revenue || 0)}</td>
                                                <td className={`text-end pe-4 ${product.trend >= 0 ? 'text-success' : 'text-danger'}`}>
                                                    {product.trend >= 0 ? <FiTrendingUp /> : <FiTrendingDown />} {Math.abs(product.trend)}%
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="text-center text-muted py-4">No top products data available for this period.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Sales by Category</h5>
                        </Card.Header>
                        <Card.Body>
                            {Array.isArray(reportData?.sales_by_category) && reportData.sales_by_category.length > 0 ? (
                                reportData.sales_by_category.map((category, index) => (
                                    <div key={index} className="mb-4">
                                        <div className="d-flex justify-content-between mb-1">
                                            <span className="small fw-bold">{category.category}</span>
                                            <span className="small text-muted">{category.percentage}%</span>
                                        </div>
                                        <div className="progress" style={{ height: '8px' }}>
                                            <div
                                                className={`progress-bar bg-${index === 0 ? 'primary' : index === 1 ? 'success' : index === 2 ? 'info' : 'secondary'}`}
                                                role="progressbar"
                                                style={{ width: `${category.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-muted py-4">No category data available for this period.</div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default SalesReports;
