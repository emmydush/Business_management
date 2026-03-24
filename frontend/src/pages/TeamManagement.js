import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge, Alert } from 'react-bootstrap';
import { FiPlus, FiEdit2, FiTrash2, FiUser } from 'react-icons/fi';
import { settingsAPI } from '../services/api';
import toast from 'react-hot-toast';

const TeamManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'staff',
    password: '',
    is_active: true,
    permissions: {} // New format: { module: ['view', 'create', ...] }
  });

  // Role options
  const roleOptions = [
    { value: 'admin', label: 'Admin', description: 'Full access to manage business', color: 'danger' },
    { value: 'manager', label: 'Manager', description: 'Can manage team and resources', color: 'warning' },
    { value: 'staff', label: 'Staff', description: 'Basic access based on permissions', color: 'success' }
  ];

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
      setError('Failed to load team members. Please try again.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultRolePermissions = () => ({
    admin: {},
    manager: {
      dashboard: ['all'],
      sales: ['all'],
      pos: ['all'],
      invoices: ['all'],
      customers: ['view', 'create', 'edit'],
      inventory: ['view', 'create', 'edit'],
      products: ['view', 'create', 'edit'],
      warehouse: ['view'],
      purchases: ['view', 'create', 'edit'],
      suppliers: ['view', 'create'],
      hr: ['view'],
      employees: ['view'],
      attendance: ['view', 'create', 'edit'],
      leave: ['view', 'edit', 'approve'],
      payroll: ['view'],
      expenses: ['all'],
      payments: ['view', 'create'],
      taxes: ['view'],
      projects: ['all'],
      tasks: ['all'],
      documents: ['view', 'create', 'edit'],
      assets: ['view'],
      reports: ['view', 'export'],
      sales_reports: ['view', 'export'],
      inventory_reports: ['view', 'export'],
      financial_reports: ['view'],
      settings: ['view'],
      users: ['view'],
      leads: ['all'],
      services: ['view', 'create', 'edit'],
      returns: ['view', 'create', 'edit', 'approve']
    },
    staff: {
      dashboard: ['view'],
      sales: ['view', 'create'],
      pos: ['view', 'create'],
      invoices: ['view', 'create'],
      customers: ['view'],
      inventory: ['view'],
      products: ['view'],
      warehouse: ['view'],
      purchases: ['view'],
      suppliers: ['view'],
      hr: ['view'],
      employees: ['view'],
      attendance: ['view', 'create'],
      leave: ['view', 'create'],
      payroll: ['view'],
      expenses: ['view', 'create'],
      payments: ['view', 'create'],
      taxes: ['view'],
      projects: ['view'],
      tasks: ['view', 'create', 'edit'],
      documents: ['view', 'create'],
      assets: ['view'],
      reports: ['view'],
      leads: ['view', 'create'],
      services: ['view', 'create'],
      returns: ['view']
    }
  });

  const handleOpenModal = (user = null) => {
    if (user) {
      setCurrentUser(user);
      // Convert array format to object format if needed
      let perms = user.permissions || {};
      if (Array.isArray(user.permissions)) {
        // Old format - convert to new
        perms = {};
        user.permissions.forEach(perm => {
          perms[perm] = ['view'];
        });
      }
      setFormData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        role: user.role || 'staff',
        password: '',
        is_active: user.is_active !== false,
        permissions: perms
      });
    } else {
      setCurrentUser(null);
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'staff',
        password: '',
        is_active: true,
        permissions: {}
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentUser(null);
  };

  const handleRoleChange = (role) => {
    setFormData(prev => {
      const newData = { ...prev, role };
      
      // Apply role-based default permissions
      const roleDefaults = getDefaultRolePermissions();
      if (roleDefaults[role]) {
        newData.permissions = { ...roleDefaults[role] };
      }
      
      return newData;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const userData = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        role: formData.role,
        is_active: formData.is_active,
        permissions: formData.permissions
      };

      // Only include password for new users
      if (!currentUser && formData.password) {
        userData.password = formData.password;
      }

      if (currentUser) {
        await settingsAPI.updateUser(currentUser.id, userData);
        toast.success('Team member updated successfully');
      } else {
        await settingsAPI.createUser(userData);
        toast.success('Team member added successfully');
      }
      
      fetchUsers();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving user:', err);
      toast.error(err.response?.data?.error || 'Failed to save team member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (user) => {
    toast((t) => (
      <span>
        Are you sure you want to remove <strong>{user.first_name} {user.last_name}</strong> from your team?
        <div className="mt-2 d-flex gap-2">
          <Button size="sm" variant="danger" onClick={async () => {
            try {
              await settingsAPI.updateUser(user.id, { is_active: false });
              setUsers(users.map(u => 
                u.id === user.id ? { ...u, is_active: false } : u
              ));
              toast.dismiss(t.id);
              toast.success('Team member deactivated successfully');
            } catch (err) {
              toast.dismiss(t.id);
              console.error('Error removing user:', err);
              toast.error(err.response?.data?.error || 'Failed to deactivate team member');
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

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'danger',
      manager: 'warning',
      staff: 'success'
    };
    return colors[role] || 'secondary';
  };

  const getPermissionSummary = (permissions) => {
    if (!permissions || Object.keys(permissions).length === 0) {
      return 'No access';
    }
    
    const moduleCount = Object.keys(permissions).length;
    const fullAccess = Object.values(permissions).some(p => p.includes('all'));
    
    if (fullAccess) {
      return 'Full Access';
    }
    
    return `${moduleCount} module${moduleCount > 1 ? 's' : ''}`;
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
              <div>
                <h5 className="mb-0 fw-bold">Team Management</h5>
                <p className="text-muted small mb-0">Manage your team members and their access permissions</p>
              </div>
              <Button variant="primary" onClick={() => handleOpenModal()}>
                <FiPlus className="me-2" /> Add Team Member
              </Button>
            </Card.Header>
            {error && <div className="p-3"><Alert variant="warning">{error}</Alert></div>}
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4 border-0">Member</th>
                      <th className="border-0">Email</th>
                      <th className="border-0">Role</th>
                      <th className="border-0">Permissions</th>
                      <th className="border-0">Status</th>
                      <th className="pe-4 border-0 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5">
                          <FiUser size={48} className="text-muted mb-3" />
                          <h6 className="fw-bold">No team members yet</h6>
                          <p className="text-muted mb-0">Add your first team member to get started</p>
                        </td>
                      </tr>
                    ) : (
                      users.map(user => (
                        <tr key={user.id}>
                          <td className="ps-4">
                            <div className="d-flex align-items-center">
                              <div className="avatar-circle bg-primary text-white me-2">
                                {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                              </div>
                              <div>
                                <div className="fw-bold">{user.first_name} {user.last_name}</div>
                                <div className="small text-muted">@{user.username}</div>
                              </div>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <Badge bg={getRoleBadge(user.role)} className="text-capitalize">
                              {user.role}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="small">{getPermissionSummary(user.permissions)}</span>
                            </div>
                          </td>
                          <td>
                            <Badge bg={user.is_active ? 'success' : 'secondary'}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="pe-2 pe-md-4 text-end">
                            <div className="d-flex gap-1 gap-md-2 justify-content-end">
                              <Button
                                variant="outline-warning"
                                size="sm"
                                className="d-flex align-items-center"
                                onClick={() => handleOpenModal(user)}
                                title="Edit User"
                              >
                                <FiEdit2 size={14} className="d-md-none" />
                                <span className="d-none d-md-inline">Edit</span>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="d-flex align-items-center"
                                onClick={() => handleDelete(user)}
                                title="Deactivate User"
                              >
                                <FiTrash2 size={14} className="d-md-none" />
                                <span className="d-none d-md-inline">Deactivate</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add/Edit User Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{currentUser ? 'Edit Team Member' : 'Add Team Member'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form onSubmit={handleSave}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">First Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="First name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Last name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Username"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Role</Form.Label>
                  <Form.Select
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                  >
                    {roleOptions.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label} - {role.description}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              {!currentUser && (
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">Temporary Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Leave blank to generate auto-password"
                    />
                    <Form.Text className="text-muted">
                      If left blank, a temporary password will be sent to the user via email.
                    </Form.Text>
                  </Form.Group>
                </Col>
              )}
              <Col md={12}>
                <Form.Group>
                  <Form.Check
                    type="checkbox"
                    id="active-switch"
                    label="Active Account"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={handleCloseModal} disabled={saving}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={saving} 
            onClick={handleSave}
          >
            {saving ? 'Processing...' : (currentUser ? 'Save Changes' : 'Add Team Member')}
          </Button>
        </Modal.Footer>
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
          .avatar-circle {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
          }
          .permission-module-card {
            transition: all 0.2s ease;
          }
          .permission-module-card:hover {
            border-color: #0d6efd !important;
          }
          .permission-toggles .btn {
            transition: all 0.15s ease;
          }
          .nav-tabs .nav-link {
            border: none;
            color: #6c757d;
            font-weight: 500;
          }
          .nav-tabs .nav-link.active {
            color: #0d6efd;
            border-bottom: 2px solid #0d6efd;
          }
          .nav-tabs .nav-link:hover {
            border-color: transparent;
          }
        `
      }} />
    </Container>
  );
};

export default TeamManagement;
