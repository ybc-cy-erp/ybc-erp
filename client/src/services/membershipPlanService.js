import api from './api';

const membershipPlanService = {
  /**
   * Get all membership plans
   * @param {string} status - Filter by status (optional)
   */
  getAll: (status) => api.get('/membership-plans', { params: { status } }),
  
  /**
   * Get single membership plan
   */
  getById: (id) => api.get(`/membership-plans/${id}`),
  
  /**
   * Create membership plan (Owner only)
   */
  create: (data) => api.post('/membership-plans', data),
  
  /**
   * Update membership plan (Owner only)
   */
  update: (id, data) => api.put(`/membership-plans/${id}`, data),
  
  /**
   * Delete membership plan (Owner only)
   */
  delete: (id) => api.delete(`/membership-plans/${id}`)
};

export default membershipPlanService;
