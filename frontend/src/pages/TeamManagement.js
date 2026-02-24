import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge, Nav, Tab } from 'react-bootstrap';
import { FiEdit2, FiTrash2, FiPlus, FiUser, FiShield, FiCheck, FiX, FiChevronRight, FiGrid, FiShoppingCart, FiPackage, FiUsers, FiDollarSign, FiFolder, FiBarChart2, FiSettings, FiRotateCcw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { settingsAPI } from '../services/api';
import '../components/auth/AuthModal.css';

const TeamManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionMeta, setPermissionMeta] = useState(null);
  
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

  // Permission types
  const permissionTypes = [
    { value: 'view', label: 'View', description: 'View data and reports', icon: FiGrid },
    { value: 'create', label: 'Create', description: 'Add new records', icon: FiPlus },
    { value: 'edit', label: 'Edit', description: 'Modify existing records', icon: FiEdit2 },
    { value: 'delete', label: 'Delete', description: 'Remove records', icon: FiTrash2 },
    { value: 'export', label: 'Export', description: 'Export data', icon: FiGrid },
    { value: 'approve', label: 'Approve', description: 'Approve requests', icon: FiCheck },
    { value: 'all', label: 'Full Access', description: 'All permissions', icon: FiShield }
  ];

  // Module categories with icons
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'core': return <FiGrid size={16} />;
      case 'sales': return <FiShoppingCart size={16} />;
      case 'inventory': return <FiPackage size={16} />;
      case 'hr': return <FiUsers size={16} />;
      case 'finance': return <FiDollarSign size={16} />;
      case 'operations': return <FiFolder size={16} />;
      case 'reports': return <FiBarChart2 size={16} />;
      case 'admin': return <FiSettings size={16} />;
      default: return <FiGrid size={16} />;
    }
  };

  // Role options
  const roleOptions = [
    { value: 'admin', label: 'Admin', description: 'Full access to manage business', color: 'danger' },
    { value: 'manager', label: 'Manager', description: 'Can manage team and resources', color: 'warning' },
    { value: 'staff', label: 'Staff', description: 'Basic access based on permissions', color: 'success' }
  ];

  useEffect(() => {
    fetchUsers();
    fetchPermissionMeta();
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

  const fetchPermissionMeta = async () => {
    try {
      const response = await fetch('/api/settings/permissions/meta', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPermissionMeta(data);
      }
    } catch (err) {
      console.error('Failed to fetch permission metadata:', err);
      // Use fallback data
      setPermissionMeta({
        modules: getDefaultModules(),
        permission_types: permissionTypes,
        role_defaults: getDefaultRolePermissions()
      });
    }
  };

  const getDefaultModules = () => [
    { value: 'dashboard', label: 'Dashboard', category: 'core' },
    { value: 'sales', label: 'Sales', category: 'sales' },
    { value: 'pos', label: 'Point of Sale', category: 'sales' },
    { value: 'invoices', label: 'Invoices', category: 'sales' },
    { value: 'customers', label: 'Customers', category: 'sales' },
    { value: 'inventory', label: 'Inventory', category: 'inventory' },
    { value: 'products', label: 'Products', category: 'inventory' },
    { value: 'warehouse', label: 'Warehouse', category: 'inventory' },
    { value: 'purchases', label: 'Purchases', category: 'inventory' },
    { value: 'suppliers', label: 'Suppliers', category: 'inventory' },
    { value: 'hr', label: 'Human Resources', category: 'hr' },
    { value: 'employees', label: 'Employees', category: 'hr' },
    { value: 'attendance', label: 'Attendance', category: 'hr' },
    { value: 'leave', label: 'Leave Management', category: 'hr' },
    { value: 'payroll', label: 'Payroll', category: 'hr' },
    { value: 'expenses', label: 'Expenses', category: 'finance' },
    { value: 'payments', label: 'Payments', category: 'finance' },
    { value: 'taxes', label: 'Taxes', category: 'finance' },
    { value: 'projects', label: 'Projects', category: 'operations' },
    { value: 'tasks', label: 'Tasks', category: 'operations' },
    { value: 'documents', label: 'Documents', category: 'operations' },
    { value: 'assets', label: 'Assets', category: 'operations' },
    { value: 'reports', label: 'Reports', category: 'reports' },
    { value: 'sales_reports', label: 'Sales Reports', category: 'reports' },
    { value: 'inventory_reports', label: 'Inventory Reports', category: 'reports' },
    { value: 'financial_reports', label: 'Financial Reports', category: 'reports' },
    { value: 'settings', label: 'Settings', category: 'admin' },
    { value: 'users', label: 'User Management', category: 'admin' },
    { value: 'roles', label: 'Roles', category: 'admin' },
    { value: 'workflows', label: 'Workflows', category: 'admin' },
    { value: 'branches', label: 'Branches', category: 'admin' },
    { value: 'leads', label: 'Leads', category: 'sales' },
    { value: 'services', label: 'Services', category: 'operations' },
    { value: 'returns', label: 'Returns', category: 'sales' }
  ];

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

  const handleModulePermissionToggle = (module, permission) => {
    setFormData(prev => {
      const currentPerms = prev.permissions[module] || [];
      let newPerms;
      
      if (permission === 'all') {
        // Toggle full access
        if (currentPerms.includes('all')) {
          newPerms = [];
        } else {
          newPerms = ['all'];
        }
      } else {
        // Toggle specific permission
        if (currentPerms.includes('all')) {
          // If has full access, remove it and add specific
          newPerms = [permission];
        } else if (currentPerms.includes(permission)) {
          newPerms = currentPerms.filter(p => p !== permission);
        } else {
          newPerms = [...currentPerms, permission];
        }
      }
      
      // Remove empty modules
      const newPermissions = { ...prev.permissions };
      if (newPerms.length === 0) {
        delete newPermissions[module];
      } else {
        newPermissions[module] = newPerms;
      }
      
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleModuleToggle = (module) => {
    setFormData(prev => {
      const newPermissions = { ...prev.permissions };
      if (newPermissions[module]) {
        delete newPermissions[module];
      } else {
        newPermissions[module] = ['view'];
      }
      return { ...prev, permissions: newPermissions };
    });
  };

  const hasModulePermission = (module, permission) => {
    const perms = formData.permissions[module] || [];
    return perms.includes('all') || perms.includes(permission);
  };

  const selectAllPermissions = () => {
    const modules = permissionMeta?.modules || getDefaultModules();
    const allPerms = {};
    modules.forEach(m => {
      allPerms[m.value] = ['all'];
    });
    setFormData(prev => ({ ...prev, permissions: allPerms }));
  };

  const clearAllPermissions = () => {
    setFormData(prev => ({ ...prev, permissions: {} }));
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

  const formatPermissions = (permissions) => {
    if (!permissions || typeof permissions !== 'object') return [];
    return Object.entries(permissions).map(([module, perms]) => ({
      module,
      permissions: perms
    }));
  };

  // Group modules by category
  const getModulesByCategory = () => {
    const modules = permissionMeta?.modules || getDefaultModules();
    const categories = {};
    
    modules.forEach(module => {
      const cat = module.category || 'core';
      if (!categories[cat]) {
        categories[cat] = [];
      }
      categories[cat].push(module);
    });
    
    return categories;
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
      <Modal show={showModal} onHide={handleCloseModal} centered size="xl" className="colored-modal">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">
            {currentUser ? 'Edit Team Member' : 'Add Team Member'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <Tab.Container defaultActiveKey="basic">
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link eventKey="basic">
                  <FiUser className="me-2" /> Basic Info
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="permissions">
                  <FiShield className="me-2" /> Permissions
                </Nav.Link>
              </Nav.Item>
            </Nav>
            
            <Tab.Content>
              {/* Basic Information Tab */}
              <Tab.Pane eventKey="basic">
                <Form onSubmit={handleSave}>
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
                </Form>
              </Tab.Pane>
              
              {/* Permissions Tab */}
              <Tab.Pane eventKey="permissions">
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0">Access Permissions</h6>
                    <div className="d-flex gap-2">
                      <Button variant="outline-primary" size="sm" onClick={selectAllPermissions}>
                        Select All
                      </Button>
                      <Button variant="outline-secondary" size="sm" onClick={clearAllPermissions}>
                        Clear All
                      </Button>
                      <Button variant="outline-info" size="sm" onClick={() => handleRoleChange(formData.role)}>
                        <FiRotateCcw size={14} className="me-1" /> Reset to Role Defaults
                      </Button>
                    </div>
                  </div>
                  <p className="text-muted small mb-3">
                    Select which modules and actions this team member can access. 
                    Administrators have full access by default.
                  </p>
                  
                  {/* Permission Controls by Category */}
                  <div className="permission-categories">
                    {Object.entries(getModulesByCategory()).map(([category, modules]) => (
                      <div key={category} className="mb-4">
                        <div className="d-flex align-items-center mb-2">
                          <span className="me-2">{getCategoryIcon(category)}</span>
                          <h6 className="mb-0 text-capitalize">{category}</h6>
                        </div>
                        <Row>
                          {modules.map(module => (
                            <Col md={6} lg={4} key={module.value} className="mb-2">
                              <div 
                                className={`permission-module-card p-2 rounded border ${
                                  formData.permissions[module.value] ? 'border-primary bg-light' : ''
                                }`}
                              >
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div 
                                    className="d-flex align-items-center"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleModuleToggle(module.value)}
                                  >
                                    <Form.Check
                                      type="checkbox"
                                      checked={!!formData.permissions[module.value]}
                                      onChange={() => {}}
                                      className="me-2"
                                    />
                                    <div>
                                      <div className="fw-bold small">{module.label}</div>
                                    </div>
                                  </div>
                                  {formData.permissions[module.value]?.includes('all') && (
                                    <Badge bg="primary" className="small">Full</Badge>
                                  )}
                                </div>
                                
                                {formData.permissions[module.value] && (
                                  <div className="permission-toggles">
                                    <div className="d-flex flex-wrap gap-1">
                                      {permissionTypes.slice(0, -1).map(perm => (
                                        <Button
                                          key={perm.value}
                                          variant={hasModulePermission(module.value, perm.value) ? 'primary' : 'outline-secondary'}
                                          size="sm"
                                          className="py-0 px-2"
                                          style={{ fontSize: '0.7rem' }}
                                          onClick={() => handleModulePermissionToggle(module.value, perm.value)}
                                        >
                                          {perm.label}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    ))}
                  </div>
                </div>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
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
