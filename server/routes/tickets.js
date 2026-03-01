const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const supabase = require('../config/supabase');
const Joi = require('joi');

// ===== TICKET TYPES ENDPOINTS =====

const ticketTypeSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  price: Joi.number().min(0).required(),
  quantity_available: Joi.number().integer().min(1).required()
});

/**
 * POST /api/events/:eventId/ticket-types
 * Create ticket type for event
 */
router.post('/events/:eventId/ticket-types', authenticate, authorize(['owner', 'manager']), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { error: validationError, value } = ticketTypeSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    // Verify event exists and belongs to tenant
    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('tenant_id', req.user.tenant_id)
      .single();

    if (!event) {
      return res.status(404).json({ error: 'Подію не знайдено' });
    }

    const ticketTypeData = {
      ...value,
      event_id: eventId
    };

    const { data, error } = await supabase
      .from('ticket_types')
      .insert(ticketTypeData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Тип квитка створено', ticketType: data });

  } catch (error) {
    console.error('Create ticket type error:', error);
    res.status(500).json({ error: 'Помилка створення типу квитка' });
  }
});

/**
 * GET /api/events/:eventId/ticket-types
 * List ticket types for event
 */
router.get('/events/:eventId/ticket-types', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;

    const { data, error } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('event_id', eventId)
      .order('price', { ascending: true });

    if (error) throw error;

    res.json(data);

  } catch (error) {
    console.error('List ticket types error:', error);
    res.status(500).json({ error: 'Помилка завантаження типів квитків' });
  }
});

/**
 * PUT /api/ticket-types/:id
 * Update ticket type
 */
router.put('/ticket-types/:id', authenticate, authorize(['owner', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = ticketTypeSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    const { data, error } = await supabase
      .from('ticket_types')
      .update(value)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Тип квитка оновлено', ticketType: data });

  } catch (error) {
    console.error('Update ticket type error:', error);
    res.status(500).json({ error: 'Помилка оновлення типу квитка' });
  }
});

/**
 * DELETE /api/ticket-types/:id
 * Delete ticket type (if no tickets sold)
 */
router.delete('/ticket-types/:id', authenticate, authorize(['owner', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if any tickets sold
    const { data: ticketType } = await supabase
      .from('ticket_types')
      .select('quantity_sold')
      .eq('id', id)
      .single();

    if (ticketType && ticketType.quantity_sold > 0) {
      return res.status(400).json({ 
        error: 'Неможливо видалити тип квитка з проданими квитками' 
      });
    }

    const { error } = await supabase
      .from('ticket_types')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Тип квитка видалено' });

  } catch (error) {
    console.error('Delete ticket type error:', error);
    res.status(500).json({ error: 'Помилка видалення типу квитка' });
  }
});

// ===== TICKET SALES ENDPOINTS =====

const ticketSaleSchema = Joi.object({
  ticket_type_id: Joi.string().uuid().required(),
  customer_name: Joi.string().min(2).max(200).required(),
  quantity: Joi.number().integer().min(1).default(1)
});

/**
 * POST /api/tickets
 * Sell ticket(s)
 */
router.post('/tickets', authenticate, async (req, res) => {
  try {
    const { error: validationError, value } = ticketSaleSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    // Get ticket type details
    const { data: ticketType, error: fetchError } = await supabase
      .from('ticket_types')
      .select('*, events!inner(tenant_id, capacity, event_date)')
      .eq('id', value.ticket_type_id)
      .single();

    if (fetchError || !ticketType) {
      return res.status(404).json({ error: 'Тип квитка не знайдено' });
    }

    // Verify tenant access
    if (ticketType.events.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({ error: 'Доступ заборонено' });
    }

    // Check capacity
    const availableQuantity = ticketType.quantity_available - ticketType.quantity_sold;
    if (value.quantity > availableQuantity) {
      return res.status(400).json({ 
        error: `Недостатньо квитків. Доступно: ${availableQuantity}` 
      });
    }

    const totalAmount = ticketType.price * value.quantity;

    const ticketData = {
      ...value,
      tenant_id: req.user.tenant_id,
      total_amount: totalAmount,
      status: 'sold'
    };

    const { data, error } = await supabase
      .from('tickets')
      .insert(ticketData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ 
      message: 'Квиток(и) продано успішно',
      ticket: data 
    });

  } catch (error) {
    console.error('Sell ticket error:', error);
    res.status(500).json({ error: 'Помилка продажу квитка' });
  }
});

/**
 * GET /api/tickets
 * List ticket sales
 */
router.get('/tickets', authenticate, async (req, res) => {
  try {
    const { status, ticket_type_id } = req.query;

    let query = supabase
      .from('tickets')
      .select(`
        *,
        ticket_types(name, price, events(name, event_date))
      `)
      .eq('tenant_id', req.user.tenant_id)
      .order('sale_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (ticket_type_id) {
      query = query.eq('ticket_type_id', ticket_type_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);

  } catch (error) {
    console.error('List tickets error:', error);
    res.status(500).json({ error: 'Помилка завантаження квитків' });
  }
});

/**
 * GET /api/tickets/:id
 * Get ticket details
 */
router.get('/tickets/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        ticket_types(*, events(*))
      `)
      .eq('id', id)
      .eq('tenant_id', req.user.tenant_id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Квиток не знайдено' });
    }

    res.json(data);

  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Помилка завантаження квитка' });
  }
});

/**
 * POST /api/tickets/:id/refund
 * Refund ticket (reversal accounting)
 */
router.post('/tickets/:id/refund', authenticate, authorize(['owner', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;

    // Get ticket
    const { data: ticket, error: fetchError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', req.user.tenant_id)
      .single();

    if (fetchError || !ticket) {
      return res.status(404).json({ error: 'Квиток не знайдено' });
    }

    if (ticket.status === 'refunded') {
      return res.status(400).json({ error: 'Квиток вже повернуто' });
    }

    // Update ticket status to refunded
    const { data, error } = await supabase
      .from('tickets')
      .update({ status: 'refunded' })
      .eq('id', id)
      .eq('tenant_id', req.user.tenant_id)
      .select()
      .single();

    if (error) throw error;

    // Note: quantity_sold will be decremented by trigger

    res.json({
      message: 'Квиток повернуто успішно',
      ticket: data
    });

  } catch (error) {
    console.error('Refund ticket error:', error);
    res.status(500).json({ error: 'Помилка повернення квитка' });
  }
});

module.exports = router;
