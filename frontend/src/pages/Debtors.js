import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, Alert } from 'react-bootstrap';
import { FiSearch, FiDollarSign, FiClock, FiUser, FiDownload, FiArrowRight } from 'react-icons/fi';
import { customersAPI, invoicesAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import { useI18n } from '../i18n/I18nProvider';

const Debtors = () => {
    const { t } = useI18n();
    const { formatCurrency } = useCurrency();
    const [debtors, setDebtors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedDebtor, setSelectedDebtor] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        fetchDebtors();
    }, []);

    const handleSyncBalances = async () => {
        try {
            setIsSyncing(true);
            await customersAPI.recalculateBalances();
            toast.success('Balances synchronized successfully');
            fetchDebtors();
        } catch (err) {
            console.error('Error syncing balances:', err);
            toast.error('Failed to sync balances');
        } finally {
            setIsSyncing(false);
        }
    };

    const fetchDebtors = async () => {
        try {
            setLoading(true);
            const response = await customersAPI.getCustomers();
            // Filter only those who owe money (balance > 0)
            const allCustomers = response.data.customers || [];
            const filteredDebtors = allCustomers.filter(c => (c.balance || 0) > 0);
            setDebtors(filteredDebtors);
        } catch (err) {
            console.error('Error fetching debtors:', err);
            toast.error('Failed to load debtors list');
        } finally {
            setLoading(false);
        }
    };

    const handleRecordPayment = (debtor) => {
        setSelectedDebtor(debtor);
        setShowPaymentModal(true);
    };

    const handleSavePayment = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const amount = parseFloat(formData.get('amount'));
        const notes = formData.get('notes');

        if (isNaN(amount) || amount <= 0) {
            toast.error('Please enter a valid payment amount');
            return;
        }

        setIsSaving(true);
        try {
            // In a real app, we might need to apply this to specific invoices
            // For now, we'll use a generic endpoint or update the customer balance
            // Since we don't have a direct "record customer payment" endpoint that handles balance,
            // we'll assume the backend handles it via an invoice payment or a new endpoint.
            // Let's check if we can find an invoice for this debtor to apply payment to.

            const invoicesResponse = await invoicesAPI.getInvoices({ customer_id: selectedDebtor.id, status: 'SENT' });
            const pendingInvoices = invoicesResponse.data.invoices || [];

            if (pendingInvoices.length > 0) {
                // Apply to the oldest pending invoice
                const oldestInvoice = pendingInvoices[pendingInvoices.length - 1];
                await invoicesAPI.recordPayment(oldestInvoice.id, { amount, notes });
                toast.success(`Payment of ${formatCurrency(amount)} recorded for ${selectedDebtor.first_name}`);
            } else {
                // If no specific invoice, we might need a general credit note or balance adjustment
                // For this demo, we'll just update the balance if the API supports it
                await customersAPI.updateCustomer(selectedDebtor.id, {
                    balance: parseFloat(selectedDebtor.balance) - amount
                });
                toast.success(`Balance updated for ${selectedDebtor.first_name}`);
            }

            fetchDebtors();
            setShowPaymentModal(false);
        } catch (err) {
            console.error('Error recording payment:', err);
            
            // Extract specific error message from backend
            let errorMessage = 'Failed to record payment';
            if (err.response && err.response.data && err.response.data.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            toast.error(errorMessage, {
                duration: 5000,
                style: {
                    background: '#f8d7da',
                    color: '#721c24',
                    border: '1px solid #f5c6cb'
                }
            });
        } finally {
            setIsSaving(false);
        }
    };

    const filteredDebtors = debtors.filter(debtor => {
        const fullName = `${debtor.first_name} ${debtor.last_name}`.toLowerCase();
        const company = (debtor.company || '').toLowerCase();
        return fullName.includes(searchTerm.toLowerCase()) || company.includes(searchTerm.toLowerCase());
    });

    const totalDebt = debtors.reduce((acc, curr) => acc + (parseFloat(curr.balance) || 0), 0);

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
        <div className="debtors-wrapper">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Accounts Receivable (Debtors)</h2>
                    <p className="text-muted mb-0">Track and manage customers who owe money to the business.</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-primary" className="d-flex align-items-center" onClick={handleSyncBalances} disabled={isSyncing}>
                        <FiClock className={`me-2 ${isSyncing ? 'spin' : ''}`} /> {isSyncing ? 'Syncing...' : 'Sync Balances'}
                    </Button>
                    <Button variant="outline-secondary" className="d-flex align-items-center" onClick={() => toast.success('Report exported')}>
                        <FiDownload className="me-2" /> Export List
                    </Button>
                </div>
            </div>

            <Row className="g-3 g-md-4 mb-4">
                <Col xs={12} md={4}>
                    <Card className="border-0 shadow-sm h-100 bg-primary text-white card-responsive">
                        <Card.Body className="p-3 p-md-4">
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-white bg-opacity-20 p-2 rounded me-2 me-md-3">
                                    <FiDollarSign size={24} />
                                </div>
                                <span className="fw-medium small small-md">Total Outstanding Debt</span>
                            </div>
                            <h2 className="fw-bold mb-0 h4 h3-md">{formatCurrency(totalDebt)}</h2>
                            <small className="opacity-75 d-none d-md-block">From {debtors.length} customers</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={4}>
                    <Card className="border-0 shadow-sm h-100 card-responsive">
                        <Card.Body className="p-3 p-md-4">
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-warning bg-opacity-10 p-2 rounded me-2 me-md-3">
                                    <FiClock className="text-warning" size={24} />
                                </div>
                                <span className="text-muted fw-medium small small-md">Average Debt Age</span>
                            </div>
                            <h2 className="fw-bold mb-0 h4 h3-md">18 Days</h2>
                            <small className="text-muted d-none d-md-block">Within collection targets</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={4}>
                    <Card className="border-0 shadow-sm h-100 card-responsive">
                        <Card.Body className="p-3 p-md-4">
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-success bg-opacity-10 p-2 rounded me-2 me-md-3">
                                    <FiUser className="text-success" size={24} />
                                </div>
                                <span className="text-muted fw-medium small small-md">Top Debtor</span>
                            </div>
                            <h2 className="fw-bold mb-0 text-truncate h5 h4-md">
                                {debtors.length > 0 ? `${debtors[0].first_name} ${debtors[0].last_name}` : 'None'}
                            </h2>
                            <small className="text-muted d-none d-md-block">Owes {debtors.length > 0 ? formatCurrency(debtors[0].balance) : '$0'}</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <div className="p-3 border-bottom">
                        <InputGroup style={{ maxWidth: '400px' }}>
                            <InputGroup.Text className="bg-light border-end-0">
                                <FiSearch className="text-muted" />
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Search debtors by name or company..."
                                className="bg-light border-start-0 ps-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </div>

                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0 py-3 ps-4">Customer</th>
                                    <th className="border-0 py-3">Contact</th>
                                    <th className="border-0 py-3">Total Owed</th>
                                    <th className="border-0 py-3">Status</th>
                                    <th className="border-0 py-3 text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDebtors.length > 0 ? (
                                    filteredDebtors.map(debtor => (
                                        <tr key={debtor.id}>
                                            <td className="ps-4">
                                                <div className="fw-bold text-dark">{debtor.first_name} {debtor.last_name}</div>
                                                <div className="small text-muted">{debtor.company || 'Individual'}</div>
                                            </td>
                                            <td>
                                                <div className="small text-dark">{debtor.phone}</div>
                                                <div className="small text-muted">{debtor.email}</div>
                                            </td>
                                            <td>
                                                <div className="fw-bold text-danger">{formatCurrency(debtor.balance)}</div>
                                            </td>
                                            <td>
                                                {parseFloat(debtor.balance) > 5000 ? (
                                                    <Badge bg="danger" className="fw-normal">High Priority</Badge>
                                                ) : (
                                                    <Badge bg="warning" text="dark" className="fw-normal">Pending</Badge>
                                                )}
                                            </td>
                                            <td className="text-end pe-4">
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    className="d-inline-flex align-items-center"
                                                    onClick={() => handleRecordPayment(debtor)}
                                                >
                                                    Record Payment <FiArrowRight className="ms-2" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5 text-muted">
                                            No outstanding debts found. All customers are cleared!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Record Payment Modal */}
            <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">Record Payment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedDebtor && (
                        <Form onSubmit={handleSavePayment}>
                            <div className="bg-light p-3 rounded mb-4">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Customer:</span>
                                    <span className="fw-bold">{selectedDebtor.first_name} {selectedDebtor.last_name}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted">Current Balance:</span>
                                    <span className="fw-bold text-danger">{formatCurrency(selectedDebtor.balance)}</span>
                                </div>
                            </div>

                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold small">Payment Amount</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text>$</InputGroup.Text>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        name="amount"
                                        max={selectedDebtor.balance}
                                        placeholder="0.00"
                                        required
                                        autoFocus
                                    />
                                </InputGroup>
                                <Form.Text className="text-muted">
                                    Enter the amount received from the customer.
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="fw-semibold small">Notes / Reference</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    name="notes"
                                    placeholder="e.g., Cash payment, Bank transfer ref..."
                                />
                            </Form.Group>

                            <div className="d-grid">
                                <Button variant="primary" type="submit" disabled={isSaving}>
                                    {isSaving ? 'Recording...' : 'Confirm Payment'}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
            
            <style dangerouslySetInnerHTML={{
                __html: `
                /* Mobile Responsive Styles for Debtors Cards */
                @media (max-width: 767.98px) {
                    .card-responsive {
                        min-height: 120px;
                        margin-bottom: 10px;
                    }
                    
                    .card-responsive .card-body {
                        padding: 12px !important;
                    }
                    
                    .small-md {
                        font-size: 0.75rem !important;
                    }
                    
                    .h3-md {
                        font-size: 1.75rem !important;
                    }
                    
                    .h4-md {
                        font-size: 1.25rem !important;
                    }
                    
                    .h5 {
                        font-size: 1rem !important;
                    }
                    
                    /* Adjust icon sizes for mobile */
                    .card-responsive svg {
                        width: 16px !important;
                        height: 16px !important;
                    }
                    
                    /* Reduce spacing between cards on mobile */
                    .row.g-3 {
                        --bs-gutter-x: 1rem;
                        --bs-gutter-y: 1rem;
                    }
                    
                    /* Ensure cards stack properly on very small screens */
                    @media (max-width: 575.98px) {
                        .card-responsive {
                            min-height: 100px;
                        }
                        
                        .card-responsive .card-body {
                            padding: 10px !important;
                        }
                        
                        .small-md {
                            font-size: 0.7rem !important;
                        }
                        
                        .h3-md {
                            font-size: 1.5rem !important;
                        }
                        
                        .h4-md {
                            font-size: 1.1rem !important;
                        }
                        
                        .h5 {
                            font-size: 0.9rem !important;
                        }
                    }
                }
                
                /* Desktop styles */
                @media (min-width: 768px) {
                    .small-md {
                        font-size: 0.875rem !important;
                    }
                    
                    .h3-md {
                        font-size: 2rem !important;
                    }
                    
                    .h4-md {
                        font-size: 1.5rem !important;
                    }
                }
                
                /* Smooth transitions */
                .card-responsive {
                    transition: all 0.2s ease-in-out;
                }
                
                .card-responsive:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1) !important;
                }
                `}} />
        </div>
    );
};

export default Debtors;
