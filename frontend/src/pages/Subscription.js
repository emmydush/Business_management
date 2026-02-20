import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiX, FiAward, FiZap, FiStar, FiActivity, FiClock, FiAlertTriangle, FiPhone, FiCreditCard } from 'react-icons/fi';
import { superadminAPI, authAPI, paymentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useI18n } from '../i18n/I18nProvider';
import { useSubscription } from '../context/SubscriptionContext';
import { useCurrency } from '../context/CurrencyContext';
import momoIcon from '../assets/images/momo_icon.png';

const Subscription = () => {
    const { t } = useI18n();
    const navigate = useNavigate();
    const { refreshSubscriptionStatus } = useSubscription();
    const { formatCurrency } = useCurrency();
    const [plans, setPlans] = useState([]);
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [paymentInProgress, setPaymentInProgress] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState(null);

    useEffect(() => {
        fetchPlans();
        fetchCurrentSubscription();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await superadminAPI.getPlans();
            setPlans(response.data.plans || []);
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('Failed to load subscription plans');
        }
    };

    const fetchCurrentSubscription = async () => {
        try {
            const response = await authAPI.getSubscriptionStatus();
            setCurrentSubscription(response.data.subscription);
        } catch (error) {
            console.error('Error fetching current subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (planId) => {
        const plan = plans.find(p => p.id === planId);
        setSelectedPlan(plan);
        setPhoneNumber('');
        setPaymentDetails(null);
        setShowPaymentModal(true);
    };

    const handleMoMoPayment = async () => {
        if (!phoneNumber.trim()) {
            toast.error('Please enter your phone number');
            return;
        }

        try {
            setPaymentInProgress(true);
            toast.loading('Initiating MoMo payment...');

            // Initiate MoMo payment
            const paymentResponse = await paymentsAPI.initiateMoMoPayment({
                amount: selectedPlan.price,
                phone_number: phoneNumber,
                description: `Subscription: ${selectedPlan.name}`,
                metadata: {
                    plan_id: selectedPlan.id,
                    plan_name: selectedPlan.name,
                    billing_cycle: selectedPlan.billing_cycle
                }
            });

            if (paymentResponse.data.success) {
                const status = paymentResponse.data.status || 'pending';
                
                // Check if payment failed immediately
                if (status === 'failed' || status === 'cancelled') {
                    toast.dismiss();
                    toast.error('❌ Payment failed. Please try again with a different number.');
                    return;
                }
                
                setPaymentDetails(paymentResponse.data);
                toast.dismiss();
                
                if (status === 'completed') {
                    toast.success('✅ Payment approved! Click "Confirm & Activate" to complete.');
                } else {
                    toast.success('📲 Payment request sent! Please complete payment on your phone.');
                }
            } else {
                toast.dismiss();
                toast.error(paymentResponse.data?.error || 'Failed to initiate payment');
            }
        } catch (error) {
            toast.dismiss();
            const errorData = error.response?.data;
            let errorMsg = 'Failed to initiate payment';
            
            // Provide more specific error messages based on backend response
            if (errorData?.code === 'CONFIGURATION_ERROR') {
                errorMsg = 'Payment service is not available. Please contact support.';
            } else if (errorData?.code === 'PAYMENT_ERROR') {
                errorMsg = 'Payment processing error. Please try again.';
            } else if (errorData?.error) {
                errorMsg = errorData.error;
            }
            
            toast.error(`❌ ${errorMsg}`);
            console.error('Payment error:', error);
        } finally {
            setPaymentInProgress(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!paymentDetails) {
            toast.error('Please complete payment first');
            return;
        }

        try {
            setSubscribing(true);
            toast.loading('Verifying payment status...');

            // First check the actual payment status from MoMo
            let currentPaymentStatus = paymentDetails.status || 'pending';
            
            // If status is still pending, check with backend
            if (currentPaymentStatus === 'pending' && paymentDetails.provider_reference) {
                try {
                    const statusRes = await paymentsAPI.getMoMoPaymentStatus(paymentDetails.provider_reference);
                    currentPaymentStatus = statusRes.data?.status || currentPaymentStatus;
                } catch (statusErr) {
                    console.error('Error checking payment status:', statusErr);
                    // Continue with what we have
                }
            }

            // Check if payment failed
            if (currentPaymentStatus === 'failed' || currentPaymentStatus === 'cancelled') {
                toast.dismiss();
                toast.error('❌ Payment failed. Please try again.');
                setPaymentDetails(null);
                setShowPaymentModal(false);
                return;
            }

            // Record payment and create subscription
            const paymentData = {
                plan_id: selectedPlan.id,
                amount: selectedPlan.price,
                provider: 'momo',
                provider_reference: paymentDetails.provider_reference || paymentDetails.reference_id,
                phone_number: phoneNumber,
                description: `Subscription: ${selectedPlan.name}`,
                status: currentPaymentStatus
            };

            const subscriptionResponse = await authAPI.recordSubscriptionPayment(paymentData);

            toast.dismiss();
            toast.success('🎉 Subscription activated successfully!');
            
            // Wait a moment for user to see the success message
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Refresh subscription status in context
            if (refreshSubscriptionStatus) {
                await refreshSubscriptionStatus();
            }
            
            // Clear payment details
            setPaymentDetails(null);
            
            // Close modal
            setShowPaymentModal(false);
            
            // Redirect to dashboard where banner will automatically disappear
            navigate('/dashboard');
            
        } catch (error) {
            toast.dismiss();
            const errorMsg = error.response?.data?.error || 'Failed to confirm subscription';
            toast.error(`❌ ${errorMsg}`);
            
            // Reset payment details on failure so user can retry
            if (error.response?.status === 400 || error.response?.status === 401) {
                setPaymentDetails(null);
                setShowPaymentModal(false);
            }
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
                return <FiAward size={24} />;
            default:
                return <FiActivity size={24} />;
        }
    };

    const getPlanColor = (planType) => {
        switch (planType) {
            case 'free':
                return 'secondary';
            case 'basic':
                return 'primary';
            case 'professional':
                return 'danger'; // Changed to danger/red for more prominent Professional plan
            case 'enterprise':
                return 'warning';
            default:
                return 'info';
        }
    };

    const isPopularPlan = (planType) => {
        return planType === 'professional';
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

            {/* Current Subscription Status */}
            {currentSubscription && (
                <Alert variant={currentSubscription.status === 'pending' ? 'info' : 'success'} className="mb-4 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                    <Row className="align-items-center justify-content-between">
                        <Col md="auto">
                            <div className="d-flex align-items-center">
                                <div className={`me-3 d-flex align-items-center justify-content-center rounded-circle ${currentSubscription.status === 'pending' ? 'bg-info bg-opacity-10' : 'bg-success bg-opacity-10'}`} style={{ width: '48px', height: '48px' }}>
                                    {currentSubscription.status === 'pending' ? (
                                        <FiClock size={24} className="text-info" />
                                    ) : (
                                        <FiCheck size={24} className="text-success" />
                                    )}
                                </div>
                                <div>
                                    <strong className="d-block">
                                        {currentSubscription.status === 'pending' ? 'Requested Plan:' : 'Active Subscription:'}{' '}
                                        <span className="text-primary">{currentSubscription.plan?.name}</span>
                                    </strong>
                                    <small className="text-muted">
                                        {currentSubscription.status === 'pending' 
                                            ? 'Status: Waiting for SuperAdmin Approval'
                                            : `Valid until: ${new Date(currentSubscription.end_date).toLocaleDateString()}`}
                                    </small>
                                </div>
                            </div>
                        </Col>
                        <Col md="auto">
                            <Badge bg={currentSubscription.status === 'pending' ? 'info' : 'success'} className="px-3 py-2 fs-6">
                                {currentSubscription.status.toUpperCase()}
                            </Badge>
                        </Col>
                    </Row>
                </Alert>
            )}

            {/* No Subscription Warning */}
            {!currentSubscription && (
                <Alert variant="warning" className="mb-4 border-0 shadow-sm" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}>
                    <Row className="align-items-center">
                        <Col md="auto">
                            <div className="d-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-circle" style={{ width: '56px', height: '56px' }}>
                                <FiAlertTriangle size={28} className="text-warning" />
                            </div>
                        </Col>
                        <Col>
                            <h5 className="fw-bold mb-1">
                                <span className="text-warning">⚠️ No Active Subscription</span>
                            </h5>
                            <p className="mb-0 text-dark">
                                You need an active subscription to create products, orders, customers, and other business resources.
                                Please select a plan from the options below to continue using all features.
                            </p>
                        </Col>
                    </Row>
                </Alert>
            )}

            <Row className="g-4">
                {plans.map((plan) => (
                    <Col key={plan.id} md={6} lg={3}>
                        <Card className={`h-100 border-0 shadow-sm hover-shadow ${isPopularPlan(plan.plan_type) ? 'border-danger border-2' : ''}`} style={{ transition: 'all 0.3s' }}>
                            <Card.Header className={`bg-${getPlanColor(plan.plan_type)} text-white text-center py-4 position-relative`}>
                                {isPopularPlan(plan.plan_type) && (
                                    <Badge bg="warning" text="dark" className="position-absolute top-0 start-50 translate-middle" style={{ fontSize: '0.7rem', padding: '0.35em 0.65em' }}>
                                        Most Popular
                                    </Badge>
                                )}
                                <div className="mb-2 mt-2">{getPlanIcon(plan.plan_type)}</div>
                                <h4 className="fw-bold mb-0">{plan.name}</h4>
                            </Card.Header>
                            <Card.Body className="d-flex flex-column">
                                <div className="text-center mb-4">
                                    <h2 className="fw-bold mb-0">
                                        {formatCurrency(plan.price)}
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
                                        {plan.features && plan.features.slice(0, 8).map((feature, index) => (
                                            <li key={index} className="mb-1">
                                                <FiCheck className="text-success me-1" />
                                                {feature}
                                            </li>
                                        ))}
                                        {plan.features && plan.features.length > 8 && (
                                            <li className="mb-1 text-muted">
                                                + {plan.features.length - 8} more features
                                            </li>
                                        )}
                                    </ul>
                                </div>

                                <Button
                                    variant={getPlanColor(plan.plan_type)}
                                    className="w-100 mt-3"
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={subscribing || (currentSubscription?.plan_id === plan.id)}
                                >
                                    {currentSubscription?.plan_id === plan.id
                                        ? (currentSubscription.status === 'pending' ? 'Pending Approval' : 'Current Plan')
                                        : 'Subscribe'}
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Legacy Warning - kept for compatibility */}
            {!currentSubscription && (
                <Alert variant="warning" className="mt-4">
                    <strong>⚠️ No Active Subscription</strong>
                    <p className="mb-0">
                        You need an active subscription to create products, orders, and other resources.
                        Please select a plan above to continue.
                    </p>
                </Alert>
            )}

            {/* MoMo Payment Modal */}
            <Modal show={showPaymentModal} onHide={() => !paymentInProgress && !subscribing && setShowPaymentModal(false)} centered>
                <Modal.Header closeButton disabled={paymentInProgress || subscribing}>
                    <Modal.Title className="d-flex align-items-center">
                        <img src={momoIcon} alt="MoMo" style={{ height: '32px', marginRight: '10px' }} />
                        Complete Payment
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPlan && !paymentDetails && (
                        <>
                            <div className="text-center mb-4">
                                <img src={momoIcon} alt="MoMo Payment" style={{ height: '80px', marginBottom: '20px' }} />
                            </div>
                            
                            <div className="mb-4 p-3 bg-light rounded">
                                <h5 className="fw-bold mb-2">{selectedPlan.name}</h5>
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="text-muted">Plan Price:</span>
                                    <span className="fw-bold fs-5">{formatCurrency(selectedPlan.price)}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mt-2">
                                    <span className="text-muted">Billing Cycle:</span>
                                    <span className="fw-bold">{selectedPlan.billing_cycle}</span>
                                </div>
                            </div>

                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">
                                        <FiPhone className="me-2" />
                                        Phone Number (MoMo)
                                    </Form.Label>
                                    <Form.Control
                                        type="tel"
                                        placeholder="e.g., 250788123456"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        disabled={paymentInProgress}
                                        pattern="[0-9+\-\s]+"
                                    />
                                    <Form.Text className="text-muted">
                                        Enter your MTN MoMo phone number to proceed with payment
                                    </Form.Text>
                                </Form.Group>
                            </Form>
                        </>
                    )}

                    {paymentDetails && (
                        <div className="text-center">
                            <div className="mb-4">
                                <img src={momoIcon} alt="MoMo" style={{ height: '100px', marginBottom: '20px' }} />
                            </div>
                            <div className="mb-4 p-3 bg-success bg-opacity-10 rounded">
                                <FiCheck size={48} className="text-success mb-2" />
                                <h5 className="fw-bold text-success">Payment Initiated</h5>
                            </div>
                            <div className="mb-3 p-3 bg-light rounded">
                                <p className="mb-2"><strong>Reference:</strong> {paymentDetails.provider_reference}</p>
                                <p className="mb-0"><strong>Status:</strong> {paymentDetails.status}</p>
                            </div>
                            <Alert variant="info" className="mb-0">
                                <strong>Next Steps:</strong>
                                <p className="mb-0 mt-2">
                                    {paymentDetails.instructions?.type === 'ussd' && (
                                        <>
                                            Dial the following USSD code from your phone:
                                            <br />
                                            <code className="bg-white p-2 d-block mt-2 rounded border">
                                                {paymentDetails.instructions?.code}
                                            </code>
                                        </>
                                    )}
                                </p>
                            </Alert>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="secondary" 
                        onClick={() => !paymentInProgress && !subscribing && setShowPaymentModal(false)}
                        disabled={paymentInProgress || subscribing}
                    >
                        Cancel
                    </Button>
                    {!paymentDetails ? (
                        <Button 
                            variant="primary" 
                            onClick={handleMoMoPayment}
                            disabled={paymentInProgress || !phoneNumber.trim()}
                        >
                            {paymentInProgress ? <Spinner size="sm" className="me-2" /> : null}
                            Proceed to Payment
                        </Button>
                    ) : (
                        <Button 
                            variant="success" 
                            onClick={handleConfirmPayment}
                            disabled={subscribing}
                        >
                            {subscribing ? <Spinner size="sm" className="me-2" /> : null}
                            Confirm & Activate
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default Subscription;
