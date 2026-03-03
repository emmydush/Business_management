import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Form, InputGroup } from 'react-bootstrap';
import { superadminAPI } from '../services/api';
import { FiKey, FiRefreshCw, FiTrash2, FiSearch, FiShield } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
 
const SuperAdminApiKeys = () => {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [filters, setFilters] = useState({ business_id: '', client_id: '' });
  const [refreshing, setRefreshing] = useState(false);
 
  const loadData = async () => {
    setLoading(true);
    try {
      const [clientsRes, tokensRes] = await Promise.all([
        superadminAPI.getAllApiClients(filters.business_id ? { business_id: filters.business_id } : {}),
        superadminAPI.getAllApiTokens({
          ...(filters.business_id ? { business_id: filters.business_id } : {}),
          ...(filters.client_id ? { client_id: filters.client_id } : {})
        })
      ]);
      setClients(clientsRes.data.clients || []);
      setTokens(tokensRes.data.tokens || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
 
  const handleSearch = async (e) => {
    e.preventDefault();
    await loadData();
  };
 
  const handleRevoke = async (tokenId) => {
    if (!window.confirm('Revoke this API token? This action cannot be undone.')) return;
    try {
      await superadminAPI.revokeApiToken(tokenId);
      toast.success('Token revoked');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to revoke token');
    }
  };
 
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
        <Spinner animation="border" variant="danger" />
      </div>
    );
  }
 
  return (
    <div className="superadmin-api-keys py-4">
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold text-white mb-1">API Keys Management</h2>
            <p className="text-muted mb-0">View and revoke API clients and tokens across all businesses.</p>
          </div>
          <Button
            variant="outline-danger"
            className="d-flex align-items-center gap-2"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FiRefreshCw className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
 
        <Card className="bg-dark text-white border-0 mb-4">
          <Card.Body>
            <Form onSubmit={handleSearch}>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Label className="text-white-50">Business ID</Form.Label>
                  <Form.Control
                    type="number"
                    value={filters.business_id}
                    onChange={(e) => setFilters({ ...filters, business_id: e.target.value })}
                    placeholder="Filter by business ID"
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="text-white-50">Client ID</Form.Label>
                  <Form.Control
                    type="number"
                    value={filters.client_id}
                    onChange={(e) => setFilters({ ...filters, client_id: e.target.value })}
                    placeholder="Filter by client ID"
                  />
                </Col>
                <Col md={4} className="d-flex align-items-end">
                  <Button type="submit" variant="danger" className="d-flex align-items-center gap-2">
                    <FiSearch />
                    Search
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
 
        <Row className="g-4">
          <Col lg={6}>
            <Card className="bg-dark text-white border-0 h-100">
              <Card.Header className="bg-transparent d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <FiKey />
                  <span className="fw-bold">API Clients</span>
                </div>
                <Badge bg="danger">{clients.length}</Badge>
              </Card.Header>
              <Card.Body className="p-0">
                <Table hover responsive className="mb-0 table-dark">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Business</th>
                      <th>Type</th>
                      <th>Rate Limit</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c) => (
                      <tr key={c.id}>
                        <td>{c.client_name}</td>
                        <td>
                          <div className="small">
                            <div className="text-white-50">ID: {c.business_id}</div>
                            <div>{c.business_name || 'Unknown'}</div>
                          </div>
                        </td>
                        <td className="text-capitalize">{(c.client_type || '').toLowerCase()}</td>
                        <td>{c.rate_limit_per_hour}</td>
                        <td>
                          <Badge bg={c.is_active ? 'success' : 'secondary'}>{c.is_active ? 'Active' : 'Inactive'}</Badge>
                        </td>
                        <td>{new Date(c.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {clients.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center text-white-50 py-4">No clients found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
 
          <Col lg={6}>
            <Card className="bg-dark text-white border-0 h-100">
              <Card.Header className="bg-transparent d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <FiShield />
                  <span className="fw-bold">Access Tokens</span>
                </div>
                <Badge bg="danger">{tokens.length}</Badge>
              </Card.Header>
              <Card.Body className="p-0">
                <Table hover responsive className="mb-0 table-dark">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Business</th>
                      <th>Scopes</th>
                      <th>Expires</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.map((t) => (
                      <tr key={t.id}>
                        <td>{t.client_name || t.client_id}</td>
                        <td>
                          <div className="small">
                            <div className="text-white-50">ID: {t.business_id}</div>
                            <div>{t.business_name || 'Unknown'}</div>
                          </div>
                        </td>
                        <td className="small">{Array.isArray(t.scopes) ? t.scopes.join(', ') : (t.scopes || '').toString()}</td>
                        <td>{t.expires_at ? new Date(t.expires_at).toLocaleString() : 'Never'}</td>
                        <td>
                          <Badge bg={t.is_revoked ? 'secondary' : 'success'}>{t.is_revoked ? 'Revoked' : 'Active'}</Badge>
                        </td>
                        <td>
                          {!t.is_revoked && (
                            <Button variant="outline-danger" size="sm" className="d-flex align-items-center gap-2" onClick={() => handleRevoke(t.id)}>
                              <FiTrash2 />
                              Revoke
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {tokens.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center text-white-50 py-4">No tokens found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};
 
export default SuperAdminApiKeys;
