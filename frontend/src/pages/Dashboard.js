import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, Table, Badge, Button } from 'react-bootstrap';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { FiArrowUpRight, FiDollarSign, FiTrendingUp, FiUsers, FiBox, FiRefreshCw, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    setStats({
      totalSales: 245000.00,
      revenue: 185000.00,
      customers: 1240,
      products: 890,
      netProfit: 65000.00,
      lowStock: 12,
      inventoryValue: 450000.00,
      salesGrowth: 12.5,
      revenueGrowth: 8.3,
      customerGrowth: 2.1,
      productGrowth: 5.7,
      profitGrowth: 4.2,
      recentOrders: [
        { id: 'ORD-2025-001', customer: 'John Doe', amount: 1250.00, status: 'delivered', date: '2025-12-28' },
        { id: 'ORD-2025-002', customer: 'Jane Smith', amount: 890.50, status: 'shipped', date: '2025-12-28' },
        { id: 'ORD-2025-003', customer: 'Robert Johnson', amount: 2100.00, status: 'processing', date: '2025-12-27' },
        { id: 'ORD-2025-004', customer: 'Emily Davis', amount: 650.75, status: 'confirmed', date: '2025-12-27' },
      ]
    });

    setLoading(false);
    if (isRefresh) {
      setRefreshing(false);
      toast.success('Dashboard data updated!', {
        icon: '🔄',
      });
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#f1f5f9' } }
    }
  };

  const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [{
      label: 'Monthly Sales',
      data: [45000, 59000, 80000, 81000, 56000, 55000, 90000],
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      borderColor: '#2563eb',
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Dashboard Overview</h2>
          <p className="text-muted mb-0">Welcome back! Here's what's happening today.</p>
        </div>
        <Button
          variant="outline-primary"
          className="d-flex align-items-center bg-white shadow-sm"
          onClick={() => fetchStats(true)}
          disabled={refreshing}
        >
          <FiRefreshCw className={`me-2 ${refreshing ? 'spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Stats Grid */}
      <Row className="g-4 mb-4">
        <Col xl={3} lg={6}>
          <Card className="border-0 h-100 shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                  <FiDollarSign size={24} />
                </div>
                <div className="text-success small fw-bold d-flex align-items-center">
                  <FiArrowUpRight className="me-1" /> {stats.salesGrowth}%
                </div>
              </div>
              <h3 className="fw-bold text-dark mb-1">${stats.totalSales.toLocaleString()}</h3>
              <p className="text-muted small mb-0 text-uppercase fw-semibold">Total Sales</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} lg={6}>
          <Card className="border-0 h-100 shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-success bg-opacity-10 p-2 rounded-3 text-success">
                  <FiTrendingUp size={24} />
                </div>
                <div className="text-success small fw-bold d-flex align-items-center">
                  <FiArrowUpRight className="me-1" /> {stats.profitGrowth}%
                </div>
              </div>
              <h3 className="fw-bold text-dark mb-1">${stats.netProfit.toLocaleString()}</h3>
              <p className="text-muted small mb-0 text-uppercase fw-semibold">Net Profit</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} lg={6}>
          <Card className="border-0 h-100 shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-info bg-opacity-10 p-2 rounded-3 text-info">
                  <FiUsers size={24} />
                </div>
                <div className="text-success small fw-bold d-flex align-items-center">
                  <FiArrowUpRight className="me-1" /> {stats.customerGrowth}%
                </div>
              </div>
              <h3 className="fw-bold text-dark mb-1">{stats.customers.toLocaleString()}</h3>
              <p className="text-muted small mb-0 text-uppercase fw-semibold">Total Customers</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} lg={6}>
          <Card className="border-0 h-100 shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-warning bg-opacity-10 p-2 rounded-3 text-warning">
                  <FiBox size={24} />
                </div>
                <div className="text-danger small fw-bold d-flex align-items-center">
                  {stats.lowStock} Low Stock
                </div>
              </div>
              <h3 className="fw-bold text-dark mb-1">{stats.products.toLocaleString()}</h3>
              <p className="text-muted small mb-0 text-uppercase fw-semibold">Total Products</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts & Table */}
      <Row className="g-4">
        <Col lg={8}>
          <Card className="border-0 mb-4 shadow-sm">
            <Card.Body className="p-4">
              <h5 className="fw-bold text-dark mb-4">Sales Performance</h5>
              <div style={{ height: '300px' }}>
                <Line options={chartOptions} data={salesData} />
              </div>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold text-dark mb-0">Recent Transactions</h5>
                <Button variant="link" className="text-primary p-0 text-decoration-none small fw-bold" onClick={() => toast.success('Redirecting to transactions...')}>View All</Button>
              </div>
              <div className="table-responsive">
                <Table hover className="align-middle border-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0">Order ID</th>
                      <th className="border-0">Customer</th>
                      <th className="border-0">Amount</th>
                      <th className="border-0">Status</th>
                      <th className="border-0">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map(order => (
                      <tr key={order.id}>
                        <td className="fw-bold text-primary border-0">{order.id}</td>
                        <td className="text-dark border-0">{order.customer}</td>
                        <td className="text-dark border-0 fw-bold">${order.amount.toLocaleString()}</td>
                        <td className="border-0">
                          <Badge bg={order.status === 'delivered' ? 'success' : 'primary'} className="bg-opacity-10 text-capitalize" style={{ color: order.status === 'delivered' ? '#10b981' : '#3b82f6' }}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="text-muted small border-0">{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 mb-4 shadow-sm">
            <Card.Body className="p-4">
              <h5 className="fw-bold text-dark mb-4">Order Status</h5>
              <div style={{ height: '250px' }}>
                <Pie
                  data={{
                    labels: ['Delivered', 'Processing', 'Shipped'],
                    datasets: [{
                      data: [45, 25, 30],
                      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
                      borderWidth: 0
                    }]
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                  }}
                />
              </div>
            </Card.Body>
          </Card>

          <Card className="border-0 bg-primary text-white shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center mb-3">
                <FiActivity size={24} className="me-2" />
                <h5 className="fw-bold mb-0">Inventory Value</h5>
              </div>
              <h2 className="fw-bold mb-1">${stats.inventoryValue.toLocaleString()}</h2>
              <p className="text-white text-opacity-75 small mb-4">Total estimated value of current stock.</p>
              <Button variant="light" className="w-100 fw-bold text-primary shadow-sm" onClick={() => toast.success('Generating inventory report...')}>View Inventory Report</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;