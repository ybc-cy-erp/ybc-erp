import api from './api';

export const membershipPlanService = {
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

export const membershipService = {
  /**
   * Get all memberships
   */
  getAll: (params) => api.get('/memberships', { params }),
  
  /**
   * Get single membership with revenue
   */
  getById: (id) => api.get(`/memberships/${id}`),
  
  /**
   * Get membership revenue breakdown
   */
  getRevenue: (id) => api.get(`/memberships/${id}/revenue`),
  
  /**
   * Create membership
   */
  create: (data) => api.post('/memberships', data),
  
  /**
   * Update membership
   */
  update: (id, data) => api.put(`/memberships/${id}`, data),
  
  /**
   * Cancel membership
   */
  cancel: (id) => api.delete(`/memberships/${id}`),
  
  /**
   * Create freeze period
   */
  createFreeze: (membershipId, data) => api.post(`/memberships/${membershipId}/freeze`, data),
  
  /**
   * Get freeze periods
   */
  getFreezes: (membershipId) => api.get(`/memberships/${membershipId}/freeze`),
  
  /**
   * Remove freeze period
   */
  removeFreeze: (membershipId, freezeId) => api.delete(`/memberships/${membershipId}/unfreeze`)
};
