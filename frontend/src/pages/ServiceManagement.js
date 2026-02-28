import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Badge, Table, Modal, Form, Spinner, Alert, Tab, Tabs } from 'react-bootstrap';
import { FiPlus, FiCalendar, FiClock, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = '/api/services';
const CUSTOMERS_URL = '/api/customers/';
const EMPLOYEES_URL = '/api/hr/employees';

const ServiceManagement = () => {
    const [activeTab, setActiveTab] = useState('appointments');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [services, setServices] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [timeEntries, setTimeEntries] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('appointment');
    const [formData, setFormData] = useState({});

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/appointments`);
            setAppointments(res.data || []);
        } catch (err) {
            console.error('Failed to load appointments:', err);
            setError('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        try {
            const res = await axios.get(`${API_URL}/services`);
            setServices(res.data || []);
        } catch (err) {
            console.error('Failed to load services:', err);
        }
    };

    const fetchQuotes = async () => {
        try {
            const res = await axios.get(`${API_URL}/quotes`);
            setQuotes(res.data || []);
        } catch (err) {
            console.error('Failed to load quotes:', err);
        }
    };

    const fetchTimeEntries = async () => {
        try {
            const res = await axios.get(`${API_URL}/time-entries`);
            setTimeEntries(res.data || []);
        } catch (err) {
            console.error('Failed to load time entries:', err);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await axios.get(`${CUSTOMERS_URL}`);
            setCustomers(res.data || []);
        } catch (err) {
            console.error('Failed to load customers:', err);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(`${EMPLOYEES_URL}`);
            setEmployees(res.data || []);
        } catch (err) {
            console.error('Failed to load employees:', err);
        }
    };

    useEffect(() => {
        fetchAppointments();
        fetchServices();
        fetchQuotes();
        fetchTimeEntries();
        fetchCustomers();
        fetchEmployees();
    }, []);

    const handleSave = async () => {
        try {
            if (modalType === 'appointment') {
                await axios.post(`${API_URL}/appointments`, formData);
                toast.success('Appointment created');
            } else if (modalType === 'service') {
                await axios.post(`${API_URL}/services`, formData);
                toast.success('Service created');
            } else if (modalType === 'quote') {
                await axios.post(`${API_URL}/quotes`, formData);
                toast.success('Quote created');
            } else if (modalType === 'time') {
                await axios.post(`${API_URL}/time-entries`, formData);
                toast.success('Time entry created');
            }
            setShowModal(false);
            setFormData({});
            fetchAppointments();
            fetchServices();
            fetchQuotes();
            fetchTimeEntries();
        } catch (err) {
            toast.error('Failed to save');
        }
    };

    const updateAppointmentStatus = async (id, status) => {
        try {
            await axios.put(`${API_URL}/appointments/${id}`, { status });
            toast.success('Status updated');
            fetchAppointments();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            scheduled: 'primary',
            confirmed: 'info',
            in_progress: 'warning',
            completed: 'success',
            cancelled: 'danger',
            no_show: 'secondary'
        };
        return <Badge bg={statusColors[status] || 'secondary'}>{status}</Badge>;
    };

    return (
        <div className="service-management-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Service Management</h2>
                    <p className="text-muted mb-0">Manage appointments, services, time tracking, and quotes.</p>
                </div>
                <div className="mt-3 mt-md-0">
                    <Button variant="primary" className="me-2" onClick={() => { setModalType('appointment'); setShowModal(true); }}>
                        <FiCalendar className="me-2" /> New Appointment
                    </Button>
                    <Button variant="outline-primary" onClick={() => { setModalType('service'); setShowModal(true); }}>
                        <FiPlus className="me-2" /> New Service
                    </Button>
                </div>
            </div>

            <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
                <Tab eventKey="appointments" title={<><FiCalendar className="me-1" /> Appointments</>}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            {loading ? (
                                <div className="text-center py-5"><Spinner animation="border" /></div>
                            ) : error ? (
                                <Alert variant="danger">{error}</Alert>
                            ) : (
                                <Table responsive hover>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Customer</th>
                                            <th>Service</th>
                                            <th>Date & Time</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {appointments.map(apt => (
                                            <tr key={apt.id}>
                                                <td>{apt.appointment_id}</td>
                                                <td>{apt.customer?.first_name} {apt.customer?.last_name}</td>
                                                <td>{apt.service?.name || '-'}</td>
                                                <td>{apt.appointment_date} {apt.start_time}</td>
                                                <td>{getStatusBadge(apt.status)}</td>
                                                <td>
                                                    <Button variant="outline-success" size="sm" className="me-1" onClick={() => updateAppointmentStatus(apt.id, 'completed')}>
                                                        <FiCheck />
                                                    </Button>
                                                    <Button variant="outline-danger" size="sm" onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}>
                                                        <FiX />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="services" title="Services">
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <Table responsive hover>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Duration (min)</th>
                                        <th>Price</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {services.map(svc => (
                                        <tr key={svc.id}>
                                            <td>{svc.service_id}</td>
                                            <td>{svc.name}</td>
                                            <td>{svc.category || '-'}</td>
                                            <td>{svc.duration_minutes}</td>
                                            <td>${svc.price}</td>
                                            <td>{svc.is_active ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="quotes" title="Quotes">
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-end mb-3">
                                <Button variant="primary" onClick={() => { setModalType('quote'); setShowModal(true); }}>
                                    <FiPlus className="me-2" /> New Quote
                                </Button>
                            </div>
                            <Table responsive hover>
                                <thead>
                                    <tr>
                                        <th>Quote ID</th>
                                        <th>Customer</th>
                                        <th>Date</th>
                                        <th>Valid Until</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotes.map(qt => (
                                        <tr key={qt.id}>
                                            <td>{qt.quote_id}</td>
                                            <td>{qt.customer?.first_name} {qt.customer?.last_name}</td>
                                            <td>{qt.quote_date}</td>
                                            <td>{qt.valid_until}</td>
                                            <td>${qt.total_amount}</td>
                                            <td>{getStatusBadge(qt.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="time" title={<><FiClock className="me-1" /> Time Tracking</>}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-end mb-3">
                                <Button variant="primary" onClick={() => { setModalType('time'); setShowModal(true); }}>
                                    <FiPlus className="me-2" /> Log Time
                                </Button>
                            </div>
                            <Table responsive hover>
                                <thead>
                                    <tr>
                                        <th>Entry ID</th>
                                        <th>Employee</th>
                                        <th>Date</th>
                                        <th>Duration</th>
                                        <th>Description</th>
                                        <th>Billable</th>
                                        <th>Approved</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {timeEntries.map(te => (
                                        <tr key={te.id}>
                                            <td>{te.entry_id}</td>
                                            <td>{te.employee?.first_name} {te.employee?.last_name}</td>
                                            <td>{te.entry_date}</td>
                                            <td>{te.duration_minutes} min</td>
                                            <td>{te.description || '-'}</td>
                                            <td>{te.is_billable ? 'Yes' : 'No'}</td>
                                            <td>{te.is_approved ? <Badge bg="success">Yes</Badge> : <Badge bg="warning">Pending</Badge>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {modalType === 'appointment' && 'New Appointment'}
                        {modalType === 'service' && 'New Service'}
                        {modalType === 'quote' && 'New Quote'}
                        {modalType === 'time' && 'Log Time Entry'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalType === 'appointment' && (
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Title</Form.Label>
                                <Form.Control type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
                            </Form.Group>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Customer</Form.Label>
                                        <Form.Select 
                                            value={formData.customer_id || ''} 
                                            onChange={e => setFormData({...formData, customer_id: parseInt(e.target.value)})}
                                        >
                                            <option value="">Select Customer</option>
                                            {customers.map(c => (
                                                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Service</Form.Label>
                                        <Form.Select 
                                            value={formData.service_id || ''} 
                                            onChange={e => setFormData({...formData, service_id: parseInt(e.target.value)})}
                                        >
                                            <option value="">Select Service</option>
                                            {services.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Date</Form.Label>
                                        <Form.Control type="date" value={formData.appointment_date || ''} onChange={e => setFormData({...formData, appointment_date: e.target.value})} />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Start Time</Form.Label>
                                        <Form.Control type="time" value={formData.start_time || ''} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>End Time</Form.Label>
                                        <Form.Control type="time" value={formData.end_time || ''} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3">
                                <Form.Label>Assign Employee</Form.Label>
                                <Form.Select 
                                    value={formData.employee_id || ''} 
                                    onChange={e => setFormData({...formData, employee_id: parseInt(e.target.value)})}
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map(e => (
                                        <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control as="textarea" rows={3} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </Form.Group>
                        </Form>
                    )}&#125;
                    {modalType === 'service' && (
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Service Name</Form.Label>
                                <Form.Control type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </Form.Group>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Price</Form.Label>
                                        <Form.Control type="number" step="0.01" value={formData.price || ''} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Duration (minutes)</Form.Label>
                                        <Form.Control type="number" value={formData.duration_minutes || ''} onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value)})} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3">
                                <Form.Label>Category</Form.Label>
                                <Form.Control type="text" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control as="textarea" rows={3} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </Form.Group>
                        </Form>
                    )}
                    {modalType === 'quote' && (
                        <Form>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Customer ID</Form.Label>
                                        <Form.Control type="number" value={formData.customer_id || ''} onChange={e => setFormData({...formData, customer_id: parseInt(e.target.value)})} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Valid Until</Form.Label>
                                        <Form.Control type="date" value={formData.valid_until || ''} onChange={e => setFormData({...formData, valid_until: e.target.value})} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3">
                                <Form.Label>Notes</Form.Label>
                                <Form.Control as="textarea" rows={3} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} />
                            </Form.Group>
                        </Form>
                    )}
                    {modalType === 'time' && (
                        <Form>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Employee ID</Form.Label>
                                        <Form.Control type="number" value={formData.employee_id || ''} onChange={e => setFormData({...formData, employee_id: parseInt(e.target.value)})} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Date</Form.Label>
                                        <Form.Control type="date" value={formData.entry_date || ''} onChange={e => setFormData({...formData, entry_date: e.target.value})} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Start Time</Form.Label>
                                        <Form.Control type="time" value={formData.start_time || ''} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>End Time</Form.Label>
                                        <Form.Control type="time" value={formData.end_time || ''} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control as="textarea" rows={3} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </Form.Group>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave}>Save</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ServiceManagement;
