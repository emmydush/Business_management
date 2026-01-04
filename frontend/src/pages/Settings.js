import React from 'react';
import { Container, Row, Col, Card, Tabs, Tab, Form, Button } from 'react-bootstrap';

const Settings = () => {
  return (
    <Container fluid>
      <h1 className="mb-4">System Configuration & Security</h1>
      
      <Row>
        <Col lg={12}>
          <Card>
            <Card.Body>
              <Tabs defaultActiveKey="company" id="settings-tabs" className="mb-3">
                <Tab eventKey="company" title="Company Profile">
                  <Form>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Company Name</Form.Label>
                          <Form.Control type="text" placeholder="Enter company name" />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control type="email" placeholder="Enter company email" />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control as="textarea" rows={2} placeholder="Enter company address" />
                    </Form.Group>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone</Form.Label>
                          <Form.Control type="text" placeholder="Enter phone number" />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Website</Form.Label>
                          <Form.Control type="text" placeholder="Enter website URL" />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Currency</Form.Label>
                          <Form.Select>
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="JPY">JPY - Japanese Yen</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Tax Rate (%)</Form.Label>
                          <Form.Control type="number" step="0.01" placeholder="Enter tax rate" />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Language</Form.Label>
                          <Form.Select>
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Button variant="primary">Save Company Profile</Button>
                  </Form>
                </Tab>
                
                <Tab eventKey="security" title="Security & Audit">
                  <Card className="mb-3">
                    <Card.Header>
                      <h6>Audit Logs</h6>
                    </Card.Header>
                    <Card.Body>
                      <p>Audit logs track all user activities and system changes for security and compliance purposes.</p>
                      <Button variant="outline-primary" className="me-2">View Audit Logs</Button>
                      <Button variant="outline-secondary">Export Logs</Button>
                    </Card.Body>
                  </Card>
                  
                  <Card className="mb-3">
                    <Card.Header>
                      <h6>Data Encryption</h6>
                    </Card.Header>
                    <Card.Body>
                      <p>Manage encryption settings for sensitive data at rest and in transit.</p>
                      <Form.Check 
                        type="switch"
                        id="dataEncryption"
                        label="Enable Data Encryption"
                        defaultChecked
                      />
                    </Card.Body>
                  </Card>
                  
                  <Card>
                    <Card.Header>
                      <h6>Backup & Recovery</h6>
                    </Card.Header>
                    <Card.Body>
                      <p>Configure backup and recovery procedures to protect business data.</p>
                      <Button variant="outline-primary">Configure Backup</Button>
                    </Card.Body>
                  </Card>
                </Tab>
                
                <Tab eventKey="access" title="Access Logs & Monitoring">
                  <Card>
                    <Card.Header>
                      <h6>Login History</h6>
                    </Card.Header>
                    <Card.Body>
                      <p>Track user login activities and monitor for suspicious access patterns.</p>
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>User</th>
                              <th>Login Time</th>
                              <th>IP Address</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>admin</td>
                              <td>2023-07-15 10:30:00</td>
                              <td>192.168.1.100</td>
                              <td><span className="badge bg-success">Success</span></td>
                            </tr>
                            <tr>
                              <td>manager</td>
                              <td>2023-07-15 09:15:00</td>
                              <td>192.168.1.101</td>
                              <td><span className="badge bg-success">Success</span></td>
                            </tr>
                            <tr>
                              <td>staff</td>
                              <td>2023-07-14 14:20:00</td>
                              <td>192.168.1.102</td>
                              <td><span className="badge bg-warning">Success</span></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </Card.Body>
                  </Card>
                </Tab>
                
                <Tab eventKey="integration" title="Integrations">
                  <Card>
                    <Card.Header>
                      <h6>System Integrations</h6>
                    </Card.Header>
                    <Card.Body>
                      <Form.Check 
                        type="switch"
                        id="emailIntegration"
                        label="Email (SMTP) Integration"
                        className="mb-2"
                      />
                      <Form.Check 
                        type="switch"
                        id="paymentIntegration"
                        label="Payment Gateway Integration"
                        className="mb-2"
                      />
                      <Form.Check 
                        type="switch"
                        id="smsIntegration"
                        label="SMS/OTP Integration"
                        className="mb-2"
                      />
                      <Form.Check 
                        type="switch"
                        id="apiIntegration"
                        label="External API Integration"
                      />
                    </Card.Body>
                  </Card>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Settings;