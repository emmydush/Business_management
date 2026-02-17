import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import PasswordStrengthIndicator, { usePasswordStrength } from './PasswordStrengthIndicator';
import { useI18n } from '../i18n/I18nProvider';
import './auth/AuthModal.css';

const BusinessRegistrationModal = ({ show, onHide, onSwitchToLogin }) => {
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
        role: 'admin'
    });
    const [profileFile, setProfileFile] = useState(null);
    const [profilePreview, setProfilePreview] = useState(null);
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileFile(file);
            setProfilePreview(URL.createObjectURL(file));
        } else {
            setProfileFile(null);
            setProfilePreview(null);
        }
    };

    // Validate current step before proceeding
    const validateStep = (step) => {
        if (step === 0) {
            // Validate user fields
            if (!formData.first_name || !formData.last_name || !formData.username || 
                !formData.email || !formData.password || !formData.confirmPassword) {
                toast.error(t('fill_required_fields') || 'Please fill in all required fields', {
                    duration: 4000
                });
                return false;
            }
            if (formData.password !== formData.confirmPassword) {
                toast.error(t('passwords_not_match') || 'Passwords do not match', {
                    duration: 4000
                });
                return false;
            }
            if (!passwordStrength.canProceed) {
                toast.error(t('password_too_weak') || 'Please create a stronger password', {
                    duration: 4000
                });
                return false;
            }
        } else if (step === 1) {
            // Validate business fields
            if (!formData.business_name) {
                toast.error(t('business_name_required') || 'Business name is required', {
                    duration: 4000
                });
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(activeStep)) {
            setActiveStep(activeStep + 1);
        }
    };

    const handleBack = () => {
        setActiveStep(activeStep - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate password match
        if (formData.password !== formData.confirmPassword) {
            toast.error(t('passwords_not_match') || 'Passwords do not match', {
                duration: 4000
            });
            return;
        }

        // Validate password strength
        if (!passwordStrength.canProceed) {
            toast.error(t('password_too_weak'), {
                duration: 4000
            });
            return;
        }

        // Validate business name
        if (!formData.business_name) {
            toast.error(t('business_name_required') || 'Business name is required', {
                duration: 4000
            });
            return;
        }

        setLoading(true);

        try {
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
                role: formData.role
            };

            // Upload profile picture if provided
            if (profileFile) {
                const uploadRes = await authAPI.uploadProfilePicture(profileFile);
                registrationData.profile_picture = uploadRes.data.url;
            }

            await authAPI.register(registrationData);

            toast.success(t('register_success_pending') || 'Registration successful! Your account is pending approval.', {
                duration: 3000,
                icon: '⏳',
            });

            onHide(); // Close modal

            if (onSwitchToLogin) {
                onSwitchToLogin();
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || t('register_failed');
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered className="auth-modal">
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">{t('register_business_title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                {/* Step Indicators */}
                <div className="mb-4">
                    <div className="d-flex justify-content-between">
                        <div className={`text-center ${activeStep >= 0 ? 'text-primary' : 'text-muted'}`}>
                            <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${activeStep >= 0 ? 'bg-primary text-white' : 'bg-light'}`} style={{width: '32px', height: '32px'}}>
                                {activeStep > 0 ? '✓' : '1'}
                            </div>
                            <div className="small mt-1">{t('step1_account') || 'Account'}</div>
                        </div>
                        <div className={`text-center ${activeStep >= 1 ? 'text-primary' : 'text-muted'}`}>
                            <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${activeStep >= 1 ? 'bg-primary text-white' : 'bg-light'}`} style={{width: '32px', height: '32px'}}>
                                2
                            </div>
                            <div className="small mt-1">{t('step2_business') || 'Business'}</div>
                        </div>
                    </div>
                </div>

                <Form onSubmit={handleSubmit}>
                    {/* Step 1: Account Information */}
                    {activeStep === 0 && (
                        <>
                            <Form.Group className="mb-3" controlId="business_name">
                                <Form.Label className="fw-semibold small">{t('business_name_label')} *</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="business_name"
                                    placeholder={t('business_name_placeholder')}
                                    value={formData.business_name}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="first_name">
                                        <Form.Label className="fw-semibold small">{t('first_name')} *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="first_name"
                                            placeholder={t('first_name')}
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="last_name">
                                        <Form.Label className="fw-semibold small">{t('last_name')} *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="last_name"
                                            placeholder={t('last_name')}
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3" controlId="username">
                                <Form.Label className="fw-semibold small">{t('username_label')} *</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="username"
                                    placeholder={t('username_placeholder')}
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="email">
                                <Form.Label className="fw-semibold small">{t('email_label')} *</Form.Label>
                                <Form.Control
                                    type="email"
                                    name="email"
                                    placeholder={t('email_placeholder')}
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="phone">
                                <Form.Label className="fw-semibold small">{t('phone_label')}</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="phone"
                                    placeholder={t('phone_placeholder')}
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="profile_picture">
                                <Form.Label className="fw-semibold small">{t('profile_picture_label')}</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                {profilePreview && (
                                    <div className="mt-2 text-center">
                                        <img src={profilePreview} alt="Preview" className="rounded-circle border border-2 border-primary" width={80} height={80} />
                                    </div>
                                )}
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="password">
                                <Form.Label className="fw-semibold small">{t('login_password')} *</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="password"
                                    placeholder={t('login_password_placeholder')}
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <PasswordStrengthIndicator password={formData.password} />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="confirmPassword">
                                <Form.Label className="fw-semibold small">{t('confirm_password_label')} *</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="confirmPassword"
                                    placeholder={t('confirm_password_placeholder') || 'Confirm your password'}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </>
                    )}

                    {/* Step 2: Business Information */}
                    {activeStep === 1 && (
                        <>
                            <h6 className="fw-bold mb-3">{t('business_details_title') || 'Business Details'}</h6>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="business_phone">
                                        <Form.Label className="fw-semibold small">{t('business_phone_label') || 'Business Phone'}</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="business_phone"
                                            placeholder={t('business_phone_placeholder') || 'Enter business phone'}
                                            value={formData.business_phone}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="industry">
                                        <Form.Label className="fw-semibold small">{t('industry_label') || 'Industry'}</Form.Label>
                                        <Form.Select
                                            name="industry"
                                            value={formData.industry}
                                            onChange={handleChange}
                                        >
                                            {industryOptions.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="company_size">
                                        <Form.Label className="fw-semibold small">{t('company_size_label') || 'Company Size'}</Form.Label>
                                        <Form.Select
                                            name="company_size"
                                            value={formData.company_size}
                                            onChange={handleChange}
                                        >
                                            {companySizeOptions.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="business_type">
                                        <Form.Label className="fw-semibold small">{t('business_type_label') || 'Business Type'}</Form.Label>
                                        <Form.Select
                                            name="business_type"
                                            value={formData.business_type}
                                            onChange={handleChange}
                                        >
                                            {businessTypeOptions.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3" controlId="business_address">
                                <Form.Label className="fw-semibold small">{t('business_address_label') || 'Business Address'}</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    name="business_address"
                                    placeholder={t('business_address_placeholder') || 'Enter business address'}
                                    value={formData.business_address}
                                    onChange={handleChange}
                                />
                            </Form.Group>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="registration_number">
                                        <Form.Label className="fw-semibold small">{t('registration_number_label') || 'Registration Number'}</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="registration_number"
                                            placeholder={t('registration_number_placeholder') || 'Enter registration number'}
                                            value={formData.registration_number}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="tax_id">
                                        <Form.Label className="fw-semibold small">{t('tax_id_label') || 'Tax ID'}</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="tax_id"
                                            placeholder={t('tax_id_placeholder') || 'Enter tax ID'}
                                            value={formData.tax_id}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="country">
                                        <Form.Label className="fw-semibold small">{t('country_label') || 'Country'}</Form.Label>
                                        <Form.Select
                                            name="country"
                                            value={formData.country}
                                            onChange={handleChange}
                                        >
                                            {countryOptions.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="currency">
                                        <Form.Label className="fw-semibold small">{t('currency_label') || 'Currency'}</Form.Label>
                                        <Form.Select
                                            name="currency"
                                            value={formData.currency}
                                            onChange={handleChange}
                                        >
                                            {currencyOptions.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3" controlId="website">
                                <Form.Label className="fw-semibold small">{t('website_label') || 'Website'}</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="website"
                                    placeholder={t('website_placeholder') || 'Enter website URL'}
                                    value={formData.website}
                                    onChange={handleChange}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="business_description">
                                <Form.Label className="fw-semibold small">{t('business_description_label') || 'Business Description'}</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="business_description"
                                    placeholder={t('business_description_placeholder') || 'Describe your business'}
                                    value={formData.business_description}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </>
                    )}

                    {/* Navigation Buttons */}
                    <div className="d-flex gap-2 mt-4">
                        {activeStep > 0 && (
                            <Button
                                variant="outline-secondary"
                                type="button"
                                className="flex-fill"
                                onClick={handleBack}
                            >
                                {t('back_button') || 'Back'}
                            </Button>
                        )}
                        {activeStep < 1 ? (
                            <Button
                                variant="primary"
                                type="button"
                                className="flex-fill"
                                onClick={handleNext}
                            >
                                {t('next_button') || 'Next'}
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                type="submit"
                                className="flex-fill"
                                disabled={loading || !passwordStrength.canProceed}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        {t('register_creating')}
                                    </>
                                ) : t('register_button')}
                            </Button>
                        )}
                    </div>
                </Form>
                {onSwitchToLogin && (
                    <div className="text-center mt-3">
                        <p className="text-muted small">
                            {t('already_have_account')}{' '}
                            <Button variant="link" className="p-0 fw-bold text-decoration-none small" onClick={onSwitchToLogin}>
                                {t('login_button')}
                            </Button>
                        </p>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default BusinessRegistrationModal;
