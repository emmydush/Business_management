import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Dropdown, Alert } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEdit2, FiTrash2, FiPhone, FiMail, FiMapPin, FiUser, FiDownload } from 'react-icons/fi';
import { customersAPI } from '../services/api';
import toast from 'react-hot-toast';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getCustomers();
      setCustomers(response.data.customers || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch customers. Please check your connection.');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setCurrentCustomer(customer);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    toast((t) => (
      <span>
        Are you sure you want to delete this customer?
        <div className="mt-2 d-flex gap-2">
          <Button size="sm" variant="danger" onClick={async () => {
            try {
              await customersAPI.deleteCustomer(id);
              setCustomers(customers.filter(customer => customer.id !== id));
              toast.dismiss(t.id);
              toast.success('Customer deleted successfully');
            } catch (error) {
              toast.dismiss(t.id);
              toast.error('Failed to delete customer');
              console.error('Error deleting customer:', error);
            }
          }}>
            Delete
          </Button>
          <Button size="sm" variant="light" onClick={() => toast.dismiss(t.id)}>
            Cancel
          </Button>
        </div>
      </span>
    ), { duration: 6000 });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const customerData = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      company: formData.get('company'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      balance: parseFloat(formData.get('balance')) || 0,
      is_active: formData.get('is_active') === 'on'
    };

    setIsSaving(true);
    try {
      if (currentCustomer) {
        await customersAPI.updateCustomer(currentCustomer.id, customerData);
        toast.success('Customer updated successfully!');
      } else {
        await customersAPI.createCustomer(customerData);
        toast.success('New customer added successfully!');
      }
      fetchCustomers(); // Refresh the customer list
      handleClose();
    } catch (err) {
      toast.error('Failed to save customer. Please try again.');
      console.error('Error saving customer:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setCurrentCustomer(null);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0)}${lastName?.charAt(0)}`;
  };

  const getRandomColor = (id) => {
    const colors = ['bg-primary', 'bg-success', 'bg-danger', 'bg-warning', 'bg-info', 'bg-secondary'];
    return colors[id % colors.length];
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
      <div className="container-fluid">
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="customers-wrapper">
      {/* Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Customers</h2>
          <p className="text-muted mb-0">Manage your customer relationships and accounts.</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Button variant="outline-secondary" className="d-flex align-items-center" onClick={() => toast.success('Exporting customer list...')}>
            <FiDownload className="me-2" /> Export
          </Button>
          <Button variant="primary" className="d-flex align-items-center" onClick={() => {
            setCurrentCustomer(null);
            setShowModal(true);
          }}>
            <FiPlus className="me-2" /> Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                  <FiUser className="text-primary" size={20} />
                </div>
                <span className="text-muted fw-medium">Total Customers</span>
              </div>
              <h3 className="fw-bold mb-0">{customers.length}</h3>
              <small className="text-success fw-medium">+12% from last month</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                  <FiUser className="text-success" size={20} />
                </div>
                <span className="text-muted fw-medium">Active Customers</span>
              </div>
              <h3 className="fw-bold mb-0">{customers.filter(c => c.is_active).length}</h3>
              <small className="text-muted">Current active accounts</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                  <FiUser className="text-warning" size={20} />
                </div>
                <span className="text-muted fw-medium">New This Month</span>
              </div>
              <h3 className="fw-bold mb-0">5</h3>
              <small className="text-muted">Recently added</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                  <FiUser className="text-info" size={20} />
                </div>
                <span className="text-muted fw-medium">Total Balance</span>
              </div>
              <h3 className="fw-bold mb-0">${customers.reduce((acc, curr) => acc + (curr.balance || 0), 0).toLocaleString()}</h3>
              <small className="text-muted">Outstanding payments</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content Card */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {/* Toolbar */}
          <div className="p-3 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '400px' }}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <FiSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search customers..."
                  className="bg-light border-start-0 ps-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-light" className="text-dark border d-flex align-items-center">
                <FiFilter className="me-2" /> Filter
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 py-3 ps-4">Customer</th>
                  <th className="border-0 py-3">Contact Info</th>
                  <th className="border-0 py-3">Company</th>
                  <th className="border-0 py-3">Status</th>
                  <th className="border-0 py-3">Balance</th>
                  <th className="border-0 py-3 text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => (
                  <tr key={customer.id}>
                    <td className="ps-4">
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <div
                            className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-bold ${getRandomColor(customer.id)}`}
                            style={{ width: '40px', height: '40px', fontSize: '14px' }}
                          >
                            {getInitials(customer.first_name, customer.last_name)}
                          </div>
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{customer.first_name} {customer.last_name}</div>
                          <div className="small text-muted">{customer.customer_id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column">
                        <span className="d-flex align-items-center text-muted small mb-1">
                          <FiMail className="me-2" size={14} /> {customer.email}
                        </span>
                        <span className="d-flex align-items-center text-muted small">
                          <FiPhone className="me-2" size={14} /> {customer.phone}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="fw-medium">{customer.company}</div>
                      <div className="small text-muted d-flex align-items-center">
                        <FiMapPin className="me-1" size={12} /> {customer.city}
                      </div>
                    </td>
                    <td>
                      <Badge bg={customer.is_active ? 'success' : 'secondary'} className="px-2 py-1 fw-normal">
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="fw-bold text-dark">
                      ${customer.balance ? parseFloat(customer.balance).toFixed(2) : '0.00'}
                    </td>
                    <td className="text-end pe-4">
                      <Dropdown align="end">
                        <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                          <FiMoreVertical size={20} />
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="border-0 shadow-sm">
                          <Dropdown.Item onClick={() => handleEdit(customer)} className="d-flex align-items-center py-2">
                            <FiEdit2 className="me-2 text-muted" /> Edit Details
                          </Dropdown.Item>
                          <Dropdown.Item className="d-flex align-items-center py-2 text-danger" onClick={() => handleDelete(customer.id)}>
                            <FiTrash2 className="me-2" /> Delete Customer
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Pagination (Placeholder) */}
          <div className="d-flex justify-content-between align-items-center p-3 border-top">
            <div className="text-muted small">Showing {filteredCustomers.length} of {customers.length} entries</div>
            <div className="d-flex gap-1">
              <Button variant="outline-light" size="sm" className="text-dark border" disabled>Previous</Button>
              <Button variant="primary" size="sm">1</Button>
              <Button variant="outline-light" size="sm" className="text-dark border">2</Button>
              <Button variant="outline-light" size="sm" className="text-dark border">3</Button>
              <Button variant="outline-light" size="sm" className="text-dark border">Next</Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Customer Modal */}
      <Modal show={showModal} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{currentCustomer ? 'Edit Customer' : 'Add New Customer'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form onSubmit={handleSave}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">First Name</Form.Label>
                  <Form.Control name="first_name" type="text" defaultValue={currentCustomer?.first_name || currentCustomer?.firstName} placeholder="Enter first name" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Last Name</Form.Label>
                  <Form.Control name="last_name" type="text" defaultValue={currentCustomer?.last_name || currentCustomer?.lastName} placeholder="Enter last name" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Company</Form.Label>
                  <Form.Control name="company" type="text" defaultValue={currentCustomer?.company} placeholder="Enter company name" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Email</Form.Label>
                  <Form.Control name="email" type="email" defaultValue={currentCustomer?.email} placeholder="Enter email address" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Phone</Form.Label>
                  <Form.Control name="phone" type="tel" defaultValue={currentCustomer?.phone} placeholder="Enter phone number" />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Address</Form.Label>
                  <Form.Control name="address" as="textarea" rows={2} defaultValue={currentCustomer?.address} placeholder="Enter full address" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Balance</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control name="balance" type="number" step="0.01" defaultValue={currentCustomer?.balance || 0} placeholder="0.00" />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Check
                  name="is_active"
                  type="switch"
                  id="customer-status"
                  label="Customer is active"
                  defaultChecked={currentCustomer ? currentCustomer.is_active : true}
                />
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="light" onClick={handleClose} className="px-4">Cancel</Button>
              <Button variant="primary" type="submit" className="px-4" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Customer'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Customers;