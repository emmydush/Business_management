import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Form, InputGroup, Dropdown, Modal, ProgressBar } from 'react-bootstrap';
import { FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEdit2, FiTrash2, FiClock, FiCheckCircle, FiAlertCircle, FiUser, FiCalendar, FiFlag } from 'react-icons/fi';
import { tasksAPI, settingsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await settingsAPI.getUsers();
      setUsers(response.data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getTasks();
      // Handle both array response and object response with tasks key
      const tasksData = Array.isArray(response.data) ? response.data : (response.data.tasks || []);
      setTasks(tasksData);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const taskData = {
      title: formData.get('title'),
      description: formData.get('description'),
      status: formData.get('status'),
      priority: formData.get('priority'),
      due_date: formData.get('due_date'),
      assigned_to: formData.get('assigned_to') || null
    };

    try {
      if (currentTask) {
        await tasksAPI.updateTask(currentTask.id, taskData);
        toast.success('Task updated');
      } else {
        await tasksAPI.createTask(taskData);
        toast.success('Task created');
      }
      fetchTasks();
      setShowModal(false);
    } catch (err) {
      toast.error('Failed to save task');
    }
  };

  const handleDeleteTask = (id) => {
    toast((t) => (
      <div className="d-flex flex-column gap-2 p-1">
        <div className="d-flex align-items-center gap-2">
          <FiTrash2 className="text-danger" size={18} />
          <span className="fw-bold">Delete Task?</span>
        </div>
        <p className="mb-0 small text-white-50">Are you sure you want to delete this task?</p>
        <div className="d-flex gap-2 justify-content-end mt-2">
          <Button size="sm" variant="outline-light" className="border-0" onClick={() => toast.dismiss(t.id)}>
            Cancel
          </Button>
          <Button size="sm" variant="danger" className="px-3 shadow-sm" onClick={async () => {
            try {
              await tasksAPI.deleteTask(id);
              setTasks(tasks.filter(task => task.id !== id));
              toast.dismiss(t.id);
              toast.success('Task deleted');
            } catch (err) {
              toast.dismiss(t.id);
              toast.error('Failed to delete task');
            }
          }}>
            Delete
          </Button>
        </div>
      </div>
    ), {
      duration: 4000,
      style: {
        minWidth: '300px',
        background: '#1e293b',
        border: '1px solid rgba(255,255,255,0.1)'
      }
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'primary';
      case 'Pending': return 'warning';
      case 'On Hold': return 'secondary';
      default: return 'info';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High': return 'danger';
      case 'Medium': return 'warning';
      case 'Low': return 'info';
      default: return 'secondary';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) return <div className="p-4 text-center">Loading tasks...</div>;

  return (
    <div className="tasks-container p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Tasks & Activities</h2>
          <p className="text-muted mb-0">Track and manage your team's tasks.</p>
        </div>
        <Button variant="primary" onClick={() => { setCurrentTask(null); setShowModal(true); }}>
          <FiPlus className="me-2" /> New Task
        </Button>
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <Row className="g-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <FiSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search tasks..."
                  className="bg-light border-start-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                <option value="All">All Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-4">
        {filteredTasks.map(task => (
          <Col key={task.id} lg={4} md={6}>
            <Card className="border-0 shadow-sm h-100 task-card">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <Badge bg={getStatusBadge(task.status)} className="px-2 py-1 fw-normal">
                    {task.status}
                  </Badge>
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                      <FiMoreVertical size={18} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="border-0 shadow-sm">
                      <Dropdown.Item onClick={() => { setCurrentTask(task); setShowModal(true); }}>
                        <FiEdit2 className="me-2" /> Edit
                      </Dropdown.Item>
                      <Dropdown.Item className="text-danger" onClick={() => handleDeleteTask(task.id)}>
                        <FiTrash2 className="me-2" /> Delete
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
                <h5 className="fw-bold mb-2">{task.title}</h5>
                <p className="text-muted small mb-4 line-clamp-2">{task.description}</p>

                <div className="d-flex align-items-center gap-3 mb-3 text-muted small">
                  <div className="d-flex align-items-center">
                    <FiCalendar className="me-1" /> {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                  </div>
                  <div className="d-flex align-items-center">
                    <FiFlag className={`me-1 text-${getPriorityBadge(task.priority)}`} /> {task.priority}
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-between pt-3 border-top">
                  <div className="d-flex align-items-center">
                    <div className="avatar-sm bg-light rounded-circle d-flex align-items-center justify-content-center me-2">
                      <FiUser size={14} />
                    </div>
                    <span className="small fw-medium">{task.assignee_name || 'Unassigned'}</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{currentTask ? 'Edit Task' : 'New Task'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSave}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control name="title" defaultValue={currentTask?.title} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control name="description" as="textarea" rows={3} defaultValue={currentTask?.description} />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select name="status" defaultValue={currentTask?.status || 'Pending'}>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select name="priority" defaultValue={currentTask?.priority || 'Medium'}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Due Date</Form.Label>
              <Form.Control name="due_date" type="date" defaultValue={currentTask?.due_date} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Assigned To</Form.Label>
              <Form.Select name="assigned_to" defaultValue={currentTask?.assigned_to || ''}>
                <option value="">Unassigned</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} ({user.role})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Save Task</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        .task-card { transition: transform 0.2s; }
        .task-card:hover { transform: translateY(-5px); }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .avatar-sm { width: 24px; height: 24px; }
      `}} />
    </div>
  );
};

export default Tasks;
