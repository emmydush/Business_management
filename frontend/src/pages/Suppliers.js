import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Dropdown, Alert } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEdit2, FiTrash2, FiPhone, FiMail, FiMapPin, FiBriefcase, FiDownload, FiTruck } from 'react-icons/fi';
import { purchasesAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';

const Suppliers = () => {
  const { formatCurrency } = useCurrency();
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    fetchSuppliers();
    fetchPendingOrdersCount();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await purchasesAPI.getSuppliers();
      setSuppliers(response.data.suppliers || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch suppliers. Please check your connection.');
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingOrdersCount = async () => {
    try {
      const response = await purchasesAPI.getPurchaseOrders();
      const pendingOrders = (response.data.purchase_orders || []).filter(o => o.status === 'Pending');
      setPendingOrdersCount(pendingOrders.length);
    } catch (err) {
      console.error('Error fetching pending orders:', err);
      setPendingOrdersCount(0);
    }
  };

  const handleEdit = (supplier) => {
    setCurrentSupplier(supplier);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="d-flex flex-column gap-2 p-1">
        <div className="d-flex align-items-center gap-2">
          <FiTrash2 className="text-danger" size={18} />
          <span className="fw-bold">Delete Supplier?</span>
        </div>
        <p className="mb-0 small text-white-50">This will remove the supplier and their contact info. Are you sure?</p>
        <div className="d-flex gap-2 justify-content-end mt-2">
          <Button size="sm" variant="outline-light" className="border-0" onClick={() => toast.dismiss(t.id)}>
            Cancel
          </Button>
          <Button size="sm" variant="danger" className="px-3 shadow-sm" onClick={async () => {
            try {
              await purchasesAPI.deleteSupplier(id);
              setSuppliers(suppliers.filter(sup => sup.id !== id));
              toast.dismiss(t.id);
              toast.success('Supplier removed successfully');
            } catch (err) {
              toast.dismiss(t.id);
              toast.error('Failed to delete supplier');
              console.error('Error deleting supplier:', err);
            }
          }}>
            Delete
          </Button>
        </div>
      </div>
    ), {
      duration: 6000,
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
    const supplierData = {
      company_name: formData.get('name'),
      contact_person: formData.get('contact'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      is_active: formData.get('supplier-status') === 'on'
    };

    setIsSaving(true);
    try {
      if (currentSupplier) {
        await purchasesAPI.updateSupplier(currentSupplier.id, supplierData);
        toast.success('Supplier updated successfully!');
      } else {
        await purchasesAPI.createSupplier(supplierData);
        toast.success('New supplier added successfully!');
      }
      fetchSuppliers();
      handleClose();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to save supplier. Please try again.';
      toast.error(errorMessage);
      console.error('Error saving supplier:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setCurrentSupplier(null);
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch =
      (supplier.company_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (supplier.contact_person?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (supplier.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'All' ||
      (filterStatus === 'Active' && supplier.is_active) ||
      (filterStatus === 'Inactive' && !supplier.is_active);

    return matchesSearch && matchesStatus;
  });

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'S';
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
    <div className="suppliers-wrapper">
      {/* Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Suppliers</h2>
          <p className="text-muted mb-0">Manage your product vendors and supply chain partners.</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Button variant="outline-secondary" className="d-flex align-items-center" onClick={() => toast.success('Exporting supplier list...')}>
            <FiDownload className="me-2" /> Export
          </Button>
          <Button variant="primary" className="d-flex align-items-center" onClick={() => {
            setCurrentSupplier(null);
            setShowModal(true);
          }}>
            <FiPlus className="me-2" /> Add Supplier
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100 kpi-card">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                  <FiBriefcase className="text-primary" size={20} />
                </div>
                <span className="text-muted fw-medium">Total Suppliers</span>
              </div>
              <h3 className="fw-bold mb-0">{suppliers.length}</h3>
              <small className="text-muted">Registered vendors</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100 kpi-card">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                  <FiTruck className="text-success" size={20} />
                </div>
                <span className="text-muted fw-medium">Active Suppliers</span>
              </div>
              <h3 className="fw-bold mb-0">{suppliers.filter(s => s.is_active).length}</h3>
              <small className="text-success fw-medium">Currently operational</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100 kpi-card">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                  <FiMoreVertical className="text-warning" size={20} />
                </div>
                <span className="text-muted fw-medium">Pending Orders</span>
              </div>
              <h3 className="fw-bold mb-0">{pendingOrdersCount}</h3>
              <small className="text-muted">Awaiting fulfillment</small>
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
                  placeholder="Search by company, contact or email..."
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
                  <th className="border-0 py-3 ps-4">Company</th>
                  <th className="border-0 py-3">Contact Person</th>
                  <th className="border-0 py-3">Contact Info</th>
                  <th className="border-0 py-3">Status</th>
                  <th className="border-0 py-3 text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.length > 0 ? filteredSuppliers.map(supplier => (
                  <tr key={supplier.id}>
                    <td className="ps-4">
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <div
                            className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center text-primary fw-bold"
                            style={{ width: '40px', height: '40px', fontSize: '14px' }}
                          >
                            {getInitials(supplier.company_name)}
                          </div>
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{supplier.company_name}</div>
                          <div className="small text-muted">ID: SUP-{supplier.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{supplier.contact_person}</td>
                    <td>
                      <div className="d-flex flex-column">
                        <span className="d-flex align-items-center text-muted small mb-1">
                          <FiMail className="me-2" size={14} /> {supplier.email}
                        </span>
                        <span className="d-flex align-items-center text-muted small">
                          <FiPhone className="me-2" size={14} /> {supplier.phone}
                        </span>
                      </div>
                    </td>
                    <td>
                      <Badge bg={supplier.is_active ? 'success-light' : 'secondary-light'} className={`px-2 py-1 fw-normal ${supplier.is_active ? 'text-success' : 'text-secondary'}`}>
                        {supplier.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="text-end pe-4">
                      <Dropdown align="end">
                        <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                          <FiMoreVertical size={20} />
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="border-0 shadow-sm">
                          <Dropdown.Item onClick={() => handleEdit(supplier)} className="d-flex align-items-center py-2">
                            <FiEdit2 className="me-2 text-muted" /> Edit Details
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item className="d-flex align-items-center py-2 text-danger" onClick={() => handleDelete(supplier.id)}>
                            <FiTrash2 className="me-2" /> Remove Supplier
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      No suppliers found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Supplier Add/Edit Modal */}
      <Modal show={showModal} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{currentSupplier ? 'Edit Supplier' : 'Add New Supplier'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form onSubmit={handleSave}>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Company Name</Form.Label>
                  <Form.Control name="name" type="text" defaultValue={currentSupplier?.company_name} placeholder="Enter company name" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Contact Person</Form.Label>
                  <Form.Control name="contact" type="text" defaultValue={currentSupplier?.contact_person} placeholder="Enter contact name" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Email Address</Form.Label>
                  <Form.Control name="email" type="email" defaultValue={currentSupplier?.email} placeholder="Enter email address" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Phone Number</Form.Label>
                  <Form.Control name="phone" type="tel" defaultValue={currentSupplier?.phone} placeholder="Enter phone number" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Address</Form.Label>
                  <Form.Control name="address" type="text" defaultValue={currentSupplier?.address} placeholder="Enter full address" />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Check
                  name="supplier-status"
                  type="switch"
                  id="supplier-status"
                  label="Supplier is active and operational"
                  defaultChecked={currentSupplier ? currentSupplier.is_active : true}
                />
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="light" onClick={handleClose} className="px-4">Cancel</Button>
              <Button variant="primary" type="submit" className="px-4" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Supplier'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        .bg-success-light { background-color: rgba(16, 185, 129, 0.1); }
        .bg-secondary-light { background-color: rgba(100, 116, 139, 0.1); }
        .no-caret::after { display: none; }
        .kpi-card { transition: transform 0.2s; }
        .kpi-card:hover { transform: translateY(-5px); }
      `}} />
    </div>
  );
};

export default Suppliers;