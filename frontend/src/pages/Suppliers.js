import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Dropdown } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEdit2, FiTrash2, FiPhone, FiMail, FiMapPin, FiTruck, FiBox, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Mock data for suppliers
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSuppliers([
        { id: 1, name: 'ABC Supplier', contact: 'John Smith', email: 'john@abc.com', phone: '+1 (555) 123-4567', address: '123 Main St, New York, NY', status: 'active', products: 45, category: 'Electronics' },
        { id: 2, name: 'XYZ Distributor', contact: 'Jane Doe', email: 'jane@xyz.com', phone: '+1 (555) 987-6543', address: '456 Oak Ave, Los Angeles, CA', status: 'active', products: 78, category: 'Furniture' },
        { id: 3, name: 'Tech Solutions', contact: 'Bob Johnson', email: 'bob@tech.com', phone: '+1 (555) 456-7890', address: '789 Pine Rd, Chicago, IL', status: 'active', products: 23, category: 'Software' },
        { id: 4, name: 'Office Supplies Co', contact: 'Alice Brown', email: 'alice@office.com', phone: '+1 (555) 222-3333', address: '321 Elm St, Miami, FL', status: 'inactive', products: 56, category: 'Stationery' },
        { id: 5, name: 'Global Imports', contact: 'Charlie Wilson', email: 'charlie@global.com', phone: '+1 (555) 888-9999', address: '654 Maple Dr, Seattle, WA', status: 'active', products: 34, category: 'Raw Materials' }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const handleEdit = (supplier) => {
    setCurrentSupplier(supplier);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    toast((t) => (
      <span>
        Delete this supplier?
        <div className="mt-2 d-flex gap-2">
          <Button size="sm" variant="danger" onClick={() => {
            setSuppliers(suppliers.filter(sup => sup.id !== id));
            toast.dismiss(t.id);
            toast.success('Supplier removed');
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

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success(currentSupplier ? 'Supplier updated!' : 'Supplier added!');
    setIsSaving(false);
    handleClose();
  };

  const handleClose = () => {
    setShowModal(false);
    setCurrentSupplier(null);
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusVariant = (status) => {
    return status === 'active' ? 'success' : 'secondary';
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
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Suppliers</h2>
          <p className="text-muted mb-0">Manage vendors and supply chain partners.</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Button variant="outline-secondary" className="d-flex align-items-center" onClick={() => toast.success('Downloading supplier list...')}>
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
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                  <FiTruck className="text-primary" size={20} />
                </div>
                <span className="text-muted fw-medium">Total Suppliers</span>
              </div>
              <h3 className="fw-bold mb-0">{suppliers.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                  <FiTruck className="text-success" size={20} />
                </div>
                <span className="text-muted fw-medium">Active Vendors</span>
              </div>
              <h3 className="fw-bold mb-0">{suppliers.filter(s => s.status === 'active').length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                  <FiBox className="text-info" size={20} />
                </div>
                <span className="text-muted fw-medium">Total Products</span>
              </div>
              <h3 className="fw-bold mb-0">{suppliers.reduce((acc, curr) => acc + curr.products, 0)}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                  <FiTruck className="text-warning" size={20} />
                </div>
                <span className="text-muted fw-medium">Pending Orders</span>
              </div>
              <h3 className="fw-bold mb-0">12</h3>
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
                  placeholder="Search suppliers..."
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
                  <th className="border-0 py-3 ps-4">Supplier Name</th>
                  <th className="border-0 py-3">Contact Person</th>
                  <th className="border-0 py-3">Category</th>
                  <th className="border-0 py-3">Status</th>
                  <th className="border-0 py-3">Products</th>
                  <th className="border-0 py-3 text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map(supplier => (
                  <tr key={supplier.id}>
                    <td className="ps-4">
                      <div className="d-flex align-items-center">
                        <div className="bg-light rounded p-2 me-3 text-primary">
                          <FiTruck size={20} />
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{supplier.name}</div>
                          <div className="small text-muted d-flex align-items-center">
                            <FiMapPin className="me-1" size={12} /> {supplier.address.split(',')[1]}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="fw-medium">{supplier.contact}</div>
                      <div className="d-flex flex-column mt-1">
                        <span className="d-flex align-items-center text-muted small mb-1">
                          <FiMail className="me-2" size={12} /> {supplier.email}
                        </span>
                        <span className="d-flex align-items-center text-muted small">
                          <FiPhone className="me-2" size={12} /> {supplier.phone}
                        </span>
                      </div>
                    </td>
                    <td>
                      <Badge bg="light" text="dark" className="border fw-normal">
                        {supplier.category}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={getStatusVariant(supplier.status)} className="px-2 py-1 fw-normal text-capitalize">
                        {supplier.status}
                      </Badge>
                    </td>
                    <td className="fw-bold text-dark">
                      {supplier.products} items
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
                          <Dropdown.Item className="d-flex align-items-center py-2 text-danger" onClick={() => handleDelete(supplier.id)}>
                            <FiTrash2 className="me-2" /> Delete Supplier
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

      {/* Supplier Modal */}
      <Modal show={showModal} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{currentSupplier ? 'Edit Supplier' : 'Add New Supplier'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form onSubmit={handleSave}>
            <Row className="g-3">
              <Col md={12} className="text-center mb-3">
                <div className="d-inline-block position-relative">
                  <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                    <FiTruck size={40} className="text-secondary" />
                  </div>
                  <Button size="sm" variant="primary" className="position-absolute bottom-0 end-0 rounded-circle p-2 border-2 border-white">
                    <FiEdit2 size={12} />
                  </Button>
                </div>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Supplier Name</Form.Label>
                  <Form.Control type="text" defaultValue={currentSupplier?.name} placeholder="Enter company name" required />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Contact Person</Form.Label>
                  <Form.Control type="text" defaultValue={currentSupplier?.contact} placeholder="Enter contact name" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Category</Form.Label>
                  <Form.Select defaultValue={currentSupplier?.category}>
                    <option>Electronics</option>
                    <option>Furniture</option>
                    <option>Software</option>
                    <option>Stationery</option>
                    <option>Raw Materials</option>
                    <option>Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Email Address</Form.Label>
                  <Form.Control type="email" defaultValue={currentSupplier?.email} placeholder="name@company.com" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Phone Number</Form.Label>
                  <Form.Control type="tel" defaultValue={currentSupplier?.phone} placeholder="+1 (555) 000-0000" />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Address</Form.Label>
                  <Form.Control as="textarea" rows={2} defaultValue={currentSupplier?.address} placeholder="Street address, City, State, Zip" />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Check
                  type="switch"
                  id="supplier-status"
                  label="Active Vendor"
                  defaultChecked={currentSupplier?.status === 'active'}
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
    </div>
  );
};

export default Suppliers;