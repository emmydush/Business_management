import React, { useState, useEffect } from 'react';
import { Container, Navbar, Nav, Button, Row, Col, Card, Spinner } from 'react-bootstrap';
import { FiBarChart2, FiUsers, FiBox, FiDollarSign, FiCheckCircle, FiArrowRight, FiPhone, FiMail, FiShoppingCart, FiTruck, FiUserCheck, FiPackage, FiActivity, FiTarget } from 'react-icons/fi';
import { FaFacebookF, FaTwitter, FaLinkedinIn } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LoginModal from '../components/auth/LoginModal';
import aboutImage from '../assets/images/about_team.png';
import financeImg from '../assets/images/feature_finance.png';
import hrImg from '../assets/images/feature_hr.png';
import inventoryImg from '../assets/images/feature_inventory.png';
import projectImg from '../assets/images/feature_project.png';
import logoImage from '../assets/images/icon.png';
import './LandingPage.css';
import { useI18n } from '../i18n/I18nProvider';
import { authAPI, superadminAPI } from '../services/api';
import toast from 'react-hot-toast';

const DEFAULT_MARKETING_PLANS = [
    {
        title: 'Starter',
        price: '25,000',
        text: 'Essential tools for small teams getting started with afribuz.',
        features: [
            'Up to 3 users',
            'Core sales & invoicing',
            'Basic inventory tracking',
            'Standard reports'
        ],
        excluded: [
            'Advanced HR & payroll',
            'Advanced analytics'
        ],
        featured: false
    },
    {
        title: 'Growth',
        price: '75,000',
        text: 'Everything you need to manage a growing business across departments.',
        features: [
            'Up to 15 users',
            'Sales & purchase management',
            'Inventory across branches',
            'HR & payroll module',
            'Advanced dashboards & reports'
        ],
        featured: true
    },
    {
        title: 'Enterprise',
        price: 'Contact us',
        text: 'Custom setup, onboarding, and support for larger organizations.',
        features: [
            'Unlimited users',
            'Dedicated account manager',
            'Custom integrations',
            'Priority support'
        ],
        featured: false
    }
];

const getDefaultPlans = () => DEFAULT_MARKETING_PLANS.map((plan) => ({
    id: null,
    name: plan.title,
    plan_type: plan.title === 'Growth' ? 'professional' : plan.title === 'Enterprise' ? 'enterprise' : 'basic',
    price: plan.price,
    billing_cycle: 'monthly',
    description: plan.text,
    features: [...plan.features],
    featured: plan.featured
}));

const getPlanDescription = (plan) => {
    if (plan.description || plan.text) {
        return plan.description || plan.text;
    }

    switch (plan.plan_type) {
        case 'free':
            return 'Start with the essentials and upgrade when your team grows.';
        case 'professional':
            return 'Advanced workflows, reports, and collaboration for growing teams.';
        case 'enterprise':
            return 'Custom onboarding, support, and controls for larger organizations.';
        default:
            return 'Essential tools for running your business in one place.';
    }
};

const isFeaturedPlan = (plan) => Boolean(plan.featured) || plan.plan_type === 'professional';

const formatPlanPrice = (price) => {
    if (typeof price === 'string') {
        const normalized = Number(price.replace(/,/g, ''));
        if (Number.isNaN(normalized)) {
            return price;
        }

        return new Intl.NumberFormat('en-US', {
            maximumFractionDigits: Number.isInteger(normalized) ? 0 : 2
        }).format(normalized);
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice)) {
        return 'Custom';
    }

    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: Number.isInteger(numericPrice) ? 0 : 2
    }).format(numericPrice);
};

const LandingPage = () => {
    const location = useLocation();
    const [showLogin, setShowLogin] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { t } = useI18n();
    const [subscribing, setSubscribing] = useState(false);
    const [parallax, setParallax] = useState({ x: 0, y: 0 });
    const [plans, setPlans] = useState(getDefaultPlans);
    const [plansLoading, setPlansLoading] = useState(true);
    const [animationKey, setAnimationKey] = useState(0);

    const navigate = useNavigate();

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        const user = JSON.parse(sessionStorage.getItem('user') || 'null');
        
        if (token && user) {
            if (user.role === 'superadmin') {
                navigate('/superadmin');
            } else {
                navigate('/dashboard');
            }
        } else if (token) {
            // Fallback if user object is missing but token exists
            navigate('/dashboard');
        }

        // Check for redirect to login from Navigate
        if (location.state?.showLogin) {
            setShowLogin(true);
            // Clear state so modal doesn't re-open on refresh
            window.history.replaceState({}, document.title);
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
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [navigate, scrolled]);

    // Separate useEffect for the 5-second hero animation repeat
    useEffect(() => {
        const timer = setInterval(() => {
            setAnimationKey(prev => prev + 1);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    // Fetch subscription plans from database
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                setPlansLoading(true);
                const response = await superadminAPI.getPlans();
                const fetchedPlans = response.data?.plans || [];
                setPlans(fetchedPlans.length > 0 ? fetchedPlans : getDefaultPlans());
            } catch (error) {
                console.error('Error fetching plans:', error);
                // Fallback to default plans if API fails
                setPlans(getDefaultPlans());
            } finally {
                setPlansLoading(false);
            }
        };

        fetchPlans();
    }, []);

    const handleShowLogin = () => {
        setShowLogin(true);
    };

    const handleShowRegister = () => {
        navigate('/register');
    };

    const tx = (key, fallback) => {
        const v = t(key);
        const humanizedKey = key.replace(/[_-]+/g, ' ').toLowerCase();
        return v && v.toLowerCase() !== humanizedKey ? v : fallback;
    };

    const handleSubscribe = async (planId) => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            navigate('/register');
            return;
        }

        if (!Number.isInteger(planId)) {
            navigate('/register');
            return;
        }

        try {
            setSubscribing(true);
            await authAPI.subscribe(planId);
            window.dispatchEvent(new Event('subscription-upgrade-required'));
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to start subscription');
        } finally {
            setSubscribing(false);
        }
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

    // Static content previously provided by translations
    const dict = {
        features: [
            {
                title: 'Finance Management',
                text: 'Track revenue, expenses, and cash flow with real-time dashboards and reports.'
            },
            {
                title: 'Sales & Invoicing',
                text: 'Create invoices, manage customers, and monitor sales performance in one place.'
            },
            {
                title: 'HR & Payroll',
                text: 'Manage employees, attendance, leave, and automated payroll processing.'
            },
            {
                title: 'Inventory & Stock',
                text: 'Monitor stock levels, purchases, and product performance across branches.'
            },
            {
                title: 'Projects & Tasks',
                text: 'Plan projects, assign tasks, and track progress across your team.'
            },
            {
                title: 'Analytics & Reports',
                text: 'Get clear insights with modern dashboards and exportable reports.'
            }
        ],
        about_benefits: [
            'Unified platform for finance, sales, HR, and inventory.',
            'Designed for growing Rwandan and African businesses.',
            'Cloud-based, secure, and accessible from anywhere.',
            'Built-in best practices for everyday operations.'
        ],
        plans: DEFAULT_MARKETING_PLANS
    };

    const featureColors = ["primary", "success", "warning", "info", "danger", "secondary"];
    const featureIconComponents = [FiBarChart2, FiDollarSign, FiUsers, FiBox, FiCheckCircle, FiArrowRight];

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
                        <Navbar.Brand href="#">
                            <img src={logoImage} alt="Company Logo" style={{ 
    width: '80px', 
    height: 'auto'
}} />
                        </Navbar.Brand>

                        <Navbar.Toggle aria-controls="landing-nav" className="border-0" />
                        <Navbar.Collapse id="landing-nav">
                            <Nav className="ms-auto align-items-lg-center">
                                <Nav.Link href="#features" className="mx-lg-2 py-3 py-lg-0">Features</Nav.Link>
                                <Nav.Link href="#solutions" className="mx-lg-2 py-3 py-lg-0">Solutions</Nav.Link>
                                <Nav.Link href="#about" className="mx-lg-2 py-3 py-lg-0">About</Nav.Link>
                                <Nav.Link href="#pricing" className="mx-lg-2 py-3 py-lg-0">Pricing</Nav.Link>

                                <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-3 mt-3 mt-lg-0 ms-lg-3">
                                    <Button
                                        variant="outline-dark"
                                        className="px-4 fw-bold rounded-pill shadow-sm"
                                        onClick={handleShowLogin}
                                    >
                                        Sign In
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="px-4 fw-bold rounded-pill shadow-sm"
                                        onClick={handleShowRegister}
                                    >
Get Started
                                    </Button>

                                </div>
                            </Nav>
                        </Navbar.Collapse>
                    </Container>
                </Navbar>
            </motion.div>

            {/* Hero Section */}
            <section
                className="hero-section"
                onMouseMove={(e) => {
                    const x = (e.clientX / window.innerWidth - 0.5) * 16;
                    const y = (e.clientY / window.innerHeight - 0.5) * 12;
                    setParallax({ x, y });
                }}
                onMouseLeave={() => setParallax({ x: 0, y: 0 })}
            >
                <div className="hero-visuals" aria-hidden="true">
                    <div className="orb orb-1" />
                    <div className="orb orb-2" />
                    <div className="orb orb-3" />
                </div>
                <Container>
                        <Row className="align-items-center py-5">
                            <Col lg={6} className="hero-content text-center text-lg-start" style={{ transform: `translate3d(${parallax.x * 0.6}px, ${parallax.y * 0.6}px, 0)` }}>
                                <motion.div
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.8 }}
                                >
                                    <AnimatePresence mode="wait">
                                        <motion.h1 
                                            key={animationKey}
                                            className="hero-title-landing"
                                            initial="initial"
                                            animate="animate"
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            variants={{
                                                animate: { 
                                                    transition: { 
                                                        staggerChildren: 0.05 
                                                    } 
                                                }
                                            }}
                                        >
                                            <div style={{ display: 'inline-block', overflow: 'hidden' }}>
                                                {"Streamline Your ".split("").map((char, index) => (
                                                    <motion.span
                                                        key={index}
                                                        variants={{
                                                            initial: { opacity: 0, y: 20 },
                                                            animate: { opacity: 1, y: 0 }
                                                        }}
                                                        transition={{ duration: 0.5 }}
                                                        style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : 'normal' }}
                                                    >
                                                        {char}
                                                    </motion.span>
                                                ))}
                                            </div>
                                            <br />
                                            <div style={{ display: 'inline-block', overflow: 'hidden' }}>
                                                {"Business Operations".split("").map((char, index) => (
                                                    <motion.span
                                                        key={index}
                                                        className="text-secondary-gradient"
                                                        variants={{
                                                            initial: { opacity: 0, y: 20 },
                                                            animate: { opacity: 1, y: 0 }
                                                        }}
                                                        transition={{ duration: 0.5 }}
                                                        style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : 'normal' }}
                                                    >
                                                        {char}
                                                    </motion.span>
                                                ))}
                                            </div>
                                        </motion.h1>
                                    </AnimatePresence>
                                    <p className="mx-auto mx-lg-0 lead mb-5 hero-subtitle-landing">
                                        All-in-one business management platform to handle inventory, sales, HR, finance, and more in one place.
                                    </p>
                                    <div className="d-flex gap-3 justify-content-center justify-content-lg-start mb-5">
                                        <Button
                                            className="btn-hero-teal px-5 py-3 rounded-pill fw-bold border-0 shadow-lg"
                                            onClick={handleShowRegister}
                                        >
                                            Start Free Trial
                                        </Button>
                                        <Button
                                            className="btn-hero-dark px-5 py-3 rounded-pill fw-bold border-0 shadow-lg"
                                        >
                                            Watch Demo
                                        </Button>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-center justify-content-lg-start gap-4 text-muted small fw-bold">
                                        <span><FiCheckCircle className="text-primary me-2" /> No credit card required</span>
                                        <span><FiCheckCircle className="text-primary me-2" /> 14-day free trial</span>
                                    </div>
                                </motion.div>
                            </Col>
                            <Col lg={6} className="d-none d-lg-flex justify-content-center">
                                <div className="hero-mockup-section">
                                    <motion.div
                                        className="mockup-container"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.8 }}
                                    >
                                        <div className="mockup-main-card">
                                            <div className="card-header-mockup">
                                                <span className="text-muted small fw-bold">Monthly overview</span>
                                            </div>
                                            <div className="metrics-row-mockup mt-4">
                                                <div className="metric-box-mockup">
                                                    <span className="label-mockup">REVENUE</span>
                                                    <span className="value-mockup">FRW 18.2M</span>
                                                    <span className="trend-mockup text-success">+12.5%</span>
                                                </div>
                                                <div className="metric-box-mockup">
                                                    <span className="label-mockup">EXPENSES</span>
                                                    <span className="value-mockup">FRW 9.4M</span>
                                                    <span className="trend-mockup text-danger">-3.1%</span>
                                                </div>
                                                <div className="metric-box-mockup">
                                                    <span className="label-mockup">NET PROFIT</span>
                                                    <span className="value-mockup">FRW 8.8M</span>
                                                    <span className="trend-mockup text-primary">+22.0%</span>
                                                </div>
                                            </div>
                                            <div className="chart-visual-mockup mt-4">
                                                <div className="bar-group-mockup">
                                                    <div className="bar bar-purp" style={{height: '40%'}}></div>
                                                    <div className="bar bar-purp" style={{height: '70%'}}></div>
                                                    <div className="bar bar-purp" style={{height: '35%'}}></div>
                                                    <div className="bar bar-purp" style={{height: '90%'}}></div>
                                                    <div className="bar bar-purp" style={{height: '55%'}}></div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <motion.div 
                                            className="mockup-pill pill-top"
                                            animate={{ y: [0, -10, 0] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                            <span className="dot dot-green"></span> HR & Payroll synced
                                        </motion.div>
                                        
                                        <motion.div 
                                            className="mockup-pill pill-bottom"
                                            animate={{ y: [0, 10, 0] }}
                                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                        >
                                            <span className="dot dot-purp"></span> Inventory levels in real time
                                        </motion.div>
                                    </motion.div>
                                </div>
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
                        <h2>{tx('everything_title', 'Everything you need in one platform')}</h2>
                        <p className="text-white">{tx('everything_sub', 'Unified tools across finance, sales, inventory, HR, and projects')}</p>
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
                                                <img
                                                    src={[
                                                        financeImg,
                                                        financeImg,
                                                        hrImg,
                                                        inventoryImg,
                                                        projectImg,
                                                        aboutImage
                                                    ][index]}
                                                    alt={feature.title}
                                                />
                                            </div>
                                            <div className={`feature-icon bg-${featureColors[index]} bg-opacity-20 text-${featureColors[index]}`}>
                                                {(() => {
                                                    const Icon = featureIconComponents[index];
                                                    return <Icon />;
                                                })()}
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

            {/* Pricing Section */}
            <section id="pricing" className="py-5">
                <Container className="py-5">
                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="section-title text-center"
                    >
                        <h2 className="text-dark">{tx('subscribe_title', 'Subscription Plans')}</h2>
                        <p className="text-muted">{tx('subscribe_sub', 'Choose the perfect plan for your business')}</p>
                    </motion.div>
                    {plansLoading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                        </div>
                    ) : (
                        <Row className="g-4 justify-content-center">
                            {plans.map((plan, index) => {
                                const featuredPlan = isFeaturedPlan(plan);
                                const hasPlanId = Number.isInteger(plan.id);
                                const ctaLabel = hasPlanId
                                    ? (t('subscribe_cta') || 'Subscribe')
                                    : (t('start_trial') || 'Get Started');

                                return (
                                    <Col md={4} key={plan.id ?? `${plan.name}-${index}`}>
                                        <motion.div
                                            variants={fadeIn}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                        >
                                            <Card className={`h-100 border-0 shadow-sm ${featuredPlan ? 'ring-primary' : ''}`}>
                                                <Card.Body className="d-flex flex-column">
                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                        <h4 className="mb-0">{plan.name || plan.title}</h4>
                                                        {featuredPlan && <span className="badge bg-primary bg-opacity-10 text-primary">Popular</span>}
                                                    </div>
                                                    <div className="display-6 fw-bold mb-2">
                                                        {`${formatPlanPrice(plan.price)}${typeof plan.price === 'string' && plan.price.toLowerCase() === 'contact us' ? '' : ` / ${plan.billing_cycle || 'monthly'}`}`}
                                                    </div>
                                                    <p className="text-muted mb-4">{getPlanDescription(plan)}</p>
                                                    <ul className="list-unstyled small mb-4">
                                                        {(plan.features || []).slice(0, 4).map((feature, featureIndex) => (
                                                            <li key={`${plan.id ?? plan.name}-${featureIndex}`} className="mb-1">• {feature}</li>
                                                        ))}
                                                    </ul>
                                                    <Button
                                                        variant={featuredPlan ? 'primary' : 'outline-primary'}
                                                        className="mt-auto"
                                                        onClick={() => (hasPlanId ? handleSubscribe(plan.id) : handleShowRegister())}
                                                        disabled={subscribing}
                                                    >
                                                        {subscribing ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                                                        {ctaLabel}
                                                    </Button>
                                                </Card.Body>
                                            </Card>
                                        </motion.div>
                                    </Col>
                                );
                            })}
                        </Row>
                    )}
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
                        <h2>{tx('solutions_title', 'Solutions for Every Business Type')}</h2>
                        <p className="text-white-50">{tx('solutions_sub', 'Tailored solutions designed to meet the unique needs of your industry')}</p>
                    </motion.div>
                    <Row className="g-4">
                        {[
                            {
                                title: 'Retail & E-commerce',
                                description: 'Complete POS system, inventory tracking, and customer management tailored for retail businesses',
                                icon: <FiBox />,
                                color: 'primary'
                            },
                            {
                                title: 'Service Businesses',
                                description: 'Project management, time tracking, and client billing designed for service providers',
                                icon: <FiUsers />,
                                color: 'success'
                            },
                            {
                                title: 'Manufacturing',
                                description: 'Production planning, supply chain management, and quality control tools',
                                icon: <FiBarChart2 />,
                                color: 'warning'
                            },
                            {
                                title: 'Financial Services',
                                description: 'Advanced financial reporting, compliance tools, and multi-currency support',
                                icon: <FiDollarSign />,
                                color: 'info'
                            },
                            {
                                title: 'HR & Payroll',
                                description: 'Complete employee management, attendance tracking, leave requests, and automated payroll processing',
                                icon: <FiUserCheck />,
                                color: 'danger'
                            },
                            {
                                title: 'Sales & Invoicing',
                                description: 'Generate professional invoices, track sales, manage customers, and monitor revenue in real-time',
                                icon: <FiShoppingCart />,
                                color: 'primary'
                            },
                            {
                                title: 'Purchase Management',
                                description: 'Streamline supplier management, purchase orders, and track expenses efficiently',
                                icon: <FiTruck />,
                                color: 'success'
                            },
                            {
                                title: 'CRM & Leads',
                                description: 'Track leads, manage customer relationships, and automate follow-ups for better sales',
                                icon: <FiTarget />,
                                color: 'warning'
                            },
                            {
                                title: 'Asset Management',
                                description: 'Track and manage company assets, maintenance schedules, and depreciation',
                                icon: <FiPackage />,
                                color: 'info'
                            },
                            {
                                title: 'Expense Tracking',
                                description: 'Categorize, approve, and report on business expenses with ease',
                                icon: <FiDollarSign />,
                                color: 'danger'
                            },
                            {
                                title: 'Workflow & Approvals',
                                description: 'Create custom approval workflows and automate document routing',
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
                                    alt="afribuz Team"
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
                                <h2 className="fw-bold mb-4 text-dark">{tx('about_title', 'About afribuz')}</h2>
                                <p className="lead text-muted mb-5">
                                    {tx('about_p', 'afribuz is a comprehensive business management platform built to empower African entrepreneurs. We provide the tools you need to professionalize your operations and scale your business with confidence.')}
                                </p>

                                <Row className="g-4 mb-5">
                                    <Col md={6}>
                                        <div className="p-4 h-100">
                                            <h5 className="text-primary fw-bold mb-3">{tx('mission_title', 'Our Mission')}</h5>
                                            <p className="text-muted small mb-0">{tx('mission_p', 'To simplify business management for small and medium enterprises through intuitive, locally-optimized technology.')}</p>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="p-4 h-100">
                                            <h5 className="text-secondary fw-bold mb-3">{tx('vision_title', 'Our Vision')}</h5>
                                            <p className="text-muted small mb-0">{tx('vision_p', 'To become the operating system of choice for modern businesses across the continent.')}</p>
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
                                        <p className="text-muted small mb-0">{tx('stat_users', 'Active Businesses')}</p>
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
                                        <p className="text-muted small mb-0">{tx('stat_uptime', 'System Uptime')}</p>
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
                                        <p className="text-muted small mb-0">{tx('stat_support', 'Customer Support')}</p>
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
                    <h2 className="mb-4 text-white fw-bold">{tx('cta_h2', 'Ready to Transform Your Business?')}</h2>
                    <p className="lead mb-5 text-white opacity-75">{tx('cta_p', 'Join hundreds of Rwandan companies using afribuz to grow faster.')}</p>
                    <Button size="lg" variant="light" className="rounded-pill px-5 py-3 fw-bold text-primary shadow-lg" onClick={handleShowRegister}>
                        {tx('start_trial', 'Get Started for Free')}
                    </Button>
                </Container>
            </motion.section>

            {/* Footer */}
            <footer className="footer">
                <Container>
                    <Row>
                        <Col md={4} className="mb-4 mb-md-0">
                            <div className="mb-3">
                                <img src={logoImage} alt="Company Logo" style={{ 
    width: '80px', 
    height: 'auto'
}} />
                            </div>
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
                                    <li><a href="mailto:info@afribuz.com" className="text-decoration-none d-flex align-items-center gap-2">
                                        <FiMail size={14} /> info@afribuz.com
                                    </a></li>
                                    <li><a href="tel:0795555112" className="text-decoration-none d-flex align-items-center gap-2">
                                        <FiPhone size={14} /> 0795555112
                                    </a></li>
                                </ul>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="footer-links">
                                <h5>Newsletter</h5>
                                <div className="input-group mb-3 mt-3">
                                    <input type="text" className="form-control bg-white bg-opacity-5 border-white border-opacity-10 text-white" placeholder="Enter your email" />
                                    <Button variant="primary">Subscribe</Button>
                                </div>
                            </div>
                        </Col>
                    </Row>
                    <div className="border-top border-white border-opacity-10 mt-5 pt-4 text-center">
                        <p className="mb-0 text-muted">© 2026 afribuz. All rights reserved.</p>
                    </div>
                </Container>
            </footer>

            {/* Modals */}
            <LoginModal
                show={showLogin}
                onHide={() => setShowLogin(false)}
                onSwitchToRegister={handleShowRegister}
            />
        </div>
    );
};

export default LandingPage;
