import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { settingsAPI } from '../services/api';

const MODULES = [
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'users', name: 'Users & Roles' },
  { id: 'customers', name: 'Customers' },
  { id: 'suppliers', name: 'Suppliers' },
  { id: 'inventory', name: 'Inventory' },
  { id: 'sales', name: 'Sales' },
  { id: 'purchases', name: 'Purchases' },
  { id: 'expenses', name: 'Expenses' },
  { id: 'hr', name: 'Human Resources' },
  { id: 'reports', name: 'Reports' },
  { id: 'settings', name: 'Settings' },
  { id: 'leads', name: 'Leads' },
  { id: 'tasks', name: 'Tasks' },
  { id: 'projects', name: 'Projects' },
  { id: 'documents', name: 'Documents' },
  { id: 'assets', name: 'Assets' },
  { id: 'warehouses', name: 'Warehouses' }
];

const Users = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getUsers();
      setUsers(response.data.users || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users. Showing empty list.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setCurrentUser(user);
    setSelectedPermissions(user.permissions || []);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    toast((t) => (
      <span>
        Are you sure you want to deactivate this user?
        <div className="mt-2 d-flex gap-2">
          <Button size="sm" variant="danger" onClick={async () => {
            try {
              await settingsAPI.deleteUser(id);
              setUsers(users.filter(user => user.id !== id));
              toast.dismiss(t.id);
              toast.success('User deactivated successfully');
            } catch (err) {
              toast.dismiss(t.id);
              console.error('Error deactivating user:', err);
              toast.error('Failed to deactivate user');
            }
          }}>
            Deactivate
          </Button>
          <Button size="sm" variant="light" onClick={() => toast.dismiss(t.id)}>
            Cancel
          </Button>
        </div>
      </span>
    ), { duration: 3000 });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = {
      username: formData.get('username'),
      email: formData.get('email'),
      first_name: formData.get('firstName'),
      last_name: formData.get('lastName'),
      role: formData.get('role'),
      phone: formData.get('phone') || '',
      is_active: formData.get('isActive') === 'on',
      password: formData.get('password') || 'TempPass123!',
      permissions: selectedPermissions
    };

    setSaving(true);
    try {
      if (currentUser) {
        await settingsAPI.updateUser(currentUser.id, userData);
        toast.success('User updated successfully');
      } else {
        if (settingsAPI.createUser) {
          await settingsAPI.createUser(userData);
          toast.success('User created successfully');
        } else {
          toast.error('Create user endpoint not available on the backend');
        }
      }
      fetchUsers();
      handleClose();
    } catch (err) {
      console.error('Error saving user:', err);
      toast.error(err.response?.data?.error || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setCurrentUser(null);
    setSelectedPermissions([]);
  };

  const togglePermission = (moduleId) => {
    setSelectedPermissions(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
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
    <Container fluid className="py-4">
      <Row>
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">System Configuration - Users</h5>
              <Button variant="primary" onClick={() => {
                setCurrentUser(null);
                setSelectedPermissions([]);
                setShowModal(true);
              }}>
                Add User
              </Button>
            </Card.Header>
            {error && <div className="p-3"><Alert variant="warning">{error}</Alert></div>}
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4 border-0">ID</th>
                      <th className="border-0">Username</th>
                      <th className="border-0">Email</th>
                      <th className="border-0">Name</th>
                      <th className="border-0">Role</th>
                      <th className="border-0">Status</th>
                      <th className="pe-4 border-0 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td className="ps-4">{user.id}</td>
                        <td className="fw-bold">{user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.first_name} {user.last_name}</td>
                        <td>
                          <span className={`badge bg-${user.role === 'admin' ? 'danger' : user.role === 'manager' ? 'warning' : 'success'} fw-normal`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${user.is_active ? 'bg-success' : 'bg-secondary'} fw-normal`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="pe-4 text-end">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(user)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
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

      {/* User Modal */}
      <Modal show={showModal} onHide={handleClose} centered size="lg">
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="fw-bold">{currentUser ? 'Edit User' : 'Add User'}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-0">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Username</Form.Label>
                  <Form.Control
                    name="username"
                    type="text"
                    defaultValue={currentUser?.username || ''}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Email</Form.Label>
                  <Form.Control
                    name="email"
                    type="email"
                    defaultValue={currentUser?.email || ''}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">First Name</Form.Label>
                  <Form.Control
                    name="firstName"
                    type="text"
                    defaultValue={currentUser?.first_name || ''}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Last Name</Form.Label>
                  <Form.Control
                    name="lastName"
                    type="text"
                    defaultValue={currentUser?.last_name || ''}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Role</Form.Label>
                  <Form.Select name="role" defaultValue={currentUser?.role || 'staff'}>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Phone</Form.Label>
                  <Form.Control
                    name="phone"
                    type="tel"
                    defaultValue={currentUser?.phone || ''}
                  />
                </Form.Group>
              </Col>
            </Row>
            {!currentUser && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">Password</Form.Label>
                <Form.Control
                  name="password"
                  type="password"
                  placeholder="Enter temporary password"
                  required={!currentUser}
                />
                <Form.Text className="text-muted">
                  Default: TempPass123! if left empty.
                </Form.Text>
              </Form.Group>
            )}

            <hr />
            <h6 className="fw-bold mb-3">Module Access & Permissions</h6>
            <div className="bg-light p-3 rounded-3">
              <Row>
                {MODULES.map(module => (
                  <Col md={4} key={module.id} className="mb-2">
                    <Form.Check
                      type="checkbox"
                      id={`perm-${module.id}`}
                      label={module.name}
                      checked={selectedPermissions.includes(module.id)}
                      onChange={() => togglePermission(module.id)}
                      className="small"
                    />
                  </Col>
                ))}
              </Row>
            </div>

            <Form.Group className="mt-3">
              <Form.Check
                name="isActive"
                type="switch"
                id="status-switch"
                label="Active Account"
                defaultChecked={currentUser?.is_active !== false}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="light" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Processing...' : (currentUser ? 'Save Changes' : 'Create User')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default Users;
