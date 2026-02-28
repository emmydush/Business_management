import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Button, 
  Badge, 
  Collapse,
  InputGroup
} from 'react-bootstrap';
import { 
  FiFilter, 
  FiX, 
  FiChevronDown, 
  FiChevronUp, 
  FiCalendar, 
  FiCheckSquare,
  FiSearch,
  FiRefreshCw,
  FiList,
  FiAlertCircle
} from 'react-icons/fi';
import { useFilter } from '../context/FilterContext';
import DateRangeSelector from './DateRangeSelector';
import { DATE_RANGES } from '../utils/dateRanges';

// Filter section component
const FilterSection = ({ title, icon, children, defaultOpen = false, badge }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="filter-section mb-3">
      <div 
        className="d-flex align-items-center justify-content-between p-2 bg-light rounded cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer' }}
      >
        <div className="d-flex align-items-center gap-2">
          {icon}
          <span className="fw-semibold">{title}</span>
          {badge && badge > 0 && (
            <Badge bg="primary" pill>{badge}</Badge>
          )}
        </div>
        {isOpen ? <FiChevronUp /> : <FiChevronDown />}
      </div>
      <Collapse in={isOpen}>
        <div className="mt-2 ps-2">
          {children}
        </div>
      </Collapse>
    </div>
  );
};

// Checkbox list component
const CheckboxList = ({ options, selected, onChange, labelKey = 'label', valueKey = 'value' }) => {
  if (!options || options.length === 0) {
    return <span className="text-muted small">No options available</span>;
  }
  
  return (
    <div className="checkbox-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
      {options.map((option) => (
        <Form.Check
          key={option[valueKey]}
          type="checkbox"
          id={`checkbox-${option[valueKey]}`}
          label={option[labelKey]}
          checked={selected.includes(option[valueKey])}
          onChange={() => onChange(option[valueKey])}
          className="mb-1"
        />
      ))}
    </div>
  );
};

// Main FilterPanel component
const FilterPanel = ({ 
  showDateFilter = true,
  showCategoryFilter = true,
  showStatusFilter = true,
  showBranchFilter = true,
  showSearchFilter = true,
  showAdvancedFilters = false,
  onApplyFilters,
  onClose,
  className = ''
}) => {
  const {
    // State
    dateRange,
    categories,
    orderStatuses,
    expenseStatuses,
    invoiceStatuses,
    taskStatuses,
    branches,
    paymentMethods,
    leadSources,
    taskPriorities,
    search,
    filterOptions,
    optionsLoading,
    activeFiltersCount,
    
    // Actions
    setDateRange,
    setCustomDateRange,
    toggleCategory,
    toggleStatus,
    toggleBranch,
    setSearch,
    resetFilters
  } = useFilter();
  
  const [localSearch, setLocalSearch] = useState(search);
  const [isApplying, setIsApplying] = useState(false);
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        setSearch(localSearch);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [localSearch]);
  
  // Handle apply filters
  const handleApply = async () => {
    setIsApplying(true);
    try {
      if (onApplyFilters) {
        await onApplyFilters();
      }
    } finally {
      setIsApplying(false);
    }
  };
  
  // Handle reset
  const handleReset = () => {
    resetFilters();
    setLocalSearch('');
    if (onApplyFilters) {
      onApplyFilters();
    }
  };
  
  if (optionsLoading) {
    return (
      <Card className={`filter-panel ${className}`}>
        <Card.Body className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading filter options...</p>
        </Card.Body>
      </Card>
    );
  }
  
  return (
    <Card className={`filter-panel shadow-sm ${className}`}>
      <Card.Header className="bg-white d-flex justify-content-between align-items-center py-3">
        <div className="d-flex align-items-center gap-2">
          <FiFilter size={20} />
          <span className="fw-bold">Filters</span>
          {activeFiltersCount > 0 && (
            <Badge bg="primary" pill>{activeFiltersCount}</Badge>
          )}
        </div>
        <div className="d-flex gap-2">
          {activeFiltersCount > 0 && (
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={handleReset}
            >
              <FiRefreshCw size={14} className="me-1" />
              Reset
            </Button>
          )}
          {onClose && (
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={onClose}
            >
              <FiX size={14} />
            </Button>
          )}
        </div>
      </Card.Header>
      
      <Card.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Search Filter */}
        {showSearchFilter && (
          <div className="mb-3">
            <Form.Group>
              <Form.Label className="small text-muted mb-1">
                <FiSearch className="me-1" />
                Search
              </Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Search orders, invoices, tasks..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  size="sm"
                />
                {localSearch && (
                  <Button 
                    variant="outline-secondary"
                    onClick={() => setLocalSearch('')}
                  >
                    <FiX size={14} />
                  </Button>
                )}
              </InputGroup>
            </Form.Group>
          </div>
        )}
        
        {/* Date Range Filter */}
        {showDateFilter && (
          <FilterSection 
            title="Date Range" 
            icon={<FiCalendar size={16} />}
            defaultOpen={true}
          >
            <DateRangeSelector
              value={dateRange}
              onChange={(range, start, end) => {
                if (range === DATE_RANGES.CUSTOM_RANGE && start && end) {
                  setCustomDateRange(start, end);
                } else {
                  setDateRange(range);
                }
              }}
              showCustomRange={true}
              size="sm"
            />
          </FilterSection>
        )}
        
        {/* Category Filter */}
        {showCategoryFilter && filterOptions?.categories && filterOptions.categories.length > 0 && (
          <FilterSection 
            title="Categories" 
            icon={<FiList size={16} />}
            badge={categories.length}
          >
            <CheckboxList
              options={filterOptions.categories}
              selected={categories}
              onChange={toggleCategory}
              labelKey="name"
              valueKey="id"
            />
          </FilterSection>
        )}
        
        {/* Branch Filter */}
        {showBranchFilter && filterOptions?.branches && filterOptions.branches.length > 0 && (
          <FilterSection 
            title="Branches" 
            icon={<FiList size={16} />}
            badge={branches.length}
          >
            <CheckboxList
              options={filterOptions.branches}
              selected={branches}
              onChange={toggleBranch}
              labelKey="name"
              valueKey="id"
            />
          </FilterSection>
        )}
        
        {/* Status Filters */}
        {showStatusFilter && (
          <>
            {filterOptions?.order_statuses && filterOptions.order_statuses.length > 0 && (
              <FilterSection 
                title="Order Status" 
                icon={<FiCheckSquare size={16} />}
                badge={orderStatuses.length}
              >
                <CheckboxList
                  options={filterOptions.order_statuses}
                  selected={orderStatuses}
                  onChange={(value) => toggleStatus('orderStatuses', value)}
                />
              </FilterSection>
            )}
            
            {filterOptions?.expense_statuses && filterOptions.expense_statuses.length > 0 && (
              <FilterSection 
                title="Expense Status" 
                icon={<FiCheckSquare size={16} />}
                badge={expenseStatuses.length}
              >
                <CheckboxList
                  options={filterOptions.expense_statuses}
                  selected={expenseStatuses}
                  onChange={(value) => toggleStatus('expenseStatuses', value)}
                />
              </FilterSection>
            )}
            
            {filterOptions?.invoice_statuses && filterOptions.invoice_statuses.length > 0 && (
              <FilterSection 
                title="Invoice Status" 
                icon={<FiCheckSquare size={16} />}
                badge={invoiceStatuses.length}
              >
                <CheckboxList
                  options={filterOptions.invoice_statuses}
                  selected={invoiceStatuses}
                  onChange={(value) => toggleStatus('invoiceStatuses', value)}
                />
              </FilterSection>
            )}
            
            {filterOptions?.task_statuses && filterOptions.task_statuses.length > 0 && (
              <FilterSection 
                title="Task Status" 
                icon={<FiCheckSquare size={16} />}
                badge={taskStatuses.length}
              >
                <CheckboxList
                  options={filterOptions.task_statuses}
                  selected={taskStatuses}
                  onChange={(value) => toggleStatus('taskStatuses', value)}
                />
              </FilterSection>
            )}
          </>
        )}
        
        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <>
            {filterOptions?.task_priorities && filterOptions.task_priorities.length > 0 && (
              <FilterSection 
                title="Task Priority" 
                icon={<FiAlertCircle size={16} />}
                badge={taskPriorities.length}
              >
                <CheckboxList
                  options={filterOptions.task_priorities}
                  selected={taskPriorities}
                  onChange={(value) => toggleStatus('taskPriorities', value)}
                />
              </FilterSection>
            )}
            
            {filterOptions?.payment_methods && filterOptions.payment_methods.length > 0 && (
              <FilterSection 
                title="Payment Methods" 
                icon={<FiList size={16} />}
                badge={paymentMethods.length}
              >
                <CheckboxList
                  options={filterOptions.payment_methods}
                  selected={paymentMethods}
                  onChange={(value) => toggleStatus('paymentMethods', value)}
                />
              </FilterSection>
            )}
            
            {filterOptions?.lead_sources && filterOptions.lead_sources.length > 0 && (
              <FilterSection 
                title="Lead Sources" 
                icon={<FiList size={16} />}
                badge={leadSources.length}
              >
                <CheckboxList
                  options={filterOptions.lead_sources}
                  selected={leadSources}
                  onChange={(value) => toggleStatus('leadSources', value)}
                />
              </FilterSection>
            )}
          </>
        )}
      </Card.Body>
      
      <Card.Footer className="bg-white py-3">
        <div className="d-flex gap-2">
          <Button 
            variant="primary" 
            className="flex-grow-1"
            onClick={handleApply}
            disabled={isApplying}
          >
            {isApplying ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Applying...
              </>
            ) : (
              'Apply Filters'
            )}
          </Button>
          {activeFiltersCount > 0 && (
            <Button 
              variant="outline-secondary"
              onClick={handleReset}
            >
              Reset
            </Button>
          )}
        </div>
        
        {/* Summary of applied filters */}
        {activeFiltersCount > 0 && (
          <div className="mt-2 text-center">
            <span className="text-muted small">
              {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
            </span>
          </div>
        )}
      </Card.Footer>
    </Card>
  );
};

export default FilterPanel;
