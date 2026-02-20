import React, { useState, useEffect, useMemo } from 'react';
import { 
  Row, Col, Card, Table, Button, Badge, Alert, Dropdown, 
  Modal, Form, Tab, Tabs, Nav, FormControl, InputGroup,
  ProgressBar, ListGroup, Collapse
} from 'react-bootstrap';
import { 
  FiUsers, FiDollarSign, FiCalendar, FiMoreVertical, FiCheckCircle, 
  FiDownload, FiCreditCard, FiLoader, FiPlus, FiSearch, FiFilter,
  FiChevronDown, FiChevronUp, FiX, FiFileText, FiAward,
  FiClock, FiEdit2, FiTrash2, FiPrinter, FiMail, FiPieChart,
  FiTrendingUp, FiActivity, FiShield, FiRefreshCw, FiCheckSquare,
  FiSquare
} from 'react-icons/fi';
import { hrAPI } from '../services/api';
import momoIcon from '../assets/images/momo_icon.png';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import SubscriptionGuard from '../components/SubscriptionGuard';

const Payroll = () => {
  const { formatCurrency } = useCurrency();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [payrollData, setPayrollData] = useState(null);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [payrollSummary, setPayrollSummary] = useState(null);
  const [error, setError] = useState(null);
  
  // Filter states
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal states
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [selectedPayrolls, setSelectedPayrolls] = useState([]);
  
  // Form state
  const [processingPayroll, setProcessingPayroll] = useState(false);
  const [formData, setFormData] = useState({
    pay_period_start: '',
    pay_period_end: '',
    employee_salaries: []
  });

  useEffect(() => {
    fetchPayrollData();
    fetchPayrollSummary();
    fetchPayrollHistory();
  }, [selectedMonth, selectedYear, statusFilter]);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const response = await hrAPI.getPayroll();
      setPayrollData(response.data.payroll || null);
      setError(null);
    } catch (err) {
      console.error('Error fetching payroll data:', err);
      if (err.response?.status === 403) {
        setError({
          message: err.response.data?.message || 'Access denied',
          upgrade_message: err.response.data?.upgrade_message,
          showUpgrade: err.response.data?.upgrade_required
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollSummary = async () => {
    try {
      setSummaryLoading(true);
      const response = await hrAPI.getPayrollSummary({ 
        month: selectedMonth, 
        year: selectedYear 
      });
      setPayrollSummary(response.data.summary);
    } catch (err) {
      console.error('Error fetching payroll summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchPayrollHistory = async () => {
    try {
      const response = await hrAPI.getPayrollHistory({
        month: selectedMonth,
        year: selectedYear,
        status: statusFilter,
        per_page: 50
      });
      setPayrollHistory(response.data.payrolls || []);
    } catch (err) {
      console.error('Error fetching payroll history:', err);
      setPayrollHistory([]);
    }
  };

  const handleProcessPayroll = async () => {
    try {
      setProcessingPayroll(true);
      
      const response = await hrAPI.createPayroll(formData);
      toast.success(response.data.message || 'Payroll processed successfully!');
      
      setShowProcessModal(false);
      fetchPayrollData();
      fetchPayrollSummary();
      fetchPayrollHistory();
      
    } catch (err) {
      console.error('Error processing payroll:', err);
      toast.error(err.response?.data?.error || 'Failed to process payroll');
    } finally {
      setProcessingPayroll(false);
    }
  };

  const handleApprovePayroll = async (payrollId) => {
    try {
      const response = await hrAPI.approvePayroll(payrollId);
      toast.success(response.data.message);
      fetchPayrollSummary();
      fetchPayrollHistory();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve payroll');
    }
  };

  const handleMarkPaid = async (payrollId) => {
    try {
      const response = await hrAPI.markPayrollPaid(payrollId, {});
      toast.success(response.data.message);
      fetchPayrollSummary();
      fetchPayrollHistory();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark as paid');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPayrolls.length === 0) {
      toast.error('Please select payroll records to approve');
      return;
    }
    try {
      const response = await hrAPI.bulkApprovePayroll(selectedPayrolls);
      toast.success(response.data.message);
      setSelectedPayrolls([]);
      fetchPayrollSummary();
      fetchPayrollHistory();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve payrolls');
    }
  };

  const handleBulkPay = async () => {
    if (selectedPayrolls.length === 0) {
      toast.error('Please select payroll records to mark as paid');
      return;
    }
    try {
      const response = await hrAPI.bulkMarkPaid(selectedPayrolls, new Date().toISOString().split('T')[0]);
      toast.success(response.data.message);
      setSelectedPayrolls([]);
      fetchPayrollSummary();
      fetchPayrollHistory();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark as paid');
    }
  };

  const toggleSelectPayroll = (payrollId) => {
    setSelectedPayrolls(prev => 
      prev.includes(payrollId) 
        ? prev.filter(id => id !== payrollId)
        : [...prev, payrollId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPayrolls.length === payrollHistory.length) {
      setSelectedPayrolls([]);
    } else {
      setSelectedPayrolls(payrollHistory.map(p => p.id));
    }
  };

  const openPayrollDetail = (payroll) => {
    setSelectedPayroll(payroll);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { variant: 'secondary', icon: <FiClock className="me-1" /> },
      approved: { variant: 'info', icon: <FiCheckCircle className="me-1" /> },
      paid: { variant: 'success', icon: <FiDollarSign className="me-1" /> },
      cancelled: { variant: 'danger', icon: <FiX className="me-1" /> }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge bg={config.variant}>{config.icon} {status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return payrollHistory;
    const search = searchTerm.toLowerCase();
    return payrollHistory.filter(p => 
      p.employee?.first_name?.toLowerCase().includes(search) ||
      p.employee?.last_name?.toLowerCase().includes(search) ||
      p.employee?.employee_id?.toLowerCase().includes(search) ||
      p.employee?.department?.toLowerCase().includes(search)
    );
  }, [payrollHistory, searchTerm]);

  const handleExportPayroll = async () => {
    try {
      const response = await hrAPI.exportPayroll();
      toast.success('Payroll export initiated');
    } catch (err) {
      toast.error('Failed to export payroll');
    }
  };

  // Initialize form data
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setFormData({
      pay_period_start: firstDay.toISOString().split('T')[0],
      pay_period_end: lastDay.toISOString().split('T')[0],
      employee_salaries: payrollData?.employees?.map(emp => ({
        employee_id: emp.id,
        basic_salary: emp.salary || 0,
        allowances: 0,
        overtime_pay: 0,
        bonuses: 0,
        tax_deductions: 0,
        other_deductions: 0,
        notes: ''
      })) || []
    });
  }, [payrollData]);

  const updateEmployeeSalary = (index, field, value) => {
    const updated = [...formData.employee_salaries];
    updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
    
    // Auto-calculate gross and net
    const emp = updated[index];
    emp.gross_pay = (emp.basic_salary || 0) + (emp.allowances || 0) + (emp.overtime_pay || 0) + (emp.bonuses || 0);
    emp.net_pay = emp.gross_pay - (emp.tax_deductions || 0) - (emp.other_deductions || 0);
    
    setFormData({ ...formData, employee_salaries: updated });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="text-center">
          <FiLoader className="spinner-border text-primary" size={40} />
          <p className="mt-2 text-muted">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payroll-wrapper">
      {/* Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">
            <FiDollarSign className="me-2 text-primary" />
            Payroll Management
          </h2>
          <p className="text-muted mb-0">Manage employee salaries, bonuses, and disbursements</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Button variant="outline-secondary" onClick={handleExportPayroll}>
            <FiDownload className="me-2" /> Export
          </Button>
          <SubscriptionGuard message="Renew your subscription to process payroll">
            <Button variant="primary" onClick={() => setShowProcessModal(true)}>
              <FiPlus className="me-2" /> Process Payroll
            </Button>
          </SubscriptionGuard>
        </div>
      </div>

      {error && (
        <Alert variant={error.showUpgrade ? "warning" : "danger"} className="mb-4">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h6 className="alert-heading mb-1">{error.showUpgrade ? "Access Restricted" : "Error"}</h6>
              <p className="mb-0">{error.message}</p>
            </div>
            {error.showUpgrade && (
              <Button variant="primary" size="sm" onClick={() => window.location.href = '/subscription'}>
                Upgrade Plan
              </Button>
            )}
          </div>
        </Alert>
      )}

      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <FiUsers className="text-primary" size={24} />
                </div>
                <Badge bg="light" text="dark">{payrollData?.total_employees || 0} Employees</Badge>
              </div>
              <h3 className="fw-bold mb-1">{payrollData?.total_employees || 0}</h3>
              <p className="text-muted small mb-0">Total Active Employees</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <FiTrendingUp className="text-success" size={24} />
                </div>
                <Badge bg="light" text="dark">Monthly</Badge>
              </div>
              <h3 className="fw-bold mb-1">{formatCurrency(payrollSummary?.total_gross_pay || payrollData?.monthly_payroll || 0)}</h3>
              <p className="text-muted small mb-0">Total Gross Pay</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <FiShield className="text-warning" size={24} />
                </div>
                <Badge bg="light" text="dark">Deductions</Badge>
              </div>
              <h3 className="fw-bold mb-1">{formatCurrency((payrollSummary?.total_tax_deductions || 0) + (payrollSummary?.total_other_deductions || 0))}</h3>
              <p className="text-muted small mb-0">Total Deductions</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-info bg-opacity-10 p-3 rounded">
                  <FiDollarSign className="text-info" size={24} />
                </div>
                <Badge bg="light" text="dark">Net</Badge>
              </div>
              <h3 className="fw-bold mb-1">{formatCurrency(payrollSummary?.total_net_pay || 0)}</h3>
              <p className="text-muted small mb-0">Total Net Pay</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Month/Year Selector */}
      <Row className="mb-4">
        <Col md={6}>
          <div className="d-flex align-items-center gap-3">
            <Form.Select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : '')}
              style={{ width: 'auto' }}
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </Form.Select>
            <Form.Select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : '')}
              style={{ width: 'auto' }}
            >
              <option value="">All Years</option>
              {[2023, 2024, 2025, 2026, 2027, 2028].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </Form.Select>
            <Button variant="outline-primary" onClick={() => { fetchPayrollSummary(); fetchPayrollHistory(); }}>
              <FiRefreshCw size={16} />
            </Button>
          </div>
        </Col>
        <Col md={6} className="text-md-end mt-3 mt-md-0">
          <div className="d-flex gap-2 justify-content-md-end flex-wrap">
            <Badge bg="secondary" className="py-2 px-3">
              <FiClock className="me-1" /> Draft: {payrollSummary?.draft_count || 0}
            </Badge>
            <Badge bg="info" className="py-2 px-3">
              <FiCheckCircle className="me-1" /> Approved: {payrollSummary?.approved_count || 0}
            </Badge>
            <Badge bg="success" className="py-2 px-3">
              <FiDollarSign className="me-1" /> Paid: {payrollSummary?.paid_count || 0}
            </Badge>
          </div>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="overview" title={<><FiPieChart className="me-2" /> Overview</>}>
          <Row className="g-4">
            {/* Employee List */}
            <Col lg={8}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0">Employee Salary List</h5>
                    <InputGroup style={{ width: '250px' }}>
                      <InputGroup.Text><FiSearch size={14} /></InputGroup.Text>
                      <FormControl 
                        placeholder="Search employees..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <Table hover className="mb-0 align-middle">
                      <thead className="bg-light">
                        <tr>
                          <th className="border-0 py-3 ps-4">Employee</th>
                          <th className="border-0 py-3">Department</th>
                          <th className="border-0 py-3">Position</th>
                          <th className="border-0 py-3 text-end">Monthly Salary</th>
                          <th className="border-0 py-3 text-end pe-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(searchTerm ? filteredHistory.length > 0 ? payrollData?.employees?.filter(e => 
                          `${e.user?.first_name || ''} ${e.user?.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
                        ) : payrollData?.employees : payrollData?.employees || []).slice(0, 10).map(emp => (
                          <tr key={emp.id}>
                            <td className="ps-4">
                              <div className="d-flex align-items-center">
                                <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3 text-primary fw-bold" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {emp.user?.first_name?.[0] || 'N'}{emp.user?.last_name?.[0] || 'A'}
                                </div>
                                <div>
                                  <div className="fw-bold text-dark">{emp.user?.first_name || 'N/A'} {emp.user?.last_name || ''}</div>
                                  <div className="small text-muted">{emp.employee_id || 'N/A'}</div>
                                </div>
                              </div>
                            </td>
                            <td><Badge bg="light" text="dark">{emp.department || 'N/A'}</Badge></td>
                            <td className="text-muted">{emp.position || 'N/A'}</td>
                            <td className="text-end fw-bold">{formatCurrency(emp.salary || 0)}</td>
                            <td className="text-end pe-4">
                              <Button variant="outline-primary" size="sm" title="View Payslip">
                                <FiDownload size={16} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            {/* Quick Stats Sidebar */}
            <Col lg={4}>
              <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-white border-0 py-3">
                  <h5 className="fw-bold mb-0">Payroll Breakdown</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Basic Salary</span>
                      <span className="fw-bold">{formatCurrency(payrollSummary?.total_gross_pay - (payrollSummary?.total_bonuses || 0) - (payrollSummary?.total_allowances || 0) - (payrollSummary?.total_overtime || 0) || 0)}</span>
                    </div>
                    <ProgressBar variant="primary" now={100} style={{ height: '8px' }} />
                  </div>
                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Allowances</span>
                      <span className="fw-bold text-success">+{formatCurrency(payrollSummary?.total_allowances || 0)}</span>
                    </div>
                    <ProgressBar variant="success" now={((payrollSummary?.total_allowances || 0) / (payrollSummary?.total_gross_pay || 1)) * 100} style={{ height: '8px' }} />
                  </div>
                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Overtime</span>
                      <span className="fw-bold text-info">+{formatCurrency(payrollSummary?.total_overtime || 0)}</span>
                    </div>
                    <ProgressBar variant="info" now={((payrollSummary?.total_overtime || 0) / (payrollSummary?.total_gross_pay || 1)) * 100} style={{ height: '8px' }} />
                  </div>
                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Bonuses</span>
                      <span className="fw-bold text-warning">+{formatCurrency(payrollSummary?.total_bonuses || 0)}</span>
                    </div>
                    <ProgressBar variant="warning" now={((payrollSummary?.total_bonuses || 0) / (payrollSummary?.total_gross_pay || 1)) * 100} style={{ height: '8px' }} />
                  </div>
                  <hr />
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Tax Deductions</span>
                      <span className="fw-bold text-danger">-{formatCurrency(payrollSummary?.total_tax_deductions || 0)}</span>
                    </div>
                    <ProgressBar variant="danger" now={((payrollSummary?.total_tax_deductions || 0) / (payrollSummary?.total_gross_pay || 1)) * 100} style={{ height: '8px' }} />
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Other Deductions</span>
                      <span className="fw-bold text-danger">-{formatCurrency(payrollSummary?.total_other_deductions || 0)}</span>
                    </div>
                    <ProgressBar variant="danger" now={((payrollSummary?.total_other_deductions || 0) / (payrollSummary?.total_gross_pay || 1)) * 100} style={{ height: '8px' }} />
                  </div>
                </Card.Body>
              </Card>
              
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 py-3">
                  <h5 className="fw-bold mb-0">Next Pay Date</h5>
                </Card.Header>
                <Card.Body className="text-center py-4">
                  <FiCalendar size={48} className="text-primary mb-3" />
                  <h3 className="fw-bold">{payrollData?.next_pay_date ? new Date(payrollData.next_pay_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</h3>
                  <p className="text-muted">{payrollData?.pay_cycle || 'End of month cycle'}</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
        
        <Tab eventKey="history" title={<><FiActivity className="me-2" /> Payroll History</>}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                <h5 className="fw-bold mb-0">Payroll Records</h5>
                <div className="d-flex gap-2 align-items-center">
                  <Form.Select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ width: 'auto' }}
                    size="sm"
                  >
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="approved">Approved</option>
                    <option value="paid">Paid</option>
                  </Form.Select>
                  {selectedPayrolls.length > 0 && (
                    <div className="d-flex gap-2">
                      <Button variant="outline-success" size="sm" onClick={handleBulkApprove}>
                        <FiCheckCircle className="me-1" /> Approve ({selectedPayrolls.length})
                      </Button>
                      <Button variant="outline-primary" size="sm" onClick={handleBulkPay}>
                        <FiDollarSign className="me-1" /> Mark Paid ({selectedPayrolls.length})
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 py-3 ps-4" style={{ width: '40px' }}>
                        <Form.Check 
                          type="checkbox"
                          checked={selectedPayrolls.length === payrollHistory.length && payrollHistory.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="border-0 py-3">Employee</th>
                      <th className="border-0 py-3">Pay Period</th>
                      <th className="border-0 py-3 text-end">Gross Pay</th>
                      <th className="border-0 py-3 text-end">Deductions</th>
                      <th className="border-0 py-3 text-end">Net Pay</th>
                      <th className="border-0 py-3">Status</th>
                      <th className="border-0 py-3 text-end pe-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.length > 0 ? filteredHistory.map(payroll => (
                      <tr key={payroll.id}>
                        <td className="ps-4">
                          <Form.Check 
                            type="checkbox"
                            checked={selectedPayrolls.includes(payroll.id)}
                            onChange={() => toggleSelectPayroll(payroll.id)}
                          />
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-light rounded-circle p-2 me-3 text-muted fw-bold" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {payroll.employee?.first_name?.[0] || 'N'}{payroll.employee?.last_name?.[0] || 'A'}
                            </div>
                            <div>
                              <div className="fw-bold text-dark">{payroll.employee?.first_name || 'N/A'} {payroll.employee?.last_name || ''}</div>
                              <div className="small text-muted">{payroll.employee?.employee_id || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="small">
                            {payroll.pay_period_start ? new Date(payroll.pay_period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'} - 
                            {payroll.pay_period_end ? new Date(payroll.pay_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                          </div>
                        </td>
                        <td className="text-end fw-bold">{formatCurrency(payroll.gross_pay || 0)}</td>
                        <td className="text-end text-danger">-{formatCurrency((payroll.tax_deductions || 0) + (payroll.other_deductions || 0))}</td>
                        <td className="text-end fw-bold text-success">{formatCurrency(payroll.net_pay || 0)}</td>
                        <td>{getStatusBadge(payroll.status)}</td>
                        <td className="text-end pe-4">
                          {/* MoMo disburse button - show when approved and phone available */}
                          {payroll.status === 'approved' && payroll.employee?.user?.phone && (
                            <Button
                              variant="link"
                              className="p-0 me-2"
                              title="Disburse via MoMo"
                              onClick={async () => {
                                try {
                                  const res = await hrAPI.disbursePayroll(payroll.id);
                                  toast.success(res.data?.message || 'Disbursement initiated');
                                  fetchPayrollSummary();
                                  fetchPayrollHistory();
                                } catch (err) {
                                  console.error('Disburse error', err);
                                  toast.error(err.response?.data?.error || 'Failed to initiate disbursement');
                                }
                              }}
                            >
                              <img src={momoIcon} alt="MoMo" style={{ width: 28, height: 28 }} />
                            </Button>
                          )}
                          <Dropdown>
                            <Dropdown.Toggle variant="link" className="p-0 text-muted">
                              <FiMoreVertical />
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => openPayrollDetail(payroll)}>
                                <FiFileText className="me-2" /> View Details
                              </Dropdown.Item>
                              {payroll.status === 'draft' && (
                                <Dropdown.Item onClick={() => handleApprovePayroll(payroll.id)}>
                                  <FiCheckCircle className="me-2" /> Approve
                                </Dropdown.Item>
                              )}
                              {payroll.status !== 'paid' && (
                                <Dropdown.Item onClick={() => handleMarkPaid(payroll.id)}>
                                  <FiDollarSign className="me-2" /> Mark Paid
                                </Dropdown.Item>
                              )}
                              <Dropdown.Divider />
                              <Dropdown.Item className="text-danger">
                                <FiPrinter className="me-2" /> Print Payslip
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="8" className="text-center py-5 text-muted">
                          <FiFileText size={48} className="mb-3 opacity-50" />
                          <p className="mb-0">No payroll records found for this period</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Process Payroll Modal */}
      <Modal show={showProcessModal} onHide={() => setShowProcessModal(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Process Payroll</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Pay Period Start</Form.Label>
                <Form.Control 
                  type="date" 
                  value={formData.pay_period_start}
                  onChange={(e) => setFormData({...formData, pay_period_start: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Pay Period End</Form.Label>
                <Form.Control 
                  type="date" 
                  value={formData.pay_period_end}
                  onChange={(e) => setFormData({...formData, pay_period_end: e.target.value})}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Table bordered hover>
              <thead className="bg-light sticky-top">
                <tr>
                  <th>Employee</th>
                  <th>Basic Salary</th>
                  <th>Allowances</th>
                  <th>Overtime</th>
                  <th>Bonuses</th>
                  <th>Tax</th>
                  <th>Other Ded.</th>
                  <th>Gross</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {formData.employee_salaries.map((emp, index) => (
                  <tr key={index}>
                    <td className="fw-bold">
                      {payrollData?.employees?.[index]?.user?.first_name} {payrollData?.employees?.[index]?.user?.last_name}
                    </td>
                    <td>
                      <Form.Control 
                        type="number" 
                        size="sm"
                        value={emp.basic_salary}
                        onChange={(e) => updateEmployeeSalary(index, 'basic_salary', e.target.value)}
                      />
                    </td>
                    <td>
                      <Form.Control 
                        type="number" 
                        size="sm"
                        value={emp.allowances}
                        onChange={(e) => updateEmployeeSalary(index, 'allowances', e.target.value)}
                      />
                    </td>
                    <td>
                      <Form.Control 
                        type="number" 
                        size="sm"
                        value={emp.overtime_pay}
                        onChange={(e) => updateEmployeeSalary(index, 'overtime_pay', e.target.value)}
                      />
                    </td>
                    <td>
                      <Form.Control 
                        type="number" 
                        size="sm"
                        value={emp.bonuses}
                        onChange={(e) => updateEmployeeSalary(index, 'bonuses', e.target.value)}
                      />
                    </td>
                    <td>
                      <Form.Control 
                        type="number" 
                        size="sm"
                        value={emp.tax_deductions}
                        onChange={(e) => updateEmployeeSalary(index, 'tax_deductions', e.target.value)}
                      />
                    </td>
                    <td>
                      <Form.Control 
                        type="number" 
                        size="sm"
                        value={emp.other_deductions}
                        onChange={(e) => updateEmployeeSalary(index, 'other_deductions', e.target.value)}
                      />
                    </td>
                    <td className="fw-bold text-success">
                      {formatCurrency(emp.gross_pay || 0)}
                    </td>
                    <td className="fw-bold text-primary">
                      {formatCurrency(emp.net_pay || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          
          <Row className="mt-4">
            <Col md={4}>
              <div className="bg-light p-3 rounded">
                <div className="text-muted small">Total Gross</div>
                <div className="fw-bold h4 mb-0">
                  {formatCurrency(formData.employee_salaries.reduce((sum, e) => sum + (e.gross_pay || 0), 0))}
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="bg-light p-3 rounded">
                <div className="text-muted small">Total Deductions</div>
                <div className="fw-bold h4 mb-0 text-danger">
                  -{formatCurrency(formData.employee_salaries.reduce((sum, e) => sum + (e.tax_deductions || 0) + (e.other_deductions || 0), 0))}
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="bg-primary bg-opacity-10 p-3 rounded">
                <div className="text-muted small">Total Net</div>
                <div className="fw-bold h4 mb-0 text-primary">
                  {formatCurrency(formData.employee_salaries.reduce((sum, e) => sum + (e.net_pay || 0), 0))}
                </div>
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProcessModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleProcessPayroll} disabled={processingPayroll}>
            {processingPayroll ? <><FiLoader className="spin me-2" /> Processing...</> : 'Process Payroll'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Payroll Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Payslip Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPayroll && (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <h6 className="text-muted mb-2">Employee Information</h6>
                  <div className="bg-light p-3 rounded">
                    <div className="fw-bold">{selectedPayroll.employee?.first_name} {selectedPayroll.employee?.last_name}</div>
                    <div className="small text-muted">ID: {selectedPayroll.employee?.employee_id}</div>
                    <div className="small text-muted">Department: {selectedPayroll.employee?.department}</div>
                    <div className="small text-muted">Position: {selectedPayroll.employee?.position}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <h6 className="text-muted mb-2">Payment Information</h6>
                  <div className="bg-light p-3 rounded">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Period:</span>
                      <span className="fw-bold">
                        {selectedPayroll.pay_period_start ? new Date(selectedPayroll.pay_period_start).toLocaleDateString() : ''} - 
                        {selectedPayroll.pay_period_end ? new Date(selectedPayroll.pay_period_end).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Status:</span>
                      {getStatusBadge(selectedPayroll.status)}
                    </div>
                    {selectedPayroll.payment_date && (
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Paid On:</span>
                        <span className="fw-bold">{new Date(selectedPayroll.payment_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
              
              <h6 className="text-muted mb-2">Earnings</h6>
              <div className="table-responsive mb-4">
                <Table bordered size="sm">
                  <tbody>
                    <tr>
                      <td>Basic Salary</td>
                      <td className="text-end fw-bold">{formatCurrency(selectedPayroll.basic_salary || 0)}</td>
                    </tr>
                    <tr>
                      <td>Allowances</td>
                      <td className="text-end fw-bold text-success">+{formatCurrency(selectedPayroll.allowances || 0)}</td>
                    </tr>
                    <tr>
                      <td>Overtime Pay</td>
                      <td className="text-end fw-bold text-success">+{formatCurrency(selectedPayroll.overtime_pay || 0)}</td>
                    </tr>
                    <tr>
                      <td>Bonuses</td>
                      <td className="text-end fw-bold text-success">+{formatCurrency(selectedPayroll.bonuses || 0)}</td>
                    </tr>
                    <tr className="table-success">
                      <td className="fw-bold">Gross Pay</td>
                      <td className="text-end fw-bold">{formatCurrency(selectedPayroll.gross_pay || 0)}</td>
                    </tr>
                  </tbody>
                </Table>
              </div>
              
              <h6 className="text-muted mb-2">Deductions</h6>
              <div className="table-responsive mb-4">
                <Table bordered size="sm">
                  <tbody>
                    <tr>
                      <td>Tax Deductions</td>
                      <td className="text-end fw-bold text-danger">-{formatCurrency(selectedPayroll.tax_deductions || 0)}</td>
                    </tr>
                    <tr>
                      <td>Other Deductions</td>
                      <td className="text-end fw-bold text-danger">-{formatCurrency(selectedPayroll.other_deductions || 0)}</td>
                    </tr>
                    <tr className="table-danger">
                      <td className="fw-bold">Total Deductions</td>
                      <td className="text-end fw-bold text-danger">-{formatCurrency((selectedPayroll.tax_deductions || 0) + (selectedPayroll.other_deductions || 0))}</td>
                    </tr>
                  </tbody>
                </Table>
              </div>
              
              <div className="bg-primary bg-opacity-10 p-4 rounded text-center">
                <div className="text-muted mb-1">Net Pay</div>
                <div className="fw-bold text-primary" style={{ fontSize: '2rem' }}>
                  {formatCurrency(selectedPayroll.net_pay || 0)}
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => window.print()}>
            <FiPrinter className="me-2" /> Print
          </Button>
          <Button variant="outline-primary">
            <FiMail className="me-2" /> Send via Email
          </Button>
          <Button variant="primary" onClick={() => setShowDetailModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Payroll;
