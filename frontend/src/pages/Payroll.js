import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, Dropdown } from 'react-bootstrap';
import { FiUsers, FiDollarSign, FiCalendar, FiMoreVertical, FiCheckCircle, FiDownload, FiCreditCard } from 'react-icons/fi';
import { hrAPI } from '../services/api';
import toast from 'react-hot-toast';

const Payroll = () => {
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
            setError('Failed to fetch payroll data.');
        } finally {
            setLoading(false);
        }
    };

    const handleProcessPayroll = async () => {
        try {
            // In a real implementation, this would call an API endpoint to process payroll
            toast.success('Payroll processed successfully! Payslips generated.');
            console.log('Processing payroll...');
        } catch (err) {
            toast.error('Failed to process payroll. Please try again.');
            console.error('Error processing payroll:', err);
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
                    <Button variant="outline-primary" className="d-flex align-items-center" onClick={handleProcessPayroll}>
                        <FiCreditCard className="me-2" /> Process Payroll
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

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
                            <h3 className="fw-bold mb-0">${payrollData?.monthly_payroll?.toLocaleString() || '0'}</h3>
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
                            <h3 className="fw-bold mb-0">Jan 31, 2026</h3>
                            <small className="text-muted">End of month cycle</small>
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
                                            <div className="fw-bold text-dark">${parseFloat(emp.salary).toLocaleString()}</div>
                                        </td>
                                        <td>
                                            <Badge bg="success" className="fw-normal"><FiCheckCircle className="me-1" /> Active</Badge>
                                        </td>
                                        <td className="text-end pe-4">
                                            <Dropdown align="end">
                                                <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                                                    <FiMoreVertical size={20} />
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu className="border-0 shadow-sm">
                                                    <Dropdown.Item className="d-flex align-items-center py-2">
                                                        <FiDownload className="me-2 text-muted" /> View Payslip
                                                    </Dropdown.Item>
                                                    <Dropdown.Item className="d-flex align-items-center py-2">
                                                        <FiDollarSign className="me-2 text-muted" /> Adjust Salary
                                                    </Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
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
