import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, ProgressBar } from 'react-bootstrap';
import { FiFileText, FiDownload, FiTrendingUp, FiTrendingDown, FiDollarSign, FiPieChart } from 'react-icons/fi';
import { reportsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';

const FinanceReports = () => {
    const [report, setReport] = useState(null);
    const { formatCurrency } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchFinanceReport();
    }, []);

    const fetchFinanceReport = async () => {
        try {
            setLoading(true);
            const response = await reportsAPI.getFinancialReport();
            setReport(response.data.financial_report || null);
            setError(null);
        } catch (err) {
            setError('Failed to fetch financial report.');
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
        <div className="finance-reports-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Financial Reports</h2>
                    <p className="text-muted mb-0">Detailed analysis of revenue, expenses, and profitability.</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-secondary" className="d-flex align-items-center" onClick={() => toast.success('Exporting CSV...')}>
                        <FiDownload className="me-2" /> Export CSV
                    </Button>
                    <Button variant="primary" className="d-flex align-items-center" onClick={() => toast.success('Generating PDF...')}>
                        <FiFileText className="me-2" /> Print PDF
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="g-4 mb-4">
                <Col lg={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Revenue</div>
                            <h3 className="fw-bold mb-1 text-primary">{formatCurrency(report?.net_sales)}</h3>
                            <div className="text-muted small">Gross: {formatCurrency(report?.total_revenue)}</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">COGS</div>
                            <h3 className="fw-bold mb-1 text-warning">{formatCurrency(report?.total_cogs)}</h3>
                            <div className="text-muted small">Cost of Goods Sold</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Gross Profit</div>
                            <h3 className="fw-bold mb-1 text-success">{formatCurrency(report?.gross_profit)}</h3>
                            <div className="text-success small fw-bold">Margin: {report?.gross_profit_margin}%</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Net Profit</div>
                            <h3 className="fw-bold mb-1 text-info">{formatCurrency(report?.net_profit)}</h3>
                            <div className="text-info small fw-bold">Margin: {report?.net_profit_margin}%</div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4">
                <Col lg={7}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Expense Categories Analysis</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-4">Category</th>
                                            <th>Amount</th>
                                            <th>% of Total</th>
                                            <th className="text-end pe-4">Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report?.top_expense_categories?.map((cat, idx) => (
                                            <tr key={idx}>
                                                <td className="ps-4 fw-medium">{cat.category}</td>
                                                <td className="fw-bold">{formatCurrency(cat.amount)}</td>
                                                <td style={{ width: '150px' }}>
                                                    <ProgressBar
                                                        now={(cat.amount / report.total_expenses) * 100}
                                                        variant={idx === 0 ? 'danger' : 'primary'}
                                                        style={{ height: '6px' }}
                                                    />
                                                </td>
                                                <td className="text-end pe-4 text-muted small">Stable</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={5}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Monthly Cash Flow</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <div className="text-muted small fw-medium">Cash Inflow</div>
                                    <h4 className="fw-bold text-success mb-0">{formatCurrency(report?.cash_flow?.inflow || 0)}</h4>
                                </div>
                                <div className="text-end">
                                    <div className="text-muted small fw-medium">Cash Outflow</div>
                                    <h4 className="fw-bold text-danger mb-0">{formatCurrency(report?.cash_flow?.outflow || 0)}</h4>
                                </div>
                            </div>
                            <div className="bg-light p-3 rounded mb-4">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="small fw-bold">Operating Cash Flow</span>
                                    <span className={`small fw-bold ${report?.cash_flow?.operating >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {report?.cash_flow?.operating >= 0 ? '+' : ''}{formatCurrency(report?.cash_flow?.operating || 0)}
                                    </span>
                                </div>
                                <ProgressBar now={report?.cash_flow?.percentage || 0} variant={report?.cash_flow?.operating >= 0 ? 'success' : 'danger'} style={{ height: '8px' }} />
                            </div>
                            <div className="text-center">
                                <Button variant="link" className="text-primary text-decoration-none small fw-bold">
                                    <FiPieChart className="me-2" /> View Full Cash Flow Statement
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default FinanceReports;
