import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert } from 'react-bootstrap';
import { FiAlertTriangle, FiShoppingCart, FiRefreshCw, FiBox } from 'react-icons/fi';
import { inventoryAPI } from '../services/api';
import toast from 'react-hot-toast';

const LowStockAlerts = () => {
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLowStock();
    }, []);

    const fetchLowStock = async () => {
        try {
            setLoading(true);
            const response = await inventoryAPI.getProducts({ per_page: 1000 });
            const products = response.data.products || [];
            // Filter for products where stock is less than or equal to reorder level
            const lowStock = products.filter(p => p.stock_quantity <= p.reorder_level);
            setLowStockProducts(lowStock);
            setError(null);
        } catch (err) {
            setError('Failed to fetch low stock alerts.');
        } finally {
            setLoading(false);
        }
    };

    const handleReorder = (product) => {
        toast.success(`Reorder request initiated for ${product.name}`);
    };

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
        <div className="low-stock-alerts-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Low Stock Alerts</h2>
                    <p className="text-muted mb-0">Items that require immediate reordering.</p>
                </div>
                <Button variant="outline-primary" className="d-flex align-items-center mt-3 mt-md-0" onClick={fetchLowStock}>
                    <FiRefreshCw className="me-2" /> Refresh Alerts
                </Button>
            </div>

            {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

            {lowStockProducts.length === 0 ? (
                <Card className="border-0 shadow-sm text-center py-5">
                    <Card.Body>
                        <div className="bg-success bg-opacity-10 p-4 rounded-circle d-inline-block mb-3">
                            <FiBox className="text-success" size={48} />
                        </div>
                        <h4 className="fw-bold text-dark">All Stock Levels Normal</h4>
                        <p className="text-muted">No items are currently below their reorder level.</p>
                    </Card.Body>
                </Card>
            ) : (
                <>
                    <Row className="g-4 mb-4">
                        <Col md={6}>
                            <Card className="border-0 shadow-sm bg-danger bg-opacity-10">
                                <Card.Body className="d-flex align-items-center">
                                    <div className="bg-danger p-3 rounded me-3">
                                        <FiAlertTriangle className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="fw-bold text-danger mb-0">{lowStockProducts.filter(p => p.stock_quantity === 0).length}</h4>
                                        <div className="text-danger fw-medium">Out of Stock Items</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className="border-0 shadow-sm bg-warning bg-opacity-10">
                                <Card.Body className="d-flex align-items-center">
                                    <div className="bg-warning p-3 rounded me-3">
                                        <FiAlertTriangle className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="fw-bold text-warning mb-0">{lowStockProducts.filter(p => p.stock_quantity > 0).length}</h4>
                                        <div className="text-warning fw-medium">Low Stock Items</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Card className="border-0 shadow-sm">
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="mb-0 align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="border-0 py-3 ps-4">Product</th>
                                            <th className="border-0 py-3">Category</th>
                                            <th className="border-0 py-3">Current Stock</th>
                                            <th className="border-0 py-3">Reorder Level</th>
                                            <th className="border-0 py-3">Status</th>
                                            <th className="border-0 py-3 text-end pe-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lowStockProducts.map(p => (
                                            <tr key={p.id}>
                                                <td className="ps-4">
                                                    <div className="fw-bold text-dark">{p.name}</div>
                                                    <div className="small text-muted">{p.product_id}</div>
                                                </td>
                                                <td>
                                                    <Badge bg="light" text="dark" className="border fw-normal">
                                                        {p.category?.name || 'Uncategorized'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <span className={`fw-bold ${p.stock_quantity === 0 ? 'text-danger' : 'text-warning'}`}>
                                                        {p.stock_quantity}
                                                    </span>
                                                </td>
                                                <td className="text-muted fw-medium">{p.reorder_level}</td>
                                                <td>
                                                    <Badge bg={p.stock_quantity === 0 ? 'danger' : 'warning'} className="fw-normal">
                                                        {p.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                                                    </Badge>
                                                </td>
                                                <td className="text-end pe-4">
                                                    <Button variant="primary" size="sm" className="d-flex align-items-center ms-auto" onClick={() => handleReorder(p)}>
                                                        <FiShoppingCart className="me-2" /> Reorder
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </>
            )}
        </div>
    );
};

export default LowStockAlerts;
