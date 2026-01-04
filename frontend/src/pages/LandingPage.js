import React, { useState, useEffect } from 'react';
import { Container, Navbar, Nav, Button, Row, Col, Card } from 'react-bootstrap';
import { FiBarChart2, FiUsers, FiBox, FiDollarSign, FiCheckCircle, FiArrowRight, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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

        // Add Google Fonts
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }, [navigate]);

    const handleShowLogin = () => {
        setShowRegister(false);
        setShowLogin(true);
    };

    const handleShowRegister = () => {
        setShowLogin(false);
        setShowRegister(true);
    };

    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const stagger = {
        animate: {
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className="landing-page">
            {/* Navbar */}
            <Navbar expand="lg" fixed="top" className="landing-navbar shadow-sm">
                <Container>
                    <Navbar.Brand href="#" className="fw-bold text-white d-flex align-items-center">
                        <motion.div
                            initial={{ rotate: -10, scale: 0.9 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <FiBarChart2 className="me-2 text-primary" />
                        </motion.div>
                        BusinessOS
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="landing-nav" className="border-0 bg-white bg-opacity-10" />
                    <Navbar.Collapse id="landing-nav">
                        <Nav className="ms-auto align-items-center">
                            <Nav.Link href="#features" className="mx-2">Features</Nav.Link>
                            <Nav.Link href="#about" className="mx-2">About</Nav.Link>
                            <Nav.Link href="#pricing" className="mx-2">Pricing</Nav.Link>
                            <Button
                                variant="link"
                                className="ms-3 px-4 fw-bold text-white text-decoration-none"
                                onClick={handleShowLogin}
                            >
                                Log In
                            </Button>
                            <Button
                                variant="primary"
                                className="ms-2 px-4 fw-bold rounded-pill shadow-sm"
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
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                <div className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill mb-3 fw-bold">
                                    NEW: Business Analytics 2.0
                                </div>
                                <h1>Manage Your Business with Confidence</h1>
                                <p>
                                    The all-in-one platform to streamline operations, boost productivity, and drive growth.
                                    From HR to Accounting, we've got you covered.
                                </p>
                                <div className="d-flex gap-3">
                                    <Button size="lg" variant="primary" className="rounded-pill px-5 fw-bold shadow" onClick={handleShowRegister}>
                                        Start Free Trial
                                    </Button>
                                    <Button size="lg" variant="outline-light" className="rounded-pill px-5 fw-bold bg-white bg-opacity-5">
                                        Watch Demo
                                    </Button>
                                </div>
                                <div className="mt-4 d-flex align-items-center gap-4 text-muted small fw-medium">
                                    <span><FiCheckCircle className="text-primary me-1" /> No credit card required</span>
                                    <span><FiCheckCircle className="text-primary me-1" /> 14-day free trial</span>
                                </div>
                            </motion.div>
                        </Col>
                        <Col lg={6} className="mt-5 mt-lg-0">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="hero-image-container p-2 bg-white bg-opacity-10 rounded-4 backdrop-blur"
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2426&q=80"
                                    alt="Dashboard Preview"
                                    className="img-fluid rounded-4 shadow-2xl"
                                />
                            </motion.div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Features Section */}
            <section id="features" className="py-5">
                <Container className="py-5">
                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="section-title"
                    >
                        <h2 className="text-white">Everything You Need</h2>
                        <p className="text-muted">Powerful tools integrated into one seamless ecosystem.</p>
                    </motion.div>
                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        variants={stagger}
                    >
                        <Row className="g-4">
                            {[
                                { title: "Advanced Analytics", icon: <FiBarChart2 />, color: "primary", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", text: "Gain deep insights into your business performance with real-time dashboards and custom reports." },
                                { title: "Financial Management", icon: <FiDollarSign />, color: "success", img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", text: "Track income, expenses, and cash flow. Generate invoices and manage payments effortlessly." },
                                { title: "HR & Payroll", icon: <FiUsers />, color: "warning", img: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", text: "Manage employee data, attendance, leave, and payroll processing in one centralized system." },
                                { title: "Inventory Control", icon: <FiBox />, color: "info", img: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", text: "Keep track of stock levels, manage warehouses, and automate reordering to prevent stockouts." },
                                { title: "Project Management", icon: <FiCheckCircle />, color: "danger", img: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", text: "Plan, execute, and track projects. Assign tasks, set deadlines, and collaborate with your team." },
                                { title: "And Much More...", icon: <FiArrowRight />, color: "secondary", img: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", text: "CRM, Supplier Management, Document Control, and many other features to run your business." }
                            ].map((feature, index) => (
                                <Col md={6} lg={4} key={index}>
                                    <motion.div variants={fadeIn} className="h-100">
                                        <div className="feature-card">
                                            <div className="feature-image-wrapper">
                                                <img src={feature.img} alt={feature.title} />
                                            </div>
                                            <div className={`feature-icon bg-${feature.color} bg-opacity-20 text-${feature.color}`}>
                                                {feature.icon}
                                            </div>
                                            <h4 className="text-white">{feature.title}</h4>
                                            <p className="text-muted">{feature.text}</p>
                                        </div>
                                    </motion.div>
                                </Col>
                            ))}
                        </Row>
                    </motion.div>
                </Container>
            </section>

            {/* About Section */}
            <section id="about" className="py-5">
                <Container className="py-5">
                    <Row className="align-items-center">
                        <Col lg={6}>
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="p-2 bg-white bg-opacity-10 rounded-4"
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                                    alt="Our Team"
                                    className="img-fluid rounded-4 shadow-lg"
                                />
                            </motion.div>
                        </Col>
                        <Col lg={6} className="ps-lg-5">
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                            >
                                <h2 className="fw-bold mb-4 text-white">Empowering Rwandan Businesses</h2>
                                <p className="lead text-muted mb-4">
                                    BusinessOS is dedicated to providing local enterprises with world-class management tools tailored for the Rwandan market.
                                </p>
                                <div className="d-flex gap-3 mb-4">
                                    <div className="about-stat">
                                        <h3 className="fw-bold text-primary mb-0">500+</h3>
                                        <p className="text-muted small mb-0">Active Users</p>
                                    </div>
                                    <div className="about-stat">
                                        <h3 className="fw-bold text-primary mb-0">99.9%</h3>
                                        <p className="text-muted small mb-0">Uptime</p>
                                    </div>
                                    <div className="about-stat">
                                        <h3 className="fw-bold text-primary mb-0">24/7</h3>
                                        <p className="text-muted small mb-0">Support</p>
                                    </div>
                                </div>
                                <ul className="list-unstyled">
                                    <li className="mb-3 d-flex align-items-center text-muted">
                                        <FiCheckCircle className="text-primary me-2" /> <span>Localized for Rwandan Tax Compliance</span>
                                    </li>
                                    <li className="mb-3 d-flex align-items-center text-muted">
                                        <FiCheckCircle className="text-primary me-2" /> <span>Seamless Mobile Money Integration</span>
                                    </li>
                                    <li className="mb-3 d-flex align-items-center text-muted">
                                        <FiCheckCircle className="text-primary me-2" /> <span>Dedicated Local Support Team</span>
                                    </li>
                                </ul>
                            </motion.div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-5">
                <Container className="py-5">
                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="section-title"
                    >
                        <h2 className="text-white">Simple, Transparent Pricing</h2>
                        <p className="text-muted">Choose the plan that fits your business size. All prices in FRW.</p>
                    </motion.div>
                    <Row className="g-4 justify-content-center">
                        {[
                            { title: "Starter", price: "25,000", text: "Perfect for small shops and startups", features: ["Up to 3 Users", "Basic Inventory", "Sales Tracking"], excluded: ["Advanced Analytics"] },
                            { title: "Professional", price: "75,000", text: "Ideal for growing businesses", features: ["Up to 15 Users", "Full HR & Payroll", "Multi-Warehouse", "Advanced Analytics"], featured: true },
                            { title: "Enterprise", price: "150,000", text: "For large scale operations", features: ["Unlimited Users", "Custom Integrations", "Dedicated Manager", "24/7 Priority Support"] }
                        ].map((plan, index) => (
                            <Col md={4} key={index}>
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="h-100"
                                >
                                    <Card className={`h-100 pricing-card ${plan.featured ? 'featured' : ''}`}>
                                        {plan.featured && <div className="pricing-badge">Most Popular</div>}
                                        <Card.Body className="p-4 text-center">
                                            <h5 className="fw-bold text-muted mb-3">{plan.title}</h5>
                                            <h2 className="fw-bold mb-3 text-white">{plan.price} <span className="fs-6 text-muted fw-normal">/mo</span></h2>
                                            <p className="text-muted small mb-4">{plan.text}</p>
                                            <hr className="border-secondary opacity-25" />
                                            <ul className="list-unstyled text-start mb-4">
                                                {plan.features.map((f, i) => (
                                                    <li className="mb-2 text-muted" key={i}><FiCheckCircle className="text-primary me-2" /> {f}</li>
                                                ))}
                                                {plan.excluded && plan.excluded.map((f, i) => (
                                                    <li className="mb-2 text-muted opacity-50" key={i}><FiX className="me-2" /> {f}</li>
                                                ))}
                                            </ul>
                                            <Button
                                                variant={plan.featured ? "primary" : "outline-light"}
                                                className={`w-100 rounded-pill fw-bold ${!plan.featured ? 'bg-white bg-opacity-5' : 'shadow'}`}
                                                onClick={handleShowRegister}
                                            >
                                                {plan.title === "Enterprise" ? "Contact Sales" : "Choose Plan"}
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* CTA Section */}
            <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="cta-section text-center"
            >
                <Container>
                    <h2 className="mb-4 text-white fw-bold">Ready to Transform Your Business?</h2>
                    <p className="lead mb-5 text-white opacity-75">Join hundreds of Rwandan companies using BusinessOS to grow faster.</p>
                    <Button size="lg" variant="light" className="rounded-pill px-5 py-3 fw-bold text-primary shadow-lg" onClick={handleShowRegister}>
                        Get Started for Free
                    </Button>
                </Container>
            </motion.section>

            {/* Footer */}
            <footer className="footer">
                <Container>
                    <Row>
                        <Col md={4} className="mb-4 mb-md-0">
                            <h4 className="text-white fw-bold mb-3">BusinessOS</h4>
                            <p className="mb-4 text-muted">
                                Empowering businesses with intelligent software solutions.
                            </p>
                            <div className="d-flex gap-3">
                                <div className="bg-white bg-opacity-5 p-2 rounded-circle text-white border border-white border-opacity-10">FB</div>
                                <div className="bg-white bg-opacity-5 p-2 rounded-circle text-white border border-white border-opacity-10">TW</div>
                                <div className="bg-white bg-opacity-5 p-2 rounded-circle text-white border border-white border-opacity-10">LI</div>
                            </div>
                        </Col>
                        <Col md={2} xs={6}>
                            <div className="footer-links">
                                <h5>Product</h5>
                                <ul className="list-unstyled">
                                    <li><a href="#" className="text-decoration-none">Features</a></li>
                                    <li><a href="#" className="text-decoration-none">Pricing</a></li>
                                    <li><a href="#" className="text-decoration-none">Security</a></li>
                                    <li><a href="#" className="text-decoration-none">Roadmap</a></li>
                                </ul>
                            </div>
                        </Col>
                        <Col md={2} xs={6}>
                            <div className="footer-links">
                                <h5>Company</h5>
                                <ul className="list-unstyled">
                                    <li><a href="#" className="text-decoration-none">About Us</a></li>
                                    <li><a href="#" className="text-decoration-none">Careers</a></li>
                                    <li><a href="#" className="text-decoration-none">Blog</a></li>
                                    <li><a href="#" className="text-decoration-none">Contact</a></li>
                                </ul>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="footer-links">
                                <h5>Subscribe to our newsletter</h5>
                                <div className="input-group mb-3 mt-3">
                                    <input type="text" className="form-control bg-white bg-opacity-5 border-white border-opacity-10 text-white" placeholder="Email address" />
                                    <Button variant="primary">Subscribe</Button>
                                </div>
                            </div>
                        </Col>
                    </Row>
                    <div className="border-top border-white border-opacity-10 mt-5 pt-4 text-center">
                        <p className="mb-0 text-muted">&copy; 2026 BusinessOS. All rights reserved.</p>
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
