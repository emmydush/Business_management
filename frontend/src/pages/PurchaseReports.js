import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Badge, Alert } from 'react-bootstrap';
import { purchasesAPI, reportsAPI } from '../services/api';
import { FiBarChart2, FiDownload, FiTrendingUp, FiDollarSign, FiPackage } from 'react-icons/fi';
import { useCurrency } from '../context/CurrencyContext';
import DateRangeSelector from '../components/DateRangeSelector';
import { DATE_RANGES, calculateDateRange, formatDateForAPI } from '../utils/dateRanges';

const PurchaseReports = () => {
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState(DATE_RANGES.TODAY);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [reportType, setReportType] = useState('summary');

  // Fetch report data
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        
        // Calculate date range
        const dateRangeObj = calculateDateRange(dateRange, customStartDate, customEndDate);
        const apiParams = {
          date_from: formatDateForAPI(dateRangeObj.startDate),
          date_to: formatDateForAPI(dateRangeObj.endDate),
          page: 1,
          per_page: 100
        };
        
        // Fetch purchase orders for summary
        const response = await purchasesAPI.getPurchaseOrders(apiParams);
        
        // Calculate summary metrics
        const orders = response.data.purchase_orders || [];
        const totalOrders = orders.length;
        const totalAmount = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const approvedOrders = orders.filter(o => ['confirmed', 'shipped', 'partially_received', 'received'].includes(o.status)).length;
        
        setReportData({
          totalOrders,
          totalAmount,
          pendingOrders,
          approvedOrders,
          orders,
          topSuppliers: calculateTopSuppliers(orders)
        });
        
        setError(null);
      } catch (err) {
        setError('Failed to fetch purchase report data. Please try again later.');
        console.error('Error fetching purchase report:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [dateRange]);

  const calculateTopSuppliers = (orders) => {
    const supplierMap = {};
    
    orders.forEach(order => {
      const supplierName = order.supplier?.company_name || 'Unknown Supplier';
      if (!supplierMap[supplierName]) {
        supplierMap[supplierName] = {
          name: supplierName,
          totalOrders: 0,
          totalAmount: 0
        };
      }
      supplierMap[supplierName].totalOrders += 1;
      supplierMap[supplierName].totalAmount += order.total_amount || 0;
    });
    
    return Object.values(supplierMap)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);
  };

  const handleDateChange = (field, value) => {
    if (field === 'from') {
      setCustomStartDate(value);
    } else if (field === 'to') {
      setCustomEndDate(value);
    }
  };

  const handleDateRangeChange = (range, start, end) => {
    setDateRange(range);
    if (range === DATE_RANGES.CUSTOM_RANGE && start && end) {
      setCustomStartDate(start);
      setCustomEndDate(end);
    }
  };

  const handleExport = async () => {
    try {
      const response = await purchasesAPI.exportPurchases();
      console.log('Export initiated:', response.data);
    } catch (err) {
      console.error('Export failed:', err);
    }
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

  if (error) {
    return (
      <Container fluid>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container fluid>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h1>Purchase Reports</h1>
          <p className="text-muted mb-0">Analyze purchasing patterns and supplier performance.</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Button variant="outline-secondary" onClick={handleExport}>
            <FiDownload className="me-2" /> Export Report
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <DateRangeSelector
                value={dateRange}
                onChange={handleDateRangeChange}
              />
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Report Type</Form.Label>
                <Form.Select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                  <option value="summary">Summary Report</option>
                  <option value="detailed">Detailed Report</option>
                  <option value="supplier">Supplier Analysis</option>
                  <option value="trends">Trend Analysis</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Button variant="primary" onClick={fetchReportData} className="w-100">
                <FiBarChart2 className="me-2" /> Refresh Report
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Total Orders</p>
                  <h3 className="mb-0">{reportData?.totalOrders || 0}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <FiPackage className="text-primary" size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Total Amount</p>
                  <h3 className="mb-0">{formatCurrency(reportData?.totalAmount || 0)}</h3>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <FiDollarSign className="text-success" size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Pending Orders</p>
                  <h3 className="mb-0">{reportData?.pendingOrders || 0}</h3>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <FiTrendingUp className="text-warning" size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Approved Orders</p>
                  <h3 className="mb-0">{reportData?.approvedOrders || 0}</h3>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded">
                  <FiBarChart2 className="text-info" size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Top Suppliers */}
      <Row>
        <Col lg={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5>Top Suppliers</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Orders</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData?.topSuppliers?.map((supplier, index) => (
                      <tr key={index}>
                        <td>{supplier.name}</td>
                        <td>{supplier.totalOrders}</td>
                        <td>{formatCurrency(supplier.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Orders */}
        <Col lg={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5>Recent Orders</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Supplier</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData?.orders?.slice(0, 5).map(order => (
                      <tr key={order.id}>
                        <td>{order.order_id}</td>
                        <td>{order.supplier?.company_name || 'N/A'}</td>
                        <td>{formatCurrency(order.total_amount)}</td>
                        <td>
                          <Badge bg={
                            order.status === 'pending' ? 'warning' :
                            order.status === 'confirmed' ? 'info' :
                            order.status === 'shipped' ? 'primary' :
                            order.status === 'partially_received' ? 'secondary' :
                            order.status === 'received' ? 'success' : 'danger'
                          }>
                            {order.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </Badge>
                        </td>
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

export default PurchaseReports;
