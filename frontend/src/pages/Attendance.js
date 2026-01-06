import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, InputGroup, Form } from 'react-bootstrap';
import { FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiSearch, FiCalendar, FiRefreshCw } from 'react-icons/fi';
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

    useEffect(() => {
        fetchAttendance();
        fetchAttendanceRecords();
    }, []);

    // Debounce search term changes
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch records when debounced search term or selected date changes
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
            const response = await hrAPI.getAttendanceRecords({ date: selectedDate, search: debouncedSearchTerm });
            setAttendanceRecords(response.data.attendance_records || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch attendance records.');
        } finally {
            setLoadingRecords(false);
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return '-';
        
        // Handle different time formats
        let time;
        if (typeof timeString === 'string') {
            // If time is in format 'HH:MM:SS' or 'HH:MM'
            if (timeString.includes(':')) {
                const [hours, minutes] = timeString.split(':').map(Number);
                time = new Date();
                time.setHours(hours, minutes, 0, 0);
            } else {
                return timeString; // Return as is if not in expected format
            }
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
        
        return `${hours}h ${minutes}m`;
    };

    const formatStatus = (status) => {
        switch (status) {
            case 'present':
                return 'Present';
            case 'late':
                return 'Late';
            case 'absent':
                return 'Absent';
            case 'early_departure':
                return 'Early Departure';
            default:
                return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    const handleViewDetails = (record) => {
        // Implement view details functionality
        console.log('Viewing details for:', record);
        toast.success(`Viewing details for ${record.employee?.first_name} ${record.employee?.last_name}`);
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
        <div className="attendance-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Attendance Tracking</h2>
                    <p className="text-muted mb-0">Monitor daily staff presence and punctuality.</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-primary" className="d-flex align-items-center mt-3 mt-md-0" onClick={fetchAttendance}>
                        <FiRefreshCw className="me-2" /> Refresh Status
                    </Button>
                    <Button variant="outline-secondary" className="d-flex align-items-center mt-3 mt-md-0" onClick={fetchAttendanceRecords}>
                        <FiRefreshCw className="me-2" /> Refresh Records
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="g-4 mb-4">
                <Col md={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                                <FiCheckCircle className="text-success" size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-medium">Present Today</div>
                                <h4 className="fw-bold mb-0">{attendance?.present_today || 0}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-danger bg-opacity-10 p-3 rounded me-3">
                                <FiXCircle className="text-danger" size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-medium">Absent Today</div>
                                <h4 className="fw-bold mb-0">{attendance?.absent_today || 0}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-warning bg-opacity-10 p-3 rounded me-3">
                                <FiClock className="text-warning" size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-medium">Late Arrivals</div>
                                <h4 className="fw-bold mb-0">{attendance?.late_arrivals || 0}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-info bg-opacity-10 p-3 rounded me-3">
                                <FiAlertCircle className="text-info" size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-medium">On Leave</div>
                                <h4 className="fw-bold mb-0">{attendance?.total_records ? attendance.total_records - attendance.present_today : 0}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0">Daily Attendance Log</h5>
                    <div className="d-flex gap-2">
                        <InputGroup size="sm" style={{ width: '250px' }}>
                            <InputGroup.Text className="bg-light border-0"><FiSearch className="text-muted" /></InputGroup.Text>
                            <Form.Control
                                placeholder="Search employee..."
                                className="bg-light border-0"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                }}
                            />
                        </InputGroup>
                        <Form.Control
                            type="date"
                            size="sm"
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                fetchAttendanceRecords();
                            }}
                            className="border"
                        />
                    </div>
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="ps-4">Employee</th>
                                    <th>Check In</th>
                                    <th>Check Out</th>
                                    <th>Total Hours</th>
                                    <th>Status</th>
                                    <th className="text-end pe-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingRecords ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4">
                                            <div className="d-flex justify-content-center align-items-center">
                                                <div className="spinner-border text-primary me-2" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                Loading attendance records...
                                            </div>
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
                                                <Badge 
                                                    bg={
                                                        record.status === 'present' ? 'success' : 
                                                        record.status === 'late' ? 'warning' : 
                                                        record.status === 'absent' ? 'danger' : 
                                                        'secondary'
                                                    }
                                                    text={record.status === 'late' ? 'dark' : undefined}
                                                    className="fw-normal"
                                                >
                                                    {formatStatus(record.status)}
                                                </Badge>
                                            </td>
                                            <td className="text-end pe-4">
                                                <Button 
                                                    variant="link" 
                                                    size="sm" 
                                                    className="p-0 text-decoration-none"
                                                    onClick={() => handleViewDetails(record)}
                                                >
                                                    Details
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4 text-muted">
                                            No attendance records found for today
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Attendance;
