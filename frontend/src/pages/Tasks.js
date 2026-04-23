import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, ProgressBar, Modal } from 'react-bootstrap';
import { INVOICE_STATUSES, INVOICE_STATUS_LABELS } from '../constants/statuses';
import { FiPlus, FiFilter, FiCheckSquare, FiSquare, FiClock, FiCheckCircle, FiCalendar, FiUser, FiAlertCircle, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { tasksAPI, projectsAPI, settingsAPI } from '../services/api';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    project: '',
    assigned_to: '',
    due_date: '',
    priority: 'medium',
    status: 'pending'
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch tasks
        const tasksRes = await tasksAPI.getTasks();
        setTasks(tasksRes.data || []);
        
        // Fetch projects for progress tracking
        try {
          const projectsRes = await projectsAPI.getProjects({ limit: 3 });
          setProjects(projectsRes.data.projects || projectsRes.data || []);
        } catch (projErr) {
          console.error('Error fetching projects:', projErr);
          setProjects([]); // Keep empty if failed
        }
        
        // Fetch team members
        try {
          const usersRes = await settingsAPI.getUsers();
          // Transform user data to match expected team member format
          const transformedMembers = (usersRes.data.users || usersRes.data || []).map((user) => {
            const nameParts = (user.first_name || user.username || 'User').split(' ');
            const initials = (nameParts[0]?.charAt(0) || '') + (nameParts[1]?.charAt(0) || '');
            
            // Calculate active tasks for this user
            const activeTasks = tasks.filter(task => task.assignee === user.username || task.assignee === user.email).length;
            
            return {
              id: user.id,
              initials: initials || 'U',
              name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Unknown User',
              activeTasks: activeTasks,
              workload: activeTasks > 4 ? 'High' : activeTasks > 2 ? 'Normal' : 'Low'
            };
          });
          setTeamMembers(transformedMembers);
        } catch (userErr) {
          console.error('Error fetching users:', userErr);
          setTeamMembers([]); // Keep empty if failed
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
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

  const toggleComplete = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed, status: !t.completed ? 'completed' : 'pending' } : t));
  };

  const overdueCount = tasks.filter(t => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    const today = new Date();
    // compare dates at start of day
    return !t.completed && (due < new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  }).length;

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    setIsCreating(true);
    try {
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        project: newTask.project || null,
        assigned_to: newTask.assigned_to || null,
        due_date: newTask.due_date || null,
        priority: newTask.priority,
        status: newTask.status
      };

      const response = await tasksAPI.createTask(taskData);
      const createdTask = response.data.task || response.data;
      
      // Add the new task to the list
      setTasks([...tasks, createdTask]);
      
      // Reset form and close modal
      setNewTask({
        title: '',
        description: '',
        project: '',
        assigned_to: '',
        due_date: '',
        priority: 'medium',
        status: 'pending'
      });
      setShowTaskModal(false);
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setIsCreating(false);
    }
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
          <Button variant="primary" className="d-flex align-items-center" onClick={() => setShowTaskModal(true)}>
            <FiPlus className="me-2" /> New Task
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Row className="g-2 g-md-4 mb-4">
        <Col xs={6} sm={6} md={3} lg={3}>
          <Card className="border-0 shadow-sm h-100 card-responsive">
            <Card.Body className="p-2 p-md-4">
              <div className="d-flex flex-column align-items-center mb-2">
                <div className="bg-primary bg-opacity-10 p-2 rounded mb-2">
                  <FiCheckSquare className="text-primary" size={18} />
                </div>
                <span className="text-muted fw-medium small small-md text-center">Total Tasks</span>
              </div>
              <h3 className="fw-bold mb-0 text-center h5 h4-md">{tasks.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={6} md={3} lg={3}>
          <Card className="border-0 shadow-sm h-100 card-responsive">
            <Card.Body className="p-2 p-md-4">
              <div className="d-flex flex-column align-items-center mb-2">
                <div className="bg-warning bg-opacity-10 p-2 rounded mb-2">
                  <FiClock className="text-warning" size={18} />
                </div>
                <span className="text-muted fw-medium small small-md text-center">Pending</span>
              </div>
              <h3 className="fw-bold mb-0 text-center h5 h4-md">{tasks.filter(t => !t.completed).length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={6} md={3} lg={3}>
          <Card className="border-0 shadow-sm h-100 card-responsive">
            <Card.Body className="p-2 p-md-4">
              <div className="d-flex flex-column align-items-center mb-2">
                <div className="bg-success bg-opacity-10 p-2 rounded mb-2">
                  <FiCheckCircle className="text-success" size={18} />
                </div>
                <span className="text-muted fw-medium small small-md text-center">Completed</span>
              </div>
              <h3 className="fw-bold mb-0 text-center h5 h4-md">{tasks.filter(t => t.completed).length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={6} md={3} lg={3}>
          <Card className="border-0 shadow-sm h-100 card-responsive">
            <Card.Body className="p-2 p-md-4">
              <div className="d-flex flex-column align-items-center mb-2">
                <div className="bg-danger bg-opacity-10 p-2 rounded mb-2">
                  <FiAlertCircle className="text-danger" size={18} />
                </div>
                <span className="text-muted fw-medium small small-md text-center">{INVOICE_STATUS_LABELS[INVOICE_STATUSES.OVERDUE]}</span>
              </div>
              <h3 className="fw-bold mb-0 text-center h5 h4-md">{overdueCount}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style dangerouslySetInnerHTML={{
        __html: `
          /* Mobile Responsive Styles for Tasks Cards */
          @media (max-width: 767.98px) {
            .card-responsive {
              min-height: 100px;
              margin-bottom: 8px;
            }
            
            .card-responsive .card-body {
              padding: 12px !important;
            }
            
            .small-md {
              font-size: 0.7rem !important;
            }
            
            .h4-md {
              font-size: 1.25rem !important;
            }
            
            .h5 {
              font-size: 1rem !important;
            }
          }
          
          @media (max-width: 575.98px) {
            .card-responsive {
              min-height: 90px;
            }
            
            .card-responsive .card-body {
              padding: 10px !important;
            }
            
            .small-md {
              font-size: 0.65rem !important;
            }
            
            .h4-md {
              font-size: 1.1rem !important;
            }
          }
          
          /* Desktop styles */
          @media (min-width: 768px) {
            .small-md {
              font-size: 0.875rem !important;
            }
            
            .h4-md {
              font-size: 1.5rem !important;
            }
          }
          
          /* Smooth transitions */
          .card-responsive {
            transition: all 0.2s ease-in-out;
          }
          
          .card-responsive:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1) !important;
          }
        `}} />

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
                    <div className="d-flex align-items-center gap-2">
                      {getPriorityBadge(task.priority)}
                      <Button variant="outline-warning" size="sm" className="d-flex align-items-center" title="Edit">
                        <FiEdit2 size={16} />
                      </Button>
                      <Button variant="outline-danger" size="sm" className="d-flex align-items-center" title="Delete">
                        <FiTrash2 size={16} />
                      </Button>
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
              {projects.slice(0, 3).map((project, index) => {
                const variant = index === 0 ? 'primary' : index === 1 ? 'warning' : 'success';
                return (
                  <div key={project.id} className="mb-4">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="small fw-bold">{project.title || `Project ${index + 1}`}</span>
                      <span className="small text-muted">{project.progress || 0}%</span>
                    </div>
                    <ProgressBar now={project.progress || 0} variant={variant} style={{ height: '6px' }} />
                  </div>
                );
              })}
              {projects.length === 0 && (
                <div className="text-center text-muted py-3">
                  No project data available
                </div>
              )}
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white fw-bold py-3">
              Team Workload
            </Card.Header>
            <Card.Body>
              {teamMembers.map((member, index) => {
                const badgeVariant = member.workload === 'High' ? 'danger' : member.workload === 'Normal' ? 'warning' : 'success';
                return (
                  <div key={member.id || index} className="d-flex align-items-center mb-3">
                    <div className="bg-light rounded-circle p-2 me-2">{member.initials}</div>
                    <div className="flex-grow-1">
                      <div className="small fw-bold">{member.name}</div>
                      <div className="small text-muted">{member.activeTasks} active task{member.activeTasks !== 1 ? 's' : ''}</div>
                    </div>
                    <Badge bg={badgeVariant} className="text-capitalize">{member.workload}</Badge>
                  </div>
                );
              })}
              {teamMembers.length === 0 && (
                <div className="text-center text-muted py-3">
                  No team member data available
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Task Creation Modal */}
      <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Create New Task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Task Title *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter task description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </Form.Group>
            
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Project</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Project name"
                    value={newTask.project}
                    onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Assign To</Form.Label>
                  <Form.Select
                    value={newTask.assigned_to}
                    onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                  >
                    <option value="">Select team member</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="g-3 mt-1">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Due Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Priority</Form.Label>
                  <Form.Select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowTaskModal(false)} className="px-4">
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateTask} 
            disabled={isCreating || !newTask.title.trim()}
            className="px-4"
          >
            {isCreating ? 'Creating...' : 'Create Task'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Tasks;