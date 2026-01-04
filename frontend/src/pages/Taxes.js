import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, ProgressBar } from 'react-bootstrap';
import { FiPercent, FiFileText, FiAlertCircle, FiCheckCircle, FiDownload, FiDollarSign } from 'react-icons/fi';
import { reportsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Taxes = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTaxData();
    }, []);

    const fetchTaxData = async () => {
        try {
            setLoading(true);
            const response = await reportsAPI.getFinancialReport();
            setReport(response.data.financial_report || null);
            setError(null);
        } catch (err) {
            setError('Failed to fetch tax data.');
        } finally {
            setLoading(false);
        }
    };

    // Mock tax calculations
    const salesTaxRate = 0.15; // 15% VAT
    const incomeTaxRate = 0.30; // 30% Corporate Tax

    const salesTaxPayable = (report?.total_revenue || 0) * salesTaxRate;
    const incomeTaxPayable = (report?.net_profit || 0) * incomeTaxRate;
    const totalTaxPayable = salesTaxPayable + incomeTaxPayable;

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
        <div className="taxes-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Tax Management</h2>
                    <p className="text-muted mb-0">Monitor tax obligations, VAT, and corporate filings.</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-danger" className="d-flex align-items-center" onClick={() => toast.success('Tax filing initiated...')}>
                        <FiFileText className="me-2" /> File Taxes
                    </Button>
                    <Button variant="primary" className="d-flex align-items-center" onClick={fetchTaxData}>
                        <FiDownload className="me-2" /> Export Tax Report
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="g-4 mb-4">
                <Col lg={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                                    <FiPercent className="text-warning" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Sales Tax (VAT)</span>
                            </div>
                            <h3 className="fw-bold mb-0">${salesTaxPayable.toLocaleString()}</h3>
                            <small className="text-muted">15% on ${report?.total_revenue?.toLocaleString()} revenue</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-danger bg-opacity-10 p-2 rounded me-3">
                                    <FiDollarSign className="text-danger" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Corporate Income Tax</span>
                            </div>
                            <h3 className="fw-bold mb-0">${incomeTaxPayable.toLocaleString()}</h3>
                            <small className="text-muted">30% on ${report?.net_profit?.toLocaleString()} profit</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4}>
                    <Card className="border-0 shadow-sm bg-dark text-white">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-white bg-opacity-20 p-2 rounded me-3">
                                    <FiAlertCircle className="text-white" size={20} />
                                </div>
                                <span className="text-white text-opacity-75 fw-medium">Total Tax Liability</span>
                            </div>
                            <h3 className="fw-bold mb-0">${totalTaxPayable.toLocaleString()}</h3>
                            <small className="text-white text-opacity-50">Estimated for current period</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4">
                <Col lg={7}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Tax Filing History</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-4">Period</th>
                                            <th>Type</th>
                                            <th>Amount</th>
                                            <th>Date Filed</th>
                                            <th className="text-end pe-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="ps-4 fw-medium">Q3 2025</td>
                                            <td>VAT</td>
                                            <td className="fw-bold">$4,250.00</td>
                                            <td>Oct 15, 2025</td>
                                            <td className="text-end pe-4">
                                                <Badge bg="success" className="fw-normal"><FiCheckCircle className="me-1" /> Filed</Badge>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="ps-4 fw-medium">Q2 2025</td>
                                            <td>VAT</td>
                                            <td className="fw-bold">$3,800.00</td>
                                            <td>Jul 12, 2025</td>
                                            <td className="text-end pe-4">
                                                <Badge bg="success" className="fw-normal"><FiCheckCircle className="me-1" /> Filed</Badge>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="ps-4 fw-medium">Annual 2024</td>
                                            <td>Corporate</td>
                                            <td className="fw-bold">$12,400.00</td>
                                            <td>Mar 30, 2025</td>
                                            <td className="text-end pe-4">
                                                <Badge bg="success" className="fw-normal"><FiCheckCircle className="me-1" /> Filed</Badge>
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={5}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Tax Compliance Score</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="text-center mb-4">
                                <div className="display-4 fw-bold text-success">98%</div>
                                <div className="text-muted small">Highly Compliant</div>
                            </div>
                            <ProgressBar now={98} variant="success" className="mb-4" style={{ height: '10px' }} />
                            <div className="bg-light p-3 rounded">
                                <h6 className="fw-bold small mb-2">Upcoming Deadlines</h6>
                                <ul className="list-unstyled mb-0 small">
                                    <li className="d-flex justify-content-between mb-2">
                                        <span>Q4 VAT Filing</span>
                                        <span className="text-danger fw-bold">Jan 15, 2026</span>
                                    </li>
                                    <li className="d-flex justify-content-between">
                                        <span>Annual Income Tax</span>
                                        <span className="text-warning fw-bold">Mar 31, 2026</span>
                                    </li>
                                </ul>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Taxes;
