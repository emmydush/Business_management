import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Table } from 'react-bootstrap';
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

const Reports = () => {
  const [reportType, setReportType] = useState('sales');
  
  // Sample data for charts
  const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Sales',
        data: [12000, 19000, 15000, 18000, 22000, 17000],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const expenseData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Expenses',
        data: [8000, 12000, 10000, 11000, 14000, 13000],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const hrData = {
    labels: ['Active', 'Inactive', 'On Leave'],
    datasets: [
      {
        data: [45, 3, 2],
        backgroundColor: [
          'rgba(75, 192, 192, 0.5)',
          'rgba(255, 99, 132, 0.5)',
          'rgba(255, 205, 86, 0.5)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 205, 86, 1)',
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
        text: reportType === 'sales' ? 'Sales Report' : reportType === 'expenses' ? 'Expenses Report' : 'HR Report',
      },
    },
  };

  const salesReportData = [
    { id: 1, customer: 'John Doe', product: 'Laptop', amount: 1250.00, date: '2023-07-15' },
    { id: 2, customer: 'Jane Smith', product: 'Mouse', amount: 25.00, date: '2023-07-14' },
    { id: 3, customer: 'Bob Johnson', product: 'Keyboard', amount: 75.00, date: '2023-07-13' },
    { id: 4, customer: 'Alice Brown', product: 'Monitor', amount: 299.99, date: '2023-07-12' },
    { id: 5, customer: 'Charlie Wilson', product: 'Headphones', amount: 150.00, date: '2023-07-11' },
  ];

  return (
    <Container fluid>
      <h1 className="mb-4">Reports & Analytics</h1>
      
      <Row className="mb-4">
        <Col lg={12}>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5>Report Type</h5>
                <Form.Select 
                  value={reportType} 
                  onChange={(e) => setReportType(e.target.value)}
                  style={{ width: '200px' }}
                >
                  <option value="sales">Sales Report</option>
                  <option value="expenses">Expenses Report</option>
                  <option value="hr">HR Report</option>
                  <option value="inventory">Inventory Report</option>
                  <option value="finance">Finance Report</option>
                </Form.Select>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={8}>
                  {reportType === 'sales' && (
                    <Bar options={options} data={salesData} />
                  )}
                  {reportType === 'expenses' && (
                    <Bar options={options} data={expenseData} />
                  )}
                  {reportType === 'hr' && (
                    <Pie options={options} data={hrData} />
                  )}
                </Col>
                <Col md={4}>
                  <h6>Report Summary</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Total:</span>
                    <strong>${reportType === 'sales' ? '12,500' : reportType === 'expenses' ? '8,200' : '50'}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Avg. per Month:</span>
                    <strong>${reportType === 'sales' ? '2,083' : reportType === 'expenses' ? '1,367' : '8'}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Growth:</span>
                    <strong className={reportType === 'expenses' ? 'text-danger' : 'text-success'}>
                      {reportType === 'sales' ? '+12%' : reportType === 'expenses' ? '+5%' : '+0%'}</strong>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col lg={12}>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5>Detailed {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h5>
                <div>
                  <Button variant="outline-primary" size="sm" className="me-2">Export PDF</Button>
                  <Button variant="outline-success" size="sm">Export Excel</Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>Amount</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReportData.map(item => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.customer}</td>
                        <td>{item.product}</td>
                        <td>${item.amount.toFixed(2)}</td>
                        <td>{item.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Reports;