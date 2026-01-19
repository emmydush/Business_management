import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, ProgressBar } from 'react-bootstrap';
import { FiPercent, FiFileText, FiAlertCircle, FiCheckCircle, FiDownload, FiDollarSign } from 'react-icons/fi';
import { reportsAPI, taxesAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';

const Taxes = () => {
    const [report, setReport] = useState(null);
    const [taxOverview, setTaxOverview] = useState(null);
    const [taxFilingHistory, setTaxFilingHistory] = useState([]);
    const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
    const [complianceScore, setComplianceScore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { formatCurrency } = useCurrency();

    useEffect(() => {
        fetchTaxData();
    }, []);

    const fetchTaxData = async () => {
        try {
            setLoading(true);
            
            // Fetch financial report data
            const reportResponse = await reportsAPI.getFinancialReport();
            setReport(reportResponse.data.financial_report || null);
            
            // Fetch tax overview
            const taxOverviewResponse = await taxesAPI.getTaxOverview();
            setTaxOverview(taxOverviewResponse.data.tax_overview || null);
            
            // Fetch tax filing history
            const filingHistoryResponse = await taxesAPI.getTaxFilingHistory();
            setTaxFilingHistory(filingHistoryResponse.data.filing_history || []);
            
            // Fetch upcoming deadlines
            const deadlinesResponse = await taxesAPI.getUpcomingDeadlines();
            setUpcomingDeadlines(deadlinesResponse.data.upcoming_deadlines || []);
            
            // Fetch compliance score
            const complianceResponse = await taxesAPI.getComplianceScore();
            setComplianceScore(complianceResponse.data.compliance_score || null);
            
            setError(null);
        } catch (err) {
            setError('Failed to fetch tax data.');
            console.error('Error fetching tax data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Use the tax overview data for calculations
    const salesTaxPayable = taxOverview ? taxOverview.sales_tax_payable : 0;
    const incomeTaxPayable = taxOverview ? taxOverview.income_tax_payable : 0;
    const totalTaxPayable = taxOverview ? taxOverview.total_tax_payable : 0;

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
                            <h3 className="fw-bold mb-0">{formatCurrency(salesTaxPayable)}</h3>
                            <small className="text-muted">{taxOverview?.sales_tax_rate}% on {formatCurrency(report?.total_revenue)} revenue</small>
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
                            <h3 className="fw-bold mb-0">{formatCurrency(incomeTaxPayable)}</h3>
                            <small className="text-muted">{taxOverview?.income_tax_rate}% on {formatCurrency(report?.net_profit)} profit</small>
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
                            <h3 className="fw-bold mb-0">{formatCurrency(totalTaxPayable)}</h3>
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
                                        {taxFilingHistory.map((filing, index) => (
                                            <tr key={index}>
                                                <td className="ps-4 fw-medium">{filing.period}</td>
                                                <td>{filing.type}</td>
                                                <td className="fw-bold">{formatCurrency(filing.amount)}</td>
                                                <td>{filing.dateFiled}</td>
                                                <td className="text-end pe-4">
                                                    <Badge bg="success" className="fw-normal"><FiCheckCircle className="me-1" /> {filing.status}</Badge>
                                                </td>
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
                            <h5 className="fw-bold mb-0">Tax Compliance Score</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="text-center mb-4">
                                <div className="display-4 fw-bold text-success">{complianceScore?.score}%</div>
                                <div className="text-muted small">{complianceScore?.status}</div>
                            </div>
                            <ProgressBar now={complianceScore?.score || 98} variant="success" className="mb-4" style={{ height: '10px' }} />
                            <div className="bg-light p-3 rounded">
                                <h6 className="fw-bold small mb-2">Upcoming Deadlines</h6>
                                <ul className="list-unstyled mb-0 small">
                                    {upcomingDeadlines.map((deadline, index) => (
                                        <li key={index} className="d-flex justify-content-between mb-2">
                                            <span>{deadline.name}</span>
                                            <span className={`${deadline.urgency === 'high' ? 'text-danger' : deadline.urgency === 'medium' ? 'text-warning' : 'text-muted'} fw-bold`}>
                                                {deadline.date}
                                            </span>
                                        </li>
                                    ))}
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
