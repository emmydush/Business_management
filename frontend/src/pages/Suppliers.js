import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Dropdown, Alert } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEdit2, FiTrash2, FiPhone, FiMail, FiMapPin, FiBriefcase, FiDownload, FiTruck } from 'react-icons/fi';
import { purchasesAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import { useI18n } from '../i18n/I18nProvider';
import SubscriptionGuard from '../components/SubscriptionGuard';

const Suppliers = () => {
  const { t } = useI18n();
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
      if (err && err.response && err.response.status === 403) {
        setError(err.response.data?.message || err.response.data?.error || t('no_data_available'));
      } else {
        setError(t('no_data_available'));
      }
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
    toast((toastItem) => (
      <div className="d-flex flex-column gap-2 p-1">
        <div className="d-flex align-items-center gap-2">
          <FiTrash2 className="text-danger" size={18} />
          <span className="fw-bold">{t('remove_supplier')}?</span>
        </div>
        <p className="mb-0 small text-white-50">{t('delete_confirm_sub')} {t('delete_confirm_title')}</p>
        <div className="d-flex gap-2 justify-content-end mt-2">
          <Button size="sm" variant="outline-light" className="border-0" onClick={() => toast.dismiss(toastItem.id)}>
            {t('cancel')}
          </Button>
          <Button size="sm" variant="danger" className="px-3 shadow-sm" onClick={async () => {
            try {
              await purchasesAPI.deleteSupplier(id);
              setSuppliers(suppliers.filter(sup => sup.id !== id));
              toast.dismiss(toastItem.id);
              toast.success(t('supplier_deleted_success'));
            } catch (err) {
              toast.dismiss(toastItem.id);
              toast.error(t('supplier_delete_failed'));
              console.error('Error deleting supplier:', err);
            }
          }}>
            {t('remove_supplier')}
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
    const supplierData = {
      company_name: formData.get('name'),
      contact_person: formData.get('contact'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      is_active: formData.get('is_active') === 'on'
    };

    setIsSaving(true);
    try {
      if (currentSupplier) {
        await purchasesAPI.updateSupplier(currentSupplier.id, supplierData);
        toast.success(t('supplier_updated'));
      } else {
        await purchasesAPI.createSupplier(supplierData);
        toast.success(t('supplier_created'));
      }
      fetchSuppliers();
      handleClose();
    } catch (err) {
      console.error('Error saving supplier:', err);
      toast.error(t('supplier_save_failed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setCurrentSupplier(null);
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = (
      (supplier.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.contact_person || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesStatus = filterStatus === 'All' ||
      (filterStatus === 'Active' && supplier.is_active) ||
      (filterStatus === 'Inactive' && !supplier.is_active);

    return matchesSearch && matchesStatus;
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
    <div className="suppliers-wrapper">
      {/* Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">{t('sidebar_suppliers')}</h2>
          <p className="text-muted mb-0">{t('manage_suppliers')}</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Button variant="outline-secondary" className="d-flex align-items-center" onClick={() => toast.success(t('export_success'))}>
            <FiDownload className="me-2" /> {t('export')}
          </Button>
          <SubscriptionGuard message="Renew your subscription to add new suppliers">
            <Button variant="primary" className="d-flex align-items-center" onClick={() => {
              setCurrentSupplier(null);
              setShowModal(true);
            }}>
              <FiPlus className="me-2" /> {t('add_supplier')}
            </Button>
          </SubscriptionGuard>
        </div>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Stats Cards */}
      <Row className="g-3 g-md-4 mb-4">
        <Col xs={12} sm={6} md={4}>
          <Card className="border-0 shadow-sm h-100 card-responsive">
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex align-items-center mb-2 mb-md-3">
                <div className="bg-primary bg-opacity-10 p-2 rounded me-2 me-md-3">
                  <FiTruck className="text-primary" size={20} />
                </div>
                <span className="text-muted fw-medium small small-md">{t('total_suppliers_label')}</span>
              </div>
              <h3 className="fw-bold mb-0 h5 h4-md">{suppliers.length}</h3>
              <small className="text-success fw-medium d-none d-md-block">+2 {t('new_this_month')}</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card className="border-0 shadow-sm h-100 card-responsive">
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex align-items-center mb-2 mb-md-3">
                <div className="bg-success bg-opacity-10 p-2 rounded me-2 me-md-3">
                  <FiBriefcase className="text-success" size={20} />
                </div>
                <span className="text-muted fw-medium small small-md">{t('active_suppliers')}</span>
              </div>
              <h3 className="fw-bold mb-0 h5 h4-md">{suppliers.filter(s => s.is_active).length}</h3>
              <small className="text-muted d-none d-md-block">{t('active')}</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card className="border-0 shadow-sm h-100 card-responsive">
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex align-items-center mb-2 mb-md-3">
                <div className="bg-warning bg-opacity-10 p-2 rounded me-2 me-md-3">
                  <FiTruck className="text-warning" size={20} />
                </div>
                <span className="text-muted fw-medium small small-md">{t('pending_orders')}</span>
              </div>
              <h3 className="fw-bold mb-0 h5 h4-md">{pendingOrdersCount}</h3>
              <small className="text-warning fw-medium d-none d-md-block">{t('needs_attention')}</small>
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
                  placeholder={t('search_suppliers')}
                  className="bg-light border-start-0 ps-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" className="d-flex align-items-center">
                <FiFilter className="me-2" /> {t('filter')}
              </Button>
            </div>
          </div>

          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 py-3 ps-4">{t('company_name_label')}</th>
                  <th className="border-0 py-3">{t('contact_person')}</th>
                  <th className="border-0 py-3">{t('email')}</th>
                  <th className="border-0 py-3">{t('phone_number_label')}</th>
                  <th className="border-0 py-3">{t('status')}</th>
                  <th className="border-0 py-3 text-end pe-4">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map(supplier => (
                  <tr key={supplier.id}>
                    <td className="ps-4">
                      <div className="d-flex align-items-center">
                        <div className="bg-light rounded p-2 me-3">
                          <FiTruck className="text-muted" size={20} />
                        </div>
                        <div className="fw-bold text-dark">{supplier.company_name}</div>
                      </div>
                    </td>
                    <td>{supplier.contact_person}</td>
                    <td>
                      <div className="d-flex align-items-center text-muted small">
                        <FiMail className="me-2" /> {supplier.email}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center text-muted small">
                        <FiPhone className="me-2" /> {supplier.phone}
                      </div>
                    </td>
                    <td>
                      <Badge bg={supplier.is_active ? 'success' : 'secondary'} className="px-2 py-1 fw-normal">
                        {supplier.is_active ? t('active') : t('inactive')}
                      </Badge>
                    </td>
                    <td className="text-end pe-4">
                      <Dropdown align="end">
                        <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                          <FiMoreVertical size={20} />
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="border-0 shadow-sm">
                          <Dropdown.Item onClick={() => handleEdit(supplier)} className="d-flex align-items-center py-2">
                            <FiEdit2 className="me-2 text-muted" /> {t('edit_details')}
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item className="d-flex align-items-center py-2 text-danger" onClick={() => handleDelete(supplier.id)}>
                            <FiTrash2 className="me-2" /> {t('remove_supplier')}
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
          <Modal.Title className="fw-bold">{currentSupplier ? t('edit_details') : t('add_supplier')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form onSubmit={handleSave}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('company_name_label')}</Form.Label>
                  <Form.Control name="name" defaultValue={currentSupplier?.company_name} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('contact_person')}</Form.Label>
                  <Form.Control name="contact" defaultValue={currentSupplier?.contact_person} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('email')}</Form.Label>
                  <Form.Control name="email" type="email" defaultValue={currentSupplier?.email} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('phone_number_label')}</Form.Label>
                  <Form.Control name="phone" defaultValue={currentSupplier?.phone} required />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('address')}</Form.Label>
                  <Form.Control name="address" as="textarea" rows={2} defaultValue={currentSupplier?.address} />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Check
                  name="is_active"
                  type="switch"
                  id="supplier-status"
                  label={t('supplier_active_label')}
                  defaultChecked={currentSupplier ? currentSupplier.is_active : true}
                />
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="light" onClick={handleClose} className="px-4">{t('cancel')}</Button>
              <Button variant="primary" type="submit" className="px-4" disabled={isSaving}>
                {isSaving ? t('register_creating') : t('save_supplier')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Suppliers;
