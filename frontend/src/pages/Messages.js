import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Alert, Table, Modal, Form } from 'react-bootstrap';
import { FiMessageSquare, FiMail, FiSend, FiUser, FiCalendar, FiCheck, FiX } from 'react-icons/fi';
import { communicationAPI } from '../services/api';
import toast from 'react-hot-toast';

const Messages = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [messageType, setMessageType] = useState('inbox'); // inbox or sent
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [composeData, setComposeData] = useState({
        recipient: '',
        subject: '',
        content: ''
    });

    useEffect(() => {
        fetchMessages();
    }, [messageType]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await communicationAPI.getMessages({ type: messageType });
            setMessages(response.data.messages || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch messages.');
        } finally {
            setLoading(false);
        }
    };

    const handleComposeSubmit = async (e) => {
        e.preventDefault();
        try {
            await communicationAPI.sendMessage(composeData);
            toast.success('Message sent successfully');
            setShowComposeModal(false);
            setComposeData({ recipient: '', subject: '', content: '' });
            fetchMessages();
        } catch (err) {
            toast.error('Failed to send message');
        }
    };

    const markAsRead = async (id) => {
        try {
            await communicationAPI.updateMessage(id, { is_read: true });
            setMessages(prev => prev.map(msg => 
                msg.id === id ? { ...msg, is_read: true } : msg
            ));
            toast.success('Message marked as read');
        } catch (err) {
            toast.error('Failed to mark message as read');
        }
    };

    const getSenderOrRecipient = (message) => {
        if (messageType === 'inbox') {
            return message.sender ? `${message.sender.first_name} ${message.sender.last_name}` : 'Unknown';
        } else {
            return message.recipient ? `${message.recipient.first_name} ${message.recipient.last_name}` : 'Unknown';
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
        <div className="messages-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Messages</h2>
                    <p className="text-muted mb-0">Send and receive internal messages</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button 
                        variant={messageType === 'inbox' ? 'primary' : 'outline-secondary'} 
                        className="d-flex align-items-center"
                        onClick={() => setMessageType('inbox')}
                    >
                        <FiMail className="me-2" /> Inbox
                    </Button>
                    <Button 
                        variant={messageType === 'sent' ? 'primary' : 'outline-secondary'} 
                        className="d-flex align-items-center"
                        onClick={() => setMessageType('sent')}
                    >
                        <FiSend className="me-2" /> Sent
                    </Button>
                    <Button 
                        variant="primary" 
                        className="d-flex align-items-center"
                        onClick={() => setShowComposeModal(true)}
                    >
                        <FiSend className="me-2" /> Compose
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="g-4 mb-4">
                <Col lg={12}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">{messageType === 'inbox' ? 'Inbox' : 'Sent Messages'}</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="ps-4">Status</th>
                                            <th>{messageType === 'inbox' ? 'From' : 'To'}</th>
                                            <th>Subject</th>
                                            <th>Date</th>
                                            <th className="text-end pe-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {messages.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="text-center py-5">
                                                    <div className="d-flex flex-column align-items-center">
                                                        <FiMessageSquare size={48} className="text-muted mb-3" />
                                                        <h5 className="fw-bold text-dark">No messages</h5>
                                                        <p className="text-muted mb-0">
                                                            {messageType === 'inbox' 
                                                                ? 'You have no messages in your inbox' 
                                                                : 'You have not sent any messages yet'}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            messages.map(message => (
                                                <tr key={message.id} className={!message.is_read && messageType === 'inbox' ? 'bg-light' : ''}>
                                                    <td className="ps-4">
                                                        {!message.is_read && messageType === 'inbox' ? (
                                                            <Badge bg="primary" className="fw-normal">Unread</Badge>
                                                        ) : (
                                                            <Badge bg="secondary" className="fw-normal">Read</Badge>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <FiUser className="text-muted me-2" />
                                                            <div>{getSenderOrRecipient(message)}</div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="fw-bold">{message.subject}</div>
                                                        <div className="text-muted small">
                                                            {message.content.length > 50 
                                                                ? message.content.substring(0, 50) + '...' 
                                                                : message.content}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="small text-muted">
                                                            {new Date(message.created_at).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        {messageType === 'inbox' && !message.is_read && (
                                                            <Button 
                                                                variant="outline-primary" 
                                                                size="sm" 
                                                                className="me-2"
                                                                onClick={() => markAsRead(message.id)}
                                                            >
                                                                Mark Read
                                                            </Button>
                                                        )}
                                                        <Button 
                                                            variant="outline-secondary" 
                                                            size="sm"
                                                            onClick={async () => {
                                                                const response = await communicationAPI.getMessage(message.id);
                                                                alert(`Subject: ${response.data.message.subject}\n\n${response.data.message.content}`);
                                                            }}
                                                        >
                                                            View
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

            {/* Compose Message Modal */}
            <Modal show={showComposeModal} onHide={() => setShowComposeModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Compose Message</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleComposeSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Recipient</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter recipient username"
                                value={composeData.recipient}
                                onChange={(e) => setComposeData({ ...composeData, recipient: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Subject</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter subject"
                                value={composeData.subject}
                                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Message</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={5}
                                placeholder="Enter your message"
                                value={composeData.content}
                                onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
                                required
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowComposeModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Send Message
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default Messages;
