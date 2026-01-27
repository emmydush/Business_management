import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import { FiUser, FiMail, FiPhone, FiMapPin, FiGlobe, FiDollarSign, FiPercent, FiSave, FiImage } from 'react-icons/fi';
import { settingsAPI, getImageUrl } from '../services/api';
import toast from 'react-hot-toast';

const CompanyProfile = () => {
    const [profile, setProfile] = useState({
        company_name: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        logo_url: '',
        tax_rate: '',
        currency: 'USD'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await settingsAPI.getCompanyProfile();
            setProfile(response.data.company_profile);
            setError(null);
        } catch (err) {
            setError('Failed to fetch company profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await settingsAPI.updateCompanyProfile(profile);
            toast.success('Company profile updated successfully!');
            // Update currency context if currency changed
            window.dispatchEvent(new Event('currencyUpdate'));
        } catch (error) {
            toast.error('Failed to update company profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <Container fluid className="py-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Company Profile</h2>
                    <p className="text-muted mb-0">Manage your company information and settings</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-secondary" className="d-flex align-items-center" onClick={fetchProfile}>
                        <FiUser className="me-2" /> Refresh
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row>
                <Col lg={8}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Company Information</h5>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Company Name *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="company_name"
                                                value={profile.company_name}
                                                onChange={handleChange}
                                                placeholder="Enter company name"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Email</Form.Label>
                                            <Form.Control
                                                type="email"
                                                name="email"
                                                value={profile.email}
                                                onChange={handleChange}
                                                placeholder="Enter company email"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Phone</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                name="phone"
                                                value={profile.phone}
                                                onChange={handleChange}
                                                placeholder="Enter company phone"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Website</Form.Label>
                                            <Form.Control
                                                type="url"
                                                name="website"
                                                value={profile.website}
                                                onChange={handleChange}
                                                placeholder="https://example.com"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Address</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                name="address"
                                                value={profile.address}
                                                onChange={handleChange}
                                                placeholder="Enter company address"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Currency</Form.Label>
                                            <Form.Select
                                                name="currency"
                                                value={profile.currency}
                                                onChange={handleChange}
                                            >
                                                <option value="USD">US Dollar (USD)</option>
                                                <option value="EUR">Euro (EUR)</option>
                                                <option value="GBP">British Pound (GBP)</option>
                                                <option value="RWF">Rwandan Franc (RWF)</option>
                                                <option value="KES">Kenyan Shilling (KES)</option>
                                                <option value="TZS">Tanzanian Shilling (TZS)</option>
                                                <option value="UGX">Ugandan Shilling (UGX)</option>
                                                <option value="BIF">Burundian Franc (BIF)</option>
                                                <option value="CDF">Congolese Franc (CDF)</option>
                                                <option value="ZAR">South African Rand (ZAR)</option>
                                                <option value="NGN">Nigerian Naira (NGN)</option>
                                                <option value="GHS">Ghanaian Cedi (GHS)</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Tax Rate (%)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                name="tax_rate"
                                                value={profile.tax_rate}
                                                onChange={handleChange}
                                                placeholder="Enter tax rate"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Logo URL</Form.Label>
                                            <Form.Control
                                                type="url"
                                                name="logo_url"
                                                value={profile.logo_url}
                                                onChange={handleChange}
                                                placeholder="https://example.com/logo.png"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <div className="d-flex justify-content-end mt-4">
                                    <Button
                                        variant="primary"
                                        type="submit"
                                        disabled={saving}
                                        className="d-flex align-items-center"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">Saving...</span>
                                                </div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <FiSave className="me-2" /> Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4}>
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Company Preview</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="text-center mb-4">
                                {profile.logo_url ? (
                                    <img
                                        src={profile.logo_url ? `${window.location.origin}${profile.logo_url}` : ''}
                                        alt="Company Logo"
                                        className="img-fluid rounded mb-3"
                                        style={{ maxHeight: '100px' }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.style.display = 'none';
                                            const nextSibling = e.target.nextSibling;
                                            if (nextSibling) nextSibling.style.display = 'block';
                                        }}
                                    />
                                ) : (
                                    <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ height: '100px', width: '100px' }}>
                                        <FiImage className="text-muted" size={40} />
                                    </div>
                                )}
                                <h4 className="fw-bold text-dark">{profile.company_name || 'Company Name'}</h4>
                                <p className="text-muted mb-1">{profile.address || 'Company Address'}</p>
                                <p className="text-muted mb-0">{profile.phone || 'Phone Number'}</p>
                            </div>

                            <div className="border-top pt-3">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Email:</span>
                                    <span className="fw-bold">{profile.email || 'N/A'}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Website:</span>
                                    <span className="fw-bold">{profile.website || 'N/A'}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Currency:</span>
                                    <span className="fw-bold">{profile.currency}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted">Tax Rate:</span>
                                    <span className="fw-bold">{profile.tax_rate || '0'}%</span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Information</h5>
                        </Card.Header>
                        <Card.Body>
                            <p className="small text-muted">
                                Update your company profile to reflect your business information accurately.
                                This information will be used across the application for invoices, reports, and communications.
                            </p>
                            <div className="d-flex align-items-center text-success">
                                <Badge bg="success" className="me-2">Active</Badge>
                                <span className="small">Profile is up to date</span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default CompanyProfile;
