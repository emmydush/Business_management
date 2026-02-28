import React from 'react';
import { Button, Badge, Dropdown } from 'react-bootstrap';
import { FiFilter, FiChevronDown, FiX } from 'react-icons/fi';
import { useFilter } from '../context/FilterContext';

// Toggle button to open filter panel
const FilterToggleButton = ({ 
  variant = 'outline-primary', 
  size = 'md',
  showBadge = true,
  className = ''
}) => {
  const { activeFiltersCount, toggleFilterPanel } = useFilter();
  
  return (
    <Button 
      variant={variant}
      size={size}
      onClick={toggleFilterPanel}
      className={`d-flex align-items-center gap-2 ${className}`}
    >
      <FiFilter size={16} />
      <span>Filters</span>
      {showBadge && activeFiltersCount > 0 && (
        <Badge 
          bg={variant === 'outline-primary' ? 'primary' : 'light'} 
          text={variant === 'outline-primary' ? 'white' : 'dark'}
          pill
        >
          {activeFiltersCount}
        </Badge>
      )}
      <FiChevronDown size={14} />
    </Button>
  );
};

// Dropdown version of filter toggle
const FilterDropdownButton = ({ 
  variant = 'outline-primary', 
  size = 'md',
  className = ''
}) => {
  const { activeFiltersCount, setFilterPanelOpen } = useFilter();
  
  return (
    <Dropdown>
      <Dropdown.Toggle 
        variant={variant}
        size={size}
        className={`d-flex align-items-center gap-2 ${className}`}
      >
        <FiFilter size={16} />
        <span>Filters</span>
        {activeFiltersCount > 0 && (
          <Badge 
            bg={variant === 'outline-primary' ? 'primary' : 'light'} 
            text={variant === 'outline-primary' ? 'white' : 'dark'}
            pill
          >
            {activeFiltersCount}
          </Badge>
        )}
      </Dropdown.Toggle>
      
      <Dropdown.Menu>
        <Dropdown.Item onClick={() => setFilterPanelOpen(true)}>
          Open Filter Panel
        </Dropdown.Item>
        {activeFiltersCount > 0 && (
          <>
            <Dropdown.Divider />
            <Dropdown.Item disabled className="text-muted">
              {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
            </Dropdown.Item>
          </>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

// Real-time filter update button (applies filters immediately)
const LiveFilterToggle = ({ 
  variant = 'outline-primary', 
  size = 'md',
  showActiveCount = true,
  className = ''
}) => {
  const { 
    activeFiltersCount, 
    setFilterPanelOpen, 
    isFilterPanelOpen,
    dataLoading
  } = useFilter();
  
  return (
    <div className={`d-flex align-items-center gap-2 ${className}`}>
      <Button 
        variant={variant}
        size={size}
        onClick={() => setFilterPanelOpen(!isFilterPanelOpen)}
        className="d-flex align-items-center gap-2"
      >
        <FiFilter size={16} />
        <span>Filters</span>
        {showActiveCount && activeFiltersCount > 0 && (
          <Badge 
            bg="primary" 
            pill
          >
            {activeFiltersCount}
          </Badge>
        )}
      </Button>
      
      {activeFiltersCount > 0 && (
        <span className="text-muted small">
          {activeFiltersCount} active
        </span>
      )}
    </div>
  );
};

export { FilterToggleButton, FilterDropdownButton, LiveFilterToggle };
export default FilterToggleButton;
