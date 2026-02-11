import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { FiFile, FiCheckCircle, FiActivity, FiBox, FiArrowRight, FiRefreshCw } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { reportsAPI, tasksAPI, expensesAPI } from '../services/api';

const Operations = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const modules = [
    { title: 'Documents', desc: 'Company file repository and sharing', icon: <FiFile size={24} />, path: '/documents', color: 'primary' },
    { title: 'Approvals', desc: 'Workflow requests and authorizations', icon: <FiCheckCircle size={24} />, path: '/approvals', color: 'success' },
    { title: 'Workflows', desc: 'Process automation and tracking', icon: <FiActivity size={24} />, path: '/workflows', color: 'info' },
    { title: 'Asset Management', desc: 'Equipment and physical asset tracking', icon: <FiBox size={24} />, path: '/assets', color: 'warning' },
  ];

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Tasks -> to compute efficiency and active projects
      const tasksRes = await tasksAPI.getTasks();
      const tasks = tasksRes.data || tasksRes;
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const efficiency = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
      const projects = new Set(tasks.filter(t => t.project).map(t => t.project));

      // Expenses -> pending approvals
      const expensesRes = await expensesAPI.getExpenses({ status: 'pending_approval', per_page: 1 });
      const pendingApprovals = expensesRes.data.total || expensesRes.data.total || 0;

      // Inventory -> low stock count via reports API
      const inventoryRes = await reportsAPI.getInventoryReport();
      const lowStock = inventoryRes.data.inventory_report.low_stock_products || 0;

      setMetrics({ efficiency, activeProjects: projects.size, pendingApprovals, lowStock });
    } catch (err) {
      console.error('Error fetching operations metrics:', err);
      setError('Failed to fetch operations metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

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
            <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Active Projects Overview</h5>
              <div>
                <Button variant="outline-secondary" size="sm" className="me-2" onClick={fetchMetrics}>
                  <FiRefreshCw />
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {loading && <div className="text-center py-5"><Spinner animation="border" /></div>}
              {!loading && error && <Alert variant="danger">{error}</Alert>}
              {!loading && !error && (
                <div>
                  <div className="mb-3 text-muted">Active projects tracked through tasks.</div>
                  <h3 className="fw-bold">{metrics ? metrics.activeProjects : '-'}</h3>
                  <p className="text-muted">Projects with active tasks</p>
                  <Button variant="outline-primary" onClick={() => navigate('/projects')}>Go to Projects</Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="border-0 shadow-sm bg-dark text-white h-100">
            <Card.Body className="p-4 d-flex flex-column justify-content-center">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Operational Efficiency</h5>
                <Button variant="outline-light" size="sm" onClick={fetchMetrics}><FiRefreshCw /></Button>
              </div>
              <div className="display-4 fw-bold mb-2 text-success">{metrics ? metrics.efficiency + '%' : '-'}</div>
              <p className="small opacity-75">Based on completed tasks vs total tasks.</p>
              <div className="mt-3 d-flex justify-content-between">
                <div>
                  <div className="small text-muted">Pending Approvals</div>
                  <div className="fw-bold">{metrics ? metrics.pendingApprovals : '-'}</div>
                </div>
                <div>
                  <div className="small text-muted">Low Stock Items</div>
                  <div className="fw-bold">{metrics ? metrics.lowStock : '-'}</div>
                </div>
              </div>
              <Button variant="light" size="sm" className="mt-3 fw-bold" onClick={() => navigate('/workflows')}>Optimize More</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Operations;