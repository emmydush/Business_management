import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import { FiFile, FiCheckCircle, FiActivity, FiBox, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Operations = () => {
  const navigate = useNavigate();

  const modules = [
    { title: 'Documents', desc: 'Company file repository and sharing', icon: <FiFile size={24} />, path: '/documents', color: 'primary' },
    { title: 'Approvals', desc: 'Workflow requests and authorizations', icon: <FiCheckCircle size={24} />, path: '/approvals', color: 'success' },
    { title: 'Workflows', desc: 'Process automation and tracking', icon: <FiActivity size={24} />, path: '/workflows', color: 'info' },
    { title: 'Asset Management', desc: 'Equipment and physical asset tracking', icon: <FiBox size={24} />, path: '/assets', color: 'warning' },
  ];

  return (
    <div className="operations-dashboard">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Operations & Control</h2>
        <p className="text-muted">Manage business processes, documentation, and company assets.</p>
      </div>

      <Row className="g-4">
        {modules.map((mod, idx) => (
          <Col md={6} key={idx}>
            <Card className="border-0 shadow-sm h-100 hover-shadow transition" style={{ cursor: 'pointer' }} onClick={() => navigate(mod.path)}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center">
                  <div className={`bg-${mod.color} bg-opacity-10 text-${mod.color} p-3 rounded me-4`}>
                    {mod.icon}
                  </div>
                  <div className="flex-grow-1">
                    <h5 className="fw-bold text-dark mb-1">{mod.title}</h5>
                    <p className="text-muted small mb-0">{mod.desc}</p>
                  </div>
                  <FiArrowRight className="text-muted" size={20} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="mt-5 g-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="fw-bold mb-0">Active Projects Overview</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center py-5">
                <div className="text-muted mb-3">Project management dashboard is coming soon.</div>
                <Button variant="outline-primary" onClick={() => navigate('/projects')}>Go to Projects</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="border-0 shadow-sm bg-dark text-white h-100">
            <Card.Body className="p-4 d-flex flex-column justify-content-center">
              <h5 className="fw-bold mb-3">Operational Efficiency</h5>
              <div className="display-4 fw-bold mb-2 text-success">92%</div>
              <p className="small opacity-75">Your operational efficiency has improved by 5% this month due to automated workflows.</p>
              <Button variant="light" size="sm" className="mt-3 fw-bold" onClick={() => navigate('/workflows')}>Optimize More</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Operations;