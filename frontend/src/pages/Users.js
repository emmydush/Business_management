import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { settingsAPI } from '../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    ), { duration: 5000 });
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
      is_active: formData.get('isActive') === 'on'
    };

    setSaving(true);
    try {
      if (currentUser) {
        await settingsAPI.updateUser(currentUser.id, {
          role: userData.role,
          email: userData.email,
          is_active: userData.is_active
        });
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
      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">{currentUser ? 'Edit User' : 'Add User'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <Form onSubmit={handleSave}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Username</Form.Label>
              <Form.Control
                name="username"
                type="text"
                defaultValue={currentUser?.username || ''}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Email</Form.Label>
              <Form.Control
                name="email"
                type="email"
                defaultValue={currentUser?.email || ''}
                required
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">First Name</Form.Label>
                  <Form.Control
                    name="firstName"
                    type="text"
                    defaultValue={currentUser?.first_name || currentUser?.firstName || ''}
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
                    defaultValue={currentUser?.last_name || currentUser?.lastName || ''}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Role</Form.Label>
                  <Form.Select name="role" defaultValue={currentUser?.role || 'Staff'}>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Staff">Staff</option>
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
            <Form.Group className="mb-3">
              <Form.Check
                name="isActive"
                type="switch"
                id="status-switch"
                label="Active Account"
                defaultChecked={currentUser?.is_active !== false && currentUser?.isActive !== false}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={saving} onClick={(e) => { /* form submits via onSubmit */ }}>
            {saving ? 'Processing...' : (currentUser ? 'Save Changes' : 'Create User')}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Users;