import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Dropdown, Alert } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEdit2, FiTrash2, FiBox, FiDownload, FiAlertTriangle, FiCheckCircle, FiUpload, FiCamera } from 'react-icons/fi';
import { inventoryAPI, getImageUrl } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import { useI18n } from '../i18n/I18nProvider';

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

  const { formatCurrency } = useCurrency();

  useEffect(() => {
    if (showModal && currentProduct) {
      setProductImagePreview(currentProduct.image || null);
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
    const productData = {
      product_id: formData.get('product_id'),
      name: formData.get('name'),
      category_id: formData.get('category_id'),
      unit_price: formData.get('unit_price'),
      cost_price: formData.get('cost_price'),
      stock_quantity: formData.get('stock_quantity'),
      reorder_level: formData.get('reorder_level'),
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
        if (err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.status === 401) {
          errorMessage = t('login_invalid');
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
      {/* Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">{t('sidebar_products')}</h2>
          <p className="text-muted mb-0">{t('manage_inventory')}</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Button variant="outline-secondary" className="d-flex align-items-center" onClick={handleExport}>
            <FiDownload className="me-2" /> {t('export')}
          </Button>
          <Button variant="outline-secondary" className="d-flex align-items-center" onClick={() => setShowUploadModal(true)}>
            <FiUpload className="me-2" /> {t('bulk_upload')}
          </Button>
          <Button variant="primary" className="d-flex align-items-center" onClick={() => {
            setCurrentProduct(null);
            setShowModal(true);
          }}>
            <FiPlus className="me-2" /> {t('add_product')}
          </Button>
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
                  <FiBox className="text-primary" size={20} />
                </div>
                <span className="text-muted fw-medium">{t('total_products')}</span>
              </div>
              <h3 className="fw-bold mb-0">{products.length}</h3>
              <small className="text-muted">{t('active')}</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                  <FiAlertTriangle className="text-warning" size={20} />
                </div>
                <span className="text-muted fw-medium">{t('low_stock_label')}</span>
              </div>
              <h3 className="fw-bold mb-0">{products.filter(p => p.stock_quantity <= p.reorder_level && p.stock_quantity > 0).length}</h3>
              <small className="text-warning fw-medium">{t('reorder_level')}</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-danger bg-opacity-10 p-2 rounded me-3">
                  <FiAlertTriangle className="text-danger" size={20} />
                </div>
                <span className="text-muted fw-medium">{t('out_of_stock')}</span>
              </div>
              <h3 className="fw-bold mb-0">{products.filter(p => p.stock_quantity <= 0).length}</h3>
              <small className="text-danger fw-medium">{t('actions')}</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                  <FiCheckCircle className="text-success" size={20} />
                </div>
                <span className="text-muted fw-medium">{t('inventory_value')}</span>
              </div>
              <h3 className="fw-bold mb-0">{formatCurrency(products.reduce((acc, curr) => acc + (curr.unit_price * curr.stock_quantity), 0))}</h3>
              <small className="text-muted">{t('total')}</small>
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
                  placeholder={t('search_products')}
                  className="bg-light border-start-0 ps-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-light" className="text-dark border d-flex align-items-center">
                <FiFilter className="me-2" /> {t('filter')}
              </Button>
            </div>
          </div>

          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
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
                  <tr key={product.id}>
                    <td className="ps-4">
                      <div className="d-flex align-items-center">
                        <div className="bg-light rounded p-2 me-3">
                          <FiBox className="text-muted" size={20} />
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{product.name}</div>
                          <div className="small text-muted">{product.product_id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge bg="light" text="dark" className="border fw-normal">
                        {product.category?.name || t('uncategorized')}
                      </Badge>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{formatCurrency(product.unit_price)}</div>
                      {product.cost_price && <div className="small text-muted">{t('cost')}: {formatCurrency(product.cost_price)}</div>}
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className={`fw-bold ${product.stock_quantity <= product.reorder_level ? 'text-danger' : 'text-dark'}`}>
                          {product.stock_quantity}
                        </span>
                        {product.stock_quantity <= product.reorder_level && (
                          <FiAlertTriangle className="ms-2 text-warning" size={14} title={t('low_stock_label')} />
                        )}
                      </div>
                      <div className="small text-muted">{t('min')}: {product.reorder_level}</div>
                    </td>
                    <td>
                      <Badge bg={product.is_active ? 'success' : 'secondary'} className="px-2 py-1 fw-normal">
                        {product.is_active ? t('active') : t('inactive')}
                      </Badge>
                    </td>
                    <td className="text-end pe-4">
                      <Dropdown align="end">
                        <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                          <FiMoreVertical size={20} />
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="border-0 shadow-sm">
                          <Dropdown.Item onClick={() => handleEdit(product)} className="d-flex align-items-center py-2">
                            <FiEdit2 className="me-2 text-muted" /> {t('edit_product')}
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item className="d-flex align-items-center py-2 text-danger" onClick={() => handleDelete(product.id)}>
                            <FiTrash2 className="me-2" /> {t('delete_product')}
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

      {/* Product Modal */}
      <Modal show={showModal} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{currentProduct ? t('edit_product') : t('add_product')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form onSubmit={handleSave}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('sale_id')}</Form.Label>
                  <Form.Control name="product_id" type="text" defaultValue={currentProduct?.product_id} placeholder="e.g. PROD-001" />
                </Form.Group>

                <Form.Group className="mt-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <Form.Label className="fw-semibold small mb-0">{t('barcode')}</Form.Label>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setShowBarcodeScanner(true)}
                      title={t('scan')}
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
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('product_name')}</Form.Label>
                  <Form.Control name="name" type="text" defaultValue={currentProduct?.name} placeholder={t('product_name_placeholder')} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('category')}</Form.Label>
                  <Form.Select name="category_id" defaultValue={currentProduct?.category_id}>
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
                    <InputGroup.Text>{formatCurrency(0).split('0.00')[0]}</InputGroup.Text>
                    <Form.Control name="unit_price" type="number" step="0.01" defaultValue={currentProduct?.unit_price} required />
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('cost')}</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>{formatCurrency(0).split('0.00')[0]}</InputGroup.Text>
                    <Form.Control name="cost_price" type="number" step="0.01" defaultValue={currentProduct?.cost_price} />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('stock_quantity')}</Form.Label>
                  <Form.Control name="stock_quantity" type="number" defaultValue={currentProduct?.stock_quantity} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('reorder_level')}</Form.Label>
                  <Form.Control name="reorder_level" type="number" defaultValue={currentProduct?.reorder_level} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('expiry_date')}</Form.Label>
                  <Form.Control name="expiry_date" type="date" defaultValue={currentProduct?.expiry_date} />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('description')}</Form.Label>
                  <Form.Control name="description" as="textarea" rows={3} defaultValue={currentProduct?.description} placeholder={t('description_placeholder')} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">{t('product_image')}</Form.Label>
                  <Form.Control type="file" name="image" accept="image/*" onChange={handleImageChange} />
                  {productImagePreview ? (
                    <div className="mt-2">
                      <img src={productImagePreview} alt="preview" style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover' }} />
                    </div>
                  ) : currentProduct?.image && (
                    <div className="mt-2">
                      <img src={getImageUrl(currentProduct.image)} alt="current" style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover' }} />
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Check
                  name="is_active"
                  type="switch"
                  id="product-status"
                  label={t('product_active_label')}
                  defaultChecked={currentProduct ? currentProduct.is_active : true}
                />
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="light" onClick={handleClose} className="px-4">{t('cancel')}</Button>
              <Button variant="primary" type="submit" className="px-4" disabled={isSaving}>
                {isSaving ? t('register_creating') : t('save_product')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{t('bulk_upload_title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form onSubmit={handleUploadSubmit}>
            <Form.Group>
              <Form.Label className="fw-semibold small">{t('csv_file')}</Form.Label>
              <Form.Control type="file" accept=".csv" onChange={handleFileChange} />
              <Form.Text className="text-muted">
                {t('manage_inventory')}
                <div className="mt-2"><a href="/product_bulk_sample.csv" target="_blank" rel="noreferrer">{t('download_sample')}</a></div>
              </Form.Text>
            </Form.Group>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button variant="light" onClick={() => setShowUploadModal(false)}>{t('cancel')}</Button>
              <Button variant="primary" type="submit" disabled={uploading}>{uploading ? t('uploading') : t('upload')}</Button>
            </div>
          </Form>

          {uploadResult && (
            <div className="mt-3">
              <Alert variant="success">{t('created_count').replace('{count}', uploadResult.created_count)}</Alert>
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div>
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

    </div>
  );
};

export default Products;
