import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Alert } from 'react-bootstrap';
import { FiSearch, FiFilter, FiEdit2, FiTrash2, FiPhone, FiMail, FiMapPin, FiUser, FiActivity, FiDollarSign } from 'react-icons/fi';
import PermissionGuard from '../components/PermissionGuard';
import { customersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
// import SubscriptionGuard from '../components/SubscriptionGuard'; // DISABLED - No longer needed

const Customers = () => {
  const { formatCurrency } = useCurrency();
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

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
      if (err && err.response && err.response.status === 403) {
        setError(err.response.data?.message || err.response.data?.error || 'No data available');
      } else {
        setError('No data available');
      }
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

  const handleDelete = (id) => {
    toast((toastItem) => (
      <div className="d-flex flex-column gap-2 p-1">
        <div className="d-flex align-items-center gap-2">
          <FiTrash2 className="text-danger" size={18} />
          <span className="fw-bold">Delete customer?</span>
        </div>
        <p className="mb-0 small text-white-50">This action cannot be undone. Are you sure you want to delete this customer?</p>
        <div className="d-flex gap-2 justify-content-end mt-2">
          <Button size="sm" variant="outline-light" className="border-0" onClick={() => toast.dismiss(toastItem.id)}>
            Cancel
          </Button>
          <Button size="sm" variant="danger" className="px-3 shadow-sm" onClick={async () => {
            try {
              await customersAPI.deleteCustomer(id);
              setCustomers(customers.filter(customer => customer.id !== id));
              toast.dismiss(toastItem.id);
              toast.success('Customer deleted successfully');
            } catch (error) {
              toast.dismiss(toastItem.id);
              toast.error('Failed to delete customer');
              console.error('Error deleting customer:', error);
            }
          }}>
            Delete Customer
          </Button>
        </div>
      </div>
    ), {
      duration: 4000,
      style: {
        minWidth: '320px',
        background: '#1e293b',
        border: '1px solid rgba(255,255,255,0.1)'
      }
    });
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
      is_active: formData.get('is_active') ? formData.get('is_active') === 'on' : (currentCustomer ? currentCustomer.is_active : true)
    };

    setIsSaving(true);
    try {
      if (currentCustomer) {
        await customersAPI.updateCustomer(currentCustomer.id, customerData);
        toast.success('Customer updated');
      } else {
        await customersAPI.createCustomer(customerData);
        toast.success('Customer created');
      }
      fetchCustomers();
      handleClose();
    } catch (err) {
      console.error('Error saving customer:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to save customer';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error('Please select a CSV file');
      return;
    }
    setUploading(true);
    setUploadResult(null);
    const fd = new FormData();
    fd.append('file', uploadFile);
    try {
      const res = await customersAPI.bulkUploadCustomers(fd);
      setUploadResult(res.data);
      toast.success(`Created ${res.data.created_count} customers`);
      fetchCustomers();
    } catch (err) {
      console.error('Bulk upload error (customers):', err);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setShowProfileModal(false);
    setCurrentCustomer(null);
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = (
      (customer.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.company || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesType = filterType === 'All' || customer.customer_type === filterType;

    return matchesSearch && matchesType;
  });

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
    <div className="customers-wrapper">
      <style dangerouslySetInnerHTML={{__html: `
        .customers-wrapper {
          padding-bottom: 2rem;
          background: #f8fafc;
        }
        
        /* Stats Cards */
        .stat-card {
          border: none;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        /* Table Styling */
        .customer-table-card {
          border: none;
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .customer-table thead th {
          background: #f8fafc;
          text-transform: uppercase;
          font-size: 0.7rem;
          letter-spacing: 0.05em;
          font-weight: 700;
          color: #64748b;
          border-bottom: 1px solid #e2e8f0;
          padding: 1rem;
        }
        .customer-table tbody td {
          padding: 1rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .customer-avatar {
          width: 36px;
          height: 36px;
          background: #e2e8f0;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          border-radius: 8px;
          font-size: 0.8rem;
        }
        
        /* Clean Modal */
        .clean-modal .modal-content {
          border: none;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .clean-modal .modal-header {
          border-bottom: 1px solid #f1f5f9;
          padding: 1.5rem 2rem;
        }
        .clean-modal .modal-footer {
          border-top: 1px solid #f1f5f9;
          padding: 1.25rem 2rem;
          background: #f8fafc;
        }
        
        .clean-form-label {
          font-weight: 600;
          color: #475569;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }
        
        .clean-input {
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          padding: 0.6rem 0.8rem;
          font-size: 0.95rem;
        }
        .clean-input:focus {
          border-color: #0f172a;
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.05);
        }
        
        .btn-slate-dark {
          background: #0f172a;
          color: white;
          border: none;
          padding: 0.6rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .btn-slate-dark:hover {
          background: #1e293b;
          transform: translateY(-1px);
        }
      `}} />
      {/* Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5">
        <div>
          <h2 className="fw-bold text-dark mb-1">Customers</h2>
          <p className="text-muted mb-0 small">Database of your business partners and individual clients.</p>
        </div>
        <div className="d-flex flex-row flex-wrap align-items-center gap-2 mt-4 mt-md-0">
          <PermissionGuard module="customers" action="export">
            <Button variant="outline-secondary" size="sm" className="px-3" onClick={() => toast.success('Export feature coming soon!')}>
              Export
            </Button>
          </PermissionGuard>
          <PermissionGuard module="customers" action="create">
            <Button
              variant="outline-secondary"
              size="sm"
              className="px-3"
              onClick={() => setShowUploadModal(true)}
            >
              Import CSV
            </Button>
          </PermissionGuard>
          <PermissionGuard module="customers" action="create">
            <Button
              className="btn-slate-dark px-4"
              onClick={() => {
                setCurrentCustomer(null);
                setShowModal(true);
              }}
            >
              Add Customer
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Stats Cards */}
      <Row className="g-4 mb-5">
        <Col xs={12} md={4}>
          <Card className="stat-card shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center">
                <div className="icon-box bg-primary bg-opacity-10 me-3">
                  <FiUser className="text-primary" size={24} />
                </div>
                <div>
                  <p className="text-muted small fw-bold text-uppercase mb-1 ls-wide">Total Customers</p>
                  <h3 className="fw-bold mb-0 text-dark">{customers.length}</h3>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="stat-card shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center">
                <div className="icon-box bg-success bg-opacity-10 me-3">
                  <FiActivity className="text-success" size={24} />
                </div>
                <div>
                  <p className="text-muted small fw-bold text-uppercase mb-1 ls-wide">Active Members</p>
                  <h3 className="fw-bold mb-0 text-dark">{customers.filter(c => c.is_active).length}</h3>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="stat-card shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center">
                <div className="icon-box bg-indigo bg-opacity-10 me-3">
                  <FiDollarSign className="text-indigo" size={24} />
                </div>
                <div>
                  <p className="text-muted small fw-bold text-uppercase mb-1 ls-wide">Outstanding Balance</p>
                  <h3 className="fw-bold mb-0 text-dark">{formatCurrency(customers.reduce((sum, c) => sum + (c.balance || 0), 0))}</h3>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content Card */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
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
              <Form.Select
                className="w-auto"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All">Customer Type: All</option>
                <option value="Individual">Individual</option>
                <option value="Business">Business</option>
              </Form.Select>
              <Button variant="outline-secondary" className="d-flex align-items-center">
                <FiFilter className="me-2" /> Filter
              </Button>
            </div>
          </div>

          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 py-3 ps-4">Customer Name</th>
                  <th className="border-0 py-3">Contact Person</th>
                  <th className="border-0 py-3">Customer Type</th>
                  <th className="border-0 py-3">Balance</th>
                  <th className="border-0 py-3">Status</th>
                  <th className="border-0 py-3 text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => (
                  <tr key={customer.id}>
                    <td className="ps-4">
                      <div className="d-flex align-items-center">
                        <div className="bg-light rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                          <span className="fw-bold text-primary">{customer.first_name?.[0]}{customer.last_name?.[0]}</span>
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{customer.first_name} {customer.last_name}</div>
                          <div className="small text-muted">{customer.company}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column">
                        <div className="d-flex align-items-center text-muted small mb-1">
                          <FiMail className="me-2" /> {customer.email}
                        </div>
                        <div className="d-flex align-items-center text-muted small">
                          <FiPhone className="me-2" /> {customer.phone}
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge bg="light" text="dark" className="border fw-normal">
                        {customer.customer_type}
                      </Badge>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{formatCurrency(customer.balance || 0)}</div>
                    </td>
                    <td>
                      <Badge bg={customer.is_active ? 'success' : 'secondary'} className="px-2 py-1 fw-normal">
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-flex gap-2 justify-content-end">
                        <Button variant="outline-primary" size="sm" className="d-flex align-items-center" onClick={() => handleViewProfile(customer)} title="View">
                          <FiUser size={16} />
                        </Button>
                        <PermissionGuard module="customers" action="edit">
                          <Button variant="outline-warning" size="sm" className="d-flex align-items-center" onClick={() => handleEdit(customer)} title="Edit Customer">
                            <FiEdit2 size={16} />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard module="customers" action="delete">
                          <Button variant="outline-danger" size="sm" className="d-flex align-items-center" onClick={() => handleDelete(customer.id)} title="Delete Customer">
                            <FiTrash2 size={16} />
                          </Button>
                        </PermissionGuard>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Customer Modal - Simplified & Clean Design */}
      <Modal show={showModal} onHide={handleClose} centered size="lg" className="clean-modal">
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold h5 mb-0">
              {currentCustomer ? 'Edit Customer' : 'Add New Customer'}
            </Modal.Title>
          </Modal.Header>
          
          <Modal.Body className="px-4 py-4">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="clean-form-label">First Name</Form.Label>
                  <Form.Control 
                    name="first_name" 
                    className="clean-input"
                    placeholder="Enter first name" 
                    defaultValue={currentCustomer?.first_name} 
                    required 
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="clean-form-label">Last Name</Form.Label>
                  <Form.Control 
                    name="last_name" 
                    className="clean-input"
                    placeholder="Enter last name" 
                    defaultValue={currentCustomer?.last_name} 
                    required 
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="clean-form-label">Email Address</Form.Label>
                  <Form.Control 
                    name="email" 
                    type="email" 
                    className="clean-input"
                    placeholder="email@example.com" 
                    defaultValue={currentCustomer?.email} 
                    required 
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="clean-form-label">Phone Number</Form.Label>
                  <Form.Control 
                    name="phone" 
                    className="clean-input"
                    placeholder="e.g. +27 12 345 6789" 
                    defaultValue={currentCustomer?.phone} 
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="clean-form-label">Company (Optional)</Form.Label>
                  <Form.Control 
                    name="company" 
                    className="clean-input"
                    placeholder="Business name" 
                    defaultValue={currentCustomer?.company} 
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="clean-form-label">Customer Category</Form.Label>
                  <Form.Select 
                    name="customer_type" 
                    className="clean-input"
                    defaultValue={currentCustomer?.customer_type || 'Individual'}
                  >
                    <option value="Individual">Individual</option>
                    <option value="Business">Business</option>
                    <option value="Wholesale">Wholesale</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="clean-form-label">Address</Form.Label>
                  <Form.Control 
                    name="address" 
                    as="textarea" 
                    rows={2} 
                    className="clean-input"
                    placeholder="Physical or billing address" 
                    defaultValue={currentCustomer?.address} 
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <div className="d-flex align-items-center justify-content-between p-3 rounded bg-light border">
                  <div>
                    <h6 className="fw-bold mb-0 small">Active Account</h6>
                    <p className="text-muted extra-small mb-0">Allow customer to be selected in POS/Sales.</p>
                  </div>
                  <Form.Check
                    name="is_active"
                    type="switch"
                    id="customer-status-toggle"
                    defaultChecked={currentCustomer ? currentCustomer.is_active : true}
                  />
                </div>
              </Col>
            </Row>
          </Modal.Body>
          
          <Modal.Footer>
            <Button variant="link" onClick={handleClose} className="text-decoration-none text-muted small fw-bold">
              Cancel
            </Button>
            <Button type="submit" className="btn-slate-dark" disabled={isSaving}>
              {isSaving ? 'Saving...' : currentCustomer ? 'Update Customer' : 'Save Customer'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Profile Modal */}
      <Modal show={showProfileModal} onHide={handleClose} centered className="colored-modal">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Customer Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          {currentCustomer && (
            <div className="text-center">
              <div className="bg-light rounded-circle p-4 d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                <span className="h3 fw-bold text-primary mb-0">{currentCustomer.first_name?.[0]}{currentCustomer.last_name?.[0]}</span>
              </div>
              <h4 className="fw-bold mb-1">{currentCustomer.first_name} {currentCustomer.last_name}</h4>
              <p className="text-muted mb-4">{currentCustomer.company}</p>

              <div className="text-start bg-light rounded p-3 mb-3">
                <div className="d-flex align-items-center mb-2">
                  <FiMail className="text-muted me-3" />
                  <span>{currentCustomer.email || 'N/A'}</span>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <FiPhone className="text-muted me-3" />
                  <span>{currentCustomer.phone || 'N/A'}</span>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <FiMapPin className="text-muted me-3" />
                  <span>{currentCustomer.address || 'N/A'}</span>
                </div>
                <div className="d-flex align-items-center">
                  <Badge bg={currentCustomer.is_active ? 'success' : 'secondary'}>
                    {currentCustomer.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="mx-2">•</span>
                  <span className="text-muted">{currentCustomer.customer_type}</span>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center p-3 border rounded">
                <span className="text-muted">Balance</span>
                <span className="h5 fw-bold text-dark mb-0">{formatCurrency(currentCustomer.balance || 0)}</span>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={handleClose} className="w-100">Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered className="white-modal">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Bulk Upload Customers</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form onSubmit={handleUploadSubmit}>
            <Form.Group>
              <Form.Label className="fw-semibold small">CSV File</Form.Label>
              <Form.Control type="file" accept=".csv" onChange={handleFileChange} />
              <Form.Text className="text-muted">
                Manage your customer database and relationships
                <div className="mt-2">
                  <a href="/customer_bulk_sample.csv" target="_blank" rel="noreferrer">
                    Download sample CSV
                  </a>
                </div>
              </Form.Text>
            </Form.Group>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button variant="light" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button variant="dark" type="submit" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </Form>

          {uploadResult && (
            <div className="mt-3">
              <Alert variant="success">
                Created {uploadResult.created_count} records
              </Alert>
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div>
                  <h6>Errors:</h6>
                  <ul>
                    {uploadResult.errors.map((err, idx) => (
                      <li key={idx}>
                        Row {err.row}: {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Customers;

