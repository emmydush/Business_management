import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge } from 'react-bootstrap';
import { FiPlus, FiSearch, FiArrowUpRight, FiArrowDownLeft, FiRefreshCw, FiPackage, FiCalendar, FiInfo, FiLayers } from 'react-icons/fi';
import { inventoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const StockMovements = () => {
    const [movements, setMovements] = useState([]);
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const type = queryParams.get('type');
        if (type && ['in', 'out'].includes(type)) {
            setFilterType(type);
        } else {
            setFilterType('all');
        }
    }, [location.search]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [productsRes, transactionsRes] = await Promise.all([
                inventoryAPI.getProducts({ per_page: 1000 }),
                inventoryAPI.getInventoryTransactions()
            ]);
            
            setProducts(productsRes.data.products || []);
            
            const transformedMovements = Array.isArray(transactionsRes.data.transactions) ? 
                transactionsRes.data.transactions.map(tx => ({
                    id: tx.id,
                    product: tx.product?.name || 'Unknown Product',
                    productId: tx.product_id,
                    type: tx.transaction_type.includes('IN') ? 'in' : 'out',
                    quantity: tx.quantity,
                    date: tx.created_at ? new Date(tx.created_at).toLocaleString() : 'N/A',
                    rawDate: tx.created_at,
                    reason: tx.notes || tx.transaction_type,
                    user: tx.user?.username || tx.user?.first_name || 'System'
                })) : [];
            
            // Sort by date descending
            transformedMovements.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
            setMovements(transformedMovements);
        } catch (err) {
            console.error('Error fetching stock movement data:', err);
            toast.error('Failed to load stock movement data');
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
            toast.error(err.response?.data?.error || 'Failed to adjust stock.');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredMovements = movements.filter(m => {
        const matchesSearch = m.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.reason.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || m.type === filterType;
        return matchesSearch && matchesType;
    });

    const stats = {
        totalIn: movements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.quantity, 0),
        totalOut: movements.filter(m => m.type === 'out').reduce((sum, m) => sum + m.quantity, 0),
        net: movements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.quantity, 0) - 
             movements.filter(m => m.type === 'out').reduce((sum, m) => sum + m.quantity, 0)
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    style={{ width: 40, height: 40, border: '3px solid #f3f3f3', borderTop: '3px solid #0f172a', borderRadius: '50%' }}
                />
            </div>
        );
    }

    return (
        <motion.div 
            className="stock-movements-wrapper p-4"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Header Section */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 mt-4">
                <motion.div variants={itemVariants}>
                    <h1 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.02em' }}>Inventory Movements</h1>
                    <p className="text-muted mb-0">Monitor and manage your stock levels with precision.</p>
                </motion.div>
                <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                        variant="dark" 
                        className="d-flex align-items-center px-4 py-2 border-0 shadow-sm"
                        style={{ borderRadius: '12px', fontWeight: '600' }}
                        onClick={() => setShowModal(true)}
                    >
                        <FiPlus className="me-2" size={20} /> New Adjustment
                    </Button>
                </motion.div>
            </div>

            {/* Stats Section */}
            <Row className="g-4 mb-5">
                {[
                    { label: 'Stock In', value: stats.totalIn, icon: FiArrowUpRight, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
                    { label: 'Stock Out', value: stats.totalOut, icon: FiArrowDownLeft, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
                    { label: 'Net Movement', value: stats.net, icon: FiRefreshCw, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', isNet: true }
                ].map((stat, idx) => (
                    <Col md={4} key={idx}>
                        <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
                            <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                                <Card.Body className="p-4">
                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                        <div className="p-3 rounded-3" style={{ backgroundColor: stat.bg }}>
                                            <stat.icon style={{ color: stat.color }} size={24} />
                                        </div>
                                        <Badge bg="light" text="dark" className="px-3 py-2 rounded-pill fw-medium border">
                                            Last 30 Days
                                        </Badge>
                                    </div>
                                    <div className="text-muted small fw-bold text-uppercase mb-1" style={{ letterSpacing: '0.05em' }}>{stat.label}</div>
                                    <h2 className="fw-bold mb-0" style={{ color: '#1e293b' }}>
                                        {stat.isNet && stat.value > 0 ? '+' : ''}{stat.value.toLocaleString()} 
                                        <span className="ms-2 fs-6 text-muted fw-normal">Units</span>
                                    </h2>
                                </Card.Body>
                            </Card>
                        </motion.div>
                    </Col>
                ))}
            </Row>

            {/* Table Section */}
            <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-sm" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                    <Card.Body className="p-0">
                        {/* Filters & Search */}
                        <div className="p-4 border-bottom bg-white">
                            <Row className="g-3 align-items-center">
                                <Col md={6}>
                                    <InputGroup className="bg-light rounded-3 overflow-hidden border-0">
                                        <InputGroup.Text className="bg-light border-0 ps-3">
                                            <FiSearch className="text-muted" />
                                        </InputGroup.Text>
                                        <Form.Control
                                            placeholder="Search by product, reason..."
                                            className="bg-light border-0 py-2 shadow-none"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </InputGroup>
                                </Col>
                                <Col md={6} className="d-flex justify-content-md-end gap-2">
                                    {['all', 'in', 'out'].map((type) => (
                                        <Button
                                            key={type}
                                            variant={filterType === type ? 'dark' : 'light'}
                                            size="sm"
                                            className="px-4 py-2 text-capitalize border-0"
                                            style={{ borderRadius: '10px', fontWeight: '500' }}
                                            onClick={() => {
                                                setFilterType(type);
                                                if (type === 'all') navigate('/stock');
                                                else navigate(`/stock?type=${type}`);
                                            }}
                                        >
                                            {type}
                                        </Button>
                                    ))}
                                </Col>
                            </Row>
                        </div>

                        {/* Inventory Table */}
                        <div className="table-responsive">
                            <Table hover className="mb-0 align-middle">
                                <thead style={{ backgroundColor: '#f8fafc' }}>
                                    <tr>
                                        <th className="border-0 py-4 ps-4 text-muted small text-uppercase">Product Details</th>
                                        <th className="border-0 py-4 text-muted small text-uppercase">Type</th>
                                        <th className="border-0 py-4 text-muted small text-uppercase">Quantity</th>
                                        <th className="border-0 py-4 text-muted small text-uppercase">Reason & Reference</th>
                                        <th className="border-0 py-4 text-muted small text-uppercase">Timestamp</th>
                                        <th className="border-0 py-4 pe-4 text-end text-muted small text-uppercase">Executor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence mode="popLayout">
                                        {filteredMovements.length > 0 ? (
                                            filteredMovements.map((m, index) => (
                                                <motion.tr 
                                                    key={m.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    className="border-bottom"
                                                    style={{ cursor: 'default' }}
                                                >
                                                    <td className="ps-4 py-4">
                                                        <div className="d-flex align-items-center">
                                                            <div className="p-2 rounded bg-light me-3">
                                                                <FiPackage className="text-dark" size={18} />
                                                            </div>
                                                            <div>
                                                                <div className="fw-bold text-dark">{m.product}</div>
                                                                <div className="text-muted small">Prod ID: #{m.productId}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <Badge 
                                                            pill 
                                                            style={{ 
                                                                backgroundColor: m.type === 'in' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                                color: m.type === 'in' ? '#059669' : '#dc2626',
                                                                fontWeight: '600',
                                                                fontSize: '0.75rem',
                                                                padding: '6px 12px'
                                                            }}
                                                        >
                                                            {m.type === 'in' ? 'STOCK IN' : 'STOCK OUT'}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <div className={`fw-bold fs-5 ${m.type === 'in' ? 'text-success' : 'text-danger'}`}>
                                                            {m.type === 'in' ? '+' : '-'}{m.quantity}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="text-dark small d-flex align-items-center">
                                                            <FiInfo className="me-2 text-muted" /> {m.reason}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="text-muted small d-flex align-items-center">
                                                            <FiCalendar className="me-2 text-muted" /> {m.date}
                                                        </div>
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        <div className="d-flex align-items-center justify-content-end">
                                                            <div className="text-end me-2">
                                                                <div className="fw-semibold small text-dark">{m.user}</div>
                                                            </div>
                                                            <div className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, fontSize: '10px' }}>
                                                                {m.user?.substring(0, 2).toUpperCase()}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center py-5">
                                                    <div className="py-5 text-muted">
                                                        <FiLayers size={48} className="mb-3 opacity-25" />
                                                        <h5>No movements found</h5>
                                                        <p className="small">Try adjusting your filters or search terms.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </AnimatePresence>
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            </motion.div>

            {/* Adjustment Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="md" className="custom-modern-modal">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                    <Modal.Header closeButton className="border-0 pb-0 pt-4 px-4">
                        <Modal.Title className="fw-bold fs-4">Quick Stock Adjustment</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Form onSubmit={handleAdjustment}>
                            {/* Adjustment Type Tabs */}
                            <div className="d-flex p-1 bg-light rounded-4 mb-4" style={{ border: '1px solid #e2e8f0' }}>
                                <input type="hidden" name="type" value={filterType === 'all' ? 'add' : (filterType === 'in' ? 'add' : 'subtract')} id="adjustment-type-hidden" />
                                <button 
                                    type="button"
                                    className={`btn flex-grow-1 border-0 py-2 rounded-3 transition-all ${(!document.getElementById('adjustment-type-hidden') || document.getElementById('adjustment-type-hidden').value === 'add') ? 'bg-white shadow-sm text-dark fw-bold' : 'text-muted'}`}
                                    onClick={() => {
                                        const input = document.getElementById('adjustment-type-hidden');
                                        if (input) input.value = 'add';
                                        // Trigger re-render by force updating a state if needed
                                        setIsSaving(prev => prev); // dummy trigger
                                        const buttons = document.querySelectorAll('.type-tab-btn');
                                        buttons.forEach(b => b.classList.remove('active-tab'));
                                        document.getElementById('in-tab-btn').classList.add('active-tab');
                                    }}
                                    id="in-tab-btn"
                                >
                                    <FiArrowUpRight className="me-2" /> Stock In
                                </button>
                                <button 
                                    type="button"
                                    className={`btn flex-grow-1 border-0 py-2 rounded-3 transition-all ${document.getElementById('adjustment-type-hidden')?.value === 'subtract' ? 'bg-white shadow-sm text-dark fw-bold' : 'text-muted'}`}
                                    onClick={() => {
                                        const input = document.getElementById('adjustment-type-hidden');
                                        if (input) input.value = 'subtract';
                                        setIsSaving(prev => prev);
                                        const buttons = document.querySelectorAll('.type-tab-btn');
                                        buttons.forEach(b => b.classList.remove('active-tab'));
                                        document.getElementById('out-tab-btn').classList.add('active-tab');
                                    }}
                                    id="out-tab-btn"
                                >
                                    <FiArrowDownLeft className="me-2" /> Stock Out
                                </button>
                            </div>

                            <Form.Group className="mb-4">
                                <Form.Label className="small text-muted fw-bold text-uppercase">Select Product</Form.Label>
                                <Form.Select 
                                    name="product_id" 
                                    required 
                                    className="py-3 px-3 bg-light border-0 shadow-none"
                                    style={{ borderRadius: '12px' }}
                                >
                                    <option value="">Search or select product...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (Available: {p.stock_quantity})</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="small text-muted fw-bold text-uppercase">Quantity to Adjust</Form.Label>
                                <Form.Control 
                                    name="quantity" 
                                    type="number" 
                                    min="1" 
                                    required 
                                    placeholder="e.g. 50"
                                    className="py-3 px-3 bg-light border-0 shadow-none"
                                    style={{ borderRadius: '12px' }}
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="small text-muted fw-bold text-uppercase">Notes / Reason</Form.Label>
                                <Form.Control 
                                    name="reason" 
                                    as="textarea" 
                                    rows={3} 
                                    placeholder="Briefly explain this movement..." 
                                    required 
                                    className="py-3 px-3 bg-light border-0 shadow-none"
                                    style={{ borderRadius: '12px' }}
                                />
                            </Form.Group>

                            <div className="d-grid gap-2">
                                <Button 
                                    variant="dark" 
                                    type="submit" 
                                    disabled={isSaving}
                                    className="py-3 border-0 shadow-sm"
                                    style={{ borderRadius: '12px', fontWeight: '600' }}
                                >
                                    {isSaving ? 'Updating Inventory...' : 'Confirm Transaction'}
                                </Button>
                                <Button 
                                    variant="link" 
                                    className="text-muted text-decoration-none small mt-1" 
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel and Close
                                </Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </motion.div>
            </Modal>

            <style>{`
                .stock-movements-wrapper {
                    background-color: #f8fafc;
                    min-height: 100vh;
                }
                .custom-modern-modal .modal-content {
                    border-radius: 28px;
                    border: none;
                    box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.2);
                }
                .active-tab {
                    background-color: #fff !important;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                    color: #0f172a !important;
                    font-weight: 700 !important;
                }
                .form-select:focus, .form-control:focus {
                    background-color: #fff !important;
                    box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.05) !important;
                    border: 1px solid #10b981 !important;
                }
                .btn-light {
                    background-color: #f1f5f9;
                    color: #475569;
                }
                .btn-light:hover {
                    background-color: #e2e8f0;
                }
            `}</style>
        </motion.div>
    );
};

export default StockMovements;

