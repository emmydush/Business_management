import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, ProgressBar } from 'react-bootstrap';
import { FiBox, FiDownload, FiAlertTriangle, FiTrendingUp, FiBarChart2, FiActivity } from 'react-icons/fi';
import { reportsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';

const InventoryReports = () => {
    const [report, setReport] = useState(null);
    const { formatCurrency } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInventoryReport();
    }, []);

    const fetchInventoryReport = async () => {
        try {
            setLoading(true);
            const response = await reportsAPI.getInventoryReport();
            setReport(response.data.inventory_report || null);
            setError(null);
        } catch (err) {
            setError('Failed to fetch inventory report.');
        } finally {
            setLoading(false);
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

    return (
        <div className="inventory-reports-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Inventory Reports</h2>
                    <p className="text-muted mb-0">Monitor stock levels, turnover, and valuation.</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-secondary" className="d-flex align-items-center" onClick={() => toast.success('Exporting Inventory Data...')}>
                        <FiDownload className="me-2" /> Export Data
                    </Button>
                    <Button variant="primary" className="d-flex align-items-center" onClick={fetchInventoryReport}>
                        <FiActivity className="me-2" /> Refresh Report
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="g-4 mb-4">
                <Col lg={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Total Products</div>
                            <h3 className="fw-bold mb-0">{report?.total_products || 0}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Low Stock Alerts</div>
                            <h3 className="fw-bold mb-0 text-warning">{report?.low_stock_products || 0}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Out of Stock</div>
                            <h3 className="fw-bold mb-0 text-danger">{report?.out_of_stock_products || 0}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Inventory Value</div>
                            <h3 className="fw-bold mb-0 text-primary">{formatCurrency(45280)}</h3>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4">
                <Col lg={8}>
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Low Stock Items Analysis</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-4">Product</th>
                                            <th>Category</th>
                                            <th>Stock</th>
                                            <th>Reorder Level</th>
                                            <th className="text-end pe-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report?.low_stock_items?.map(item => (
                                            <tr key={item.id}>
                                                <td className="ps-4">
                                                    <div className="fw-bold text-dark">{item.name}</div>
                                                    <div className="small text-muted">{item.sku}</div>
                                                </td>
                                                <td><Badge bg="light" text="dark" className="border fw-normal">{item.category?.name || 'N/A'}</Badge></td>
                                                <td className="fw-bold text-danger">{item.stock_quantity}</td>
                                                <td className="text-muted">{item.reorder_level}</td>
                                                <td className="text-end pe-4">
                                                    <Badge bg="warning" text="dark" className="fw-normal">
                                                        <FiAlertTriangle className="me-1" /> Reorder
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Stock Turnover Rate</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="text-center mb-4">
                                <div className="display-4 fw-bold text-primary">4.2x</div>
                                <div className="text-muted small">Annual Turnover</div>
                            </div>
                            <div className="mb-4">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="small fw-bold">Electronics</span>
                                    <span className="small text-muted">5.8x</span>
                                </div>
                                <ProgressBar now={85} variant="primary" style={{ height: '8px' }} />
                            </div>
                            <div className="mb-4">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="small fw-bold">Furniture</span>
                                    <span className="small text-muted">2.1x</span>
                                </div>
                                <ProgressBar now={40} variant="info" style={{ height: '8px' }} />
                            </div>
                            <div className="bg-light p-3 rounded">
                                <h6 className="fw-bold small mb-2"><FiTrendingUp className="me-2 text-success" /> Insights</h6>
                                <p className="small text-muted mb-0">Electronics turnover is 20% higher than last quarter. Consider increasing stock levels for top sellers.</p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default InventoryReports;
