import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, ListGroup, Badge, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiCheck, FiStar } from 'react-icons/fi';

/**
 * Component to handle subscription-related error messages and upgrade suggestions
 * 
 * @param {Object} props
 * @param {Object} props.error - Error object from API response
 * @param {boolean} props.show - Whether to show the modal
 * @param {function} props.onHide - Function to call when modal is closed
 */
const SubscriptionUpgradeModal = ({ error, show, onHide }) => {
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);

    useEffect(() => {
        if (error?.available_plans) {
            setPlans(error.available_plans);
        }
    }, [error]);

    const handleUpgrade = () => {
        onHide();
        navigate('/subscription');
    };

    if (!show || !error) return null;

    return (
        <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
            <Modal.Header closeButton className="border-0 pb-0 bg-light">
                <Modal.Title>
                    <div className="d-flex align-items-center">
                        <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3">
                            <FiAlertTriangle size={32} className="text-warning" />
                        </div>
                        <div>
                            <h4 className="fw-bold mb-1">Upgrade Required</h4>
                            <p className="text-muted mb-0 small">
                                <strong>{error?.feature_required}</strong> is not available in your current plan
                            </p>
                        </div>
                    </div>
                </Modal.Title>
            </Modal.Header>
            
            <Modal.Body className="pt-3">
                <Alert variant="warning" className="border-0 mb-4" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '12px' }}>
                    <div className="d-flex">
                        <div className="me-3 mt-1">
                            <span className="text-warning" style={{ fontSize: '24px' }}>💡</span>
                        </div>
                        <div>
                            <h6 className="fw-bold mb-2">{error?.message}</h6>
                            <p className="mb-0 text-dark">
                                {error?.upgrade_message}
                            </p>
                        </div>
                    </div>
                </Alert>

                {plans.length > 0 && (
                    <div className="mt-4">
                        <h6 className="fw-bold mb-3">
                            <FiStar className="me-2 text-primary" />
                            Available Plans with {error?.feature_required}:
                        </h6>
                        <ListGroup>
                            {plans.map((plan, index) => (
                                <ListGroup.Item 
                                    key={plan.id} 
                                    className="d-flex justify-content-between align-items-center border-start border-4 border-primary mb-2"
                                    style={{ borderRadius: '8px' }}
                                >
                                    <div className="py-2">
                                        <div className="d-flex align-items-center mb-1">
                                            <h6 className="mb-0 me-2 fw-bold">{plan.name}</h6>
                                            <Badge bg="primary" className="fw-normal">
                                                ${plan.price}/month
                                            </Badge>
                                        </div>
                                        <small className="text-muted">
                                            ✓ Includes {error?.feature_required} and other premium features
                                        </small>
                                    </div>
                                    <Button 
                                        variant="outline-primary" 
                                        size="sm"
                                        className="fw-bold"
                                        style={{ borderRadius: '6px' }}
                                        onClick={handleUpgrade}
                                    >
                                        Upgrade Now
                                    </Button>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </div>
                )}

                <div className="mt-4 bg-light p-4 rounded" style={{ borderRadius: '12px' }}>
                    <h6 className="fw-bold mb-3">
                        <FiCheck className="me-2 text-success" />
                        What you'll get:
                    </h6>
                    <Row>
                        <Col md={6}>
                            <ul className="mb-0 small">
                                <li className="mb-2">
                                    <FiCheck className="text-success me-2" />
                                    Access to {error?.feature_required} functionality
                                </li>
                                <li className="mb-2">
                                    <FiCheck className="text-success me-2" />
                                    All features included in the upgraded plan
                                </li>
                            </ul>
                        </Col>
                        <Col md={6}>
                            <ul className="mb-0 small">
                                <li className="mb-2">
                                    <FiCheck className="text-success me-2" />
                                    Priority support and regular updates
                                </li>
                                <li className="mb-2">
                                    <FiCheck className="text-success me-2" />
                                    No interruption to your existing data
                                </li>
                            </ul>
                        </Col>
                    </Row>
                </div>
            </Modal.Body>
            
            <Modal.Footer className="border-0 pt-0">
                <Button variant="secondary" onClick={onHide} className="px-4">
                    Maybe Later
                </Button>
                <Button variant="primary" onClick={handleUpgrade} className="px-4 fw-bold">
                    View Subscription Plans
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SubscriptionUpgradeModal;