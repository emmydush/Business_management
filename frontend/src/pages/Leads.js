import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, InputGroup, Badge, Dropdown } from 'react-bootstrap';
import { FiPlus, FiSearch, FiMoreHorizontal, FiUser, FiDollarSign, FiPrinter, FiDownload, FiBarChart2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { leadsAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import SubscriptionGuard from '../components/SubscriptionGuard';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [currentLead, setCurrentLead] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Dropdown state management
  const [openDropdowns, setOpenDropdowns] = useState({});

  const { formatCurrency } = useCurrency();

  // Dropdown helper functions
  const toggleDropdown = (id) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const closeDropdown = (id) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [id]: false
    }));
  };

  const closeAllDropdowns = () => {
    setOpenDropdowns({});
  };

  // Print functionality
  const handlePrint = () => {
    // Create print window content
    const printContent = `
      <html>
        <head>
          <title>Prospects Pipeline Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Prospects Pipeline Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="summary">
            <h3>Summary</h3>
            <p>Total Prospects: ${leads.length}</p>
            <p>Total Value: ${formatCurrency(leads.reduce((acc, curr) => acc + (curr.value || 0), 0))}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Prospect</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Value</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              ${leads.map(lead => `
                <tr>
                  <td>${lead.title || 'N/A'}</td>
                  <td>${lead.company || 'N/A'}</td>
                  <td>${lead.contact_name || lead.contact || 'N/A'}</td>
                  <td>${formatCurrency(lead.value || 0)}</td>
                  <td>${lead.status || 'N/A'}</td>
                  <td>${lead.priority || 'N/A'}</td>
                  <td>${lead.created_at || lead.date || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Export to CSV functionality
  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['Prospect', 'Company', 'Contact', 'Email', 'Phone', 'Value', 'Status', 'Priority', 'Created'];
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => [
        `"${lead.title || 'N/A'}"`,
        `"${lead.company || 'N/A'}"`,
        `"${lead.contact_name || lead.contact || 'N/A'}"`,
        `"${lead.email || 'N/A'}"`,
        `"${lead.phone || 'N/A'}"`,
        `"${lead.value || 0}"`,
        `"${lead.status || 'N/A'}"`,
        `"${lead.priority || 'N/A'}"`,
        `"${lead.created_at || lead.date || 'N/A'}"`
      ].join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `prospects-pipeline-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Prospects exported successfully!');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any dropdown
      if (!event.target.closest('.position-relative')) {
        closeAllDropdowns();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const res = await leadsAPI.getLeads();
        setLeads(res.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching leads:', err);
        setError('Failed to load prospects.');
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
        Delete this prospect?
        <div className="mt-2 d-flex gap-2">
          <Button size="sm" variant="danger" onClick={async () => {
            try {
              await leadsAPI.deleteLead(id);
              setLeads(leads.filter(l => l.id !== id));
              toast.dismiss(t.id);
              toast.success('Prospect removed');
            } catch (err) {
              toast.dismiss(t.id);
              toast.error('Failed to delete prospect');
              console.error('Error deleting prospect:', err);
            }
          }}>
            Delete
          </Button>
          <Button size="sm" variant="light" onClick={() => toast.dismiss(t.id)}>
            Cancel
          </Button>
        </div>
      </span>
    ), { duration: 3000 });
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
        toast.success('Prospect updated');
      } else {
        await leadsAPI.createLead(leadData);
        toast.success('Prospect created');
      }
      setShowModal(false);
      setCurrentLead(null);
      const res = await leadsAPI.getLeads();
      setLeads(res.data || []);
    } catch (err) {
      toast.error('Failed to save prospect');
      console.error('Error saving prospect:', err);
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
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Prospects Pipeline</h2>
          <p className="text-muted mb-0">Track and manage your sales opportunities.</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <div className="btn-group" role="group">
            <input type="radio" className="btn-check" name="viewMode" id="kanban" checked={viewMode === 'kanban'} onChange={() => setViewMode('kanban')} />
            <label className="btn btn-outline-secondary" htmlFor="kanban">Board</label>
            <input type="radio" className="btn-check" name="viewMode" id="list" checked={viewMode === 'list'} onChange={() => setViewMode('list')} />
            <label className="btn btn-outline-secondary" htmlFor="list">List</label>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" className="d-flex align-items-center" onClick={handlePrint}>
              <FiPrinter className="me-2" /> Print
            </Button>
            <Button variant="outline-secondary" className="d-flex align-items-center" onClick={handleExportCSV}>
              <FiDownload className="me-2" /> Export
            </Button>
          </div>
          <SubscriptionGuard message="Renew your subscription to add new prospects">
            <Button variant="primary" className="d-flex align-items-center" onClick={() => { setCurrentLead(null); setShowModal(true); }}>
              <FiPlus className="me-2" /> New Prospect
            </Button>
          </SubscriptionGuard>
        </div>
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <FiSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control placeholder="Search prospects..." className="bg-light border-start-0 ps-0" />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select className="bg-light border-0">
                <option>All Owners</option>
                <option>My Prospects</option>
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
                        <div className="position-relative">
                          <button 
                            className="btn btn-link text-muted p-0 no-caret" 
                            type="button" 
                            onClick={() => toggleDropdown(`board-${lead.id}`)}
                            style={{ fontSize: '1rem' }}
                          >
                            <FiMoreHorizontal />
                          </button>
                          {openDropdowns[`board-${lead.id}`] && (
                            <div className="dropdown-menu border-0 shadow-sm dropdown-menu-end show position-absolute" style={{ right: 0, top: '100%', zIndex: 1000 }}>
                              <button className="dropdown-item" onClick={() => { handleEdit(lead); closeDropdown(`board-${lead.id}`); }}>Edit</button>
                              <button className="dropdown-item" onClick={() => { toast.success('Moving prospect status...'); closeDropdown(`board-${lead.id}`); }}>Move to...</button>
                              <button className="dropdown-item text-danger" onClick={() => { handleDelete(lead.id); closeDropdown(`board-${lead.id}`); }}>Delete</button>
                            </div>
                          )}
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
                <SubscriptionGuard message="Renew your subscription to add new prospects">
                  <Button variant="light" className="text-muted border-dashed w-100 py-2" onClick={() => { setCurrentLead(null); setShowModal(true); }}>
                    <FiPlus /> Add Prospect
                  </Button>
                </SubscriptionGuard>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4" style={{ width: '20%' }}>Prospect</th>
                    <th style={{ width: '15%' }}>Company</th>
                    <th style={{ width: '15%' }}>Contact</th>
                    <th style={{ width: '10%' }}>Value</th>
                    <th style={{ width: '10%' }}>Status</th>
                    <th style={{ width: '10%' }}>Priority</th>
                    <th style={{ width: '10%' }}>Created</th>
                    <th className="pe-4" style={{ width: '10%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => (
                    <tr key={lead.id}>
                      <td className="ps-4">
                        <div className="fw-bold">{lead.title}</div>
                      </td>
                      <td>{lead.company}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FiUser className="text-muted me-2" />
                          {lead.contact_name || lead.contact || 'N/A'}
                        </div>
                      </td>
                      <td>{formatCurrency(lead.value || 0)}</td>
                      <td>
                        <Badge bg={
                          lead.status === 'contacted' ? 'primary' :
                          lead.status === 'qualified' ? 'info' :
                          lead.status === 'proposal' ? 'warning' :
                          lead.status === 'negotiation' ? 'danger' :
                          lead.status === 'won' ? 'success' : 'secondary'
                        }>
                          {columns.find(c => c.id === lead.status)?.title || lead.status}
                        </Badge>
                      </td>
                      <td>{getPriorityBadge(lead.priority)}</td>
                      <td>{lead.created_at || lead.date || 'N/A'}</td>
                      <td className="pe-4">
                        <div className="position-relative">
                          <button 
                            className="btn btn-link text-muted p-0 no-caret" 
                            type="button" 
                            onClick={() => toggleDropdown(`list-${lead.id}`)}
                            style={{ fontSize: '1rem' }}
                          >
                            <FiMoreHorizontal />
                          </button>
                          {openDropdowns[`list-${lead.id}`] && (
                            <div className="dropdown-menu border-0 shadow-sm dropdown-menu-end show position-absolute" style={{ right: 0, top: '100%', zIndex: 1000 }}>
                              <button className="dropdown-item" onClick={() => { handleEdit(lead); closeDropdown(`list-${lead.id}`); }}>Edit</button>
                              <button className="dropdown-item" onClick={() => { toast.success('Moving prospect status...'); closeDropdown(`list-${lead.id}`); }}>Move to...</button>
                              <button className="dropdown-item text-danger" onClick={() => { handleDelete(lead.id); closeDropdown(`list-${lead.id}`); }}>Delete</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {leads.length === 0 && (
              <div className="text-center py-5">
                <p className="text-muted mb-0">No prospects found</p>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      <Modal show={showModal} onHide={() => { setShowModal(false); setCurrentLead(null); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>{currentLead ? `Edit Prospect: ${currentLead.title}` : 'Create New Prospect'}</Modal.Title>
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
              <Button variant="primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Prospect'}</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Leads;

// Add custom CSS for dropdown behavior
const dropdownStyles = `
  .dropdown-item {
    transition: background-color 0.15s ease !important;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    display: block;
    padding: 0.25rem 1rem;
  }
  
  .dropdown-item:hover {
    background-color: #f8f9fa !important;
    cursor: pointer;
  }
  
  .dropdown-menu {
    min-width: 10rem;
    padding: 0.5rem 0;
    margin: 0;
    font-size: 0.875rem;
    color: #212529;
    text-align: left;
    list-style: none;
    background-color: #fff;
    background-clip: padding-box;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 0.375rem;
  }
`;

// Inject the styles
const styleSheet = document.createElement("style");
styleSheet.innerText = dropdownStyles;
document.head.appendChild(styleSheet);
