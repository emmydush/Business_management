import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, ProgressBar, Form, InputGroup, Modal } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiCalendar, FiUsers, FiDollarSign, FiFolder, FiActivity, FiCheckCircle, FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { projectsAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';


const Projects = () => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { formatCurrency } = useCurrency();

  const [newProject, setNewProject] = useState({
    title: '',
    client: '',
    budget: '',
    deadline: '',
    description: '',
    status: 'new',
    progress: 0,
    members: 1
  });

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editProjectData, setEditProjectData] = useState({
    title: '',
    client: '',
    budget: '',
    deadline: '',
    description: '',
    status: '',
    progress: 0,
    members: 1
  });

  const navigate = useNavigate();

  const openEditModal = (project) => {
    setEditingProject(project);
    setEditProjectData({
      title: project.title || '',
      client: project.client || '',
      budget: project.budget || 0,
      deadline: project.deadline || '',
      description: project.description || '',
      status: project.status || 'new',
      progress: project.progress || 0,
      members: project.members || 1
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditProjectData({ ...editProjectData, [name]: value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingProject) return;

    try {
      const payload = {
        ...editProjectData,
        budget: parseFloat(editProjectData.budget) || 0,
        progress: parseInt(editProjectData.progress) || 0,
        members: parseInt(editProjectData.members) || 1
      };
      await projectsAPI.updateProject(editingProject.id, payload);
      toast.success('Project updated successfully!');
      setShowEditModal(false);
      setEditingProject(null);
      fetchProjects();
    } catch (err) {
      console.error('Error updating project:', err);
      toast.error('Failed to update project. Please try again.');
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getProjects();
      setProjects(response.data.projects || response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Using demo data.');
      // Set demo data as fallback
      setProjects([
        { id: 1, title: 'Website Redesign', client: 'Acme Corp', budget: 15000, spent: 8500, deadline: '2026-03-15', status: 'in-progress', progress: 65, members: 4, description: 'Overhaul of the corporate website with new branding and e-commerce features.' },
        { id: 2, title: 'Mobile App Development', client: 'StartUp Inc', budget: 45000, spent: 12000, deadline: '2026-06-30', status: 'planning', progress: 15, members: 6, description: 'Native iOS and Android application for customer loyalty program.' },
        { id: 3, title: 'Internal Dashboard', client: 'Internal', budget: 5000, spent: 4800, deadline: '2025-12-31', status: 'completed', progress: 100, members: 2, description: 'Admin panel for tracking sales and inventory metrics.' },
        { id: 4, title: 'Marketing Campaign', client: 'Global Retail', budget: 25000, spent: 20000, deadline: '2026-02-28', status: 'active', progress: 80, members: 3, description: 'Q1 digital marketing push across social media and search.' },
        { id: 5, title: 'Cloud Migration', client: 'Data Systems', budget: 80000, spent: 35000, deadline: '2026-09-15', status: 'on-hold', progress: 40, members: 5, description: 'Migrating legacy on-premise servers to AWS infrastructure.' },
        { id: 6, title: 'Security Audit', client: 'FinTech Ltd', budget: 12000, spent: 0, deadline: '2026-01-20', status: 'new', progress: 0, members: 2, description: 'Comprehensive security review and penetration testing.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject({ ...newProject, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const projectData = {
      ...newProject,
      budget: parseFloat(newProject.budget) || 0,
      progress: parseInt(newProject.progress) || 0,
      members: parseInt(newProject.members) || 1
    };
    
    try {
      await projectsAPI.createProject(projectData);
      fetchProjects(); // Refresh the list
      toast.success('Project created successfully!');
    } catch (err) {
      console.error('Error creating project:', err);
      toast.error('Failed to create project. Please try again.');
    }
    
    handleClose();
    setNewProject({
      title: '',
      client: '',
      budget: '',
      deadline: '',
      description: '',
      status: 'new',
      progress: 0,
      members: 1
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectsAPI.deleteProject(id);
        fetchProjects(); // Refresh the list
        toast.success('Project deleted successfully!');
      } catch (err) {
        console.error('Error deleting project:', err);
        toast.error('Failed to delete project. Please try again.');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <Badge bg="success-light" className="text-success border-0">Completed</Badge>;
      case 'in-progress': return <Badge bg="primary-light" className="text-primary border-0">In Progress</Badge>;
      case 'active': return <Badge bg="info-light" className="text-info border-0">Active</Badge>;
      case 'planning': return <Badge bg="warning-light" className="text-warning border-0">Planning</Badge>;
      case 'on-hold': return <Badge bg="secondary-light" className="text-secondary border-0">On Hold</Badge>;
      default: return <Badge bg="light" className="text-dark border">New</Badge>;
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Statuses' || project.status === statusFilter.toLowerCase().replace(' ', '-');
    return matchesSearch && matchesStatus;
  });

  if (loading && projects.length === 0) {
    return (
      <Container fluid className="py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (error && projects.length === 0) {
    return (
      <Container fluid className="py-4">
        <div className="alert alert-danger">
          {error}
          <Button variant="primary" className="ms-3" onClick={fetchProjects}>
            Retry
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Projects</h2>
          <p className="text-muted mb-0">Oversee project progress, budgets, and timelines.</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Button variant="primary" className="d-flex align-items-center shadow-sm" onClick={handleShow}>
            <FiPlus className="me-2" /> New Project
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-primary-light text-primary p-2 rounded-3 me-3">
                  <FiFolder size={20} />
                </div>
                <span className="text-muted fw-medium">Active Projects</span>
              </div>
              <h3 className="fw-bold mb-0">{projects.filter(p => p.status !== 'completed').length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-success-light text-success p-2 rounded-3 me-3">
                  <FiCheckCircle size={20} />
                </div>
                <span className="text-muted fw-medium">Completed</span>
              </div>
              <h3 className="fw-bold mb-0">{projects.filter(p => p.status === 'completed').length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-info-light text-info p-2 rounded-3 me-3">
                  <FiDollarSign size={20} />
                </div>
                <span className="text-muted fw-medium">Total Budget</span>
              </div>
              <h3 className="fw-bold mb-0">{formatCurrency(projects.reduce((acc, curr) => acc + curr.budget, 0))}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-warning-light text-warning p-2 rounded-3 me-3">
                  <FiUsers size={20} />
                </div>
                <span className="text-muted fw-medium">Team Members</span>
              </div>
              <h3 className="fw-bold mb-0">{projects.reduce((acc, curr) => acc + curr.members, 0)}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Toolbar */}
      <Card className="border-0 shadow-sm mb-4 overflow-hidden">
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center">
            <Col md={6}>
              <InputGroup className="bg-light rounded-3 border-0">
                <InputGroup.Text className="bg-transparent border-0 pe-0">
                  <FiSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by project name or client..."
                  className="bg-transparent border-0 py-2 shadow-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select
                className="bg-light border-0 py-2 shadow-none rounded-3"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All Statuses</option>
                <option>Active</option>
                <option>In Progress</option>
                <option>Planning</option>
                <option>Completed</option>
                <option>On Hold</option>
              </Form.Select>
            </Col>
            <Col md={2} className="text-end">
              <Button variant="light" className="w-100 border-0 py-2 rounded-3 d-flex align-items-center justify-content-center gap-2">
                <FiFilter /> Filter
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Projects Grid */}
      <Row className="g-4">
        {filteredProjects.map(project => (
          <Col md={6} lg={4} key={project.id}>
            <Card className="border-0 shadow-sm h-100 project-card transition-all" style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${project.id}`)}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  {getStatusBadge(project.status)}
                  <div className="d-flex gap-2">
                    <Button variant="outline-primary" size="sm" className="d-flex align-items-center" onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}`); }} title="View Details">
                      <FiEye size={16} />
                    </Button>
                    <Button variant="outline-warning" size="sm" className="d-flex align-items-center" onClick={(e) => { e.stopPropagation(); openEditModal(project); }} title="Edit Project">
                      <FiEdit2 size={16} />
                    </Button>
                    <Button variant="outline-danger" size="sm" className="d-flex align-items-center" onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }} title="Delete Project">
                      <FiTrash2 size={16} />
                    </Button>
                  </div>
                </div>

                <h5 className="fw-bold mb-1 text-dark">{project.title}</h5>
                <p className="text-muted small mb-3 d-flex align-items-center">
                  <FiActivity className="me-1" /> {project.client}
                </p>

                <p className="text-secondary small mb-4 line-clamp-2" style={{ minHeight: '40px' }}>
                  {project.description}
                </p>

                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="small fw-bold text-dark">Completion</span>
                    <span className="small fw-bold text-primary">{project.progress}%</span>
                  </div>
                  <ProgressBar
                    now={project.progress}
                    variant={project.progress === 100 ? 'success' : 'primary'}
                    style={{ height: '8px', borderRadius: '4px' }}
                  />
                </div>

                <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-auto">
                  <div className="d-flex align-items-center text-muted small">
                    <FiCalendar className="me-1 text-primary" /> {project.deadline}
                  </div>
                  <div className="d-flex align-items-center text-muted small">
                    <FiUsers className="me-1 text-primary" /> {project.members} Members
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}

        {/* Add New Project Card Placeholder */}
        <Col md={6} lg={4}>
          <Card
            className="border-0 shadow-sm h-100 border-dashed bg-light d-flex align-items-center justify-content-center cursor-pointer hover-bg-white transition-all"
            style={{ borderStyle: 'dashed', minHeight: '300px', borderWidth: '2px' }}
            onClick={handleShow}
          >
            <Card.Body className="text-center">
              <div className="bg-white rounded-circle p-3 d-inline-block mb-3 shadow-sm text-primary">
                <FiPlus size={24} />
              </div>
              <h6 className="fw-bold text-dark">Create New Project</h6>
              <p className="text-muted small mb-0">Start a new business initiative</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* New Project Modal */}
      <Modal show={showModal} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton className="border-0 px-4 pt-4">
          <Modal.Title className="fw-bold">Create New Project</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Project Title</Form.Label>
                  <Form.Control
                    name="title"
                    value={newProject.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Q3 Marketing Strategy"
                    className="py-2"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Client Name</Form.Label>
                  <Form.Control
                    name="client"
                    value={newProject.client}
                    onChange={handleInputChange}
                    placeholder="Client or Internal Dept"
                    className="py-2"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Budget ($)</Form.Label>
                  <Form.Control
                    name="budget"
                    type="number"
                    value={newProject.budget}
                    onChange={handleInputChange}
                    placeholder="5000"
                    className="py-2"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Deadline</Form.Label>
                  <Form.Control
                    name="deadline"
                    type="date"
                    value={newProject.deadline}
                    onChange={handleInputChange}
                    className="py-2"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Initial Progress (%)</Form.Label>
                  <Form.Control
                    name="progress"
                    type="number"
                    min="0"
                    max="100"
                    value={newProject.progress}
                    onChange={handleInputChange}
                    className="py-2"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Description</Form.Label>
                  <Form.Control
                    name="description"
                    as="textarea"
                    rows={3}
                    value={newProject.description}
                    onChange={handleInputChange}
                    placeholder="Brief overview of project goals..."
                    className="py-2"
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="light" onClick={handleClose} className="px-4 py-2 border">Cancel</Button>
              <Button variant="primary" type="submit" className="px-4 py-2 shadow-sm">Create Project</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit Project Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 px-4 pt-4">
          <Modal.Title className="fw-bold">Edit Project</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleEditSubmit}>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Project Title</Form.Label>
                  <Form.Control
                    name="title"
                    value={editProjectData.title}
                    onChange={handleEditInputChange}
                    placeholder="e.g. Q3 Marketing Strategy"
                    className="py-2"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Client Name</Form.Label>
                  <Form.Control
                    name="client"
                    value={editProjectData.client}
                    onChange={handleEditInputChange}
                    placeholder="Client or Internal Dept"
                    className="py-2"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Budget ($)</Form.Label>
                  <Form.Control
                    name="budget"
                    type="number"
                    value={editProjectData.budget}
                    onChange={handleEditInputChange}
                    placeholder="5000"
                    className="py-2"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Deadline</Form.Label>
                  <Form.Control
                    name="deadline"
                    type="date"
                    value={editProjectData.deadline}
                    onChange={handleEditInputChange}
                    className="py-2"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Progress (%)</Form.Label>
                  <Form.Control
                    name="progress"
                    type="number"
                    min="0"
                    max="100"
                    value={editProjectData.progress}
                    onChange={handleEditInputChange}
                    className="py-2"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Description</Form.Label>
                  <Form.Control
                    name="description"
                    as="textarea"
                    rows={3}
                    value={editProjectData.description}
                    onChange={handleEditInputChange}
                    placeholder="Brief overview of project goals..."
                    className="py-2"
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="light" onClick={() => setShowEditModal(false)} className="px-4 py-2 border">Cancel</Button>
              <Button variant="primary" type="submit" className="px-4 py-2 shadow-sm">Save Changes</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        .bg-primary-light { background-color: rgba(37, 99, 235, 0.1); }
        .bg-success-light { background-color: rgba(16, 185, 129, 0.1); }
        .bg-info-light { background-color: rgba(6, 182, 212, 0.1); }
        .bg-warning-light { background-color: rgba(245, 158, 11, 0.1); }
        .bg-secondary-light { background-color: rgba(100, 116, 139, 0.1); }
        
        .project-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .border-dashed {
          border: 2px dashed #e2e8f0 !important;
        }
        
        .transition-all {
          transition: all 0.3s ease;
        }
      `}} />
    </Container>
  );
};

export default Projects;