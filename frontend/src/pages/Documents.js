import React, { useState } from 'react';
import { Row, Col, Card, Table, Button, Badge, InputGroup, Form, Dropdown } from 'react-bootstrap';
import { FiFile, FiFolder, FiUpload, FiSearch, FiMoreVertical, FiDownload, FiTrash2, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Documents = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const documents = [
        { id: 1, name: 'Q4 Financial Report.pdf', type: 'PDF', size: '2.4 MB', date: '2025-12-20', owner: 'Finance Dept' },
        { id: 2, name: 'Employee Handbook 2026.docx', type: 'DOCX', size: '1.1 MB', date: '2025-12-28', owner: 'HR Dept' },
        { id: 3, name: 'Project Roadmap.pptx', type: 'PPTX', size: '5.8 MB', date: '2026-01-02', owner: 'Operations' },
        { id: 4, name: 'Vendor Contract - ABC Corp.pdf', type: 'PDF', size: '850 KB', date: '2025-11-15', owner: 'Legal' },
        { id: 5, name: 'Inventory Audit Jan.xlsx', type: 'XLSX', size: '1.5 MB', date: '2026-01-03', owner: 'Warehouse' },
    ];

    const filteredDocs = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.owner.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="documents-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Document Management</h2>
                    <p className="text-muted mb-0">Centralized repository for all company files and assets.</p>
                </div>
                <Button variant="primary" className="d-flex align-items-center mt-3 mt-md-0" onClick={() => toast.success('Opening upload dialog...')}>
                    <FiUpload className="me-2" /> Upload Document
                </Button>
            </div>

            <Row className="g-4 mb-4">
                <Col md={3}>
                    <Card className="border-0 shadow-sm text-center py-3">
                        <Card.Body>
                            <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                                <FiFile className="text-primary" size={24} />
                            </div>
                            <h4 className="fw-bold mb-0">124</h4>
                            <div className="text-muted small">Total Files</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm text-center py-3">
                        <Card.Body>
                            <div className="bg-success bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                                <FiFolder className="text-success" size={24} />
                            </div>
                            <h4 className="fw-bold mb-0">18</h4>
                            <div className="text-muted small">Folders</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm text-center py-3">
                        <Card.Body>
                            <div className="bg-info bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                                <FiEye className="text-info" size={24} />
                            </div>
                            <h4 className="fw-bold mb-0">450</h4>
                            <div className="text-muted small">Views (This Month)</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm text-center py-3">
                        <Card.Body>
                            <div className="bg-warning bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                                <FiDownload className="text-warning" size={24} />
                            </div>
                            <h4 className="fw-bold mb-0">82</h4>
                            <div className="text-muted small">Downloads</div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <div className="p-3 border-bottom">
                        <InputGroup style={{ maxWidth: '400px' }}>
                            <InputGroup.Text className="bg-light border-0">
                                <FiSearch className="text-muted" />
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Search by filename or department..."
                                className="bg-light border-0 ps-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </div>

                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="ps-4 py-3 border-0">Filename</th>
                                    <th className="py-3 border-0">Type</th>
                                    <th className="py-3 border-0">Size</th>
                                    <th className="py-3 border-0">Department</th>
                                    <th className="py-3 border-0">Last Modified</th>
                                    <th className="text-end pe-4 py-3 border-0">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDocs.map(doc => (
                                    <tr key={doc.id}>
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center">
                                                <div className="bg-light p-2 rounded me-3 text-primary">
                                                    <FiFile size={20} />
                                                </div>
                                                <div className="fw-bold text-dark">{doc.name}</div>
                                            </div>
                                        </td>
                                        <td><Badge bg="light" text="dark" className="border fw-normal">{doc.type}</Badge></td>
                                        <td className="text-muted small">{doc.size}</td>
                                        <td><span className="small fw-medium text-dark">{doc.owner}</span></td>
                                        <td className="text-muted small">{doc.date}</td>
                                        <td className="text-end pe-4">
                                            <Dropdown align="end">
                                                <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                                                    <FiMoreVertical size={20} />
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu className="border-0 shadow-sm">
                                                    <Dropdown.Item className="d-flex align-items-center py-2">
                                                        <FiEye className="me-2 text-muted" /> View
                                                    </Dropdown.Item>
                                                    <Dropdown.Item className="d-flex align-items-center py-2">
                                                        <FiDownload className="me-2 text-muted" /> Download
                                                    </Dropdown.Item>
                                                    <Dropdown.Divider />
                                                    <Dropdown.Item className="d-flex align-items-center py-2 text-danger">
                                                        <FiTrash2 className="me-2" /> Delete
                                                    </Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Documents;
