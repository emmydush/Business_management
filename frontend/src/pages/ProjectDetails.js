import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, ProgressBar, Modal, Form } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await projectsAPI.getProject(id);
      setProject(res.data.project || res.data);
    } catch (err) {
      console.error('Failed to load project:', err);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const openEdit = () => {
    setEditData({
      title: project.title || '',
      client: project.client || '',
      budget: project.budget || 0,
      deadline: project.deadline || '',
      description: project.description || '',
      status: project.status || 'new',
      progress: project.progress || 0,
      members: project.members || 1
    });
    setShowEditModal(true);
  };

  const handleChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await projectsAPI.updateProject(project.id, {
        ...editData,
        budget: parseFloat(editData.budget) || 0,
        progress: parseInt(editData.progress) || 0,
        members: parseInt(editData.members) || 1
      });
      toast.success('Project updated');
      setShowEditModal(false);
      fetchProject();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save changes');
    }
  };

  if (loading) return <Container className="py-4"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></Container>;
  if (!project) return <Container className="py-4"><div className="alert alert-warning">Project not found</div></Container>;

  return (
    <Container fluid className="py-4">
      <Row>
        <Col md={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h3 className="fw-bold">{project.title}</h3>
                  <div className="text-muted small">Client: {project.client}</div>
                </div>
                <div>
                  <Button variant="light" className="me-2" onClick={() => navigate('/projects')}>Back</Button>
                  <Button variant="primary" onClick={openEdit}>Edit</Button>
                </div>
              </div>

              <p className="text-secondary">{project.description}</p>

              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Progress</strong>
                  <span>{project.progress}%</span>
                </div>
                <ProgressBar now={project.progress} />
              </div>

              <div className="mt-3 d-flex gap-4">
                <div><strong>Budget:</strong> ${project.budget}</div>
                <div><strong>Spent:</strong> ${project.spent || 0}</div>
                <div><strong>Deadline:</strong> {project.deadline}</div>
                <div><strong>Members:</strong> {project.members}</div>
                <div><strong>Status:</strong> {project.status}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Edit modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSave}>
            <Form.Group className="mb-2">
              <Form.Label>Title</Form.Label>
              <Form.Control name="title" value={editData.title} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Client</Form.Label>
              <Form.Control name="client" value={editData.client} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Budget</Form.Label>
              <Form.Control name="budget" type="number" value={editData.budget} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Deadline</Form.Label>
              <Form.Control name="deadline" type="date" value={editData.deadline} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Progress (%)</Form.Label>
              <Form.Control name="progress" type="number" min="0" max="100" value={editData.progress} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Description</Form.Label>
              <Form.Control name="description" as="textarea" rows={3} value={editData.description} onChange={handleChange} />
            </Form.Group>
            <div className="text-end mt-3">
              <Button variant="light" onClick={() => setShowEditModal(false)} className="me-2">Cancel</Button>
              <Button variant="primary" type="submit">Save</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ProjectDetails;