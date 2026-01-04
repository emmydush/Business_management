import React, { useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, ProgressBar, Dropdown, Form, InputGroup } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiCalendar, FiUsers, FiDollarSign, FiFolder, FiActivity } from 'react-icons/fi';

const Projects = () => {
  const [projects, setProjects] = useState([
    { id: 1, title: 'Website Redesign', client: 'Acme Corp', budget: 15000, spent: 8500, deadline: '2026-03-15', status: 'in-progress', progress: 65, members: 4, description: 'Overhaul of the corporate website with new branding and e-commerce features.' },
    { id: 2, title: 'Mobile App Development', client: 'StartUp Inc', budget: 45000, spent: 12000, deadline: '2026-06-30', status: 'planning', progress: 15, members: 6, description: 'Native iOS and Android application for customer loyalty program.' },
    { id: 3, title: 'Internal Dashboard', client: 'Internal', budget: 5000, spent: 4800, deadline: '2025-12-31', status: 'completed', progress: 100, members: 2, description: 'Admin panel for tracking sales and inventory metrics.' },
    { id: 4, title: 'Marketing Campaign', client: 'Global Retail', budget: 25000, spent: 20000, deadline: '2026-02-28', status: 'active', progress: 80, members: 3, description: 'Q1 digital marketing push across social media and search.' },
    { id: 5, title: 'Cloud Migration', client: 'Data Systems', budget: 80000, spent: 35000, deadline: '2026-09-15', status: 'on-hold', progress: 40, members: 5, description: 'Migrating legacy on-premise servers to AWS infrastructure.' },
    { id: 6, title: 'Security Audit', client: 'FinTech Ltd', budget: 12000, spent: 0, deadline: '2026-01-20', status: 'new', progress: 0, members: 2, description: 'Comprehensive security review and penetration testing.' },
  ]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <Badge bg="success">Completed</Badge>;
      case 'in-progress': return <Badge bg="primary">In Progress</Badge>;
      case 'active': return <Badge bg="info">Active</Badge>;
      case 'planning': return <Badge bg="warning" text="dark">Planning</Badge>;
      case 'on-hold': return <Badge bg="secondary">On Hold</Badge>;
      default: return <Badge bg="light" text="dark" className="border">New</Badge>;
    }
  };

  return (
    <Container fluid className="p-0">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Projects</h2>
          <p className="text-muted mb-0">Oversee project progress, budgets, and timelines.</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Button variant="primary" className="d-flex align-items-center">
            <FiPlus className="me-2" /> New Project
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                  <FiFolder className="text-primary" size={20} />
                </div>
                <span className="text-muted fw-medium">Active Projects</span>
              </div>
              <h3 className="fw-bold mb-0">{projects.filter(p => p.status !== 'completed' && p.status !== 'on-hold').length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                  <FiActivity className="text-success" size={20} />
                </div>
                <span className="text-muted fw-medium">Completed</span>
              </div>
              <h3 className="fw-bold mb-0">{projects.filter(p => p.status === 'completed').length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                  <FiDollarSign className="text-info" size={20} />
                </div>
                <span className="text-muted fw-medium">Total Budget</span>
              </div>
              <h3 className="fw-bold mb-0">${projects.reduce((acc, curr) => acc + curr.budget, 0).toLocaleString()}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                  <FiUsers className="text-warning" size={20} />
                </div>
                <span className="text-muted fw-medium">Total Members</span>
              </div>
              <h3 className="fw-bold mb-0">{projects.reduce((acc, curr) => acc + curr.members, 0)}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Toolbar */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <FiSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control placeholder="Search projects..." className="bg-light border-start-0 ps-0" />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select className="bg-light border-0">
                <option>All Clients</option>
                <option>Internal</option>
                <option>External</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select className="bg-light border-0">
                <option>All Statuses</option>
                <option>Active</option>
                <option>Completed</option>
                <option>On Hold</option>
              </Form.Select>
            </Col>
            <Col md={2} className="text-end">
              <Button variant="outline-light" className="text-dark border">
                <FiFilter className="me-2" /> Filter
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Projects Grid */}
      <Row className="g-4">
        {projects.map(project => (
          <Col md={6} lg={4} key={project.id}>
            <Card className="border-0 shadow-sm h-100 hover-shadow transition-all">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  {getStatusBadge(project.status)}
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                      <FiMoreVertical />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item>View Details</Dropdown.Item>
                      <Dropdown.Item>Edit Project</Dropdown.Item>
                      <Dropdown.Item className="text-danger">Archive</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>

                <h5 className="fw-bold mb-1">{project.title}</h5>
                <p className="text-muted small mb-3">{project.client}</p>

                <p className="text-secondary small mb-4" style={{ minHeight: '40px' }}>
                  {project.description}
                </p>

                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="small fw-bold text-dark">Progress</span>
                    <span className="small text-muted">{project.progress}%</span>
                  </div>
                  <ProgressBar now={project.progress} variant={project.progress === 100 ? 'success' : 'primary'} style={{ height: '6px' }} />
                </div>

                <div className="d-flex justify-content-between align-items-center border-top pt-3">
                  <div className="d-flex align-items-center text-muted small">
                    <FiCalendar className="me-1" /> {project.deadline}
                  </div>
                  <div className="d-flex align-items-center text-muted small">
                    <FiUsers className="me-1" /> {project.members} Members
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}

        {/* Add New Project Card Placeholder */}
        <Col md={6} lg={4}>
          <Card className="border-0 shadow-sm h-100 border-dashed bg-light d-flex align-items-center justify-content-center cursor-pointer hover-bg-white transition-all" style={{ borderStyle: 'dashed', minHeight: '300px' }}>
            <Card.Body className="text-center">
              <div className="bg-white rounded-circle p-3 d-inline-block mb-3 shadow-sm">
                <FiPlus size={24} className="text-primary" />
              </div>
              <h6 className="fw-bold text-dark">Create New Project</h6>
              <p className="text-muted small mb-0">Start a new initiative</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Projects;