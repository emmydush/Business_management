import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Alert, Table, Modal, Form } from 'react-bootstrap';
import { FiMic, FiPlus, FiEdit, FiTrash2, FiUser, FiCalendar, FiGlobe, FiAlertTriangle, FiInfo, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { communicationAPI } from '../services/api';
import toast from 'react-hot-toast';

const Announcements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
    const [announcementData, setAnnouncementData] = useState({
        title: '',
        content: '',
        priority: 'normal'
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await communicationAPI.getAnnouncements();
            setAnnouncements(response.data.announcements || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch announcements.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await communicationAPI.createAnnouncement(announcementData);
            toast.success('Announcement created successfully');
            setShowCreateModal(false);
            setAnnouncementData({ title: '', content: '', priority: 'normal' });
            fetchAnnouncements();
        } catch (err) {
            toast.error('Failed to create announcement');
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await communicationAPI.updateAnnouncement(currentAnnouncement.id, announcementData);
            toast.success('Announcement updated successfully');
            setShowEditModal(false);
            setCurrentAnnouncement(null);
            setAnnouncementData({ title: '', content: '', priority: 'normal' });
            fetchAnnouncements();
        } catch (err) {
            toast.error('Failed to update announcement');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this announcement?')) {
            try {
                await communicationAPI.deleteAnnouncement(id);
                toast.success('Announcement deleted successfully');
                fetchAnnouncements();
            } catch (err) {
                toast.error('Failed to delete announcement');
            }
        }
    };

    const handleEdit = (announcement) => {
        setCurrentAnnouncement(announcement);
        setAnnouncementData({
            title: announcement.title,
            content: announcement.content,
            priority: announcement.priority
        });
        setShowEditModal(true);
    };

    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 'urgent':
                return <Badge bg="danger" className="fw-normal"><FiAlertTriangle className="me-1" /> Urgent</Badge>;
            case 'high':
                return <Badge bg="warning" className="fw-normal text-dark"><FiAlertTriangle className="me-1" /> High</Badge>;
            case 'normal':
                return <Badge bg="info" className="fw-normal"><FiInfo className="me-1" /> Normal</Badge>;
            case 'low':
                return <Badge bg="secondary" className="fw-normal"><FiInfo className="me-1" /> Low</Badge>;
            default:
                return <Badge bg="info" className="fw-normal">{priority}</Badge>;
        }
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'urgent':
                return <FiXCircle className="text-danger me-2" />;
            case 'high':
                return <FiAlertTriangle className="text-warning me-2" />;
            case 'normal':
                return <FiInfo className="text-info me-2" />;
            case 'low':
                return <FiInfo className="text-secondary me-2" />;
            default:
                return <FiInfo className="text-info me-2" />;
        }
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
        <div className="announcements-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Announcements</h2>
                    <p className="text-muted mb-0">Company-wide announcements and updates</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button 
                        variant="primary" 
                        className="d-flex align-items-center"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <FiPlus className="me-2" /> Create Announcement
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="g-4 mb-4">
                <Col lg={12}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Recent Announcements</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-4">Priority</th>
                                            <th>Title</th>
                                            <th>Content</th>
                                            <th>Author</th>
                                            <th>Date</th>
                                            <th className="text-end pe-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {announcements.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="text-center py-5">
                                                    <div className="d-flex flex-column align-items-center">
                                                        <FiMic size={48} className="text-muted mb-3" />
                                                        <h5 className="fw-bold text-dark">No announcements</h5>
                                                        <p className="text-muted mb-0">No company-wide announcements have been posted yet</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            announcements.map(announcement => (
                                                <tr key={announcement.id}>
                                                    <td className="ps-4">
                                                        {getPriorityIcon(announcement.priority)}
                                                        {getPriorityBadge(announcement.priority)}
                                                    </td>
                                                    <td>
                                                        <div className="fw-bold">{announcement.title}</div>
                                                    </td>
                                                    <td>
                                                        <div className="text-muted small">
                                                            {announcement.content.length > 80 
                                                                ? announcement.content.substring(0, 80) + '...' 
                                                                : announcement.content}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <FiUser className="text-muted me-2" />
                                                            <div>
                                                                {announcement.author 
                                                                    ? `${announcement.author.first_name} ${announcement.author.last_name}` 
                                                                    : 'Unknown'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="small text-muted">
                                                            {new Date(announcement.created_at).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        <Button 
                                                            variant="outline-primary" 
                                                            size="sm" 
                                                            className="me-2"
                                                            onClick={() => handleEdit(announcement)}
                                                        >
                                                            <FiEdit />
                                                        </Button>
                                                        <Button 
                                                            variant="outline-danger" 
                                                            size="sm"
                                                            onClick={() => handleDelete(announcement.id)}
                                                        >
                                                            <FiTrash2 />
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

            {/* Create Announcement Modal */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Create Announcement</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter announcement title"
                                value={announcementData.title}
                                onChange={(e) => setAnnouncementData({ ...announcementData, title: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Content</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={5}
                                placeholder="Enter announcement content"
                                value={announcementData.content}
                                onChange={(e) => setAnnouncementData({ ...announcementData, content: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Priority</Form.Label>
                            <Form.Select
                                value={announcementData.priority}
                                onChange={(e) => setAnnouncementData({ ...announcementData, priority: e.target.value })}
                                required
                            >
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Create Announcement
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Edit Announcement Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Announcement</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter announcement title"
                                value={announcementData.title}
                                onChange={(e) => setAnnouncementData({ ...announcementData, title: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Content</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={5}
                                placeholder="Enter announcement content"
                                value={announcementData.content}
                                onChange={(e) => setAnnouncementData({ ...announcementData, content: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Priority</Form.Label>
                            <Form.Select
                                value={announcementData.priority}
                                onChange={(e) => setAnnouncementData({ ...announcementData, priority: e.target.value })}
                                required
                            >
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Update Announcement
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default Announcements;
