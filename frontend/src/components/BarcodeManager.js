import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Modal, 
  Form, 
  Table, 
  Badge, 
  Alert, 
  Spinner,
  InputGroup,
  Pagination
} from 'react-bootstrap';
import { 
  FiPrinter, 
  FiDownload, 
  FiRefreshCw, 
  FiPlus,
  FiCheck,
  FiEye,
  FiGrid,
  FiList,
  FiPackage,
  FiSearch,
  FiTag
} from 'react-icons/fi';
import { barcodeAPI, inventoryAPI, getImageUrl } from '../services/api';
import toast from 'react-hot-toast';
import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';

const BarcodeManager = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [barcodeLabels, setBarcodeLabels] = useState([]);
  const [printFormat, setPrintFormat] = useState('standard');
  const [printQuantity, setPrintQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'with', 'without'

  const itemsPerPage = 12;

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, filterStatus]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: itemsPerPage,
        search: searchTerm
      };
      
      const response = await inventoryAPI.getProducts(params);
      let products = response.data.products || [];
      
      // Filter by barcode status
      if (filterStatus === 'with') {
        products = products.filter(p => p.barcode && p.barcode !== '');
      } else if (filterStatus === 'without') {
        products = products.filter(p => !p.barcode || p.barcode === '');
      }
      
      setProducts(products);
      setTotalPages(Math.ceil(response.data.total / itemsPerPage));
    } catch (error) {
      toast.error('Failed to fetch products');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSingleBarcode = async (product) => {
    try {
      setGenerating(true);
      const response = await barcodeAPI.generateBarcode();
      const barcode = response.data.barcode;
      
      // Update product with new barcode
      await inventoryAPI.updateProduct(product.id, { barcode });
      
      toast.success(`Barcode generated for ${product.name}`);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to generate barcode');
      console.error('Error generating barcode:', error);
    } finally {
      setGenerating(false);
    }
  };

  const bulkGenerateBarcodes = async () => {
    try {
      setGenerating(true);
      const productIds = products
        .filter(p => !p.barcode || p.barcode === '')
        .map(p => p.id);
      
      if (productIds.length === 0) {
        toast.info('All products already have barcodes');
        return;
      }
      
      const response = await barcodeAPI.bulkGenerateBarcodes(productIds);
      toast.success(response.data.message);
      fetchProducts();
      setShowGenerateModal(false);
    } catch (error) {
      toast.error('Failed to generate barcodes');
      console.error('Error bulk generating barcodes:', error);
    } finally {
      setGenerating(false);
    }
  };

  const generatePrintLabels = async () => {
    try {
      setPrinting(true);
      const productIds = selectedProducts.map(p => p.id);
      
      if (productIds.length === 0) {
        toast.error('Please select products to print labels for');
        return;
      }
      
      const data = {
        product_ids: productIds,
        format: printFormat,
        quantity: printQuantity
      };
      
      const response = await barcodeAPI.printLabels(data);
      setBarcodeLabels(response.data.labels);
      setShowPrintModal(false);
      setShowPreviewModal(true);
      
      toast.success(`Generated ${response.data.total} labels`);
    } catch (error) {
      toast.error('Failed to generate print labels');
      console.error('Error generating labels:', error);
    } finally {
      setPrinting(false);
    }
  };

  const printLabels = () => {
    const printWindow = window.open('', '_blank');
    const printContent = document.getElementById('barcode-labels-container');
    
    if (printWindow && printContent) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Barcode Labels</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: Arial, sans-serif; 
                background: white;
              }
              .label-page { 
                display: flex; 
                flex-wrap: wrap; 
                gap: 15px; 
                justify-content: flex-start;
              }
              .label-item { 
                border: 1px solid #eee; 
                padding: 10px;
                background: white;
                page-break-inside: avoid;
                width: fit-content;
                height: fit-content;
              }
              .label-item img {
                display: block;
                max-width: 100%;
              }
              @media print {
                .no-print { display: none; }
                body { padding: 0; }
                .label-item { border: none; }
              }
            </style>
          </head>
          <body>
            <div id="print-container">
              ${printContent.innerHTML}
            </div>
          </body>
        </html>
      `);
      
      // Give images a bit more time to settle
      printWindow.onload = () => {
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          // Keep it open for a moment so print dialog can finish
          setTimeout(() => {
             // Some browsers close the window before printing starts if we close here
             // printWindow.close(); 
          }, 1000);
        }, 500);
      };

      // Fallback if onload doesn't trigger (e.g. cached)
      setTimeout(() => {
        if (printWindow.document.readyState === 'complete') {
          printWindow.print();
        }
      }, 2000);
    } else {
      toast.error("Failed to prepare label printer. Please check popup blockers.");
    }
  };

  const downloadLabels = async () => {
    try {
      const container = document.getElementById('barcode-labels-container');
      if (container) {
        const canvas = await html2canvas(container);
        const link = document.createElement('a');
        link.download = `barcode-labels-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    } catch (error) {
      toast.error('Failed to download labels');
      console.error('Error downloading labels:', error);
    }
  };

  const toggleProductSelection = (product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p.id === product.id);
      if (isSelected) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products);
    }
  };

  const previewBarcode = (product) => {
    setPreviewProduct(product);
    setShowPreviewModal(true);
  };

  const renderBarcode = (barcode, options = {}) => {
    const defaultOptions = {
      width: 2,
      height: 80,
      displayValue: true,
      fontSize: 12,
      margin: 10
    };
    
    return (
      <div className="barcode-container" style={{ display: 'flex', justifyContent: 'center' }}>
        <svg ref={(el) => {
          if (el && barcode) {
            try {
              JsBarcode(el, barcode, { ...defaultOptions, ...options });
            } catch (err) {
              console.error('JsBarcode error:', err);
              // Fallback if barcode format is invalid
              if (el.parentNode) {
                const errorText = document.createElement('div');
                errorText.style.color = 'red';
                errorText.style.fontSize = '10px';
                errorText.innerText = 'Format error';
                el.style.display = 'none';
                el.parentNode.appendChild(errorText);
              }
            }
          }
        }} />
      </div>
    );
  };

  const renderProductTable = () => (
    <Table hover responsive>
      <thead>
        <tr>
          <th>
            <Form.Check 
              checked={selectedProducts.length === products.length && products.length > 0}
              onChange={selectAllProducts}
            />
          </th>
          <th>Product</th>
          <th>SKU</th>
          <th>Barcode</th>
          <th>Price</th>
          <th>Stock</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {products.map(product => (
          <tr key={product.id}>
            <td>
              <Form.Check 
                checked={selectedProducts.some(p => p.id === product.id)}
                onChange={() => toggleProductSelection(product)}
              />
            </td>
            <td>
              <div className="d-flex align-items-center">
                {product.image && (
                  <img 
                    src={getImageUrl(product.image)} 
                    alt={product.name}
                    style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '4px', marginRight: 10 }}
                  />
                )}
                <div>
                  <div className="fw-bold">{product.name}</div>
                  <small className="text-muted">{product.category?.name}</small>
                </div>
              </div>
            </td>
            <td>{product.sku || product.product_id}</td>
            <td>
              {product.barcode ? (
                <Badge bg="success">{product.barcode}</Badge>
              ) : (
                <Badge bg="secondary">No barcode</Badge>
              )}
            </td>
            <td>${parseFloat(product.unit_price).toFixed(2)}</td>
            <td>{product.stock_quantity}</td>
            <td>
              <div className="btn-group" role="group">
                {product.barcode ? (
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => previewBarcode(product)}
                  >
                    <FiEye size={14} />
                  </Button>
                ) : (
                  <Button 
                    variant="outline-success" 
                    size="sm"
                    onClick={() => generateSingleBarcode(product)}
                    disabled={generating}
                  >
                    <FiPlus size={14} />
                  </Button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  const renderProductGrid = () => (
    <Row xs={1} md={2} lg={3} xl={4} className="g-3">
      {products.map(product => (
        <Col key={product.id}>
          <Card className={`h-100 ${selectedProducts.some(p => p.id === product.id) ? 'border-primary' : ''}`}>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <Form.Check 
                checked={selectedProducts.some(p => p.id === product.id)}
                onChange={() => toggleProductSelection(product)}
              />
              <div>
                {product.barcode ? (
                  <Badge bg="success">Has Barcode</Badge>
                ) : (
                  <Badge bg="secondary">No Barcode</Badge>
                )}
              </div>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-3">
                {product.image ? (
                  <img 
                    src={getImageUrl(product.image)} 
                    alt={product.name}
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '8px' }}
                  />
                ) : (
                  <FiPackage size={80} className="text-muted" />
                )}
              </div>
              <h6 className="text-truncate">{product.name}</h6>
              <p className="text-muted small mb-2">SKU: {product.sku || product.product_id}</p>
              <p className="mb-1">Price: ${parseFloat(product.unit_price).toFixed(2)}</p>
              <p className="mb-3">Stock: {product.stock_quantity}</p>
              {product.barcode && (
                <div className="text-center">
                  {renderBarcode(product.barcode, { width: 1, height: 40, fontSize: 10 })}
                </div>
              )}
            </Card.Body>
            <Card.Footer>
              <div className="d-grid gap-2">
                {product.barcode ? (
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => previewBarcode(product)}
                  >
                    <FiEye className="me-1" /> Preview
                  </Button>
                ) : (
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={() => generateSingleBarcode(product)}
                    disabled={generating}
                  >
                    <FiPlus className="me-1" /> Generate
                  </Button>
                )}
              </div>
            </Card.Footer>
          </Card>
        </Col>
      ))}
    </Row>
  );

  return (
    <div className="barcode-manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Barcode Management</h2>
          <p className="text-muted">Generate and manage product barcodes</p>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="success" 
            onClick={() => setShowGenerateModal(true)}
            disabled={generating}
          >
            <FiPlus className="me-2" />
            Generate Barcodes
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setShowPrintModal(true)}
            disabled={selectedProducts.length === 0}
          >
            <FiPrinter className="me-2" />
            Print Labels ({selectedProducts.length})
          </Button>
          <Button 
            variant="outline-secondary" 
            onClick={fetchProducts}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'spinning' : ''} />
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <FiSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Products</option>
                <option value="with">With Barcodes</option>
                <option value="without">Without Barcodes</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <div className="btn-group" role="group">
                <Button
                  variant={viewMode === 'table' ? 'primary' : 'outline-primary'}
                  onClick={() => setViewMode('table')}
                >
                  <FiList />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'outline-primary'}
                  onClick={() => setViewMode('grid')}
                >
                  <FiGrid />
                </Button>
              </div>
            </Col>
            <Col md={2} className="text-end">
              <Badge bg="info">
                {selectedProducts.length} selected
              </Badge>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Products Display */}
      <Card>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <Alert variant="info">
              No products found. {searchTerm && 'Try adjusting your search or filters.'}
            </Alert>
          ) : (
            <>
              {viewMode === 'table' ? renderProductTable() : renderProductGrid()}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination>
                    <Pagination.Prev 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    />
                    {[...Array(totalPages)].map((_, i) => (
                      <Pagination.Item
                        key={i + 1}
                        active={i + 1 === currentPage}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Generate Barcode Modal */}
      <Modal show={showGenerateModal} onHide={() => setShowGenerateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Generate Barcodes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>This will generate barcodes for all products that don&apos;t have them.</p>
          <Alert variant="info">
            <FiTag className="me-2" />
            {products.filter(p => !p.barcode || p.barcode === '').length} products need barcodes
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowGenerateModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={bulkGenerateBarcodes}
            disabled={generating}
          >
            {generating ? <Spinner animation="border" size="sm" /> : <FiCheck className="me-2" />}
            Generate All Barcodes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Print Labels Modal */}
      <Modal show={showPrintModal} onHide={() => setShowPrintModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Print Barcode Labels</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Label Format</Form.Label>
              <Form.Select
                value={printFormat}
                onChange={(e) => setPrintFormat(e.target.value)}
              >
                <option value="small">Small (200x100px)</option>
                <option value="standard">Standard (300x150px)</option>
                <option value="large">Large (400x200px)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Quantity per Product</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="10"
                value={printQuantity}
                onChange={(e) => setPrintQuantity(parseInt(e.target.value) || 1)}
              />
            </Form.Group>
            <Alert variant="info">
              <FiPrinter className="me-2" />
              Will generate {selectedProducts.length * printQuantity} labels
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPrintModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={generatePrintLabels}
            disabled={printing}
          >
            {printing ? <Spinner animation="border" size="sm" /> : <FiPrinter className="me-2" />}
            Generate Labels
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Barcode Preview Modal */}
      <Modal 
        show={showPreviewModal} 
        onHide={() => setShowPreviewModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {previewProduct ? 'Barcode Preview' : 'Print Labels Preview'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div id="barcode-labels-container">
            {previewProduct ? (
              // Single product preview
              <div className="text-center p-4">
                <h5>{previewProduct.name}</h5>
                <p>SKU: {previewProduct.sku || previewProduct.product_id}</p>
                <p>Price: ${parseFloat(previewProduct.unit_price).toFixed(2)}</p>
                {previewProduct.barcode && (
                  <div className="my-3">
                    {renderBarcode(previewProduct.barcode, { width: 3, height: 100, fontSize: 16 })}
                  </div>
                )}
                <p className="text-muted">{previewProduct.barcode}</p>
              </div>
            ) : (
              // Multiple labels preview
              <div className="label-page">
                {barcodeLabels.map((label, index) => (
                  <div key={index} className="label-item p-2 mb-2">
                    <img src={label.image} alt={`Label ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="no-print">
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            Close
          </Button>
          {!previewProduct && (
            <>
              <Button variant="primary" onClick={downloadLabels}>
                <FiDownload className="me-2" />
                Download
              </Button>
              <Button variant="success" onClick={printLabels}>
                <FiPrinter className="me-2" />
                Print
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BarcodeManager;
