import React, { useState, useEffect } from 'react';
import { Container, Navbar, Nav, Button, Row, Col, Card } from 'react-bootstrap';
import { FiBarChart2, FiUsers, FiBox, FiDollarSign, FiCheckCircle, FiArrowRight, FiX, FiPhone, FiMail, FiShoppingCart, FiTruck, FiUserCheck, FiPackage, FiFileText, FiActivity, FiTarget } from 'react-icons/fi';
import { FaFacebookF, FaTwitter, FaLinkedinIn } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import LoginModal from '../components/auth/LoginModal';
import BusinessRegistrationModal from '../components/BusinessRegistrationModal';
import LanguageSwitcher from '../components/LanguageSwitcher';
import TRANSLATIONS, { getLocale } from '../i18n/landingTranslations';
import aboutImage from '../assets/images/about_team.png';
import financeImg from '../assets/images/feature_finance.png';
import hrImg from '../assets/images/feature_hr.png';
import inventoryImg from '../assets/images/feature_inventory.png';
import projectImg from '../assets/images/feature_project.png';
import './LandingPage.css';

const LandingPage = () => {
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { locale } = useLanguage();

    const t = (key) => {
        const dict = TRANSLATIONS[locale] || TRANSLATIONS['en'];
        return dict[key] || '';
    };
    const dict = TRANSLATIONS[locale] || TRANSLATIONS['en'];

    const navigate = useNavigate();

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (token) {
            navigate('/dashboard');
        }

        // Add Google Fonts
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // Handle scroll for navbar animation
        const handleScroll = () => {
            const isScrolled = window.scrollY > 50;
            if (isScrolled !== scrolled) {
                setScrolled(isScrolled);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [navigate, scrolled]);

    const handleShowLogin = () => {
        setShowRegister(false);
        setShowLogin(true);
    };

    const handleShowRegister = () => {
        navigate('/register');
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

    // Animation variants for additional effects
    const cardHoverVariants = {
        rest: { scale: 1, boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)" },
        hover: { 
            scale: 1.05, 
            boxShadow: "0 20px 40px rgba(15, 23, 42, 0.15)",
            transition: { duration: 0.3, ease: "easeOut" }
        }
    };

    const buttonVariants = {
        rest: { scale: 1 },
        hover: { scale: 1.05 },
        tap: { scale: 0.95 }
    };

    const statVariants = {
        initial: { opacity: 0, scale: 0.5 },
        animate: { 
            opacity: 1, 
            scale: 1,
            transition: { 
                type: "spring",
                stiffness: 100,
                damping: 10
            }
        }
    };

    return (
        <div className="landing-page">
            {/* Navbar */}
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <Navbar
                    collapseOnSelect
                    expand="lg"
                    fixed="top"
                    className={`landing-navbar ${scrolled ? 'scrolled' : ''}`}
                >
                    <Container>
                        <Navbar.Brand href="#" className="fw-bold text-dark d-flex align-items-center">
                            BusinessOS
                        </Navbar.Brand>
                        <div className="d-lg-none ms-auto me-2">
                            <LanguageSwitcher className="ms-0" />
                        </div>
                        <Navbar.Toggle aria-controls="landing-nav" className="border-0" />
                        <Navbar.Collapse id="landing-nav">
                            <Nav className="ms-auto align-items-lg-center">
                                <Nav.Link href="#features" className="mx-lg-2 py-3 py-lg-0">{t('nav_features')}</Nav.Link>
                                <Nav.Link href="#solutions" className="mx-lg-2 py-3 py-lg-0">{t('nav_solutions') || 'Solutions'}</Nav.Link>
                                <Nav.Link href="#about" className="mx-lg-2 py-3 py-lg-0">{t('nav_about')}</Nav.Link>
                                <Nav.Link href="#pricing" className="mx-lg-2 py-3 py-lg-0">{t('nav_pricing')}</Nav.Link>

                                <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-3 mt-3 mt-lg-0 ms-lg-3">
                                    <Button
                                        variant="link"
                                        className="p-0 p-lg-2 fw-bold text-dark text-decoration-none text-start text-lg-center"
                                        onClick={handleShowLogin}
                                    >
                                        {t('login')}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="px-4 fw-bold rounded-pill shadow-sm"
                                        onClick={handleShowRegister}
                                    >
                                        {t('get_started')}
                                    </Button>
                                    <div className="mt-2 mt-lg-0 d-none d-lg-block">
                                        <LanguageSwitcher />
                                    </div>
                                </div>
                            </Nav>
                        </Navbar.Collapse>
                    </Container>
                </Navbar>
            </motion.div>

            {/* Hero Section */}
            <section className="hero-section">
                <Container>
                    <Row className="align-items-center py-5">
                        <Col lg={6} className="hero-content text-center text-lg-start">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                <h1>{t('hero_h1')}</h1>
                                <p className="mx-auto mx-lg-0 lead mb-5">
                                    {t('hero_p')}
                                </p>
                                <div className="d-flex gap-3 justify-content-center justify-content-lg-start">
                                    <motion.button
                                        whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(99, 102, 241, 0.4)" }}
                                        whileTap={{ scale: 0.95 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                        className="btn btn-primary btn-lg rounded-pill px-5 fw-bold shadow"
                                        onClick={handleShowRegister}
                                    >
                                        {t('start_trial')}
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)" }}
                                        whileTap={{ scale: 0.95 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                        className="btn btn-light btn-lg rounded-pill px-5 fw-bold shadow text-dark"
                                    >
                                        {t('watch_demo')}
                                    </motion.button>
                                </div>
                                <div className="mt-4 d-flex align-items-center justify-content-center justify-content-lg-start gap-4 text-muted small fw-medium">
                                    <span><FiCheckCircle className="text-primary me-1" /> {t('no_card')}</span>
                                    <span><FiCheckCircle className="text-primary me-1" /> {t('free_trial')}</span>
                                </div>
                            </motion.div>
                        </Col>
                        {/* Animated dashboard preview on hero right side */}
                        <Col lg={6} className="d-none d-lg-flex justify-content-center">
                            <motion.div
                                className="hero-dashboard-wrapper"
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.9, delay: 0.2 }}
                            >
                                <motion.div
                                    className="hero-dashboard-card"
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                                >
                                    <div className="hero-dashboard-header d-flex justify-content-between align-items-center mb-3">
                                        <span className="small text-muted">{t('hero_dashboard_title') || 'Monthly overview'}</span>
                                        <span className="badge bg-success-soft text-success small">
                                            <FiArrowRight className="me-1" /> +18.4%
                                        </span>
                                    </div>
                                    <div className="hero-dashboard-metrics">
                                        <div className="hero-metric">
                                            <span className="label">Revenue</span>
                                            <span className="value">FRW 18.2M</span>
                                            <span className="trend text-success">+12.5%</span>
                                        </div>
                                        <div className="hero-metric">
                                            <span className="label">Expenses</span>
                                            <span className="value">FRW 9.4M</span>
                                            <span className="trend text-danger">-3.1%</span>
                                        </div>
                                        <div className="hero-metric">
                                            <span className="label">Net profit</span>
                                            <span className="value text-success">FRW 8.8M</span>
                                            <span className="trend text-success">+22.0%</span>
                                        </div>
                                    </div>
                                    <div className="hero-dashboard-bars mt-3">
                                        {[60, 80, 45, 90, 70].map((h, i) => (
                                            <motion.div
                                                key={i}
                                                className="hero-bar"
                                                initial={{ height: 0 }}
                                                animate={{ height: `${h}%` }}
                                                transition={{ duration: 0.8, delay: 0.3 + i * 0.1, type: "spring" }}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                                <motion.div
                                    className="hero-pill hero-pill-top"
                                    animate={{ y: [0, -12, 0] }}
                                    transition={{ duration: 5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                                >
                                    <span className="dot online" /> {t('hero_pill_employees') || 'HR & Payroll synced'}
                                </motion.div>
                                <motion.div
                                    className="hero-pill hero-pill-bottom"
                                    animate={{ y: [0, 10, 0] }}
                                    transition={{ duration: 7, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                                >
                                    <span className="dot kpi" /> {t('hero_pill_inventory') || 'Inventory levels in real time'}
                                </motion.div>
                            </motion.div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Features Section */}
            <section id="features" className="py-5">
                <Container className="py-5 position-relative">
                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="section-title"
                    >
                        <h2>{t('everything_title')}</h2>
                        <p className="text-white">{t('everything_sub')}</p>
                    </motion.div>
                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        variants={stagger}
                    >
                        <Row className="g-4">
                            {(dict.features || []).map((feature, index) => (
                                <Col md={6} lg={4} key={index}>
                                    <motion.div variants={fadeIn} className="h-100">
                                        <div className="feature-card">
                                            <div className="feature-image-wrapper">
                                                <img src={[
                                                    financeImg,
                                                    financeImg,
                                                    hrImg,
                                                    inventoryImg,
                                                    projectImg,
                                                    aboutImage
                                                ][index]} alt={feature.title} />
                                            </div>
                                            <div className={`feature-icon bg-${["primary", "success", "warning", "info", "danger", "secondary"][index]} bg-opacity-20 text-${["primary", "success", "warning", "info", "danger", "secondary"][index]}`}>
                                                {[<FiBarChart2 />, <FiDollarSign />, <FiUsers />, <FiBox />, <FiCheckCircle />, <FiArrowRight />][index]}
                                            </div>
                                            <h4>{feature.title}</h4>
                                            <p>{feature.text}</p>
                                        </div>
                                    </motion.div>
                                </Col>
                            ))}
                        </Row>
                    </motion.div>
                </Container>
            </section>

            {/* Solutions Section */}
            <section id="solutions" className="py-5">
                <Container className="py-5 position-relative">
                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="section-title"
                    >
                        <h2>{t('solutions_title') || 'Solutions for Every Business Type'}</h2>
                        <p className="text-white-50">{t('solutions_sub') || 'Tailored solutions designed to meet the unique needs of your industry'}</p>
                    </motion.div>
                    <Row className="g-4">
                        {[
                            {
                                title: t('solution_retail') || 'Retail & E-commerce',
                                description: t('solution_retail_desc') || 'Complete POS system, inventory tracking, and customer management tailored for retail businesses',
                                icon: <FiBox />,
                                color: 'primary'
                            },
                            {
                                title: t('solution_service') || 'Service Businesses',
                                description: t('solution_service_desc') || 'Project management, time tracking, and client billing designed for service providers',
                                icon: <FiUsers />,
                                color: 'success'
                            },
                            {
                                title: t('solution_manufacturing') || 'Manufacturing',
                                description: t('solution_manufacturing_desc') || 'Production planning, supply chain management, and quality control tools',
                                icon: <FiBarChart2 />,
                                color: 'warning'
                            },
                            {
                                title: t('solution_finance') || 'Financial Services',
                                description: t('solution_finance_desc') || 'Advanced financial reporting, compliance tools, and multi-currency support',
                                icon: <FiDollarSign />,
                                color: 'info'
                            },
                            {
                                title: t('solution_hr') || 'HR & Payroll',
                                description: t('solution_hr_desc') || 'Complete employee management, attendance tracking, leave requests, and automated payroll processing',
                                icon: <FiUserCheck />,
                                color: 'danger'
                            },
                            {
                                title: t('solution_sales') || 'Sales & Invoicing',
                                description: t('solution_sales_desc') || 'Generate professional invoices, track sales, manage customers, and monitor revenue in real-time',
                                icon: <FiShoppingCart />,
                                color: 'primary'
                            },
                            {
                                title: t('solution_purchases') || 'Purchase Management',
                                description: t('solution_purchases_desc') || 'Streamline supplier management, purchase orders, and track expenses efficiently',
                                icon: <FiTruck />,
                                color: 'success'
                            },
                            {
                                title: t('solution_crm') || 'CRM & Leads',
                                description: t('solution_crm_desc') || 'Track leads, manage customer relationships, and automate follow-ups for better sales',
                                icon: <FiTarget />,
                                color: 'warning'
                            },
                            {
                                title: t('solution_assets') || 'Asset Management',
                                description: t('solution_assets_desc') || 'Track and manage company assets, maintenance schedules, and depreciation',
                                icon: <FiPackage />,
                                color: 'info'
                            },
                            {
                                title: t('solution_expenses') || 'Expense Tracking',
                                description: t('solution_expenses_desc') || 'Categorize, approve, and report on business expenses with ease',
                                icon: <FiDollarSign />,
                                color: 'danger'
                            },
                            {
                                title: t('solution_approvals') || 'Workflow & Approvals',
                                description: t('solution_approvals_desc') || 'Create custom approval workflows and automate document routing',
                                icon: <FiActivity />,
                                color: 'secondary'
                            }
                        ].map((solution, index) => (
                            <Col md={6} lg={4} key={index}>
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                                    className="h-100"
                                >
                                    <div className="solution-card h-100 p-4">
                                        <div className={`solution-icon mb-3 bg-${solution.color} bg-opacity-20 text-${solution.color}`}>
                                            {solution.icon}
                                        </div>
                                        <h5 className="fw-bold mb-3">{solution.title}</h5>
                                        <p className="small mb-0">{solution.description}</p>
                                    </div>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
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
                                className="p-2"
                            >
                                <img
                                    src={aboutImage}
                                    alt="BusinessOS Team"
                                    className="img-fluid rounded-4 shadow-2xl"
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
                                <h2 className="fw-bold mb-4 text-dark">{t('about_title')}</h2>
                                <p className="lead text-muted mb-5">
                                    {t('about_p')}
                                </p>

                                <Row className="g-4 mb-5">
                                    <Col md={6}>
                                        <div className="p-4 h-100">
                                            <h5 className="text-primary fw-bold mb-3">{t('mission_title')}</h5>
                                            <p className="text-muted small mb-0">{t('mission_p')}</p>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="p-4 h-100">
                                            <h5 className="text-secondary fw-bold mb-3">{t('vision_title')}</h5>
                                            <p className="text-muted small mb-0">{t('vision_p')}</p>
                                        </div>
                                    </Col>
                                </Row>

                                <div className="d-flex gap-4 mb-5">
                                    <motion.div
                                        variants={statVariants}
                                        initial="initial"
                                        whileInView="animate"
                                        viewport={{ once: true }}
                                        className="about-stat"
                                    >
                                        <h3 className="fw-bold text-primary mb-0">500+</h3>
                                        <p className="text-muted small mb-0">{t('stat_users')}</p>
                                    </motion.div>
                                    <motion.div
                                        variants={statVariants}
                                        initial="initial"
                                        whileInView="animate"
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.1 }}
                                        className="about-stat"
                                    >
                                        <h3 className="fw-bold text-primary mb-0">99.9%</h3>
                                        <p className="text-muted small mb-0">{t('stat_uptime')}</p>
                                    </motion.div>
                                    <motion.div
                                        variants={statVariants}
                                        initial="initial"
                                        whileInView="animate"
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.2 }}
                                        className="about-stat"
                                    >
                                        <h3 className="fw-bold text-primary mb-0">24/7</h3>
                                        <p className="text-muted small mb-0">{t('stat_support')}</p>
                                    </motion.div>
                                </div>
                                <ul className="list-unstyled">
                                    {(dict.about_benefits || []).map((b, i) => (
                                        <li key={i} className="mb-3 d-flex align-items-center text-muted">
                                            <FiCheckCircle className="text-primary me-2" /> <span>{b}</span>
                                        </li>
                                    ))}
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
                        <h2 className="text-dark">{t('pricing_title') || 'Simple, Transparent Pricing'}</h2>
                        <p className="text-muted">{t('pricing_sub') || 'Choose the plan that fits your business size. All prices in FRW.'}</p>
                    </motion.div>
                    <Row className="g-4 justify-content-center">
                        {(dict.plans || []).map((plan, index) => (
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
                                                {plan.title === "Enterprise" ? t('contact_sales') : t('choose_plan')}
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
                id="cta"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="cta-section text-center"
            >
                <Container>
                    <h2 className="mb-4 text-white fw-bold">{t('cta_h2') || 'Ready to Transform Your Business?'}</h2>
                    <p className="lead mb-5 text-white opacity-75">{t('cta_p') || 'Join hundreds of Rwandan companies using BusinessOS to grow faster.'}</p>
                    <Button size="lg" variant="light" className="rounded-pill px-5 py-3 fw-bold text-primary shadow-lg" onClick={handleShowRegister}>
                        {t('start_trial') || 'Get Started for Free'}
                    </Button>
                </Container>
            </motion.section>

            {/* Footer */}
            <footer className="footer">
                <Container>
                    <Row>
                        <Col md={4} className="mb-4 mb-md-0">
                            <h4 className="text-dark fw-bold mb-3">BusinessOS</h4>
                            <p className="mb-4 text-muted">
                                {t('footer_about')}
                            </p>
                            <div className="d-flex gap-3">
                                <a href="#" className="social-icon-link d-flex align-items-center justify-content-center">
                                    <FaFacebookF size={18} />
                                </a>
                                <a href="#" className="social-icon-link d-flex align-items-center justify-content-center">
                                    <FaTwitter size={18} />
                                </a>
                                <a href="#" className="social-icon-link d-flex align-items-center justify-content-center">
                                    <FaLinkedinIn size={18} />
                                </a>
                            </div>
                        </Col>
                        <Col md={2} xs={6}>
                            <div className="footer-links">
                                <h5>{t('footer_product')}</h5>
                                <ul className="list-unstyled">
                                    <li><a href="#features" className="text-decoration-none">{t('nav_features')}</a></li>
                                    <li><a href="#pricing" className="text-decoration-none">{t('nav_pricing')}</a></li>
                                    <li><a href="#" className="text-decoration-none">{t('footer_security')}</a></li>
                                    <li><a href="#" className="text-decoration-none">{t('footer_roadmap')}</a></li>
                                </ul>
                            </div>
                        </Col>
                        <Col md={2} xs={6}>
                            <div className="footer-links">
                                <h5>{t('footer_company')}</h5>
                                <ul className="list-unstyled">
                                    <li><a href="#about" className="text-decoration-none">{t('footer_about_us')}</a></li>
                                    <li><a href="#" className="text-decoration-none">{t('footer_careers')}</a></li>
                                    <li><a href="#" className="text-decoration-none">{t('footer_blog')}</a></li>
                                    <li><a href="#cta" className="text-decoration-none">{t('footer_contact')}</a></li>
                                </ul>
                            </div>
                        </Col>
                        <Col md={2} xs={6}>
                            <div className="footer-links">
                                <h5>Support</h5>
                                <ul className="list-unstyled">
                                    <li><a href="mailto:Business.OS@gmail.com" className="text-decoration-none d-flex align-items-center gap-2">
                                        <FiMail size={14} /> Business.OS@gmail.com
                                    </a></li>
                                    <li><a href="tel:0795555112" className="text-decoration-none d-flex align-items-center gap-2">
                                        <FiPhone size={14} /> 0795555112
                                    </a></li>
                                </ul>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="footer-links">
                                <h5>{t('footer_newsletter')}</h5>
                                <div className="input-group mb-3 mt-3">
                                    <input type="text" className="form-control bg-white bg-opacity-5 border-white border-opacity-10 text-white" placeholder={t('newsletter_placeholder')} />
                                    <Button variant="primary">{t('footer_newsletter')}</Button>
                                </div>
                            </div>
                        </Col>
                    </Row>
                    <div className="border-top border-white border-opacity-10 mt-5 pt-4 text-center">
                        <p className="mb-0 text-muted">{t('copyright') || '© 2026 BusinessOS. All rights reserved.'}</p>
                    </div>
                </Container>
            </footer>

            {/* Modals */}
            <LoginModal
                show={showLogin}
                onHide={() => setShowLogin(false)}
                onSwitchToRegister={handleShowRegister}
            />
            <BusinessRegistrationModal
                show={showRegister}
                onHide={() => setShowRegister(false)}
                onSwitchToLogin={handleShowLogin}
            />
        </div>
    );
};

export default LandingPage;
