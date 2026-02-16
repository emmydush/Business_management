import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { FiUsers, FiClock, FiCalendar, FiAward, FiGrid, FiArrowRight, FiLock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import SubscriptionUpgradeModal from '../components/SubscriptionUpgradeModal';
import { hrAPI } from '../services/api';

const HR = () => {
  const navigate = useNavigate();
  const [featureError, setFeatureError] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check if HR features are available
  useEffect(() => {
    const checkHRFeature = async () => {
      try {
        // Try to access a simple HR endpoint to check permissions
        await hrAPI.getEmployees({ page: 1, limit: 1 });
      } catch (error) {
        if (error.response?.data?.upgrade_required) {
          setFeatureError(error.response.data);
          setShowUpgradeModal(true);
        }
      }
    };
    
    checkHRFeature();
  }, []);

  const handleModuleClick = async (path, moduleName) => {
    try {
      // Try to access the module
      if (moduleName === 'Employees') {
        await hrAPI.getEmployees({ page: 1, limit: 1 });
      } else if (moduleName === 'Departments') {
        await hrAPI.getDepartments();
      }
      // If successful, navigate to the module
      navigate(path);
    } catch (error) {
      if (error.response?.data?.upgrade_required) {
        setFeatureError({
          ...error.response.data,
          feature_required: `${moduleName} module`
        });
        setShowUpgradeModal(true);
      } else {
        // Handle other errors normally
        console.error('Error accessing module:', error);
      }
    }
  };

  const modules = [
    { title: 'Employees', desc: 'Manage staff records and profiles', icon: <FiUsers size={24} />, path: '/employees', color: 'primary' },
    { title: 'Attendance', desc: 'Track daily presence and hours', icon: <FiClock size={24} />, path: '/attendance', color: 'success' },
    { title: 'Leave Management', desc: 'Review time-off requests', icon: <FiCalendar size={24} />, path: '/leave', color: 'info' },
    { title: 'Performance', desc: 'Appraisals and KPI tracking', icon: <FiAward size={24} />, path: '/performance', color: 'warning' },
    { title: 'Departments', desc: 'Company structure and teams', icon: <FiGrid size={24} />, path: '/departments', color: 'danger' },
  ];

  return (
    <div className="hr-dashboard">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Human Resources</h2>
        <p className="text-muted">Central hub for workforce management and employee relations.</p>
      </div>

      {featureError && (
        <Alert variant="warning" className="mb-4 border-start border-4 border-warning">
          <div className="d-flex align-items-center">
            <FiLock className="me-2 text-warning" size={20} />
            <div>
              <strong className="d-block mb-1">Feature Access Limited</strong>
              <span className="small">
                {featureError.message} {featureError.upgrade_message}
              </span>
            </div>
            <Button 
              variant="outline-warning" 
              size="sm" 
              className="ms-auto"
              onClick={() => setShowUpgradeModal(true)}
            >
              View Upgrade Options
            </Button>
          </div>
        </Alert>
      )}

      <Row className="g-4">
        {modules.map((mod, idx) => (
          <Col md={6} lg={4} key={idx}>
            <Card 
              className="border-0 shadow-sm h-100 hover-shadow transition" 
              style={{ cursor: 'pointer' }} 
              onClick={() => handleModuleClick(mod.path, mod.title)}
            >
              <Card.Body className="p-4">
                <div className={`bg-${mod.color} bg-opacity-10 text-${mod.color} p-3 rounded-circle d-inline-block mb-3`}>
                  {mod.icon}
                </div>
                <h5 className="fw-bold text-dark mb-2">{mod.title}</h5>
                <p className="text-muted small mb-4">{mod.desc}</p>
                <div className="d-flex align-items-center text-primary fw-bold small">
                  Open Module <FiArrowRight className="ms-2" />
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="border-0 shadow-sm mt-5 bg-light">
        <Card.Body className="p-4">
          <Row className="align-items-center">
            <Col md={8}>
              <h5 className="fw-bold text-dark">HR Analytics & Reports</h5>
              <p className="text-muted mb-0">View detailed insights on turnover, hiring trends, and employee satisfaction.</p>
            </Col>
            <Col md={4} className="text-md-end mt-3 mt-md-0">
              <Button variant="primary" onClick={() => navigate('/hr-reports')}>View HR Reports</Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <SubscriptionUpgradeModal 
        error={featureError}
        show={showUpgradeModal}
        onHide={() => setShowUpgradeModal(false)}
      />
    </div>
  );
};

export default HR;
