import React, { useState } from 'react';
import { Row, Col, Card, Badge, Button, Dropdown, Form, InputGroup } from 'react-bootstrap';
import { FiPlus, FiMoreHorizontal, FiSearch, FiFilter, FiDollarSign, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Leads = () => {
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'

  const [leads, setLeads] = useState([
    { id: 1, title: 'Enterprise License Deal', company: 'Acme Corp', contact: 'John Doe', value: 50000, status: 'new', priority: 'high', date: '2025-12-01' },
    { id: 2, title: 'Web Redesign Project', company: 'StartUp Inc', contact: 'Sarah Lee', value: 12000, status: 'contacted', priority: 'medium', date: '2025-12-05' },
    { id: 3, title: 'Consulting Contract', company: 'Big Bank', contact: 'Mike Ross', value: 85000, status: 'proposal', priority: 'high', date: '2025-11-20' },
    { id: 4, title: 'Mobile App Dev', company: 'Techy', contact: 'Jane Smith', value: 25000, status: 'qualified', priority: 'medium', date: '2025-12-10' },
    { id: 5, title: 'Maintenance Plan', company: 'Local Shop', contact: 'Bob Brown', value: 2000, status: 'new', priority: 'low', date: '2025-12-15' },
    { id: 6, title: 'Cloud Migration', company: 'Data Systems', contact: 'Alice Green', value: 120000, status: 'negotiation', priority: 'high', date: '2025-11-15' },
  ]);

  const columns = [
    { id: 'new', title: 'New Leads', color: 'border-primary' },
    { id: 'contacted', title: 'Contacted', color: 'border-info' },
    { id: 'qualified', title: 'Qualified', color: 'border-warning' },
    { id: 'proposal', title: 'Proposal Sent', color: 'border-secondary' },
    { id: 'negotiation', title: 'Negotiation', color: 'border-danger' },
    { id: 'won', title: 'Closed Won', color: 'border-success' },
  ];

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high': return <Badge bg="danger" className="rounded-pill">High</Badge>;
      case 'medium': return <Badge bg="warning" text="dark" className="rounded-pill">Medium</Badge>;
      case 'low': return <Badge bg="info" className="rounded-pill">Low</Badge>;
      default: return <Badge bg="secondary" className="rounded-pill">Normal</Badge>;
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <span>
        Delete this lead?
        <div className="mt-2 d-flex gap-2">
          <Button size="sm" variant="danger" onClick={() => {
            setLeads(leads.filter(l => l.id !== id));
            toast.dismiss(t.id);
            toast.success('Lead removed');
          }}>
            Delete
          </Button>
          <Button size="sm" variant="light" onClick={() => toast.dismiss(t.id)}>
            Cancel
          </Button>
        </div>
      </span>
    ), { duration: 5000 });
  };

  return (
    <div className="leads-wrapper">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Leads Pipeline</h2>
          <p className="text-muted mb-0">Track and manage your sales opportunities.</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <div className="btn-group" role="group">
            <input type="radio" className="btn-check" name="viewMode" id="kanban" checked={viewMode === 'kanban'} onChange={() => setViewMode('kanban')} />
            <label className="btn btn-outline-secondary" htmlFor="kanban">Board</label>
            <input type="radio" className="btn-check" name="viewMode" id="list" checked={viewMode === 'list'} onChange={() => setViewMode('list')} />
            <label className="btn btn-outline-secondary" htmlFor="list">List</label>
          </div>
          <Button variant="primary" className="d-flex align-items-center" onClick={() => toast.success('Lead creation coming soon!')}>
            <FiPlus className="me-2" /> New Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <FiSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control placeholder="Search leads..." className="bg-light border-start-0 ps-0" />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select className="bg-light border-0">
                <option>All Owners</option>
                <option>My Leads</option>
                <option>Unassigned</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select className="bg-light border-0">
                <option>All Priorities</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </Form.Select>
            </Col>
            <Col md={2} className="text-end">
              <span className="text-muted fw-medium small">Total Value: </span>
              <span className="fw-bold text-dark">${leads.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}</span>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
        <div className="d-flex overflow-auto pb-4" style={{ gap: '1.5rem', minHeight: 'calc(100vh - 250px)' }}>
          {columns.map(col => (
            <div key={col.id} style={{ minWidth: '300px', width: '300px' }}>
              <div className={`d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom ${col.color} border-3`}>
                <h6 className="fw-bold mb-0 text-uppercase text-secondary" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                  {col.title}
                </h6>
                <Badge bg="light" text="dark" className="rounded-pill border">
                  {leads.filter(l => l.status === col.id).length}
                </Badge>
              </div>

              <div className="d-flex flex-column gap-3">
                {leads.filter(l => l.status === col.id).map(lead => (
                  <Card key={lead.id} className="border-0 shadow-sm cursor-pointer hover-shadow transition-all">
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        {getPriorityBadge(lead.priority)}
                        <Dropdown align="end">
                          <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret" size="sm">
                            <FiMoreHorizontal />
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="border-0 shadow-sm">
                            <Dropdown.Item onClick={() => toast.success('Editing lead...')}>Edit</Dropdown.Item>
                            <Dropdown.Item onClick={() => toast.success('Moving lead status...')}>Move to...</Dropdown.Item>
                            <Dropdown.Item className="text-danger" onClick={() => handleDelete(lead.id)}>Delete</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                      <h6 className="fw-bold mb-1">{lead.title}</h6>
                      <p className="text-muted small mb-2">{lead.company}</p>

                      <div className="d-flex align-items-center text-dark fw-bold mb-3">
                        <FiDollarSign className="text-muted me-1" size={14} />
                        {lead.value.toLocaleString()}
                      </div>

                      <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
                        <div className="d-flex align-items-center text-muted small">
                          <FiUser className="me-1" /> {lead.contact}
                        </div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                          {lead.date}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
                <Button variant="light" className="text-muted border-dashed w-100 py-2" onClick={() => toast.success('Deal creation coming soon!')}>
                  <FiPlus /> Add Deal
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View (Simple Placeholder) */}
      {viewMode === 'list' && (
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <p className="text-muted text-center py-5">List view is under construction. Switch to Board view.</p>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default Leads;