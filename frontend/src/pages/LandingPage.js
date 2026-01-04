import React, { useState, useEffect } from 'react';
import { Container, Navbar, Nav, Button, Row, Col, Card } from 'react-bootstrap';
import { FiBarChart2, FiUsers, FiBox, FiDollarSign, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import LoginModal from '../components/auth/LoginModal';
import RegisterModal from '../components/auth/RegisterModal';
import './LandingPage.css';

const LandingPage = () => {
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard');
        }
    }, [navigate]);

    const handleShowLogin = () => {
        setShowRegister(false);
        setShowLogin(true);
    };

    const handleShowRegister = () => {
        setShowLogin(false);
        setShowRegister(true);
    };

    return (
        <div className="landing-page">
            {/* Navbar */}
            <Navbar expand="lg" fixed="top" className="landing-navbar shadow-sm">
                <Container>
                    <Navbar.Brand href="#" className="fw-bold fs-4 text-primary d-flex align-items-center">
                        <FiBarChart2 className="me-2" /> BusinessOS
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="landing-nav" />
                    <Navbar.Collapse id="landing-nav">
                        <Nav className="ms-auto align-items-center">
                            <Nav.Link href="#features" className="fw-medium text-dark mx-2">Features</Nav.Link>
                            <Nav.Link href="#about" className="fw-medium text-dark mx-2">About</Nav.Link>
                            <Nav.Link href="#pricing" className="fw-medium text-dark mx-2">Pricing</Nav.Link>
                            <Button
                                variant="outline-primary"
                                className="ms-3 px-4 fw-bold rounded-pill"
                                onClick={handleShowLogin}
                            >
                                Log In
                            </Button>
                            <Button
                                variant="primary"
                                className="ms-2 px-4 fw-bold rounded-pill"
                                onClick={handleShowRegister}
                            >
                                Get Started
                            </Button>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* Hero Section */}
            <section className="hero-section">
                <Container>
                    <Row className="align-items-center">
                        <Col lg={6} className="hero-content">
                            <h1>Manage Your Business with Confidence</h1>
                            <p>
                                The all-in-one platform to streamline operations, boost productivity, and drive growth.
                                From HR to Accounting, we've got you covered.
                            </p>
                            <div className="d-flex gap-3">
                                <Button size="lg" variant="primary" className="rounded-pill px-5 fw-bold" onClick={handleShowRegister}>
                                    Start Free Trial
                                </Button>
                                <Button size="lg" variant="outline-secondary" className="rounded-pill px-5 fw-bold">
                                    Watch Demo
                                </Button>
                            </div>
                            <div className="mt-4 d-flex align-items-center gap-4 text-muted small fw-medium">
                                <span><FiCheckCircle className="text-success me-1" /> No credit card required</span>
                                <span><FiCheckCircle className="text-success me-1" /> 14-day free trial</span>
                            </div>
                        </Col>
                        <Col lg={6} className="mt-5 mt-lg-0">
                            <img
                                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2426&q=80"
                                alt="Dashboard Preview"
                                className="img-fluid rounded-4 shadow-lg border border-white border-5"
                            />
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Features Section */}
            <section id="features" className="py-5 bg-white">
                <Container className="py-5">
                    <div className="section-title">
                        <h2>Everything You Need</h2>
                        <p>Powerful tools integrated into one seamless ecosystem.</p>
                    </div>
                    <Row className="g-4">
                        <Col md={6} lg={4}>
                            <div className="feature-card">
                                <div className="feature-icon bg-primary bg-opacity-10 text-primary">
                                    <FiBarChart2 />
                                </div>
                                <h4>Advanced Analytics</h4>
                                <p className="text-muted">
                                    Gain deep insights into your business performance with real-time dashboards and custom reports.
                                </p>
                            </div>
                        </Col>
                        <Col md={6} lg={4}>
                            <div className="feature-card">
                                <div className="feature-icon bg-success bg-opacity-10 text-success">
                                    <FiDollarSign />
                                </div>
                                <h4>Financial Management</h4>
                                <p className="text-muted">
                                    Track income, expenses, and cash flow. Generate invoices and manage payments effortlessly.
                                </p>
                            </div>
                        </Col>
                        <Col md={6} lg={4}>
                            <div className="feature-card">
                                <div className="feature-icon bg-warning bg-opacity-10 text-warning">
                                    <FiUsers />
                                </div>
                                <h4>HR & Payroll</h4>
                                <p className="text-muted">
                                    Manage employee data, attendance, leave, and payroll processing in one centralized system.
                                </p>
                            </div>
                        </Col>
                        <Col md={6} lg={4}>
                            <div className="feature-card">
                                <div className="feature-icon bg-info bg-opacity-10 text-info">
                                    <FiBox />
                                </div>
                                <h4>Inventory Control</h4>
                                <p className="text-muted">
                                    Keep track of stock levels, manage warehouses, and automate reordering to prevent stockouts.
                                </p>
                            </div>
                        </Col>
                        <Col md={6} lg={4}>
                            <div className="feature-card">
                                <div className="feature-icon bg-danger bg-opacity-10 text-danger">
                                    <FiCheckCircle />
                                </div>
                                <h4>Project Management</h4>
                                <p className="text-muted">
                                    Plan, execute, and track projects. Assign tasks, set deadlines, and collaborate with your team.
                                </p>
                            </div>
                        </Col>
                        <Col md={6} lg={4}>
                            <div className="feature-card">
                                <div className="feature-icon bg-secondary bg-opacity-10 text-secondary">
                                    <FiArrowRight />
                                </div>
                                <h4>And Much More...</h4>
                                <p className="text-muted">
                                    CRM, Supplier Management, Document Control, and many other features to run your business.
                                </p>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <Container>
                    <h2 className="mb-4">Ready to Transform Your Business?</h2>
                    <p className="lead mb-5 text-light opacity-75">Join thousands of companies using BusinessOS to grow faster.</p>
                    <Button size="lg" variant="primary" className="rounded-pill px-5 py-3 fw-bold" onClick={handleShowRegister}>
                        Get Started for Free
                    </Button>
                </Container>
            </section>

            {/* Footer */}
            <footer className="footer">
                <Container>
                    <Row>
                        <Col md={4} className="mb-4 mb-md-0">
                            <h4 className="text-white fw-bold mb-3">BusinessOS</h4>
                            <p className="mb-4">
                                Empowering businesses with intelligent software solutions.
                            </p>
                            <div className="d-flex gap-3">
                                {/* Social icons placeholders */}
                                <div className="bg-white bg-opacity-10 p-2 rounded-circle text-white">FB</div>
                                <div className="bg-white bg-opacity-10 p-2 rounded-circle text-white">TW</div>
                                <div className="bg-white bg-opacity-10 p-2 rounded-circle text-white">LI</div>
                            </div>
                        </Col>
                        <Col md={2} xs={6}>
                            <div className="footer-links">
                                <h5>Product</h5>
                                <ul>
                                    <li><a href="#">Features</a></li>
                                    <li><a href="#">Pricing</a></li>
                                    <li><a href="#">Security</a></li>
                                    <li><a href="#">Roadmap</a></li>
                                </ul>
                            </div>
                        </Col>
                        <Col md={2} xs={6}>
                            <div className="footer-links">
                                <h5>Company</h5>
                                <ul>
                                    <li><a href="#">About Us</a></li>
                                    <li><a href="#">Careers</a></li>
                                    <li><a href="#">Blog</a></li>
                                    <li><a href="#">Contact</a></li>
                                </ul>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="footer-links">
                                <h5>Subscribe to our newsletter</h5>
                                <div className="input-group mb-3 mt-3">
                                    <input type="text" className="form-control" placeholder="Email address" />
                                    <Button variant="primary">Subscribe</Button>
                                </div>
                            </div>
                        </Col>
                    </Row>
                    <div className="border-top border-secondary border-opacity-25 mt-5 pt-4 text-center">
                        <p className="mb-0">&copy; 2026 BusinessOS. All rights reserved.</p>
                    </div>
                </Container>
            </footer>

            {/* Modals */}
            <LoginModal
                show={showLogin}
                onHide={() => setShowLogin(false)}
                onSwitchToRegister={handleShowRegister}
            />
            <RegisterModal
                show={showRegister}
                onHide={() => setShowRegister(false)}
                onSwitchToLogin={handleShowLogin}
            />
        </div>
    );
};

export default LandingPage;
