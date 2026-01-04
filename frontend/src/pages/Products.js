import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form } from 'react-bootstrap';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data for products
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProducts([
        { id: 1, productId: 'PROD0001', name: 'Laptop', category: 'Electronics', price: 999.99, stock: 15, reorderLevel: 5, isActive: true },
        { id: 2, productId: 'PROD0002', name: 'Office Chair', category: 'Furniture', price: 249.99, stock: 8, reorderLevel: 3, isActive: true },
        { id: 3, productId: 'PROD0003', name: 'Coffee Maker', category: 'Appliances', price: 89.99, stock: 0, reorderLevel: 2, isActive: true }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleEdit = (product) => {
    setCurrentProduct(product);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(product => product.id !== id));
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setCurrentProduct(null);
  };

  if (loading) {
    return (
      <Container fluid className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row>
        <Col lg={12}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5>Inventory & Sales - Products</h5>
              <Button variant="primary" onClick={() => {
                setCurrentProduct(null);
                setShowModal(true);
              }}>
                Add Product
              </Button>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Product ID</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Reorder Level</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id}>
                        <td>{product.id}</td>
                        <td>{product.productId}</td>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td>${product.price.toFixed(2)}</td>
                        <td>
                          <span className={`badge ${product.stock > product.reorderLevel ? 'bg-success' : product.stock > 0 ? 'bg-warning' : 'bg-danger'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td>{product.reorderLevel}</td>
                        <td>
                          <span className={`badge ${product.isActive ? 'bg-success' : 'bg-secondary'}`}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleEdit(product)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Product Modal */}
      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{currentProduct ? 'Edit Product' : 'Add Product'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Product ID</Form.Label>
              <Form.Control
                type="text"
                defaultValue={currentProduct?.productId || ''}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                defaultValue={currentProduct?.name || ''}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select defaultValue={currentProduct?.category || ''}>
                <option value="">Select Category</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Appliances">Appliances</option>
                <option value="Clothing">Clothing</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                defaultValue={currentProduct?.price || ''}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Stock Quantity</Form.Label>
              <Form.Control
                type="number"
                defaultValue={currentProduct?.stock || ''}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reorder Level</Form.Label>
              <Form.Control
                type="number"
                defaultValue={currentProduct?.reorderLevel || ''}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                defaultValue={currentProduct?.description || ''}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="status-switch"
                label="Active"
                defaultChecked={currentProduct?.isActive !== false}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary">
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Products;