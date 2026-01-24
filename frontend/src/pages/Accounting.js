import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, ProgressBar } from 'react-bootstrap';
import { FiPieChart, FiTrendingUp, FiTrendingDown, FiDollarSign, FiFileText, FiActivity, FiPrinter } from 'react-icons/fi';
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

    const handlePrint = () => {
        window.print();
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
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .card { border: none !important; box-shadow: none !important; }
                    .accounting-wrapper { padding: 0 !important; }
                }
                .income-statement-table td {
                    padding: 12px 15px;
                }
                .row-group-header {
                    background-color: #f8f9fa;
                    font-weight: 700;
                    text-transform: uppercase;
                    font-size: 0.8rem;
                    letter-spacing: 0.5px;
                }
                .row-total {
                    font-weight: 700;
                    border-top: 2px solid #dee2e6;
                }
                .row-net-profit {
                    background-color: #e8f5e9;
                    font-weight: 800;
                    font-size: 1.1rem;
                    border-top: 2px solid #2e7d32;
                }
            `}</style>

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 no-print">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Accounting & Financials</h2>
                    <p className="text-muted mb-0">Official Income Statement (Profit & Loss) and financial health.</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-secondary" className="d-flex align-items-center" onClick={handlePrint}>
                        <FiPrinter className="me-2" /> Print Report
                    </Button>
                    <Button variant="primary" className="d-flex align-items-center" onClick={fetchAccountingData}>
                        <FiActivity className="me-2" /> Refresh Data
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger" className="no-print">{error}</Alert>}

            {/* Financial Overview Cards */}
            <Row className="g-4 mb-4 no-print">
                <Col lg={4}>
                    <Card className="border-0 shadow-sm bg-primary text-white">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <div className="text-white text-opacity-75 small fw-medium mb-1">Total Revenue</div>
                                    <h2 className="fw-bold mb-0">{formatCurrency(report?.total_revenue || 0)}</h2>
                                </div>
                                <div className="bg-white bg-opacity-20 p-2 rounded">
                                    <FiTrendingUp size={24} />
                                </div>
                            </div>
                            <div className="small text-white text-opacity-75">
                                Gross income before deductions
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
                                    <h2 className="fw-bold mb-0">{formatCurrency((report?.total_expenses || 0) + (report?.total_cogs || 0))}</h2>
                                </div>
                                <div className="bg-white bg-opacity-20 p-2 rounded">
                                    <FiTrendingDown size={24} />
                                </div>
                            </div>
                            <div className="small text-white text-opacity-75">
                                Includes COGS and Operating Expenses
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
                                    <h2 className="fw-bold mb-0">{formatCurrency(report?.net_profit || 0)}</h2>
                                </div>
                                <div className="bg-white bg-opacity-20 p-2 rounded">
                                    <FiDollarSign size={24} />
                                </div>
                            </div>
                            <div className="small text-white text-opacity-75">
                                Net Margin: {report?.net_profit_margin}%
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4">
                {/* Income Statement Table */}
                <Col lg={8}>
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold mb-0">Income Statement (P&L)</h5>
                            <Badge bg="light" text="dark" className="border fw-normal">
                                {report?.period?.from.split('T')[0]} to {report?.period?.to.split('T')[0]}
                            </Badge>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="mb-0 income-statement-table">
                                    <tbody>
                                        {/* Revenue Section */}
                                        <tr className="row-group-header">
                                            <td colSpan="2">Revenue</td>
                                        </tr>
                                        <tr>
                                            <td className="ps-4">Gross Sales / Revenue</td>
                                            <td className="text-end fw-medium">{formatCurrency(report?.total_revenue || 0)}</td>
                                        </tr>
                                        <tr className="row-total">
                                            <td className="ps-4">Total Revenue</td>
                                            <td className="text-end">{formatCurrency(report?.total_revenue || 0)}</td>
                                        </tr>

                                        {/* COGS Section */}
                                        <tr className="row-group-header">
                                            <td colSpan="2">Cost of Goods Sold (COGS)</td>
                                        </tr>
                                        <tr>
                                            <td className="ps-4">Cost of Inventory Sold</td>
                                            <td className="text-end text-danger">({formatCurrency(report?.total_cogs || 0)})</td>
                                        </tr>
                                        <tr className="row-total">
                                            <td className="ps-4">Gross Profit</td>
                                            <td className="text-end fw-bold text-success">{formatCurrency(report?.gross_profit || 0)}</td>
                                        </tr>

                                        {/* Operating Expenses Section */}
                                        <tr className="row-group-header">
                                            <td colSpan="2">Operating Expenses</td>
                                        </tr>
                                        {report?.top_expense_categories?.map((exp, idx) => (
                                            <tr key={idx}>
                                                <td className="ps-4">{exp.category}</td>
                                                <td className="text-end text-danger">({formatCurrency(exp.amount)})</td>
                                            </tr>
                                        ))}
                                        {(!report?.top_expense_categories || report.top_expense_categories.length === 0) && (
                                            <tr>
                                                <td className="ps-4 text-muted italic">No operating expenses recorded</td>
                                                <td className="text-end">$0.00</td>
                                            </tr>
                                        )}
                                        <tr className="row-total">
                                            <td className="ps-4">Total Operating Expenses</td>
                                            <td className="text-end text-danger">({formatCurrency(report?.total_expenses || 0)})</td>
                                        </tr>

                                        {/* Net Profit Section */}
                                        <tr className="row-net-profit">
                                            <td>NET PROFIT / (LOSS)</td>
                                            <td className="text-end">{formatCurrency(report?.net_profit || 0)}</td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Cash Flow Summary */}
                    <Card className="border-0 shadow-sm no-print">
                        <Card.Header className="bg-white border-bottom py-3">
                            <h5 className="fw-bold mb-0">Cash Flow Summary</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row className="text-center">
                                <Col md={4} className="border-end">
                                    <div className="text-muted small mb-1">Cash Inflow</div>
                                    <h4 className="fw-bold text-success">{formatCurrency(report?.cash_flow?.inflow || 0)}</h4>
                                </Col>
                                <Col md={4} className="border-end">
                                    <div className="text-muted small mb-1">Cash Outflow</div>
                                    <h4 className="fw-bold text-danger">{formatCurrency(report?.cash_flow?.outflow || 0)}</h4>
                                </Col>
                                <Col md={4}>
                                    <div className="text-muted small mb-1">Net Cash Flow</div>
                                    <h4 className="fw-bold text-primary">{formatCurrency(report?.cash_flow?.operating || 0)}</h4>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Sidebar Stats */}
                <Col lg={4} className="no-print">
                    <Card className="border-0 shadow-sm mb-4">
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
                                    <span className="text-muted small fw-medium">Net Profit Margin</span>
                                    <span className="fw-bold">{report?.net_profit_margin}%</span>
                                </div>
                                <ProgressBar now={report?.net_profit_margin} variant="primary" style={{ height: '8px' }} />
                            </div>
                            <div className="mb-4">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted small fw-medium">Expense Ratio</span>
                                    <span className="fw-bold">{((report?.total_expenses / report?.total_revenue) * 100).toFixed(1)}%</span>
                                </div>
                                <ProgressBar now={(report?.total_expenses / report?.total_revenue) * 100} variant="danger" style={{ height: '8px' }} />
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="border-0 shadow-sm bg-light">
                        <Card.Body>
                            <div className="d-flex align-items-center text-primary mb-3">
                                <FiPieChart size={20} className="me-2" />
                                <h6 className="fw-bold mb-0">Accounting Note</h6>
                            </div>
                            <p className="small text-muted mb-0">
                                This statement is generated automatically based on your sales, inventory costs (COGS), and approved expenses.
                                Ensure all expenses are approved and payroll is processed to maintain accuracy.
                            </p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Accounting;
