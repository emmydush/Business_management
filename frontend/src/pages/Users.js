import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form } from 'react-bootstrap';
import toast from 'react-hot-toast';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data for users
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUsers([
        { id: 1, username: 'admin', email: 'admin@business.com', firstName: 'Admin', lastName: 'User', role: 'Admin', isActive: true },
        { id: 2, username: 'manager', email: 'manager@business.com', firstName: 'Manager', lastName: 'User', role: 'Manager', isActive: true },
        { id: 3, username: 'staff', email: 'staff@business.com', firstName: 'Staff', lastName: 'User', role: 'Staff', isActive: true }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleEdit = (user) => {
    setCurrentUser(user);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    toast((t) => (
      <span>
        Are you sure you want to delete this user?
        <div className="mt-2 d-flex gap-2">
          <Button size="sm" variant="danger" onClick={() => {
            setUsers(users.filter(user => user.id !== id));
            toast.dismiss(t.id);
            toast.success('User deleted successfully');
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
                        <td>{user.firstName} {user.lastName}</td>
                        <td>
                          <span className={`badge bg-${user.role === 'Admin' ? 'danger' : user.role === 'Manager' ? 'warning' : 'success'} fw-normal`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${user.isActive ? 'bg-success' : 'bg-secondary'} fw-normal`}>
                            {user.isActive ? 'Active' : 'Inactive'}
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
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Username</Form.Label>
              <Form.Control
                type="text"
                defaultValue={currentUser?.username || ''}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Email</Form.Label>
              <Form.Control
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
                    type="text"
                    defaultValue={currentUser?.firstName || ''}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    defaultValue={currentUser?.lastName || ''}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Role</Form.Label>
              <Form.Select defaultValue={currentUser?.role || 'Staff'}>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Staff">Staff</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="status-switch"
                label="Active Account"
                defaultChecked={currentUser?.isActive !== false}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary">
            {currentUser ? 'Save Changes' : 'Create User'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Users;