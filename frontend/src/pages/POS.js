import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, InputGroup, Table, Badge, Alert, Offcanvas } from 'react-bootstrap';
import { FiSearch, FiShoppingCart, FiUser, FiTrash2, FiPlus, FiMinus, FiCheckCircle, FiXCircle, FiCamera } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { salesAPI, inventoryAPI, customersAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BarcodeScannerModal from '../components/BarcodeScannerModal';


const POS = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showCartMobile, setShowCartMobile] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [taxRate, setTaxRate] = useState(0); // Default tax rate
    const [cartPulse, setCartPulse] = useState(false); // animate cart when item added
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);


    const { formatCurrency } = useCurrency();

    // Refs for barcode scanning
    const barcodeBuffer = React.useRef('');
    const lastKeyTime = React.useRef(0);
    const SCAN_TIMEOUT = 150; // Increased timeout for slower scanners

    useEffect(() => {
        fetchProducts();
        fetchCustomers();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await inventoryAPI.getProducts();
            const fetchedProducts = response.data.products || [];
            setProducts(fetchedProducts);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Unable to load products from server — showing sample products');
            const sampleProducts = [
                { id: 1, name: 'Wireless Mouse', category: 'Electronics', price: 25.00, stock: 45, image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=200&h=200&fit=crop', _sample: true },
                { id: 2, name: 'Mechanical Keyboard', category: 'Electronics', price: 89.99, stock: 20, image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=200&h=200&fit=crop', _sample: true },
                { id: 3, name: 'USB-C Hub', category: 'Accessories', price: 45.50, stock: 30, image: 'https://images.unsplash.com/photo-1562408590-e32931084e23?w=200&h=200&fit=crop', _sample: true }
            ];
            setProducts(sampleProducts);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await customersAPI.getCustomers();
            setCustomers(response.data.customers || []);

            if (response.data.customers && response.data.customers.length > 0) {
                setSelectedCustomer(response.data.customers[0]);
            } else {
                const walkInCustomer = {
                    id: 'walk-in',
                    customer_id: 'WALKIN001',
                    first_name: 'Walk-in',
                    last_name: 'Customer',
                    company: 'Walk-in Customer',
                    email: 'walkin@example.com',
                    phone: 'N/A',
                    address: 'N/A',
                    is_walk_in: true
                };
                setCustomers([walkInCustomer]);
                setSelectedCustomer(walkInCustomer);
            }
        } catch (err) {
            console.error('Error fetching customers:', err);
            const walkInCustomer = {
                id: 'walk-in',
                customer_id: 'WALKIN001',
                first_name: 'Walk-in',
                last_name: 'Customer',
                company: 'Walk-in Customer',
                email: 'walkin@example.com',
                phone: 'N/A',
                address: 'N/A',
                is_walk_in: true
            };
            setCustomers([walkInCustomer]);
            setSelectedCustomer(walkInCustomer);
        }
    };

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.id === product.id);
        const price = product.price || product.unit_price || product.selling_price || 0;

        if (existingItem) {
            setCart(cart.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, {
                ...product,
                quantity: 1,
                price: price
            }]);
        }

        // Pulse the cart badge to provide a quick visual feedback
        setCartPulse(true);
        setTimeout(() => setCartPulse(false), 700);

        // Only show notification if not triggered by barcode scan
        if (!product.fromBarcodeScan) {
            toast.success(`${product.name} added to cart`, { position: 'bottom-right', duration: 2000 });
        }
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

        if (!selectedCustomer) {
            toast.error('Please select a customer first!');
            return;
        }

        const orderData = {
            customer_id: selectedCustomer.id,
            items: cart.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
                unit_price: item.price,
            })),
            subtotal: calculateTotal(),
            tax_rate: taxRate,
            total_amount: calculateTotal() * (1 + taxRate / 100)
        };

        try {
            toast.loading('Processing transaction...');
            const response = await salesAPI.createPosSale(orderData);
            toast.dismiss();
            toast.success('Transaction completed successfully!');
            setCart([]);
            setShowCartMobile(false);
        } catch (error) {
            toast.dismiss();
            if (error && error.response) {
                const status = error.response.status;
                const serverMsg = (error.response.data && (error.response.data.error || error.response.data.msg || error.response.data.message)) || error.message;

                if (status === 401) {
                    toast.error('Not authenticated — please log in.');
                    navigate('/login');
                    return;
                }
                toast.error(serverMsg || `Transaction failed with status ${status}.`);
                return;
            }
            toast.error(error.message || 'Transaction failed. Please try again.');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleKeyDown = (e) => {
            const now = Date.now();
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'Enter') {
                if (barcodeBuffer.current.length > 0) {
                    handleBarcodeScan(barcodeBuffer.current);
                    barcodeBuffer.current = '';
                }
            } else if (/^[\w\s@#$%^&*()+=\[\]{}|\\:;"'<>?.,~`!_-]+$/.test(e.key)) { // Allow alphanumeric and common special characters
                const timeSinceLastKey = now - lastKeyTime.current;

                // If too much time has passed since last keystroke, start fresh
                if (barcodeBuffer.current.length > 0 && timeSinceLastKey > SCAN_TIMEOUT) {
                    barcodeBuffer.current = '';
                }

                barcodeBuffer.current += e.key;
                lastKeyTime.current = now;

                // Auto-trigger scan if buffer reaches a reasonable length and seems like a complete code
                if (barcodeBuffer.current.length >= 8 && timeSinceLastKey > SCAN_TIMEOUT - 20) {
                    setTimeout(() => {
                        if (barcodeBuffer.current.length > 0) {
                            handleBarcodeScan(barcodeBuffer.current);
                            barcodeBuffer.current = '';
                        }
                    }, 20); // Small delay to ensure complete capture
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [products]);

    // Memoized product lookup map to improve performance
    const getProductByCode = React.useCallback((code) => {
        // Create a lookup map from products array
        const lookupMap = {};
        products.forEach(p => {
            if (p.barcode) lookupMap[p.barcode] = p;
            if (p.sku) lookupMap[p.sku] = p;
            if (p.product_id) lookupMap[p.product_id] = p;
        });

        return lookupMap[code] || null;
    }, [products]);

    const handleBarcodeScan = (code) => {
        const product = getProductByCode(code);
        if (product) {
            // Mark product as coming from barcode scan to prevent duplicate notifications
            const productWithFlag = { ...product, fromBarcodeScan: true };
            addToCart(productWithFlag);

            // Deduplicate barcode scan toasts using a fixed toast id
            toast.dismiss('barcode-scan');
            toast.success(
                <div>
                    <strong>✓ Scanned: {product.name}</strong><br />
                    <small>Added to cart successfully</small>
                </div>,
                {
                    id: 'barcode-scan',
                    position: "top-right",
                    duration: 2000,
                    style: {
                        background: '#d4edda',
                        color: '#155724',
                        border: '1px solid #c3e6cb',
                        borderRadius: '6px'
                    }
                }
            );

            // Optional: Highlight the product card temporarily
            const productCard = document.querySelector(`[data-product-id="${product.id}"]`);
            if (productCard) {
                productCard.style.transition = 'box-shadow 0.3s ease, transform 0.3s ease';
                productCard.style.boxShadow = '0 0 0 3px rgba(40, 167, 69, 0.5)';
                productCard.style.transform = 'scale(1.02)';

                setTimeout(() => {
                    productCard.style.boxShadow = '';
                    productCard.style.transform = '';
                }, 1000);
            }
        } else {
            // Deduplicate barcode scan toasts using a fixed toast id
            toast.dismiss('barcode-scan');
            toast.error(
                <div>
                    <strong>✗ Product not found</strong><br />
                    <small>Barcode/SKU: {code}</small>
                </div>,
                {
                    id: 'barcode-scan',
                    position: "top-right",
                    duration: 3000,
                    style: {
                        background: '#f8d7da',
                        color: '#721c24',
                        border: '1px solid #f5c6cb',
                        borderRadius: '6px'
                    }
                }
            );
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            const product = getProductByCode(searchTerm);
            if (product) {
                addToCart(product);
                setSearchTerm('');
                toast.success(`Added: ${product.name}`);
            }
        }
    };

    const handleBarcodeDetected = (barcode) => {
        setShowBarcodeScanner(false);
        const product = getProductByCode(barcode);
        if (product) {
            addToCart({ ...product, fromBarcodeScan: true });
            // Deduplicate barcode scan toasts using a fixed toast id
            toast.dismiss('barcode-scan');
            toast.success(
                <div>
                    <strong>✓ Scanned: {product.name}</strong><br />
                    <small>Added to cart successfully</small>
                </div>,
                {
                    id: 'barcode-scan',
                    position: "top-right",
                    duration: 2000,
                    style: {
                        background: '#d4edda',
                        color: '#155724',
                        border: '1px solid #c3e6cb',
                        borderRadius: '6px'
                    }
                }
            );
        } else {
            // Deduplicate barcode scan toasts using a fixed toast id
            toast.dismiss('barcode-scan');
            toast.error(
                <div>
                    <strong>✗ Product not found</strong><br />
                    <small>Barcode: {barcode}</small>
                </div>,
                {
                    id: 'barcode-scan',
                    position: "top-right",
                    duration: 3000,
                    style: {
                        background: '#f8d7da',
                        color: '#721c24',
                        border: '1px solid #f5c6cb',
                        borderRadius: '6px'
                    }
                }
            );
        }
    };
    
    const handleMouseEnter = (productId) => {
        setHoveredItem(productId);
    };
    
    const handleMouseLeave = () => {
        setHoveredItem(null);
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

    const CartPanel = () => (
        <div className="d-flex flex-column h-100">
            <div className="bg-white border-bottom py-3 px-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="fw-bold mb-0 d-flex align-items-center">
                        <FiShoppingCart className="me-2 text-primary" /> Current Order
                    </h5>
                    <motion.div animate={cartPulse ? { scale: [1, 1.25, 1] } : { scale: 1 }} transition={{ duration: 0.6 }} style={{ display: 'inline-block' }}>
                        <Badge bg="light" text="dark" className="border">{cart.length} items</Badge>
                    </motion.div>
                </div>
                <div className="mb-2">
                    <Form.Group>
                        <Form.Label className="small fw-bold text-muted">Customer</Form.Label>
                        <Form.Select
                            value={selectedCustomer?.id || ''}
                            onChange={(e) => {
                                const customer = customers.find(c => c.id === e.target.value);
                                setSelectedCustomer(customer);
                            }}
                            className="py-2"
                        >
                            {customers.map(customer => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.first_name} {customer.last_name} {customer.company && `(${customer.company})`}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </div>
                <div className="mb-2">
                    <Form.Group>
                        <Form.Label className="small fw-bold text-muted">Tax Rate (%)</Form.Label>
                        <Form.Control
                            type="number"
                            value={taxRate}
                            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                            min="0"
                            max="100"
                            step="0.1"
                            className="py-2"
                        />
                    </Form.Group>
                </div>
            </div>
            <div className="d-flex flex-column" style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="overflow-auto px-3" style={{ flex: '1 1 auto', minHeight: '60px', maxHeight: '120px' }}>
                    {cart.length === 0 ? (
                        <div className="text-center py-5">
                            <FiShoppingCart size={48} className="text-light mb-3" />
                            <p className="text-muted">Your cart is empty</p>
                        </div>
                    ) : (
                        <Table borderless hover className="align-middle mb-0">
                            <tbody>
                                {cart.map(item => (
                                    <tr key={item.id} className="border-bottom animate-slide-in-right">
                                        <td className="ps-0 py-3">
                                            <div className="d-flex align-items-center">
                                                <img
                                                    src={item.image ? (item.image.startsWith('http') ? item.image : `${window.location.origin}${item.image}`) : 'https://via.placeholder.com/50x50?text=No+Image'}
                                                    alt={item.name}
                                                    style={{ width: '40px', height: '40px', objectFit: 'cover', marginRight: '10px' }}
                                                    onError={(e) => {
                                                        e.target.src = 'https://via.placeholder.com/50x50?text=No+Image';
                                                    }}
                                                />
                                                <div>
                                                    <div className="fw-bold small text-truncate" style={{ maxWidth: '120px' }}>{item.name}</div>
                                                    <div className="text-muted small">{formatCurrency(item.price || item.unit_price || 0)}</div>
                                                </div>
                                            </div>
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
                
                <div className="p-3 bg-light border-top" style={{minHeight: '120px', flex: '0 0 auto'}}>
                    <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Subtotal</span>
                        <span className="fw-medium">{formatCurrency(calculateTotal())}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Tax ({taxRate}%)</span>
                        <span className="fw-medium">{formatCurrency(calculateTotal() * (taxRate / 100))}</span>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between mb-4">
                        <h5 className="fw-bold mb-0">Total</h5>
                        <h5 key={calculateTotal()} className="fw-bold mb-0 text-primary animate-pulse">{formatCurrency(calculateTotal() * (1 + taxRate / 100))}</h5>
                    </div>

                    <Button variant="primary" className="w-100 py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center" onClick={handleCheckout}>
                        <FiCheckCircle className="me-2" /> Complete Transaction
                    </Button>
                    <Button variant="outline-danger" className="w-100 mt-2 border-0" onClick={() => setCart([])}>
                        <FiXCircle className="me-2" /> Cancel Order
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="pos-wrapper pb-5 mb-5 pb-lg-0 mb-lg-0">
            <Row className="g-4">
                {/* Product Selection Area */}
                <Col lg={8}>
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Body className="p-3">
                            <div className={`mb-4 transition-all ${isSearchFocused ? 'transform scale-[1.01]' : ''}`}>
                                <InputGroup className={`shadow-sm border rounded-3 overflow-hidden ${isSearchFocused ? 'bg-white border-primary' : 'bg-light border-0'}`}>
                                    <InputGroup.Text className={`border-0 ps-3 ${isSearchFocused ? 'bg-white text-primary' : 'bg-light text-muted'}`}>
                                        <FiSearch size={20} />
                                    </InputGroup.Text>
                                    <Form.Control
                                        placeholder="Search products or scan barcode..."
                                        className={`border-0 shadow-none py-3 ${isSearchFocused ? 'bg-white' : 'bg-light'}`}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={handleSearchKeyDown}
                                        onFocus={() => setIsSearchFocused(true)}
                                        onBlur={() => setIsSearchFocused(false)}
                                        style={{ fontSize: '1.05rem' }}
                                    />
                                    <InputGroup.Text className={`border-0 px-3 ${isSearchFocused ? 'bg-white text-primary cursor-pointer' : 'bg-light text-muted cursor-pointer'}`} onClick={() => setShowBarcodeScanner(true)} style={{ cursor: 'pointer' }}>
                                        <FiCamera size={20} />
                                    </InputGroup.Text>
                                    {searchTerm && (
                                        <InputGroup.Text
                                            className={`border-0 pe-3 ${isSearchFocused ? 'bg-white' : 'bg-light'}`}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => setSearchTerm('')}
                                        >
                                            <FiXCircle className="text-muted" size={18} />
                                        </InputGroup.Text>
                                    )}
                                </InputGroup>
                            </div>

                            <Row className="g-3">
                                {filteredProducts.map((product, index) => (
                                    <Col xs={6} md={4} key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                                        <Card className={`h-100 border-0 shadow-sm product-card hover-shadow transition-all ${hoveredItem === product.id ? 'border-primary' : ''}`} onClick={() => addToCart(product)} onMouseEnter={() => handleMouseEnter(product.id)} onMouseLeave={handleMouseLeave} style={{ cursor: 'pointer' }} data-product-id={product.id}>
                                            <div className="position-relative">
                                                <Card.Img variant="top" src={product.image ? (product.image.startsWith('http') ? product.image : `${window.location.origin}${product.image}`) : 'https://via.placeholder.com/200x200?text=No+Image'} style={{ height: '140px', objectFit: 'cover' }} />
                                                <Badge bg="primary" className="position-absolute top-0 end-0 m-2 shadow-sm">
                                                    {formatCurrency(product.price || product.unit_price || 0)}
                                                </Badge>
                                                {product._sample && <Badge bg="warning" className="position-absolute top-0 start-0 m-2 shadow-sm text-dark">Sample</Badge>}
                                            </div>
                                            <Card.Body className="p-3">
                                                <h6 className="fw-bold mb-1 text-truncate">{product.name}</h6>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <small className="text-muted text-truncate" style={{ maxWidth: '60px' }}>{product.category?.name || product.category}</small>
                                                    <small className={(product.stock || product.stock_quantity || 0) < 15 ? 'text-danger fw-bold' : 'text-success'}>
                                                        {product.stock ?? product.stock_quantity ?? 'N/A'}
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

                {/* Desktop Cart */}
                <Col lg={4} className="d-none d-lg-block">
                    <Card className="border-0 shadow-sm h-100 sticky-top" style={{ top: '100px', maxHeight: 'calc(100vh - 100px)' }}>
                        <Card.Body className="p-0 d-flex flex-column" style={{ height: 'calc(100vh - 120px)' }}>
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <CartPanel />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Mobile Cart Button */}
            <div className="fixed-bottom p-3 bg-white border-top d-lg-none shadow-lg" style={{ zIndex: 1040 }}>
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <small className="text-muted">Total</small>
                        <h5 key={calculateTotal()} className="fw-bold mb-0 text-primary animate-pulse">{formatCurrency(calculateTotal() * (1 + taxRate / 100))}</h5>
                    </div>
                    <Button variant="primary" onClick={() => setShowCartMobile(true)} className="d-flex align-items-center">
                        <FiShoppingCart className="me-2" /> View Cart <Badge bg="white" text="primary" className="ms-2 rounded-pill">{cart.length}</Badge>
                    </Button>
                </div>
            </div>

            {/* Floating Cart Action (ensures visibility on small/medium screens) */}
            <Button
                variant="primary"
                onClick={() => setShowCartMobile(true)}
                className="d-md-block d-lg-none position-fixed rounded-circle d-flex align-items-center justify-content-center shadow-lg"
                style={{ zIndex: 1050, width: '56px', height: '56px', bottom: '20px', right: '20px' }}
                title="View Cart"
            >
                <FiShoppingCart />
                <Badge bg="white" text="primary" className="position-absolute rounded-pill" style={{ top: '-6px', right: '-6px', padding: '4px 6px', fontSize: '12px' }}>{cart.length}</Badge>
            </Button>

            {/* Mobile Cart Offcanvas */}
            <Offcanvas show={showCartMobile} onHide={() => setShowCartMobile(false)} placement="end" style={{ '--bs-offcanvas-height': '100%', height: '100vh' }}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Current Order</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0 d-flex flex-column" style={{ height: 'calc(100vh - 56px)', maxHeight: '100vh', overflow: 'hidden' }}>
                    <CartPanel />
                </Offcanvas.Body>
            </Offcanvas>

            <BarcodeScannerModal
                show={showBarcodeScanner}
                onHide={() => setShowBarcodeScanner(false)}
                onDetected={handleBarcodeDetected}
            />
        </div>
    );
};

export default POS;
