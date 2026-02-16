import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, Dropdown } from 'react-bootstrap';
import { FiUsers, FiDollarSign, FiCalendar, FiMoreVertical, FiCheckCircle, FiDownload, FiCreditCard, FiLoader } from 'react-icons/fi';
import { hrAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import SubscriptionGuard from '../components/SubscriptionGuard';

const Payroll = () => {
    const { formatCurrency } = useCurrency();
    const [payrollData, setPayrollData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPayroll();
    }, []);

    const fetchPayroll = async () => {
        try {
            setLoading(true);
            const response = await hrAPI.getPayroll();
            setPayrollData(response.data.payroll || null);
            setError(null);
        } catch (err) {
            console.error('Error fetching payroll data:', err);
            
            // Check if it's a subscription/permission error
            if (err.response?.status === 403) {
                if (err.response.data?.upgrade_required) {
                    setError({
                        message: err.response.data.message,
                        upgrade_message: err.response.data.upgrade_message,
                        feature_required: 'Payroll module',
                        showUpgrade: true
                    });
                } else {
                    setError({
                        message: err.response.data?.error || 'Access denied. Please contact your administrator.',
                        showUpgrade: false
                    });
                }
            } else if (err.response?.status === 404) {
                setError({
                    message: 'Payroll module is not available. Please check your subscription plan.',
                    showUpgrade: true,
                    feature_required: 'Payroll module'
                });
            } else {
                setError({
                    message: 'Failed to fetch payroll data.',
                    showUpgrade: false
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleProcessPayroll = async () => {
        try {
            // Show confirmation dialog first
            if (!window.confirm('Are you sure you want to process payroll for all employees? This will generate payslips and mark them as ready for payment.')) {
                return;
            }
            
            // Prepare payroll data
            const payrollData = {
                pay_period_start: new Date().toISOString().split('T')[0], // Today's date
                pay_period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0], // Last day of current month
                employee_salaries: payrollData?.employees?.map(emp => ({
                    employee_id: emp.id,
                    basic_salary: emp.salary || 0,
                    notes: `Monthly salary for ${new Date().toLocaleString('default', { month: 'long' })}`
                })) || []
            };
            
            // Call the API to create payroll records
            const response = await hrAPI.createPayroll(payrollData);
            
            toast.success(response.data.message || 'Payroll processed successfully! Payslips generated.');
            console.log('Payroll processing response:', response.data);
            
            // Refresh the payroll data
            await fetchPayroll();
            
        } catch (err) {
            console.error('Error processing payroll:', err);
            
            // Check if it's a subscription/permission error
            if (err.response?.status === 403) {
                if (err.response.data?.upgrade_required) {
                    setError({
                        message: err.response.data.message,
                        upgrade_message: err.response.data.upgrade_message,
                        feature_required: 'Payroll processing',
                        showUpgrade: true
                    });
                    toast.error(err.response.data.message);
                } else {
                    toast.error(err.response.data?.error || 'Access denied. Please contact your administrator.');
                }
            } else {
                toast.error(err.response?.data?.error || 'Failed to process payroll. Please try again.');
            }
        }
    };

    const handleExportPayroll = async () => {
        try {
            const response = await hrAPI.exportPayroll();
            toast.success(response.data.message || 'Payroll export initiated successfully');
            console.log('Export response:', response.data);
        } catch (err) {
            toast.error('Failed to export payroll. Please try again.');
            console.error('Error exporting payroll:', err);
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
        <div className="payroll-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Payroll Management</h2>
                    <p className="text-muted mb-0">Manage employee salaries, bonuses, and disbursements.</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <SubscriptionGuard message="Renew your subscription to process payroll">
                        <Button variant="outline-primary" className="d-flex align-items-center" onClick={handleProcessPayroll}>
                            <FiCreditCard className="me-2" /> Process Payroll
                        </Button>
                    </SubscriptionGuard>
                </div>
            </div>

            {error && (
                <Alert variant={error.showUpgrade ? "warning" : "danger"}>
                    <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                            <h6 className="alert-heading mb-1">
                                {error.showUpgrade ? "Access Restricted" : "Error"}
                            </h6>
                            <p className="mb-0">
                                {error.message}
                            </p>
                            {error.showUpgrade && (
                                <div className="mt-2">
                                    <small className="text-muted d-block mb-2">{error.upgrade_message || "Upgrade your plan to access this feature."}</small>
                                    <Button 
                                        variant="primary" 
                                        size="sm" 
                                        onClick={() => window.location.href = '/subscription'}
                                        className="me-2"
                                    >
                                        Upgrade Plan
                                    </Button>
                                    <Button 
                                        variant="outline-secondary" 
                                        size="sm" 
                                        onClick={() => window.location.reload()}
                                    >
                                        Dismiss
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </Alert>
            )}

            <Row className="g-4 mb-4">
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                                    <FiUsers className="text-primary" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Total Employees</span>
                            </div>
                            <h3 className="fw-bold mb-0">{payrollData?.total_employees || 0}</h3>
                            <small className="text-muted">Active staff members</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                                    <FiDollarSign className="text-success" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Monthly Payroll</span>
                            </div>
                            <h3 className="fw-bold mb-0">{formatCurrency(payrollData?.monthly_payroll || 0)}</h3>
                            <small className="text-muted">Estimated disbursement</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                                    <FiCalendar className="text-info" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Next Pay Date</span>
                            </div>
                            <h3 className="fw-bold mb-0">{payrollData?.next_pay_date ? new Date(payrollData.next_pay_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</h3>
                            <small className="text-muted">{payrollData?.pay_cycle || 'End of month cycle'}</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0">Employee Salary List</h5>
                    <Button variant="link" className="text-primary p-0 text-decoration-none small fw-bold" onClick={handleExportPayroll}>
                        <FiDownload className="me-1" /> Download All Payslips
                    </Button>
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0 py-3 ps-4">Employee</th>
                                    <th className="border-0 py-3">Department</th>
                                    <th className="border-0 py-3">Position</th>
                                    <th className="border-0 py-3">Monthly Salary</th>
                                    <th className="border-0 py-3">Status</th>
                                    <th className="border-0 py-3 text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payrollData?.employees?.map(emp => (
                                    <tr key={emp.id}>
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center">
                                                <div className="bg-light rounded-circle p-2 me-3 text-primary fw-bold" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {emp.user?.first_name?.[0] || 'N'}{emp.user?.last_name?.[0] || 'A'}
                                                </div>
                                                <div>
                                                    <div className="fw-bold text-dark">{emp.user?.first_name || 'N/A'} {emp.user?.last_name || ''}</div>
                                                    <div className="small text-muted">{emp.employee_id || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <Badge bg="light" text="dark" className="border fw-normal">{emp.department}</Badge>
                                        </td>
                                        <td>
                                            <div className="text-muted small">{emp.position}</div>
                                        </td>
                                        <td>
                                            <div className="fw-bold text-dark">{formatCurrency(emp.salary)}</div>
                                        </td>
                                        <td>
                                            <Badge bg="success" className="fw-normal"><FiCheckCircle className="me-1" /> Active</Badge>
                                        </td>
                                        <td className="text-end pe-4">
                                            <div className="d-flex gap-2 justify-content-end">
                                                <Button variant="outline-secondary" size="sm" className="d-flex align-items-center" title="View Payslip">
                                                    <FiDownload size={16} />
                                                </Button>
                                                <Button variant="outline-primary" size="sm" className="d-flex align-items-center" title="Adjust Salary">
                                                    <FiDollarSign size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Payroll;
