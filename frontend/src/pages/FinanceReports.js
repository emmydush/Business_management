import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Container, Nav, Tab } from 'react-bootstrap';
import { 
    FiDownload, FiPieChart, FiTrendingUp, FiTrendingDown, FiDollarSign, 
    FiUsers, FiShoppingBag, FiAlertTriangle, FiActivity, FiFileText,
    FiPercent, FiBarChart2, FiClock
} from 'react-icons/fi';
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
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

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

const FinanceReports = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState(DATE_RANGES.THIS_MONTH);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    
    // Report data states
    const [comprehensiveData, setComprehensiveData] = useState(null);
    const [arAgingData, setArAgingData] = useState(null);
    const [apAgingData, setApAgingData] = useState(null);
    const [profitabilityData, setProfitabilityData] = useState(null);
    const [ratiosData, setRatiosData] = useState(null);
    const [trialBalanceData, setTrialBalanceData] = useState(null);

    const { formatCurrency } = useCurrency();

    useEffect(() => {
        fetchAllReports();
    }, [dateRange, customStartDate, customEndDate]);

    const fetchAllReports = async () => {
        try {
            setLoading(true);
            
            const dateRangeObj = calculateDateRange(dateRange, customStartDate, customEndDate);
            const apiParams = {
                start_date: formatDateForAPI(dateRangeObj.startDate),
                end_date: formatDateForAPI(dateRangeObj.endDate)
            };
            
            // Fetch all financial reports
            const [comprehensive, arAging, apAging, profitability, ratios, trialBalance] = await Promise.all([
                reportsAPI.getComprehensiveFinancialReport(apiParams),
                reportsAPI.getARAgingReport(),
                reportsAPI.getAPAgingReport(),
                reportsAPI.getProfitabilityReport(apiParams),
                reportsAPI.getFinancialRatiosReport(apiParams),
                reportsAPI.getTrialBalanceReport(apiParams)
            ]);
            
            // Check if any response has an error
            if (comprehensive.data?.error) {
                throw new Error(comprehensive.data.error);
            }
            if (arAging.data?.error) {
                throw new Error(arAging.data.error);
            }
            if (apAging.data?.error) {
                throw new Error(apAging.data.error);
            }
            if (profitability.data?.error) {
                throw new Error(profitability.data.error);
            }
            if (ratios.data?.error) {
                throw new Error(ratios.data.error);
            }
            if (trialBalance.data?.error) {
                throw new Error(trialBalance.data.error);
            }
            
            setComprehensiveData(comprehensive.data.comprehensive_report);
            setArAgingData(arAging.data.ar_aging_report);
            setApAgingData(apAging.data.ap_aging_report);
            setProfitabilityData(profitability.data.profitability_analysis);
            setRatiosData(ratios.data.financial_ratios);
            setTrialBalanceData(trialBalance.data.trial_balance);
            setError(null);
        } catch (err) {
            console.error('Error fetching financial reports:', err);
            // Show more detailed error message
            const errorMessage = err.response?.data?.error || err.message || 'Failed to load financial reports.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            toast.success('Generating financial reports export...');
        } catch (err) {
            toast.error('Failed to export reports.');
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

    const incomeStatement = comprehensiveData?.income_statement || {};
    const balanceSheet = comprehensiveData?.balance_sheet || {};
    const cashFlow = comprehensiveData?.cash_flow_statement || {};
    const ratios = ratiosData || {};

    // Chart data configurations
    const revenueData = {
        labels: ['Gross Sales', 'Net Sales', 'Gross Profit', 'Net Income'],
        datasets: [{
            data: [
                incomeStatement.revenue?.gross_sales || 0,
                incomeStatement.revenue?.net_sales || 0,
                incomeStatement.cost_of_goods_sold?.gross_profit || 0,
                incomeStatement.net_income?.after_tax || 0
            ],
            backgroundColor: ['#4f46e5', '#818cf8', '#34d399', '#10b981'],
        }]
    };

    const expenseData = {
        labels: Object.keys(incomeStatement.operating_expenses?.breakdown || {}),
        datasets: [{
            label: 'Operating Expenses',
            data: Object.values(incomeStatement.operating_expenses?.breakdown || {}).map(e => e.amount),
            backgroundColor: '#f59e0b',
        }]
    };

    const liquidityData = {
        labels: ['Current Ratio', 'Quick Ratio', 'Cash Ratio'],
        datasets: [{
            label: 'Liquidity Ratios',
            data: [
                ratios.liquidity_ratios?.current_ratio || 0,
                ratios.liquidity_ratios?.quick_ratio || 0,
                ratios.liquidity_ratios?.cash_ratio || 0
            ],
            backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6'],
        }]
    };

    return (
        <div className="finance-reports-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Financial Reports</h2>
                    <p className="text-muted mb-0">Comprehensive financial analysis and statements.</p>
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
                        <FiDownload className="me-2" /> Export
                    </Button>
                </div>
            </div>

            <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <Nav variant="tabs" className="mb-4">
                    <Nav.Item>
                        <Nav.Link eventKey="overview">Overview</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="income">Income Statement</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="balance">Balance Sheet</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="cashflow">Cash Flow</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="aging">Aging Reports</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="ratios">Financial Ratios</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="profitability">Profitability</Nav.Link>
                    </Nav.Item>
                </Nav>

                <Tab.Content>
                    {/* Overview Tab */}
                    <Tab.Pane eventKey="overview">
                        <Row className="g-3 g-md-4 mb-4">
                            <Col xs={6} md={3}>
                                <Card className="border-0 shadow-sm h-100">
                                    <Card.Body className="p-3 p-md-4">
                                        <div className="d-flex align-items-center mb-2">
                                            <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                                                <FiTrendingUp className="text-success" size={24} />
                                            </div>
                                            <h6 className="mb-0 fw-bold">Net Revenue</h6>
                                        </div>
                                        <div className="h4 fw-bold text-dark">
                                            {formatCurrency(incomeStatement.revenue?.net_sales || 0)}
                                        </div>
                                        <div className="small text-muted">Total Net Sales</div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col xs={6} md={3}>
                                <Card className="border-0 shadow-sm h-100">
                                    <Card.Body className="p-3 p-md-4">
                                        <div className="d-flex align-items-center mb-2">
                                            <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                                                <FiDollarSign className="text-primary" size={24} />
                                            </div>
                                            <h6 className="mb-0 fw-bold">Gross Profit</h6>
                                        </div>
                                        <div className="h4 fw-bold text-dark">
                                            {formatCurrency(incomeStatement.cost_of_goods_sold?.gross_profit || 0)}
                                        </div>
                                        <div className="small text-muted">
                                            Margin: {incomeStatement.cost_of_goods_sold?.gross_margin_percent || 0}%
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col xs={6} md={3}>
                                <Card className="border-0 shadow-sm h-100">
                                    <Card.Body className="p-3 p-md-4">
                                        <div className="d-flex align-items-center mb-2">
                                            <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                                                <FiActivity className="text-warning" size={24} />
                                            </div>
                                            <h6 className="mb-0 fw-bold">Net Income</h6>
                                        </div>
                                        <div className="h4 fw-bold text-dark">
                                            {formatCurrency(incomeStatement.net_income?.after_tax || 0)}
                                        </div>
                                        <div className="small text-muted">
                                            Margin: {incomeStatement.net_income?.margin_percent || 0}%
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col xs={6} md={3}>
                                <Card className="border-0 shadow-sm h-100">
                                    <Card.Body className="p-3 p-md-4">
                                        <div className="d-flex align-items-center mb-2">
                                            <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                                                <FiBarChart2 className="text-info" size={24} />
                                            </div>
                                            <h6 className="mb-0 fw-bold">Total Assets</h6>
                                        </div>
                                        <div className="h4 fw-bold text-dark">
                                            {formatCurrency(balanceSheet.assets?.total_assets || 0)}
                                        </div>
                                        <div className="small text-muted">
                                            Total Liabilities: {formatCurrency(balanceSheet.liabilities?.total_liabilities || 0)}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        <Row className="g-4">
                            <Col md={6}>
                                <Card className="border-0 shadow-sm">
                                    <Card.Body>
                                        <h5 className="fw-bold mb-4">Revenue Breakdown</h5>
                                        <div style={{ height: '300px' }}>
                                            <Pie data={revenueData} options={{ maintainAspectRatio: false }} />
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card className="border-0 shadow-sm">
                                    <Card.Body>
                                        <h5 className="fw-bold mb-4">Liquidity Ratios</h5>
                                        <div style={{ height: '300px' }}>
                                            <Bar data={liquidityData} options={{ maintainAspectRatio: false }} />
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Tab.Pane>

                    {/* Income Statement Tab */}
                    <Tab.Pane eventKey="income">
                        <Card className="border-0 shadow-sm">
                            <Card.Body>
                                <h5 className="fw-bold mb-4">Income Statement (Profit & Loss)</h5>
                                <Table responsive>
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th className="text-end">Amount</th>
                                            <th className="text-end">% of Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="table-primary">
                                            <td colSpan={3} className="fw-bold">REVENUE</td>
                                        </tr>
                                        <tr>
                                            <td>Gross Sales</td>
                                            <td className="text-end">{formatCurrency(incomeStatement.revenue?.gross_sales || 0)}</td>
                                            <td className="text-end">100%</td>
                                        </tr>
                                        <tr>
                                            <td>Less: Sales Discounts</td>
                                            <td className="text-end">-{formatCurrency(incomeStatement.revenue?.less_sales_discounts || 0)}</td>
                                            <td className="text-end">-</td>
                                        </tr>
                                        <tr>
                                            <td>Less: Sales Returns</td>
                                            <td className="text-end">-{formatCurrency(incomeStatement.revenue?.less_sales_returns || 0)}</td>
                                            <td className="text-end">-</td>
                                        </tr>
                                        <tr className="table-success fw-bold">
                                            <td>Net Sales</td>
                                            <td className="text-end">{formatCurrency(incomeStatement.revenue?.net_sales || 0)}</td>
                                            <td className="text-end">100%</td>
                                        </tr>
                                        <tr className="table-warning">
                                            <td colSpan={3} className="fw-bold">COST OF GOODS SOLD</td>
                                        </tr>
                                        <tr>
                                            <td>Cost of Goods Sold</td>
                                            <td className="text-end">-{formatCurrency(incomeStatement.cost_of_goods_sold?.cogs || 0)}</td>
                                            <td className="text-end">
                                                {incomeStatement.revenue?.net_sales 
                                                    ? ((incomeStatement.cost_of_goods_sold?.cogs / incomeStatement.revenue?.net_sales) * 100).toFixed(1)
                                                    : 0}%
                                            </td>
                                        </tr>
                                        <tr className="table-success fw-bold">
                                            <td>Gross Profit</td>
                                            <td className="text-end">{formatCurrency(incomeStatement.cost_of_goods_sold?.gross_profit || 0)}</td>
                                            <td className="text-end">{incomeStatement.cost_of_goods_sold?.gross_margin_percent || 0}%</td>
                                        </tr>
                                        <tr className="table-info">
                                            <td colSpan={3} className="fw-bold">OPERATING EXPENSES</td>
                                        </tr>
                                        {Object.entries(incomeStatement.operating_expenses?.breakdown || {}).map(([category, data]) => (
                                            <tr key={category}>
                                                <td className="text-capitalize">{category.replace('_', ' ')}</td>
                                                <td className="text-end">{formatCurrency(data.amount)}</td>
                                                <td className="text-end">{data.percentage}%</td>
                                            </tr>
                                        ))}
                                        <tr className="fw-bold">
                                            <td>Total Operating Expenses</td>
                                            <td className="text-end">{formatCurrency(incomeStatement.operating_expenses?.total || 0)}</td>
                                            <td className="text-end">{incomeStatement.operating_expenses?.expense_to_sales_ratio || 0}%</td>
                                        </tr>
                                        <tr className="table-primary fw-bold">
                                            <td>Operating Income</td>
                                            <td className="text-end">{formatCurrency(incomeStatement.operating_income?.amount || 0)}</td>
                                            <td className="text-end">{incomeStatement.operating_income?.margin_percent || 0}%</td>
                                        </tr>
                                        <tr className="table-secondary fw-bold">
                                            <td>Income Tax Provision</td>
                                            <td className="text-end">-{formatCurrency(incomeStatement.income_tax?.tax_provision || 0)}</td>
                                            <td className="text-end">-</td>
                                        </tr>
                                        <tr className="table-success fw-bold" style={{ fontSize: '1.1em' }}>
                                            <td>NET INCOME (PROFIT)</td>
                                            <td className="text-end">{formatCurrency(incomeStatement.net_income?.after_tax || 0)}</td>
                                            <td className="text-end">{incomeStatement.net_income?.margin_percent || 0}%</td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Tab.Pane>

                    {/* Balance Sheet Tab */}
                    <Tab.Pane eventKey="balance">
                        <Row>
                            <Col md={6}>
                                <Card className="border-0 shadow-sm mb-4">
                                    <Card.Body>
                                        <h5 className="fw-bold mb-4 text-primary">ASSETS</h5>
                                        <h6 className="fw-bold mb-3">Current Assets</h6>
                                        <Table size="sm">
                                            <tbody>
                                                <tr>
                                                    <td>Cash & Equivalents</td>
                                                    <td className="text-end">{formatCurrency(balanceSheet.assets?.current_assets?.cash_and_equivalents || 0)}</td>
                                                </tr>
                                                <tr>
                                                    <td>Accounts Receivable</td>
                                                    <td className="text-end">{formatCurrency(balanceSheet.assets?.current_assets?.accounts_receivable || 0)}</td>
                                                </tr>
                                                <tr>
                                                    <td>Inventory</td>
                                                    <td className="text-end">{formatCurrency(balanceSheet.assets?.current_assets?.inventory || 0)}</td>
                                                </tr>
                                                <tr>
                                                    <td>Prepaid Expenses</td>
                                                    <td className="text-end">{formatCurrency(balanceSheet.assets?.current_assets?.prepaid_expenses || 0)}</td>
                                                </tr>
                                                <tr className="fw-bold">
                                                    <td>Total Current Assets</td>
                                                    <td className="text-end">{formatCurrency(balanceSheet.assets?.current_assets?.total || 0)}</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                        <h6 className="fw-bold mb-3">Fixed Assets</h6>
                                        <Table size="sm">
                                            <tbody>
                                                <tr>
                                                    <td>Equipment & Other</td>
                                                    <td className="text-end">{formatCurrency(balanceSheet.assets?.fixed_assets?.equipment || 0)}</td>
                                                </tr>
                                                <tr className="fw-bold">
                                                    <td>Total Fixed Assets</td>
                                                    <td className="text-end">{formatCurrency(balanceSheet.assets?.fixed_assets?.total || 0)}</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                        <div className="bg-primary bg-opacity-10 p-3 rounded">
                                            <div className="fw-bold">TOTAL ASSETS</div>
                                            <div className="h4 fw-bold text-primary">{formatCurrency(balanceSheet.assets?.total_assets || 0)}</div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card className="border-0 shadow-sm mb-4">
                                    <Card.Body>
                                        <h5 className="fw-bold mb-4 text-danger">LIABILITIES</h5>
                                        <h6 className="fw-bold mb-3">Current Liabilities</h6>
                                        <Table size="sm">
                                            <tbody>
                                                <tr>
                                                    <td>Accounts Payable</td>
                                                    <td className="text-end">{formatCurrency(balanceSheet.liabilities?.current_liabilities?.accounts_payable || 0)}</td>
                                                </tr>
                                                <tr>
                                                    <td>Accrued Expenses</td>
                                                    <td className="text-end">{formatCurrency(balanceSheet.liabilities?.current_liabilities?.accrued_expenses || 0)}</td>
                                                </tr>
                                                <tr>
                                                    <td>Payroll Liabilities</td>
                                                    <td className="text-end">{formatCurrency(balanceSheet.liabilities?.current_liabilities?.payroll_liabilities || 0)}</td>
                                                </tr>
                                                <tr className="fw-bold">
                                                    <td>Total Current Liabilities</td>
                                                    <td className="text-end">{formatCurrency(balanceSheet.liabilities?.current_liabilities?.total || 0)}</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                        <h6 className="fw-bold mb-3">Long-term Liabilities</h6>
                                        <Table size="sm">
                                            <tbody>
                                                <tr>
                                                    <td>Long-term Debt</td>
                                                    <td className="text-end">{formatCurrency(balanceSheet.liabilities?.long_term_liabilities?.amount || 0)}</td>
                                                </tr>
                                                <tr className="fw-bold">
                                                    <td>Total Long-term Liabilities</td>
                                                    <td className="text-end">{formatCurrency(balanceSheet.liabilities?.long_term_liabilities?.total || 0)}</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                        <div className="bg-danger bg-opacity-10 p-3 rounded mb-4">
                                            <div className="fw-bold">TOTAL LIABILITIES</div>
                                            <div className="h4 fw-bold text-danger">{formatCurrency(balanceSheet.liabilities?.total_liabilities || 0)}</div>
                                        </div>

                                        <h5 className="fw-bold mb-4 text-success">EQUITY</h5>
                                        <Table size="sm">
                                            <tbody>
                                                <tr>
                                                    <td>Retained Earnings</td>
                                                    <td className="text-end">{formatCurrency(balanceSheet.equity?.retained_earnings || 0)}</td>
                                                </tr>
                                                <tr>
                                                    <td>Owner's Equity</td>
                                                    <td className="text-end">{formatCurrency(balanceSheet.equity?.owners_equity || 0)}</td>
                                                </tr>
                                                <tr className="fw-bold">
                                                    <td>Total Equity</td>
                                                    <td className="text-end">{formatCurrency(balanceSheet.equity?.total_equity || 0)}</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                        <div className="bg-success bg-opacity-10 p-3 rounded">
                                            <div className="fw-bold">TOTAL LIABILITIES & EQUITY</div>
                                            <div className="h4 fw-bold text-success">{formatCurrency(balanceSheet.total_liabilities_and_equity || 0)}</div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                        {balanceSheet.balance_check && (
                            <Card className={`border-0 shadow-sm ${balanceSheet.balance_check.balanced ? 'border-success' : 'border-danger'}`}>
                                <Card.Body className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h6 className="fw-bold mb-1">Balance Sheet Check</h6>
                                        <div className="text-muted small">
                                            Total Assets: {formatCurrency(balanceSheet.balance_check.total_assets)} | 
                                            Total Liabilities & Equity: {formatCurrency(balanceSheet.balance_check.total_liabilities_and_equity)}
                                        </div>
                                    </div>
                                    <Badge bg={balanceSheet.balance_check.balanced ? 'success' : 'danger'} className="py-2 px-3">
                                        {balanceSheet.balance_check.balanced ? 'Balanced' : 'Not Balanced'}
                                    </Badge>
                                </Card.Body>
                            </Card>
                        )}
                    </Tab.Pane>

                    {/* Cash Flow Tab */}
                    <Tab.Pane eventKey="cashflow">
                        <Card className="border-0 shadow-sm">
                            <Card.Body>
                                <h5 className="fw-bold mb-4">Cash Flow Statement</h5>
                                <Table responsive>
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th className="text-end">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="table-primary">
                                            <td colSpan={2} className="fw-bold">OPERATING ACTIVITIES</td>
                                        </tr>
                                        <tr>
                                            <td>Cash Received from Customers</td>
                                            <td className="text-end text-success">+{formatCurrency(cashFlow.operating_activities?.cash_received_from_customers || 0)}</td>
                                        </tr>
                                        <tr>
                                            <td>Cash Paid to Suppliers</td>
                                            <td className="text-end text-danger">{formatCurrency(cashFlow.operating_activities?.cash_paid_to_suppliers || 0)}</td>
                                        </tr>
                                        <tr>
                                            <td>Cash Paid for Expenses</td>
                                            <td className="text-end text-danger">{formatCurrency(cashFlow.operating_activities?.cash_paid_for_expenses || 0)}</td>
                                        </tr>
                                        <tr>
                                            <td>Cash Paid for Payroll</td>
                                            <td className="text-end text-danger">{formatCurrency(cashFlow.operating_activities?.cash_paid_for_payroll || 0)}</td>
                                        </tr>
                                        <tr>
                                            <td>Taxes Paid</td>
                                            <td className="text-end text-danger">{formatCurrency(cashFlow.operating_activities?.taxes_paid || 0)}</td>
                                        </tr>
                                        <tr className="fw-bold">
                                            <td>Net Cash from Operating Activities</td>
                                            <td className="text-end">{formatCurrency(cashFlow.operating_activities?.net_cash_flow || 0)}</td>
                                        </tr>
                                        <tr className="table-info">
                                            <td colSpan={2} className="fw-bold">INVESTING ACTIVITIES</td>
                                        </tr>
                                        <tr>
                                            <td>Equipment Purchases</td>
                                            <td className="text-end text-danger">{formatCurrency(cashFlow.investing_activities?.equipment_purchases || 0)}</td>
                                        </tr>
                                        <tr className="fw-bold">
                                            <td>Net Cash from Investing Activities</td>
                                            <td className="text-end">{formatCurrency(cashFlow.investing_activities?.net_cash_flow || 0)}</td>
                                        </tr>
                                        <tr className="table-warning">
                                            <td colSpan={2} className="fw-bold">FINANCING ACTIVITIES</td>
                                        </tr>
                                        <tr>
                                            <td>Owner Investments</td>
                                            <td className="text-end text-success">+{formatCurrency(cashFlow.financing_activities?.owner_investments || 0)}</td>
                                        </tr>
                                        <tr>
                                            <td>Owner Withdrawals</td>
                                            <td className="text-end text-danger">{formatCurrency(cashFlow.financing_activities?.owner_withdrawals || 0)}</td>
                                        </tr>
                                        <tr className="fw-bold">
                                            <td>Net Cash from Financing Activities</td>
                                            <td className="text-end">{formatCurrency(cashFlow.financing_activities?.net_cash_flow || 0)}</td>
                                        </tr>
                                        <tr className="table-primary fw-bold" style={{ fontSize: '1.1em' }}>
                                            <td>NET CHANGE IN CASH</td>
                                            <td className="text-end">{formatCurrency(cashFlow.summary?.net_change_in_cash || 0)}</td>
                                        </tr>
                                        <tr>
                                            <td>Beginning Cash</td>
                                            <td className="text-end">{formatCurrency(cashFlow.summary?.beginning_cash || 0)}</td>
                                        </tr>
                                        <tr className="table-success fw-bold">
                                            <td>ENDING CASH</td>
                                            <td className="text-end">{formatCurrency(cashFlow.summary?.ending_cash || 0)}</td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Tab.Pane>

                    {/* Aging Reports Tab */}
                    <Tab.Pane eventKey="aging">
                        <Row>
                            <Col md={6}>
                                <Card className="border-0 shadow-sm mb-4">
                                    <Card.Body>
                                        <h5 className="fw-bold mb-4 text-warning">
                                            <FiClock className="me-2" />
                                            Accounts Receivable Aging
                                        </h5>
                                        <Table responsive>
                                            <thead>
                                                <tr>
                                                    <th>Age Bucket</th>
                                                    <th className="text-end">Amount</th>
                                                    <th className="text-end">%</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>Current (0-30 days)</td>
                                                    <td className="text-end">{formatCurrency(arAgingData?.aging_buckets?.current?.amount || 0)}</td>
                                                    <td className="text-end">{arAgingData?.aging_buckets?.current?.percentage || 0}%</td>
                                                </tr>
                                                <tr>
                                                    <td>31-60 days</td>
                                                    <td className="text-end">{formatCurrency(arAgingData?.aging_buckets?.days_31_60?.amount || 0)}</td>
                                                    <td className="text-end">{arAgingData?.aging_buckets?.days_31_60?.percentage || 0}%</td>
                                                </tr>
                                                <tr>
                                                    <td>61-90 days</td>
                                                    <td className="text-end">{formatCurrency(arAgingData?.aging_buckets?.days_61_90?.amount || 0)}</td>
                                                    <td className="text-end">{arAgingData?.aging_buckets?.days_61_90?.percentage || 0}%</td>
                                                </tr>
                                                <tr className="table-danger">
                                                    <td>Over 90 days</td>
                                                    <td className="text-end">{formatCurrency(arAgingData?.aging_buckets?.over_90?.amount || 0)}</td>
                                                    <td className="text-end">{arAgingData?.aging_buckets?.over_90?.percentage || 0}%</td>
                                                </tr>
                                                <tr className="fw-bold">
                                                    <td>TOTAL OUTSTANDING</td>
                                                    <td className="text-end">{formatCurrency(arAgingData?.total_outstanding || 0)}</td>
                                                    <td className="text-end">100%</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                        <div className="text-muted small">
                                            Total Invoices: {arAgingData?.total_invoices || 0}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card className="border-0 shadow-sm mb-4">
                                    <Card.Body>
                                        <h5 className="fw-bold mb-4 text-info">
                                            <FiClock className="me-2" />
                                            Accounts Payable Aging
                                        </h5>
                                        <Table responsive>
                                            <thead>
                                                <tr>
                                                    <th>Age Bucket</th>
                                                    <th className="text-end">Amount</th>
                                                    <th className="text-end">%</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>Current (0-30 days)</td>
                                                    <td className="text-end">{formatCurrency(apAgingData?.aging_buckets?.current?.amount || 0)}</td>
                                                    <td className="text-end">{apAgingData?.aging_buckets?.current?.percentage || 0}%</td>
                                                </tr>
                                                <tr>
                                                    <td>31-60 days</td>
                                                    <td className="text-end">{formatCurrency(apAgingData?.aging_buckets?.days_31_60?.amount || 0)}</td>
                                                    <td className="text-end">{apAgingData?.aging_buckets?.days_31_60?.percentage || 0}%</td>
                                                </tr>
                                                <tr>
                                                    <td>61-90 days</td>
                                                    <td className="text-end">{formatCurrency(apAgingData?.aging_buckets?.days_61_90?.amount || 0)}</td>
                                                    <td className="text-end">{apAgingData?.aging_buckets?.days_61_90?.percentage || 0}%</td>
                                                </tr>
                                                <tr className="table-danger">
                                                    <td>Over 90 days</td>
                                                    <td className="text-end">{formatCurrency(apAgingData?.aging_buckets?.over_90?.amount || 0)}</td>
                                                    <td className="text-end">{apAgingData?.aging_buckets?.over_90?.percentage || 0}%</td>
                                                </tr>
                                                <tr className="fw-bold">
                                                    <td>TOTAL OUTSTANDING</td>
                                                    <td className="text-end">{formatCurrency(apAgingData?.total_outstanding || 0)}</td>
                                                    <td className="text-end">100%</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                        <div className="text-muted small">
                                            Total Bills: {apAgingData?.total_bills || 0}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Tab.Pane>

                    {/* Financial Ratios Tab */}
                    <Tab.Pane eventKey="ratios">
                        <Row>
                            <Col md={6}>
                                <Card className="border-0 shadow-sm mb-4">
                                    <Card.Body>
                                        <h5 className="fw-bold mb-4 text-success">Liquidity Ratios</h5>
                                        <Table size="sm">
                                            <tbody>
                                                <tr>
                                                    <td>Current Ratio</td>
                                                    <td className="text-end fw-bold">{ratios.liquidity_ratios?.current_ratio || 0}</td>
                                                    <td className="text-muted small">{ratios.liquidity_ratios?.interpretation || ''}</td>
                                                </tr>
                                                <tr>
                                                    <td>Quick Ratio</td>
                                                    <td className="text-end fw-bold">{ratios.liquidity_ratios?.quick_ratio || 0}</td>
                                                    <td className="text-muted small">&gt;1.0 is healthy</td>
                                                </tr>
                                                <tr>
                                                    <td>Cash Ratio</td>
                                                    <td className="text-end fw-bold">{ratios.liquidity_ratios?.cash_ratio || 0}</td>
                                                    <td className="text-muted small">&gt;0.5 is healthy</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card className="border-0 shadow-sm mb-4">
                                    <Card.Body>
                                        <h5 className="fw-bold mb-4 text-primary">Profitability Ratios</h5>
                                        <Table size="sm">
                                            <tbody>
                                                <tr>
                                                    <td>Gross Margin</td>
                                                    <td className="text-end fw-bold">{ratios.profitability_ratios?.gross_margin_percent || 0}%</td>
                                                </tr>
                                                <tr>
                                                    <td>Net Profit Margin</td>
                                                    <td className="text-end fw-bold">{ratios.profitability_ratios?.net_profit_margin_percent || 0}%</td>
                                                </tr>
                                                <tr>
                                                    <td>Operating Margin</td>
                                                    <td className="text-end fw-bold">{ratios.profitability_ratios?.operating_margin_percent || 0}%</td>
                                                </tr>
                                                <tr>
                                                    <td>Return on Assets (ROA)</td>
                                                    <td className="text-end fw-bold">{ratios.profitability_ratios?.return_on_assets_percent || 0}%</td>
                                                </tr>
                                                <tr>
                                                    <td>Return on Equity (ROE)</td>
                                                    <td className="text-end fw-bold">{ratios.profitability_ratios?.return_on_equity_percent || 0}%</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card className="border-0 shadow-sm mb-4">
                                    <Card.Body>
                                        <h5 className="fw-bold mb-4 text-danger">Leverage Ratios</h5>
                                        <Table size="sm">
                                            <tbody>
                                                <tr>
                                                    <td>Debt to Assets</td>
                                                    <td className="text-end fw-bold">{ratios.leverage_ratios?.debt_to_assets_percent || 0}%</td>
                                                    <td className="text-muted small">{'<50% is healthy'}</td>
                                                </tr>
                                                <tr>
                                                    <td>Debt to Equity</td>
                                                    <td className="text-end fw-bold">{ratios.leverage_ratios?.debt_to_equity_percent || 0}%</td>
                                                    <td className="text-muted small">{'<1.0 is healthy'}</td>
                                                </tr>
                                                <tr>
                                                    <td>Equity Ratio</td>
                                                    <td className="text-end fw-bold">{ratios.leverage_ratios?.equity_ratio_percent || 0}%</td>
                                                    <td className="text-muted small">&gt;50% is healthy</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card className="border-0 shadow-sm mb-4">
                                    <Card.Body>
                                        <h5 className="fw-bold mb-4 text-info">Efficiency Ratios</h5>
                                        <Table size="sm">
                                            <tbody>
                                                <tr>
                                                    <td>Asset Turnover</td>
                                                    <td className="text-end fw-bold">{ratios.efficiency_ratios?.asset_turnover || 0}</td>
                                                </tr>
                                                <tr>
                                                    <td>Inventory Turnover</td>
                                                    <td className="text-end fw-bold">{ratios.efficiency_ratios?.inventory_turnover || 0}</td>
                                                </tr>
                                                <tr>
                                                    <td>Receivables Turnover</td>
                                                    <td className="text-end fw-bold">{ratios.efficiency_ratios?.receivables_turnover || 0}</td>
                                                </tr>
                                                <tr>
                                                    <td>Payables Turnover</td>
                                                    <td className="text-end fw-bold">{ratios.efficiency_ratios?.payables_turnover || 0}</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Tab.Pane>

                    {/* Profitability Tab */}
                    <Tab.Pane eventKey="profitability">
                        <Row>
                            <Col md={12}>
                                <Card className="border-0 shadow-sm mb-4">
                                    <Card.Body>
                                        <h5 className="fw-bold mb-4">Profitability by Category</h5>
                                        <Table responsive>
                                            <thead>
                                                <tr>
                                                    <th>Category</th>
                                                    <th className="text-end">Revenue</th>
                                                    <th className="text-end">Cost</th>
                                                    <th className="text-end">Profit</th>
                                                    <th className="text-end">Margin</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(profitabilityData?.by_category || []).map((cat, idx) => (
                                                    <tr key={idx}>
                                                        <td>{cat.category_name}</td>
                                                        <td className="text-end">{formatCurrency(cat.revenue)}</td>
                                                        <td className="text-end">{formatCurrency(cat.cost)}</td>
                                                        <td className="text-end">{formatCurrency(cat.profit)}</td>
                                                        <td className="text-end">
                                                            <Badge bg={cat.margin_percent > 20 ? 'success' : cat.margin_percent > 10 ? 'warning' : 'danger'}>
                                                                {cat.margin_percent}%
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={12}>
                                <Card className="border-0 shadow-sm mb-4">
                                    <Card.Body>
                                        <h5 className="fw-bold mb-4">Top Customers by Revenue</h5>
                                        <Table responsive>
                                            <thead>
                                                <tr>
                                                    <th>Customer</th>
                                                    <th className="text-end">Orders</th>
                                                    <th className="text-end">Revenue</th>
                                                    <th className="text-end">Est. Profit</th>
                                                    <th className="text-end">Margin</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(profitabilityData?.by_customer || []).slice(0, 10).map((cust, idx) => (
                                                    <tr key={idx}>
                                                        <td>{cust.customer_name}</td>
                                                        <td className="text-end">{cust.order_count}</td>
                                                        <td className="text-end">{formatCurrency(cust.revenue)}</td>
                                                        <td className="text-end">{formatCurrency(cust.estimated_profit)}</td>
                                                        <td className="text-end">{cust.margin_percent}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>
        </div>
    );
};

export default FinanceReports;
