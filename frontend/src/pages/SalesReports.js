import React from 'react';
import { Row, Col, Card, Table, Button, Badge } from 'react-bootstrap';
import { FiDownload, FiPieChart, FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';

const SalesReports = () => {
    const handleExport = () => {
        toast.success('Generating sales report PDF...');
    };

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
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                                    <FiTrendingUp className="text-primary" size={24} />
                                </div>
                                <h6 className="mb-0 fw-bold">Revenue Growth</h6>
                            </div>
                            <h3 className="fw-bold mb-1">+24.5%</h3>
                            <p className="text-muted small mb-0 font-monospace">Compared to last month</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                                    <FiDollarSign className="text-success" size={24} />
                                </div>
                                <h6 className="mb-0 fw-bold">Avg. Order Value</h6>
                            </div>
                            <h3 className="fw-bold mb-1">$452.10</h3>
                            <p className="text-muted small mb-0 font-monospace">Stable trend</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                                    <FiUsers className="text-info" size={24} />
                                </div>
                                <h6 className="mb-0 fw-bold">New Customers</h6>
                            </div>
                            <h3 className="fw-bold mb-1">128</h3>
                            <p className="text-muted small mb-0 font-monospace">+12% increase</p>
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
                                    <tr>
                                        <td className="ps-4 fw-bold">Wireless Mouse</td>
                                        <td>Electronics</td>
                                        <td>145</td>
                                        <td className="fw-bold">$3,625.00</td>
                                        <td className="text-end pe-4 text-success"><FiTrendingUp /> 12%</td>
                                    </tr>
                                    <tr>
                                        <td className="ps-4 fw-bold">Mechanical Keyboard</td>
                                        <td>Electronics</td>
                                        <td>89</td>
                                        <td className="fw-bold">$8,010.00</td>
                                        <td className="text-end pe-4 text-success"><FiTrendingUp /> 8%</td>
                                    </tr>
                                    <tr>
                                        <td className="ps-4 fw-bold">USB-C Hub</td>
                                        <td>Accessories</td>
                                        <td>76</td>
                                        <td className="fw-bold">$3,458.00</td>
                                        <td className="text-end pe-4 text-danger"><FiTrendingDown /> 3%</td>
                                    </tr>
                                    <tr>
                                        <td className="ps-4 fw-bold">Monitor Stand</td>
                                        <td>Furniture</td>
                                        <td>54</td>
                                        <td className="fw-bold">$1,890.00</td>
                                        <td className="text-end pe-4 text-success"><FiTrendingUp /> 15%</td>
                                    </tr>
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
                            <div className="mb-4">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="small fw-bold">Electronics</span>
                                    <span className="small text-muted">45%</span>
                                </div>
                                <div className="progress" style={{ height: '8px' }}>
                                    <div className="progress-bar bg-primary" role="progressbar" style={{ width: '45%' }}></div>
                                </div>
                            </div>
                            <div className="mb-4">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="small fw-bold">Furniture</span>
                                    <span className="small text-muted">30%</span>
                                </div>
                                <div className="progress" style={{ height: '8px' }}>
                                    <div className="progress-bar bg-success" role="progressbar" style={{ width: '30%' }}></div>
                                </div>
                            </div>
                            <div className="mb-4">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="small fw-bold">Accessories</span>
                                    <span className="small text-muted">15%</span>
                                </div>
                                <div className="progress" style={{ height: '8px' }}>
                                    <div className="progress-bar bg-info" role="progressbar" style={{ width: '15%' }}></div>
                                </div>
                            </div>
                            <div className="mb-0">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="small fw-bold">Other</span>
                                    <span className="small text-muted">10%</span>
                                </div>
                                <div className="progress" style={{ height: '8px' }}>
                                    <div className="progress-bar bg-secondary" role="progressbar" style={{ width: '10%' }}></div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default SalesReports;
