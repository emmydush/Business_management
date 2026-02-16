import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, ListGroup, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

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
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title>
                    <div className="d-flex align-items-center">
                        <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                            <span className="text-warning fw-bold">⚠️</span>
                        </div>
                        <div>
                            <h5 className="mb-1">Feature Upgrade Required</h5>
                            <p className="text-muted mb-0 small">
                                {error.feature_required} is not available in your current plan
                            </p>
                        </div>
                    </div>
                </Modal.Title>
            </Modal.Header>
            
            <Modal.Body className="pt-0">
                <Alert variant="warning" className="border-0">
                    <div className="d-flex">
                        <div className="me-3">
                            <span className="text-warning">💡</span>
                        </div>
                        <div>
                            <p className="mb-2">
                                <strong>{error.message}</strong>
                            </p>
                            <p className="mb-0">
                                {error.upgrade_message}
                            </p>
                        </div>
                    </div>
                </Alert>

                {plans.length > 0 && (
                    <div className="mt-4">
                        <h6 className="mb-3">Available Plans with {error.feature_required}:</h6>
                        <ListGroup>
                            {plans.map((plan, index) => (
                                <ListGroup.Item 
                                    key={plan.id} 
                                    className="d-flex justify-content-between align-items-center border-start border-4 border-primary"
                                >
                                    <div>
                                        <div className="d-flex align-items-center mb-1">
                                            <h6 className="mb-0 me-2">{plan.name}</h6>
                                            <Badge bg="primary" className="fw-normal">
                                                ${plan.price}/month
                                            </Badge>
                                        </div>
                                        <small className="text-muted">
                                            Includes {error.feature_required} and other premium features
                                        </small>
                                    </div>
                                    <Button 
                                        variant="outline-primary" 
                                        size="sm"
                                        onClick={handleUpgrade}
                                    >
                                        Upgrade Now
                                    </Button>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </div>
                )}

                <div className="mt-4 bg-light bg-opacity-50 p-3 rounded">
                    <h6 className="mb-2">What you'll get:</h6>
                    <ul className="mb-0 small">
                        <li>Access to {error.feature_required} functionality</li>
                        <li>All features included in the upgraded plan</li>
                        <li>Priority support and regular updates</li>
                        <li>No interruption to your existing data</li>
                    </ul>
                </div>
            </Modal.Body>
            
            <Modal.Footer className="border-0 pt-0">
                <Button variant="secondary" onClick={onHide}>
                    Maybe Later
                </Button>
                <Button variant="primary" onClick={handleUpgrade}>
                    View Subscription Plans
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SubscriptionUpgradeModal;