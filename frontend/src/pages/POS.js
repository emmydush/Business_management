import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, InputGroup, Table, Badge, Alert } from 'react-bootstrap';
import { FiSearch, FiShoppingCart, FiUser, FiTrash2, FiPlus, FiMinus, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { salesAPI, inventoryAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { useNavigate } from 'react-router-dom';

const POS = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { formatCurrency } = useCurrency();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await inventoryAPI.getProducts();
            setProducts(response.data.products || []);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Unable to load products from server — showing sample products');
            // Keep a small set of sample products so the UI remains usable
            setProducts([
                { id: 1, name: 'Wireless Mouse', category: 'Electronics', price: 25.00, stock: 45, image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=200&h=200&fit=crop', _sample: true },
                { id: 2, name: 'Mechanical Keyboard', category: 'Electronics', price: 89.99, stock: 20, image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=200&h=200&fit=crop', _sample: true },
                { id: 3, name: 'USB-C Hub', category: 'Accessories', price: 45.50, stock: 30, image: 'https://images.unsplash.com/photo-1562408590-e32931084e23?w=200&h=200&fit=crop', _sample: true }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            setCart(cart.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
        toast.success(`${product.name} added to cart`, { position: 'bottom-right', duration: 2000 });
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, delta) => {
        setCart(cart.map(item => {
            if (item.id === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const calculateTotal = () => {
        return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error('Cart is empty!');
            return;
        }
        
        // Prepare order data
        const orderData = {
            customer_id: 1, // Default customer for POS transactions
            items: cart.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
                unit_price: item.price,
            })),
            subtotal: calculateTotal(),
            tax_rate: 8, // Example tax rate
            total_amount: calculateTotal() * 1.08 // Example with tax
        };
        
        try {
            toast.loading('Processing transaction...');
            const response = await salesAPI.createPosSale(orderData);
            toast.dismiss();
            toast.success('Transaction completed successfully!');
            setCart([]); // Clear cart after successful transaction
        } catch (error) {
            toast.dismiss();
            // Provide better error messages for common cases
            if (error && error.response) {
                const status = error.response.status;
                const serverMsg = (error.response.data && (error.response.data.error || error.response.data.msg || error.response.data.message)) || error.message;
                
                if (status === 401) {
                    toast.error('Not authenticated — please log in.');
                    navigate('/login');
                    return;
                }
                if (status === 400) {
                    toast.error(serverMsg || 'Invalid transaction data. Please check item quantities and availability.');
                    return;
                }
                if (status === 403) {
                    toast.error('You do not have permission to process POS transactions.');
                    return;
                }
                if (status === 404) {
                    toast.error('Customer or product not found. Please refresh the page and try again.');
                    return;
                }
                if (status >= 500) {
                    toast.error('Server error processing transaction. Please contact support or try again later.');
                    console.error('Server Error Details:', error.response.data);
                    return;
                }
                
                // For other error statuses
                toast.error(serverMsg || `Transaction failed with status ${status}. Please try again.`);
                return;
            }
            
            // Network errors or other client-side errors
            if (error.request) {
                toast.error('Network error: Unable to connect to server. Please check your connection and try again.');
            } else {
                toast.error(error.message || 'Transaction failed. Please try again.');
            }
            
            console.error('Error processing POS transaction:', error);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
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

    // Show error banner when products failed to load from server
    const sampleNotice = error ? (
        <div className="mb-3">
            <Alert variant="warning">{error}</Alert>
        </div>
    ) : null;

    return (
        <div className="pos-wrapper">
            <Row className="g-4">
                {/* Product Selection Area */}
                <Col lg={8}>
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Body className="p-3">
                            <InputGroup className="mb-4">
                                <InputGroup.Text className="bg-light border-0">
                                    <FiSearch className="text-muted" />
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Search products by name or category..."
                                    className="bg-light border-0 ps-0"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>

                            <Row className="g-3">
                                {filteredProducts.map(product => (
                                    <Col md={4} key={product.id}>
                                        <Card className="h-100 border-0 shadow-sm product-card hover-shadow transition-all" onClick={() => addToCart(product)} style={{ cursor: 'pointer' }}>
                                            <div className="position-relative">
                                                <Card.Img variant="top" src={product.image} style={{ height: '140px', objectFit: 'cover' }} />
                                                <Badge bg="primary" className="position-absolute top-0 end-0 m-2 shadow-sm">
                                                    {formatCurrency(product.price || product.unit_price || 0)}
                                                </Badge>
                                                {product._sample && <Badge bg="warning" className="position-absolute top-0 start-0 m-2 shadow-sm text-dark">Sample</Badge>}
                                            </div>
                                            <Card.Body className="p-3">
                                                <h6 className="fw-bold mb-1 text-truncate">{product.name}</h6>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <small className="text-muted">{product.category?.name || product.category}</small>
                                                    <small className={ (product.stock || product.stock_quantity || 0) < 15 ? 'text-danger fw-bold' : 'text-success'}>
                                                        Stock: {product.stock ?? product.stock_quantity ?? 'N/A'}
                                                    </small>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Cart / Checkout Area */}
                <Col lg={4}>
                    <Card className="border-0 shadow-sm h-100 sticky-top" style={{ top: '100px', maxHeight: 'calc(100vh - 120px)' }}>
                        <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold mb-0 d-flex align-items-center">
                                <FiShoppingCart className="me-2 text-primary" /> Current Order
                            </h5>
                            <Badge bg="light" text="dark" className="border">{cart.length} items</Badge>
                        </Card.Header>
                        <Card.Body className="p-0 d-flex flex-column">
                            <div className="flex-grow-1 overflow-auto px-3" style={{ minHeight: '300px' }}>
                                {cart.length === 0 ? (
                                    <div className="text-center py-5">
                                        <FiShoppingCart size={48} className="text-light mb-3" />
                                        <p className="text-muted">Your cart is empty</p>
                                    </div>
                                ) : (
                                    <Table borderless hover className="align-middle mb-0">
                                        <tbody>
                                            {cart.map(item => (
                                                <tr key={item.id} className="border-bottom">
                                                    <td className="ps-0 py-3">
                                                        <div className="fw-bold small text-truncate" style={{ maxWidth: '120px' }}>{item.name}</div>
                                                        <div className="text-muted small">{formatCurrency(item.price || item.unit_price || 0)}</div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <Button variant="light" size="sm" className="p-1 rounded-circle" onClick={() => updateQuantity(item.id, -1)}>
                                                                <FiMinus size={12} />
                                                            </Button>
                                                            <span className="fw-bold small">{item.quantity}</span>
                                                            <Button variant="light" size="sm" className="p-1 rounded-circle" onClick={() => updateQuantity(item.id, 1)}>
                                                                <FiPlus size={12} />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                    <td className="text-end pe-0 py-3">
                                                        <div className="fw-bold small">{formatCurrency(item.price * item.quantity)}</div>
                                                        <Button variant="link" className="text-danger p-0 small" onClick={() => removeFromCart(item.id)}>
                                                            <FiTrash2 size={14} />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                )}
                            </div>

                            <div className="p-3 bg-light mt-auto">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Subtotal</span>
                                    <span className="fw-medium">{formatCurrency(calculateTotal())}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Tax (8%)</span>
                                    <span className="fw-medium">{formatCurrency(calculateTotal() * 0.08)}</span>
                                </div>
                                <hr />
                                <div className="d-flex justify-content-between mb-4">
                                    <h5 className="fw-bold mb-0">Total</h5>
                                    <h5 className="fw-bold mb-0 text-primary">{formatCurrency(calculateTotal() * 1.08)}</h5>
                                </div>

                                <Button variant="primary" className="w-100 py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center" onClick={handleCheckout}>
                                    <FiCheckCircle className="me-2" /> Complete Transaction
                                </Button>
                                <Button variant="outline-danger" className="w-100 mt-2 border-0" onClick={() => setCart([])}>
                                    <FiXCircle className="me-2" /> Cancel Order
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default POS;
