import api from './api';

export const dashboardService = {
  /**
   * Get dashboard metrics
   * @returns {Promise} Dashboard metrics (active_members, mrr, expiring_members, total_revenue)
   */
  getMetrics: () => api.get('/dashboard/metrics'),
};
