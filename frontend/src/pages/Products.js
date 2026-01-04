import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Dropdown, Alert } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEdit2, FiTrash2, FiBox, FiDownload, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { inventoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { formatCurrency } = useCurrency();

  // Fetch products and categories from API
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        inventoryAPI.getProducts(),
        inventoryAPI.getCategories()
      ]);
      setProducts(productsRes.data.products || []);
      setCategories(categoriesRes.data.categories || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch inventory data. Please check your connection.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await inventoryAPI.exportProducts();
      toast.success(response.data.message || 'Product list export initiated successfully');
      console.log('Export response:', response.data);
    } catch (err) {
      toast.error('Failed to export product list. Please try again.');
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
      stock_quantity: formData.get('stock_quantity'),
      reorder_level: formData.get('reorder_level'),
      description: formData.get('description'),
      is_active: formData.get('is_active') === 'on'
    };

    setIsSaving(true);
    try {
      if (currentProduct) {
        await inventoryAPI.updateProduct(currentProduct.id, productData);
        toast.success('Product updated successfully!');
      } else {
        await inventoryAPI.createProduct(productData);
        toast.success('Product added successfully!');
      }
      fetchData();
      handleClose();
    } catch (err) {
      toast.error('Failed to save product. Please try again.');
      console.error('Error saving product:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <span>
        Delete this product?
        <div className="mt-2 d-flex gap-2">
          <Button size="sm" variant="danger" onClick={async () => {
            try {
              await inventoryAPI.deleteProduct(id);
              setProducts(products.filter(p => p.id !== id));
              toast.dismiss(t.id);
              toast.success('Product deleted');
            } catch (err) {
              toast.error('Failed to delete product');
            }
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

  const handleClose = () => {
    setShowModal(false);
    setCurrentProduct(null);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.product_id.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="fw-bold text-dark mb-1">Products</h2>
          <p className="text-muted mb-0">Manage your inventory items and stock levels.</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Button variant="outline-secondary" className="d-flex align-items-center" onClick={handleExport}>
            <FiDownload className="me-2" /> Export
          </Button>
          <Button variant="primary" className="d-flex align-items-center" onClick={() => {
            setCurrentProduct(null);
            setShowModal(true);
          }}>
            <FiPlus className="me-2" /> Add Product
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
                <span className="text-muted fw-medium">Total Products</span>
              </div>
              <h3 className="fw-bold mb-0">{products.length}</h3>
              <small className="text-muted">In active catalog</small>
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
                <span className="text-muted fw-medium">Low Stock</span>
              </div>
              <h3 className="fw-bold mb-0">{products.filter(p => p.stock_quantity <= p.reorder_level && p.stock_quantity > 0).length}</h3>
              <small className="text-warning fw-medium">Requires reorder</small>
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
                <span className="text-muted fw-medium">Out of Stock</span>
              </div>
              <h3 className="fw-bold mb-0">{products.filter(p => p.stock_quantity <= 0).length}</h3>
              <small className="text-danger fw-medium">Immediate attention</small>
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
                <span className="text-muted fw-medium">Inventory Value</span>
              </div>
              <h3 className="fw-bold mb-0">{formatCurrency(products.reduce((acc, curr) => acc + (curr.unit_price * curr.stock_quantity), 0))}</h3>
              <small className="text-muted">Total stock value</small>
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
                  placeholder="Search by name or product ID..."
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

          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 py-3 ps-4">Product</th>
                  <th className="border-0 py-3">Category</th>
                  <th className="border-0 py-3">Price</th>
                  <th className="border-0 py-3">Stock</th>
                  <th className="border-0 py-3">Status</th>
                  <th className="border-0 py-3 text-end pe-4">Actions</th>
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
                        {product.category?.name || 'Uncategorized'}
                      </Badge>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">${parseFloat(product.unit_price).toFixed(2)}</div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className={`fw-bold ${product.stock_quantity <= product.reorder_level ? 'text-danger' : 'text-dark'}`}>
                          {product.stock_quantity}
                        </span>
                        {product.stock_quantity <= product.reorder_level && (
                          <FiAlertTriangle className="ms-2 text-warning" size={14} title="Low Stock" />
                        )}
                      </div>
                      <div className="small text-muted">Min: {product.reorder_level}</div>
                    </td>
                    <td>
                      <Badge bg={product.is_active ? 'success' : 'secondary'} className="px-2 py-1 fw-normal">
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="text-end pe-4">
                      <Dropdown align="end">
                        <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                          <FiMoreVertical size={20} />
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="border-0 shadow-sm">
                          <Dropdown.Item onClick={() => handleEdit(product)} className="d-flex align-items-center py-2">
                            <FiEdit2 className="me-2 text-muted" /> Edit Product
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item className="d-flex align-items-center py-2 text-danger" onClick={() => handleDelete(product.id)}>
                            <FiTrash2 className="me-2" /> Delete Product
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
          <Modal.Title className="fw-bold">{currentProduct ? 'Edit Product' : 'Add New Product'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form onSubmit={handleSave}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Product ID</Form.Label>
                  <Form.Control name="product_id" type="text" defaultValue={currentProduct?.product_id} placeholder="e.g. PROD-001" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Product Name</Form.Label>
                  <Form.Control name="name" type="text" defaultValue={currentProduct?.name} placeholder="Enter product name" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Category</Form.Label>
                  <Form.Select name="category_id" defaultValue={currentProduct?.category_id}>
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Unit Price</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>{formatCurrency(0).split('0.00')[0]}</InputGroup.Text>
                    <Form.Control name="unit_price" type="number" step="0.01" defaultValue={currentProduct?.unit_price} required />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Stock Quantity</Form.Label>
                  <Form.Control name="stock_quantity" type="number" defaultValue={currentProduct?.stock_quantity} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Reorder Level</Form.Label>
                  <Form.Control name="reorder_level" type="number" defaultValue={currentProduct?.reorder_level} required />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Description</Form.Label>
                  <Form.Control name="description" as="textarea" rows={3} defaultValue={currentProduct?.description} placeholder="Product details..." />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Check
                  name="is_active"
                  type="switch"
                  id="product-status"
                  label="Product is active"
                  defaultChecked={currentProduct ? currentProduct.is_active : true}
                />
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="light" onClick={handleClose} className="px-4">Close</Button>
              <Button variant="primary" type="submit" className="px-4" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Product'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Products;