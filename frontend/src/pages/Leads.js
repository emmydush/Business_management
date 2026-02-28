import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, InputGroup, Badge } from 'react-bootstrap';
import { FiPlus, FiSearch, FiUser, FiDollarSign, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { leadsAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [currentLead, setCurrentLead] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { formatCurrency } = useCurrency();

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const res = await leadsAPI.getLeads();
        setLeads(res.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching leads:', err);
        setError('Failed to load leads.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const columns = [
    { id: 'contacted', title: 'Contacted', color: 'border-primary' },
    { id: 'qualified', title: 'Qualified', color: 'border-info' },
    { id: 'proposal', title: 'Proposal', color: 'border-warning' },
    { id: 'negotiation', title: 'Negotiation', color: 'border-danger' },
    { id: 'won', title: 'Closed Won', color: 'border-success' },
  ];

  const filteredLeads = leads.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return [
      l.title,
      l.company,
      l.contact_name || l.contact,
      l.email,
      l.phone,
      String(l.value)
    ].some((field) => (field || '').toString().toLowerCase().includes(q));
  });

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
          <Button size="sm" variant="danger" onClick={async () => {
            try {
              await leadsAPI.deleteLead(id);
              setLeads(leads.filter(l => l.id !== id));
              toast.dismiss(t.id);
              toast.success('Lead removed');
            } catch (err) {
              toast.dismiss(t.id);
              toast.error('Failed to delete lead');
              console.error('Error deleting lead:', err);
            }
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

  const handleEdit = (lead) => {
    setCurrentLead(lead);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.target);
    const leadData = {
      title: formData.get('title'),
      company: formData.get('company'),
      contact_name: formData.get('contact_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      value: parseFloat(formData.get('value') || 0),
      status: formData.get('status'),
      priority: formData.get('priority'),
      assigned_to: formData.get('assigned_to') ? parseInt(formData.get('assigned_to')) : null
    };

    try {
      if (currentLead) {
        await leadsAPI.updateLead(currentLead.id, leadData);
        toast.success('Lead updated');
      } else {
        await leadsAPI.createLead(leadData);
        toast.success('Lead created');
      }
      setShowModal(false);
      setCurrentLead(null);
      // Refresh lead list
      const res = await leadsAPI.getLeads();
      setLeads(res.data || []);
    } catch (err) {
      toast.error('Failed to save lead');
      console.error('Error saving lead:', err);
    } finally {
      setIsSaving(false);
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
          <Button variant="primary" className="d-flex align-items-center" onClick={() => { setCurrentLead(null); setShowModal(true); }}>
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
                <InputGroup.Text className="lead-search-icon">
                  <FiSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search leads..."
                  className="lead-search-control"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
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
              <span className="fw-bold text-dark">{formatCurrency(leads.reduce((acc, curr) => acc + (curr.value || 0), 0))}</span>
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
                  {filteredLeads.filter(l => l.status === col.id).length}
                </Badge>
              </div>

              <div className="d-flex flex-column gap-3">
                {filteredLeads.filter(l => l.status === col.id).map(lead => (
                  <Card key={lead.id} className="border-0 shadow-sm cursor-pointer hover-shadow transition-all">
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center">
                          {getPriorityBadge(lead.priority)}
                        </div>
                        <div className="d-flex gap-1 gap-md-2">
                          <Button variant="outline-warning" size="sm" className="d-flex align-items-center" onClick={() => handleEdit(lead)} title="Edit Lead">
                            <FiEdit2 size={14} />
                          </Button>
                          <Button variant="outline-danger" size="sm" className="d-flex align-items-center" onClick={() => handleDelete(lead.id)} title="Delete Lead">
                            <FiTrash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      <h6 className="fw-bold mb-1">{lead.title}</h6>
                      <p className="text-muted small mb-2">{lead.company}</p>

                      <div className="d-flex align-items-center text-dark fw-bold mb-3">
                        <FiDollarSign className="text-muted me-1" size={14} />
                        {formatCurrency(lead.value || 0)}
                      </div>

                      <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
                        <div className="d-flex align-items-center text-muted small">
                          <FiUser className="me-1" /> {lead.contact_name || lead.contact}
                        </div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                          {lead.created_at || lead.date}
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

      {/* Lead Modal */}
      <Modal show={showModal} onHide={() => { setShowModal(false); setCurrentLead(null); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>{currentLead ? `Edit Lead: ${currentLead.title}` : 'Create New Lead'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSave}>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Title</Form.Label>
                  <Form.Control name="title" defaultValue={currentLead?.title || ''} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Company</Form.Label>
                  <Form.Control name="company" defaultValue={currentLead?.company || ''} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Contact Name</Form.Label>
                  <Form.Control name="contact_name" defaultValue={currentLead?.contact_name || ''} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Email</Form.Label>
                  <Form.Control type="email" name="email" defaultValue={currentLead?.email || ''} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Phone</Form.Label>
                  <Form.Control name="phone" defaultValue={currentLead?.phone || ''} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Value</Form.Label>
                  <Form.Control type="number" step="0.01" name="value" defaultValue={currentLead?.value || ''} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Status</Form.Label>
                  <Form.Select name="status" defaultValue={currentLead?.status || 'contacted'}>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="won">Closed Won</option>
                    <option value="lost">Closed Lost</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Priority</Form.Label>
                  <Form.Select name="priority" defaultValue={currentLead?.priority || 'medium'}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="light" onClick={() => { setShowModal(false); setCurrentLead(null); }}>Close</Button>
              <Button variant="primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Lead'}</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
          /* Mobile Responsive Styles for Leads */
          .lead-search-control {
            background: #ffffff !important;
            color: #111827 !important;
            border: 2px solid #93c5fd !important;
            border-left: 0 !important;
            border-radius: 9999px !important;
            padding-left: 0.5rem !important;
            height: 48px !important;
          }
          .lead-search-control::placeholder {
            color: #6b7280 !important;
          }
          .lead-search-control:focus {
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 4px rgba(59,130,246,0.15) !important;
          }
          .lead-search-icon {
            background: #ffffff !important;
            border: 2px solid #93c5fd !important;
            border-right: 0 !important;
            border-radius: 9999px 0 0 9999px !important;
            padding: 0 14px !important;
            height: 48px !important;
            display: flex;
            align-items: center;
          }
          @media (max-width: 767.98px) {
            .card {
              margin-bottom: 12px;
            }
            
            .card .card-body {
              padding: 12px !important;
            }
            
            .btn-sm {
              padding: 0.35rem 0.5rem !important;
              font-size: 0.75rem !important;
            }
          }
          
          @media (max-width: 575.98px) {
            .card .card-body {
              padding: 10px !important;
            }
            
            .btn-sm {
              padding: 0.3rem 0.4rem !important;
              font-size: 0.65rem !important;
            }
          }
          
          /* Ensure action buttons are always visible */
          .btn {
            display: inline-flex !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
        `
      }} />
    </div>
  );
};

export default Leads;
