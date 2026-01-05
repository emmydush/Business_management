import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Dropdown, Badge, ProgressBar } from 'react-bootstrap';
import { FiPlus, FiFilter, FiCheckSquare, FiSquare, FiClock, FiCheckCircle, FiMoreVertical, FiCalendar, FiUser, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { tasksAPI } from '../services/api';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const res = await tasksAPI.getTasks();
        setTasks(res.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks.');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical': return <Badge bg="danger">Critical</Badge>;
      case 'high': return <Badge bg="warning" text="dark">High</Badge>;
      case 'medium': return <Badge bg="info">Medium</Badge>;
      case 'low': return <Badge bg="secondary">Low</Badge>;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-success';
      case 'in-progress': return 'text-primary';
      case 'pending': return 'text-warning';
      default: return 'text-muted';
    }
  };

  const toggleComplete = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed, status: !t.completed ? 'completed' : 'pending' } : t));
  };

  if (loading) return (
    <Container fluid className="text-center py-5">
      <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
    </Container>
  );

  if (error) return (
    <Container fluid className="py-5"><div className="alert alert-danger">{error}</div></Container>
  );

  return (
    <Container fluid className="p-0">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">My Tasks</h2>
          <p className="text-muted mb-0">Manage your daily to-dos and team assignments.</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Button variant="primary" className="d-flex align-items-center">
            <FiPlus className="me-2" /> New Task
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                  <FiCheckSquare className="text-primary" size={20} />
                </div>
                <span className="text-muted fw-medium">Total Tasks</span>
              </div>
              <h3 className="fw-bold mb-0">{tasks.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                  <FiClock className="text-warning" size={20} />
                </div>
                <span className="text-muted fw-medium">Pending</span>
              </div>
              <h3 className="fw-bold mb-0">{tasks.filter(t => !t.completed).length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                  <FiCheckCircle className="text-success" size={20} />
                </div>
                <span className="text-muted fw-medium">Completed</span>
              </div>
              <h3 className="fw-bold mb-0">{tasks.filter(t => t.completed).length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <div className="bg-danger bg-opacity-10 p-2 rounded me-3">
                  <FiAlertCircle className="text-danger" size={20} />
                </div>
                <span className="text-muted fw-medium">Overdue</span>
              </div>
              <h3 className="fw-bold mb-0">1</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-0">
              <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">Task List</h5>
                <div className="d-flex gap-2">
                  <Form.Select size="sm" className="w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="all">All Tasks</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </Form.Select>
                  <Button variant="light" size="sm" className="border">
                    <FiFilter />
                  </Button>
                </div>
              </div>

              <div className="list-group list-group-flush">
                {tasks.filter(t => filter === 'all' || (filter === 'completed' ? t.completed : !t.completed)).map(task => (
                  <div key={task.id} className="list-group-item p-3 d-flex align-items-center hover-bg-light transition-all">
                    <div className="me-3 cursor-pointer" onClick={() => toggleComplete(task.id)}>
                      {task.completed ?
                        <FiCheckSquare className="text-success" size={22} /> :
                        <FiSquare className="text-muted" size={22} />
                      }
                    </div>
                    <div className="flex-grow-1">
                      <div className={`fw-bold ${task.completed ? 'text-decoration-line-through text-muted' : 'text-dark'}`}>
                        {task.title}
                      </div>
                      <div className="small text-muted d-flex align-items-center mt-1">
                        <span className="me-3">{task.project}</span>
                        <span className="d-flex align-items-center me-3">
                          <FiCalendar className="me-1" size={12} /> {task.dueDate}
                        </span>
                        <span className="d-flex align-items-center">
                          <FiUser className="me-1" size={12} /> {task.assignee}
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      {getPriorityBadge(task.priority)}
                      <Dropdown align="end">
                        <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                          <FiMoreVertical />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item>Edit</Dropdown.Item>
                          <Dropdown.Item>Delete</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white fw-bold py-3">
              Task Progress
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small fw-bold">Website Redesign</span>
                  <span className="small text-muted">75%</span>
                </div>
                <ProgressBar now={75} variant="primary" style={{ height: '6px' }} />
              </div>
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small fw-bold">App Maintenance</span>
                  <span className="small text-muted">40%</span>
                </div>
                <ProgressBar now={40} variant="warning" style={{ height: '6px' }} />
              </div>
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small fw-bold">Q4 Reports</span>
                  <span className="small text-muted">90%</span>
                </div>
                <ProgressBar now={90} variant="success" style={{ height: '6px' }} />
              </div>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white fw-bold py-3">
              Team Workload
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div className="bg-light rounded-circle p-2 me-2">JD</div>
                <div className="flex-grow-1">
                  <div className="small fw-bold">John Doe</div>
                  <div className="small text-muted">5 active tasks</div>
                </div>
                <Badge bg="light" text="dark" className="border">High</Badge>
              </div>
              <div className="d-flex align-items-center mb-3">
                <div className="bg-light rounded-circle p-2 me-2">JS</div>
                <div className="flex-grow-1">
                  <div className="small fw-bold">Jane Smith</div>
                  <div className="small text-muted">3 active tasks</div>
                </div>
                <Badge bg="light" text="dark" className="border">Normal</Badge>
              </div>
              <div className="d-flex align-items-center">
                <div className="bg-light rounded-circle p-2 me-2">MR</div>
                <div className="flex-grow-1">
                  <div className="small fw-bold">Mike Ross</div>
                  <div className="small text-muted">1 active task</div>
                </div>
                <Badge bg="light" text="dark" className="border">Low</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Tasks;