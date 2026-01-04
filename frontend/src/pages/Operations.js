import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge } from 'react-bootstrap';

const Operations = () => {
  const [projects, setProjects] = useState([
    { id: 1, name: 'Website Redesign', manager: 'John Doe', status: 'in-progress', progress: 65, deadline: '2023-08-15', tasks: 12 },
    { id: 2, name: 'Inventory System', manager: 'Jane Smith', status: 'planning', progress: 10, deadline: '2023-09-30', tasks: 8 },
    { id: 3, name: 'New Product Launch', manager: 'Bob Johnson', status: 'completed', progress: 100, deadline: '2023-07-20', tasks: 15 },
    { id: 4, name: 'Employee Training', manager: 'Alice Brown', status: 'in-progress', progress: 40, deadline: '2023-08-10', tasks: 6 }
  ]);

  return (
    <Container fluid>
      <h1 className="mb-4">Operations & Control</h1>
      
      <Row>
        <Col lg={12}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5>Project Management</h5>
              <Button variant="primary">New Project</Button>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Project Name</th>
                      <th>Manager</th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th>Deadline</th>
                      <th>Tasks</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map(project => (
                      <tr key={project.id}>
                        <td>{project.name}</td>
                        <td>{project.manager}</td>
                        <td>
                          <Badge bg={
                            project.status === 'completed' ? 'success' : 
                            project.status === 'in-progress' ? 'primary' : 'warning'
                          }>
                            {project.status.split('-').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                              <div 
                                className="progress-bar" 
                                role="progressbar" 
                                style={{ width: `${project.progress}%` }}
                                aria-valuenow={project.progress}
                                aria-valuemin="0"
                                aria-valuemax="100"
                              ></div>
                            </div>
                            <span>{project.progress}%</span>
                          </div>
                        </td>
                        <td>{project.deadline}</td>
                        <td>{project.tasks}</td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                          >
                            View
                          </Button>
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Operations;