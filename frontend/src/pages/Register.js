import React, { useState } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
    FaCheck, 
    FaArrowRight, 
    FaArrowLeft, 
    FaRocket, 
    FaShieldAlt, 
    FaGlobe, 
    FaBusinessTime,
    FaChartLine
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import LoginModal from '../components/auth/LoginModal';
import logoImage from '../assets/images/logo.png';
import PasswordStrengthIndicator, { usePasswordStrength } from '../components/PasswordStrengthIndicator';
import Logo from '../components/Logo';

const Register = () => {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        phone: '',
        business_name: '',
        business_phone: '',
        business_address: '',
        registration_number: '',
        tax_id: '',
        industry: '',
        company_size: 'small',
        website: '',
        business_description: '',
        business_type: '',
        country: '',
        currency: 'USD',
        timezone: 'Africa/Johannesburg',
        role: 'admin',
        honeypot: ''
    });
    const [loading, setLoading] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const navigate = useNavigate();
    const { login } = useAuth();
    const passwordStrength = usePasswordStrength(formData.password);

    const industryOptions = [
        { value: '', label: 'Select Industry' },
        { value: 'retail', label: 'Retail' },
        { value: 'manufacturing', label: 'Manufacturing' },
        { value: 'services', label: 'Professional Services' },
        { value: 'technology', label: 'Technology' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'finance', label: 'Finance & Banking' },
        { value: 'other', label: 'Other' }
    ];

    const companySizeOptions = [
        { value: 'small', label: 'Small (1-10 employees)' },
        { value: 'medium', label: 'Medium (11-50 employees)' },
        { value: 'large', label: 'Large (51-200 employees)' },
        { value: 'enterprise', label: 'Enterprise (200+ employees)' }
    ];

    const countryOptions = [
        { value: '', label: 'Select Country' },
        { value: 'Rwanda', label: 'Rwanda' },
        { value: 'South Africa', label: 'South Africa' },
        { value: 'Nigeria', label: 'Nigeria' },
        { value: 'Kenya', label: 'Kenya' },
        { value: 'United States', label: 'United States' },
        { value: 'Other', label: 'Other' }
    ];

    const currencyOptions = [
        { value: 'USD', label: '🇺🇸 USD' },
        { value: 'ZAR', label: '🇿🇦 ZAR' },
        { value: 'NGN', label: '🇳🇬 NGN' },
        { value: 'KES', label: '🇰🇪 KES' },
        { value: 'RWF', label: '🇷🇼 RWF' }
    ];

    const steps = [
        { key: 'account', title: 'Account', icon: <FaRocket /> },
        { key: 'business', title: 'Business', icon: <Logo variant="icon" size="small" animated={false} /> },
        { key: 'preferences', title: 'Settings', icon: <FaGlobe /> }
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateStep = (step) => {
        if (step === 0) {
            if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
                toast.error('Please fill in all required fields');
                return false;
            }
            if (formData.password !== formData.confirmPassword) {
                toast.error('Passwords do not match');
                return false;
            }
            if (!passwordStrength.canProceed) {
                toast.error('Please create a stronger password');
                return false;
            }
        } else if (step === 1) {
            if (!formData.business_name) {
                toast.error('Business name is required');
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(activeStep)) setActiveStep(s => s + 1);
    };

    const handleBack = () => setActiveStep(s => s - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(2)) return;
        setLoading(true);
        try {
            // Include username as email if not provided separately
            const submissionData = { ...formData, username: formData.username || formData.email };
            const response = await authAPI.register(submissionData);
            const token = response.data?.access_token;
            const user = response.data?.user;
            if (token && user) {
                sessionStorage.setItem('token', token);
                login(user);
                toast.success('Welcome to afribuz!');
                navigate(user.role === 'superadmin' ? '/superadmin' : '/dashboard');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const benefits = [
        { icon: <FaChartLine />, title: 'Growth Analytics', desc: 'Track your business performance in real-time.' },
        { icon: <FaShieldAlt />, title: 'Enterprise Security', desc: 'Your data is protected with bank-grade encryption.' },
        { icon: <FaBusinessTime />, title: 'Automation', desc: 'Save hours every week with automated workflows.' }
    ];

    return (
        <div className="register-container">
            <Row className="g-0 min-vh-100">
                {/* Left Side - Hero Panel */}
                <Col lg={5} className="d-none d-lg-block">
                    <div className="hero-panel">
                        <div className="hero-content">
                             <img src={logoImage} alt="Company Logo" className="mb-5 shadow-sm" style={{ 
                                 width: '220px', 
                                 height: 'auto',
                                 backgroundColor: '#ffffff',
                                 padding: '12px',
                                 borderRadius: '12px',
                                 display: 'block'
                             }} />
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                <h1 className="hero-title">Elevate Your <br/><span>Business</span></h1>
                                <p className="hero-subtitle">Join thousands of businesses across Africa optimizing their operations with afribuz.</p>
                            </motion.div>

                            <div className="benefits-list">
                                {benefits.map((benefit, i) => (
                                    <motion.div 
                                        key={i} 
                                        className="benefit-item"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 + (i * 0.1) }}
                                    >
                                        <div className="benefit-icon">{benefit.icon}</div>
                                        <div>
                                            <h4>{benefit.title}</h4>
                                            <p>{benefit.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="hero-footer mt-auto pt-5">
                                <div className="social-proof">
                                    <div className="avatars d-flex mb-2">
                                        {[1,2,3,4].map(i => (
                                            <div key={i} className="avatar-placeholder" style={{ marginLeft: i > 1 ? '-10px' : '0' }}></div>
                                        ))}
                                    </div>
                                    <span className="small text-muted text-light-opacity">Joined by 5,000+ businesses this month</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Col>

                {/* Right Side - Form Panel */}
                <Col lg={7} className="form-panel">
                    <Container className="form-container py-5">
                        <div className="form-inner">
                            <div className="d-lg-none text-center mb-4">
                                <img src={logoImage} alt="Company Logo" className="justify-content-center" style={{ 
    width: '150px', 
    height: 'auto'
}} />
                            </div>

                            <div className="form-header">
                                <h2>Create your account</h2>
                                <p>Start your 14-day free trial. No credit card required.</p>
                            </div>

                            {/* Custom Stepper */}
                            <div className="modern-stepper">
                                {steps.map((step, index) => (
                                    <div key={index} className={`stepper-item ${index === activeStep ? 'active' : index < activeStep ? 'completed' : ''}`}>
                                        <div className="stepper-bubble">
                                            {index < activeStep ? <FaCheck /> : step.icon}
                                        </div>
                                        <span className="stepper-label">{step.title}</span>
                                        {index < steps.length - 1 && <div className="stepper-line"></div>}
                                    </div>
                                ))}
                            </div>

                            <Form onSubmit={handleSubmit} className="mt-5">
                                <AnimatePresence mode="wait">
                                    {activeStep === 0 && (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="form-step"
                                        >
                                            <Row className="g-3">
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>First Name</Form.Label>
                                                        <Form.Control type="text" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="John" required />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Last Name</Form.Label>
                                                        <Form.Control type="text" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Doe" required />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={12}>
                                                    <Form.Group>
                                                        <Form.Label>Email Address</Form.Label>
                                                        <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" required />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={12}>
                                                    <Form.Group>
                                                        <Form.Label>Password</Form.Label>
                                                        <Form.Control type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required />
                                                        <PasswordStrengthIndicator password={formData.password} />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={12}>
                                                    <Form.Group>
                                                        <Form.Label>Confirm Password</Form.Label>
                                                        <Form.Control type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" required />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                            <div className="form-actions mt-4">
                                                <Button variant="dark" className="btn-primary-custom w-100 py-3" onClick={handleNext}>
                                                    Continue to Business Info <FaArrowRight className="ms-2" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeStep === 1 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="form-step"
                                        >
                                            <Row className="g-3">
                                                <Col md={12}>
                                                    <Form.Group>
                                                        <Form.Label>Business Name</Form.Label>
                                                        <Form.Control type="text" name="business_name" value={formData.business_name} onChange={handleChange} placeholder="Acme Corp" required />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Industry</Form.Label>
                                                        <Form.Select name="industry" value={formData.industry} onChange={handleChange}>
                                                            {industryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Company Size</Form.Label>
                                                        <Form.Select name="company_size" value={formData.company_size} onChange={handleChange}>
                                                            {companySizeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={12}>
                                                    <Form.Group>
                                                        <Form.Label>Business Phone</Form.Label>
                                                        <Form.Control type="text" name="business_phone" value={formData.business_phone} onChange={handleChange} placeholder="+27 12 345 6789" />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                            <div className="form-actions mt-4 gap-3 d-flex">
                                                <Button variant="light" className="btn-secondary-custom flex-grow-1" onClick={handleBack}>
                                                    <FaArrowLeft className="me-2" /> Back
                                                </Button>
                                                <Button variant="dark" className="btn-primary-custom flex-grow-2" onClick={handleNext}>
                                                    Next Step <FaArrowRight className="ms-2" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeStep === 2 && (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="form-step"
                                        >
                                            <Row className="g-3">
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Country</Form.Label>
                                                        <Form.Select name="country" value={formData.country} onChange={handleChange}>
                                                            {countryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Preferred Currency</Form.Label>
                                                        <Form.Select name="currency" value={formData.currency} onChange={handleChange}>
                                                            {currencyOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={12} className="mt-4">
                                                    <div className="terms-agreement p-3 rounded-3 bg-light small text-muted border">
                                                        By clicking &quot;Complete Registration&quot;, you agree to our <a href="#" className="text-dark fw-bold">Terms of Service</a> and <a href="#" className="text-dark fw-bold">Privacy Policy</a>.
                                                    </div>
                                                </Col>
                                            </Row>
                                            <div className="form-actions mt-4 gap-3 d-flex">
                                                <Button variant="light" className="btn-secondary-custom flex-grow-1" onClick={handleBack}>
                                                    <FaArrowLeft className="me-2" /> Back
                                                </Button>
                                                <Button variant="success" className="btn-success-custom flex-grow-2" type="submit" disabled={loading}>
                                                    {loading ? 'Setting up...' : 'Complete Registration'} <FaCheck className="ms-2" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Form>

                            <div className="form-footer mt-5 text-center">
                                <p className="text-muted">
                                    Already have an account? 
                                    <Button variant="link" className="text-dark fw-bold ms-1 text-decoration-none" onClick={() => setShowLoginModal(true)}>
                                        Sign In
                                    </Button>
                                </p>
                            </div>
                        </div>
                    </Container>
                </Col>
            </Row>

            <LoginModal 
                show={showLoginModal} 
                onHide={() => setShowLoginModal(false)}
                onSwitchToRegister={() => setShowLoginModal(false)}
            />

            <style dangerouslySetInnerHTML={{ __html: `
                .register-container {
                    background: #fff;
                    font-family: 'Outfit', sans-serif;
                    overflow-x: hidden;
                }
                .hero-panel {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    min-height: 100vh;
                    position: sticky;
                    top: 0;
                    padding: 60px;
                    color: white;
                    display: flex;
                    flex-direction: column;
                }
                .hero-title {
                    font-size: 3.5rem;
                    font-weight: 800;
                    line-height: 1.1;
                    margin-bottom: 2rem;
                }
                .hero-title span {
                    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .hero-subtitle {
                    font-size: 1.25rem;
                    color: #94a3b8;
                    margin-bottom: 4rem;
                    max-width: 450px;
                }
                .benefits-list {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }
                .benefit-item {
                    display: flex;
                    gap: 1.25rem;
                    align-items: flex-start;
                }
                .benefit-icon {
                    width: 44px;
                    height: 44px;
                    background: rgba(255,255,255,0.08);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #3b82f6;
                    font-size: 1.25rem;
                    flex-shrink: 0;
                }
                .benefit-item h4 { margin: 0; font-size: 1.1rem; font-weight: 600; color: #fff; }
                .benefit-item p { margin: 0; color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
                
                .text-light-opacity { color: rgba(255,255,255,0.6); }
                .avatar-placeholder {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #334155;
                    border: 2px solid #0f172a;
                }

                .form-panel {
                    background: #fff;
                    display: flex;
                    align-items: center;
                }
                .form-inner {
                    max-width: 520px;
                    margin: 0 auto;
                    width: 100%;
                }
                .form-header h2 { font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; letter-spacing: -0.5px; }
                .form-header p { color: #64748b; margin-bottom: 3rem; }
                
                .modern-stepper {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4rem;
                    position: relative;
                }
                .stepper-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                    z-index: 1;
                    flex: 1;
                }
                .stepper-bubble {
                    width: 42px;
                    height: 42px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #94a3b8;
                    font-size: 1rem;
                    margin-bottom: 0.75rem;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .stepper-item.active .stepper-bubble {
                    background: #0f172a;
                    border-color: #0f172a;
                    color: #fff;
                    transform: scale(1.1);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                }
                .stepper-item.completed .stepper-bubble {
                    background: #10b981;
                    border-color: #10b981;
                    color: #fff;
                }
                .stepper-label { font-size: 0.8rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
                .stepper-item.active .stepper-label { color: #0f172a; }
                
                .stepper-line {
                    position: absolute;
                    top: 21px;
                    left: 50%;
                    width: 100%;
                    height: 2px;
                    background: #f1f5f9;
                    z-index: -1;
                }
                .stepper-item.completed .stepper-line { background: #10b981; transition: background 0.4s ease; }

                Form Label { font-weight: 600; color: #334155; margin-bottom: 0.6rem; font-size: 0.9rem; }
                Form .form-control, Form .form-select {
                    padding: 0.8rem 1rem;
                    border-radius: 12px;
                    border: 1.5px solid #e2e8f0;
                    font-size: 1rem;
                    transition: all 0.2s;
                    background: #fcfdfe;
                }
                Form .form-control:focus {
                    border-color: #0f172a;
                    background: #fff;
                    box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.08);
                }
                
                .btn-primary-custom {
                    padding: 1rem;
                    border-radius: 14px;
                    font-weight: 700;
                    font-size: 1rem;
                    transition: all 0.3s;
                    background: #0f172a;
                    border: none;
                }
                .btn-primary-custom:hover { background: #1e293b; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
                
                .btn-secondary-custom {
                    padding: 1rem;
                    border-radius: 14px;
                    font-weight: 600;
                    background: #fff;
                    border: 1.5px solid #e2e8f0;
                    color: #475569;
                }
                .btn-secondary-custom:hover { background: #f8fafc; border-color: #cbd5e1; }

                .btn-success-custom {
                    background: #10b981;
                    border: none;
                    padding: 1rem;
                    border-radius: 14px;
                    font-weight: 700;
                    color: #fff;
                    transition: all 0.3s;
                }
                .btn-success-custom:hover { background: #059669; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3); }
                
                @media (max-width: 991px) {
                    .hero-panel { display: none; }
                    .form-panel { padding: 40px 20px; }
                    .form-inner { max-width: 100%; }
                }
            ` }} />
        </div>
    );
};

export default Register;
