import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Modal } from 'react-bootstrap';
import { FiFilter, FiX, FiLayout } from 'react-icons/fi';
import FilterPanel from './FilterPanel';
import ActiveFiltersDisplay from './ActiveFiltersDisplay';
import { FilterToggleButton, FilterDropdownButton, LiveFilterToggle } from './FilterToggleButton';
import { useFilter } from '../context/FilterContext';

// Modal version for mobile/small screens
const FilterModal = ({ 
  show, 
  onHide,
  showDateFilter = true,
  showCategoryFilter = true,
  showStatusFilter = true,
  showBranchFilter = true,
  showSearchFilter = true,
  showAdvancedFilters = false,
  onApplyFilters
}) => {
  const { applyCurrentFilters } = useFilter();
  
  const handleApply = async () => {
    if (onApplyFilters) {
      await onApplyFilters();
    } else {
      await applyCurrentFilters();
    }
    onHide();
  };
  
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>
          <FiFilter className="me-2" />
          Filter Data
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <FilterPanel
          showDateFilter={showDateFilter}
          showCategoryFilter={showCategoryFilter}
          showStatusFilter={showStatusFilter}
          showBranchFilter={showBranchFilter}
          showSearchFilter={showSearchFilter}
          showAdvancedFilters={showAdvancedFilters}
          onApplyFilters={handleApply}
        />
      </Modal.Body>
    </Modal>
  );
};

// Sidebar version for large screens
const FilterSidebar = ({ 
  show,
  onClose,
  showDateFilter = true,
  showCategoryFilter = true,
  showStatusFilter = true,
  showBranchFilter = true,
  showSearchFilter = true,
  showAdvancedFilters = false,
  onApplyFilters,
  width = '350px'
}) => {
  if (!show) return null;
  
  return (
    <div 
      className="filter-sidebar position-fixed"
      style={{
        top: 0,
        right: 0,
        height: '100vh',
        width: width,
        zIndex: 1050,
        backgroundColor: 'white',
        boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
        overflowY: 'auto'
      }}
    >
      <FilterPanel
        showDateFilter={showDateFilter}
        showCategoryFilter={showCategoryFilter}
        showStatusFilter={showStatusFilter}
        showBranchFilter={showBranchFilter}
        showSearchFilter={showSearchFilter}
        showAdvancedFilters={showAdvancedFilters}
        onApplyFilters={onApplyFilters}
        onClose={onClose}
        className="border-0"
      />
    </div>
  );
};

// Main DashboardFilters component with responsive behavior
const DashboardFilters = ({
  // Display options
  layout = 'modal', // 'modal', 'sidebar', 'inline'
  showDateFilter = true,
  showCategoryFilter = true,
  showStatusFilter = true,
  showBranchFilter = true,
  showSearchFilter = true,
  showAdvancedFilters = false,
  showActiveFilters = true,
  
  // Callbacks
  onApplyFilters,
  className = ''
}) => {
  const { 
    isFilterPanelOpen, 
    setFilterPanelOpen, 
    activeFiltersCount,
    applyCurrentFilters,
    filteredData,
    dataLoading
  } = useFilter();
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Auto-apply filters when data changes (real-time)
  const handleApplyFilters = async () => {
    if (onApplyFilters) {
      await onApplyFilters();
    } else {
      await applyCurrentFilters();
    }
  };
  
  // Render toggle button based on layout
  const renderToggleButton = () => {
    switch (layout) {
      case 'sidebar':
        return (
          <LiveFilterToggle
            showActiveCount={true}
          />
        );
      case 'inline':
        return (
          <FilterToggleButton />
        );
      case 'modal':
      default:
        return (
          <FilterToggleButton />
        );
    }
  };
  
  // Render filter panel based on layout
  const renderFilterPanel = () => {
    if (layout === 'sidebar') {
      return (
        <>
          {/* Backdrop */}
          {isFilterPanelOpen && (
            <div 
              className="position-fixed w-100 h-100"
              style={{ zIndex: 1040, backgroundColor: 'rgba(0,0,0,0.3)' }}
              onClick={() => setFilterPanelOpen(false)}
            />
          )}
          <FilterSidebar
            show={isFilterPanelOpen}
            onClose={() => setFilterPanelOpen(false)}
            showDateFilter={showDateFilter}
            showCategoryFilter={showCategoryFilter}
            showStatusFilter={showStatusFilter}
            showBranchFilter={showBranchFilter}
            showSearchFilter={showSearchFilter}
            showAdvancedFilters={showAdvancedFilters}
            onApplyFilters={handleApplyFilters}
          />
        </>
      );
    }
    
    if (layout === 'modal' || isMobile) {
      return (
        <FilterModal
          show={isFilterPanelOpen}
          onHide={() => setFilterPanelOpen(false)}
          showDateFilter={showDateFilter}
          showCategoryFilter={showCategoryFilter}
          showStatusFilter={showStatusFilter}
          showBranchFilter={showBranchFilter}
          showSearchFilter={showSearchFilter}
          showAdvancedFilters={showAdvancedFilters}
          onApplyFilters={handleApplyFilters}
        />
      );
    }
    
    // Inline layout
    return isFilterPanelOpen ? (
      <FilterPanel
        showDateFilter={showDateFilter}
        showCategoryFilter={showCategoryFilter}
        showStatusFilter={showStatusFilter}
        showBranchFilter={showBranchFilter}
        showSearchFilter={showSearchFilter}
        showAdvancedFilters={showAdvancedFilters}
        onApplyFilters={handleApplyFilters}
        className="mb-3"
      />
    ) : null;
  };
  
  return (
    <div className={`dashboard-filters ${className}`}>
      {/* Toggle Button */}
      <div className="filter-toggle mb-3">
        {renderToggleButton()}
      </div>
      
      {/* Filter Panel */}
      {renderFilterPanel()}
      
      {/* Active Filters Display */}
      {showActiveFilters && (
        <ActiveFiltersDisplay 
          showClearAll={true}
          className="mb-3"
        />
      )}
    </div>
  );
};

// Simple wrapper for pages that just need the filter context
export const DashboardFiltersWrapper = ({ 
  children,
  branchId = null,
  onFiltersChange = null
}) => {
  const { FilterProvider } = require('../context/FilterContext');
  
  return (
    <FilterProvider branchId={branchId} onFiltersChange={onFiltersChange}>
      {children}
    </FilterProvider>
  );
};

export default DashboardFilters;
