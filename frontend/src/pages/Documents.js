import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Row, Col, Card, Table, Button, Badge, InputGroup, Form, Dropdown } from 'react-bootstrap';
import { FiFile, FiFolder, FiUpload, FiSearch, FiMoreVertical, FiDownload, FiTrash2, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { documentsAPI } from '../services/api';
import api from '../services/api';

const Documents = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const fetchDocuments = useCallback(async () => {
        try {
            setLoading(true);
            const res = await documentsAPI.getDocuments({ search: searchTerm });
            setDocuments(res.data.documents || []);
        } catch (err) {
            toast.error('Failed to load documents');
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleSearch = (value) => {
        setSearchTerm(value);
    };

    const handleUploadClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            toast.loading('Uploading...');
            await documentsAPI.uploadDocument(file);
            toast.dismiss();
            toast.success('Uploaded successfully');
            fetchDocuments();
        } catch (err) {
            toast.dismiss();
            toast.error('Upload failed');
        }
    };

    const handleDownload = async (doc) => {
        try {
            const res = await documentsAPI.downloadDocument(doc.id);
            const blob = new Blob([res.data], { type: res.headers['content-type'] || doc.mimetype });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            toast.error('Download failed');
        }
    };

    const handleView = async (doc) => {
        try {
            // Open document in a new tab for viewing
            const response = await documentsAPI.viewDocument(doc.id);
            
            // Update the document in the local state to reflect the new view count
            setDocuments(prevDocs => 
                prevDocs.map(d => 
                    d.id === doc.id 
                        ? { ...d, view_count: (d.view_count || 0) + 1 } 
                        : d
                )
            );
            
            // Open the document in a new tab
            const viewUrl = `${api.defaults.baseURL}/documents/${doc.id}/view`;
            window.open(viewUrl, '_blank');
            
            toast.success('Document opened in new tab');
        } catch (err) {
            toast.error('Failed to open document');
        }
    };

    const handleDelete = async (doc) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;
        try {
            await documentsAPI.deleteDocument(doc.id);
            toast.success('Deleted');
            fetchDocuments();
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    const filteredDocs = documents.filter(doc =>
        doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="documents-wrapper">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Document Management</h2>
                    <p className="text-muted mb-0">Centralized repository for all company files and assets.</p>
                </div>
                <Button variant="primary" className="d-flex align-items-center mt-3 mt-md-0" onClick={handleUploadClick}>
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
                            <h4 className="fw-bold mb-0">{documents.length}</h4>
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
                            <h4 className="fw-bold mb-0">{documents.length}</h4>
                            <div className="text-muted small">Files</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm text-center py-3">
                        <Card.Body>
                            <div className="bg-info bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                                <FiEye className="text-info" size={24} />
                            </div>
                            <h4 className="fw-bold mb-0">{documents.reduce((sum, doc) => sum + (doc.view_count || 0), 0)}</h4>
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
                            <h4 className="fw-bold mb-0">{documents.reduce((sum, doc) => sum + (doc.download_count || 0), 0)}</h4>
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
                                onChange={(e) => handleSearch(e.target.value)}
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
                                                <div className="fw-bold text-dark">{doc.filename}</div>
                                            </div>
                                        </td>
                                        <td><Badge bg="light" text="dark" className="border fw-normal">{(doc.mimetype || '').split('/').pop()?.toUpperCase()}</Badge></td>
                                        <td className="text-muted small">{Math.round((doc.size || 0)/1024) + ' KB'}</td>
                                        <td><span className="small fw-medium text-dark">—</span></td>
                                        <td className="text-muted small">{new Date(doc.created_at).toLocaleString()}</td>
                                        <td className="text-end pe-4">
                                            <Dropdown align="end">
                                                <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                                                    <FiMoreVertical size={20} />
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu className="border-0 shadow-sm">
                                                    <Dropdown.Item className="d-flex align-items-center py-2" onClick={() => handleView(doc)}>
                                                        <FiEye className="me-2 text-muted" /> View
                                                    </Dropdown.Item>
                                                    <Dropdown.Item className="d-flex align-items-center py-2" onClick={() => handleDownload(doc)}>
                                                        <FiDownload className="me-2 text-muted" /> Download
                                                    </Dropdown.Item>
                                                    <Dropdown.Divider />
                                                    <Dropdown.Item className="d-flex align-items-center py-2 text-danger" onClick={() => handleDelete(doc)}>
                                                        <FiTrash2 className="me-2" /> Delete
                                                    </Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))}
                                {filteredDocs.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-4">{loading ? 'Loading...' : 'No documents found'}</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Documents;
