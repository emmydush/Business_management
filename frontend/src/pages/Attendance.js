import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, InputGroup, Form, Modal } from 'react-bootstrap';
import { FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiSearch, FiRefreshCw, FiPlus, FiEdit2, FiTrash2, FiFileText } from 'react-icons/fi';
import { hrAPI } from '../services/api';
import toast from 'react-hot-toast';

const Attendance = () => {
    const [attendance, setAttendance] = useState(null);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [editingRecord, setEditingRecord] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [formData, setFormData] = useState({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        check_in_time: '',
        check_out_time: '',
        status: 'present',
        work_location: '',
        notes: ''
    });

    useEffect(() => {
        fetchAttendance();
        fetchAttendanceRecords();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (selectedDate) {
            fetchAttendanceRecords();
        }
    }, [debouncedSearchTerm, selectedDate]);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const response = await hrAPI.getAttendance();
            setAttendance(response.data.attendance || null);
            setError(null);
        } catch (err) {
            setError('Failed to fetch attendance data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendanceRecords = async () => {
        try {
            setLoadingRecords(true);
            const params = { date: selectedDate, search: debouncedSearchTerm };
            const response = await hrAPI.getAttendanceRecords(params);
            setAttendanceRecords(response.data.attendance_records || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch attendance records.');
        } finally {
            setLoadingRecords(false);
        }
    };

    const handleCheckIn = async () => {
        try {
            const response = await hrAPI.checkIn({});
            toast.success(response.data.message || 'Check-in successful!');
            fetchAttendance();
            fetchAttendanceRecords();
        } catch (err) {
            const message = err.response?.data?.error || 'Check-in failed.';
            toast.error(message);
        }
    };

    const handleCheckOut = async () => {
        try {
            const response = await hrAPI.checkOut({});
            toast.success(response.data.message || 'Check-out successful!');
            fetchAttendance();
            fetchAttendanceRecords();
        } catch (err) {
            const message = err.response?.data?.error || 'Check-out failed.';
            toast.error(message);
        }
    };

    const handleOpenModal = (mode = 'add', record = null) => {
        setModalMode(mode);
        if (record) {
            setEditingRecord(record);
            setFormData({
                employee_id: record.employee_id,
                date: record.date,
                check_in_time: record.check_in_time || '',
                check_out_time: record.check_out_time || '',
                status: record.status,
                work_location: record.work_location || '',
                notes: record.notes || ''
            });
        } else {
            setEditingRecord(null);
            setFormData({
                employee_id: '',
                date: new Date().toISOString().split('T')[0],
                check_in_time: '',
                check_out_time: '',
                status: 'present',
                work_location: '',
                notes: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingRecord(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'edit' && editingRecord) {
                await hrAPI.updateAttendance(editingRecord.id, formData);
                toast.success('Attendance record updated!');
            } else {
                await hrAPI.createAttendance(formData);
                toast.success('Attendance record created!');
            }
            handleCloseModal();
            fetchAttendance();
            fetchAttendanceRecords();
        } catch (err) {
            const message = err.response?.data?.error || 'Failed to save';
            toast.error(message);
        }
    };

    const handleDelete = async (record) => {
        if (!window.confirm('Delete this attendance record?')) return;
        try {
            await hrAPI.deleteAttendance(record.id);
            toast.success('Deleted successfully!');
            fetchAttendance();
            fetchAttendanceRecords();
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    const handleGenerateReport = async () => {
        if (!startDate || !endDate) {
            toast.error('Select date range');
            return;
        }
        try {
            setLoadingReport(true);
            const params = { start_date: startDate, end_date: endDate, department: selectedDepartment };
            const response = await hrAPI.getAttendanceReport(params);
            setReportData(response.data);
        } catch (err) {
            setError('Failed to generate report');
        } finally {
            setLoadingReport(false);
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return '-';
        let time;
        if (typeof timeString === 'string' && timeString.includes(':')) {
            const [hours, minutes] = timeString.split(':').map(Number);
            time = new Date();
            time.setHours(hours, minutes, 0, 0);
        } else {
            return '-';
        }
        return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatHours = (hoursWorked) => {
        if (!hoursWorked && hoursWorked !== 0) return '0h 0m';
        const totalHours = parseFloat(hoursWorked);
        const hours = Math.floor(totalHours);
        const minutes = Math.round((totalHours - hours) * 60);
        return hours + 'h ' + minutes + 'm';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return 'success';
            case 'late': return 'warning';
            case 'absent': return 'danger';
            case 'early_departure': return 'info';
            default: return 'secondary';
        }
    };

    const stats = useMemo(() => {
        const total = attendanceRecords.length;
        const present = attendanceRecords.filter(r => r.status === 'present').length;
        const late = attendanceRecords.filter(r => r.status === 'late').length;
        const absent = attendanceRecords.filter(r => r.status === 'absent').length;
        const totalHours = attendanceRecords.reduce((sum, r) => sum + (parseFloat(r.hours_worked) || 0), 0);
        return { total, present, late, absent, totalHours };
    }, [attendanceRecords]);

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
        <div className="attendance-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Attendance Tracking</h2>
                    <p className="text-muted mb-0">Monitor daily staff presence.</p>
                </div>
                <div className="d-flex gap-2 flex-wrap mt-3 mt-md-0">
                    <Button variant="success" onClick={handleCheckIn}>
                        <FiCheckCircle className="me-2" /> Check In
                    </Button>
                    <Button variant="warning" className="text-dark" onClick={handleCheckOut}>
                        <FiClock className="me-2" /> Check Out
                    </Button>
                    <Button variant="primary" onClick={() => handleOpenModal('add')}>
                        <FiPlus className="me-2" /> Add Record
                    </Button>
                    <Button variant="outline-primary" onClick={() => setShowReportModal(true)}>
                        <FiFileText className="me-2" /> Report
                    </Button>
                    <Button variant="outline-secondary" onClick={fetchAttendanceRecords}>
                        <FiRefreshCw />
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

            <Row className="g-2 g-md-4 mb-4">
                <Col xs={6} sm={6} md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="d-flex flex-column align-items-center p-3">
                            <div className="bg-success bg-opacity-10 p-2 rounded mb-2">
                                <FiCheckCircle className="text-success" size={20} />
                            </div>
                            <div className="text-center">
                                <div className="text-muted small">Present</div>
                                <h4 className="fw-bold mb-0">{stats.present}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} sm={6} md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="d-flex flex-column align-items-center p-3">
                            <div className="bg-danger bg-opacity-10 p-2 rounded mb-2">
                                <FiXCircle className="text-danger" size={20} />
                            </div>
                            <div className="text-center">
                                <div className="text-muted small">Absent</div>
                                <h4 className="fw-bold mb-0">{stats.absent}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} sm={6} md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="d-flex flex-column align-items-center p-3">
                            <div className="bg-warning bg-opacity-10 p-2 rounded mb-2">
                                <FiAlertCircle className="text-warning" size={20} />
                            </div>
                            <div className="text-center">
                                <div className="text-muted small">Late</div>
                                <h4 className="fw-bold mb-0">{stats.late}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} sm={6} md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="d-flex flex-column align-items-center p-3">
                            <div className="bg-info bg-opacity-10 p-2 rounded mb-2">
                                <FiClock className="text-info" size={20} />
                            </div>
                            <div className="text-center">
                                <div className="text-muted small">Hours</div>
                                <h4 className="fw-bold mb-0">{formatHours(stats.totalHours)}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                    <Row className="g-2">
                        <Col md={4}>
                            <InputGroup>
                                <InputGroup.Text className="bg-light border-0"><FiSearch className="text-muted" /></InputGroup.Text>
                                <Form.Control
                                    placeholder="Search employee..."
                                    className="bg-light border-0"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={3}>
                            <Form.Control
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="border"
                            />
                        </Col>
                        <Col md={3}>
                            <Form.Select
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                className="border"
                            >
                                <option value="">All Departments</option>
                                <option value="IT">IT</option>
                                <option value="HR">HR</option>
                                <option value="Finance">Finance</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Button variant="outline-secondary" size="sm" onClick={() => { setSearchTerm(''); setSelectedDate(new Date().toISOString().split('T')[0]); setSelectedDepartment(''); }}>
                                Clear
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0">Daily Attendance Log</h5>
                    <span className="text-muted small">{attendanceRecords.length} records</span>
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="ps-4">Employee</th>
                                    <th>Check In</th>
                                    <th>Check Out</th>
                                    <th>Hours</th>
                                    <th>Status</th>
                                    <th className="text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingRecords ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4">
                                            <div className="spinner-border text-primary me-2" />
                                            Loading...
                                        </td>
                                    </tr>
                                ) : attendanceRecords.length > 0 ? (
                                    attendanceRecords.map((record, index) => (
                                        <tr key={record.id || index}>
                                            <td className="ps-4">
                                                <div className="fw-bold">{record.employee?.first_name} {record.employee?.last_name}</div>
                                                <div className="small text-muted">{record.employee?.employee_id}</div>
                                            </td>
                                            <td>{formatTime(record.check_in_time)}</td>
                                            <td>{formatTime(record.check_out_time)}</td>
                                            <td>{formatHours(record.hours_worked)}</td>
                                            <td>
                                                <Badge bg={getStatusColor(record.status)}>
                                                    {record.status}
                                                </Badge>
                                            </td>
                                            <td className="text-end pe-4">
                                                <Button variant="link" size="sm" className="p-0 me-2 text-primary" onClick={() => handleOpenModal('edit', record)}>
                                                    <FiEdit2 size={16} />
                                                </Button>
                                                <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => handleDelete(record)}>
                                                    <FiTrash2 size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4 text-muted">
                                            No records found for {selectedDate}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{modalMode === 'edit' ? 'Edit Attendance' : 'Add Attendance'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Employee ID</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={formData.employee_id}
                                        onChange={(e) => setFormData({...formData, employee_id: parseInt(e.target.value)})}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Check In</Form.Label>
                                    <Form.Control
                                        type="time"
                                        value={formData.check_in_time}
                                        onChange={(e) => setFormData({...formData, check_in_time: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Check Out</Form.Label>
                                    <Form.Control
                                        type="time"
                                        value={formData.check_out_time}
                                        onChange={(e) => setFormData({...formData, check_out_time: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    >
                                        <option value="present">Present</option>
                                        <option value="late">Late</option>
                                        <option value="absent">Absent</option>
                                        <option value="early_departure">Early Departure</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Location</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.work_location}
                                        onChange={(e) => setFormData({...formData, work_location: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Notes</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        value={formData.notes}
                                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                        <Button variant="primary" type="submit">Save</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal show={showReportModal} onHide={() => setShowReportModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Attendance Report</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="g-3 mb-4">
                        <Col md={4}>
                            <Form.Label>Start Date</Form.Label>
                            <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </Col>
                        <Col md={4}>
                            <Form.Label>End Date</Form.Label>
                            <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </Col>
                        <Col md={4} className="d-flex align-items-end">
                            <Button variant="primary" onClick={handleGenerateReport} disabled={loadingReport}>
                                {loadingReport ? 'Generating...' : 'Generate'}
                            </Button>
                        </Col>
                    </Row>
                    {reportData && (
                        <>
                            <Row className="g-3 mb-3">
                                <Col md={4}><Card bg="primary" text="white"><Card.Body className="text-center"><h3>{reportData.report?.total_records}</h3><small>Total</small></Card.Body></Card></Col>
                                <Col md={4}><Card bg="success" text="white"><Card.Body className="text-center"><h3>{reportData.report?.present}</h3><small>Present</small></Card.Body></Card></Col>
                                <Col md={4}><Card bg="warning" text="dark"><Card.Body className="text-center"><h3>{reportData.report?.late}</h3><small>Late</small></Card.Body></Card></Col>
                            </Row>
                            <h6>Employee Summary</h6>
                            <Table size="sm" bordered>
                                <thead><tr><th>Employee</th><th>Days</th><th>Hours</th><th>Rate</th></tr></thead>
                                <tbody>
                                    {reportData.employee_stats?.map((stat, i) => (
                                        <tr key={i}>
                                            <td>{stat.employee_name}</td>
                                            <td>{stat.total_days}</td>
                                            <td>{stat.total_hours.toFixed(1)}</td>
                                            <td><Badge bg={stat.attendance_rate >= 90 ? 'success' : 'warning'}>{stat.attendance_rate}%</Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowReportModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Attendance;
