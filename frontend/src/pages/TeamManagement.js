import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { FiEdit2, FiTrash2, FiPlus, FiUser, FiShield, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { settingsAPI } from '../services/api';

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
    permissions: []
  });

  // Available modules for permissions
  const availableModules = [
    { value: 'dashboard', label: 'Dashboard', description: 'View dashboard and analytics' },
    { value: 'sales', label: 'Sales', description: 'Access sales module' },
    { value: 'inventory', label: 'Inventory', description: 'Manage inventory and products' },
    { value: 'purchases', label: 'Purchases', description: 'Access purchases module' },
    { value: 'expenses', label: 'Expenses', description: 'Manage expenses' },
    { value: 'hr', label: 'HR', description: 'Access HR module' },
    { value: 'reports', label: 'Reports', description: 'View and generate reports' },
    { value: 'settings', label: 'Settings', description: 'Access system settings' },
    { value: 'customers', label: 'Customers', description: 'Manage customers' },
    { value: 'suppliers', label: 'Suppliers', description: 'Manage suppliers' },
    { value: 'assets', label: 'Assets', description: 'Manage assets' },
    { value: 'tasks', label: 'Tasks', description: 'Manage tasks' },
    { value: 'projects', label: 'Projects', description: 'Manage projects' },
    { value: 'documents', label: 'Documents', description: 'Manage documents' },
    { value: 'payroll', label: 'Payroll', description: 'Manage payroll' },
    { value: 'attendance', label: 'Attendance', description: 'Track attendance' },
    { value: 'pos', label: 'Point of Sale', description: 'Access POS' },
    { value: 'invoices', label: 'Invoices', description: 'Manage invoices' },
    { value: 'payments', label: 'Payments', description: 'Manage payments' },
    { value: 'taxes', label: 'Taxes', description: 'Manage taxes' }
  ];

  // Role options (business owners can't assign superadmin)
  const roleOptions = [
    { value: 'admin', label: 'Admin', description: 'Full access to manage business' },
    { value: 'manager', label: 'Manager', description: 'Can manage team and resources' },
    { value: 'staff', label: 'Staff', description: 'Basic access based on permissions' }
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

  const handleOpenModal = (user = null) => {
    if (user) {
      setCurrentUser(user);
      setFormData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        role: user.role || 'staff',
        password: '', // Don't show password for editing
        is_active: user.is_active !== false,
        permissions: user.permissions || []
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
        permissions: []
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentUser(null);
  };

  const handlePermissionToggle = (module) => {
    setFormData(prev => {
      const permissions = prev.permissions.includes(module)
        ? prev.permissions.filter(p => p !== module)
        : [...prev.permissions, module];
      return { ...prev, permissions };
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
              await settingsAPI.deleteUser(user.id);
              setUsers(users.filter(u => u.id !== user.id));
              toast.dismiss(t.id);
              toast.success('Team member removed successfully');
            } catch (err) {
              toast.dismiss(t.id);
              console.error('Error removing user:', err);
              toast.error(err.response?.data?.error || 'Failed to remove team member');
            }
          }}>
            Remove
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
                            <div className="d-flex flex-wrap gap-1">
                              {user.permissions && user.permissions.length > 0 ? (
                                user.permissions.slice(0, 3).map((perm, idx) => (
                                  <Badge key={idx} bg="light" text="dark" className="text-capitalize">
                                    {perm}
                                  </Badge>
                                ))
                              ) : (
                                <Badge bg="secondary">No access</Badge>
                              )}
                              {user.permissions && user.permissions.length > 3 && (
                                <Badge bg="info">+{user.permissions.length - 3} more</Badge>
                              )}
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
                                title="Remove User"
                              >
                                <FiTrash2 size={14} className="d-md-none" />
                                <span className="d-none d-md-inline">Remove</span>
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
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg" className="colored-modal">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">
            {currentUser ? 'Edit Team Member' : 'Add Team Member'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <Form onSubmit={handleSave}>
            {/* Basic Information */}
            <div className="mb-4">
              <h6 className="fw-bold text-uppercase text-muted mb-3">Basic Information</h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">First Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Username</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Role</Form.Label>
                    <Form.Select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      {roleOptions.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              {!currentUser && (
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Temporary Password</Form.Label>
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
                </Row>
              )}
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="active-switch"
                  label="Active Account"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              </Form.Group>
            </div>

            {/* Permissions Section */}
            <div className="mb-3">
              <h6 className="fw-bold text-uppercase text-muted mb-3 d-flex align-items-center">
                <FiShield className="me-2" /> Access Permissions
              </h6>
              <p className="text-muted small mb-3">
                Select which modules this team member can access. Administrators have full access by default.
              </p>
              
              <Row>
                {availableModules.map(module => (
                  <Col md={6} lg={4} key={module.value} className="mb-2">
                    <div 
                      className={`permission-card p-2 rounded border ${
                        formData.permissions.includes(module.value) ? 'border-primary bg-light' : ''
                      }`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handlePermissionToggle(module.value)}
                    >
                      <div className="d-flex align-items-center">
                        <Form.Check
                          type="checkbox"
                          checked={formData.permissions.includes(module.value)}
                          onChange={() => {}}
                          className="me-2"
                        />
                        <div>
                          <div className="fw-bold small">{module.label}</div>
                          <div className="text-muted small" style={{ fontSize: '0.7rem' }}>
                            {module.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={handleCloseModal}>
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
            font-weight: bold;
            font-size: 14px;
          }
          
          .permission-card {
            transition: all 0.2s ease;
          }
          
          .permission-card:hover {
            background-color: #f8f9fa;
          }
          
          @media (max-width: 767.98px) {
            .table td {
              padding: 0.75rem 0.5rem !important;
            }
            
            .btn-sm {
              padding: 0.35rem 0.5rem !important;
              font-size: 0.75rem !important;
            }
            
            table {
              font-size: 0.85rem !important;
            }
          }
          
          @media (max-width: 575.98px) {
            .table td {
              padding: 0.5rem 0.3rem !important;
            }
            
            .table th {
              font-size: 0.7rem !important;
            }
            
            .btn-outline-warning,
            .btn-outline-danger {
              display: inline-flex !important;
              align-items: center;
              justify-content: center;
            }
          }
        `
      }} />
    </Container>
  );
};

export default TeamManagement;
