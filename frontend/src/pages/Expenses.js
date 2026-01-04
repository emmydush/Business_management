import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge } from 'react-bootstrap';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data for expenses
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setExpenses([
        { id: 1, expenseId: 'EXP001', description: 'Office Supplies', category: 'Supplies', amount: 150.00, date: '2023-07-15', status: 'approved', vendor: 'Office Depot' },
        { id: 2, expenseId: 'EXP002', description: 'Travel Expenses', category: 'Travel', amount: 450.00, date: '2023-07-14', status: 'pending', vendor: 'Delta Airlines' },
        { id: 3, expenseId: 'EXP003', description: 'Software License', category: 'Software', amount: 299.99, date: '2023-07-13', status: 'approved', vendor: 'Microsoft' },
        { id: 4, expenseId: 'EXP004', description: 'Marketing Campaign', category: 'Marketing', amount: 1200.00, date: '2023-07-12', status: 'approved', vendor: 'Google Ads' },
        { id: 5, expenseId: 'EXP005', description: 'Utilities', category: 'Utilities', amount: 350.00, date: '2023-07-11', status: 'rejected', vendor: 'Local Utility Co' }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleEdit = (expense) => {
    setCurrentExpense(expense);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      setExpenses(expenses.filter(exp => exp.id !== id));
    }
  };

  const handleAdd = () => {
    setCurrentExpense(null);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setCurrentExpense(null);
  };

  const getStatusVariant = (status) => {
    switch(status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Container fluid className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid>
      <h1 className="mb-4">Expenses Management</h1>
      
      <Row>
        <Col lg={12}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5>Expenses List</h5>
              <Button variant="primary" onClick={handleAdd}>Add Expense</Button>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Expense ID</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Vendor</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(expense => (
                      <tr key={expense.id}>
                        <td>{expense.expenseId}</td>
                        <td>{expense.description}</td>
                        <td>{expense.category}</td>
                        <td>${expense.amount.toFixed(2)}</td>
                        <td>{expense.date}</td>
                        <td>{expense.vendor}</td>
                        <td>
                          <Badge bg={getStatusVariant(expense.status)}>
                            {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                          </Badge>
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleEdit(expense)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(expense.id)}
                          >
                            Delete
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
      </Row>

      {/* Expense Modal */}
      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {currentExpense ? `Edit Expense: ${currentExpense.description}` : 'Add New Expense'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Expense ID</Form.Label>
                  <Form.Control 
                    type="text" 
                    defaultValue={currentExpense?.expenseId || 'EXP001'}
                    placeholder="EXP001"
                    disabled={!!currentExpense}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select defaultValue={currentExpense?.status || 'pending'}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control 
                type="text" 
                defaultValue={currentExpense?.description || ''}
                placeholder="Enter expense description"
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select defaultValue={currentExpense?.category || ''}>
                    <option value="Supplies">Supplies</option>
                    <option value="Travel">Travel</option>
                    <option value="Software">Software</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Amount</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01" 
                    defaultValue={currentExpense?.amount || 0}
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Vendor</Form.Label>
              <Form.Control 
                type="text" 
                defaultValue={currentExpense?.vendor || ''}
                placeholder="Enter vendor name"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control 
                type="date" 
                defaultValue={currentExpense?.date || ''}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary">
            {currentExpense ? 'Update Expense' : 'Add Expense'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Expenses;