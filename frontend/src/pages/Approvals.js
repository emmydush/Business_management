import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Button, Badge, Dropdown, Alert, Spinner } from 'react-bootstrap';
import { FiCheckCircle, FiXCircle, FiClock, FiMoreVertical, FiEye, FiFilter, FiUser, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { expensesAPI, hrAPI, purchasesAPI, branchesAPI } from '../services/api';

const Approvals = () => {
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        setUserRole(user.role);
    }, []);

    const fetchApprovals = async () => {
        setLoading(true);
        setError(null);
        try {
            const promises = [
                expensesAPI.getExpenses({ status: 'pending_approval', per_page: 100 }),
                hrAPI.getLeaveRequests({ status: 'pending', per_page: 100 }),
                purchasesAPI.getPurchaseOrders({ status: 'PENDING', per_page: 100 })
            ];

            // Only superadmins can see branch approvals
            const user = JSON.parse(sessionStorage.getItem('user') || '{}');
            if (user.role === 'superadmin') {
                promises.push(branchesAPI.getPendingBranches());
            }

            const results = await Promise.all(promises);
            const [expensesRes, leavesRes, purchasesRes, branchesRes] = results;

            const expenseItems = (expensesRes.data.expenses || []).map(e => ({
                id: `expense-${e.id}`,
                rawId: e.id,
                type: 'Expense Claim',
                title: e.description || e.expense_id,
                requester: `User #${e.created_by}`,
                date: e.expense_date,
                priority: 'Medium',
                status: e.status === 'pending_approval' ? 'Pending' : capitalize(e.status)
            }));

            const leaveItems = (leavesRes.data.leave_requests || []).map(l => ({
                id: `leave-${l.id}`,
                rawId: l.id,
                type: 'Leave Request',
                title: `${capitalize(l.leave_type)} Leave - ${l.days_requested} days`,
                requester: l.employee && (l.employee.first_name || l.employee.last_name) ? `${l.employee.first_name || ''} ${l.employee.last_name || ''}`.trim() : `Employee #${l.employee_id}`,
                date: l.start_date,
                priority: 'Medium',
                status: l.status === 'pending' ? 'Pending' : capitalize(l.status)
            }));

            const purchaseItems = (purchasesRes.data.purchase_orders || []).map(p => ({
                id: `po-${p.id}`,
                rawId: p.id,
                type: 'Purchase Order',
                title: p.order_id || `PO ${p.id}`,
                requester: p.buyer ? `${p.buyer.first_name || ''} ${p.buyer.last_name || ''}`.trim() : `User #${p.user_id}`,
                date: p.order_date,
                priority: 'Medium',
                status: p.status === 'pending' ? 'Pending' : capitalize(p.status)
            }));

            let branchItems = [];
            if (branchesRes) {
                branchItems = (branchesRes.data.branches || []).map(b => ({
                    id: `branch-${b.id}`,
                    rawId: b.id,
                    type: 'Branch Creation',
                    title: `New Branch: ${b.name} (${b.code || 'No Code'})`,
                    requester: 'Admin',
                    date: b.created_at,
                    priority: 'High',
                    status: b.status === 'pending' ? 'Pending' : capitalize(b.status)
                }));
            }

            setApprovals([...expenseItems, ...leaveItems, ...purchaseItems, ...branchItems]);
        } catch (err) {
            console.error('Failed to load approvals:', err);
            setError('Failed to load approvals.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovals();
    }, []);

    const capitalize = (s) => s ? (s.charAt(0).toUpperCase() + s.slice(1)) : s;

    const handleAction = async (item, newStatus) => {
        try {
            if (item.type === 'Expense Claim') {
                if (newStatus === 'Approved') await expensesAPI.approveExpense(item.rawId);
                else await expensesAPI.rejectExpense(item.rawId);
            } else if (item.type === 'Leave Request') {
                if (newStatus === 'Approved') await hrAPI.approveLeaveRequest(item.rawId);
                else await hrAPI.rejectLeaveRequest(item.rawId);
            } else if (item.type === 'Purchase Order') {
                const status = newStatus === 'Approved' ? 'CONFIRMED' : 'CANCELLED';
                await purchasesAPI.updatePurchaseOrder(item.rawId, { status });
            } else if (item.type === 'Branch Creation') {
                if (newStatus === 'Approved') await branchesAPI.approveBranch(item.rawId);
                else await branchesAPI.rejectBranch(item.rawId);
            }

            setApprovals(prev => prev.map(a => a.id === item.id ? { ...a, status: newStatus } : a));
            toast.success(`Request ${newStatus.toLowerCase()} successfully!`);
        } catch (err) {
            console.error('Action failed:', err);
            toast.error(err.response && err.response.data && err.response.data.error ? err.response.data.error : 'Action failed.');
        }
    };

    const approveAll = async () => {
        const pending = approvals.filter(a => a.status === 'Pending');
        for (const item of pending) {
            await handleAction(item, 'Approved');
        }
    };

    const getStatusBadge = (status) => {
        switch (status.toLowerCase()) {
            case 'approved': return <Badge bg="success" className="fw-normal"><FiCheckCircle className="me-1" /> Approved</Badge>;
            case 'pending': return <Badge bg="warning" text="dark" className="fw-normal"><FiClock className="me-1" /> Pending</Badge>;
            case 'rejected': return <Badge bg="danger" className="fw-normal"><FiXCircle className="me-1" /> Rejected</Badge>;
            default: return <Badge bg="secondary" className="fw-normal">{status}</Badge>;
        }
    };

    const getPriorityBadge = (priority) => {
        switch (priority.toLowerCase()) {
            case 'high': return <Badge bg="danger" className="fw-normal">High</Badge>;
            case 'medium': return <Badge bg="primary" className="fw-normal">Medium</Badge>;
            case 'low': return <Badge bg="info" className="fw-normal">Low</Badge>;
            default: return <Badge bg="secondary" className="fw-normal">{priority}</Badge>;
        }
    };

    const approvedTodayCount = approvals.filter(a => a.status === 'Approved' && a.date && new Date(a.date).toDateString() === new Date().toDateString()).length;
    const rejectedTodayCount = approvals.filter(a => a.status === 'Rejected' && a.date && new Date(a.date).toDateString() === new Date().toDateString()).length;

    return (
        <div className="approvals-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Approvals & Workflows</h2>
                    <p className="text-muted mb-0">Review and manage pending requests across all departments.</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-secondary" className="d-flex align-items-center" onClick={fetchApprovals}>
                        <FiRefreshCw className="me-2" /> Refresh
                    </Button>
                    <Button variant="primary" className="d-flex align-items-center" onClick={approveAll}>
                        <FiCheckCircle className="me-2" /> Approve All Pending
                    </Button>
                </div>
            </div>

            <Row className="g-4 mb-4">
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-warning bg-opacity-10 p-3 rounded me-3">
                                <FiClock className="text-warning" size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-medium">Pending Approvals</div>
                                <h4 className="fw-bold mb-0">{approvals.filter(a => a.status === 'Pending').length}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                                <FiCheckCircle className="text-success" size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-medium">Approved Today</div>
                                <h4 className="fw-bold mb-0">{approvedTodayCount}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-danger bg-opacity-10 p-3 rounded me-3">
                                <FiXCircle className="text-danger" size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-medium">Rejected Today</div>
                                <h4 className="fw-bold mb-0">{rejectedTodayCount}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    {loading && <div className="text-center py-5"><Spinner animation="border" /></div>}
                    {!loading && error && <Alert variant="danger" className="m-3">{error}</Alert>}
                    {!loading && !error && (
                        <div className="table-responsive">
                            <Table hover className="mb-0 align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4 py-3 border-0">Request Details</th>
                                        <th className="py-3 border-0">Requester</th>
                                        <th className="py-3 border-0">Priority</th>
                                        <th className="py-3 border-0">Date</th>
                                        <th className="py-3 border-0">Status</th>
                                        <th className="text-end pe-4 py-3 border-0">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {approvals.map(item => (
                                        <tr key={item.id}>
                                            <td className="ps-4">
                                                <div className="fw-bold text-dark">{item.title}</div>
                                                <div className="small text-muted">{item.type}</div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-light rounded-circle p-1 me-2"><FiUser size={14} /></div>
                                                    <span className="small fw-medium">{item.requester}</span>
                                                </div>
                                            </td>
                                            <td>{getPriorityBadge(item.priority)}</td>
                                            <td className="text-muted small">{item.date}</td>
                                            <td>{getStatusBadge(item.status)}</td>
                                            <td className="text-end pe-4">
                                                {item.status === 'Pending' ? (
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <Button variant="success" size="sm" className="px-3" onClick={() => handleAction(item, 'Approved')}>Approve</Button>
                                                        <Button variant="outline-danger" size="sm" className="px-3" onClick={() => handleAction(item, 'Rejected')}>Reject</Button>
                                                    </div>
                                                ) : (
                                                    <Dropdown align="end">
                                                        <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                                                            <FiMoreVertical size={20} />
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu className="border-0 shadow-sm">
                                                            <Dropdown.Item className="d-flex align-items-center py-2">
                                                                <FiEye className="me-2 text-muted" /> View Details
                                                            </Dropdown.Item>
                                                            <Dropdown.Item className="d-flex align-items-center py-2">
                                                                <FiClock className="me-2 text-muted" /> View History
                                                            </Dropdown.Item>
                                                        </Dropdown.Menu>
                                                    </Dropdown>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default Approvals;
