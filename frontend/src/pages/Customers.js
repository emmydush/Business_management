import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Dropdown, Alert } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEdit2, FiTrash2, FiPhone, FiMail, FiMapPin, FiUser, FiDownload } from 'react-icons/fi';
import { customersAPI } from '../services/api';
import toast from 'react-hot-toast';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

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

  const handleViewProfile = (customer) => {
    setCurrentCustomer(customer);
    setShowProfileModal(true);
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
      customer_type: formData.get('customer_type'),
      notes: formData.get('notes'),
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
      fetchCustomers();
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
    setShowProfileModal(false);
    setCurrentCustomer(null);
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      (customer.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (customer.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (customer.company?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (customer.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (customer.customer_id?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'All' || customer.customer_type === filterType;
    const matchesStatus = filterStatus === 'All' ||
      (filterStatus === 'Active' && customer.is_active) ||
      (filterStatus === 'Inactive' && !customer.is_active);

    return matchesSearch && matchesType && matchesStatus;
  });

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
  };

  const getRandomColor = (id) => {
    const colors = ['bg-primary', 'bg-success', 'bg-danger', 'bg-warning', 'bg-info', 'bg-secondary'];
    return colors[id % colors.length];
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case 'VIP': return 'warning';
      case 'Company': return 'info';
      default: return 'primary';
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
          <Card className="border-0 shadow-sm h-100 kpi-card">
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
          <Card className="border-0 shadow-sm h-100 kpi-card">
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
          <Card className="border-0 shadow-sm h-100 kpi-card">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                  <FiUser className="text-warning" size={20} />
                </div>
                <span className="text-muted fw-medium">VIP Customers</span>
              </div>
              <h3 className="fw-bold mb-0">{customers.filter(c => c.customer_type === 'VIP').length}</h3>
              <small className="text-muted">High value clients</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100 kpi-card">
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
                  placeholder="Search by name, email, ID..."
                  className="bg-light border-start-0 ps-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
            <div className="d-flex gap-2">
              <Form.Select
                size="sm"
                className="w-auto border-light bg-light"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="Individual">Individual</option>
                <option value="Company">Company</option>
                <option value="VIP">VIP</option>
              </Form.Select>
              <Form.Select
                size="sm"
                className="w-auto border-light bg-light"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Form.Select>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 py-3 ps-4">Customer</th>
                  <th className="border-0 py-3">Contact Info</th>
                  <th className="border-0 py-3">Type</th>
                  <th className="border-0 py-3">Status</th>
                  <th className="border-0 py-3 text-end">Balance</th>
                  <th className="border-0 py-3 text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
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
                      <Badge bg={getBadgeColor(customer.customer_type)} className="px-2 py-1 fw-normal">
                        {customer.customer_type || 'Individual'}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={customer.is_active ? 'success-light' : 'secondary-light'} className={`px-2 py-1 fw-normal ${customer.is_active ? 'text-success' : 'text-secondary'}`}>
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="fw-bold text-dark text-end">
                      ${customer.balance ? parseFloat(customer.balance).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                    </td>
                    <td className="text-end pe-4">
                      <Dropdown align="end">
                        <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                          <FiMoreVertical size={20} />
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="border-0 shadow-sm">
                          <Dropdown.Item onClick={() => handleViewProfile(customer)} className="d-flex align-items-center py-2">
                            <FiUser className="me-2 text-muted" /> View Profile
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleEdit(customer)} className="d-flex align-items-center py-2">
                            <FiEdit2 className="me-2 text-muted" /> Edit Details
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item className="d-flex align-items-center py-2 text-danger" onClick={() => handleDelete(customer.id)}>
                            <FiTrash2 className="me-2" /> Delete Customer
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      No customers found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center p-3 border-top">
            <div className="text-muted small">Showing {filteredCustomers.length} of {customers.length} entries</div>
            <div className="d-flex gap-1">
              <Button variant="outline-light" size="sm" className="text-dark border" disabled>Previous</Button>
              <Button variant="primary" size="sm">1</Button>
              <Button variant="outline-light" size="sm" className="text-dark border" disabled>Next</Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Customer Add/Edit Modal */}
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
                  <Form.Control name="first_name" type="text" defaultValue={currentCustomer?.first_name} placeholder="Enter first name" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Last Name</Form.Label>
                  <Form.Control name="last_name" type="text" defaultValue={currentCustomer?.last_name} placeholder="Enter last name" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Customer Type</Form.Label>
                  <Form.Select name="customer_type" defaultValue={currentCustomer?.customer_type || 'Individual'}>
                    <option value="Individual">Individual</option>
                    <option value="Company">Company</option>
                    <option value="VIP">VIP</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Company (Optional)</Form.Label>
                  <Form.Control name="company" type="text" defaultValue={currentCustomer?.company} placeholder="Enter company name" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Email</Form.Label>
                  <Form.Control name="email" type="email" defaultValue={currentCustomer?.email} placeholder="Enter email address" required />
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
                  <Form.Label className="fw-semibold small">Opening Balance</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control name="balance" type="number" step="0.01" defaultValue={currentCustomer?.balance || 0} placeholder="0.00" />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Notes & Remarks</Form.Label>
                  <Form.Control name="notes" as="textarea" rows={3} defaultValue={currentCustomer?.notes} placeholder="Add any internal notes about this customer..." />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Check
                  name="is_active"
                  type="switch"
                  id="customer-status"
                  label="Customer account is active"
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

      {/* Customer Profile Modal */}
      <Modal show={showProfileModal} onHide={handleClose} centered size="xl">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Customer Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {currentCustomer && (
            <Row className="g-4">
              <Col lg={4}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="text-center p-4">
                    <div
                      className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-bold mx-auto mb-3 ${getRandomColor(currentCustomer.id)}`}
                      style={{ width: '80px', height: '80px', fontSize: '28px' }}
                    >
                      {getInitials(currentCustomer.first_name, currentCustomer.last_name)}
                    </div>
                    <h4 className="fw-bold mb-1">{currentCustomer.first_name} {currentCustomer.last_name}</h4>
                    <p className="text-muted small mb-3">{currentCustomer.customer_id}</p>
                    <div className="d-flex justify-content-center gap-2 mb-4">
                      <Badge bg={getBadgeColor(currentCustomer.customer_type)} className="px-3 py-2 fw-normal">
                        {currentCustomer.customer_type || 'Individual'}
                      </Badge>
                      <Badge bg={currentCustomer.is_active ? 'success' : 'secondary'} className="px-3 py-2 fw-normal">
                        {currentCustomer.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <hr />
                    <div className="text-start">
                      <h6 className="fw-bold mb-3">Contact Information</h6>
                      <div className="d-flex align-items-center mb-2 small">
                        <FiMail className="text-muted me-3" /> {currentCustomer.email}
                      </div>
                      <div className="d-flex align-items-center mb-2 small">
                        <FiPhone className="text-muted me-3" /> {currentCustomer.phone || 'No phone provided'}
                      </div>
                      <div className="d-flex align-items-start mb-2 small">
                        <FiMapPin className="text-muted me-3 mt-1" /> {currentCustomer.address || 'No address provided'}
                      </div>
                      {currentCustomer.company && (
                        <div className="d-flex align-items-center mb-2 small">
                          <FiPlus className="text-muted me-3" /> {currentCustomer.company}
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={8}>
                <Row className="g-4 mb-4">
                  <Col md={6}>
                    <Card className="border-0 shadow-sm bg-primary text-white">
                      <Card.Body className="p-4">
                        <h6 className="opacity-75 mb-2">Outstanding Balance</h6>
                        <h2 className="fw-bold mb-0">${parseFloat(currentCustomer.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="border-0 shadow-sm">
                      <Card.Body className="p-4">
                        <h6 className="text-muted mb-2">Total Orders</h6>
                        <h2 className="fw-bold mb-0">{currentCustomer.orders?.length || 0}</h2>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-white border-0 p-4 pb-0">
                    <h6 className="fw-bold mb-0">Notes & Remarks</h6>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <p className="text-muted small mb-0">
                      {currentCustomer.notes || 'No notes available for this customer.'}
                    </p>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white border-0 p-4 pb-0 d-flex justify-content-between align-items-center">
                    <h6 className="fw-bold mb-0">Transaction History</h6>
                    <Button variant="link" size="sm" className="text-primary text-decoration-none p-0">View All</Button>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <Table hover responsive className="mb-0 align-middle small">
                      <thead className="bg-light">
                        <tr>
                          <th className="border-0 py-3 ps-4">Order ID</th>
                          <th className="border-0 py-3">Date</th>
                          <th className="border-0 py-3">Status</th>
                          <th className="border-0 py-3 text-end pe-4">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentCustomer.orders && currentCustomer.orders.length > 0 ? currentCustomer.orders.map(order => (
                          <tr key={order.id}>
                            <td className="ps-4 fw-bold">{order.order_id}</td>
                            <td>{new Date(order.created_at).toLocaleDateString()}</td>
                            <td>
                              <Badge bg="primary-light" className="text-primary fw-normal">{order.status}</Badge>
                            </td>
                            <td className="text-end pe-4 fw-bold">${parseFloat(order.total_amount).toFixed(2)}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="4" className="text-center py-4 text-muted">No transactions found.</td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={handleClose}>Close Profile</Button>
          <Button variant="primary" onClick={() => { setShowProfileModal(false); setShowModal(true); }}>Edit Profile</Button>
        </Modal.Footer>
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        .bg-success-light { background-color: rgba(16, 185, 129, 0.1); }
        .bg-secondary-light { background-color: rgba(100, 116, 139, 0.1); }
        .bg-primary-light { background-color: rgba(37, 99, 235, 0.1); }
        .no-caret::after { display: none; }
        .kpi-card { transition: transform 0.2s; }
        .kpi-card:hover { transform: translateY(-5px); }
      `}} />
    </div>
  );
};

export default Customers;