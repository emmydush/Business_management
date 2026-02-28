import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, ProgressBar, Table } from 'react-bootstrap';
import { FiHardDrive, FiRefreshCw, FiDownload, FiTrash2, FiCheckCircle, FiXCircle, FiClock, FiDatabase } from 'react-icons/fi';
import { settingsAPI } from '../services/api';
import toast from 'react-hot-toast';

const BackupRestore = () => {
    const [backupStatus, setBackupStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creatingBackup, setCreatingBackup] = useState(false);
    const [error, setError] = useState(null);
    const [backups, setBackups] = useState([
        { id: 1, name: 'Full Backup 2023-06-15', date: '2023-06-15T03:00:00Z', size: '2.5 GB', type: 'Full' },
        { id: 2, name: 'Daily Backup 2023-06-14', date: '2023-06-14T03:00:00Z', size: '1.8 GB', type: 'Incremental' },
        { id: 3, name: 'Daily Backup 2023-06-13', date: '2023-06-13T03:00:00Z', size: '1.7 GB', type: 'Incremental' },
        { id: 4, name: 'Weekly Backup 2023-06-08', date: '2023-06-08T03:00:00Z', size: '4.2 GB', type: 'Full' },
        { id: 5, name: 'Daily Backup 2023-06-07', date: '2023-06-07T03:00:00Z', size: '1.9 GB', type: 'Incremental' },
    ]);

    useEffect(() => {
        fetchBackupStatus();
    }, []);

    const fetchBackupStatus = async () => {
        try {
            setLoading(true);
            const response = await settingsAPI.getBackupStatus();
            setBackupStatus(response.data.backup_status);
            setError(null);
        } catch (err) {
            setError('Failed to fetch backup status.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBackup = async () => {
        setCreatingBackup(true);
        try {
            await settingsAPI.createBackup();
            toast.success('Backup process initiated successfully!');
            // In a real implementation, we would poll for backup status
            // For now, just add a new backup to the list
            const newBackup = {
                id: backups.length + 1,
                name: `Manual Backup ${new Date().toISOString().split('T')[0]}`,
                date: new Date().toISOString(),
                size: '0.0 GB',
                type: 'Full'
            };
            setBackups([newBackup, ...backups]);
        } catch (err) {
            toast.error('Failed to initiate backup process');
        } finally {
            setCreatingBackup(false);
        }
    };

    const handleDownloadBackup = () => {
        toast.success('Backup download initiated');
        // In a real implementation, this would download the backup file
    };

    const handleDeleteBackup = (backupId) => {
        if (window.confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
            setBackups(backups.filter(backup => backup.id !== backupId));
            toast.success('Backup deleted successfully');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <Container fluid className="py-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Backup & Restore</h2>
                    <p className="text-muted mb-0">Manage database backups and recovery options</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button 
                        variant="outline-secondary" 
                        className="d-flex align-items-center" 
                        onClick={fetchBackupStatus}
                    >
                        <FiRefreshCw className="me-2" /> Refresh
                    </Button>
                    <Button 
                        variant="primary" 
                        className="d-flex align-items-center"
                        onClick={handleCreateBackup}
                        disabled={creatingBackup}
                    >
                        {creatingBackup ? (
                            <>
                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                    <span className="visually-hidden">Creating...</span>
                                </div>
                                Creating...
                            </>
                        ) : (
                            <>
                                <FiHardDrive className="me-2" /> Create Backup
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="g-4 mb-4">
                <Col lg={4}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Backup Status</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="text-center mb-4">
                                <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                                    <FiHardDrive className="text-primary" size={32} />
                                </div>
                                <h3 className="fw-bold text-dark">Operational</h3>
                                <p className="text-muted mb-0">Automatic backups enabled</p>
                            </div>
                            
                            <div className="border-top pt-3">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Last Backup:</span>
                                    <span className="fw-bold">
                                        {backupStatus?.last_backup ? 
                                            formatDate(backupStatus.last_backup) : 
                                            'Never'}
                                    </span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Frequency:</span>
                                    <span className="fw-bold">{backupStatus?.backup_frequency || 'Daily'}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Retention:</span>
                                    <span className="fw-bold">{backupStatus?.retention_days || 30} days</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted">Storage Used:</span>
                                    <span className="fw-bold">{backupStatus?.storage_used || '0.0 GB'}</span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col lg={8}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Backup Configuration</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row className="g-3">
                                <Col md={6}>
                                    <div className="mb-3">
                                        <h6 className="fw-bold mb-2">Backup Frequency</h6>
                                        <div className="d-flex gap-2">
                                            <Button variant="outline-primary" size="sm">Hourly</Button>
                                            <Button variant="primary" size="sm">Daily</Button>
                                            <Button variant="outline-primary" size="sm">Weekly</Button>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="mb-3">
                                        <h6 className="fw-bold mb-2">Retention Policy</h6>
                                        <div className="d-flex gap-2">
                                            <Button variant="outline-primary" size="sm">7 days</Button>
                                            <Button variant="primary" size="sm">30 days</Button>
                                            <Button variant="outline-primary" size="sm">90 days</Button>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={12}>
                                    <div className="mb-3">
                                        <h6 className="fw-bold mb-2">Storage Location</h6>
                                        <div className="d-flex align-items-center">
                                            <Badge bg="success" className="me-2">
                                                <FiCheckCircle className="me-1" /> Local Storage
                                            </Badge>
                                            <Badge bg="secondary">
                                                <FiXCircle className="me-1" /> Cloud Storage
                                            </Badge>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                            
                            <div className="border-top pt-3">
                                <h6 className="fw-bold mb-3">Storage Usage</h6>
                                <ProgressBar now={65} label="65% of allocated space used" variant="primary" />
                                <div className="d-flex justify-content-between mt-2">
                                    <span className="text-muted small">Used: 6.5 GB</span>
                                    <span className="text-muted small">Total: 10 GB</span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col lg={12}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Available Backups</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-4">Backup Name</th>
                                            <th>Date</th>
                                            <th>Size</th>
                                            <th>Type</th>
                                            <th className="text-end pe-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {backups.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="text-center py-5">
                                                    <div className="d-flex flex-column align-items-center">
                                                        <FiDatabase size={48} className="text-muted mb-3" />
                                                        <h5 className="fw-bold text-dark">No backups</h5>
                                                        <p className="text-muted mb-0">No backup files are currently available</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            backups.map(backup => (
                                                <tr key={backup.id}>
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center">
                                                            <FiHardDrive className="text-muted me-2" />
                                                            <div>
                                                                <div className="fw-bold">{backup.name}</div>
                                                                <div className="small text-muted">ID: {backup.id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <FiClock className="text-muted me-2" />
                                                            <div>
                                                                <div>{formatDate(backup.date)}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="fw-bold">{backup.size}</div>
                                                    </td>
                                                    <td>
                                                        <Badge bg={backup.type === 'Full' ? 'primary' : 'info'} className="fw-normal">
                                                            {backup.type}
                                                        </Badge>
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        <Button 
                                                            variant="outline-primary" 
                                                            size="sm" 
                                                            className="me-2"
                                                            onClick={() => handleDownloadBackup()}
                                                        >
                                                            <FiDownload className="me-1" /> Download
                                                        </Button>
                                                        <Button 
                                                            variant="outline-danger" 
                                                            size="sm"
                                                            onClick={() => handleDeleteBackup(backup.id)}
                                                        >
                                                            <FiTrash2 className="me-1" /> Delete
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
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

export default BackupRestore;
