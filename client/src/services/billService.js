import api from './api';

const billService = {
  /**
   * Get all bills
   */
  getAll: (params) => api.get('/bills', { params }),
  
  /**
   * Get single bill with payments
   */
  getById: (id) => api.get(`/bills/${id}`),
  
  /**
   * Create bill
   */
  create: (data) => api.post('/bills', data),
  
  /**
   * Update bill (draft only)
   */
  update: (id, data) => api.put(`/bills/${id}`, data),
  
  /**
   * Approve bill
   */
  approve: (id) => api.put(`/bills/${id}/approve`),
  
  /**
   * Delete bill (draft only)
   */
  delete: (id) => api.delete(`/bills/${id}`),

  /**
   * Pay bill
   */
  pay: (billId, paymentData) => api.post(`/payments/bills/${billId}/pay`, paymentData),

  /**
   * Get payments for bill
   */
  getPayments: (billId) => api.get('/payments', { params: { bill_id: billId } })
};

export default billService;
