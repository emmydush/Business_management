import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Row, Col, Card, Table, Button, Badge, InputGroup, Form, Dropdown } from 'react-bootstrap';
import { FiFile, FiFolder, FiUpload, FiSearch, FiMoreVertical, FiDownload, FiTrash2, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { documentsAPI } from '../services/api';
import SubscriptionGuard from '../components/SubscriptionGuard';

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
            toast.loading('Downloading...');
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
            toast.dismiss();
            toast.success('Downloaded successfully');
        } catch (err) {
            console.error('Download error:', err);
            toast.dismiss();
            toast.error(err.response?.data?.error || 'Download failed. Please try again.');
        }
    };

    const handleView = async (doc) => {
        try {
            toast.loading('Opening document...');
            const response = await documentsAPI.viewDocument(doc.id);
            
            // Create a blob URL from the response
            const blob = new Blob([response.data], { type: doc.mimetype || 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            
            // Open in new tab
            const newWindow = window.open(url, '_blank');
            if (!newWindow) {
                toast.dismiss();
                toast.error('Could not open document. Pop-up blocker may be active.');
                window.URL.revokeObjectURL(url);
                return;
            }
            
            // Update the document in the local state to reflect the new view count
            setDocuments(prevDocs =>
                prevDocs.map(d =>
                    d.id === doc.id
                        ? { ...d, view_count: (d.view_count || 0) + 1 }
                        : d
                )
            );
            
            toast.dismiss();
            toast.success('Document opened');
            
            // Clean up the blob URL after a delay
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 2000);
        } catch (err) {
            console.error('View error:', err);
            toast.dismiss();
            toast.error(err.response?.data?.error || 'Failed to open document. File may not be accessible.');
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
                <SubscriptionGuard message="Renew your subscription to upload documents">
                    <Button variant="primary" className="d-flex align-items-center mt-3 mt-md-0" onClick={handleUploadClick}>
                        <FiUpload className="me-2" /> Upload Document
                    </Button>
                </SubscriptionGuard>
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
                                        <td className="ps-2 ps-md-4">
                                            <div className="d-flex align-items-center">
                                                <div className="bg-light p-2 rounded me-2 me-md-3 text-primary">
                                                    <FiFile size={16} />
                                                </div>
                                                <div className="fw-bold text-dark small small-md">{doc.filename}</div>
                                            </div>
                                        </td>
                                        <td><Badge bg="light" text="dark" className="border fw-normal small">{(doc.mimetype || '').split('/').pop()?.toUpperCase()}</Badge></td>
                                        <td className="text-muted small small-md">{Math.round((doc.size || 0) / 1024) + ' KB'}</td>
                                        <td><span className="small fw-medium text-dark">—</span></td>
                                        <td className="text-muted small small-md">{new Date(doc.created_at).toLocaleString()}</td>
                                        <td className="text-end pe-2 pe-md-4">
                                            <div className="d-flex gap-1 gap-md-2 justify-content-end">
                                                <Button variant="outline-primary" size="sm" className="d-flex align-items-center" onClick={() => handleView(doc)} title="View">
                                                    <FiEye size={14} className="d-md-none" />
                                                    <span className="d-none d-md-inline">View</span>
                                                </Button>
                                                <Button variant="outline-secondary" size="sm" className="d-flex align-items-center" onClick={() => handleDownload(doc)} title="Download">
                                                    <FiDownload size={14} className="d-md-none" />
                                                    <span className="d-none d-md-inline">Download</span>
                                                </Button>
                                                <Button variant="outline-danger" size="sm" className="d-flex align-items-center" onClick={() => handleDelete(doc)} title="Delete">
                                                    <FiTrash2 size={14} className="d-md-none" />
                                                    <span className="d-none d-md-inline">Delete</span>
                                                </Button>
                                            </div>
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

            <style dangerouslySetInnerHTML={{
                __html: `
                /* Mobile Responsive Styles for Documents */
                @media (max-width: 767.98px) {
                    .table td {
                        padding: 0.75rem 0.5rem !important;
                    }
                    
                    .small-md {
                        font-size: 0.7rem !important;
                    }
                    
                    .btn-sm {
                        padding: 0.35rem 0.5rem !important;
                        font-size: 0.75rem !important;
                    }
                    
                    table {
                        font-size: 0.85rem !important;
                    }
                }
                
                @media (max-width: 575.98px) {
                    .table td {
                        padding: 0.5rem 0.3rem !important;
                    }
                    
                    .btn-sm {
                        padding: 0.3rem 0.4rem !important;
                        font-size: 0.65rem !important;
                    }
                    
                    table {
                        font-size: 0.75rem !important;
                    }
                }
                
                /* Ensure action buttons are always visible */
                .btn {
                    display: inline-flex !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
                `
            }} />
        </div>
    );
};

export default Documents;
