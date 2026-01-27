import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Modal, Form, Spinner } from 'react-bootstrap';
import { FiMapPin, FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiInfo, FiClock } from 'react-icons/fi';
import { branchesAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useI18n } from '../i18n/I18nProvider';
import SubscriptionGuard from '../components/SubscriptionGuard';

const Branches = () => {
    const { t } = useI18n();
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        city: '',
        phone: '',
        is_headquarters: false,
        is_active: true
    });

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        setUserRole(user.role);
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            setLoading(true);
            const response = await branchesAPI.getBranches();
            setBranches(response.data.branches || []);
        } catch (error) {
            console.error('Error fetching branches:', error);
            toast.error(t('failed_load_branches') || 'Failed to load branches');
        } finally {
            setLoading(false);
        }
    };

    const handleShowModal = (branch = null) => {
        if (branch) {
            setEditingBranch(branch);
            setFormData({
                name: branch.name || '',
                code: branch.code || '',
                address: branch.address || '',
                city: branch.city || '',
                phone: branch.phone || '',
                is_headquarters: branch.is_headquarters || false,
                is_active: branch.is_active !== undefined ? branch.is_active : true
            });
        } else {
            setEditingBranch(null);
            setFormData({
                name: '',
                code: '',
                address: '',
                city: '',
                phone: '',
                is_headquarters: false,
                is_active: true
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingBranch(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBranch) {
                await branchesAPI.updateBranch(editingBranch.id, formData);
                toast.success(t('branch_updated') || 'Branch updated successfully');
            } else {
                const response = await branchesAPI.createBranch(formData);
                toast.success(response.data.message || 'Branch created successfully');
            }
            handleCloseModal();
            fetchBranches();
        } catch (error) {
            console.error('Error saving branch:', error);
            toast.error(error.response?.data?.error || 'Failed to save branch');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('delete_confirm_title') || 'Are you sure?')) {
            try {
                await branchesAPI.updateBranch(id, { is_active: false });
                toast.success(t('branch_deleted') || 'Branch deactivated');
                fetchBranches();
            } catch (error) {
                toast.error('Failed to deactivate branch');
            }
        }
    };

    const getStatusBadge = (branch) => {
        if (branch.status === 'pending') {
            return <Badge bg="warning" text="dark"><FiClock className="me-1" /> {t('pending') || 'Pending Approval'}</Badge>;
        }
        if (branch.status === 'rejected') {
            return <Badge bg="danger"><FiX className="me-1" /> {t('rejected') || 'Rejected'}</Badge>;
        }
        return (
            <Badge bg={branch.is_active ? 'success' : 'secondary'}>
                {branch.is_active ? t('active') : t('inactive')}
            </Badge>
        );
    };

    const canManageBranches = userRole === 'admin' || userRole === 'superadmin';

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="branches-page py-4">
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold text-dark mb-1">{t('sidebar_branches')}</h2>
                        <p className="text-muted mb-0">Manage your business locations and branches.</p>
                    </div>
                    {canManageBranches && (
                        <SubscriptionGuard message="Renew your subscription to add new branches">
                            <Button variant="primary" className="d-flex align-items-center gap-2 shadow-sm" onClick={() => handleShowModal()}>
                                <FiPlus /> {t('add_branch') || 'Add Branch'}
                            </Button>
                        </SubscriptionGuard>
                    )}
                </div>

                <Row>
                    <Col xs={12}>
                        <Card className="border-0 shadow-sm">
                            <Card.Body className="p-0">
                                <div className="table-responsive">
                                    <Table hover className="mb-0 align-middle">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="ps-4 py-3">{t('name')}</th>
                                                <th>{t('code') || 'Code'}</th>
                                                <th>{t('location') || 'Location'}</th>
                                                <th>{t('status')}</th>
                                                <th className="text-end pe-4">{t('actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {branches.length > 0 ? (
                                                branches.map((branch) => (
                                                    <tr key={branch.id}>
                                                        <td className="ps-4 py-3">
                                                            <div className="d-flex align-items-center">
                                                                <div className="bg-primary bg-opacity-10 p-2 rounded-3 me-3 text-primary">
                                                                    <FiMapPin size={20} />
                                                                </div>
                                                                <div>
                                                                    <div className="fw-bold text-dark">{branch.name}</div>
                                                                    {branch.is_headquarters && (
                                                                        <Badge bg="info" className="extra-small">{t('hq_badge')}</Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td><code className="text-primary">{branch.code || 'N/A'}</code></td>
                                                        <td>
                                                            <div className="small text-dark">{branch.city}</div>
                                                            <div className="extra-small text-muted">{branch.address}</div>
                                                        </td>
                                                        <td>
                                                            {getStatusBadge(branch)}
                                                        </td>
                                                        <td className="text-end pe-4">
                                                            {canManageBranches && (
                                                                <>
                                                                    <Button variant="link" className="text-primary p-1 me-2" onClick={() => handleShowModal(branch)} disabled={branch.status === 'pending'}>
                                                                        <FiEdit2 size={18} />
                                                                    </Button>
                                                                    <Button variant="link" className="text-danger p-1" onClick={() => handleDelete(branch.id)} disabled={branch.status === 'pending'}>
                                                                        <FiTrash2 size={18} />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="text-center py-5 text-muted">
                                                        <FiInfo size={40} className="mb-3 opacity-20" />
                                                        <p>{t('no_branches_found') || 'No branches found'}</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* Branch Modal */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">{editingBranch ? t('edit_branch') || 'Edit Branch' : t('add_branch') || 'Add Branch'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body className="pt-4">
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">{t('branch_name') || 'Branch Name'}</Form.Label>
                                    <Form.Control
                                        required
                                        type="text"
                                        placeholder="e.g. Kigali Heights Branch"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">{t('branch_code') || 'Branch Code'}</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. KGL-01"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">{t('city') || 'City'}</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. Kigali"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">{t('address')}</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder="Street address..."
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Check
                                    type="switch"
                                    id="is-hq-switch"
                                    label={t('is_headquarters') || 'Is Headquarters?'}
                                    checked={formData.is_headquarters}
                                    onChange={(e) => setFormData({ ...formData, is_headquarters: e.target.checked })}
                                    className="mb-2"
                                />
                                <Form.Check
                                    type="switch"
                                    id="is-active-switch"
                                    label={t('is_active') || 'Is Active?'}
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0">
                        <Button variant="light" onClick={handleCloseModal}>{t('cancel')}</Button>
                        <Button variant="primary" type="submit" className="px-4">
                            {editingBranch ? t('update') || 'Update' : t('create')}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <style dangerouslySetInnerHTML={{
                __html: `
                .extra-small { font-size: 10px; }
                .branches-page .card { border-radius: 16px; overflow: hidden; }
                .branches-page .table thead th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
                `
            }} />
        </div>
    );
};

export default Branches;
