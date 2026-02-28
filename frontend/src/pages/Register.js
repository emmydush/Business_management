import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useI18n } from '../i18n/I18nProvider';

import PasswordStrengthIndicator, { usePasswordStrength } from '../components/PasswordStrengthIndicator';

const Register = () => {
    
    const { t } = useI18n();
    const [formData, setFormData] = useState({
        // User fields
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        phone: '',
        // Business fields
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
        honeypot: ''  // Bot protection - hidden field that should remain empty
    });
    const [loading, setLoading] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const navigate = useNavigate();
    const { login } = useAuth();

    // Password strength validation
    const passwordStrength = usePasswordStrength(formData.password);

    // Industry options
    const industryOptions = [
        { value: '', label: t('select_industry') || 'Select Industry' },
        { value: 'retail', label: t('industry_retail') || 'Retail' },
        { value: 'manufacturing', label: t('industry_manufacturing') || 'Manufacturing' },
        { value: 'services', label: t('industry_services') || 'Professional Services' },
        { value: 'technology', label: t('industry_technology') || 'Technology' },
        { value: 'healthcare', label: t('industry_healthcare') || 'Healthcare' },
        { value: 'education', label: t('industry_education') || 'Education' },
        { value: 'finance', label: t('industry_finance') || 'Finance & Banking' },
        { value: 'construction', label: t('industry_construction') || 'Construction' },
        { value: 'hospitality', label: t('industry_hospitality') || 'Hospitality' },
        { value: 'transportation', label: t('industry_transportation') || 'Transportation' },
        { value: 'agriculture', label: t('industry_agriculture') || 'Agriculture' },
        { value: 'other', label: t('industry_other') || 'Other' }
    ];

    // Company size options
    const companySizeOptions = [
        { value: 'small', label: t('size_small') || 'Small (1-10 employees)' },
        { value: 'medium', label: t('size_medium') || 'Medium (11-50 employees)' },
        { value: 'large', label: t('size_large') || 'Large (51-200 employees)' },
        { value: 'enterprise', label: t('size_enterprise') || 'Enterprise (200+ employees)' }
    ];

    // Business type options
    const businessTypeOptions = [
        { value: '', label: t('select_business_type') || 'Select Business Type' },
        { value: 'sole_proprietorship', label: t('type_sole') || 'Sole Proprietorship' },
        { value: 'partnership', label: t('type_partnership') || 'Partnership' },
        { value: 'llc', label: t('type_llc') || 'Limited Liability Company (LLC)' },
        { value: 'corporation', label: t('type_corporation') || 'Corporation' },
        { value: 'nonprofit', label: t('type_nonprofit') || 'Non-Profit Organization' }
    ];

    // Country options
    const countryOptions = [
        { value: '', label: t('select_country') || 'Select Country' },
        { value: 'South Africa', label: 'South Africa' },
        { value: 'Nigeria', label: 'Nigeria' },
        { value: 'Kenya', label: 'Kenya' },
        { value: 'Ghana', label: 'Ghana' },
        { value: 'Zimbabwe', label: 'Zimbabwe' },
        { value: 'Botswana', label: 'Botswana' },
        { value: 'Namibia', label: 'Namibia' },
        { value: 'United States', label: 'United States' },
        { value: 'United Kingdom', label: 'United Kingdom' },
        { value: 'Other', label: t('other') || 'Other' }
    ];

    // Currency options
    const currencyOptions = [
        { value: 'USD', label: 'USD - US Dollar' },
        { value: 'ZAR', label: 'ZAR - South African Rand' },
        { value: 'NGN', label: 'NGN - Nigerian Naira' },
        { value: 'KES', label: 'KES - Kenyan Shilling' },
        { value: 'GHS', label: 'GHS - Ghanaian Cedi' },
        { value: 'GBP', label: 'GBP - British Pound' },
        { value: 'EUR', label: 'EUR - Euro' }
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const steps = [
        { key: 'account', title: t('step_user_info') || 'Your Information' },
        { key: 'business', title: t('step_business_info') || 'Business Information' },
        { key: 'preferences', title: t('step_preferences') || 'Preferences' }
    ];

    const validateStep = (step) => {
        if (step === 0) {
            // Validate user fields
            if (!formData.first_name || !formData.last_name || !formData.username || 
                !formData.email || !formData.password || !formData.confirmPassword) {
                toast.error(t('fill_required_fields') || 'Please fill in all required fields');
                return false;
            }
            if (formData.password !== formData.confirmPassword) {
                toast.error(t('passwords_not_match') || 'Passwords do not match');
                return false;
            }
            if (!passwordStrength.canProceed) {
                toast.error(t('password_too_weak') || 'Please create a stronger password');
                return false;
            }
        } else if (step === 1) {
            // Validate business fields
            if (!formData.business_name) {
                toast.error(t('business_name_required') || 'Business name is required');
                return false;
            }
        } else if (step === 2) {
            if (!formData.currency) {
                toast.error(t('currency_required') || 'Please select a currency');
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(activeStep)) {
            setActiveStep(Math.min(activeStep + 1, steps.length - 1));
        }
    };

    const handleBack = () => {
        setActiveStep(Math.max(activeStep - 1, 0));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep(2)) {
            return;
        }

        setLoading(true);

        try {
            // Prepare registration data
            const registrationData = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone,
                business_name: formData.business_name,
                business_phone: formData.business_phone,
                business_address: formData.business_address,
                registration_number: formData.registration_number,
                tax_id: formData.tax_id,
                industry: formData.industry,
                company_size: formData.company_size,
                website: formData.website,
                business_description: formData.business_description,
                business_type: formData.business_type,
                country: formData.country,
                currency: formData.currency,
                timezone: formData.timezone,
                role: formData.role,
                honeypot: formData.honeypot
            };

            await authAPI.register(registrationData);

            // Registration successful, but we need to login to get the token
            const loginResponse = await authAPI.login({
                username: formData.username,
                password: formData.password
            });

            sessionStorage.setItem('token', loginResponse.data.access_token);
            login(loginResponse.data.user);

            toast.success("register_success", {
                duration: 4000,
                icon: '✅',
            });

            if (loginResponse.data.user.role === 'superadmin') {
                navigate('/superadmin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || t('register_failed');
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        color: '#fff',
        padding: '0.75rem 1rem'
    };

    const labelStyle = {
        color: '#94a3b8',
        fontSize: '0.875rem',
        fontWeight: '500',
        marginBottom: '0.5rem'
    };

    

    return (
        <div className="register-page">
            <Container>
                <Row className="w-100 justify-content-center">
                    <Col md={10} lg={8}>
                        <Card className="register-card border-0">
                            <Card.Header className="text-center py-5 border-0 bg-transparent">
                                <h2 className="fw-bold mb-1 text-white">{t('app_name')}</h2>
                                <p className="mb-0 text-muted">{t('register_business_title')}</p>
                                <div className="stepper mt-4">
                                    {steps.map((s, i) => (
                                        <div key={s.key} className={`step ${i <= activeStep ? 'active' : ''}`}>
                                            <div className="circle">{i + 1}</div>
                                            <div className="label">{s.title}</div>
                                        </div>
                                    ))}
                                </div>
                                <small className="text-muted mt-2 d-block">
                                    {steps[activeStep]?.title}
                                </small>
                            </Card.Header>
                            <Card.Body className="p-4 pt-0">
                                <Form onSubmit={handleSubmit} autoComplete="off">
                                    {activeStep === 0 && (
                                        <div>
                                            <div className="section-title">
                                                {t('personal_information') || 'Personal Information'}
                                            </div>

                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3" controlId="first_name">
                                                        <Form.Label style={labelStyle}>{t('first_name')} *</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="first_name"
                                                            placeholder={t('first_name')}
                                                            value={formData.first_name}
                                                            onChange={handleChange}
                                                            style={inputStyle}
                                                            required
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3" controlId="last_name">
                                                        <Form.Label style={labelStyle}>{t('last_name')} *</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="last_name"
                                                            placeholder={t('last_name')}
                                                            value={formData.last_name}
                                                            onChange={handleChange}
                                                            style={inputStyle}
                                                            required
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3" controlId="username">
                                                        <Form.Label style={labelStyle}>{t('username') || 'Username'} *</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="username"
                                                            autoComplete="off"
                                                            placeholder={t('username_placeholder')}
                                                            value={formData.username}
                                                            onChange={handleChange}
                                                            style={inputStyle}
                                                            required
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3" controlId="phone">
                                                        <Form.Label style={labelStyle}>{t('phone') || 'Phone'}</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="phone"
                                                            placeholder={t('phone_placeholder')}
                                                            value={formData.phone}
                                                            onChange={handleChange}
                                                            style={inputStyle}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <Form.Group className="mb-3" controlId="email">
                                                <Form.Label style={labelStyle}>{t('email') || 'Email'} *</Form.Label>
                                                <Form.Control
                                                    type="email"
                                                    name="email"
                                                        autoComplete="off"
                                                    placeholder={t('email_placeholder')}
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    style={inputStyle}
                                                    required
                                                />
                                            </Form.Group>

                                            <Form.Group className="mb-3" controlId="password">
                                                <Form.Label style={labelStyle}>{t('password') || 'Password'} *</Form.Label>
                                                <Form.Control
                                                    type="password"
                                                    name="password"
                                                        autoComplete="new-password"
                                                    placeholder={t('password_placeholder') || 'Enter your password'}
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    style={inputStyle}
                                                    required
                                                />
                                                <PasswordStrengthIndicator password={formData.password} />
                                            </Form.Group>

                                            <Form.Group className="mb-4" controlId="confirmPassword">
                                                <Form.Label style={labelStyle}>{t('confirm_password') || 'Confirm Password'} *</Form.Label>
                                                <Form.Control
                                                    type="password"
                                                    name="confirmPassword"
                                                        autoComplete="new-password"
                                                    placeholder={t('confirm_password_placeholder') || 'Confirm your password'}
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    style={inputStyle}
                                                    required
                                                />
                                            </Form.Group>

                                            <div className="d-flex justify-content-end">
                                                <Button
                                                    variant="primary"
                                                    type="button"
                                                    className="btn-next"
                                                    onClick={handleNext}
                                                >
                                                    {t('next_step')} {t('business_info')}
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {activeStep === 1 && (
                                        <div>
                                            <div className="section-title">
                                                {t('business_information') || 'Business Information'}
                                            </div>

                                            <Form.Group className="mb-3" controlId="business_name">
                                                <Form.Label style={labelStyle}>{t('business_name_label')} *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="business_name"
                                                    placeholder={t('business_name_placeholder')}
                                                    value={formData.business_name}
                                                    onChange={handleChange}
                                                    style={inputStyle}
                                                    required
                                                />
                                            </Form.Group>

                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3" controlId="business_type">
                                                        <Form.Label style={labelStyle}>{t('business_type') || 'Business Type'}</Form.Label>
                                                        <Form.Select
                                                            name="business_type"
                                                            value={formData.business_type}
                                                            onChange={handleChange}
                                                            style={inputStyle}
                                                        >
                                                            {businessTypeOptions.map(opt => (
                                                                <option key={opt.value} value={opt.value} style={{ background: '#1e293b' }}>{opt.label}</option>
                                                            ))}
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3" controlId="industry">
                                                        <Form.Label style={labelStyle}>{t('industry') || 'Industry'}</Form.Label>
                                                        <Form.Select
                                                            name="industry"
                                                            value={formData.industry}
                                                            onChange={handleChange}
                                                            style={inputStyle}
                                                        >
                                                            {industryOptions.map(opt => (
                                                                <option key={opt.value} value={opt.value} style={{ background: '#1e293b' }}>{opt.label}</option>
                                                            ))}
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3" controlId="company_size">
                                                        <Form.Label style={labelStyle}>{t('company_size') || 'Company Size'}</Form.Label>
                                                        <Form.Select
                                                            name="company_size"
                                                            value={formData.company_size}
                                                            onChange={handleChange}
                                                            style={inputStyle}
                                                        >
                                                            {companySizeOptions.map(opt => (
                                                                <option key={opt.value} value={opt.value} style={{ background: '#1e293b' }}>{opt.label}</option>
                                                            ))}
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3" controlId="business_phone">
                                                        <Form.Label style={labelStyle}>{t('business_phone') || 'Business Phone'}</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="business_phone"
                                                            placeholder={"business_phone_placeholder" || '+27 12 345 6789'}
                                                            value={formData.business_phone}
                                                            onChange={handleChange}
                                                            style={inputStyle}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <Form.Group className="mb-3" controlId="business_address">
                                                <Form.Label style={labelStyle}>{t('business_address') || 'Business Address'}</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={2}
                                                    name="business_address"
                                                    placeholder={t('business_address_placeholder') || 'Enter your business address'}
                                                    value={formData.business_address}
                                                    onChange={handleChange}
                                                    style={inputStyle}
                                                />
                                            </Form.Group>

                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3" controlId="country">
                                                        <Form.Label style={labelStyle}>{t('country') || 'Country'}</Form.Label>
                                                        <Form.Select
                                                            name="country"
                                                            value={formData.country}
                                                            onChange={handleChange}
                                                            style={inputStyle}
                                                        >
                                                            {countryOptions.map(opt => (
                                                                <option key={opt.value} value={opt.value} style={{ background: '#1e293b' }}>{opt.label}</option>
                                                            ))}
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3" controlId="currency">
                                                        <Form.Label style={labelStyle}>{t('currency') || 'Currency'}</Form.Label>
                                                        <Form.Select
                                                            name="currency"
                                                            value={formData.currency}
                                                            onChange={handleChange}
                                                            style={inputStyle}
                                                        >
                                                            {currencyOptions.map(opt => (
                                                                <option key={opt.value} value={opt.value} style={{ background: '#1e293b' }}>{opt.label}</option>
                                                            ))}
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3" controlId="registration_number">
                                                        <Form.Label style={labelStyle}>{t('registration_number') || 'Registration Number'}</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="registration_number"
                                                            placeholder={t('registration_number_placeholder') || 'e.g., 2021/123456/07'}
                                                            value={formData.registration_number}
                                                            onChange={handleChange}
                                                            style={inputStyle}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3" controlId="tax_id">
                                                        <Form.Label style={labelStyle}>{t('tax_id') || 'Tax ID / VAT Number'}</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="tax_id"
                                                            placeholder={t('tax_id_placeholder') || 'e.g., 1234567890'}
                                                            value={formData.tax_id}
                                                            onChange={handleChange}
                                                            style={inputStyle}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <Form.Group className="mb-3" controlId="website">
                                                <Form.Label style={labelStyle}>{t('website') || 'Website'}</Form.Label>
                                                <Form.Control
                                                    type="url"
                                                    name="website"
                                                    placeholder={t('website_placeholder') || 'https://www.example.com'}
                                                    value={formData.website}
                                                    onChange={handleChange}
                                                    style={inputStyle}
                                                />
                                            </Form.Group>

                                            <Form.Group className="mb-4" controlId="business_description">
                                                <Form.Label style={labelStyle}>{t('business_description') || 'Business Description'}</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={3}
                                                    name="business_description"
                                                    placeholder={t('business_description_placeholder') || 'Tell us about your business...'}
                                                    value={formData.business_description}
                                                    onChange={handleChange}
                                                    style={inputStyle}
                                                />
                                            </Form.Group>

                                            <div className="d-flex justify-content-between">
                                                <Button variant="light" type="button" className="btn-back" onClick={handleBack}>
                                                    {t('back')}
                                                </Button>
                                                <Button variant="primary" type="button" className="btn-next" onClick={handleNext}>
                                                    {t('next_step')} {t('preferences') || 'Preferences'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {activeStep === 2 && (
                                        <div>
                                            <div className="section-title">
                                                {t('preferences') || 'Preferences'}
                                            </div>

                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3" controlId="country">
                                                        <Form.Label style={labelStyle}>{t('country') || 'Country'}</Form.Label>
                                                        <Form.Select
                                                            name="country"
                                                            value={formData.country}
                                                            onChange={handleChange}
                                                            style={inputStyle}
                                                        >
                                                            {countryOptions.map(opt => (
                                                                <option key={opt.value} value={opt.value} style={{ background: '#1e293b' }}>{opt.label}</option>
                                                            ))}
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3" controlId="currency">
                                                        <Form.Label style={labelStyle}>{t('currency') || 'Currency'}</Form.Label>
                                                        <Form.Select
                                                            name="currency"
                                                            value={formData.currency}
                                                            onChange={handleChange}
                                                            style={inputStyle}
                                                        >
                                                            {currencyOptions.map(opt => (
                                                                <option key={opt.value} value={opt.value} style={{ background: '#1e293b' }}>{opt.label}</option>
                                                            ))}
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3" controlId="company_size">
                                                        <Form.Label style={labelStyle}>{t('company_size') || 'Company Size'}</Form.Label>
                                                        <Form.Select
                                                            name="company_size"
                                                            value={formData.company_size}
                                                            onChange={handleChange}
                                                            style={inputStyle}
                                                        >
                                                            {companySizeOptions.map(opt => (
                                                                <option key={opt.value} value={opt.value} style={{ background: '#1e293b' }}>{opt.label}</option>
                                                            ))}
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3" controlId="website">
                                                        <Form.Label style={labelStyle}>{t('website') || 'Website'}</Form.Label>
                                                        <Form.Control
                                                            type="url"
                                                            name="website"
                                                            placeholder={t('website_placeholder') || 'https://www.example.com'}
                                                            value={formData.website}
                                                            onChange={handleChange}
                                                            style={inputStyle}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <div className="d-flex justify-content-between">
                                                <Button variant="light" type="button" className="btn-back" onClick={handleBack}>
                                                    {t('back')}
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    type="submit"
                                                    className="btn-submit"
                                                    disabled={loading || !passwordStrength.canProceed}
                                                >
                                                    {loading ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                            {t('register_creating')}
                                                        </>
                                                    ) : t('register') || 'Register'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </Form>

                                {/* Honeypot field for bot protection - hidden from users */}
                                <div style={{ display: 'none' }}>
                                    <input
                                        type="text"
                                        name="honeypot"
                                        value={formData.honeypot}
                                        onChange={handleChange}
                                        tabIndex={-1}
                                        autoComplete="off"
                                    />
                                </div>
                            </Card.Body>
                        </Card>
                        <p className="text-center mt-4 text-muted small">
                            {t('already_have_account')} <Button variant="link" className="p-0 small fw-bold text-decoration-none" onClick={() => navigate('/login')}>{t('sign_in') || 'Sign In'}</Button>
                        </p>
                    </Col>
                </Row>
            </Container>
            <style dangerouslySetInnerHTML={{
                __html: `
                    .register-page {
                        min-height: 100vh;
                        background: radial-gradient(1200px 400px at 0% 100%, rgba(236, 72, 153, 0.12) 0%, transparent 60%), linear-gradient(180deg, #0b1224 0%, #0f172a 100%);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 40px 0;
                    }
                    .register-card {
                        border-radius: 24px;
                        background: rgba(30, 41, 59, 0.72);
                        backdrop-filter: blur(12px);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        box-shadow: 0 20px 40px rgba(2, 6, 23, 0.4);
                    }
                    .section-title {
                        color: #fff;
                        font-size: 1.125rem;
                        font-weight: 600;
                        margin-bottom: 1.5rem;
                        padding-bottom: 0.5rem;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    .stepper {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 12px;
                        align-items: center;
                        justify-items: center;
                        padding: 0 12px;
                    }
                    .step {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        opacity: 0.6;
                        transform: translateY(0);
                        transition: all 0.3s ease;
                    }
                    .step.active { opacity: 1; transform: translateY(-1px); }
                    .step .circle {
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 700;
                        color: #fff;
                        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
                    }
                    .step .label {
                        color: #cbd5e1;
                        font-size: 0.85rem;
                        font-weight: 600;
                    }
                    .btn-next, .btn-submit, .btn-back {
                        border-radius: 12px;
                        padding: 12px 20px;
                        font-weight: 700;
                    }
                    .btn-next {
                        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                        border: none;
                    }
                    .btn-next:hover { filter: brightness(1.05); }
                    .btn-submit {
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        border: none;
                    }
                    .btn-submit:hover { filter: brightness(1.05); }
                    .btn-back { background: rgba(148, 163, 184, 0.15); border: none; color: #cbd5e1; }
                    @media (max-width: 767.98px) {
                        .register-card { margin: 0 12px; }
                        .stepper .label { display: none; }
                    }
                `
            }} />
        </div>
    );
};

export default Register;
