import React, { useState, useEffect } from 'react';
import { Container, Spinner, Card, Button, Alert, Row, Col } from 'react-bootstrap';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useSubscription } from '../context/SubscriptionContext';
import { FiClock, FiShield, FiAlertTriangle, FiCheckCircle, FiStar } from 'react-icons/fi';

const Layout = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showBanner, setShowBanner] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const subscriptionData = useSubscription();
    const { subscription, loading: subLoading, is_superadmin, has_subscription } = subscriptionData || {};

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    // Show subscription banner briefly (3 seconds) on mount, then hide
    useEffect(() => {
        setShowBanner(true);
        const timer = setTimeout(() => setShowBanner(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    // Wait a bit after subscription loading completes before showing banners
    useEffect(() => {
        if (subLoading === false) {
            const timer = setTimeout(() => setInitialLoadComplete(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [subLoading]);

    const isPending = subscription?.status === 'pending' && !is_superadmin && window.location.pathname !== '/subscription';
    const isNoSubscription = (subLoading === false || !subLoading) && !has_subscription && !is_superadmin && window.location.pathname !== '/subscription' && initialLoadComplete;
    const isDashboardPage = window.location.pathname === '/dashboard';

    if (subLoading === true) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-dark">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="layout-container">
            <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

            {/* Mobile Sidebar Overlay */}
            {!isCollapsed && (
                <div
                    className="sidebar-overlay d-lg-none"
                    onClick={toggleSidebar}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 1150,
                        backdropFilter: 'blur(2px)'
                    }}
                />
            )}

            <div
                className="main-content d-flex flex-column min-vh-100"
                style={{
                    marginLeft: isCollapsed ? '80px' : '260px',
                    transition: 'margin-left 0.3s ease',
                    paddingTop: '24px'
                }}
            >
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media (max-width: 991.98px) {
                        .main-content {
                            margin-left: 0 !important;
                            padding-top: 12px !important;
                        }
                        
                        .main-content .container-fluid {
                            padding: 0.75rem !important;
                        }
                    }
                    
                    @media (max-width: 576px) {
                        .main-content {
                            padding-top: 10px !important;
                        }
                        
                        .main-content .container-fluid {
                            padding: 0.5rem !important;
                        }
                    }
                `}} />
                <Navbar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
                <Container fluid className="flex-grow-1 p-4">
                    {isPending ? (
                        <div className="d-flex justify-content-center align-items-center h-100">
                            <Card className="border-0 shadow-lg text-center p-5 bg-dark text-white" style={{ maxWidth: '600px', borderRadius: '20px' }}>
                                <Card.Body>
                                    <div className="mb-4">
                                        <div className="bg-primary bg-opacity-10 p-4 rounded-circle d-inline-block mb-3">
                                            <FiClock size={60} className="text-primary" />
                                        </div>
                                        <h2 className="fw-bold mb-3">Subscription Pending Approval</h2>
                                        <p className="text-muted fs-5 mb-4">
                                            Thank you for choosing the <strong>{subscription.plan?.name}</strong> plan.
                                            Your request has been sent to the SuperAdmin for review.
                                        </p>
                                        <div className="bg-light bg-opacity-5 p-3 rounded-3 mb-4 text-start">
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <FiShield className="text-success" />
                                                <span className="small fw-bold">Next Steps:</span>
                                            </div>
                                            <ul className="small text-muted mb-0">
                                                <li>SuperAdmin will verify your payment/request.</li>
                                                <li>Once approved, your account limits will be updated automatically.</li>
                                                <li>You will receive full access to all features of your new plan.</li>
                                            </ul>
                                        </div>
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            className="px-5 py-3 rounded-pill fw-bold"
                                            onClick={() => window.location.href = '/subscription'}
                                        >
                                            View Subscription Status
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    ) : (
                        <>
                            {/* Subscription Required Banner */}
                            {isNoSubscription && (
                                <Alert variant="warning" className="mb-4 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                    <Row className="align-items-center">
                                        <Col md="auto">
                                            <div className="d-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-circle" style={{ width: '60px', height: '60px' }}>
                                                <FiAlertTriangle size={28} className="text-warning" />
                                            </div>
                                        </Col>
                                        <Col>
                                            <h5 className="fw-bold mb-1">
                                                <span className="text-warning">⚠️ Action Required: Choose a Subscription Plan</span>
                                            </h5>
                                            <p className="mb-0 text-dark">
                                                To access all business features and create products, orders, customers, and more, 
                                                you need an active subscription. Please choose a plan below to continue.
                                            </p>
                                        </Col>
                                        <Col md="auto" className="mt-3 mt-md-0">
                                            <Button
                                                variant="warning"
                                                size="lg"
                                                className="px-4 fw-bold shadow"
                                                style={{ borderRadius: '8px' }}
                                                onClick={() => window.location.href = '/subscription'}
                                            >
                                                <FiStar className="me-2" />
                                                Choose Plan Now
                                            </Button>
                                        </Col>
                                    </Row>
                                </Alert>
                            )}
                            
                            {/* Subscription Active Banner */}
                            {!isNoSubscription && subscription && subscription.status === 'active' && !isDashboardPage && showBanner && (
                                <Alert variant="success" className="mb-4 border-0 shadow-sm" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
                                    <Row className="align-items-center g-3">
                                        <Col md="auto" className="flex-shrink-0">
                                            <div className="d-flex align-items-center justify-content-center bg-white bg-opacity-20 rounded-circle" style={{ width: '50px', height: '50px' }}>
                                                <FiCheckCircle size={24} className="text-white" />
                                            </div>
                                        </Col>
                                        <Col className="flex-grow-1" style={{ minWidth: '0' }}>
                                            <h6 className="fw-bold mb-0">
                                                Active Subscription: {subscription.plan?.name}
                                            </h6>
                                            <small className="opacity-75">
                                                Valid until {new Date(subscription.end_date).toLocaleDateString()}
                                            </small>
                                        </Col>
                                        <Col md="auto" className="flex-shrink-0">
                                            <Button
                                                variant="light"
                                                size="sm"
                                                className="fw-bold"
                                                style={{ borderRadius: '6px', whiteSpace: 'nowrap' }}
                                                onClick={() => window.location.href = '/subscription'}
                                            >
                                                Manage Plan
                                            </Button>
                                        </Col>
                                    </Row>
                                </Alert>
                            )}
                            
                            {children}
                        </>
                    )}
                </Container>
            </div>
        </div>
    );
};

export default Layout;
