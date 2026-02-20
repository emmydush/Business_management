import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Button, Form, InputGroup, Table, Badge, Offcanvas, Nav, Tab } from 'react-bootstrap';
import { FiSearch, FiShoppingCart, FiUser, FiTrash2, FiPlus, FiMinus, FiCheckCircle, FiXCircle, FiCamera, FiGrid, FiList, FiClock, FiDollarSign, FiCreditCard, FiShoppingBag, FiPackage, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { salesAPI, inventoryAPI, customersAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import { useI18n } from '../i18n/I18nProvider';
import { PAYMENT_STATUSES, PAYMENT_STATUS_LABELS } from '../constants/statuses';

// Modern POS Component
const POS = () => {
    const { t } = useI18n();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showCartMobile, setShowCartMobile] = useState(false);
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(PAYMENT_STATUSES.PAID);
    const [viewMode, setViewMode] = useState('grid'); // grid or list
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [cartAnimation, setCartAnimation] = useState(false);

    const { formatCurrency } = useCurrency();

    // Refs for barcode scanning
    const barcodeBuffer = React.useRef('');
    const lastKeyTime = React.useRef(0);
    const SCAN_TIMEOUT = 150;

    // Get unique categories from products
    const categories = useMemo(() => {
        const cats = new Set(products.map(p => typeof p.category === 'object' ? p.category?.name : p.category).filter(Boolean));
        return ['all', ...Array.from(cats)];
    }, [products]);

    useEffect(() => {
        fetchProducts();
        fetchCustomers();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await inventoryAPI.getProducts({ per_page: 1000 });
            const fetchedProducts = response.data.products || [];
            setProducts(fetchedProducts);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError(t('no_data_available'));
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await customersAPI.getCustomers({ per_page: 1000 });
            const fetchedCustomers = response.data.customers || [];
            setCustomers(fetchedCustomers);

            const walkIn = fetchedCustomers.find(c =>
                c.first_name === 'Walk-in' ||
                c.company === 'Walk-in Customer' ||
                c.customer_id?.startsWith('WALKIN')
            );

            if (walkIn) {
                setSelectedCustomer(walkIn);
            } else if (fetchedCustomers.length > 0) {
                setSelectedCustomer(fetchedCustomers[0]);
            }
        } catch (err) {
            console.error('Error fetching customers:', err);
            toast.error(t('no_data_available'));
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

        // Cart pulse animation
        setCartAnimation(true);
        setTimeout(() => setCartAnimation(false), 400);

        if (!product.fromBarcodeScan) {
            toast.success(t('added_to_cart').replace('{name}', product.name), { 
                position: 'bottom-right', 
                duration: 1500,
                style: { background: '#10b981', color: '#fff' }
            });
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
            toast.error(t('cart_empty_error'));
            return;
        }

        if (!selectedCustomer) {
            toast.error(t('select_customer_error'));
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
            total_amount: calculateTotal(),
            payment_status: paymentStatus
        };

        try {
            toast.loading(t('processing_transaction'));
            const response = await salesAPI.createPosSale(orderData);
            toast.dismiss();
            toast.success(t('transaction_success'));
            setCart([]);
            setShowCartMobile(false);
        } catch (error) {
            toast.dismiss();
            if (error && error.response) {
                const status = error.response.status;
                const serverMsg = (error.response.data && (error.response.data.error || error.response.data.msg || error.response.data.message)) || error.message;

                if (status === 401) {
                    toast.error(t('login_invalid'));
                    navigate('/login');
                    return;
                }
                toast.error(serverMsg || `Transaction failed with status ${status}.`);
                return;
            }
            toast.error(error.message || t('register_failed'));
        }
    };

    // Filter products by category and search
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const nameMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const categoryName = typeof p.category === 'object' ? p.category?.name : p.category;
            const categoryMatch = selectedCategory === 'all' || categoryName === selectedCategory;
            return (nameMatch || categoryName?.toLowerCase().includes(searchTerm.toLowerCase())) && categoryMatch;
        });
    }, [products, searchTerm, selectedCategory]);

    // Barcode scanning handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            const now = Date.now();
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'Enter') {
                if (barcodeBuffer.current.length > 0) {
                    handleBarcodeScan(barcodeBuffer.current);
                    barcodeBuffer.current = '';
                }
            } else if (/^[\w\s@#$%^&*()+=\[\]{}|\\:;"'<>?.,~`!_-]+$/.test(e.key)) {
                const timeSinceLastKey = now - lastKeyTime.current;

                if (barcodeBuffer.current.length > 0 && timeSinceLastKey > SCAN_TIMEOUT) {
                    barcodeBuffer.current = '';
                }

                barcodeBuffer.current += e.key;
                lastKeyTime.current = now;

                if (barcodeBuffer.current.length >= 8 && timeSinceLastKey > SCAN_TIMEOUT - 20) {
                    setTimeout(() => {
                        if (barcodeBuffer.current.length > 0) {
                            handleBarcodeScan(barcodeBuffer.current);
                            barcodeBuffer.current = '';
                        }
                    }, 20);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [products]);

    const getProductByCode = React.useCallback((code) => {
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
            addToCart({ ...product, fromBarcodeScan: true });
            toast.dismiss('barcode-scan');
            toast.success(
                <div>
                    <strong>✓ {t('scanned')}: {product.name}</strong><br />
                    <small>{t('scanned_success')}</small>
                </div>,
                { id: 'barcode-scan', position: "top-right", duration: 2000 }
            );
        } else {
            toast.dismiss('barcode-scan');
            toast.error(
                <div>
                    <strong>✗ {t('product_not_found')}</strong><br />
                    <small>{t('product_not_found_desc').replace('{code}', code)}</small>
                </div>,
                { id: 'barcode-scan', position: "top-right", duration: 3000 }
            );
        }
    };

    const handleBarcodeDetected = (barcode) => {
        setShowBarcodeScanner(false);
        const product = getProductByCode(barcode);
        if (product) {
            addToCart({ ...product, fromBarcodeScan: true });
        } else {
            toast.error(t('product_not_found_desc').replace('{code}', barcode));
        }
    };

    // Quick action presets
    const quickActions = [
        { label: t('quick_sale') || 'Quick Sale', icon: <FiZap />, action: () => setPaymentStatus(PAYMENT_STATUSES.PAID) },
        { label: t('credit_sale') || 'Credit Sale', icon: <FiCreditCard />, action: () => setPaymentStatus(PAYMENT_STATUSES.PENDING) },
        { label: t('hold_order') || 'Hold Order', icon: <FiClock />, action: () => toast.success('Order held') },
    ];

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted">{t('loading') || 'Loading products...'}</p>
                </div>
            </div>
        );
    }

    // Modern Cart Panel Component
    const CartPanel = () => (
        <div className="d-flex flex-column h-100 pos-cart-panel">
            {/* Cart Header */}
            <div className="cart-header">
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                        <span className="cart-icon-wrapper">
                            <FiShoppingCart />
                        </span>
                        {t('current_order')}
                    </h5>
                    <motion.div 
                        animate={cartAnimation ? { scale: [1, 1.2, 1] } : { scale: 1 }} 
                        transition={{ duration: 0.3 }}
                    >
                        <Badge bg="primary" className="px-3 py-2 rounded-pill">
                            {cart.length} {t('items') || 'items'}
                        </Badge>
                    </motion.div>
                </div>
            </div>

            {/* Customer & Payment Selection */}
            <div className="cart-options">
                <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted d-flex align-items-center gap-2">
                        <FiUser size={14} /> {t('customer')}
                    </Form.Label>
                    <Form.Select
                        value={selectedCustomer?.id || ''}
                        onChange={(e) => {
                            const customer = customers.find(c => c.id === e.target.value);
                            setSelectedCustomer(customer);
                        }}
                        className="modern-select"
                    >
                        {customers.map(customer => (
                            <option key={customer.id} value={customer.id}>
                                {customer.first_name} {customer.last_name} {customer.company && `(${customer.company})`}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>
                <Form.Group>
                    <Form.Label className="small fw-bold text-muted d-flex align-items-center gap-2">
                        <FiDollarSign size={14} /> {t('payment_status') || 'Payment Status'}
                    </Form.Label>
                    <div className="d-flex gap-2">
                        {Object.values(PAYMENT_STATUSES).slice(0, 3).map(status => (
                            <Button
                                key={status}
                                variant={paymentStatus === status ? 'primary' : 'outline-secondary'}
                                size="sm"
                                onClick={() => setPaymentStatus(status)}
                                className="flex-fill"
                            >
                                {PAYMENT_STATUS_LABELS[status]}
                            </Button>
                        ))}
                    </div>
                </Form.Group>
            </div>

            {/* Cart Items */}
            <div className="cart-items flex-grow-1 overflow-auto">
                {cart.length === 0 ? (
                    <div className="empty-cart text-center py-5">
                        <div className="empty-cart-icon mb-3">
                            <FiShoppingBag size={48} />
                        </div>
                        <p className="text-muted">{t('empty_cart')}</p>
                        <small className="text-muted">{t('click_product_to_add') || 'Click products to add them to cart'}</small>
                    </div>
                ) : (
                    <Table borderless hover className="cart-table">
                        <tbody>
                            <AnimatePresence>
                                {cart.map(item => (
                                    <motion.tr 
                                        key={item.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="cart-item"
                                    >
                                        <td className="py-3">
                                            <div className="d-flex align-items-center">
                                                <img
                                                    src={item.image ? (item.image.startsWith('http') ? item.image : `${window.location.origin}${item.image}`) : 'https://via.placeholder.com/50x50?text=No+Image'}
                                                    alt={item.name}
                                                    className="cart-item-image"
                                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/50x50?text=No+Image'; }}
                                                />
                                                <div className="ms-3">
                                                    <div className="fw-bold cart-item-name">{item.name}</div>
                                                    <div className="text-muted small">{formatCurrency(item.price || item.unit_price || 0)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="quantity-controls">
                                                <Button 
                                                    variant="light" 
                                                    size="sm" 
                                                    className="qty-btn"
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                >
                                                    <FiMinus size={12} />
                                                </Button>
                                                <span className="qty-value">{item.quantity}</span>
                                                <Button 
                                                    variant="light" 
                                                    size="sm" 
                                                    className="qty-btn"
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                >
                                                    <FiPlus size={12} />
                                                </Button>
                                            </div>
                                        </td>
                                        <td className="py-3 text-end">
                                            <div className="fw-bold cart-item-total">{formatCurrency(item.price * item.quantity)}</div>
                                            <Button 
                                                variant="link" 
                                                className="text-danger p-0 remove-btn"
                                                onClick={() => removeFromCart(item.id)}
                                            >
                                                <FiTrash2 size={14} />
                                            </Button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </Table>
                )}
            </div>

            {/* Cart Summary */}
            <div className="cart-summary">
                <div className="summary-row">
                    <span>{t('subtotal')}</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                </div>
                <div className="summary-row total">
                    <span>{t('total')}</span>
                    <motion.span 
                        key={calculateTotal()}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        className="total-amount"
                    >
                        {formatCurrency(calculateTotal())}
                    </motion.span>
                </div>

                <Button 
                    variant="primary" 
                    className="w-100 py-3 fw-bold checkout-btn"
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                >
                    <FiCheckCircle className="me-2" /> 
                    {t('complete_transaction')}
                </Button>
                <Button 
                    variant="outline-danger" 
                    className="w-100 mt-2 cancel-btn"
                    onClick={() => setCart([])}
                    disabled={cart.length === 0}
                >
                    <FiXCircle className="me-2" /> 
                    {t('cancel_order')}
                </Button>
            </div>
        </div>
    );

    return (
        <>
            <style>{`
                :root {
                    --pos-primary: #4f46e5;
                    --pos-primary-light: #818cf8;
                    --pos-primary-dark: #3730a3;
                    --pos-success: #10b981;
                    --pos-danger: #ef4444;
                    --pos-warning: #f59e0b;
                    --pos-bg: #f8fafc;
                    --pos-card-bg: #ffffff;
                    --pos-border: #e2e8f0;
                    --pos-text: #1e293b;
                    --pos-text-muted: #64748b;
                    --pos-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
                    --pos-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
                    --pos-radius: 16px;
                    --pos-radius-sm: 8px;
                }

                .pos-wrapper {
                    min-height: calc(100vh - 120px);
                    padding: 0;
                }

                .pos-main {
                    background: var(--pos-bg);
                    min-height: calc(100vh - 120px);
                    border-radius: var(--pos-radius);
                }

                /* Category Tabs */
                .category-tabs {
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    padding: 12px 0;
                    scrollbar-width: none;
                }

                .category-tabs::-webkit-scrollbar {
                    display: none;
                }

                .category-tab {
                    padding: 8px 20px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 500;
                    white-space: nowrap;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    background: var(--pos-card-bg);
                    color: var(--pos-text-muted);
                    box-shadow: var(--pos-shadow);
                }

                .category-tab:hover {
                    background: var(--pos-primary-light);
                    color: white;
                }

                .category-tab.active {
                    background: var(--pos-primary);
                    color: white;
                }

                /* Product Cards */
                .product-card {
                    border-radius: var(--pos-radius);
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: var(--pos-card-bg);
                    border: 2px solid transparent;
                }

                .product-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--pos-shadow-lg);
                    border-color: var(--pos-primary-light);
                }

                .product-card-image {
                    height: 80px;
                    object-fit: cover;
                    width: 100%;
                }

                .product-card-body {
                    padding: 8px;
                }

                .product-name {
                    font-weight: 600;
                    font-size: 12px;
                    margin-bottom: 4px;
                    color: var(--pos-text);
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .product-price {
                    font-weight: 700;
                    color: var(--pos-primary);
                    font-size: 14px;
                }

                .product-stock {
                    font-size: 12px;
                    font-weight: 500;
                }

                .stock-badge {
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                }

                .stock-low {
                    background: #fef2f2;
                    color: var(--pos-danger);
                }

                .stock-ok {
                    background: #f0fdf4;
                    color: var(--pos-success);
                }

                /* Search Bar */
                .pos-search {
                    background: var(--pos-card-bg);
                    border-radius: var(--pos-radius);
                    box-shadow: var(--pos-shadow);
                    overflow: hidden;
                }

                .pos-search input {
                    border: none;
                    padding: 14px 16px;
                    font-size: 15px;
                    background: transparent;
                }

                .pos-search input:focus {
                    outline: none;
                    box-shadow: none;
                }

                .pos-search-icon {
                    color: var(--pos-text-muted);
                }

                /* Cart Panel */
                .pos-cart-panel {
                    background: var(--pos-card-bg);
                    border-radius: var(--pos-radius);
                    box-shadow: var(--pos-shadow-lg);
                    overflow: hidden;
                    height: calc(100vh - 140px);
                }

                .cart-header {
                    padding: 20px;
                    background: linear-gradient(135deg, var(--pos-primary) 0%, var(--pos-primary-dark) 100%);
                    color: white;
                }

                .cart-icon-wrapper {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 8px;
                }

                .cart-options {
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--pos-border);
                }

                .modern-select {
                    border-radius: var(--pos-radius-sm);
                    border: 2px solid var(--pos-border);
                    padding: 10px 14px;
                    font-size: 14px;
                    transition: all 0.2s;
                }

                .modern-select:focus {
                    border-color: var(--pos-primary);
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
                }

                .cart-items {
                    flex: 1;
                    overflow-y: auto;
                    padding: 12px;
                }

                .empty-cart {
                    padding: 40px 20px;
                }

                .empty-cart-icon {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--pos-bg);
                    border-radius: 50%;
                    color: var(--pos-text-muted);
                }

                .cart-item {
                    background: var(--pos-bg);
                    border-radius: var(--pos-radius-sm);
                    margin-bottom: 8px;
                    transition: all 0.2s;
                }

                .cart-item:hover {
                    background: #f1f5f9;
                }

                .cart-item-image {
                    width: 48px;
                    height: 48px;
                    border-radius: 8px;
                    object-fit: cover;
                }

                .cart-item-name {
                    font-size: 14px;
                    max-width: 120px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .quantity-controls {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .qty-btn {
                    width: 28px;
                    height: 28px;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    border: 1px solid var(--pos-border);
                }

                .qty-value {
                    font-weight: 600;
                    min-width: 24px;
                    text-align: center;
                }

                .cart-item-total {
                    font-weight: 600;
                    color: var(--pos-text);
                }

                .remove-btn {
                    opacity: 0.6;
                    transition: opacity 0.2s;
                }

                .remove-btn:hover {
                    opacity: 1;
                }

                .cart-summary {
                    padding: 20px;
                    background: var(--pos-bg);
                    border-top: 1px solid var(--pos-border);
                }

                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    color: var(--pos-text-muted);
                    font-size: 14px;
                }

                .summary-row.total {
                    padding: 16px 0;
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--pos-text);
                    border-top: 2px dashed var(--pos-border);
                    margin-top: 8px;
                }

                .total-amount {
                    color: var(--pos-primary);
                    font-size: 22px;
                }

                .checkout-btn {
                    border-radius: var(--pos-radius-sm);
                    font-size: 16px;
                    background: linear-gradient(135deg, var(--pos-primary) 0%, var(--pos-primary-dark) 100%);
                    border: none;
                    transition: all 0.3s;
                }

                .checkout-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
                }

                .checkout-btn:disabled {
                    opacity: 0.5;
                    transform: none;
                }

                .cancel-btn {
                    border-radius: var(--pos-radius-sm);
                    border: 2px solid var(--pos-border);
                }

                /* View Toggle */
                .view-toggle {
                    display: flex;
                    gap: 4px;
                    background: var(--pos-bg);
                    padding: 4px;
                    border-radius: 8px;
                }

                .view-btn {
                    padding: 8px 12px;
                    border: none;
                    background: transparent;
                    border-radius: 6px;
                    cursor: pointer;
                    color: var(--pos-text-muted);
                    transition: all 0.2s;
                }

                .view-btn.active {
                    background: var(--pos-card-bg);
                    color: var(--pos-primary);
                    box-shadow: var(--pos-shadow);
                }

                /* Mobile Cart Button */
                .mobile-cart-btn {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--pos-primary) 0%, var(--pos-primary-dark) 100%);
                    border: none;
                    box-shadow: 0 8px 24px rgba(79, 70, 229, 0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 24px;
                    z-index: 1000;
                    transition: all 0.3s;
                }

                .mobile-cart-btn:hover {
                    transform: scale(1.1);
                }

                .mobile-cart-badge {
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    background: var(--pos-danger);
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: 700;
                }

                /* Quick Actions */
                .quick-actions {
                    display: flex;
                    gap: 8px;
                    padding: 12px 0;
                }

                .quick-action-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    border-radius: 20px;
                    border: none;
                    background: var(--pos-card-bg);
                    color: var(--pos-text);
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    box-shadow: var(--pos-shadow);
                    transition: all 0.2s;
                }

                .quick-action-btn:hover {
                    background: var(--pos-primary);
                    color: white;
                }

                /* Product List View */
                .product-list-item {
                    display: flex;
                    align-items: center;
                    padding: 12px;
                    background: var(--pos-card-bg);
                    border-radius: var(--pos-radius-sm);
                    margin-bottom: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .product-list-item:hover {
                    box-shadow: var(--pos-shadow);
                    transform: translateX(4px);
                }

                .product-list-image {
                    width: 56px;
                    height: 56px;
                    border-radius: 8px;
                    object-fit: cover;
                }

                .product-list-info {
                    flex: 1;
                    padding: 0 12px;
                }

                /* Animations */
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fade-in {
                    animation: fadeInUp 0.4s ease forwards;
                }

                /* Responsive */
                @media (max-width: 991px) {
                    .pos-cart-panel {
                        height: 100%;
                    }
                }
            `}</style>

            <div className="pos-wrapper">
                <Row className="g-4">
                    {/* Product Selection Area */}
                    <Col lg={8}>
                        <div className="pos-main p-4">
                            {/* Header with Search and Controls */}
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
                                {/* Search Bar */}
                                <div className="pos-search flex-grow-1 me-md-3" style={{ maxWidth: '500px' }}>
                                    <InputGroup>
                                        <InputGroup.Text className="border-0 bg-transparent ps-3">
                                            <FiSearch className="pos-search-icon" />
                                        </InputGroup.Text>
                                        <Form.Control
                                            placeholder={t('search_products_pos') || 'Search products...'}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="border-0 shadow-none"
                                        />
                                        <InputGroup.Text 
                                            className="border-0 bg-transparent px-3 cursor-pointer"
                                            onClick={() => setShowBarcodeScanner(true)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <FiCamera className="pos-search-icon" />
                                        </InputGroup.Text>
                                    </InputGroup>
                                </div>

                                {/* View Toggle & Quick Actions */}
                                <div className="d-flex align-items-center gap-3">
                                    <div className="view-toggle">
                                        <button 
                                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                            onClick={() => setViewMode('grid')}
                                        >
                                            <FiGrid />
                                        </button>
                                        <button 
                                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                            onClick={() => setViewMode('list')}
                                        >
                                            <FiList />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Category Tabs */}
                            <div className="category-tabs">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                                        onClick={() => setSelectedCategory(cat)}
                                    >
                                        {cat === 'all' ? (t('all_products') || 'All Products') : cat}
                                    </button>
                                ))}
                            </div>

                            {/* Quick Actions */}
                            <div className="quick-actions">
                                {quickActions.map((action, index) => (
                                    <button
                                        key={index}
                                        className="quick-action-btn"
                                        onClick={action.action}
                                    >
                                        {action.icon}
                                        {action.label}
                                    </button>
                                ))}
                            </div>

                            {/* Products Grid/List */}
                            <div className="mt-3">
                                {filteredProducts.length === 0 ? (
                                    <div className="text-center py-5">
                                        <FiPackage size={64} className="text-muted mb-3" />
                                        <h5 className="text-muted">{t('no_products_found') || 'No products found'}</h5>
                                        <p className="text-muted small">{t('try_different_search') || 'Try a different search or category'}</p>
                                    </div>
                                ) : viewMode === 'grid' ? (
                                    <Row className="g-3">
                                        {filteredProducts.map((product, index) => (
                                            <Col xs={6} md={4} key={product.id}>
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.03 }}
                                                >
                                                    <Card 
                                                        className="product-card h-100"
                                                        onClick={() => addToCart(product)}
                                                    >
                                                        <div className="position-relative">
                                                            <Card.Img 
                                                                variant="top" 
                                                                src={product.image ? (product.image.startsWith('http') ? product.image : `${window.location.origin}${product.image}`) : 'https://via.placeholder.com/200x200?text=No+Image'} 
                                                                className="product-card-image"
                                                            />
                                                            <div className="product-price-badge">
                                                                {formatCurrency(product.price || product.unit_price || 0)}
                                                            </div>
                                                        </div>
                                                        <Card.Body className="product-card-body">
                                                            <div className="product-name">{product.name}</div>
                                                            <div className="d-flex justify-content-between align-items-center mt-2">
                                                                <small className="text-muted">{typeof product.category === 'object' ? product.category?.name : product.category}</small>
                                                                <span className={`stock-badge ${(product.stock || product.stock_quantity || 0) < 15 ? 'stock-low' : 'stock-ok'}`}>
                                                                    {product.stock ?? product.stock_quantity ?? 0}
                                                                </span>
                                                            </div>
                                                        </Card.Body>
                                                    </Card>
                                                </motion.div>
                                            </Col>
                                        ))}
                                    </Row>
                                ) : (
                                    <div>
                                        {filteredProducts.map((product, index) => (
                                            <motion.div
                                                key={product.id}
                                                className="product-list-item"
                                                onClick={() => addToCart(product)}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                            >
                                                <img
                                                    src={product.image ? (product.image.startsWith('http') ? product.image : `${window.location.origin}${product.image}`) : 'https://via.placeholder.com/56x56?text=No+Image'}
                                                    alt={product.name}
                                                    className="product-list-image"
                                                />
                                                <div className="product-list-info">
                                                    <div className="fw-bold">{product.name}</div>
                                                    <small className="text-muted">{typeof product.category === 'object' ? product.category?.name : product.category}</small>
                                                </div>
                                                <div className="text-end">
                                                    <div className="product-price">{formatCurrency(product.price || product.unit_price || 0)}</div>
                                                    <span className={`stock-badge ${(product.stock || product.stock_quantity || 0) < 15 ? 'stock-low' : 'stock-ok'}`}>
                                                        {product.stock ?? product.stock_quantity ?? 0}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Col>

                    {/* Desktop Cart */}
                    <Col lg={4} className="d-none d-lg-block">
                        <div className="sticky-top" style={{ top: '100px' }}>
                            <CartPanel />
                        </div>
                    </Col>
                </Row>

                {/* Mobile Cart Button */}
                <button 
                    className="mobile-cart-btn d-lg-none"
                    onClick={() => setShowCartMobile(true)}
                >
                    <FiShoppingCart />
                    {cart.length > 0 && (
                        <span className="mobile-cart-badge">{cart.length}</span>
                    )}
                </button>

                {/* Mobile Cart Offcanvas */}
                <Offcanvas 
                    show={showCartMobile} 
                    onHide={() => setShowCartMobile(false)} 
                    placement="end"
                    className="mobile-cart-offcanvas"
                >
                    <Offcanvas.Header closeButton className="border-bottom">
                        <Offcanvas.Title className="fw-bold d-flex align-items-center gap-2">
                            <FiShoppingCart /> {t('current_order')}
                        </Offcanvas.Title>
                    </Offcanvas.Header>
                    <Offcanvas.Body className="p-0">
                        <CartPanel />
                    </Offcanvas.Body>
                </Offcanvas>

                {/* Barcode Scanner Modal */}
                <BarcodeScannerModal
                    show={showBarcodeScanner}
                    onHide={() => setShowBarcodeScanner(false)}
                    onDetected={handleBarcodeDetected}
                />
            </div>
        </>
    );
};

export default POS;
