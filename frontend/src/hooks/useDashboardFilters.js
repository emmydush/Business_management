import { useState, useEffect, useCallback } from 'react';
import { fetchFilterOptions, applyFilters } from '../services/filters';

/**
 * Custom hook for dashboard filtering functionality
 * @param {Object} options - Configuration options
 * @param {number} options.branchId - Branch ID for filtering
 * @param {boolean} options.enableRealTime - Enable real-time filtering (default: true)
 * @param {number} options.debounceMs - Debounce delay for real-time filtering (default: 500ms)
 * @param {Function} options.onDataChange - Callback when filtered data changes
 * @returns {Object} Filter state and methods
 */
export const useDashboardFilters = ({ 
  branchId = null, 
  enableRealTime = true,
  debounceMs = 500,
  onDataChange = null
} = {}) => {
  // Filter state
  const [filters, setFilters] = useState({
    dateRange: 'last_30_days',
    startDate: null,
    endDate: null,
    categories: [],
    orderStatuses: [],
    expenseStatuses: [],
    invoiceStatuses: [],
    taskStatuses: [],
    branches: [],
    paymentMethods: [],
    leadSources: [],
    taskPriorities: [],
    search: ''
  });
  
  // Filter options (loaded from backend)
  const [filterOptions, setFilterOptions] = useState(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState(null);
  
  // Filtered data
  const [filteredData, setFilteredData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);
  
  // Panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  
  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      setOptionsLoading(true);
      try {
        const options = await fetchFilterOptions(branchId);
        setFilterOptions(options);
        setOptionsError(null);
      } catch (error) {
        setOptionsError(error.message);
        console.error('Error loading filter options:', error);
      } finally {
        setOptionsLoading(false);
      }
    };
    
    loadFilterOptions();
  }, [branchId]);
  
  // Apply filters and fetch data
  const applyCurrentFilters = useCallback(async (customFilters = null) => {
    const filtersToApply = customFilters || filters;
    
    setDataLoading(true);
    try {
      const data = await applyFilters(filtersToApply, branchId);
      setFilteredData(data);
      setDataError(null);
      
      if (onDataChange) {
        onDataChange(data);
      }
      
      return data;
    } catch (error) {
      setDataError(error.message);
      console.error('Error applying filters:', error);
      throw error;
    } finally {
      setDataLoading(false);
    }
  }, [filters, branchId, onDataChange]);
  
  // Debounced real-time filtering
  useEffect(() => {
    if (!enableRealTime || !filterOptions) return;
    
    const timer = setTimeout(() => {
      applyCurrentFilters();
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [filters, enableRealTime, filterOptions, debounceMs]);
  
  // Filter update methods
  const setDateRange = useCallback((dateRange) => {
    setFilters(prev => ({ ...prev, dateRange, startDate: null, endDate: null }));
  }, []);
  
  const setCustomDateRange = useCallback((startDate, endDate) => {
    setFilters(prev => ({ 
      ...prev, 
      dateRange: 'custom', 
      startDate, 
      endDate 
    }));
  }, []);
  
  const setCategories = useCallback((categories) => {
    setFilters(prev => ({ ...prev, categories }));
  }, []);
  
  const toggleCategory = useCallback((categoryId) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  }, []);
  
  const setOrderStatuses = useCallback((orderStatuses) => {
    setFilters(prev => ({ ...prev, orderStatuses }));
  }, []);
  
  const toggleOrderStatus = useCallback((status) => {
    setFilters(prev => ({
      ...prev,
      orderStatuses: prev.orderStatuses.includes(status)
        ? prev.orderStatuses.filter(s => s !== status)
        : [...prev.orderStatuses, status]
    }));
  }, []);
  
  const setExpenseStatuses = useCallback((expenseStatuses) => {
    setFilters(prev => ({ ...prev, expenseStatuses }));
  }, []);
  
  const toggleExpenseStatus = useCallback((status) => {
    setFilters(prev => ({
      ...prev,
      expenseStatuses: prev.expenseStatuses.includes(status)
        ? prev.expenseStatuses.filter(s => s !== status)
        : [...prev.expenseStatuses, status]
    }));
  }, []);
  
  const setInvoiceStatuses = useCallback((invoiceStatuses) => {
    setFilters(prev => ({ ...prev, invoiceStatuses }));
  }, []);
  
  const toggleInvoiceStatus = useCallback((status) => {
    setFilters(prev => ({
      ...prev,
      invoiceStatuses: prev.invoiceStatuses.includes(status)
        ? prev.invoiceStatuses.filter(s => s !== status)
        : [...prev.invoiceStatuses, status]
    }));
  }, []);
  
  const setBranches = useCallback((branches) => {
    setFilters(prev => ({ ...prev, branches }));
  }, []);
  
  const toggleBranch = useCallback((branchId) => {
    setFilters(prev => ({
      ...prev,
      branches: prev.branches.includes(branchId)
        ? prev.branches.filter(id => id !== branchId)
        : [...prev.branches, branchId]
    }));
  }, []);
  
  const setSearch = useCallback((search) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);
  
  const setTaskStatuses = useCallback((taskStatuses) => {
    setFilters(prev => ({ ...prev, taskStatuses }));
  }, []);
  
  const toggleTaskStatus = useCallback((status) => {
    setFilters(prev => ({
      ...prev,
      taskStatuses: prev.taskStatuses.includes(status)
        ? prev.taskStatuses.filter(s => s !== status)
        : [...prev.taskStatuses, status]
    }));
  }, []);
  
  const setTaskPriorities = useCallback((taskPriorities) => {
    setFilters(prev => ({ ...prev, taskPriorities }));
  }, []);
  
  const toggleTaskPriority = useCallback((priority) => {
    setFilters(prev => ({
      ...prev,
      taskPriorities: prev.taskPriorities.includes(priority)
        ? prev.taskPriorities.filter(p => p !== priority)
        : [...prev.taskPriorities, priority]
    }));
  }, []);
  
  // Reset methods
  const resetFilters = useCallback(() => {
    setFilters({
      dateRange: 'last_30_days',
      startDate: null,
      endDate: null,
      categories: [],
      orderStatuses: [],
      expenseStatuses: [],
      invoiceStatuses: [],
      taskStatuses: [],
      branches: [],
      paymentMethods: [],
      leadSources: [],
      taskPriorities: [],
      search: ''
    });
  }, []);
  
  const resetAll = useCallback(() => {
    resetFilters();
    setFilteredData(null);
  }, [resetFilters]);
  
  // Calculate active filters count
  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    
    if (filters.dateRange && filters.dateRange !== 'last_30_days') count++;
    if (filters.startDate && filters.endDate) count++;
    if (filters.categories && filters.categories.length > 0) count++;
    if (filters.orderStatuses && filters.orderStatuses.length > 0) count++;
    if (filters.expenseStatuses && filters.expenseStatuses.length > 0) count++;
    if (filters.invoiceStatuses && filters.invoiceStatuses.length > 0) count++;
    if (filters.taskStatuses && filters.taskStatuses.length > 0) count++;
    if (filters.branches && filters.branches.length > 0) count++;
    if (filters.paymentMethods && filters.paymentMethods.length > 0) count++;
    if (filters.leadSources && filters.leadSources.length > 0) count++;
    if (filters.taskPriorities && filters.taskPriorities.length > 0) count++;
    if (filters.search && filters.search.trim() !== '') count++;
    
    return count;
  }, [filters]);
  
  // Get active filters summary
  const getActiveFiltersSummary = useCallback(() => {
    const summary = [];
    
    if (filters.dateRange && filters.dateRange !== 'last_30_days') {
      summary.push({ type: 'date', label: `Date: ${filters.dateRange.replace(/_/g, ' ')}` });
    }
    
    if (filters.startDate && filters.endDate) {
      summary.push({ type: 'customDate', label: `Custom: ${filters.startDate} to ${filters.endDate}` });
    }
    
    if (filters.categories && filters.categories.length > 0 && filterOptions?.categories) {
      const names = filters.categories.map(id => 
        filterOptions.categories.find(c => c.id === id)?.name || id
      );
      summary.push({ type: 'categories', label: `Categories: ${names.join(', ')}` });
    }
    
    if (filters.orderStatuses && filters.orderStatuses.length > 0) {
      summary.push({ type: 'orderStatuses', label: `Orders: ${filters.orderStatuses.join(', ')}` });
    }
    
    if (filters.expenseStatuses && filters.expenseStatuses.length > 0) {
      summary.push({ type: 'expenseStatuses', label: `Expenses: ${filters.expenseStatuses.join(', ')}` });
    }
    
    if (filters.invoiceStatuses && filters.invoiceStatuses.length > 0) {
      summary.push({ type: 'invoiceStatuses', label: `Invoices: ${filters.invoiceStatuses.join(', ')}` });
    }
    
    if (filters.taskStatuses && filters.taskStatuses.length > 0) {
      summary.push({ type: 'taskStatuses', label: `Tasks: ${filters.taskStatuses.join(', ')}` });
    }
    
    if (filters.branches && filters.branches.length > 0 && filterOptions?.branches) {
      const names = filters.branches.map(id => 
        filterOptions.branches.find(b => b.id === id)?.name || id
      );
      summary.push({ type: 'branches', label: `Branches: ${names.join(', ')}` });
    }
    
    if (filters.search && filters.search.trim() !== '') {
      summary.push({ type: 'search', label: `Search: "${filters.search}"` });
    }
    
    return summary;
  }, [filters, filterOptions]);
  
  // Toggle panel
  const toggleFilterPanel = useCallback(() => {
    setIsFilterPanelOpen(prev => !prev);
  }, []);
  
  const setFilterPanelOpen = useCallback((isOpen) => {
    setIsFilterPanelOpen(isOpen);
  }, []);
  
  return {
    // Filter state
    filters,
    
    // Filter options
    filterOptions,
    optionsLoading,
    optionsError,
    
    // Filtered data
    filteredData,
    dataLoading,
    dataError,
    
    // Panel state
    isFilterPanelOpen,
    toggleFilterPanel,
    setFilterPanelOpen,
    
    // Active filters
    activeFiltersCount: getActiveFiltersCount(),
    getActiveFiltersSummary,
    
    // Filter methods
    setDateRange,
    setCustomDateRange,
    setCategories,
    toggleCategory,
    setOrderStatuses,
    toggleOrderStatus,
    setExpenseStatuses,
    toggleExpenseStatus,
    setInvoiceStatuses,
    toggleInvoiceStatus,
    setBranches,
    toggleBranch,
    setSearch,
    setTaskStatuses,
    toggleTaskStatus,
    setTaskPriorities,
    toggleTaskPriority,
    
    // Actions
    applyCurrentFilters,
    resetFilters,
    resetAll
  };
};

export default useDashboardFilters;
