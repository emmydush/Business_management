import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import { FiTrendingUp, FiDollarSign, FiBox, FiUsers, FiSettings, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';

const Reports = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();

  const reportModules = [
    { title: 'Sales Reports', desc: 'Revenue, orders, and customer trends', icon: <FiTrendingUp size={24} />, path: '/sales-reports', color: 'primary' },
    { title: 'Finance Reports', desc: 'P&L, cash flow, and expense analysis', icon: <FiDollarSign size={24} />, path: '/finance-reports', color: 'success' },
    { title: 'Inventory Reports', desc: 'Stock levels, turnover, and valuation', icon: <FiBox size={24} />, path: '/inventory-reports', color: 'info' },
    { title: 'HR Reports', desc: 'Workforce demographics and attendance', icon: <FiUsers size={24} />, path: '/hr-reports', color: 'warning' },
    { title: 'Custom Reports', desc: 'Build your own personalized reports', icon: <FiSettings size={24} />, path: '/custom-reports', color: 'danger' },
  ];

  return (
    <div className="reports-dashboard">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Business Intelligence & Reports</h2>
        <p className="text-muted">Comprehensive data analysis across all business modules.</p>
      </div>

      <Row className="g-4">
        {reportModules.map((mod, idx) => (
          <Col md={6} lg={4} key={idx}>
            <Card className="border-0 shadow-sm h-100 hover-shadow transition" style={{ cursor: 'pointer' }} onClick={() => navigate(mod.path)}>
              <Card.Body className="p-4">
                <div className={`bg-${mod.color} bg-opacity-10 text-${mod.color} p-3 rounded-circle d-inline-block mb-3`}>
                  {mod.icon}
                </div>
                <h5 className="fw-bold text-dark mb-2">{mod.title}</h5>
                <p className="text-muted small mb-4">{mod.desc}</p>
                <div className="d-flex align-items-center text-primary fw-bold small">
                  Generate Report <FiArrowRight className="ms-2" />
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="border-0 shadow-sm mt-5 overflow-hidden">
        <Row className="g-0">
          <Col md={4} className="bg-primary d-flex align-items-center justify-content-center p-5">
            <div className="text-center text-white">
              <FiTrendingUp size={64} className="mb-3 opacity-50" />
              <h3 className="fw-bold">Business Summary</h3>
            </div>
          </Col>
          <Col md={8}>
            <Card.Body className="p-4">
              <h5 className="fw-bold text-dark mb-3">Executive Overview</h5>
              <p className="text-muted">Get a high-level summary of your business performance this month. This report combines data from sales, finance, and operations to give you a complete picture.</p>
              <Row className="g-3 mb-4">
                <Col xs={6} md={3}>
                  <div className="text-muted small">Total Sales</div>
                  <div className="fw-bold text-dark">{formatCurrency(42500)}</div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="text-muted small">Net Profit</div>
                  <div className="fw-bold text-success">{formatCurrency(12800)}</div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="text-muted small">Active Staff</div>
                  <div className="fw-bold text-dark">24</div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="text-muted small">Efficiency</div>
                  <div className="fw-bold text-primary">94%</div>
                </Col>
              </Row>
              <Button variant="primary">Download Executive Summary</Button>
            </Card.Body>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Reports;
