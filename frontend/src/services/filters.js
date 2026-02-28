import api from './api';

// Get available filter options from backend
export const fetchFilterOptions = async (branchId = null) => {
  try {
    const params = branchId ? { branch_id: branchId } : {};
    const response = await api.get('/dashboard/filters/options', { params });
    return response.data.filter_options;
  } catch (error) {
    console.error('Error fetching filter options:', error);
    throw error;
  }
};

// Apply filters and get filtered data
export const applyFilters = async (filters, branchId = null) => {
  try {
    const params = branchId ? { branch_id: branchId } : {};
    const response = await api.post('/dashboard/filters/apply', filters, { params });
    return response.data;
  } catch (error) {
    console.error('Error applying filters:', error);
    throw error;
  }
};

export default {
  fetchFilterOptions,
  applyFilters
};
