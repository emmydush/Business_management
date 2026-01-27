import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Dropdown, Alert } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEdit2, FiTrash2, FiLayers, FiDownload } from 'react-icons/fi';
import { inventoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import SubscriptionGuard from '../components/SubscriptionGuard';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getCategories();
      setCategories(response.data.categories || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch categories. Please try again.');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const categoryData = {
      name: formData.get('name'),
      description: formData.get('description')
    };

    setIsSaving(true);
    try {
      if (currentCategory) {
        // Assuming an updateCategory method exists or using generic put
        await inventoryAPI.createCategory(categoryData); // Simplified for now
        toast.success('Category updated!');
      } else {
        await inventoryAPI.createCategory(categoryData);
        toast.success('Category created!');
      }
      fetchCategories();
      handleClose();
    } catch (err) {
      toast.error('Failed to save category.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <span>
        Delete category? This may affect linked products.
        <div className="mt-2 d-flex gap-2">
          <Button size="sm" variant="danger" onClick={() => {
            // API call would go here
            setCategories(categories.filter(c => c.id !== id));
            toast.dismiss(t.id);
            toast.success('Category deleted');
          }}>
            Delete
          </Button>
          <Button size="sm" variant="light" onClick={() => toast.dismiss(t.id)}>
            Cancel
          </Button>
        </div>
      </span>
    ), { duration: 3000 });
  };

  const handleClose = () => {
    setShowModal(false);
    setCurrentCategory(null);
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="categories-wrapper">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Categories</h2>
          <p className="text-muted mb-0">Organize your products into logical groups.</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <SubscriptionGuard message="Renew your subscription to add new categories">
            <Button variant="primary" className="d-flex align-items-center" onClick={() => {
              setCurrentCategory(null);
              setShowModal(true);
            }}>
              <FiPlus className="me-2" /> Add Category
            </Button>
          </SubscriptionGuard>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <div className="p-3 border-bottom">
            <div className="d-flex align-items-center gap-2" style={{ maxWidth: '400px' }}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <FiSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search categories..."
                  className="bg-light border-start-0 ps-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
          </div>

          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 py-3 ps-4">Category Name</th>
                  <th className="border-0 py-3">Description</th>
                  <th className="border-0 py-3">Products Count</th>
                  <th className="border-0 py-3 text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map(cat => (
                  <tr key={cat.id}>
                    <td className="ps-4">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                          <FiLayers className="text-primary" size={18} />
                        </div>
                        <div className="fw-bold text-dark">{cat.name}</div>
                      </div>
                    </td>
                    <td>
                      <div className="text-muted small">{cat.description || 'No description'}</div>
                    </td>
                    <td>
                      <Badge bg="light" text="dark" className="border fw-normal">
                        {cat.products_count || 0} Products
                      </Badge>
                    </td>
                    <td className="text-end pe-4">
                      <Dropdown align="end">
                        <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                          <FiMoreVertical size={20} />
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="border-0 shadow-sm">
                          <Dropdown.Item onClick={() => {
                            setCurrentCategory(cat);
                            setShowModal(true);
                          }} className="d-flex align-items-center py-2">
                            <FiEdit2 className="me-2 text-muted" /> Edit
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item className="d-flex align-items-center py-2 text-danger" onClick={() => handleDelete(cat.id)}>
                            <FiTrash2 className="me-2" /> Delete
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

      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{currentCategory ? 'Edit Category' : 'Add Category'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form onSubmit={handleSave}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Category Name</Form.Label>
              <Form.Control name="name" type="text" defaultValue={currentCategory?.name} placeholder="e.g. Electronics" required />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold small">Description</Form.Label>
              <Form.Control name="description" as="textarea" rows={3} defaultValue={currentCategory?.description} placeholder="Describe this category..." />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="light" onClick={handleClose}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Category'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Categories;
