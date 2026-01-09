import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Alert, Table } from 'react-bootstrap';
import { FiBell, FiCheck, FiCheckCircle, FiX, FiMail, FiInfo, FiAlertTriangle, FiXCircle } from 'react-icons/fi';
import { communicationAPI } from '../services/api';
import toast from 'react-hot-toast';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await communicationAPI.getNotifications();
            setNotifications(response.data.notifications || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch notifications.');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await communicationAPI.markNotificationRead(id);
            setNotifications(prev => prev.map(notif =>
                notif.id === id ? { ...notif, is_read: true } : notif
            ));
            toast.success('Notification marked as read');
        } catch (err) {
            toast.error('Failed to mark notification as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            await communicationAPI.markAllNotificationsRead();
            setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
            toast.success('All notifications marked as read');
        } catch (err) {
            toast.error('Failed to mark all notifications as read');
        }
    };

    const deleteNotification = async (id) => {
        try {
            await communicationAPI.deleteNotification(id);
            setNotifications(prev => prev.filter(notif => notif.id !== id));
            toast.success('Notification deleted');
        } catch (err) {
            toast.error('Failed to delete notification');
        }
    };

    const clearAllNotifications = async () => {
        if (!window.confirm('Are you sure you want to clear all notifications? This cannot be undone.')) return;
        try {
            await communicationAPI.clearAllNotifications();
            setNotifications([]);
            toast.success('All notifications cleared');
        } catch (err) {
            toast.error('Failed to clear notifications');
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success':
                return <FiCheckCircle className="text-success me-2" />;
            case 'warning':
                return <FiAlertTriangle className="text-warning me-2" />;
            case 'danger':
                return <FiXCircle className="text-danger me-2" />;
            default:
                return <FiInfo className="text-info me-2" />;
        }
    };

    const getNotificationBadge = (type) => {
        switch (type) {
            case 'success':
                return 'success';
            case 'warning':
                return 'warning';
            case 'danger':
                return 'danger';
            default:
                return 'info';
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
        <div className="notifications-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Notifications</h2>
                    <p className="text-muted mb-0">Manage your system and activity notifications</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-danger" className="d-flex align-items-center" onClick={clearAllNotifications}>
                        <FiXCircle className="me-2" /> Clear All
                    </Button>
                    <Button variant="outline-secondary" className="d-flex align-items-center" onClick={markAllAsRead}>
                        <FiCheck className="me-2" /> Mark All Read
                    </Button>
                    <Button variant="primary" className="d-flex align-items-center" onClick={fetchNotifications}>
                        <FiMail className="me-2" /> Refresh
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="g-4 mb-4">
                <Col lg={12}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Recent Notifications</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-4">Status</th>
                                            <th>Title</th>
                                            <th>Message</th>
                                            <th>Date</th>
                                            <th className="text-end pe-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {notifications.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="text-center py-5">
                                                    <div className="d-flex flex-column align-items-center">
                                                        <FiBell size={48} className="text-muted mb-3" />
                                                        <h5 className="fw-bold text-dark">No notifications</h5>
                                                        <p className="text-muted mb-0">You have no new notifications</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            notifications.map(notification => (
                                                <tr key={notification.id} className={!notification.is_read ? 'bg-light' : ''}>
                                                    <td className="ps-4">
                                                        {!notification.is_read ? (
                                                            <Badge bg="primary" className="fw-normal">Unread</Badge>
                                                        ) : (
                                                            <Badge bg="secondary" className="fw-normal">Read</Badge>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            {getNotificationIcon(notification.type)}
                                                            <div className="fw-bold">{notification.title}</div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="text-muted small">{notification.message}</div>
                                                    </td>
                                                    <td>
                                                        <div className="small text-muted">
                                                            {new Date(notification.created_at).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        {!notification.is_read && (
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                className="me-2"
                                                                onClick={() => markAsRead(notification.id)}
                                                            >
                                                                Mark Read
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            className="me-2"
                                                            onClick={() => deleteNotification(notification.id)}
                                                        >
                                                            <FiX />
                                                        </Button>
                                                        <Badge bg={getNotificationBadge(notification.type)} className="fw-normal">
                                                            {notification.type}
                                                        </Badge>
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
        </div>
    );
};

export default Notifications;