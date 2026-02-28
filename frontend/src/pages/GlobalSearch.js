import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Spinner, Button, Badge } from 'react-bootstrap';
import { FiBox, FiUsers, FiFileText, FiShoppingCart, FiArrowRight } from 'react-icons/fi';
import { inventoryAPI, customersAPI, invoicesAPI, salesAPI } from '../services/api';

const useQuery = () => {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
};

const Section = ({ title, icon, items, emptyText, onSeeAll }) => (
  <Card className="border-0 shadow-sm mb-3">
    <Card.Body>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center gap-2">
          {icon}
          <h6 className="mb-0">{title}</h6>
          <Badge bg="light" text="dark">{items.length}</Badge>
        </div>
        <Button variant="link" className="text-decoration-none" onClick={onSeeAll}>
          See all <FiArrowRight />
        </Button>
      </div>
      {items.length === 0 ? (
        <div className="text-muted small">{emptyText}</div>
      ) : (
        <ul className="list-unstyled mb-0">
          {items.map((it, idx) => (
            <li key={idx} className="py-1 d-flex justify-content-between border-bottom">
              <span className="text-truncate">{it.label}</span>
              {it.meta && <span className="text-muted small">{it.meta}</span>}
            </li>
          ))}
        </ul>
      )}
    </Card.Body>
  </Card>
);

const GlobalSearch = () => {
  const q = useQuery().get('q') || '';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!q.trim()) return;
      setLoading(true);
      try {
        const [prodRes, custRes, ordRes, invRes] = await Promise.all([
          inventoryAPI.getProducts({ per_page: 5, search: q }),
          customersAPI.getCustomers({ per_page: 5, search: q }),
          salesAPI.getOrders({ per_page: 5, search: q }),
          invoicesAPI.getInvoices({ per_page: 5, search: q }),
        ]);
        if (cancelled) return;
        setProducts((prodRes.data.products || []).map(p => ({
          label: `${p.name} (${p.sku || p.product_id || ''})`,
          meta: p.category_name || ''
        })));
        setCustomers((custRes.data.customers || []).map(c => ({
          label: `${c.first_name || ''} ${c.last_name || ''} ${c.company ? `- ${c.company}` : ''}`.trim(),
          meta: c.email || c.phone || ''
        })));
        setOrders((ordRes.data.orders || []).map(o => ({
          label: `Order ${o.order_id}`,
          meta: o.status
        })));
        setInvoices((invRes.data.invoices || []).map(i => ({
          label: `Invoice ${i.invoice_id}`,
          meta: i.status
        })));
      } catch (e) {
        // Fail silently; page will show "no results" states
        setProducts([]); setCustomers([]); setOrders([]); setInvoices([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [q]);

  if (!q.trim()) {
    return (
      <div className="p-3">
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <h5 className="mb-1">Start typing to search</h5>
            <p className="text-muted mb-0">Search products, customers, orders and invoices</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Search results for “{q}”</h5>
        {loading && <Spinner size="sm" animation="border" />}
      </div>
      <Row className="g-3">
        <Col md={6}>
          <Section
            title="Products"
            icon={<FiBox className="text-primary" />}
            items={products}
            emptyText="No matching products"
            onSeeAll={() => navigate(`/products`)}
          />
        </Col>
        <Col md={6}>
          <Section
            title="Customers"
            icon={<FiUsers className="text-success" />}
            items={customers}
            emptyText="No matching customers"
            onSeeAll={() => navigate(`/customers`)}
          />
        </Col>
        <Col md={6}>
          <Section
            title="Orders"
            icon={<FiShoppingCart className="text-info" />}
            items={orders}
            emptyText="No matching orders"
            onSeeAll={() => navigate(`/sales-orders`)}
          />
        </Col>
        <Col md={6}>
          <Section
            title="Invoices"
            icon={<FiFileText className="text-warning" />}
            items={invoices}
            emptyText="No matching invoices"
            onSeeAll={() => navigate(`/invoices`)}
          />
        </Col>
      </Row>
    </div>
  );
};

export default GlobalSearch;

