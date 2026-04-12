import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Row, Col, Card, Button, Table, Badge, Modal,
    Form, Spinner, Nav, InputGroup
} from 'react-bootstrap';
import {
    FiMapPin, FiPlus, FiEdit2, FiTrash2, FiX, FiInfo,
    FiClock, FiCheck, FiHome, FiPhone, FiMail, FiSearch,
    FiUsers, FiRefreshCw, FiAlertTriangle, FiPower
} from 'react-icons/fi';
import { branchesAPI, settingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import SubscriptionGuard from '../components/SubscriptionGuard';

const EMPTY_FORM = {
    name: '',
    code: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    is_headquarters: false,
    is_active: true
};

const Branches = () => {

    // ── State ────────────────────────────────────────────────────────────────
    const [branches, setBranches] = useState([]);
    const [users, setUsers]       = useState([]);
    const [accessRecords, setAccessRecords] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // modal states
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [editingBranch, setEditingBranch]     = useState(null);
    const [formData, setFormData]               = useState(EMPTY_FORM);
    const [saving, setSaving]                   = useState(false);

    // access modal
    const [showAccessModal, setShowAccessModal] = useState(false);
    const [accessBranch, setAccessBranch]       = useState(null);
    const [accessForm, setAccessForm]           = useState({ user_id: '', is_default: false });
    const [grantingAccess, setGrantingAccess]   = useState(false);

    // delete confirm modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingBranch, setDeletingBranch]   = useState(null);

    // user role
    const [userRole, setUserRole] = useState(null);

    // ── Derived data ──────────────────────────────────────────────────────────
    const filteredBranches = branches.filter(b => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = !term ||
            b.name?.toLowerCase().includes(term) ||
            b.code?.toLowerCase().includes(term) ||
            b.city?.toLowerCase().includes(term);

        const matchesTab =
            activeTab === 'all'      ? true :
            activeTab === 'active'   ? (b.status === 'approved' && b.is_active) :
            activeTab === 'pending'  ? (b.status === 'pending') :
            activeTab === 'inactive' ? (!b.is_active || b.status === 'rejected') :
            true;

        return matchesSearch && matchesTab;
    });

    const counts = {
        all:      branches.length,
        active:   branches.filter(b => b.status === 'approved' && b.is_active).length,
        pending:  branches.filter(b => b.status === 'pending').length,
        inactive: branches.filter(b => !b.is_active || b.status === 'rejected').length,
    };

    const canManage = userRole === 'admin' || userRole === 'superadmin';

    // ── Data fetching ─────────────────────────────────────────────────────────
    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [branchRes, usersRes] = await Promise.all([
                branchesAPI.getBranches(),
                settingsAPI.getUsers({ per_page: 100 }),
            ]);
            setBranches(branchRes.data.branches || []);
            setUsers(usersRes.data.users || []);

            // fetch access records (admin only)
            if (canManage) {
                try {
                    const accessRes = await branchesAPI.getBranchAccess();
                    setAccessRecords(accessRes.data.access_records || []);
                } catch (_) {
                    // non-critical
                }
            }
        } catch (err) {
            console.error('Error loading branches:', err);
            toast.error('Failed to load branches');
        } finally {
            setLoading(false);
        }
    }, [canManage]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        setUserRole(user.role);
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // ── Branch modal ──────────────────────────────────────────────────────────
    const openBranchModal = (branch = null) => {
        if (branch) {
            setEditingBranch(branch);
            setFormData({
                name:            branch.name || '',
                code:            branch.code || '',
                address:         branch.address || '',
                city:            branch.city || '',
                phone:           branch.phone || '',
                email:           branch.email || '',
                is_headquarters: branch.is_headquarters || false,
                is_active:       branch.is_active !== undefined ? branch.is_active : true,
            });
        } else {
            setEditingBranch(null);
            setFormData(EMPTY_FORM);
        }
        setShowBranchModal(true);
    };

    const closeBranchModal = () => {
        setShowBranchModal(false);
        setEditingBranch(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingBranch) {
                await branchesAPI.updateBranch(editingBranch.id, formData);
                toast.success('Branch updated successfully');
            } else {
                const res = await branchesAPI.createBranch(formData);
                toast.success(res.data.message || 'Branch created');
            }
            closeBranchModal();
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save branch');
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const confirmDelete = (branch) => {
        setDeletingBranch(branch);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!deletingBranch) return;
        try {
            await branchesAPI.deleteBranch(deletingBranch.id);
            toast.success(`Branch "${deletingBranch.name}" deactivated`);
            setShowDeleteModal(false);
            setDeletingBranch(null);
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to deactivate branch');
        }
    };

    // ── Access Management ──────────────────────────────────────────────────────
    const openAccessModal = (branch) => {
        setAccessBranch(branch);
        setAccessForm({ user_id: '', is_default: false });
        setShowAccessModal(true);
    };

    const handleGrantAccess = async (e) => {
        e.preventDefault();
        setGrantingAccess(true);
        try {
            await branchesAPI.grantBranchAccess({
                user_id:    parseInt(accessForm.user_id),
                branch_id:  accessBranch.id,
                is_default: accessForm.is_default,
            });
            toast.success('Access granted successfully');
            fetchAll();
            setAccessForm({ user_id: '', is_default: false });
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to grant access');
        } finally {
            setGrantingAccess(false);
        }
    };

    const handleRevokeAccess = async (accessId) => {
        try {
            await branchesAPI.revokeBranchAccess(accessId);
            toast.success('Access revoked');
            fetchAll();
        } catch (err) {
            toast.error('Failed to revoke access');
        }
    };

    // Compute who has access to the currently selected branch
    const branchAccessList = accessBranch
        ? accessRecords.filter(a => a.branch_id === accessBranch.id)
        : [];

    // Users who DON'T yet have access to the current access-modal branch
    const eligibleUsers = accessBranch
        ? users.filter(u =>
            u.role !== 'superadmin' &&
            !branchAccessList.some(a => a.user_id === u.id)
          )
        : [];

    // ── Status badge ──────────────────────────────────────────────────────────
    const StatusBadge = ({ branch }) => {
        if (branch.status === 'pending') {
            return <Badge bg="warning" text="dark"><FiClock className="me-1" size={11} />Pending Approval</Badge>;
        }
        if (branch.status === 'rejected') {
            return <Badge bg="danger"><FiX className="me-1" size={11} />Rejected</Badge>;
        }
        if (!branch.is_active) {
            return <Badge bg="secondary">Inactive</Badge>;
        }
        return <Badge bg="success"><FiCheck className="me-1" size={11} />Active</Badge>;
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="branches-page py-4">
            <style dangerouslySetInnerHTML={{__html: `
                /* Mobile responsive styles for Branch Management buttons */
                @media (max-width: 576.98px) {
                    .branches-page .d-flex.justify-content-between.align-items-center {
                        flex-wrap: nowrap !important;
                    }
                    .branches-page .d-flex.gap-2.align-items-center {
                        flex-wrap: nowrap !important;
                        gap: 0.5rem !important;
                        justify-content: flex-start !important;
                        min-width: 0 !important;
                    }
                    .branches-page .d-flex.gap-2.align-items-center .btn {
                        flex: 1 !important;
                        min-width: 0 !important;
                        padding: 0.6rem 0.8rem !important;
                        font-size: 0.875rem !important;
                        white-space: nowrap !important;
                        overflow: hidden !important;
                        text-overflow: ellipsis !important;
                    }
                    .branches-page .d-flex.gap-2.align-items-center .btn-sm {
                        flex: 0 0 auto !important;
                        min-width: auto !important;
                        width: auto !important;
                        padding: 0.5rem 0.6rem !important;
                    }
                }
            `}} />
            <Container fluid>

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                    <div>
                        <h2 className="fw-bold text-dark mb-1">Branch Management</h2>
                        <p className="text-muted mb-0">Manage your business locations across all branches.</p>
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                        <Button variant="outline-secondary" size="sm" onClick={fetchAll} disabled={loading}>
                            <FiRefreshCw className={loading ? 'spin' : ''} />
                        </Button>
                        {canManage && (
                            <SubscriptionGuard message="Renew your subscription to add new branches">
                                <Button
                                    variant="primary"
                                    className="d-flex align-items-center gap-2 btn-black"
                                    onClick={() => openBranchModal()}
                                >
                                    <FiPlus /> Add Branch
                                </Button>
                            </SubscriptionGuard>
                        )}
                    </div>
                </div>

                {/* Summary Cards */}
                <Row className="g-3 mb-4">
                    {[
                        { label: 'Total Branches', value: counts.all,      color: '#6366f1', icon: <FiMapPin /> },
                        { label: 'Active',          value: counts.active,   color: '#22c55e', icon: <FiCheck /> },
                        { label: 'Pending Approval',value: counts.pending,  color: '#f59e0b', icon: <FiClock /> },
                        { label: 'Inactive/Rejected',value: counts.inactive,color: '#ef4444', icon: <FiPower /> },
                    ].map(({ label, value, color, icon }) => (
                        <Col key={label} xs={6} md={3}>
                            <Card className="border-0 shadow-sm h-100">
                                <Card.Body className="d-flex align-items-center gap-3">
                                    <div className="stat-icon" style={{ backgroundColor: `${color}18`, color }}>
                                        {icon}
                                    </div>
                                    <div>
                                        <div className="fw-bold fs-4">{value}</div>
                                        <div className="text-muted small">{label}</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Pending Notice */}
                {counts.pending > 0 && (
                    <div className="alert alert-warning border-0 d-flex align-items-center gap-2 mb-4 shadow-sm" role="alert">
                        <FiAlertTriangle size={18} />
                        <span>
                            You have <strong>{counts.pending}</strong> branch{counts.pending > 1 ? 'es' : ''} awaiting
                            SuperAdmin approval. They will appear as <em>Active</em> once approved.
                        </span>
                    </div>
                )}

                {/* Tabs + Search */}
                <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white border-bottom-0 pt-3 pb-0">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                            <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab}>
                                <Nav.Item>
                                    <Nav.Link eventKey="all">All <Badge bg="secondary" className="ms-1">{counts.all}</Badge></Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="active">Active <Badge bg="success" className="ms-1">{counts.active}</Badge></Nav.Link>
                                </Nav.Item>
                                {canManage && (
                                    <Nav.Item>
                                        <Nav.Link eventKey="pending">Pending <Badge bg="warning" text="dark" className="ms-1">{counts.pending}</Badge></Nav.Link>
                                    </Nav.Item>
                                )}
                                {canManage && (
                                    <Nav.Item>
                                        <Nav.Link eventKey="inactive">Inactive <Badge bg="secondary" className="ms-1">{counts.inactive}</Badge></Nav.Link>
                                    </Nav.Item>
                                )}
                            </Nav>
                            <InputGroup style={{ maxWidth: 280 }}>
                                <InputGroup.Text className="bg-transparent border-end-0">
                                    <FiSearch className="text-muted" size={15} />
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Search branches…"
                                    className="border-start-0"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </div>
                    </Card.Header>

                    <Card.Body className="p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <Spinner animation="border" variant="primary" />
                                <p className="text-muted mt-2 mb-0">Loading branches…</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <Table hover className="mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-4 py-3">Branch</th>
                                            <th>Code</th>
                                            <th>Location</th>
                                            <th>Contact</th>
                                            <th>Status</th>
                                            <th className="text-end pe-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBranches.length > 0 ? filteredBranches.map(branch => (
                                            <tr key={branch.id}>
                                                {/* Name */}
                                                <td className="ps-4 py-3">
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="branch-avatar"
                                                            style={{ backgroundColor: branch.is_headquarters ? '#eef2ff' : '#f0fdf4', color: branch.is_headquarters ? '#6366f1' : '#16a34a' }}>
                                                            {branch.is_headquarters ? <FiHome size={18} /> : <FiMapPin size={18} />}
                                                        </div>
                                                        <div>
                                                            <div className="fw-semibold text-dark">{branch.name}</div>
                                                            {branch.is_headquarters && (
                                                                <Badge bg="info" className="extra-small fw-normal">Headquarters</Badge>
                                                            )}
                                                            {branch.manager_name && (
                                                                <div className="extra-small text-muted mt-1">
                                                                    <FiUsers size={10} className="me-1" />
                                                                    {branch.manager_name}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Code */}
                                                <td>
                                                    {branch.code
                                                        ? <code className="text-primary small">{branch.code}</code>
                                                        : <span className="text-muted small">—</span>
                                                    }
                                                </td>

                                                {/* Location */}
                                                <td>
                                                    <div className="small text-dark">{branch.city || '—'}</div>
                                                    {branch.address && (
                                                        <div className="extra-small text-muted text-truncate" style={{ maxWidth: 160 }}>
                                                            {branch.address}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Contact */}
                                                <td>
                                                    <div className="small">
                                                        {branch.phone && <div><FiPhone size={11} className="me-1 text-muted" />{branch.phone}</div>}
                                                        {branch.email && <div><FiMail size={11} className="me-1 text-muted" />{branch.email}</div>}
                                                        {!branch.phone && !branch.email && <span className="text-muted">—</span>}
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td><StatusBadge branch={branch} /></td>

                                                {/* Actions */}
                                                <td className="text-end pe-4">
                                                    <div className="d-flex justify-content-end gap-1">
                                                        {/* User access management */}
                                                        {canManage && branch.status === 'approved' && (
                                                            <Button
                                                                variant="outline-secondary"
                                                                size="sm"
                                                                className="btn-icon"
                                                                title="Manage User Access"
                                                                onClick={() => openAccessModal(branch)}
                                                            >
                                                                <FiUsers size={15} />
                                                            </Button>
                                                        )}

                                                        {canManage && (
                                                            <Button
                                                                variant="link"
                                                                className="text-primary p-1"
                                                                title="Edit Branch"
                                                                onClick={() => openBranchModal(branch)}
                                                                disabled={branch.status === 'pending'}
                                                            >
                                                                <FiEdit2 size={16} />
                                                            </Button>
                                                        )}

                                                        {canManage && !branch.is_headquarters && branch.is_active && (
                                                            <Button
                                                                variant="link"
                                                                className="text-danger p-1"
                                                                title="Deactivate Branch"
                                                                onClick={() => confirmDelete(branch)}
                                                                disabled={branch.status === 'pending'}
                                                            >
                                                                <FiTrash2 size={16} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="6" className="text-center py-5 text-muted">
                                                    <FiInfo size={40} className="mb-3 opacity-25" />
                                                    <p className="mb-0">No branches found</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Container>

            {/* ── Add / Edit Branch Modal ────────────────────────────────── */}
            <Modal show={showBranchModal} onHide={closeBranchModal} centered size="lg" className="colored-modal override-white white-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">
                        {editingBranch ? 'Edit Branch' : 'Add New Branch'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body className="pt-4">
                        {!editingBranch && (
                            <div className="alert alert-info border-0 small mb-3">
                                <FiInfo className="me-2" />
                                New branches require <strong>SuperAdmin approval</strong> before they become active.
                            </div>
                        )}
                        <Row className="g-3">
                            <Col md={8}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Branch Name <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        required
                                        type="text"
                                        placeholder="e.g. Downtown Branch"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Branch Code</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. BR-001"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">City</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. Kigali"
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Phone</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="+250 700 000 000"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Address</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder="Street address…"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="branch@company.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12} className="d-flex gap-4 pt-1">
                                <Form.Check
                                    type="switch"
                                    id="hq-switch"
                                    label="Is Headquarters?"
                                    checked={formData.is_headquarters}
                                    onChange={e => setFormData({ ...formData, is_headquarters: e.target.checked })}
                                />
                                {editingBranch && (
                                    <Form.Check
                                        type="switch"
                                        id="active-switch"
                                        label="Is Active?"
                                        checked={formData.is_active}
                                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                )}
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0">
                        <Button variant="light" onClick={closeBranchModal}>Cancel</Button>
                        <Button variant="primary" type="submit" className="px-4" disabled={saving}>
                            {saving ? <Spinner animation="border" size="sm" /> : editingBranch ? 'Save Changes' : 'Submit for Approval'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* ── Delete Confirm Modal ───────────────────────────────────── */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm">
                <Modal.Body className="text-center p-4">
                    <div className="text-danger mb-3" style={{ fontSize: '3rem' }}>
                        <FiAlertTriangle />
                    </div>
                    <h5 className="fw-bold">Deactivate Branch?</h5>
                    <p className="text-muted small mb-4">
                        <strong>{deletingBranch?.name}</strong> will be deactivated. Users assigned to this branch will
                        lose access. You can reactivate it later via SuperAdmin.
                    </p>
                    <div className="d-flex gap-2 justify-content-center">
                        <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                        <Button variant="danger" onClick={handleDelete}>Deactivate</Button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* ── User Access Modal ──────────────────────────────────────── */}
            <Modal show={showAccessModal} onHide={() => setShowAccessModal(false)} centered size="lg" className="colored-modal override-white white-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">
                        <FiUsers className="me-2" />
                        User Access — {accessBranch?.name}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    {/* Grant access form */}
                    <Form onSubmit={handleGrantAccess} className="mb-4 p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <h6 className="fw-semibold mb-3">Grant Access to User</h6>
                        <Row className="g-2 align-items-end">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Select User</Form.Label>
                                    <Form.Select
                                        required
                                        value={accessForm.user_id}
                                        onChange={e => setAccessForm({ ...accessForm, user_id: e.target.value })}
                                    >
                                        <option value="">Choose a user…</option>
                                        {eligibleUsers.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.first_name} {u.last_name} ({u.email})
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Check
                                    type="switch"
                                    id="default-branch"
                                    label="Set as default branch"
                                    checked={accessForm.is_default}
                                    onChange={e => setAccessForm({ ...accessForm, is_default: e.target.checked })}
                                    className="mb-2"
                                />
                            </Col>
                            <Col md={2}>
                                <Button type="submit" variant="primary" className="w-100" disabled={grantingAccess}>
                                    {grantingAccess ? <Spinner animation="border" size="sm" /> : 'Grant'}
                                </Button>
                            </Col>
                        </Row>
                    </Form>

                    {/* Current access list */}
                    <h6 className="fw-semibold mb-2">Users with Access ({branchAccessList.length})</h6>
                    {branchAccessList.length === 0 ? (
                        <p className="text-muted small text-center py-3">No users have been granted access to this branch yet.</p>
                    ) : (
                        <Table size="sm" hover className="align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Default</th>
                                    <th className="text-end">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {branchAccessList.map(access => (
                                    <tr key={access.id}>
                                        <td className="fw-semibold small">{access.user_name}</td>
                                        <td className="small text-muted">{access.user_email}</td>
                                        <td><Badge bg="secondary" className="fw-normal text-capitalize">{access.user_role}</Badge></td>
                                        <td>
                                            {access.is_default
                                                ? <Badge bg="success" className="fw-normal">Default</Badge>
                                                : <span className="text-muted small">—</span>
                                            }
                                        </td>
                                        <td className="text-end">
                                            <Button
                                                variant="link"
                                                className="text-danger p-0 small"
                                                onClick={() => handleRevokeAccess(access.id)}
                                            >
                                                <FiX size={14} className="me-1" />Revoke
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="light" onClick={() => setShowAccessModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>

            <style>{`
                .extra-small { font-size: 10px; }
                .branches-page .card { border-radius: 14px; overflow: hidden; }
                .branches-page .table thead th {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #64748b;
                    font-weight: 600;
                }
                .branches-page .nav-tabs .nav-link {
                    font-size: 13px;
                    color: #64748b;
                    border: none;
                    border-bottom: 2px solid transparent;
                    padding: 8px 16px;
                }
                .branches-page .nav-tabs .nav-link.active {
                    color: #6366f1;
                    border-bottom-color: #6366f1;
                    background: transparent;
                    font-weight: 600;
                }
                .branches-page .card-header { border-radius: 14px 14px 0 0 !important; }
                .stat-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    flex-shrink: 0;
                }
                .branch-avatar {
                    width: 38px;
                    height: 38px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .btn-icon {
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                    border-radius: 8px;
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default Branches;
