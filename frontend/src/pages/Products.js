import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Dropdown, Alert } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEdit2, FiTrash2, FiBox, FiDownload, FiAlertTriangle, FiCheckCircle, FiUpload, FiCamera, FiGrid, FiList, FiEye, FiPackage, FiTrendingUp } from 'react-icons/fi';
import { inventoryAPI, getImageUrl } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import { useI18n } from '../i18n/I18nProvider';
import SubscriptionGuard from '../components/SubscriptionGuard';

const Products = () => {
  const { t } = useI18n();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  const { formatCurrency } = useCurrency();

  useEffect(() => {
    if (showModal && currentProduct) {
      // Use getImageUrl to properly format the image path for display
      setProductImagePreview(currentProduct.image ? getImageUrl(currentProduct.image) : null);
      setProductImageFile(null);
      setScannedBarcode(currentProduct.barcode || '');
    }
    if (!showModal) {
      setProductImagePreview(null);
      setProductImageFile(null);
      setScannedBarcode('');
    }
  }, [showModal, currentProduct]);

  // Fetch products and categories from API
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        inventoryAPI.getProducts({ per_page: 1000 }),
        inventoryAPI.getCategories()
      ]);
      setProducts(productsRes.data.products || []);
      setCategories(categoriesRes.data.categories || []);
      setError(null);
    } catch (err) {
      // Provide more specific error messages for auth/network/server errors
      if (err && err.response && err.response.status === 401) {
        setError(t('login_invalid'));
      } else if (err && err.response && err.response.status === 403) {
        setError(err.response.data?.message || err.response.data?.error || t('no_data_available'));
      } else if (err && err.response && err.response.status >= 500) {
        setError(t('no_data_available'));
      } else if (err && err.message) {
        setError(`${t('no_data_available')}: ${err.message}`);
      } else {
        setError(t('no_data_available'));
      }
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await inventoryAPI.exportProducts();
      toast.success(response.data.message || t('export'));
      console.log('Export response:', response.data);
    } catch (err) {
      toast.error(t('no_data_available'));
      console.error('Error exporting products:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Validate required fields
    const categoryId = formData.get('category_id');
    const name = formData.get('name');
    const unitPrice = formData.get('unit_price');
    
    if (!categoryId) {
      toast.error('Please select a category');
      return;
    }
    if (!name) {
      toast.error('Product name is required');
      return;
    }
    if (!unitPrice) {
      toast.error('Selling price is required');
      return;
    }
    
    const productData = {
      product_id: formData.get('product_id'),
      name: name,
      category_id: categoryId,
      unit_price: unitPrice,
      cost_price: formData.get('cost_price') || null,
      stock_quantity: formData.get('stock_quantity') || 0,
      reorder_level: formData.get('reorder_level') || 0,
      description: formData.get('description'),
      barcode: formData.get('barcode'),
      expiry_date: formData.get('expiry_date'),
      is_active: formData.get('is_active') === 'on'
    };

    // Clear previous upload results when saving single products
    setUploadResult(null);

    setIsSaving(true);
    try {
      // If user selected an image, send as multipart FormData
      if (productImageFile) {
        const fd = new FormData();
        Object.keys(productData).forEach(k => fd.append(k, productData[k]));
        fd.append('image', productImageFile);
        if (currentProduct) {
          await inventoryAPI.updateProduct(currentProduct.id, fd);
          toast.success(t('product_updated'));
        } else {
          await inventoryAPI.createProduct(fd);
          toast.success(t('product_created'));
        }
      } else {
        if (currentProduct) {
          await inventoryAPI.updateProduct(currentProduct.id, productData);
          toast.success(t('product_updated'));
        } else {
          await inventoryAPI.createProduct(productData);
          toast.success(t('product_created'));
        }
      }
      fetchData();
      handleClose();
    } catch (err) {
      console.error('Error saving product:', err);

      // Extract specific error message from server
      let errorMessage = t('product_save_failed');

      if (err && err.response) {
        const responseData = err.response.data;
        
        // Handle subscription required errors first
        if (responseData && responseData.requires_subscription) {
          errorMessage = responseData.message || 'Please subscribe to access this feature';
        } else if (responseData && responseData.error) {
          errorMessage = responseData.error;
        } else if (err.response.status === 401) {
          errorMessage = t('login_invalid');
        } else if (err.response.status === 403) {
          errorMessage = responseData?.message || 'You do not have permission to perform this action';
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
      setProductImageFile(null);
      setProductImagePreview(null);
    }
  };

  const handleDelete = (id) => {
    toast((toastItem) => (
      <div className="d-flex flex-column gap-2 p-1">
        <div className="d-flex align-items-center gap-2">
          <FiTrash2 className="text-danger" size={18} />
          <span className="fw-bold">{t('delete_product')}?</span>
        </div>
        <p className="mb-0 small text-white-50">{t('delete_confirm_sub')} {t('delete_confirm_title')}</p>
        <div className="d-flex gap-2 justify-content-end mt-2">
          <Button size="sm" variant="outline-light" className="border-0" onClick={() => toast.dismiss(toastItem.id)}>
            {t('cancel')}
          </Button>
          <Button size="sm" variant="danger" className="px-3 shadow-sm" onClick={async () => {
            try {
              await inventoryAPI.deleteProduct(id);
              setProducts(products.filter(p => p.id !== id));
              toast.dismiss(toastItem.id);
              toast.success(t('product_deleted_success'));
            } catch (error) {
              toast.dismiss(toastItem.id);
              toast.error(t('product_delete_failed'));
              console.error('Error deleting product:', error);
            }
          }}>
            {t('delete_product')}
          </Button>
        </div>
      </div>
    ), {
      duration: 4000,
      style: {
        minWidth: '300px',
        background: '#1e293b',
        border: '1px solid rgba(255,255,255,0.1)'
      }
    });
  };

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setProductImageFile(file || null);
    if (file) setProductImagePreview(URL.createObjectURL(file));
    else setProductImagePreview(null);
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
      const res = await inventoryAPI.bulkUploadProducts(fd);
      setUploadResult(res.data);
      toast.success(t('created_count').replace('{count}', res.data.created_count));
      fetchData();
    } catch (err) {
      console.error('Bulk upload error:', err);
      toast.error(t('register_failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleBarcodeDetected = (barcode) => {
    setScannedBarcode(barcode);
    setShowBarcodeScanner(false);
    toast.success(t('scan'));
  };

  const handleClose = () => {
    setShowModal(false);
    setCurrentProduct(null);
    setProductImageFile(null);
    setProductImagePreview(null);
  };

  const handleEdit = (product) => {
    setCurrentProduct(product);
    setShowModal(true);
  };

  const filteredProducts = products.filter(product =>
    (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.product_id || '').toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="products-wrapper">
      {/* Modern Header Section */}
      <div className="modern-header mb-4">
        <div className="header-content">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
            <div className="header-title">
              <h2 className="fw-bold mb-1">{t('sidebar_products')}</h2>
              <p className="text-muted mb-0 opacity-75">{t('manage_inventory')}</p>
            </div>
            <div className="d-flex gap-2 mt-3 mt-md-0">
              <Button variant="outline-secondary" className="d-flex align-items-center btn-modern" onClick={handleExport}>
                <FiDownload className="me-2" /> {t('export')}
              </Button>
              <SubscriptionGuard message="Renew your subscription to upload products">
                <Button variant="outline-secondary" className="d-flex align-items-center btn-modern" onClick={() => setShowUploadModal(true)}>
                  <FiUpload className="me-2" /> {t('bulk_upload')}
                </Button>
              </SubscriptionGuard>
              <SubscriptionGuard message="Renew your subscription to add new products">
                <Button variant="primary" className="d-flex align-items-center btn-primary-modern" onClick={() => {
                  setCurrentProduct(null);
                  setShowModal(true);
                }}>
                  <FiPlus className="me-2" /> {t('add_product')}
                </Button>
              </SubscriptionGuard>
            </div>
          </div>
        </div>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Enhanced Stats Cards */}
      <Row className="g-3 g-md-4 mb-4">
        <Col xs={12} sm={6} md={3}>
          <Card className="stat-card border-0 shadow-sm h-100">
            <Card.Body className="p-3 p-md-4">
              <div className="stat-icon bg-primary-light">
                <FiBox className="text-primary" size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">{t('total_products')}</span>
                <h3 className="stat-value">{products.length}</h3>
                <span className="stat-meta">{t('active')}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className="stat-card border-0 shadow-sm h-100">
            <Card.Body className="p-3 p-md-4">
              <div className="stat-icon bg-warning-light">
                <FiAlertTriangle className="text-warning" size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">{t('low_stock_label')}</span>
                <h3 className="stat-value">{products.filter(p => p.stock_quantity <= p.reorder_level && p.stock_quantity > 0).length}</h3>
                <span className="stat-meta text-warning">{t('reorder_level')}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className="stat-card border-0 shadow-sm h-100">
            <Card.Body className="p-3 p-md-4">
              <div className="stat-icon bg-danger-light">
                <FiAlertTriangle className="text-danger" size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">{t('out_of_stock')}</span>
                <h3 className="stat-value">{products.filter(p => p.stock_quantity <= 0).length}</h3>
                <span className="stat-meta text-danger">{t('actions')}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className="stat-card border-0 shadow-sm h-100">
            <Card.Body className="p-3 p-md-4">
              <div className="stat-icon bg-success-light">
                <FiTrendingUp className="text-success" size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">{t('inventory_value')}</span>
                <h3 className="stat-value">{formatCurrency(products.reduce((acc, curr) => acc + (curr.unit_price * curr.stock_quantity), 0))}</h3>
                <span className="stat-meta">{t('total')}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content Card */}
      <Card className="border-0 shadow-sm modern-card">
        <Card.Body className="p-0">
          <div className="card-header-modern p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="search-wrapper">
              <InputGroup className="search-input-group">
                <InputGroup.Text className="bg-light border-end-0">
                  <FiSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder={t('search_products')}
                  className="bg-light border-start-0 ps-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <div className="view-toggle btn-group">
                <Button 
                  variant={viewMode === 'table' ? 'primary' : 'outline-secondary'} 
                  size="sm"
                  className="d-flex align-items-center"
                  onClick={() => setViewMode('table')}
                >
                  <FiList size={16} />
                </Button>
                <Button 
                  variant={viewMode === 'grid' ? 'primary' : 'outline-secondary'} 
                  size="sm"
                  className="d-flex align-items-center"
                  onClick={() => setViewMode('grid')}
                >
                  <FiGrid size={16} />
                </Button>
              </div>
              <Button variant="outline-secondary" className="d-flex align-items-center btn-filter">
                <FiFilter className="me-2" /> {t('filter')}
              </Button>
            </div>
          </div>

          <div className="table-responsive">
            {filteredProducts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <FiPackage size={64} />
                </div>
                <h4>{t('no_products_found')}</h4>
                <p className="text-muted">{t('start_adding_products')}</p>
                <SubscriptionGuard message="">
                  <Button variant="primary" className="mt-2" onClick={() => {
                    setCurrentProduct(null);
                    setShowModal(true);
                  }}>
                    <FiPlus className="me-2" /> {t('add_product')}
                  </Button>
                </SubscriptionGuard>
              </div>
            ) : viewMode === 'table' ? (
              <Table hover className="modern-table mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 py-3 ps-4">{t('product')}</th>
                    <th className="border-0 py-3">{t('category')}</th>
                    <th className="border-0 py-3">{t('price')}</th>
                    <th className="border-0 py-3">{t('stock')}</th>
                    <th className="border-0 py-3">{t('status')}</th>
                    <th className="border-0 py-3 text-end pe-4">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="product-row">
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          <div className="product-image-wrapper me-3">
                            {product.image ? (
                              <img src={getImageUrl(product.image)} alt={product.name} className="product-image" />
                            ) : (
                              <div className="product-image-placeholder">
                                <FiBox className="text-muted" size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="fw-bold text-dark">{product.name}</div>
                            <div className="small text-muted product-id">{product.product_id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge bg="light" text="dark" className="border fw-normal category-badge">
                          {product.category?.name || t('uncategorized')}
                        </Badge>
                      </td>
                      <td>
                        <div className="fw-bold text-dark">{formatCurrency(product.unit_price)}</div>
                        {product.cost_price && <div className="small text-muted">{t('cost')}: {formatCurrency(product.cost_price)}</div>}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className={`stock-value ${product.stock_quantity <= product.reorder_level ? 'text-danger' : 'text-dark'}`}>
                            {product.stock_quantity}
                          </span>
                          {product.stock_quantity <= product.reorder_level && (
                            <FiAlertTriangle className="ms-2 text-warning" size={14} title={t('low_stock_label')} />
                          )}
                        </div>
                        <div className="small text-muted">{t('min')}: {product.reorder_level}</div>
                      </td>
                      <td>
                        <div className="status-badge-wrapper">
                          <Badge bg={product.is_active ? 'success' : 'secondary'} className="px-2 py-1 fw-normal status-badge">
                            {product.is_active ? t('active') : t('inactive')}
                          </Badge>
                        </div>
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex gap-2 justify-content-end">
                          <Button variant="outline-warning" size="sm" className="d-flex align-items-center action-btn" onClick={() => handleEdit(product)} title={t('edit_product')}>
                            <FiEdit2 size={16} />
                          </Button>
                          <Button variant="outline-danger" size="sm" className="d-flex align-items-center action-btn" onClick={() => handleDelete(product.id)} title={t('delete_product')}>
                            <FiTrash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="product-grid p-3">
                <Row className="g-3">
                  {filteredProducts.map(product => (
                    <Col key={product.id} xs={12} sm={6} lg={4} xl={3}>
                      <Card className="product-card h-100 border-0 shadow-sm">
                        <div className="product-card-image">
                          {product.image ? (
                            <img src={getImageUrl(product.image)} alt={product.name} className="card-img-top" />
                          ) : (
                            <div className="card-img-placeholder">
                              <FiPackage size={48} />
                            </div>
                          )}
                          <Badge bg={product.is_active ? 'success' : 'secondary'} className="position-absolute top-0 end-0 m-2 status-badge">
                            {product.is_active ? t('active') : t('inactive')}
                          </Badge>
                        </div>
                        <Card.Body className="p-3">
                          <div className="product-card-category">
                            <Badge bg="light" text="dark" className="border fw-normal">
                              {product.category?.name || t('uncategorized')}
                            </Badge>
                          </div>
                          <h6 className="product-card-title mb-1">{product.name}</h6>
                          <div className="small text-muted mb-2">{product.product_id}</div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-bold text-primary">{formatCurrency(product.unit_price)}</span>
                            <span className={`small ${product.stock_quantity <= product.reorder_level ? 'text-danger' : 'text-muted'}`}>
                              {product.stock_quantity} {t('in_stock')}
                            </span>
                          </div>
                          <div className="d-flex gap-2">
                            <Button variant="outline-primary" size="sm" className="flex-grow-1" onClick={() => handleEdit(product)}>
                              <FiEdit2 size={14} className="me-1" /> {t('edit')}
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(product.id)}>
                              <FiTrash2 size={14} />
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Modern Product Modal */}
      <Modal show={showModal} onHide={handleClose} centered size="lg" className="colored-modal modern-modal">
        <Modal.Header closeButton className="border-0 pb-0 modal-header-modern">
          <Modal.Title className="fw-bold">{currentProduct ? t('edit_product') : t('add_product')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form onSubmit={handleSave}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('sale_id')}</Form.Label>
                  <Form.Control name="product_id" type="text" defaultValue={currentProduct?.product_id} placeholder="e.g. PROD-001" className="modern-input" />
                </Form.Group>

                <Form.Group className="mt-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label className="fw-semibold small mb-0">{t('barcode')}</Form.Label>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      type="button"
                      onClick={() => setShowBarcodeScanner(true)}
                      title={t('scan')}
                      className="d-flex align-items-center btn-scan"
                    >
                      <FiCamera className="me-1" /> {t('scan')}
                    </Button>
                  </div>
                  <Form.Control
                    name="barcode"
                    type="text"
                    value={scannedBarcode}
                    onChange={(e) => setScannedBarcode(e.target.value)}
                    placeholder={t('scan_placeholder')}
                    className="modern-input"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('product_name')}</Form.Label>
                  <Form.Control name="name" type="text" defaultValue={currentProduct?.name} placeholder={t('product_name_placeholder')} required className="modern-input" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('category')}</Form.Label>
                  <Form.Select name="category_id" defaultValue={currentProduct?.category_id} className="modern-input">
                    <option value="">{t('select_category')}</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('selling_price')}</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="modern-input">{formatCurrency(0).split('0.00')[0]}</InputGroup.Text>
                    <Form.Control name="unit_price" type="number" step="0.01" defaultValue={currentProduct?.unit_price} required className="modern-input" />
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('cost')}</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="modern-input">{formatCurrency(0).split('0.00')[0]}</InputGroup.Text>
                    <Form.Control name="cost_price" type="number" step="0.01" defaultValue={currentProduct?.cost_price} className="modern-input" />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('stock_quantity')}</Form.Label>
                  <Form.Control name="stock_quantity" type="number" defaultValue={currentProduct?.stock_quantity} required className="modern-input" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('reorder_level')}</Form.Label>
                  <Form.Control name="reorder_level" type="number" defaultValue={currentProduct?.reorder_level} required className="modern-input" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('expiry_date')}</Form.Label>
                  <Form.Control name="expiry_date" type="date" defaultValue={currentProduct?.expiry_date} className="modern-input" />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('description')}</Form.Label>
                  <Form.Control name="description" as="textarea" rows={3} defaultValue={currentProduct?.description} placeholder={t('description_placeholder')} className="modern-input" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('product_image')}</Form.Label>
                  <div className="image-upload-wrapper">
                    <Form.Control type="file" name="image" accept="image/*" onChange={handleImageChange} className="modern-input" />
                    {productImagePreview ? (
                      <div className="mt-2 image-preview">
                        <img src={productImagePreview} alt="preview" className="preview-image" />
                        <Button variant="link" size="sm" className="remove-image" onClick={() => { setProductImagePreview(null); setProductImageFile(null); }}>
                          <FiTrash2 size={14} />
                        </Button>
                      </div>
                    ) : currentProduct?.image && (
                      <div className="mt-2 image-preview">
                        <img src={getImageUrl(currentProduct.image)} alt="current" className="preview-image" />
                      </div>
                    )}
                  </div>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Check
                    name="is_active"
                    type="switch"
                    id="product-status"
                    label={t('product_active_label')}
                    defaultChecked={currentProduct ? currentProduct.is_active : true}
                    className="modern-switch"
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2 mt-4 modal-actions">
              <Button variant="light" onClick={handleClose} className="px-4 btn-cancel">{t('cancel')}</Button>
              <Button variant="primary" type="submit" className="px-4 btn-save" disabled={isSaving}>
                {isSaving ? t('register_creating') : t('save_product')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modern Bulk Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered className="colored-modal modern-modal">
        <Modal.Header closeButton className="border-0 pb-0 modal-header-modern">
          <Modal.Title className="fw-bold">{t('bulk_upload_title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form onSubmit={handleUploadSubmit}>
            <Form.Group>
              <Form.Label className="fw-semibold small">{t('csv_file')}</Form.Label>
              <div className="upload-area">
                <Form.Control type="file" accept=".csv" onChange={handleFileChange} className="modern-input" />
              </div>
              <Form.Text className="text-muted">
                {t('manage_inventory')}
                <div className="mt-2"><a href="/product_bulk_sample.csv" target="_blank" rel="noreferrer" className="download-link">{t('download_sample')}</a></div>
              </Form.Text>
            </Form.Group>
            <div className="d-flex justify-content-end gap-2 mt-3 modal-actions">
              <Button variant="light" onClick={() => setShowUploadModal(false)} className="btn-cancel">{t('cancel')}</Button>
              <Button variant="primary" type="submit" disabled={uploading} className="btn-upload">
                {uploading ? t('uploading') : t('upload')}
              </Button>
            </div>
          </Form>

          {uploadResult && (
            <div className="mt-3 upload-result">
              <Alert variant="success" className="alert-modern">{t('created_count').replace('{count}', uploadResult.created_count)}</Alert>
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="error-list">
                  <h6>{t('errors')}:</h6>
                  <ul>
                    {uploadResult.errors.map((err, idx) => (
                      <li key={idx}>{t('row')} {err.row}: {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>

      <BarcodeScannerModal
        show={showBarcodeScanner}
        onHide={() => setShowBarcodeScanner(false)}
        onDetected={handleBarcodeDetected}
      />

    
    {/* Modern CSS Styles */}
    <style dangerouslySetInnerHTML={{
      __html: `
        /* Modern Header Styles */
        .modern-header {
          background: transparent;
          border-radius: 16px;
          padding: 24px;
          color: #333;
        }
        
        .modern-header .header-title h2 {
          color: #333;
          font-size: 1.75rem;
        }
        
        .btn-modern {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          color: #333;
          transition: all 0.3s ease;
        }
        
        .btn-modern:hover {
          background: #e9ecef;
          border-color: #adb5bd;
          color: #333;
        }
        
        .btn-primary-modern {
          background: #0d6efd;
          border: none;
          color: white;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .btn-primary-modern:hover {
          background: #0b5ed7;
          color: white;
          transform: translateY(-1px);
        }

        /* Stat Cards Modern Styles */
        .stat-card {
          transition: all 0.3s ease;
          border-radius: 16px;
          overflow: hidden;
        }
        
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1) !important;
        }
        
        .stat-card .card-body {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .bg-primary-light { background: linear-gradient(135deg, #667eea20 0%, #667eea10 100%); }
        .bg-warning-light { background: linear-gradient(135deg, #f59e0b20 0%, #f59e0b10 100%); }
        .bg-danger-light { background: linear-gradient(135deg, #ef444420 0%, #ef444410 100%); }
        .bg-success-light { background: linear-gradient(135deg, #10b98120 0%, #10b98110 100%); }
        
        .stat-content { display: flex; flex-direction: column; }
        .stat-label { font-size: 0.8rem; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-value { font-size: 1.5rem; font-weight: 700; color: #1f2937; margin: 4px 0; }
        .stat-meta { font-size: 0.75rem; color: #9ca3af; }

        /* Modern Card Styles */
        .modern-card { border-radius: 16px; overflow: hidden; }
        .card-header-modern { background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
        .search-input-group { max-width: 320px; border-radius: 10px; overflow: hidden; }
        .search-input-group .form-control { border-radius: 0 10px 10px 0; }
        .search-input-group .input-group-text { border-radius: 10px 0 0 10px; }
        .view-toggle .btn { border-radius: 8px !important; padding: 6px 12px; }
        .view-toggle .btn:first-child { border-radius: 8px 0 0 8px !important; }
        .view-toggle .btn:last-child { border-radius: 0 8px 8px 0 !important; }

        /* Modern Table Styles */
        .modern-table { font-size: 0.9rem; }
        .modern-table thead th { font-weight: 600; color: #4b5563; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; }
        .modern-table tbody tr { transition: all 0.2s ease; }
        .modern-table tbody tr:hover { background: #f9fafb; }
        .product-row td { padding: 16px; vertical-align: middle; }
        .product-image-wrapper { width: 48px; height: 48px; border-radius: 10px; overflow: hidden; flex-shrink: 0; }
        .product-image { width: 100%; height: 100%; object-fit: cover; }
        .product-image-placeholder { width: 100%; height: 100%; background: #f3f4f6; display: flex; align-items: center; justify-content: center; }
        .product-id { font-size: 0.75rem; }
        .stock-value { font-weight: 600; }
        .action-btn { width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px; }

        /* Grid View Styles */
        .product-grid { padding: 16px; }
        .product-card { transition: all 0.3s ease; border-radius: 16px; overflow: hidden; }
        .product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1) !important; }
        .product-card-image { height: 160px; background: #f9fafb; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
        .product-card-image .card-img-top { width: 100%; height: 100%; object-fit: cover; }
        .card-img-placeholder { color: #d1d5db; }
        .product-card-title { font-weight: 600; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Empty State Styles */
        .empty-state { padding: 60px 20px; text-align: center; }
        .empty-icon { width: 120px; height: 120px; margin: 0 auto 20px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #9ca3af; }

        /* Modal Modern Styles */
        .modal-header-modern { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px 12px 0 0; padding: 20px 24px; }
        .modal-header-modern .btn-close { filter: invert(1); }
        .modal-header-modern .modal-title { color: white; }
        .modern-input { border-radius: 10px; border: 1px solid #e5e7eb; padding: 10px 14px; transition: all 0.2s ease; }
        .modern-input:focus { border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
        .btn-scan { font-size: 0.75rem; padding: 4px 8px; border-radius: 6px; }
        .image-preview { position: relative; display: inline-block; }
        .preview-image { width: 120px; height: 120px; object-fit: cover; border-radius: 10px; border: 1px solid #e5e7eb; }
        .remove-image { position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; padding: 0; border-radius: 50%; background: #ef4444; color: white; display: flex; align-items: center; justify-content: center; }
        .modal-actions .btn { border-radius: 10px; padding: 10px 24px; font-weight: 500; }
        .btn-cancel { background: #f3f4f6; border: none; color: #4b5563; }
        .btn-cancel:hover { background: #e5e7eb; color: #1f2937; }
        .btn-save, .btn-upload { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; }
        .btn-save:hover, .btn-upload:hover { background: linear-gradient(135deg, #5568d3 0%, #6a4190 100%); }
        .modern-switch .form-check-input:checked { background-color: #667eea; border-color: #667eea; }
        .upload-area { border: 2px dashed #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; transition: all 0.2s ease; }
        .upload-area:hover { border-color: #667eea; background: #f9fafb; }
        .download-link { color: #667eea; font-weight: 500; }
        .alert-modern { border-radius: 10px; border: none; }

        @media (max-width: 767.98px) {
          .products-wrapper .card { margin-bottom: 12px; }
          .products-wrapper .card-body { padding: 16px !important; }
          .products-wrapper .card-body .d-flex { margin-bottom: 8px !important; }
          .products-wrapper .card-body h3 { font-size: 1.25rem !important; }
          .products-wrapper .small-md { font-size: 0.8rem !important; }
          .products-wrapper .h5 { font-size: 1.1rem !important; }
          .modern-header { padding: 16px; }
          .stat-card .card-body { padding: 12px !important; }
          .stat-icon { width: 40px; height: 40px; }
          .stat-value { font-size: 1.25rem; }
        }
        @media (max-width: 575.98px) {
          .products-wrapper .card-body { padding: 12px !important; }
          .products-wrapper .card-body .d-flex { margin-bottom: 6px !important; }
          .products-wrapper .card-body h3 { font-size: 1.1rem !important; }
          .products-wrapper .small-md { font-size: 0.75rem !important; }
        }
      `
    }} />
    <style dangerouslySetInnerHTML={{
      __html: `
        /* Mobile Responsive Styles for Product KPI Cards */
        @media (max-width: 767.98px) {
          .products-wrapper .card {
            margin-bottom: 12px;
          }
          
          .products-wrapper .card-body {
            padding: 16px !important;
          }
          
          .products-wrapper .card-body .d-flex {
            margin-bottom: 8px !important;
          }
          
          .products-wrapper .card-body h3 {
            font-size: 1.25rem !important;
          }
          
          .products-wrapper .small-md {
            font-size: 0.8rem !important;
          }
          
          .products-wrapper .h5 {
            font-size: 1.1rem !important;
          }
        }
        
        @media (max-width: 575.98px) {
          .products-wrapper .card-body {
            padding: 12px !important;
          }
          
          .products-wrapper .card-body .d-flex {
            margin-bottom: 6px !important;
          }
          
          .products-wrapper .card-body h3 {
            font-size: 1.1rem !important;
          }
          
          .products-wrapper .small-md {
            font-size: 0.75rem !important;
          }
        }
      `
    }} />
    </div>
  );
};

export default Products;
