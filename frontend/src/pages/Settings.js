import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tabs, Tab, Form, Button, Badge, Alert } from 'react-bootstrap';
import { FiSettings, FiMail, FiBell, FiFileText, FiShoppingCart, FiSave, FiRefreshCw, FiDownload, FiUpload, FiSearch, FiDatabase, FiShield } from 'react-icons/fi';
import { Table } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { settingsAPI } from '../services/api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Company Profile State
  const [companyProfile, setCompanyProfile] = useState({
    company_name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    logo_url: '',
    tax_rate: 0,
    currency: 'RWF',
    business_type: '',
    registration_number: '',
    fiscal_year_start: '01',
  });

  // Email Settings State
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
    email_enabled: true,
  });
  const [testingEmail, setTestingEmail] = useState(false);

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    order_notifications: true,
    inventory_alerts: true,
    low_stock_alerts: true,
    payment_notifications: true,
    daily_summary: false,
    weekly_report: true,
  });

  // Invoice Settings State
  const [invoiceSettings, setInvoiceSettings] = useState({
    invoice_prefix: 'INV-',
    invoice_next_number: '1001',
    invoice_terms: 'Payment due within 30 days',
    invoice_notes: 'Thank you for your business!',
    auto_send_invoice: false,
    show_tax_breakdown: true,
    show_discount: true,
    default_payment_terms: 30,
  });

  // POS Settings State
  const [posSettings, setPosSettings] = useState({
    receipt_show_logo: true,
    receipt_show_address: true,
    receipt_show_phone: true,
    receipt_show_tax: true,
    receipt_show_barcode: false,
    receipt_footer_message: 'Thank you for shopping with us!',
    default_printer: '',
    auto_open_cash_drawer: false,
  });

  // Tax Settings State
  const [taxSettings, setTaxSettings] = useState({
    enable_tax: true,
    tax_name: 'VAT',
    tax_rate: 18,
    tax_included: false,
    tax_number: '',
    compound_tax: false,
    second_tax_rate: 0,
  });

  // Backup Settings State
  const [backupSettings, setBackupSettings] = useState({
    auto_backup: false,
    backup_frequency: 'daily',
    backup_retention: 30,
    last_backup: null,
    backup_in_progress: false,
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPagination, setAuditPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [auditFilters, setAuditFilters] = useState({ action: '', user_id: '' });

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const fetchAllSettings = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCompanyProfile(),
        fetchEmailSettings(),
        fetchSystemSettings(),
      ]);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyProfile = async () => {
    try {
      const response = await settingsAPI.getCompanyProfile();
      if (response.data && response.data.company_profile) {
        setCompanyProfile(prev => ({ ...prev, ...response.data.company_profile }));
      }
    } catch (error) {
      console.error('Error fetching company profile:', error);
    }
  };

  const fetchEmailSettings = async () => {
    try {
      const response = await settingsAPI.getEmailSettings();
      if (response.data && response.data.email_settings) {
        const settings = response.data.email_settings;
        setEmailSettings({
          smtp_host: settings.email_smtp_host || '',
          smtp_port: settings.email_smtp_port || '',
          smtp_username: settings.email_smtp_username || '',
          smtp_password: settings.email_smtp_password || '',
          sender_email: settings.email_sender_email || '',
          sender_name: settings.email_sender_name || '',
          encryption: settings.email_encryption || 'tls',
          enable_ssl: settings.email_enable_ssl === 'true',
          enable_tls: settings.email_enable_tls === 'true',
          timeout: parseInt(settings.email_timeout) || 30,
          email_enabled: settings.email_enabled === 'true',
        });
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const response = await settingsAPI.getSystemSettings();
      if (response.data && response.data.system_settings) {
        const settings = {};
        response.data.system_settings.forEach(s => {
          settings[s.setting_key] = s.setting_value;
        });

        // Update notification settings
        setNotificationSettings(prev => ({
          ...prev,
          email_notifications: settings.email_notifications === 'true',
          sms_notifications: settings.sms_notifications === 'true',
          order_notifications: settings.order_notifications === 'true',
          inventory_alerts: settings.inventory_alerts === 'true',
          low_stock_alerts: settings.low_stock_alerts === 'true',
          payment_notifications: settings.payment_notifications === 'true',
          daily_summary: settings.daily_summary === 'true',
          weekly_report: settings.weekly_report === 'true',
        }));

        // Update invoice settings
        setInvoiceSettings(prev => ({
          ...prev,
          invoice_prefix: settings.invoice_prefix || 'INV-',
          invoice_next_number: settings.invoice_next_number || '1001',
          invoice_terms: settings.invoice_terms || 'Payment due within 30 days',
          invoice_notes: settings.invoice_notes || 'Thank you for your business!',
          auto_send_invoice: settings.auto_send_invoice === 'true',
          show_tax_breakdown: settings.show_tax_breakdown !== 'false',
          show_discount: settings.show_discount !== 'false',
          default_payment_terms: parseInt(settings.default_payment_terms) || 30,
        }));

        // Update POS settings
        setPosSettings(prev => ({
          ...prev,
          receipt_show_logo: settings.receipt_show_logo !== 'false',
          receipt_show_address: settings.receipt_show_address !== 'false',
          receipt_show_phone: settings.receipt_show_phone !== 'false',
          receipt_show_tax: settings.receipt_show_tax !== 'false',
          receipt_show_barcode: settings.receipt_show_barcode === 'true',
          receipt_footer_message: settings.receipt_footer_message || 'Thank you for shopping with us!',
          default_printer: settings.default_printer || '',
          auto_open_cash_drawer: settings.auto_open_cash_drawer === 'true',
        }));

        // Update tax settings
        setTaxSettings(prev => ({
          ...prev,
          enable_tax: settings.enable_tax !== 'false',
          tax_name: settings.tax_name || 'VAT',
          tax_rate: parseFloat(settings.tax_rate) || 18,
          tax_included: settings.tax_included === 'true',
          tax_number: settings.tax_number || '',
          compound_tax: settings.compound_tax === 'true',
          second_tax_rate: parseFloat(settings.second_tax_rate) || 0,
        }));

        // Update backup settings
        setBackupSettings(prev => ({
          ...prev,
          auto_backup: settings.auto_backup === 'true',
          backup_frequency: settings.backup_frequency || 'daily',
          backup_retention: parseInt(settings.backup_retention) || 30,
          last_backup: settings.last_backup || null,
        }));
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
    }
  };

  // Handle input changes
  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setCompanyProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleEmailChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNotificationChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleInvoiceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInvoiceSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePosChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPosSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTaxChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTaxSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBackupChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBackupSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Save functions
  const handleSaveCompanyProfile = async () => {
    setIsSaving(true);
    try {
      const response = await settingsAPI.updateCompanyProfile(companyProfile);
      window.dispatchEvent(new Event('currencyUpdate'));
      setCompanyProfile(prev => ({ ...prev, ...response.data.company_profile }));
      toast.success('Company profile updated successfully!');
    } catch (error) {
      console.error('Error updating company profile:', error);
      const errorMsg = error.response?.data?.error || 'Failed to update company profile';
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEmailSettings = async () => {
    setIsSaving(true);
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
        email_enabled: emailSettings.email_enabled,
      };
      await settingsAPI.updateEmailSettings(settingsToSend);
      toast.success('Email settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save email settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      await settingsAPI.testEmailSettings({ test_email: emailSettings.sender_email });
      toast.success('Test email sent successfully!');
    } catch (error) {
      toast.error('Failed to send test email');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      await settingsAPI.updateSystemSettings(notificationSettings);
      toast.success('Notification settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveInvoiceSettings = async () => {
    setIsSaving(true);
    try {
      await settingsAPI.updateSystemSettings(invoiceSettings);
      toast.success('Invoice settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save invoice settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePosSettings = async () => {
    setIsSaving(true);
    try {
      await settingsAPI.updateSystemSettings(posSettings);
      toast.success('POS settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save POS settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTaxSettings = async () => {
    setIsSaving(true);
    try {
      await settingsAPI.updateSystemSettings(taxSettings);
      toast.success('Tax settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save tax settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBackupSettings = async () => {
    setIsSaving(true);
    try {
      await settingsAPI.updateSystemSettings({
        auto_backup: backupSettings.auto_backup,
        backup_frequency: backupSettings.backup_frequency,
        backup_retention: backupSettings.backup_retention,
      });
      toast.success('Backup settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save backup settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateBackup = async () => {
    setBackupSettings(prev => ({ ...prev, backup_in_progress: true }));
    try {
      await settingsAPI.createBackup();
      toast.success('Backup created successfully!');
      setBackupSettings(prev => ({ ...prev, last_backup: new Date().toISOString() }));
    } catch (error) {
      toast.error('Failed to create backup');
    } finally {
      setBackupSettings(prev => ({ ...prev, backup_in_progress: false }));
    }
  };

  // Audit Logs functions
  const fetchAuditLogs = async (page = 1) => {
    setAuditLoading(true);
    try {
      const response = await settingsAPI.getAuditLogs({ page, per_page: 20, ...auditFilters });
      if (response.data) {
        setAuditLogs(response.data.audit_logs || []);
        setAuditPagination({
          page: response.data.pagination?.page || 1,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, auditFilters]);

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
      <h1 className="mb-4">System Configuration & Settings</h1>

      <Row>
        <Col lg={12}>
          <Card>
            <Card.Body>
              <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3" id="settings-tabs">
                
                {/* Company Profile Tab */}
                <Tab eventKey="company" title={<span><FiSettings className="me-2" />Company Profile</span>}>
                  <h5 className="mb-3">Company Information</h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Company Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="company_name"
                          value={companyProfile.company_name}
                          onChange={handleCompanyChange}
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
                          value={companyProfile.email}
                          onChange={handleCompanyChange}
                          placeholder="Enter company email"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone</Form.Label>
                        <Form.Control
                          type="text"
                          name="phone"
                          value={companyProfile.phone}
                          onChange={handleCompanyChange}
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
                          value={companyProfile.website}
                          onChange={handleCompanyChange}
                          placeholder="Enter website URL"
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
                      value={companyProfile.address}
                      onChange={handleCompanyChange}
                      placeholder="Enter company address"
                    />
                  </Form.Group>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Business Type</Form.Label>
                        <Form.Select
                          name="business_type"
                          value={companyProfile.business_type || ''}
                          onChange={handleCompanyChange}
                        >
                          <option value="">Select business type</option>
                          <optgroup label="Sole Proprietorship">
                            <option value="sole_proprietor">Sole Proprietor</option>
                            <option value="individual_enterprise">Individual Enterprise</option>
                          </optgroup>
                          <optgroup label="Partnership">
                            <option value="general_partnership">General Partnership</option>
                            <option value="limited_partnership">Limited Partnership (LP)</option>
                          </optgroup>
                          <optgroup label="Private Companies">
                            <option value="private_company">Private Company (Pvt) Ltd</option>
                            <option value="public_company">Public Company (Ltd)</option>
                            <option value="company_limited_by_guarantee">Company Limited by Guarantee</option>
                          </optgroup>
                          <optgroup label="Other Business Types">
                            <option value="nonprofit">Non-Profit Organization</option>
                            <option value="cooperative">Cooperative Society</option>
                            <option value="branch">Foreign Branch</option>
                            <option value="representative_office">Representative Office</option>
                          </optgroup>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Business Registration Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="registration_number"
                          value={companyProfile.registration_number || ''}
                          onChange={handleCompanyChange}
                          placeholder="e.g., 2023/RDB/001234"
                        />
                        <Form.Text className="text-muted">
                          Registration number from company registry (RDB, CIPA, URSB, etc.)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Fiscal Year Start</Form.Label>
                        <Form.Select
                          name="fiscal_year_start"
                          value={companyProfile.fiscal_year_start || '01'}
                          onChange={handleCompanyChange}
                        >
                          <option value="01">January</option>
                          <option value="02">February</option>
                          <option value="03">March</option>
                          <option value="04">April</option>
                          <option value="07">July</option>
                          <option value="10">October</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Currency</Form.Label>
                        <Form.Select
                          name="currency"
                          value={companyProfile.currency}
                          onChange={handleCompanyChange}
                        >
                          <optgroup label="East African Community">
                            <option value="RWF">RWF - Rwandan Franc</option>
                            <option value="KES">KES - Kenyan Shilling</option>
                            <option value="TZS">TZS - Tanzanian Shilling</option>
                            <option value="UGX">UGX - Ugandan Shilling</option>
                            <option value="BIF">BIF - Burundian Franc</option>
                          </optgroup>
                          <optgroup label="Other African">
                            <option value="CDF">CDF - Congolese Franc</option>
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
                          value={companyProfile.tax_rate}
                          onChange={handleCompanyChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Button variant="primary" onClick={handleSaveCompanyProfile} disabled={isSaving}>
                    <FiSave className="me-2" /> {isSaving ? 'Saving...' : 'Save Company Profile'}
                  </Button>
                </Tab>

                {/* Email Settings Tab */}
                <Tab eventKey="email" title={<span><FiMail className="me-2" />Email Settings</span>}>
                  <h5 className="mb-3">SMTP Configuration</h5>
                  <Alert variant="info" className="d-flex align-items-center">
                    <FiBell className="me-2" /> Configure your email server settings to send emails from the system.
                  </Alert>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>SMTP Host</Form.Label>
                        <Form.Control
                          type="text"
                          name="smtp_host"
                          value={emailSettings.smtp_host}
                          onChange={handleEmailChange}
                          placeholder="e.g., smtp.gmail.com"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>SMTP Port</Form.Label>
                        <Form.Control
                          type="number"
                          name="smtp_port"
                          value={emailSettings.smtp_port}
                          onChange={handleEmailChange}
                          placeholder="e.g., 587"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>SMTP Username</Form.Label>
                        <Form.Control
                          type="text"
                          name="smtp_username"
                          value={emailSettings.smtp_username}
                          onChange={handleEmailChange}
                          placeholder="Your email address"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>SMTP Password</Form.Label>
                        <Form.Control
                          type="password"
                          name="smtp_password"
                          value={emailSettings.smtp_password}
                          onChange={handleEmailChange}
                          placeholder="App password"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Sender Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="sender_email"
                          value={emailSettings.sender_email}
                          onChange={handleEmailChange}
                          placeholder="noreply@company.com"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Sender Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="sender_name"
                          value={emailSettings.sender_name}
                          onChange={handleEmailChange}
                          placeholder="Company Name"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Encryption</Form.Label>
                        <Form.Select
                          name="encryption"
                          value={emailSettings.encryption}
                          onChange={handleEmailChange}
                        >
                          <option value="tls">TLS</option>
                          <option value="ssl">SSL</option>
                          <option value="none">None</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Timeout (seconds)</Form.Label>
                        <Form.Control
                          type="number"
                          name="timeout"
                          value={emailSettings.timeout}
                          onChange={handleEmailChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3 d-flex align-items-end">
                        <Form.Check
                          type="switch"
                          name="email_enabled"
                          label="Enable Email"
                          checked={emailSettings.email_enabled}
                          onChange={handleEmailChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="d-flex gap-2">
                    <Button variant="primary" onClick={handleSaveEmailSettings} disabled={isSaving}>
                      <FiSave className="me-2" /> {isSaving ? 'Saving...' : 'Save Email Settings'}
                    </Button>
                    <Button variant="outline-secondary" onClick={handleTestEmail} disabled={testingEmail}>
                      <FiRefreshCw className={`me-2 ${testingEmail ? 'fa-spin' : ''}`} /> 
                      {testingEmail ? 'Testing...' : 'Test Connection'}
                    </Button>
                  </div>
                </Tab>

                {/* Notification Settings Tab */}
                <Tab eventKey="notifications" title={<span><FiBell className="me-2" />Notifications</span>}>
                  <h5 className="mb-3">Notification Preferences</h5>
                  <Row>
                    <Col md={6}>
                      <Card className="mb-3">
                        <Card.Header>Email Notifications</Card.Header>
                        <Card.Body>
                          <Form.Check
                            type="switch"
                            className="mb-2"
                            name="email_notifications"
                            label="Email Notifications"
                            checked={notificationSettings.email_notifications}
                            onChange={handleNotificationChange}
                          />
                          <Form.Check
                            type="switch"
                            className="mb-2"
                            name="order_notifications"
                            label="Order Notifications"
                            checked={notificationSettings.order_notifications}
                            onChange={handleNotificationChange}
                          />
                          <Form.Check
                            type="switch"
                            className="mb-2"
                            name="payment_notifications"
                            label="Payment Notifications"
                            checked={notificationSettings.payment_notifications}
                            onChange={handleNotificationChange}
                          />
                          <Form.Check
                            type="switch"
                            name="daily_summary"
                            label="Daily Summary"
                            checked={notificationSettings.daily_summary}
                            onChange={handleNotificationChange}
                          />
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="mb-3">
                        <Card.Header>System Alerts</Card.Header>
                        <Card.Body>
                          <Form.Check
                            type="switch"
                            className="mb-2"
                            name="sms_notifications"
                            label="SMS Notifications"
                            checked={notificationSettings.sms_notifications}
                            onChange={handleNotificationChange}
                          />
                          <Form.Check
                            type="switch"
                            className="mb-2"
                            name="inventory_alerts"
                            label="Inventory Alerts"
                            checked={notificationSettings.inventory_alerts}
                            onChange={handleNotificationChange}
                          />
                          <Form.Check
                            type="switch"
                            className="mb-2"
                            name="low_stock_alerts"
                            label="Low Stock Alerts"
                            checked={notificationSettings.low_stock_alerts}
                            onChange={handleNotificationChange}
                          />
                          <Form.Check
                            type="switch"
                            name="weekly_report"
                            label="Weekly Report"
                            checked={notificationSettings.weekly_report}
                            onChange={handleNotificationChange}
                          />
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  <Button variant="primary" onClick={handleSaveNotifications} disabled={isSaving}>
                    <FiSave className="me-2" /> {isSaving ? 'Saving...' : 'Save Notification Settings'}
                  </Button>
                </Tab>

                {/* Invoice Settings Tab */}
                <Tab eventKey="invoices" title={<span><FiFileText className="me-2" />Invoices</span>}>
                  <h5 className="mb-3">Invoice Configuration</h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Invoice Prefix</Form.Label>
                        <Form.Control
                          type="text"
                          name="invoice_prefix"
                          value={invoiceSettings.invoice_prefix}
                          onChange={handleInvoiceChange}
                          placeholder="INV-"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Next Invoice Number</Form.Label>
                        <Form.Control
                          type="number"
                          name="invoice_next_number"
                          value={invoiceSettings.invoice_next_number}
                          onChange={handleInvoiceChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Default Payment Terms (days)</Form.Label>
                        <Form.Control
                          type="number"
                          name="default_payment_terms"
                          value={invoiceSettings.default_payment_terms}
                          onChange={handleInvoiceChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label>Invoice Terms & Conditions</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="invoice_terms"
                      value={invoiceSettings.invoice_terms}
                      onChange={handleInvoiceChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Invoice Footer Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="invoice_notes"
                      value={invoiceSettings.invoice_notes}
                      onChange={handleInvoiceChange}
                    />
                  </Form.Group>
                  <Row>
                    <Col md={4}>
                      <Form.Check
                        type="switch"
                        className="mb-2"
                        name="auto_send_invoice"
                        label="Auto-send Invoice"
                        checked={invoiceSettings.auto_send_invoice}
                        onChange={handleInvoiceChange}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Check
                        type="switch"
                        className="mb-2"
                        name="show_tax_breakdown"
                        label="Show Tax Breakdown"
                        checked={invoiceSettings.show_tax_breakdown}
                        onChange={handleInvoiceChange}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Check
                        type="switch"
                        name="show_discount"
                        label="Show Discount"
                        checked={invoiceSettings.show_discount}
                        onChange={handleInvoiceChange}
                      />
                    </Col>
                  </Row>
                  <Button variant="primary" onClick={handleSaveInvoiceSettings} disabled={isSaving} className="mt-3">
                    <FiSave className="me-2" /> {isSaving ? 'Saving...' : 'Save Invoice Settings'}
                  </Button>
                </Tab>

                {/* POS Settings Tab */}
                <Tab eventKey="pos" title={<span><FiShoppingCart className="me-2" />POS Settings</span>}>
                  <h5 className="mb-3">Point of Sale Configuration</h5>
                  <Row>
                    <Col md={6}>
                      <Card className="mb-3">
                        <Card.Header>Receipt Settings</Card.Header>
                        <Card.Body>
                          <Form.Check
                            type="switch"
                            className="mb-2"
                            name="receipt_show_logo"
                            label="Show Logo on Receipt"
                            checked={posSettings.receipt_show_logo}
                            onChange={handlePosChange}
                          />
                          <Form.Check
                            type="switch"
                            className="mb-2"
                            name="receipt_show_address"
                            label="Show Address"
                            checked={posSettings.receipt_show_address}
                            onChange={handlePosChange}
                          />
                          <Form.Check
                            type="switch"
                            className="mb-2"
                            name="receipt_show_phone"
                            label="Show Phone Number"
                            checked={posSettings.receipt_show_phone}
                            onChange={handlePosChange}
                          />
                          <Form.Check
                            type="switch"
                            className="mb-2"
                            name="receipt_show_tax"
                            label="Show Tax Details"
                            checked={posSettings.receipt_show_tax}
                            onChange={handlePosChange}
                          />
                          <Form.Check
                            type="switch"
                            className="mb-2"
                            name="receipt_show_barcode"
                            label="Show Barcode"
                            checked={posSettings.receipt_show_barcode}
                            onChange={handlePosChange}
                          />
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="mb-3">
                        <Card.Header>Hardware & Other</Card.Header>
                        <Card.Body>
                          <Form.Group className="mb-3">
                            <Form.Label>Default Printer</Form.Label>
                            <Form.Control
                              type="text"
                              name="default_printer"
                              value={posSettings.default_printer}
                              onChange={handlePosChange}
                              placeholder="Printer name"
                            />
                          </Form.Group>
                          <Form.Check
                            type="switch"
                            name="auto_open_cash_drawer"
                            label="Auto-open Cash Drawer"
                            checked={posSettings.auto_open_cash_drawer}
                            onChange={handlePosChange}
                          />
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label>Receipt Footer Message</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="receipt_footer_message"
                      value={posSettings.receipt_footer_message}
                      onChange={handlePosChange}
                    />
                  </Form.Group>
                  <Button variant="primary" onClick={handleSavePosSettings} disabled={isSaving}>
                    <FiSave className="me-2" /> {isSaving ? 'Saving...' : 'Save POS Settings'}
                  </Button>
                </Tab>

                {/* Tax Settings Tab */}
                <Tab eventKey="tax" title={<span><FiDatabase className="me-2" />Tax Settings</span>}>
                  <h5 className="mb-3">Tax Configuration</h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          name="enable_tax"
                          label="Enable Tax"
                          checked={taxSettings.enable_tax}
                          onChange={handleTaxChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Tax Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="tax_name"
                          value={taxSettings.tax_name}
                          onChange={handleTaxChange}
                          placeholder="e.g., VAT, GST"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Tax Rate (%)</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          name="tax_rate"
                          value={taxSettings.tax_rate}
                          onChange={handleTaxChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Tax Number / VAT ID</Form.Label>
                        <Form.Control
                          type="text"
                          name="tax_number"
                          value={taxSettings.tax_number}
                          onChange={handleTaxChange}
                          placeholder="Your tax registration number"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3 d-flex align-items-end">
                        <div>
                          <Form.Check
                            type="switch"
                            className="mb-2"
                            name="tax_included"
                            label="Tax Included in Price"
                            checked={taxSettings.tax_included}
                            onChange={handleTaxChange}
                          />
                          <Form.Check
                            type="switch"
                            name="compound_tax"
                            label="Enable Compound Tax"
                            checked={taxSettings.compound_tax}
                            onChange={handleTaxChange}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                  {taxSettings.compound_tax && (
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Second Tax Rate (%)</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            name="second_tax_rate"
                            value={taxSettings.second_tax_rate}
                            onChange={handleTaxChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                  <Button variant="primary" onClick={handleSaveTaxSettings} disabled={isSaving}>
                    <FiSave className="me-2" /> {isSaving ? 'Saving...' : 'Save Tax Settings'}
                  </Button>
                </Tab>

                {/* Backup Settings Tab */}
                <Tab eventKey="backup" title={<span><FiDownload className="me-2" />Backup</span>}>
                  <h5 className="mb-3">Backup & Restore</h5>
                  <Alert variant="warning" className="d-flex align-items-center">
                    <FiShield className="me-2" /> Regular backups help protect your data from loss.
                  </Alert>
                  <Card className="mb-3">
                    <Card.Body>
                      <Row>
                        <Col md={6}>
                          <Form.Check
                            type="switch"
                            className="mb-3"
                            name="auto_backup"
                            label="Enable Automatic Backups"
                            checked={backupSettings.auto_backup}
                            onChange={handleBackupChange}
                          />
                          {backupSettings.auto_backup && (
                            <>
                              <Form.Group className="mb-3">
                                <Form.Label>Backup Frequency</Form.Label>
                                <Form.Select
                                  name="backup_frequency"
                                  value={backupSettings.backup_frequency}
                                  onChange={handleBackupChange}
                                >
                                  <option value="hourly">Hourly</option>
                                  <option value="daily">Daily</option>
                                  <option value="weekly">Weekly</option>
                                  <option value="monthly">Monthly</option>
                                </Form.Select>
                              </Form.Group>
                              <Form.Group className="mb-3">
                                <Form.Label>Retention Period (days)</Form.Label>
                                <Form.Control
                                  type="number"
                                  name="backup_retention"
                                  value={backupSettings.backup_retention}
                                  onChange={handleBackupChange}
                                />
                              </Form.Group>
                            </>
                          )}
                        </Col>
                        <Col md={6}>
                          <div className="text-center">
                            <h6 className="text-muted mb-3">Last Backup</h6>
                            <p className="fs-5">
                              {backupSettings.last_backup 
                                ? new Date(backupSettings.last_backup).toLocaleString() 
                                : 'Never'}
                            </p>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                  <div className="d-flex gap-2">
                    <Button variant="primary" onClick={handleSaveBackupSettings} disabled={isSaving}>
                      <FiSave className="me-2" /> {isSaving ? 'Saving...' : 'Save Backup Settings'}
                    </Button>
                    <Button variant="outline-primary" onClick={handleCreateBackup} disabled={backupSettings.backup_in_progress}>
                      <FiDownload className="me-2" /> 
                      {backupSettings.backup_in_progress ? 'Creating...' : 'Create Backup Now'}
                    </Button>
                    <Button variant="outline-secondary">
                      <FiUpload className="me-2" /> Restore Backup
                    </Button>
                  </div>
                </Tab>

                {/* Audit Logs Tab */}
                <Tab eventKey="audit" title={<span><FiShield className="me-2" />Audit Logs</span>}>
                  <h5 className="mb-3">System Activity Logs</h5>
                  <Alert variant="info" className="d-flex align-items-center">
                    <FiSearch className="me-2" /> View all user activities and system changes.
                  </Alert>
                  <Card className="mb-3">
                    <Card.Body>
                      <Row className="align-items-end">
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label>Filter by Action</Form.Label>
                            <Form.Select
                              value={auditFilters.action}
                              onChange={(e) => setAuditFilters(prev => ({ ...prev, action: e.target.value }))}
                            >
                              <option value="">All Actions</option>
                              <option value="login">Login</option>
                              <option value="logout">Logout</option>
                              <option value="create">Create</option>
                              <option value="update">Update</option>
                              <option value="delete">Delete</option>
                              <option value="settings_update">Settings Update</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Button variant="outline-secondary" onClick={() => fetchAuditLogs(1)}>
                            <FiRefreshCw className="me-2" /> Apply Filters
                          </Button>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  {auditLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary"></div>
                    </div>
                  ) : (
                    <>
                      <Table responsive hover className="mb-0">
                        <thead>
                          <tr>
                            <th>Timestamp</th>
                            <th>User</th>
                            <th>Action</th>
                            <th>Details</th>
                            <th>IP Address</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="text-center text-muted py-4">
                                No audit logs found
                              </td>
                            </tr>
                          ) : (
                            auditLogs.map((log) => (
                              <tr key={log.id}>
                                <td>{new Date(log.created_at).toLocaleString()}</td>
                                <td>{log.user?.username || 'System'}</td>
                                <td>
                                  <Badge bg={
                                    log.action === 'create' ? 'success' : 
                                    log.action === 'delete' ? 'danger' : 
                                    log.action === 'update' ? 'warning' : 'info'
                                  }>
                                    {log.action}
                                  </Badge>
                                </td>
                                <td>{log.details || '-'}</td>
                                <td>{log.ip_address || '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                      
                      {auditPagination.pages > 1 && (
                        <div className="d-flex justify-content-between align-items-center mt-3">
                          <span className="text-muted">
                            Page {auditPagination.page} of {auditPagination.pages} 
                            ({auditPagination.total} total)
                          </span>
                          <div className="d-flex gap-2">
                            <Button 
                              variant="outline-secondary" 
                              size="sm"
                              disabled={auditPagination.page === 1}
                              onClick={() => fetchAuditLogs(auditPagination.page - 1)}
                            >
                              Previous
                            </Button>
                            <Button 
                              variant="outline-secondary" 
                              size="sm"
                              disabled={auditPagination.page === auditPagination.pages}
                              onClick={() => fetchAuditLogs(auditPagination.page + 1)}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
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
