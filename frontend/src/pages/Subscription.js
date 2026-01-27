import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { FiCheck, FiX, FiCrown, FiZap, FiStar, FiRocket } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useI18n } from '../i18n/I18nProvider';

const Subscription = () => {
    const { t } = useI18n();
    const [plans, setPlans] = useState([]);
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState(false);

    useEffect(() => {
        fetchPlans();
        fetchCurrentSubscription();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await axios.get('/api/subscriptions/plans');
            setPlans(response.data.plans || []);
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('Failed to load subscription plans');
        }
    };

    const fetchCurrentSubscription = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get('/api/subscriptions/subscription/current', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCurrentSubscription(response.data.subscription);
        } catch (error) {
            console.error('Error fetching current subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (planId) => {
        try {
            setSubscribing(true);
            const token = localStorage.getItem('authToken');
            const response = await axios.post(
                '/api/subscriptions/subscribe',
                { plan_id: planId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Successfully subscribed to plan!');
            fetchCurrentSubscription();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to subscribe to plan');
        } finally {
            setSubscribing(false);
        }
    };

    const getPlanIcon = (planType) => {
        switch (planType) {
            case 'free':
                return <FiCheck size={24} />;
            case 'basic':
                return <FiZap size={24} />;
            case 'professional':
                return <FiStar size={24} />;
            case 'enterprise':
                return <FiRocket size={24} />;
            default:
                return <FiCrown size={24} />;
        }
    };

    const getPlanColor = (planType) => {
        switch (planType) {
            case 'free':
                return 'secondary';
            case 'basic':
                return 'primary';
            case 'professional':
                return 'success';
            case 'enterprise':
                return 'warning';
            default:
                return 'info';
        }
    };

    if (loading) {
        return (
            <Container fluid className="text-center py-5">
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">
            <div className="mb-4">
                <h1 className="fw-bold text-dark mb-1">Subscription Plans</h1>
                <p className="text-muted mb-0">Choose the perfect plan for your business</p>
            </div>

            {currentSubscription && (
                <Alert variant="success" className="mb-4">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>Active Subscription:</strong> {currentSubscription.plan?.name}
                            <br />
                            <small>
                                Valid until: {new Date(currentSubscription.end_date).toLocaleDateString()}
                            </small>
                        </div>
                        <Badge bg="success" className="px-3 py-2">
                            {currentSubscription.status.toUpperCase()}
                        </Badge>
                    </div>
                </Alert>
            )}

            <Row className="g-4">
                {plans.map((plan) => (
                    <Col key={plan.id} md={6} lg={3}>
                        <Card className="h-100 border-0 shadow-sm hover-shadow" style={{ transition: 'all 0.3s' }}>
                            <Card.Header className={`bg-${getPlanColor(plan.plan_type)} text-white text-center py-4`}>
                                <div className="mb-2">{getPlanIcon(plan.plan_type)}</div>
                                <h4 className="fw-bold mb-0">{plan.name}</h4>
                            </Card.Header>
                            <Card.Body className="d-flex flex-column">
                                <div className="text-center mb-4">
                                    <h2 className="fw-bold mb-0">
                                        ${plan.price}
                                        <small className="text-muted fs-6">/{plan.billing_cycle}</small>
                                    </h2>
                                </div>

                                <div className="mb-4">
                                    <div className="small text-muted mb-2">
                                        <strong>Limits:</strong>
                                    </div>
                                    <ul className="list-unstyled small">
                                        <li className="mb-1">
                                            <FiCheck className="text-success me-1" />
                                            {plan.max_users === 999999 ? 'Unlimited' : plan.max_users} Users
                                        </li>
                                        <li className="mb-1">
                                            <FiCheck className="text-success me-1" />
                                            {plan.max_products === 999999 ? 'Unlimited' : plan.max_products} Products
                                        </li>
                                        <li className="mb-1">
                                            <FiCheck className="text-success me-1" />
                                            {plan.max_orders === 999999 ? 'Unlimited' : plan.max_orders} Orders
                                        </li>
                                        <li className="mb-1">
                                            <FiCheck className="text-success me-1" />
                                            {plan.max_branches === 999999 ? 'Unlimited' : plan.max_branches} Branches
                                        </li>
                                    </ul>
                                </div>

                                <div className="mb-auto">
                                    <div className="small text-muted mb-2">
                                        <strong>Features:</strong>
                                    </div>
                                    <ul className="list-unstyled small">
                                        {plan.features && plan.features.map((feature, index) => (
                                            <li key={index} className="mb-1">
                                                <FiCheck className="text-success me-1" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <Button
                                    variant={getPlanColor(plan.plan_type)}
                                    className="w-100 mt-3"
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={subscribing || (currentSubscription?.plan_id === plan.id)}
                                >
                                    {currentSubscription?.plan_id === plan.id ? 'Current Plan' : 'Subscribe'}
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {!currentSubscription && (
                <Alert variant="warning" className="mt-4">
                    <strong>⚠️ No Active Subscription</strong>
                    <p className="mb-0">
                        You need an active subscription to create products, orders, and other resources.
                        Please select a plan above to continue.
                    </p>
                </Alert>
            )}
        </Container>
    );
};

export default Subscription;
