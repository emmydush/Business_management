import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { settingsAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const SuperAdminEmailConfig = () => {
  const [emailSettings, setEmailSettings] = useState({
    smtp_host: '',
    smtp_port: '',
    smtp_username: '',
    smtp_password: '',
    sender_email: '',
    sender_name: '',
    encryption: 'tls',
    enable_ssl: false,
    enable_tls: true,
    timeout: 30,
    email_enabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load existing email settings
  useEffect(() => {
    fetchEmailSettings();
  }, []);

  const fetchEmailSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getEmailSettings();
      if (response.data && response.data.email_settings) {
        setEmailSettings(prev => ({
          ...prev,
          smtp_host: response.data.email_settings.email_smtp_host || '',
          smtp_port: response.data.email_settings.email_smtp_port || '',
          smtp_username: response.data.email_settings.email_smtp_username || '',
          smtp_password: response.data.email_settings.email_smtp_password || '',
          sender_email: response.data.email_settings.email_sender_email || '',
          sender_name: response.data.email_settings.email_sender_name || '',
          encryption: response.data.email_settings.email_encryption || 'tls',
          enable_ssl: response.data.email_settings.email_enable_ssl === 'true',
          enable_tls: response.data.email_settings.email_enable_tls !== 'false',
          timeout: response.data.email_settings.email_timeout ? parseInt(response.data.email_settings.email_timeout) : 30,
          email_enabled: response.data.email_settings.email_enabled === 'true'
        }));
      }
    } catch (err) {
      setError('Failed to load email settings');
      console.error('Error loading email settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const settingsToSend = {
        email_smtp_host: emailSettings.smtp_host,
        email_smtp_port: emailSettings.smtp_port,
        email_smtp_username: emailSettings.smtp_username,
        email_smtp_password: emailSettings.smtp_password,
        email_sender_email: emailSettings.sender_email,
        email_sender_name: emailSettings.sender_name,
        email_encryption: emailSettings.encryption,
        email_enable_ssl: emailSettings.enable_ssl,
        email_enable_tls: emailSettings.enable_tls,
        email_timeout: emailSettings.timeout,
        email_enabled: emailSettings.email_enabled
      };
      
      await settingsAPI.updateEmailSettings(settingsToSend);
      toast.success('Email settings updated successfully!');
    } catch (error) {
      setError('Failed to update email settings');
      toast.error(error.response?.data?.error || 'Failed to update email settings');
      console.error('Error updating email settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const testEmailConnection = async () => {
    setSaving(true);
    try {
      const testData = {
        test_email: emailSettings.sender_email || 'test@example.com'
      };
      
      await settingsAPI.testEmailSettings(testData);
      toast.success('Email connection test successful!');
    } catch (error) {
      setError('Email connection test failed');
      toast.error(error.response?.data?.error || 'Email connection test failed');
      console.error('Error testing email connection:', error);
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Email Configuration</h2>
          <p className="text-muted mb-0">Configure SMTP settings for system notifications and communications</p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold d-flex align-items-center">
                SMTP Server Configuration
              </h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row className="g-3">
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">SMTP Host</Form.Label>
                      <Form.Control
                        type="text"
                        name="smtp_host"
                        value={emailSettings.smtp_host}
                        onChange={handleChange}
                        placeholder="smtp.gmail.com, smtp.office365.com, etc."
                      />
                      <Form.Text className="text-muted">
                        Enter your email service provider's SMTP server address
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">SMTP Port</Form.Label>
                      <Form.Control
                        type="number"
                        name="smtp_port"
                        value={emailSettings.smtp_port}
                        onChange={handleChange}
                        placeholder="587, 465, etc."
                      />
                      <Form.Text className="text-muted">
                        Common ports: 587 (TLS), 465 (SSL)
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Username</Form.Label>
                      <Form.Control
                        type="text"
                        name="smtp_username"
                        value={emailSettings.smtp_username}
                        onChange={handleChange}
                        placeholder="your-email@domain.com"
                      />
                      <Form.Text className="text-muted">
                        Username for authenticating with the SMTP server
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="smtp_password"
                        value={emailSettings.smtp_password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                      />
                      <Form.Text className="text-muted">
                        App-specific password or regular password depending on your email provider
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Sender Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="sender_email"
                        value={emailSettings.sender_email}
                        onChange={handleChange}
                        placeholder="noreply@yourcompany.com"
                      />
                      <Form.Text className="text-muted">
                        Email address to use as sender for system emails
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Sender Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="sender_name"
                        value={emailSettings.sender_name}
                        onChange={handleChange}
                        placeholder="Your Company Name"
                      />
                      <Form.Text className="text-muted">
                        Display name for outgoing emails
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Encryption Method</Form.Label>
                      <Form.Select
                        name="encryption"
                        value={emailSettings.encryption}
                        onChange={handleChange}
                      >
                        <option value="none">None</option>
                        <option value="ssl">SSL</option>
                        <option value="tls">TLS</option>
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Select the encryption method for secure email transmission
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Timeout (seconds)</Form.Label>
                      <Form.Control
                        type="number"
                        name="timeout"
                        value={emailSettings.timeout}
                        onChange={handleChange}
                        min="1"
                        max="120"
                      />
                      <Form.Text className="text-muted">
                        Connection timeout for email operations
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-between mt-4">
                  <Button 
                    variant="outline-secondary" 
                    type="button"
                    onClick={testEmailConnection}
                    disabled={saving}
                    className="d-flex align-items-center"
                  >
                    Test Connection
                  </Button>
                  
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={saving}
                    className="d-flex align-items-center"
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        Save Email Settings
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mt-4">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold">Email Templates</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted mb-3">
                Customize email templates for various system notifications
              </p>
              
              <div className="d-grid gap-2">
                <Button variant="outline-primary" className="text-start">
                  <div className="fw-bold">Welcome Email Template</div>
                  <small className="text-muted">Template sent to new users upon registration</small>
                </Button>
                
                <Button variant="outline-primary" className="text-start">
                  <div className="fw-bold">Password Reset Template</div>
                  <small className="text-muted">Template for password reset requests</small>
                </Button>
                
                <Button variant="outline-primary" className="text-start">
                  <div className="fw-bold">Notification Template</div>
                  <small className="text-muted">Template for system notifications</small>
                </Button>
                
                <Button variant="outline-primary" className="text-start">
                  <div className="fw-bold">Report Template</div>
                  <small className="text-muted">Template for automated reports</small>
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold">Configuration Guide</h5>
            </Card.Header>
            <Card.Body>
              <h6 className="fw-bold text-primary mb-3">Common SMTP Settings</h6>
              
              <div className="mb-3">
                <h6 className="text-muted small fw-bold">Gmail</h6>
                <ul className="small text-muted">
                  <li>SMTP Host: smtp.gmail.com</li>
                  <li>Port: 587</li>
                  <li>Encryption: TLS</li>
                  <li>Use App Password for 2FA accounts</li>
                </ul>
              </div>
              
              <div className="mb-3">
                <h6 className="text-muted small fw-bold">Outlook/Office 365</h6>
                <ul className="small text-muted">
                  <li>SMTP Host: smtp-mail.outlook.com</li>
                  <li>Port: 587</li>
                  <li>Encryption: TLS</li>
                </ul>
              </div>
              
              <div className="mb-3">
                <h6 className="text-muted small fw-bold">Yahoo Mail</h6>
                <ul className="small text-muted">
                  <li>SMTP Host: smtp.mail.yahoo.com</li>
                  <li>Port: 587</li>
                  <li>Encryption: TLS</li>
                </ul>
              </div>
              
              <div className="mt-4 p-3 bg-light rounded">
                <h6 className="fw-bold small mb-2">Important Notes</h6>
                <ul className="small text-muted">
                  <li>Enable "Less secure app access" or use app-specific passwords</li>
                  <li>Some providers require two-factor authentication setup</li>
                  <li>Test connection before saving changes</li>
                  <li>Store credentials securely and avoid plain text storage</li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SuperAdminEmailConfig;