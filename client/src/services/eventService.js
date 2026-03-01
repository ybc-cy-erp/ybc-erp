import api from './api';

const eventService = {
  /**
   * Get all events
   */
  getAll: (params) => api.get('/events', { params }),
  
  /**
   * Get single event
   */
  getById: (id) => api.get(`/events/${id}`),
  
  /**
   * Create event
   */
  create: (data) => api.post('/events', data),
  
  /**
   * Update event
   */
  update: (id, data) => api.put(`/events/${id}`, data),
  
  /**
   * Cancel event (soft delete)
   */
  cancel: (id) => api.delete(`/events/${id}`),

  /**
   * Get ticket types for event
   */
  getTicketTypes: (eventId) => api.get(`/events/${eventId}/ticket-types`),

  /**
   * Create ticket type
   */
  createTicketType: (eventId, data) => api.post(`/events/${eventId}/ticket-types`, data),

  /**
   * Update ticket type
   */
  updateTicketType: (id, data) => api.put(`/ticket-types/${id}`, data),

  /**
   * Delete ticket type
   */
  deleteTicketType: (id) => api.delete(`/ticket-types/${id}`)
};

export default eventService;
