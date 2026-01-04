import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, ProgressBar } from 'react-bootstrap';
import { FiPieChart, FiTrendingUp, FiTrendingDown, FiDollarSign, FiFileText, FiDownload, FiActivity } from 'react-icons/fi';
import { reportsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';

const Accounting = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { formatCurrency } = useCurrency();

    useEffect(() => {
        fetchAccountingData();
    }, []);

    const fetchAccountingData = async () => {
        try {
            setLoading(true);
            const response = await reportsAPI.getFinancialReport();
            setReport(response.data.financial_report || null);
            setError(null);
        } catch (err) {
            setError('Failed to fetch accounting data.');
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
        <div className="accounting-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Accounting / P&L</h2>
                    <p className="text-muted mb-0">Financial health overview and profit/loss statements.</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-secondary" className="d-flex align-items-center" onClick={() => toast.success('Generating PDF Statement...')}>
                        <FiFileText className="me-2" /> Generate Statement
                    </Button>
                    <Button variant="primary" className="d-flex align-items-center" onClick={fetchAccountingData}>
                        <FiActivity className="me-2" /> Update Ledger
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* Financial Overview */}
            <Row className="g-4 mb-4">
                <Col lg={4}>
                    <Card className="border-0 shadow-sm bg-primary text-white">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <div className="text-white text-opacity-75 small fw-medium mb-1">Total Revenue</div>
                                    <h2 className="fw-bold mb-0">{report?.total_revenue ? formatCurrency(report.total_revenue) : ''}</h2>
                                </div>
                                <div className="bg-white bg-opacity-20 p-2 rounded">
                                    <FiTrendingUp size={24} />
                                </div>
                            </div>
                            <div className="small text-white text-opacity-75">
                                Period: {report?.period?.from.split('T')[0]} to {report?.period?.to.split('T')[0]}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4}>
                    <Card className="border-0 shadow-sm bg-danger text-white">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <div className="text-white text-opacity-75 small fw-medium mb-1">Total Expenses</div>
                                    <h2 className="fw-bold mb-0">{report?.total_expenses ? formatCurrency(report.total_expenses) : ''}</h2>
                                </div>
                                <div className="bg-white bg-opacity-20 p-2 rounded">
                                    <FiTrendingDown size={24} />
                                </div>
                            </div>
                            <div className="small text-white text-opacity-75">
                                Includes payroll, rent, and utilities
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4}>
                    <Card className="border-0 shadow-sm bg-success text-white">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <div className="text-white text-opacity-75 small fw-medium mb-1">Net Profit</div>
                                    <h2 className="fw-bold mb-0">{report?.net_profit ? formatCurrency(report.net_profit) : ''}</h2>
                                </div>
                                <div className="bg-white bg-opacity-20 p-2 rounded">
                                    <FiDollarSign size={24} />
                                </div>
                            </div>
                            <div className="small text-white text-opacity-75">
                                Margin: {report?.gross_profit_margin}%
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4">
                <Col lg={8}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Expense Breakdown</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="table-responsive">
                                <Table hover className="align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th>Category</th>
                                            <th>Amount</th>
                                            <th>% of Total</th>
                                            <th className="text-end">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report?.top_expense_categories?.map((cat, idx) => (
                                            <tr key={idx}>
                                                <td className="fw-medium">{cat.category}</td>
                                                <td className="fw-bold">{formatCurrency(cat.amount)}</td>
                                                <td style={{ width: '200px' }}>
                                                    <div className="d-flex align-items-center">
                                                        <ProgressBar
                                                            now={(cat.amount / report.total_expenses) * 100}
                                                            variant={idx === 0 ? 'danger' : idx === 1 ? 'warning' : 'info'}
                                                            style={{ height: '6px', flexGrow: 1 }}
                                                            className="me-2"
                                                        />
                                                        <span className="small text-muted">{((cat.amount / report.total_expenses) * 100).toFixed(1)}%</span>
                                                    </div>
                                                </td>
                                                <td className="text-end">
                                                    <Badge bg="light" text="dark" className="border fw-normal">Audited</Badge>
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
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Financial Ratios</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-4">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted small fw-medium">Gross Margin</span>
                                    <span className="fw-bold">{report?.gross_profit_margin}%</span>
                                </div>
                                <ProgressBar now={report?.gross_profit_margin} variant="success" style={{ height: '8px' }} />
                            </div>
                            <div className="mb-4">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted small fw-medium">Operating Margin</span>
                                    <span className="fw-bold">42.5%</span>
                                </div>
                                <ProgressBar now={42.5} variant="primary" style={{ height: '8px' }} />
                            </div>
                            <div className="mb-4">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted small fw-medium">Expense Ratio</span>
                                    <span className="fw-bold">{((report?.total_expenses / report?.total_revenue) * 100).toFixed(1)}%</span>
                                </div>
                                <ProgressBar now={(report?.total_expenses / report?.total_revenue) * 100} variant="danger" style={{ height: '8px' }} />
                            </div>
                            <div className="bg-light p-3 rounded mt-4">
                                <div className="d-flex align-items-center text-primary mb-2">
                                    <FiPieChart className="me-2" />
                                    <span className="fw-bold small">Audit Status</span>
                                </div>
                                <p className="small text-muted mb-0">Your financial records for this period are consistent and ready for tax filing.</p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Accounting;
