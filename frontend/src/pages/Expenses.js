import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Dropdown, Alert } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEdit2, FiTrash2, FiDollarSign, FiDownload, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import { expensesAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [summary, setSummary] = useState(null);

  const { formatCurrency } = useCurrency();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expensesRes, categoriesRes, summaryRes] = await Promise.all([
        expensesAPI.getExpenses(),
        expensesAPI.getExpenseCategories(),
        expensesAPI.getExpenseSummary()
      ]);
      setExpenses(expensesRes.data.expenses || []);
      setCategories(categoriesRes.data.categories || []);
      setSummary(summaryRes.data.summary || null);
      setError(null);
    } catch (err) {
      setError('Failed to fetch expense data.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const expenseData = {
      description: formData.get('description'),
      amount: parseFloat(formData.get('amount')),
      category: formData.get('category'),
      expense_date: formData.get('expense_date'),
      notes: formData.get('notes')
    };

    setIsSaving(true);
    try {
      if (currentExpense) {
        await expensesAPI.updateExpense(currentExpense.id, expenseData);
        toast.success('Expense updated!');
      } else {
        await expensesAPI.createExpense(expenseData);
        toast.success('Expense recorded!');
      }
      fetchData();
      handleClose();
    } catch (err) {
      toast.error('Failed to save expense.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <span>
        Delete this expense record?
        <div className="mt-2 d-flex gap-2">
          <Button size="sm" variant="danger" onClick={async () => {
            try {
              await expensesAPI.deleteExpense(id);
              setExpenses(expenses.filter(e => e.id !== id));
              toast.dismiss(t.id);
              toast.success('Expense deleted');
            } catch (err) {
              toast.error('Failed to delete expense');
            }
          }}>
            Delete
          </Button>
          <Button size="sm" variant="light" onClick={() => toast.dismiss(t.id)}>
            Cancel
          </Button>
        </div>
      </span>
    ), { duration: 5000 });
  };

  const handleApprove = async (id) => {
    try {
      await expensesAPI.approveExpense(id);
      toast.success('Expense approved');
      fetchData();
    } catch (err) {
      toast.error('Failed to approve expense');
    }
  };

  const handleExport = async () => {
    try {
      const response = await expensesAPI.exportExpenses();
      toast.success(response.data.message || 'Expense report export initiated successfully');
      console.log('Export response:', response.data);
    } catch (err) {
      toast.error('Failed to export expenses. Please try again.');
      console.error('Error exporting expenses:', err);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setCurrentExpense(null);
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'approved': return <Badge bg="success" className="fw-normal"><FiCheckCircle className="me-1" /> Approved</Badge>;
      case 'pending_approval': return <Badge bg="warning" text="dark" className="fw-normal"><FiClock className="me-1" /> Pending</Badge>;
      case 'rejected': return <Badge bg="danger" className="fw-normal"><FiXCircle className="me-1" /> Rejected</Badge>;
      default: return <Badge bg="secondary" className="fw-normal">{status}</Badge>;
    }
  };

  const filteredExpenses = expenses.filter(exp =>
    exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.expense_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="expenses-wrapper">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Expenses</h2>
          <p className="text-muted mb-0">Track and manage company expenditures.</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Button variant="outline-secondary" className="d-flex align-items-center" onClick={handleExport}>
            <FiDownload className="me-2" /> Export
          </Button>
          <Button variant="primary" className="d-flex align-items-center" onClick={() => {
            setCurrentExpense(null);
            setShowModal(true);
          }}>
            <FiPlus className="me-2" /> Record Expense
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Summary Cards */}
      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-danger bg-opacity-10 p-2 rounded me-3">
                  <FiDollarSign className="text-danger" size={20} />
                </div>
                <span className="text-muted fw-medium">Total Expenses</span>
              </div>
              <h3 className="fw-bold mb-0">{summary?.total_expenses ? formatCurrency(summary.total_expenses) : formatCurrency(0)}</h3>
              <small className="text-muted">Lifetime total</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                  <FiClock className="text-warning" size={20} />
                </div>
                <span className="text-muted fw-medium">Monthly Expenses</span>
              </div>
              <h3 className="fw-bold mb-0">{summary?.monthly_expenses ? formatCurrency(summary.monthly_expenses) : formatCurrency(0)}</h3>
              <small className="text-muted">Current month</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                  <FiFilter className="text-info" size={20} />
                </div>
                <span className="text-muted fw-medium">Pending Approval</span>
              </div>
              <h3 className="fw-bold mb-0">{expenses.filter(e => e.status === 'PENDING_APPROVAL').length}</h3>
              <small className="text-muted">Requires action</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <div className="p-3 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '400px' }}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <FiSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by description or ID..."
                  className="bg-light border-start-0 ps-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
          </div>

          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 py-3 ps-4">Expense ID</th>
                  <th className="border-0 py-3">Description</th>
                  <th className="border-0 py-3">Category</th>
                  <th className="border-0 py-3">Date</th>
                  <th className="border-0 py-3">Amount</th>
                  <th className="border-0 py-3">Status</th>
                  <th className="border-0 py-3 text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(exp => (
                  <tr key={exp.id}>
                    <td className="ps-4">
                      <div className="fw-bold text-primary">{exp.expense_id}</div>
                    </td>
                    <td>
                      <div className="fw-medium text-dark">{exp.description}</div>
                    </td>
                    <td>
                      <Badge bg="light" text="dark" className="border fw-normal">
                        {exp.category}
                      </Badge>
                    </td>
                    <td>
                      <div className="text-muted small">{exp.expense_date}</div>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{formatCurrency(exp.amount)}</div>
                    </td>
                    <td>
                      {getStatusBadge(exp.status)}
                    </td>
                    <td className="text-end pe-4">
                      <Dropdown align="end">
                        <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                          <FiMoreVertical size={20} />
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="border-0 shadow-sm">
                          {exp.status === 'PENDING_APPROVAL' && (
                            <Dropdown.Item onClick={() => handleApprove(exp.id)} className="d-flex align-items-center py-2 text-success">
                              <FiCheckCircle className="me-2" /> Approve
                            </Dropdown.Item>
                          )}
                          <Dropdown.Item onClick={() => {
                            setCurrentExpense(exp);
                            setShowModal(true);
                          }} className="d-flex align-items-center py-2">
                            <FiEdit2 className="me-2 text-muted" /> Edit
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item className="d-flex align-items-center py-2 text-danger" onClick={() => handleDelete(exp.id)}>
                            <FiTrash2 className="me-2" /> Delete
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

      <Modal show={showModal} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{currentExpense ? 'Edit Expense' : 'Record New Expense'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form onSubmit={handleSave}>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Description</Form.Label>
                  <Form.Control name="description" type="text" defaultValue={currentExpense?.description} placeholder="What was this expense for?" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Category</Form.Label>
                  <Form.Select name="category" defaultValue={currentExpense?.category || ''} required>
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Amount</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>{formatCurrency(0).split('0.00')[0]}</InputGroup.Text>
                    <Form.Control name="amount" type="number" step="0.01" defaultValue={currentExpense?.amount} required />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Date</Form.Label>
                  <Form.Control name="expense_date" type="date" defaultValue={currentExpense?.expense_date || new Date().toISOString().split('T')[0]} required />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Notes</Form.Label>
                  <Form.Control name="notes" as="textarea" rows={2} defaultValue={currentExpense?.notes} placeholder="Additional details..." />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="light" onClick={handleClose} className="px-4">Cancel</Button>
              <Button variant="primary" type="submit" className="px-4" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Expense'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Expenses;