import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiPackage, FiTruck, FiDollarSign, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { purchaseReturnsAPI, purchasesAPI } from '../services/api';

import { useCurrency } from '../context/CurrencyContext';

const PurchaseReturns = () => {
    const { formatCurrency } = useCurrency(); // Currency context formatting

    const [purchaseReturns, setPurchaseReturns] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [currentReturn, setCurrentReturn] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [poSearch, setPoSearch] = useState('');
    const [showPoDropdown, setShowPoDropdown] = useState(false);
    const [isLoadingPOs, setIsLoadingPOs] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [selectedPO, setSelectedPO] = useState(null);

    useEffect(() => {
        fetchPurchaseReturns();
    }, []);

    const fetchPurchaseReturns = async () => {
        try {
            setLoading(true);
            const response = await purchaseReturnsAPI.getPurchaseReturns();
            setPurchaseReturns(response.data.purchase_returns || []);
            setError(null);
        } catch (err) {
            console.error('Failed to load purchase returns:', err);
            setError('Failed to load purchase returns.');
        } finally {
            setLoading(false);
        }
    };

    const loadAllPurchaseOrders = async () => {
        try {
            setIsLoadingPOs(true);
            const response = await purchasesAPI.getPurchaseOrders({ per_page: 100 });
            setPurchaseOrders(response.data.purchase_orders || []);
            setShowPoDropdown(true);
        } catch (err) {
            console.error('Failed to load purchase orders:', err);
            toast.error('Failed to load purchase orders');
        } finally {
            setIsLoadingPOs(false);
        }
    };

    const handleSelectPurchaseOrder = (order) => {
        setSelectedPO(order);
        setSelectedSupplier(order.supplier);
        setPoSearch(`${order.order_number} - ${order.supplier?.name || 'Unknown Supplier'}`);
        setShowPoDropdown(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const formData = new FormData(e.target);
            const returnData = {
                purchase_order_id: selectedPO?.id,
                supplier_id: selectedSupplier?.id,
                items: [{
                    product_id: 1, // This should come from a product selector
                    quantity: parseInt(formData.get('quantity')),
                    unit_cost: parseFloat(formData.get('unit_cost')),
                    return_reason: formData.get('return_reason'),
                    condition: formData.get('condition')
                }],
                reason: formData.get('reason'),
                return_type: formData.get('return_type'),
                expected_credit_date: formData.get('expected_credit_date'),
                tracking_number: formData.get('tracking_number'),
                carrier: formData.get('carrier'),
                notes: formData.get('notes')
            };

            if (currentReturn) {
                await purchaseReturnsAPI.updatePurchaseReturn(currentReturn.id, returnData);
                toast.success('Purchase return updated successfully!');
            } else {
                await purchaseReturnsAPI.createPurchaseReturn(returnData);
                toast.success('Purchase return created successfully!');
            }

            setShowModal(false);
            setCurrentReturn(null);
            fetchPurchaseReturns();
            resetForm();
        } catch (err) {
            console.error('Save failed:', err);
            toast.error(err.response?.data?.error || 'Failed to save purchase return');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (ret) => {
        setCurrentReturn(ret);
        setSelectedPO({ id: ret.purchase_order_id, order_number: ret.purchase_order_number });
        setSelectedSupplier({ id: ret.supplier_id, name: ret.supplier_name });
        setPoSearch(`${ret.purchase_order_number} - ${ret.supplier_name}`);
        setShowModal(true);
    };

    const handleDelete = (id) => {
        toast((t) => (
            <span>
                Delete this purchase return?
                <div className="mt-2 d-flex gap-2">
                    <Button size="sm" variant="danger" onClick={async () => {
                        try {
                            await purchaseReturnsAPI.deletePurchaseReturn(id);
                            setPurchaseReturns(purchaseReturns.filter(r => r.id !== id));
                            toast.dismiss(t.id);
                            toast.success('Purchase return deleted successfully!');
                        } catch (err) {
                            toast.error('Failed to delete purchase return');
                        }
                    }}>
                        Delete
                    </Button>
                    <Button size="sm" variant="outline-secondary" onClick={() => toast.dismiss(t.id)}>
                        Cancel
                    </Button>
                </div>
            </span>
        ));
    };

    const resetForm = () => {
        setSelectedPO(null);
        setSelectedSupplier(null);
        setPoSearch('');
        setCurrentReturn(null);
    };

    const handleClose = () => {
        setShowModal(false);
        resetForm();
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'pending': { bg: 'warning', text: 'Pending' },
            'approved': { bg: 'info', text: 'Approved' },
            'shipped': { bg: 'primary', text: 'Shipped' },
            'received_by_supplier': { bg: 'info', text: 'Received by Supplier' },
            'credited': { bg: 'success', text: 'Credited' },
            'rejected': { bg: 'danger', text: 'Rejected' }
        };
        
        const config = statusMap[status?.toLowerCase()] || { bg: 'secondary', text: status };
        return <Badge bg={config.bg} className="fw-normal">{config.text}</Badge>;
    };

    const getReturnTypeBadge = (type) => {
        const typeMap = {
            'defective': { bg: 'danger', text: 'Defective' },
            'wrong_item': { bg: 'warning', text: 'Wrong Item' },
            'overstock': { bg: 'info', text: 'Overstock' },
            'expired': { bg: 'secondary', text: 'Expired' }
        };
        
        const config = typeMap[type?.toLowerCase()] || { bg: 'secondary', text: type };
        return <Badge bg={config.bg} className="fw-normal">{config.text}</Badge>;
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <div className="text-center">
                    <Spinner animation="border" className="mb-3" />
                    <p>Loading purchase returns...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Purchase Returns</h2>
                    <p className="text-muted mb-0">Manage returns to suppliers</p>
                </div>
                <Button variant="primary" className="d-flex align-items-center" onClick={() => setShowModal(true)}>
                    <FiPlus className="me-2" /> New Purchase Return
                </Button>
            </div>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Stats Cards */}
            <Row className="g-3 mb-4">
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                                    <FiPackage className="text-warning" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Pending Returns</span>
                            </div>
                            <h3 className="fw-bold mb-0">{purchaseReturns.filter(r => r.status === 'pending').length}</h3>
                            <small className="text-muted">Awaiting approval</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                                    <FiTruck className="text-primary" size={20} />
                                </div>
                                <span className="text-muted fw-medium">In Transit</span>
                            </div>
                            <h3 className="fw-bold mb-0">{purchaseReturns.filter(r => ['approved', 'shipped'].includes(r.status)).length}</h3>
                            <small className="text-muted">Shipped to suppliers</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                                    <FiDollarSign className="text-success" size={20} />
                                </div>
                                <span className="text-muted fw-medium">Total Credit Value</span>
                            </div>
                            <h3 className="fw-bold mb-0">
                                {formatCurrency(purchaseReturns
                                    .filter(r => r.status === 'credited')
                                    .reduce((acc, curr) => acc + (curr.credit_amount || 0), 0))}
                            </h3>
                            <small className="text-muted">Credits received</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                                    <FiCalendar className="text-info" size={20} />
                                </div>
                                <span className="text-muted fw-medium">This Month</span>
                            </div>
                            <h3 className="fw-bold mb-0">{purchaseReturns.length}</h3>
                            <small className="text-muted">Total returns</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Main Table */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0 py-3 ps-4">Return ID</th>
                                    <th className="border-0 py-3">Supplier</th>
                                    <th className="border-0 py-3">Purchase Order</th>
                                    <th className="border-0 py-3">Return Date</th>
                                    <th className="border-0 py-3">Type</th>
                                    <th className="border-0 py-3">Amount</th>
                                    <th className="border-0 py-3">Status</th>
                                    <th className="border-0 py-3 text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchaseReturns.map(ret => (
                                    <tr key={ret.id}>
                                        <td className="ps-4">
                                            <div className="fw-bold text-primary">{ret.return_id}</div>
                                        </td>
                                        <td>
                                            <div className="fw-medium text-dark">{ret.supplier_name}</div>
                                        </td>
                                        <td>
                                            <div className="text-muted small">{ret.purchase_order_number}</div>
                                        </td>
                                        <td>
                                            <div className="text-muted small">{ret.return_date}</div>
                                        </td>
                                        <td>
                                            {getReturnTypeBadge(ret.return_type)}
                                        </td>
                                        <td>
                                            <div className="fw-bold text-dark">{formatCurrency(ret.total_amount || 0)}</div>
                                        </td>
                                        <td>
                                            {getStatusBadge(ret.status)}
                                        </td>
                                        <td className="text-end pe-4">
                                            <div className="d-flex gap-2 justify-content-end">
                                                <Button variant="outline-primary" size="sm" className="d-flex align-items-center" title="View Details">
                                                    <FiEye size={16} />
                                                </Button>
                                                <Button variant="outline-warning" size="sm" className="d-flex align-items-center" onClick={() => handleEdit(ret)} title="Edit">
                                                    <FiEdit2 size={16} />
                                                </Button>
                                                <Button variant="outline-danger" size="sm" className="d-flex align-items-center" onClick={() => handleDelete(ret.id)} title="Delete">
                                                    <FiTrash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Modal */}
            <Modal show={showModal} onHide={handleClose} centered size="lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">
                        {currentReturn ? `Edit Purchase Return: ${currentReturn.return_id}` : 'New Purchase Return'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-4">
                    <Form id="purchaseReturnForm" onSubmit={handleSave}>
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Search Purchase Order</Form.Label>
                                    <div className="position-relative">
                                        <Form.Control
                                            type="text"
                                            placeholder="Type PO number or supplier name..."
                                            value={poSearch}
                                            onChange={(e) => setPoSearch(e.target.value)}
                                            onFocus={() => purchaseOrders.length > 0 && setShowPoDropdown(true)}
                                        />
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            className="position-absolute end-0 top-50 translate-middle-y me-1"
                                            onClick={loadAllPurchaseOrders}
                                            disabled={isLoadingPOs}
                                        >
                                            {isLoadingPOs ? '...' : 'Show All'}
                                        </Button>
                                        {isLoadingPOs && (
                                            <div className="position-absolute end-0 top-50 translate-middle-y me-16">
                                                <div className="spinner-border spinner-border-sm" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                            </div>
                                        )}
                                        {showPoDropdown && purchaseOrders.length > 0 && (
                                            <div className="position-absolute w-100 bg-white border rounded shadow-lg mt-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                                                {purchaseOrders.map((order) => (
                                                    <div
                                                        key={order.id}
                                                        className="px-3 py-2 border-bottom cursor-pointer hover-bg-light"
                                                        onClick={() => handleSelectPurchaseOrder(order)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="fw-medium">{order.order_number}</div>
                                                        <div className="text-muted small">{order.supplier?.name || 'Unknown Supplier'}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Supplier</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={selectedSupplier?.name || ''}
                                        readOnly
                                        placeholder="Select purchase order first"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Return Type</Form.Label>
                                    <Form.Select name="return_type" required>
                                        <option value="">Select type...</option>
                                        <option value="defective">Defective</option>
                                        <option value="wrong_item">Wrong Item</option>
                                        <option value="overstock">Overstock</option>
                                        <option value="expired">Expired</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Quantity</Form.Label>
                                    <Form.Control type="number" name="quantity" min="1" required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Unit Cost</Form.Label>
                                    <Form.Control type="number" name="unit_cost" step="0.01" min="0" required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Condition</Form.Label>
                                    <Form.Select name="condition" required>
                                        <option value="">Select condition...</option>
                                        <option value="defective">Defective</option>
                                        <option value="damaged">Damaged</option>
                                        <option value="wrong_spec">Wrong Specification</option>
                                        <option value="expired">Expired</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Expected Credit Date</Form.Label>
                                    <Form.Control type="date" name="expected_credit_date" required />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Return Reason</Form.Label>
                                    <Form.Control as="textarea" rows={2} name="return_reason" placeholder="Why are these items being returned?" required />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Overall Reason</Form.Label>
                                    <Form.Control as="textarea" rows={2} name="reason" placeholder="Overall reason for this return..." required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Tracking Number</Form.Label>
                                    <Form.Control type="text" name="tracking_number" placeholder="Optional tracking number" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Carrier</Form.Label>
                                    <Form.Control type="text" name="carrier" placeholder="Shipping carrier" />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold small">Notes</Form.Label>
                                    <Form.Control as="textarea" rows={2} name="notes" placeholder="Additional notes..." />
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button variant="light" onClick={handleClose} className="px-4">Close</Button>
                            <Button variant="primary" type="submit" className="px-4" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Return'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default PurchaseReturns;
