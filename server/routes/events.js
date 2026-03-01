const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

// Validation schemas
const eventSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  description: Joi.string().allow('', null),
  event_date: Joi.date().iso().required(),
  location: Joi.string().max(200).allow('', null),
  capacity: Joi.number().integer().min(1).required(),
  status: Joi.string().valid('draft', 'published', 'cancelled').default('draft')
});

const eventUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(200),
  description: Joi.string().allow('', null),
  event_date: Joi.date().iso(),
  location: Joi.string().max(200).allow('', null),
  capacity: Joi.number().integer().min(1),
  status: Joi.string().valid('draft', 'published', 'cancelled')
});

/**
 * POST /api/events
 * Create new event
 * Access: Owner, Manager
 */
router.post('/', authenticate, authorize(['owner', 'manager']), async (req, res) => {
  try {
    const { error: validationError, value } = eventSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    const eventData = {
      ...value,
      tenant_id: req.user.tenant_id,
      created_by: req.user.id
    };

    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Подію створено успішно',
      event: data
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Помилка створення події' });
  }
});

/**
 * GET /api/events
 * List events with filters
 * Query params: status, from_date, to_date
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, from_date, to_date } = req.query;

    let query = supabase
      .from('events')
      .select('*')
      .eq('tenant_id', req.user.tenant_id)
      .order('event_date', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (from_date) {
      query = query.gte('event_date', from_date);
    }

    if (to_date) {
      query = query.lte('event_date', to_date);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);

  } catch (error) {
    console.error('List events error:', error);
    res.status(500).json({ error: 'Помилка завантаження подій' });
  }
});

/**
 * GET /api/events/:id
 * Get single event
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', req.user.tenant_id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Подію не знайдено' });
    }

    res.json(data);

  } catch (error) {
    console.error('Get event error:', error);
    
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Подію не знайдено' });
    }

    res.status(500).json({ error: 'Помилка завантаження події' });
  }
});

/**
 * PUT /api/events/:id
 * Update event
 * Access: Owner, Manager
 */
router.put('/:id', authenticate, authorize(['owner', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;

    const { error: validationError, value } = eventUpdateSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    // Check if event exists and belongs to tenant
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', req.user.tenant_id)
      .single();

    if (fetchError || !existingEvent) {
      return res.status(404).json({ error: 'Подію не знайдено' });
    }

    // Business rule: Cannot edit cancelled events
    if (existingEvent.status === 'cancelled') {
      return res.status(400).json({ 
        error: 'Неможливо редагувати скасовану подію' 
      });
    }

    const { data, error } = await supabase
      .from('events')
      .update(value)
      .eq('id', id)
      .eq('tenant_id', req.user.tenant_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Подію оновлено успішно',
      event: data
    });

  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Помилка оновлення події' });
  }
});

/**
 * DELETE /api/events/:id
 * Cancel event (soft delete)
 * Access: Owner, Manager
 */
router.delete('/:id', authenticate, authorize(['owner', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', req.user.tenant_id)
      .single();

    if (fetchError || !existingEvent) {
      return res.status(404).json({ error: 'Подію не знайдено' });
    }

    // Business rule: Can only cancel published or draft events
    if (existingEvent.status === 'cancelled') {
      return res.status(400).json({ error: 'Подія вже скасована' });
    }

    // Soft delete: set status to cancelled
    const { data, error } = await supabase
      .from('events')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('tenant_id', req.user.tenant_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Подію скасовано успішно',
      event: data
    });

  } catch (error) {
    console.error('Cancel event error:', error);
    res.status(500).json({ error: 'Помилка скасування події' });
  }
});

module.exports = router;
