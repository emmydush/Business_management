import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Button, Form, InputGroup, Offcanvas, Dropdown } from 'react-bootstrap';
import { FiSearch, FiShoppingCart, FiMinus, FiPlus, FiTrash2, FiPackage } from 'react-icons/fi';
import { inventoryAPI, customersAPI, salesAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import toast from 'react-hot-toast';

const Trade = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCartMobile, setShowCartMobile] = useState(false);
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    const fetch = async () => {
      try {
        const [prodRes, custRes] = await Promise.all([
          inventoryAPI.getProducts({ per_page: 1000 }),
          customersAPI.getCustomers({ per_page: 1000 }),
        ]);
        setProducts(prodRes.data.products || []);
        const list = custRes.data.customers || [];
        setCustomers(list);
        setSelectedCustomer(list[0] || null);
      } catch (e) {
        console.error(e);
      }
    };
    fetch();
  }, []);

  const weightProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (products || [])
      .filter(p => {
        const unit = (p.unit_of_measure || '').toLowerCase();
        const isWeight = ['kg', 'kgs', 'kilogram', 'kilograms'].includes(unit);
        const q = term.length === 0 || p.name.toLowerCase().includes(term);
        return isWeight && q;
      });
  }, [products, search]);

  const addToCart = (p) => {
    const exists = cart.find(i => i.id === p.id);
    if (exists) {
      setCart(prev => prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart(prev => [...prev, { id: p.id, name: p.name, unit_price: p.unit_price || 0, quantity: 1, unit: p.unit_of_measure }]);
    }
    toast.success('Added');
  };

  const updateQty = (id, qty) => {
    const q = Math.max(0, parseFloat(qty || 0));
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: isNaN(q) ? 0 : q } : i));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const subtotal = useMemo(() => cart.reduce((a, i) => a + (i.unit_price * i.quantity), 0), [cart]);

  const checkout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    const customerId = selectedCustomer?.id || customers[0]?.id;
    if (!customerId) {
      toast.error('Select a customer');
      return;
    }
    const payload = {
      customer_id: customerId,
      items: cart.map(i => ({
        product_id: i.id,
        quantity: i.quantity,
        unit_price: i.unit_price
      })),
      subtotal,
      total_amount: subtotal,
      payment_status: 'PAID'
    };
    try {
      toast.loading('Submitting...');
      await salesAPI.createPosSale(payload);
      toast.dismiss();
      toast.success('Trade completed');
      setCart([]);
      setShowCartMobile(false);
    } catch (e) {
      toast.dismiss();
      toast.error(e.response?.data?.error || 'Failed to submit sale');
    }
  };

  return (
    <div className="container-fluid p-4">
      <Row className="g-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <InputGroup style={{ maxWidth: 420 }}>
                  <InputGroup.Text className="bg-white border-1"><FiSearch /></InputGroup.Text>
                  <Form.Control placeholder="Search weight products (kg)" value={search} onChange={e => setSearch(e.target.value)} />
                </InputGroup>
                <div className="d-flex align-items-center gap-2">
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary">{selectedCustomer ? `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim() : 'Select Customer'}</Dropdown.Toggle>
                    <Dropdown.Menu style={{ maxHeight: 260, overflowY: 'auto' }}>
                      {customers.map(c => (
                        <Dropdown.Item key={c.id} onClick={() => setSelectedCustomer(c)}>
                          {c.first_name} {c.last_name} {c.company && `(${c.company})`}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                  <Button variant="primary" className="d-lg-none" onClick={() => setShowCartMobile(true)}>
                    <FiShoppingCart className="me-1" /> Cart ({cart.length})
                  </Button>
                </div>
              </div>

              {weightProducts.length === 0 ? (
                <div className="text-center py-5">
                  <FiPackage size={64} className="text-muted mb-2" />
                  <div className="text-muted">No weight-based products found</div>
                </div>
              ) : (
                <Row className="g-3">
                  {weightProducts.map(p => (
                    <Col xs={6} md={4} lg={3} key={p.id}>
                      <Card className="h-100 border-0 shadow-sm">
                        <div className="ratio ratio-1x1 bg-white d-flex align-items-center justify-content-center">
                          <img alt={p.name} src={p.image ? (p.image.startsWith('http') ? p.image : `${window.location.origin}${p.image}`) : 'https://via.placeholder.com/200x200?text=No+Image'} style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%', padding: 8 }} onError={(e) => { e.target.src = 'https://via.placeholder.com/200x200?text=No+Image'; }} />
                        </div>
                        <Card.Body className="d-flex flex-column">
                          <div className="fw-semibold mb-1" title={p.name} style={{ minHeight: 40 }}>{p.name}</div>
                          <div className="text-primary fw-bold mb-2">{formatCurrency(p.unit_price || 0)} / kg</div>
                          <Button variant="outline-primary" className="mt-auto" onClick={() => addToCart(p)}>Add</Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4} className="d-none d-lg-block">
          <Card className="border-0 shadow-sm sticky-top" style={{ top: 16 }}>
            <Card.Header className="bg-white fw-bold">Trade Cart</Card.Header>
            <Card.Body>
              {cart.length === 0 ? (
                <div className="text-muted small">No items</div>
              ) : (
                <>
                  {cart.map(item => (
                    <div key={item.id} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                      <div>
                        <div className="fw-semibold">{item.name}</div>
                        <div className="text-muted small">{formatCurrency(item.unit_price)} / kg</div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <Button size="sm" variant="light" onClick={() => updateQty(item.id, Math.max(0, (item.quantity - 0.5)))}><FiMinus /></Button>
                        <Form.Control
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={e => updateQty(item.id, e.target.value)}
                          style={{ width: 80 }}
                        />
                        <Button size="sm" variant="light" onClick={() => updateQty(item.id, item.quantity + 0.5)}><FiPlus /></Button>
                        <Button size="sm" variant="link" className="text-danger" onClick={() => removeFromCart(item.id)}><FiTrash2 /></Button>
                      </div>
                    </div>
                  ))}
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="fw-bold">Total</div>
                    <div className="fw-bold text-primary">{formatCurrency(subtotal)}</div>
                  </div>
                  <Button variant="primary" className="w-100 mt-3" onClick={checkout} disabled={cart.length === 0}>Sell</Button>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Offcanvas placement="end" show={showCartMobile} onHide={() => setShowCartMobile(false)} className="d-lg-none">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Trade Cart</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {cart.length === 0 ? (
            <div className="text-muted small">No items</div>
          ) : (
            <>
              {cart.map(item => (
                <div key={item.id} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                  <div>
                    <div className="fw-semibold">{item.name}</div>
                    <div className="text-muted small">{formatCurrency(item.unit_price)} / kg</div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Button size="sm" variant="light" onClick={() => updateQty(item.id, Math.max(0, (item.quantity - 0.5)))}><FiMinus /></Button>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={e => updateQty(item.id, e.target.value)}
                      style={{ width: 80 }}
                    />
                    <Button size="sm" variant="light" onClick={() => updateQty(item.id, item.quantity + 0.5)}><FiPlus /></Button>
                    <Button size="sm" variant="link" className="text-danger" onClick={() => removeFromCart(item.id)}><FiTrash2 /></Button>
                  </div>
                </div>
              ))}
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="fw-bold">Total</div>
                <div className="fw-bold text-primary">{formatCurrency(subtotal)}</div>
              </div>
              <Button variant="primary" className="w-100 mt-3" onClick={checkout} disabled={cart.length === 0}>Sell</Button>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

export default Trade;

