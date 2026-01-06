import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, InputGroup, Form, Dropdown } from 'react-bootstrap';
import { FiBox, FiSearch, FiMoreVertical, FiEdit2, FiTrash2, FiMapPin, FiUser, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import { assetsAPI } from '../services/api';

const Assets = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ total_assets: 0, assigned: 0, available: 0, in_repair: 0 });
    const { formatCurrency } = useCurrency();

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const response = await assetsAPI.getAssets({ search: searchTerm });
            setAssets(response.data.assets || []);
            setStats(response.data.stats || { total_assets: 0, assigned: 0, available: 0, in_repair: 0 });
            setError(null);
        } catch (err) {
            setError('Failed to load assets');
            console.error('Error fetching assets:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredAssets = assets.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.user && `${asset.user.first_name} ${asset.user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="assets-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Asset Management</h2>
                    <p className="text-muted mb-0">Track and manage company physical assets and equipment.</p>
                </div>
                <Button variant="primary" className="d-flex align-items-center mt-3 mt-md-0" onClick={() => toast('New asset registration form would open here')}>
                    <FiBox className="me-2" /> Register New Asset
                </Button>
            </div>

            <Row className="g-4 mb-4">
                <Col md={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Total Assets</div>
                            <h3 className="fw-bold mb-0">{stats.total_assets}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Assigned</div>
                            <h3 className="fw-bold mb-0 text-primary">{stats.assigned}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">Available</div>
                            <h3 className="fw-bold mb-0 text-success">{stats.available}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small fw-medium mb-1">In Repair</div>
                            <h3 className="fw-bold mb-0 text-danger">{stats.in_repair}</h3>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <div className="p-3 border-bottom">
                        <InputGroup style={{ maxWidth: '400px' }}>
                            <InputGroup.Text className="bg-light border-0">
                                <FiSearch className="text-muted" />
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Search by name, serial, or user..."
                                className="bg-light border-0 ps-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </div>

                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="ps-4 py-3 border-0">Asset Name</th>
                                    <th className="py-3 border-0">Category</th>
                                    <th className="py-3 border-0">Serial Number</th>
                                    <th className="py-3 border-0">Assigned To</th>
                                    <th className="py-3 border-0">Value</th>
                                    <th className="py-3 border-0">Status</th>
                                    <th className="text-end pe-4 py-3 border-0">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAssets.map(asset => (
                                    <tr key={asset.id}>
                                        <td className="ps-4">
                                            <div className="fw-bold text-dark">{asset.name}</div>
                                        </td>
                                        <td><Badge bg="light" text="dark" className="border fw-normal">{asset.category}</Badge></td>
                                        <td className="text-muted small">{asset.serial_number}</td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                {asset.user !== '-' && <div className="bg-light rounded-circle p-1 me-2"><FiUser size={12} /></div>}
                                                <span className="small">{asset.user ? `${asset.user.first_name} ${asset.user.last_name}` : '-'}</span>
                                            </div>
                                        </td>
                                        <td className="fw-medium">{formatCurrency(asset.value)}</td>
                                        <td>
                                            <Badge bg={asset.status === 'Assigned' ? 'primary' : asset.status === 'Available' ? 'success' : asset.status === 'In Repair' ? 'danger' : 'secondary'} className="fw-normal">
                                                {asset.status}
                                            </Badge>
                                        </td>
                                        <td className="text-end pe-4">
                                            <Dropdown align="end">
                                                <Dropdown.Toggle variant="link" className="text-muted p-0 no-caret">
                                                    <FiMoreVertical size={20} />
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu className="border-0 shadow-sm">
                                                    <Dropdown.Item className="d-flex align-items-center py-2"><FiEdit2 className="me-2 text-muted" /> Edit</Dropdown.Item>
                                                    <Dropdown.Item className="d-flex align-items-center py-2"><FiMapPin className="me-2 text-muted" /> Track Location</Dropdown.Item>
                                                    <Dropdown.Divider />
                                                    <Dropdown.Item className="d-flex align-items-center py-2 text-danger"><FiTrash2 className="me-2" /> Retire Asset</Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Assets;
