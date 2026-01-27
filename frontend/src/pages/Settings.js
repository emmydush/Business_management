import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tabs, Tab, Form, Button } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { settingsAPI } from '../services/api';
import { useAuth } from '../components/auth/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    company_name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    logo_url: '',
    tax_rate: 0,
    currency: 'RWF',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
    try {
      const response = await settingsAPI.getCompanyProfile();
      console.log('Company profile response:', response); // Debug log
      if (response.data && response.data.company_profile) {
        setSettings(response.data.company_profile);
      }
    } catch (error) {
      console.error('Error fetching company profile:', error);
      console.error('Error details:', error.response || error.message || error);

      // Provide more specific error messages based on status code
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Authentication required. Please log in to access company profile.');
        } else if (error.response.status === 403) {
          toast.error('Access denied. You do not have permission to access company profile settings.');
        } else {
          toast.error(`Failed to load company profile: ${error.response.status} ${error.response.statusText}`);
        }
      } else {
        toast.error('Network error. Please check your connection and try again.');
      }

      // Set default values if API fails
      setSettings({
        company_name: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        logo_url: '',
        tax_rate: 0,
        currency: 'RWF',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await settingsAPI.updateCompanyProfile(settings);
      console.log('Update company profile response:', response); // Debug log
      if (response.data && response.data.company_profile) {
        setSettings(response.data.company_profile);
      }
      window.dispatchEvent(new Event('currencyUpdate'));
      toast.success('Company profile updated successfully!');
    } catch (error) {
      console.error('Error updating company profile:', error);
      console.error('Error details:', error.response || error.message || error);

      // Provide more specific error messages based on status code
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Authentication required. Please log in to update company profile.');
        } else if (error.response.status === 403) {
          toast.error('Access denied. You do not have permission to update company profile.');
        } else {
          toast.error(`Failed to update company profile: ${error.response.status} ${error.response.statusText}`);
        }
      } else {
        toast.error('Network error. Please check your connection and try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid>
      <h1 className="mb-4">System Configuration & Security</h1>

      <Row>
        <Col lg={12}>
          <Card>
            <Card.Body>
              <Tabs defaultActiveKey="company" id="settings-tabs" className="mb-3">
                <Tab eventKey="company" title="Company Profile">
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Company Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="company_name"
                            value={settings.company_name}
                            onChange={handleChange}
                            placeholder="Enter company name"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={settings.email}
                            onChange={handleChange}
                            placeholder="Enter company email"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="address"
                        value={settings.address}
                        onChange={handleChange}
                        placeholder="Enter company address"
                      />
                    </Form.Group>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone</Form.Label>
                          <Form.Control
                            type="text"
                            name="phone"
                            value={settings.phone}
                            onChange={handleChange}
                            placeholder="Enter phone number"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Website</Form.Label>
                          <Form.Control
                            type="text"
                            name="website"
                            value={settings.website}
                            onChange={handleChange}
                            placeholder="Enter website URL"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Currency</Form.Label>
                          <Form.Select
                            name="currency"
                            value={settings.currency}
                            onChange={handleChange}
                          >
                            <optgroup label="East African Community">
                              <option value="RWF">RWF - Rwandan Franc</option>
                              <option value="KES">KES - Kenyan Shilling</option>
                              <option value="TZS">TZS - Tanzanian Shilling</option>
                              <option value="UGX">UGX - Ugandan Shilling</option>
                              <option value="BIF">BIF - Burundian Franc</option>
                            </optgroup>
                            <optgroup label="Other African Currencies">
                              <option value="CDF">CDF - Congolese Franc (DRC)</option>
                              <option value="ZAR">ZAR - South African Rand</option>
                              <option value="NGN">NGN - Nigerian Naira</option>
                              <option value="GHS">GHS - Ghanaian Cedi</option>
                            </optgroup>
                            <optgroup label="Major Currencies">
                              <option value="USD">USD - US Dollar</option>
                              <option value="EUR">EUR - Euro</option>
                              <option value="GBP">GBP - British Pound</option>
                            </optgroup>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Tax Rate (%)</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            name="tax_rate"
                            value={settings.tax_rate}
                            onChange={handleChange}
                            placeholder="Enter tax rate"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Language</Form.Label>
                          <Form.Select
                            name="language"
                            value="en"
                            onChange={handleChange}
                            disabled
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Button variant="primary" type="submit" disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Company Profile'}
                    </Button>
                  </Form>
                </Tab>

                <Tab eventKey="security" title="Security & Audit">
                  <Card className="mb-3">
                    <Card.Header>
                      <h6>Audit Logs</h6>
                    </Card.Header>
                    <Card.Body>
                      <p>Audit logs track all user activities and system changes for security and compliance purposes.</p>
                      <Button variant="outline-primary" className="me-2">View Audit Logs</Button>
                      <Button variant="outline-secondary">Export Logs</Button>
                    </Card.Body>
                  </Card>

                  {user?.role === 'superadmin' && (
                    <Card className="mb-3">
                      <Card.Header>
                        <h6>Data Encryption</h6>
                      </Card.Header>
                      <Card.Body>
                        <p>Manage encryption settings for sensitive data at rest and in transit.</p>
                        <Form.Check
                          type="switch"
                          id="dataEncryption"
                          label="Enable Data Encryption"
                          defaultChecked
                        />
                      </Card.Body>
                    </Card>
                  )}
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Settings;
