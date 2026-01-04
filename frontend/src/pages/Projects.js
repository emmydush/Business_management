import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const Projects = () => {
  return (
    <Container fluid>
      <h1 className="mb-4">Projects</h1>
      
      <Row>
        <Col lg={12}>
          <Card>
            <Card.Header>
              <h5>Project Management</h5>
            </Card.Header>
            <Card.Body>
              <p>Project management functionality will be implemented here.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Projects;