import React, { useState } from 'react';
import { Container, Spinner, Card, Button } from 'react-bootstrap';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useSubscription } from '../context/SubscriptionContext';
import { FiClock, FiShield } from 'react-icons/fi';

const Layout = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    const { subscription, loading: subLoading, is_superadmin } = useSubscription();

    const isPending = subscription?.status === 'pending' && !is_superadmin && window.location.pathname !== '/subscription';

    if (subLoading) {
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
                    paddingTop: '70px'
                }}
            >
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media (max-width: 991.98px) {
                        .main-content {
                            margin-left: 0 !important;
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
                    ) : children}
                </Container>
            </div>
        </div>
    );
};

export default Layout;
