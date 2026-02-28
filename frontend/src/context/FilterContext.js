import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { fetchFilterOptions, applyFilters } from '../services/filters';

// Initial filter state
const initialState = {
  // Date filters
  dateRange: 'last_30_days',
  startDate: null,
  endDate: null,
  
  // Category filters
  categories: [],
  
  // Status filters
  orderStatuses: [],
  expenseStatuses: [],
  invoiceStatuses: [],
  taskStatuses: [],
  
  // Branch filters
  branches: [],
  
  // Other filters
  paymentMethods: [],
  leadSources: [],
  taskPriorities: [],
  
  // Search
  search: '',
  
  // Filter options (loaded from backend)
  filterOptions: null,
  optionsLoading: false,
  optionsError: null,
  
  // Filtered data
  filteredData: null,
  dataLoading: false,
  dataError: null,
  
  // Active filters count
  activeFiltersCount: 0,
  
  // Panel visibility
  isFilterPanelOpen: false
};

// Action types
const ActionTypes = {
  // Date filters
  SET_DATE_RANGE: 'SET_DATE_RANGE',
  SET_CUSTOM_DATE_RANGE: 'SET_CUSTOM_DATE_RANGE',
  
  // Category filters
  SET_CATEGORIES: 'SET_CATEGORIES',
  TOGGLE_CATEGORY: 'TOGGLE_CATEGORY',
  
  // Status filters
  SET_ORDER_STATUSES: 'SET_ORDER_STATUSES',
  SET_EXPENSE_STATUSES: 'SET_EXPENSE_STATUSES',
  SET_INVOICE_STATUSES: 'SET_INVOICE_STATUSES',
  SET_TASK_STATUSES: 'SET_TASK_STATUSES',
  TOGGLE_STATUS: 'TOGGLE_STATUS',
  
  // Branch filters
  SET_BRANCHES: 'SET_BRANCHES',
  TOGGLE_BRANCH: 'TOGGLE_BRANCH',
  
  // Other filters
  SET_PAYMENT_METHODS: 'SET_PAYMENT_METHODS',
  SET_LEAD_SOURCES: 'SET_LEAD_SOURCES',
  SET_TASK_PRIORITIES: 'SET_TASK_PRIORITIES',
  
  // Search
  SET_SEARCH: 'SET_SEARCH',
  
  // Filter options
  SET_FILTER_OPTIONS: 'SET_FILTER_OPTIONS',
  SET_OPTIONS_LOADING: 'SET_OPTIONS_LOADING',
  SET_OPTIONS_ERROR: 'SET_OPTIONS_ERROR',
  
  // Filtered data
  SET_FILTERED_DATA: 'SET_FILTERED_DATA',
  SET_DATA_LOADING: 'SET_DATA_LOADING',
  SET_DATA_ERROR: 'SET_DATA_ERROR',
  
  // Panel visibility
  TOGGLE_FILTER_PANEL: 'TOGGLE_FILTER_PANEL',
  SET_FILTER_PANEL_OPEN: 'SET_FILTER_PANEL_OPEN',
  
  // Reset
  RESET_FILTERS: 'RESET_FILTERS',
  RESET_ALL: 'RESET_ALL'
};

// Reducer function
const filterReducer = (state, action) => {
  switch (action.type) {
    // Date filters
    case ActionTypes.SET_DATE_RANGE:
      return {
        ...state,
        dateRange: action.payload,
        startDate: null,
        endDate: null
      };
      
    case ActionTypes.SET_CUSTOM_DATE_RANGE:
      return {
        ...state,
        dateRange: 'custom',
        startDate: action.payload.startDate,
        endDate: action.payload.endDate
      };
    
    // Category filters
    case ActionTypes.SET_CATEGORIES:
      return {
        ...state,
        categories: action.payload
      };
      
    case ActionTypes.TOGGLE_CATEGORY: {
      const categoryId = action.payload;
      const categories = state.categories.includes(categoryId)
        ? state.categories.filter(id => id !== categoryId)
        : [...state.categories, categoryId];
      return { ...state, categories };
    }
    
    // Status filters
    case ActionTypes.SET_ORDER_STATUSES:
      return { ...state, orderStatuses: action.payload };
      
    case ActionTypes.SET_EXPENSE_STATUSES:
      return { ...state, expenseStatuses: action.payload };
      
    case ActionTypes.SET_INVOICE_STATUSES:
      return { ...state, invoiceStatuses: action.payload };
      
    case ActionTypes.SET_TASK_STATUSES:
      return { ...state, taskStatuses: action.payload };
      
    case ActionTypes.TOGGLE_STATUS: {
      const { filterType, value } = action.payload;
      const currentValues = state[filterType];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...state, [filterType]: newValues };
    }
    
    // Branch filters
    case ActionTypes.SET_BRANCHES:
      return { ...state, branches: action.payload };
      
    case ActionTypes.TOGGLE_BRANCH: {
      const branchId = action.payload;
      const branches = state.branches.includes(branchId)
        ? state.branches.filter(id => id !== branchId)
        : [...state.branches, branchId];
      return { ...state, branches };
    }
    
    // Other filters
    case ActionTypes.SET_PAYMENT_METHODS:
      return { ...state, paymentMethods: action.payload };
      
    case ActionTypes.SET_LEAD_SOURCES:
      return { ...state, leadSources: action.payload };
      
    case ActionTypes.SET_TASK_PRIORITIES:
      return { ...state, taskPriorities: action.payload };
    
    // Search
    case ActionTypes.SET_SEARCH:
      return { ...state, search: action.payload };
    
    // Filter options
    case ActionTypes.SET_FILTER_OPTIONS:
      return {
        ...state,
        filterOptions: action.payload,
        optionsLoading: false,
        optionsError: null
      };
      
    case ActionTypes.SET_OPTIONS_LOADING:
      return { ...state, optionsLoading: action.payload };
      
    case ActionTypes.SET_OPTIONS_ERROR:
      return { ...state, optionsError: action.payload, optionsLoading: false };
    
    // Filtered data
    case ActionTypes.SET_FILTERED_DATA:
      return {
        ...state,
        filteredData: action.payload,
        dataLoading: false,
        dataError: null
      };
      
    case ActionTypes.SET_DATA_LOADING:
      return { ...state, dataLoading: action.payload };
      
    case ActionTypes.SET_DATA_ERROR:
      return { ...state, dataError: action.payload, dataLoading: false };
    
    // Panel visibility
    case ActionTypes.TOGGLE_FILTER_PANEL:
      return { ...state, isFilterPanelOpen: !state.isFilterPanelOpen };
      
    case ActionTypes.SET_FILTER_PANEL_OPEN:
      return { ...state, isFilterPanelOpen: action.payload };
    
    // Reset
    case ActionTypes.RESET_FILTERS:
      return {
        ...state,
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
      };
      
    case ActionTypes.RESET_ALL:
      return initialState;
      
    default:
      return state;
  }
};

// Helper function to calculate active filters count
const calculateActiveFiltersCount = (state) => {
  let count = 0;
  
  if (state.dateRange && state.dateRange !== 'last_30_days') count++;
  if (state.startDate && state.endDate) count++;
  if (state.categories && state.categories.length > 0) count++;
  if (state.orderStatuses && state.orderStatuses.length > 0) count++;
  if (state.expenseStatuses && state.expenseStatuses.length > 0) count++;
  if (state.invoiceStatuses && state.invoiceStatuses.length > 0) count++;
  if (state.taskStatuses && state.taskStatuses.length > 0) count++;
  if (state.branches && state.branches.length > 0) count++;
  if (state.paymentMethods && state.paymentMethods.length > 0) count++;
  if (state.leadSources && state.leadSources.length > 0) count++;
  if (state.taskPriorities && state.taskPriorities.length > 0) count++;
  if (state.search && state.search.trim() !== '') count++;
  
  return count;
};

// Create context
const FilterContext = createContext(null);

// Provider component
export const FilterProvider = ({ children, branchId = null, onFiltersChange = null }) => {
  const [state, dispatch] = useReducer(filterReducer, initialState);
  
  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      dispatch({ type: ActionTypes.SET_OPTIONS_LOADING, payload: true });
      try {
        const options = await fetchFilterOptions(branchId);
        dispatch({ type: ActionTypes.SET_FILTER_OPTIONS, payload: options });
      } catch (error) {
        dispatch({ type: ActionTypes.SET_OPTIONS_ERROR, payload: error.message });
      }
    };
    
    loadFilterOptions();
  }, [branchId]);
  
  // Apply filters when they change
  useEffect(() => {
    const count = calculateActiveFiltersCount(state);
    dispatch({ type: 'SET_ACTIVE_COUNT', payload: count });
    
    if (onFiltersChange) {
      onFiltersChange(state);
    }
  }, [state.dateRange, state.startDate, state.endDate, state.categories, 
      state.orderStatuses, state.expenseStatuses, state.invoiceStatuses,
      state.taskStatuses, state.branches, state.paymentMethods, 
      state.leadSources, state.taskPriorities, state.search]);
  
  // Action creators
  const setDateRange = useCallback((dateRange) => {
    dispatch({ type: ActionTypes.SET_DATE_RANGE, payload: dateRange });
  }, []);
  
  const setCustomDateRange = useCallback((startDate, endDate) => {
    dispatch({ type: ActionTypes.SET_CUSTOM_DATE_RANGE, payload: { startDate, endDate } });
  }, []);
  
  const setCategories = useCallback((categories) => {
    dispatch({ type: ActionTypes.SET_CATEGORIES, payload: categories });
  }, []);
  
  const toggleCategory = useCallback((categoryId) => {
    dispatch({ type: ActionTypes.TOGGLE_CATEGORY, payload: categoryId });
  }, []);
  
  const setOrderStatuses = useCallback((statuses) => {
    dispatch({ type: ActionTypes.SET_ORDER_STATUSES, payload: statuses });
  }, []);
  
  const setExpenseStatuses = useCallback((statuses) => {
    dispatch({ type: ActionTypes.SET_EXPENSE_STATUSES, payload: statuses });
  }, []);
  
  const setInvoiceStatuses = useCallback((statuses) => {
    dispatch({ type: ActionTypes.SET_INVOICE_STATUSES, payload: statuses });
  }, []);
  
  const setTaskStatuses = useCallback((statuses) => {
    dispatch({ type: ActionTypes.SET_TASK_STATUSES, payload: statuses });
  }, []);
  
  const toggleStatus = useCallback((filterType, value) => {
    dispatch({ type: ActionTypes.TOGGLE_STATUS, payload: { filterType, value } });
  }, []);
  
  const setBranches = useCallback((branches) => {
    dispatch({ type: ActionTypes.SET_BRANCHES, payload: branches });
  }, []);
  
  const toggleBranch = useCallback((branchId) => {
    dispatch({ type: ActionTypes.TOGGLE_BRANCH, payload: branchId });
  }, []);
  
  const setPaymentMethods = useCallback((methods) => {
    dispatch({ type: ActionTypes.SET_PAYMENT_METHODS, payload: methods });
  }, []);
  
  const setLeadSources = useCallback((sources) => {
    dispatch({ type: ActionTypes.SET_LEAD_SOURCES, payload: sources });
  }, []);
  
  const setTaskPriorities = useCallback((priorities) => {
    dispatch({ type: ActionTypes.SET_TASK_PRIORITIES, payload: priorities });
  }, []);
  
  const setSearch = useCallback((search) => {
    dispatch({ type: ActionTypes.SET_SEARCH, payload: search });
  }, []);
  
  const toggleFilterPanel = useCallback(() => {
    dispatch({ type: ActionTypes.TOGGLE_FILTER_PANEL });
  }, []);
  
  const setFilterPanelOpen = useCallback((isOpen) => {
    dispatch({ type: ActionTypes.SET_FILTER_PANEL_OPEN, payload: isOpen });
  }, []);
  
  const resetFilters = useCallback(() => {
    dispatch({ type: ActionTypes.RESET_FILTERS });
  }, []);
  
  const resetAll = useCallback(() => {
    dispatch({ type: ActionTypes.RESET_ALL });
  }, []);
  
  // Apply filters and get data
  const applyCurrentFilters = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_DATA_LOADING, payload: true });
    
    const filters = {
      date_range: state.dateRange,
      start_date: state.startDate,
      end_date: state.endDate,
      categories: state.categories,
      order_statuses: state.orderStatuses,
      expense_statuses: state.expenseStatuses,
      invoice_statuses: state.invoiceStatuses,
      task_statuses: state.taskStatuses,
      branches: state.branches,
      payment_methods: state.paymentMethods,
      lead_sources: state.leadSources,
      task_priorities: state.taskPriorities,
      search: state.search
    };
    
    try {
      const data = await applyFilters(filters, branchId);
      dispatch({ type: ActionTypes.SET_FILTERED_DATA, payload: data });
      return data;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_DATA_ERROR, payload: error.message });
      throw error;
    }
  }, [state, branchId]);
  
  // Get current filters as object
  const getCurrentFilters = useCallback(() => {
    return {
      dateRange: state.dateRange,
      startDate: state.startDate,
      endDate: state.endDate,
      categories: state.categories,
      orderStatuses: state.orderStatuses,
      expenseStatuses: state.expenseStatuses,
      invoiceStatuses: state.invoiceStatuses,
      taskStatuses: state.taskStatuses,
      branches: state.branches,
      paymentMethods: state.paymentMethods,
      leadSources: state.leadSources,
      taskPriorities: state.taskPriorities,
      search: state.search
    };
  }, [state]);
  
  // Get active filters summary
  const getActiveFiltersSummary = useCallback(() => {
    const summary = [];
    
    if (state.dateRange && state.dateRange !== 'last_30_days') {
      summary.push({ type: 'date', label: `Date: ${state.dateRange.replace(/_/g, ' ')}` });
    }
    
    if (state.startDate && state.endDate) {
      summary.push({ type: 'customDate', label: `Custom: ${state.startDate} to ${state.endDate}` });
    }
    
    if (state.categories && state.categories.length > 0 && state.filterOptions?.categories) {
      const names = state.categories.map(id => 
        state.filterOptions.categories.find(c => c.id === id)?.name || id
      );
      summary.push({ type: 'categories', label: `Categories: ${names.join(', ')}` });
    }
    
    if (state.orderStatuses && state.orderStatuses.length > 0) {
      summary.push({ type: 'orderStatuses', label: `Orders: ${state.orderStatuses.join(', ')}` });
    }
    
    if (state.expenseStatuses && state.expenseStatuses.length > 0) {
      summary.push({ type: 'expenseStatuses', label: `Expenses: ${state.expenseStatuses.join(', ')}` });
    }
    
    if (state.invoiceStatuses && state.invoiceStatuses.length > 0) {
      summary.push({ type: 'invoiceStatuses', label: `Invoices: ${state.invoiceStatuses.join(', ')}` });
    }
    
    if (state.taskStatuses && state.taskStatuses.length > 0) {
      summary.push({ type: 'taskStatuses', label: `Tasks: ${state.taskStatuses.join(', ')}` });
    }
    
    if (state.branches && state.branches.length > 0 && state.filterOptions?.branches) {
      const names = state.branches.map(id => 
        state.filterOptions.branches.find(b => b.id === id)?.name || id
      );
      summary.push({ type: 'branches', label: `Branches: ${names.join(', ')}` });
    }
    
    if (state.search && state.search.trim() !== '') {
      summary.push({ type: 'search', label: `Search: "${state.search}"` });
    }
    
    return summary;
  }, [state]);
  
  const value = {
    // State
    ...state,
    activeFiltersCount: calculateActiveFiltersCount(state),
    
    // Actions
    setDateRange,
    setCustomDateRange,
    setCategories,
    toggleCategory,
    setOrderStatuses,
    setExpenseStatuses,
    setInvoiceStatuses,
    setTaskStatuses,
    toggleStatus,
    setBranches,
    toggleBranch,
    setPaymentMethods,
    setLeadSources,
    setTaskPriorities,
    setSearch,
    toggleFilterPanel,
    setFilterPanelOpen,
    resetFilters,
    resetAll,
    applyCurrentFilters,
    getCurrentFilters,
    getActiveFiltersSummary
  };
  
  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

// Custom hook to use filter context
export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};

export default FilterContext;
