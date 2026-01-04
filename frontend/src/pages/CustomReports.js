import React, { useState } from 'react';
import { Row, Col, Card, Button, Form, Badge, InputGroup } from 'react-bootstrap';
import { FiPlus, FiSettings, FiPlay, FiSave, FiTrash2, FiFileText, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CustomReports = () => {
    const [savedReports, setSavedReports] = useState([
        { id: 1, name: 'Monthly Sales by Region', lastRun: '2 days ago', type: 'Table' },
        { id: 2, name: 'Inventory Aging Report', lastRun: '1 week ago', type: 'Chart' },
        { id: 3, name: 'Employee Performance vs Salary', lastRun: 'Yesterday', type: 'Scatter' },
    ]);

    return (
        <div className="custom-reports-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Custom Report Builder</h2>
                    <p className="text-muted mb-0">Create, save, and schedule personalized business reports.</p>
                </div>
                <Button variant="primary" className="d-flex align-items-center mt-3 mt-md-0" onClick={() => toast.success('Opening report builder...')}>
                    <FiPlus className="me-2" /> Build New Report
                </Button>
            </div>

            <Row className="g-4">
                <Col lg={4}>
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Saved Reports</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="list-group list-group-flush">
                                {savedReports.map(report => (
                                    <div key={report.id} className="list-group-item list-group-item-action border-0 px-4 py-3">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <h6 className="fw-bold mb-0 text-dark">{report.name}</h6>
                                            <Badge bg="light" text="dark" className="border fw-normal">{report.type}</Badge>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <small className="text-muted">Last run: {report.lastRun}</small>
                                            <div className="d-flex gap-2">
                                                <Button variant="link" className="p-0 text-primary"><FiPlay size={16} /></Button>
                                                <Button variant="link" className="p-0 text-muted"><FiSettings size={16} /></Button>
                                                <Button variant="link" className="p-0 text-danger"><FiTrash2 size={16} /></Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="border-0 shadow-sm bg-primary text-white">
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-3">Need Help?</h5>
                            <p className="small mb-4 opacity-75">Our report builder allows you to join data from multiple modules. Check our documentation for advanced SQL queries.</p>
                            <Button variant="light" size="sm" className="fw-bold text-primary">View Documentation</Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={8}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Quick Builder</h5>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <Form>
                                <Row className="g-3 mb-4">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold">Data Source</Form.Label>
                                            <Form.Select>
                                                <option>Sales & Orders</option>
                                                <option>Inventory & Stock</option>
                                                <option>Finance & Expenses</option>
                                                <option>HR & Employees</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold">Report Type</Form.Label>
                                            <Form.Select>
                                                <option>Summary Table</option>
                                                <option>Line Chart</option>
                                                <option>Bar Chart</option>
                                                <option>Pie Chart</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold">Date Range</Form.Label>
                                            <InputGroup>
                                                <Form.Control type="date" />
                                                <InputGroup.Text>to</InputGroup.Text>
                                                <Form.Control type="date" />
                                            </InputGroup>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="bg-light p-4 rounded border-2 border-dashed mb-4 text-center">
                                    <FiFilter size={32} className="text-muted mb-3" />
                                    <h6 className="fw-bold text-dark">Add Filters</h6>
                                    <p className="small text-muted mb-3">Drag and drop fields here to filter your data.</p>
                                    <Button variant="outline-primary" size="sm">Add Filter Rule</Button>
                                </div>

                                <div className="d-flex justify-content-end gap-2">
                                    <Button variant="light" className="d-flex align-items-center">
                                        <FiSave className="me-2" /> Save Template
                                    </Button>
                                    <Button variant="primary" className="d-flex align-items-center" onClick={() => toast.success('Running custom report...')}>
                                        <FiPlay className="me-2" /> Run Report
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default CustomReports;
