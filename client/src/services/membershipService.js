import api from './api';

const membershipService = {
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

export default membershipService;
