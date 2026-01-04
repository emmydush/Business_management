import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const Tasks = () => {
  return (
    <Container fluid>
      <h1 className="mb-4">Tasks</h1>
      
      <Row>
        <Col lg={12}>
          <Card>
            <Card.Header>
              <h5>Task Management</h5>
            </Card.Header>
            <Card.Body>
              <p>Task management functionality will be implemented here.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Tasks;