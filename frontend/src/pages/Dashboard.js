import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data for charts
  const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Sales',
        data: [12000, 19000, 15000, 18000, 22000, 17000, 25000, 21000, 18000, 23000, 20000, 27000],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const orderStatusData = {
    labels: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    datasets: [
      {
        data: [15, 25, 10, 20, 45, 5],
        backgroundColor: [
          'rgba(255, 205, 86, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 99, 132, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(201, 203, 207, 0.5)',
        ],
        borderColor: [
          'rgba(255, 205, 86, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(201, 203, 207, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Sales Overview',
      },
    },
  };

  // Simulate API call
  useEffect(() => {
    const fetchStats = async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalCustomers: 124,
        totalSuppliers: 56,
        totalProducts: 89,
        totalOrders: 56,
        totalRevenue: 245000.00,
        totalExpenses: 125000.00,
        totalProfit: 120000.00,
        totalEmployees: 23,
        pendingOrders: 12,
        lowStockItems: 8,
        unpaidInvoices: 5,
        recentOrders: [
          { id: 1, customer: 'John Doe', amount: 1250.00, date: '2023-07-15' },
          { id: 2, customer: 'Jane Smith', amount: 890.50, date: '2023-07-14' },
          { id: 3, customer: 'Bob Johnson', amount: 2100.00, date: '2023-07-13' },
          { id: 4, customer: 'Alice Brown', amount: 650.75, date: '2023-07-12' },
          { id: 5, customer: 'Charlie Wilson', amount: 1800.25, date: '2023-07-11' }
        ],
        recentActivity: [
          { id: 1, action: 'New customer added', user: 'John Doe', time: '2 minutes ago' },
          { id: 2, action: 'Order #ORD-001 completed', user: 'Jane Smith', time: '15 minutes ago' },
          { id: 3, action: 'Inventory updated', user: 'Mike Johnson', time: '1 hour ago' },
          { id: 4, action: 'New supplier registered', user: 'Sarah Wilson', time: '2 hours ago' },
          { id: 5, action: 'Payroll processed', user: 'HR Admin', time: '3 hours ago' },
        ]
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container fluid>
      <h1 className="mb-4">Dashboard & Analytics</h1>
      
      {/* TOP PRIORITY CARDS */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="h-100 text-center border-0 shadow-sm" style={{ backgroundColor: '#e7f4ff' }}>
            <Card.Body className="d-flex flex-column justify-content-center p-3">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <span className="fs-4 me-2">💰</span>
                <Card.Title className="text-primary mb-0" style={{ fontSize: '1rem' }}>Total Revenue</Card.Title>
              </div>
              <Card.Text className="fw-bold" style={{ fontSize: '1.5rem' }}>${(stats.totalRevenue).toLocaleString()}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="h-100 text-center border-0 shadow-sm" style={{ backgroundColor: '#e7f8f4' }}>
            <Card.Body className="d-flex flex-column justify-content-center p-3">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <span className="fs-4 me-2">🧾</span>
                <Card.Title className="text-success mb-0" style={{ fontSize: '1rem' }}>Total Expenses</Card.Title>
              </div>
              <Card.Text className="fw-bold" style={{ fontSize: '1.5rem' }}>${(stats.totalExpenses).toLocaleString()}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="h-100 text-center border-0 shadow-sm" style={{ backgroundColor: '#f0f4ff' }}>
            <Card.Body className="d-flex flex-column justify-content-center p-3">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <span className="fs-4 me-2">📈</span>
                <Card.Title className="text-info mb-0" style={{ fontSize: '1rem' }}>Net Profit</Card.Title>
              </div>
              <Card.Text className="fw-bold" style={{ fontSize: '1.5rem' }}>${(stats.totalProfit).toLocaleString()}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="h-100 text-center border-0 shadow-sm" style={{ backgroundColor: '#fff4e7' }}>
            <Card.Body className="d-flex flex-column justify-content-center p-3">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <span className="fs-4 me-2">🛒</span>
                <Card.Title className="text-warning mb-0" style={{ fontSize: '1rem' }}>Total Sales</Card.Title>
              </div>
              <Card.Text className="fw-bold" style={{ fontSize: '1.5rem' }}>{stats.totalOrders}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Charts */}
      <Row className="mb-4">
        <Col lg={8}>
          <Card>
            <Card.Body>
              <Bar options={options} data={salesData} />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card>
            <Card.Body>
              <h5 className="card-title">Order Status Distribution</h5>
              <Pie data={orderStatusData} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row>
        <Col lg={8}>
          <Card>
            <Card.Body>
              <Card.Title>Recent Orders</Card.Title>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map(order => (
                      <tr key={order.id}>
                        <td>ORD{order.id.toString().padStart(4, '0')}</td>
                        <td>{order.customer}</td>
                        <td>${order.amount.toFixed(2)}</td>
                        <td>{order.date}</td>
                        <td>
                          <span className="badge bg-primary">Pending</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card>
            <Card.Body>
              <Card.Title>Recent Activity</Card.Title>
              <div className="activity-list">
                {stats.recentActivity.map(activity => (
                  <div key={activity.id} className="activity-item mb-2 p-2 border-bottom">
                    <div className="fw-bold">{activity.action}</div>
                    <div className="text-muted small">by {activity.user} - {activity.time}</div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;