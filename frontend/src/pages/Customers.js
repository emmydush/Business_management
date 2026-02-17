import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Dropdown, Alert } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEdit2, FiTrash2, FiPhone, FiMail, FiMapPin, FiUser, FiDownload } from 'react-icons/fi';
import { customersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import { useI18n } from '../i18n/I18nProvider';
import SubscriptionGuard from '../components/SubscriptionGuard';

const Customers = () => {
  const { t } = useI18n();
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
  const [filterStatus, setFilterStatus] = useState('All');
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
        setError(err.response.data?.message || err.response.data?.error || t('no_data_available'));
      } else {
        setError(t('no_data_available'));
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
          <span className="fw-bold">{t('delete_customer')}?</span>
        </div>
        <p className="mb-0 small text-white-50">{t('delete_confirm_sub')} {t('delete_confirm_title')}</p>
        <div className="d-flex gap-2 justify-content-end mt-2">
          <Button size="sm" variant="outline-light" className="border-0" onClick={() => toast.dismiss(toastItem.id)}>
            {t('cancel')}
          </Button>
          <Button size="sm" variant="danger" className="px-3 shadow-sm" onClick={async () => {
            try {
              await customersAPI.deleteCustomer(id);
              setCustomers(customers.filter(customer => customer.id !== id));
              toast.dismiss(toastItem.id);
              toast.success(t('customer_deleted_success'));
            } catch (error) {
              toast.dismiss(toastItem.id);
              toast.error(t('customer_delete_failed'));
              console.error('Error deleting customer:', error);
            }
          }}>
            {t('delete_customer')}
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
      is_active: formData.get('is_active') === 'on'
    };

    setIsSaving(true);
    try {
      if (currentCustomer) {
        await customersAPI.updateCustomer(currentCustomer.id, customerData);
        toast.success(t('customer_updated'));
      } else {
        await customersAPI.createCustomer(customerData);
        toast.success(t('customer_created'));
      }
      fetchCustomers();
      handleClose();
    } catch (err) {
      console.error('Error saving customer:', err);
      toast.error(t('customer_save_failed'));
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
      toast.error(t('csv_file'));
      return;
    }
    setUploading(true);
    setUploadResult(null);
    const fd = new FormData();
    fd.append('file', uploadFile);
    try {
      const res = await customersAPI.bulkUploadCustomers(fd);
      setUploadResult(res.data);
      toast.success(t('created_count').replace('{count}', res.data.created_count));
      fetchCustomers();
    } catch (err) {
      console.error('Bulk upload error (customers):', err);
      toast.error(t('register_failed'));
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
    const matchesStatus = filterStatus === 'All' ||
      (filterStatus === 'Active' && customer.is_active) ||
      (filterStatus === 'Inactive' && !customer.is_active);

    return matchesSearch && matchesType && matchesStatus;
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
      {/* Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">{t('sidebar_customers')}</h2>
          <p className="text-muted mb-0">{t('manage_customers')}</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Button variant="outline-secondary" className="d-flex align-items-center" onClick={() => toast.success(t('export_success'))}>
            <FiDownload className="me-2" /> {t('export')}
          </Button>
          <SubscriptionGuard message="Renew your subscription to upload customers">
            <Button
              variant="outline-secondary"
              className="d-flex align-items-center"
              onClick={() => setShowUploadModal(true)}
            >
              <FiDownload className="me-2" /> {t('bulk_upload')}
            </Button>
          </SubscriptionGuard>
          <SubscriptionGuard message="Renew your subscription to add new customers">
            <Button variant="primary" className="d-flex align-items-center" onClick={() => {
              setCurrentCustomer(null);
              setShowModal(true);
            }}>
              <FiPlus className="me-2" /> {t('add_customer')}
            </Button>
          </SubscriptionGuard>
        </div>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                  <FiUser className="text-primary" size={20} />
                </div>
                <span className="text-muted fw-medium">{t('total_customers_label')}</span>
              </div>
              <h3 className="fw-bold mb-0">{customers.length}</h3>
              <small className="text-success fw-medium">+12% {t('new_this_month')}</small>
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
                <span className="text-muted fw-medium">{t('active_customers')}</span>
              </div>
              <h3 className="fw-bold mb-0">{customers.filter(c => c.is_active).length}</h3>
              <small className="text-muted">{t('active')}</small>
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
                  placeholder={t('search_customers')}
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
                <option value="All">{t('customer_type')}: All</option>
                <option value="Individual">{t('individual')}</option>
                <option value="Business">{t('business')}</option>
              </Form.Select>
              <Button variant="outline-secondary" className="d-flex align-items-center">
                <FiFilter className="me-2" /> {t('filter')}
              </Button>
            </div>
          </div>

          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 py-3 ps-4">{t('customer_name')}</th>
                  <th className="border-0 py-3">{t('contact_person')}</th>
                  <th className="border-0 py-3">{t('customer_type')}</th>
                  <th className="border-0 py-3">{t('balance')}</th>
                  <th className="border-0 py-3">{t('status')}</th>
                  <th className="border-0 py-3 text-end pe-4">{t('actions')}</th>
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
                        {customer.is_active ? t('active') : t('inactive')}
                      </Badge>
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-flex gap-2 justify-content-end">
                        <Button variant="outline-primary" size="sm" className="d-flex align-items-center" onClick={() => handleViewProfile(customer)} title={t('view')}>
                          <FiUser size={16} />
                        </Button>
                        <Button variant="outline-warning" size="sm" className="d-flex align-items-center" onClick={() => handleEdit(customer)} title={t('edit_customer')}>
                          <FiEdit2 size={16} />
                        </Button>
                        <Button variant="outline-danger" size="sm" className="d-flex align-items-center" onClick={() => handleDelete(customer.id)} title={t('delete_customer')}>
                          <FiTrash2 size={16} />
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

      {/* Customer Modal */}
      <Modal show={showModal} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{currentCustomer ? t('edit_customer') : t('add_customer')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form onSubmit={handleSave}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('first_name_label')}</Form.Label>
                  <Form.Control name="first_name" defaultValue={currentCustomer?.first_name} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('last_name_label')}</Form.Label>
                  <Form.Control name="last_name" defaultValue={currentCustomer?.last_name} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('company_label')}</Form.Label>
                  <Form.Control name="company" defaultValue={currentCustomer?.company} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('email')}</Form.Label>
                  <Form.Control name="email" type="email" defaultValue={currentCustomer?.email} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('phone')}</Form.Label>
                  <Form.Control name="phone" defaultValue={currentCustomer?.phone} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('customer_type')}</Form.Label>
                  <Form.Select name="customer_type" defaultValue={currentCustomer?.customer_type || 'Individual'}>
                    <option value="Individual">{t('individual')}</option>
                    <option value="Business">{t('business')}</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('address')}</Form.Label>
                  <Form.Control name="address" as="textarea" rows={2} defaultValue={currentCustomer?.address} />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('notes')}</Form.Label>
                  <Form.Control name="notes" as="textarea" rows={3} defaultValue={currentCustomer?.notes} />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Check
                  name="is_active"
                  type="switch"
                  id="customer-status"
                  label={t('customer_active_label')}
                  defaultChecked={currentCustomer ? currentCustomer.is_active : true}
                />
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="light" onClick={handleClose} className="px-4">{t('cancel')}</Button>
              <Button variant="primary" type="submit" className="px-4" disabled={isSaving}>
                {isSaving ? t('register_creating') : t('save_customer')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Profile Modal */}
      <Modal show={showProfileModal} onHide={handleClose} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{t('customer_profile')}</Modal.Title>
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
                    {currentCustomer.is_active ? t('active') : t('inactive')}
                  </Badge>
                  <span className="mx-2">•</span>
                  <span className="text-muted">{currentCustomer.customer_type}</span>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center p-3 border rounded">
                <span className="text-muted">{t('balance')}</span>
                <span className="h5 fw-bold text-dark mb-0">{formatCurrency(currentCustomer.balance || 0)}</span>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={handleClose} className="w-100">{t('close')}</Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{t('bulk_upload_title') || 'Bulk Upload Customers'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form onSubmit={handleUploadSubmit}>
            <Form.Group>
              <Form.Label className="fw-semibold small">{t('csv_file') || 'CSV File'}</Form.Label>
              <Form.Control type="file" accept=".csv" onChange={handleFileChange} />
              <Form.Text className="text-muted">
                {t('manage_customers')}
                <div className="mt-2">
                  <a href="/customer_bulk_sample.csv" target="_blank" rel="noreferrer">
                    {t('download_sample') || 'Download sample CSV'}
                  </a>
                </div>
              </Form.Text>
            </Form.Group>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button variant="light" onClick={() => setShowUploadModal(false)}>
                {t('cancel')}
              </Button>
              <Button variant="primary" type="submit" disabled={uploading}>
                {uploading ? t('uploading') || 'Uploading...' : t('upload') || 'Upload'}
              </Button>
            </div>
          </Form>

          {uploadResult && (
            <div className="mt-3">
              <Alert variant="success">
                {(t('created_count') || 'Created {count} records').replace('{count}', uploadResult.created_count)}
              </Alert>
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div>
                  <h6>{t('errors') || 'Errors'}:</h6>
                  <ul>
                    {uploadResult.errors.map((err, idx) => (
                      <li key={idx}>
                        {(t('row') || 'Row')} {err.row}: {err.error}
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
