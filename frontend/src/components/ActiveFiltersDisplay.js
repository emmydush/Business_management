import React from 'react';
import { Badge, Button, Card, Row, Col } from 'react-bootstrap';
import { 
  FiX, 
  FiFilter, 
  FiCalendar, 
  FiCheckSquare, 
  FiList,
  FiSearch,
  FiRefreshCw
} from 'react-icons/fi';
import { useFilter } from '../context/FilterContext';

// Individual filter tag component
const FilterTag = ({ type, label, onRemove }) => {
  const getIcon = () => {
    switch (type) {
      case 'date':
      case 'customDate':
        return <FiCalendar size={12} />;
      case 'categories':
      case 'branches':
        return <FiList size={12} />;
      case 'orderStatuses':
      case 'expenseStatuses':
      case 'invoiceStatuses':
      case 'taskStatuses':
        return <FiCheckSquare size={12} />;
      case 'search':
        return <FiSearch size={12} />;
      default:
        return <FiFilter size={12} />;
    }
  };
  
  return (
    <Badge 
      bg="light" 
      text="dark" 
      className="d-inline-flex align-items-center gap-1 px-2 py-1 me-1 mb-1"
      style={{ fontSize: '0.75rem', fontWeight: '500' }}
    >
      {getIcon()}
      <span>{label}</span>
      <Button
        variant="link"
        size="sm"
        className="p-0 ms-1 d-flex align-items-center"
        onClick={onRemove}
        style={{ lineHeight: 1, textDecoration: 'none' }}
      >
        <FiX size={12} />
      </Button>
    </Badge>
  );
};

// Main ActiveFiltersDisplay component
const ActiveFiltersDisplay = ({ 
  showClearAll = true,
  className = ''
}) => {
  const {
    activeFiltersCount,
    resetFilters,
    applyCurrentFilters,
    dateRange,
    startDate,
    endDate,
    categories,
    orderStatuses,
    expenseStatuses,
    invoiceStatuses,
    taskStatuses,
    branches,
    search
  } = useFilter();
  
  // If no filters active, return null
  if (activeFiltersCount === 0) {
    return null;
  }
  
  return (
    <Card className={`active-filters-display bg-light border-0 ${className}`}>
      <Card.Body className="py-2 px-3">
        <Row className="align-items-center">
          <Col md={showClearAll ? 8 : 12}>
            <div className="d-flex align-items-center flex-wrap">
              <FiFilter className="me-2 text-muted" size={14} />
              <span className="text-muted me-2 small">Active Filters:</span>
              
              {/* Date Range */}
              {dateRange && dateRange !== 'last_30_days' && (
                <FilterTag 
                  type="date"
                  label={dateRange.replace(/_/g, ' ')}
                  onRemove={() => {
                    useFilter.getState?.()?.setDateRange?.('last_30_days');
                    if (applyCurrentFilters) applyCurrentFilters();
                  }}
                />
              )}
              
              {startDate && endDate && (
                <FilterTag 
                  type="customDate"
                  label={`${startDate} to ${endDate}`}
                  onRemove={() => {
                    useFilter.getState?.()?.setDateRange?.('last_30_days');
                    if (applyCurrentFilters) applyCurrentFilters();
                  }}
                />
              )}
              
              {/* Categories */}
              {categories && categories.length > 0 && (
                <FilterTag 
                  type="categories"
                  label={`${categories.length} categories`}
                  onRemove={() => {
                    useFilter.getState?.()?.setCategories?.([]);
                    if (applyCurrentFilters) applyCurrentFilters();
                  }}
                />
              )}
              
              {/* Order Statuses */}
              {orderStatuses && orderStatuses.length > 0 && (
                <FilterTag 
                  type="orderStatuses"
                  label={`${orderStatuses.length} order status${orderStatuses.length > 1 ? 'es' : ''}`}
                  onRemove={() => {
                    useFilter.getState?.()?.setOrderStatuses?.([]);
                    if (applyCurrentFilters) applyCurrentFilters();
                  }}
                />
              )}
              
              {/* Expense Statuses */}
              {expenseStatuses && expenseStatuses.length > 0 && (
                <FilterTag 
                  type="expenseStatuses"
                  label={`${expenseStatuses.length} expense status${expenseStatuses.length > 1 ? 'es' : ''}`}
                  onRemove={() => {
                    useFilter.getState?.()?.setExpenseStatuses?.([]);
                    if (applyCurrentFilters) applyCurrentFilters();
                  }}
                />
              )}
              
              {/* Invoice Statuses */}
              {invoiceStatuses && invoiceStatuses.length > 0 && (
                <FilterTag 
                  type="invoiceStatuses"
                  label={`${invoiceStatuses.length} invoice status${invoiceStatuses.length > 1 ? 'es' : ''}`}
                  onRemove={() => {
                    useFilter.getState?.()?.setInvoiceStatuses?.([]);
                    if (applyCurrentFilters) applyCurrentFilters();
                  }}
                />
              )}
              
              {/* Task Statuses */}
              {taskStatuses && taskStatuses.length > 0 && (
                <FilterTag 
                  type="taskStatuses"
                  label={`${taskStatuses.length} task status${taskStatuses.length > 1 ? 'es' : ''}`}
                  onRemove={() => {
                    useFilter.getState?.()?.setTaskStatuses?.([]);
                    if (applyCurrentFilters) applyCurrentFilters();
                  }}
                />
              )}
              
              {/* Branches */}
              {branches && branches.length > 0 && (
                <FilterTag 
                  type="branches"
                  label={`${branches.length} branch${branches.length > 1 ? 'es' : ''}`}
                  onRemove={() => {
                    useFilter.getState?.()?.setBranches?.([]);
                    if (applyCurrentFilters) applyCurrentFilters();
                  }}
                />
              )}
              
              {/* Search */}
              {search && search.trim() !== '' && (
                <FilterTag 
                  type="search"
                  label={`"${search}"`}
                  onRemove={() => {
                    useFilter.getState?.()?.setSearch?.('');
                    if (applyCurrentFilters) applyCurrentFilters();
                  }}
                />
              )}
            </div>
          </Col>
          
          {showClearAll && (
            <Col md={4} className="text-end">
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => {
                  resetFilters();
                  if (applyCurrentFilters) applyCurrentFilters();
                }}
              >
                <FiRefreshCw size={12} className="me-1" />
                Clear All
              </Button>
            </Col>
          )}
        </Row>
      </Card.Body>
    </Card>
  );
};

// Compact version for inline display
export const CompactActiveFilters = ({ onClear }) => {
  const { activeFiltersCount, resetFilters } = useFilter();
  
  if (activeFiltersCount === 0) {
    return null;
  }
  
  return (
    <Button
      variant="outline-primary"
      size="sm"
      className="d-inline-flex align-items-center gap-1"
      onClick={() => {
        resetFilters();
        if (onClear) onClear();
      }}
    >
      <FiX size={12} />
      Clear {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''}
    </Button>
  );
};

export default ActiveFiltersDisplay;
