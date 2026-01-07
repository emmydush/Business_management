import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Alert } from 'react-bootstrap';
import { FiPlus, FiSearch, FiArrowUpRight, FiArrowDownLeft, FiRefreshCw, FiBox } from 'react-icons/fi';
import { inventoryAPI } from '../services/api';
import toast from 'react-hot-toast';

const StockMovements = () => {
    const [movements, setMovements] = useState([]);
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Fetch both products and inventory transactions
            const [productsRes, transactionsRes] = await Promise.all([
                inventoryAPI.getProducts(),
                inventoryAPI.getInventoryTransactions()
            ]);
            
            setProducts(productsRes.data.products || []);
            
            // Transform inventory transactions to movements format
            const transformedMovements = Array.isArray(transactionsRes.data.transactions) ? 
                transactionsRes.data.transactions.map(tx => ({
                    id: tx.id,
                    product: tx.product?.name || 'Unknown Product',
                    type: tx.transaction_type.includes('IN') ? 'in' : 'out',
                    quantity: tx.quantity,
                    date: tx.created_at ? new Date(tx.created_at).toLocaleString() : 'N/A',
                    reason: tx.notes || tx.transaction_type,
                    user: tx.user?.username || tx.user?.first_name || 'System'
                })) : [];
            
            setMovements(transformedMovements);
        } catch (err) {
            console.error('Error fetching stock movement data:', err);
            console.error('Error details:', err.response || err.message || err);
            
            // Show more specific error message
            if (err.response) {
                toast.error(`Failed to load stock movement data: ${err.response.status} ${err.response.statusText}`);
            } else {
                toast.error('Failed to load stock movement data: Network error');
            }
            
            // Fallback to empty array
            setMovements([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAdjustment = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const adjustmentData = {
            product_id: formData.get('product_id'),
            quantity: parseInt(formData.get('quantity')),
            adjustment_type: formData.get('type') === 'add' ? 'IN' : 'OUT',
            reason: formData.get('reason')
        };

        setIsSaving(true);
        try {
            await inventoryAPI.adjustStock(adjustmentData);
            toast.success('Stock adjusted successfully!');
            fetchData();
            setShowModal(false);
        } catch (err) {
            toast.error('Failed to adjust stock.');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredMovements = movements.filter(m =>
        m.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.reason.toLowerCase().includes(searchTerm.toLowerCase())
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

    return (
        <div className="stock-movements-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Stock In / Out</h2>
                    <p className="text-muted mb-0">Track all inventory movements and adjustments.</p>
                </div>
                <Button variant="primary" className="d-flex align-items-center mt-3 mt-md-0" onClick={() => setShowModal(true)}>
                    <FiPlus className="me-2" /> New Adjustment
                </Button>
            </div>

            <Row className="g-4 mb-4">
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                                <FiArrowUpRight className="text-success" size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-medium">Total Stock In</div>
                                <h4 className="fw-bold mb-0">{movements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.quantity, 0)} Units</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-danger bg-opacity-10 p-3 rounded me-3">
                                <FiArrowDownLeft className="text-danger" size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-medium">Total Stock Out</div>
                                <h4 className="fw-bold mb-0">{movements.filter(m => m.type === 'out').reduce((sum, m) => sum + m.quantity, 0)} Units</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                                <FiRefreshCw className="text-primary" size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-medium">Net Movement</div>
                                <h4 className="fw-bold mb-0">{(() => {
                                    const stockIn = movements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.quantity, 0);
                                    const stockOut = movements.filter(m => m.type === 'out').reduce((sum, m) => sum + m.quantity, 0);
                                    const net = stockIn - stockOut;
                                    return `${net >= 0 ? '+' : ''}${net} Units`;
                                })()}</h4>
                            </div>
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
                                placeholder="Search movement history..."
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
                                    <th className="border-0 py-3 ps-4">Product</th>
                                    <th className="border-0 py-3">Type</th>
                                    <th className="border-0 py-3">Quantity</th>
                                    <th className="border-0 py-3">Reason</th>
                                    <th className="border-0 py-3">Date & Time</th>
                                    <th className="border-0 py-3 text-end pe-4">User</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMovements.map(m => (
                                    <tr key={m.id}>
                                        <td className="ps-4 fw-bold text-dark">{m.product}</td>
                                        <td>
                                            <Badge bg={m.type === 'in' ? 'success' : 'danger'} className="fw-normal">
                                                {m.type === 'in' ? 'Stock In' : 'Stock Out'}
                                            </Badge>
                                        </td>
                                        <td className={`fw-bold ${m.type === 'in' ? 'text-success' : 'text-danger'}`}>
                                            {m.type === 'in' ? '+' : '-'}{m.quantity}
                                        </td>
                                        <td className="text-muted small">{m.reason}</td>
                                        <td className="text-muted small">{m.date}</td>
                                        <td className="text-end pe-4 small fw-medium">{m.user}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Stock Adjustment</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-4">
                    <Form onSubmit={handleAdjustment}>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small">Select Product</Form.Label>
                            <Form.Select name="product_id" required>
                                <option value="">Choose a product...</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (Current: {p.stock_quantity})</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Row className="g-3 mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Adjustment Type</Form.Label>
                                    <Form.Select name="type" required>
                                        <option value="add">Stock In (+)</option>
                                        <option value="subtract">Stock Out (-)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Quantity</Form.Label>
                                    <Form.Control name="quantity" type="number" min="1" required />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold small">Reason / Reference</Form.Label>
                            <Form.Control name="reason" as="textarea" rows={2} placeholder="e.g. Damaged during shipping, Restock from PO-102" required />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button variant="primary" type="submit" disabled={isSaving}>
                                {isSaving ? 'Processing...' : 'Confirm Adjustment'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default StockMovements;
