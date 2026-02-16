import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Dropdown, Badge, ProgressBar } from 'react-bootstrap';
import { INVOICE_STATUSES, INVOICE_STATUS_LABELS } from '../constants/statuses';
import { FiPlus, FiFilter, FiCheckSquare, FiSquare, FiClock, FiCheckCircle, FiMoreVertical, FiCalendar, FiUser, FiAlertCircle, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { tasksAPI, projectsAPI, settingsAPI } from '../services/api';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

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
          // Fallback to demo data
          setProjects([
            { id: 1, title: 'Website Redesign', progress: 75 },
            { id: 2, title: 'App Maintenance', progress: 40 },
            { id: 3, title: 'Q4 Reports', progress: 90 }
          ]);
        }
        
        // Fetch team members
        try {
          const usersRes = await settingsAPI.getUsers();
          // Transform user data to match expected team member format
          const transformedMembers = (usersRes.data.users || usersRes.data || []).slice(0, 3).map((user, index) => {
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
          // Fallback to demo data
          setTeamMembers([
            { id: 1, initials: 'JD', name: 'John Doe', activeTasks: 5, workload: 'High' },
            { id: 2, initials: 'JS', name: 'Jane Smith', activeTasks: 3, workload: 'Normal' },
            { id: 3, initials: 'MR', name: 'Mike Ross', activeTasks: 1, workload: 'Low' }
          ]);
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

  const overdueCount = tasks.filter(t => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    const today = new Date();
    // compare dates at start of day
    return !t.completed && (due < new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  }).length;

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
    </Container>
  );
};

export default Tasks;