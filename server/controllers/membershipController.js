const Joi = require('joi');
const supabase = require('../config/database');
const logger = require('../utils/logger');
const { calculateDailyRevenue, calculateEndDate } = require('../services/revenueService');

// Validation schemas
const createMembershipSchema = Joi.object({
  plan_id: Joi.string().uuid().required(),
  user_id: Joi.string().uuid().allow(null),
  client_name: Joi.string().min(2).max(255).allow(null),
  start_date: Joi.date().iso().required(),
  payment_amount: Joi.number().positive().required(),
  payment_currency: Joi.string().valid('EUR', 'USD', 'USDT', 'BTC', 'ETH').default('EUR')
}).custom((value, helpers) => {
  // Either user_id or client_name must be provided
  if (!value.user_id && !value.client_name) {
    return helpers.error('any.custom', { 
      message: 'Either user_id or client_name must be provided' 
    });
  }
  return value;
});

const updateMembershipSchema = Joi.object({
  plan_id: Joi.string().uuid(),
  client_name: Joi.string().min(2).max(255).allow(null),
  start_date: Joi.date().iso(),
  end_date: Joi.date().iso().allow(null),
  status: Joi.string().valid('active', 'frozen', 'cancelled', 'expired'),
  payment_amount: Joi.number().positive(),
  payment_currency: Joi.string().valid('EUR', 'USD', 'USDT', 'BTC', 'ETH')
}).min(1);

/**
 * Create membership
 * POST /api/memberships
 */
exports.createMembership = async (req, res, next) => {
  try {
    const { tenant_id } = req.user;

    // Validate input
    const { error, value } = createMembershipSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message || error.message });
    }

    // Get plan to calculate end_date
    const { data: plan, error: planError } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('id', value.plan_id)
      .eq('tenant_id', tenant_id)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Membership plan not found' });
    }

    // Calculate end_date based on plan
    const endDate = calculateEndDate(new Date(value.start_date), plan);

    // Create membership
    const { data: membership, error: createError } = await supabase
      .from('memberships')
      .insert({
        tenant_id,
        plan_id: value.plan_id,
        user_id: value.user_id,
        client_name: value.client_name,
        start_date: value.start_date,
        end_date: endDate ? endDate.toISOString().split('T')[0] : null,
        payment_amount: value.payment_amount,
        payment_currency: value.payment_currency,
        status: 'active'
      })
      .select()
      .single();

    if (createError) throw createError;

    logger.info('Membership created', { 
      membership_id: membership.id, 
      created_by: req.user.id 
    });

    res.status(201).json({
      message: 'Membership created successfully',
      membership
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all memberships with filters
 * GET /api/memberships?status=active&plan_id=xxx
 */
exports.getAllMemberships = async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const { status, plan_id, search } = req.query;

    let query = supabase
      .from('memberships')
      .select(`
        *,
        plan:plan_id (id, name, type, daily_rate),
        user:user_id (id, name, email)
      `)
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false });

    // Filters
    if (status) query = query.eq('status', status);
    if (plan_id) query = query.eq('plan_id', plan_id);
    if (search) {
      query = query.or(`client_name.ilike.%${search}%,user.name.ilike.%${search}%`);
    }

    const { data: memberships, error } = await query;

    if (error) throw error;

    res.json({
      count: memberships.length,
      memberships
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single membership with revenue calculation
 * GET /api/memberships/:id
 */
exports.getMembership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.user;

    const { data: membership, error } = await supabase
      .from('memberships')
      .select(`
        *,
        plan:plan_id (*),
        user:user_id (id, name, email),
        freeze_periods:membership_freeze (*)
      `)
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .single();

    if (error || !membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    // Calculate revenue
    const revenue = calculateDailyRevenue({
      ...membership,
      plan: membership.plan,
      freeze_periods: membership.freeze_periods || []
    });

    res.json({
      ...membership,
      calculated_revenue: revenue
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update membership
 * PUT /api/memberships/:id
 */
exports.updateMembership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.user;

    // Validate input
    const { error, value } = updateMembershipSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check membership exists
    const { data: existingMembership } = await supabase
      .from('memberships')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .single();

    if (!existingMembership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    // If plan_id is being updated, recalculate end_date
    let updateData = { ...value };
    if (value.plan_id) {
      const { data: newPlan } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('id', value.plan_id)
        .eq('tenant_id', tenant_id)
        .single();

      if (!newPlan) {
        return res.status(404).json({ error: 'New membership plan not found' });
      }

      const startDate = value.start_date || existingMembership.start_date;
      const endDate = calculateEndDate(new Date(startDate), newPlan);
      updateData.end_date = endDate ? endDate.toISOString().split('T')[0] : null;
    }

    // Update membership
    const { data: membership, error: updateError } = await supabase
      .from('memberships')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    logger.info('Membership updated', { 
      membership_id: id, 
      updated_by: req.user.id 
    });

    res.json({
      message: 'Membership updated successfully',
      membership
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel membership (soft delete)
 * DELETE /api/memberships/:id
 */
exports.cancelMembership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.user;

    // Check membership exists
    const { data: existingMembership } = await supabase
      .from('memberships')
      .select('id, status')
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .single();

    if (!existingMembership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    if (existingMembership.status === 'cancelled') {
      return res.status(400).json({ error: 'Membership already cancelled' });
    }

    // Cancel membership
    const { error: cancelError } = await supabase
      .from('memberships')
      .update({
        status: 'cancelled',
        end_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (cancelError) throw cancelError;

    logger.info('Membership cancelled', { 
      membership_id: id, 
      cancelled_by: req.user.id 
    });

    res.json({
      message: 'Membership cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue breakdown for membership
 * GET /api/memberships/:id/revenue
 */
exports.getMembershipRevenue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.user;

    const { data: membership, error } = await supabase
      .from('memberships')
      .select(`
        *,
        plan:plan_id (*),
        freeze_periods:membership_freeze (*)
      `)
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .single();

    if (error || !membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    // Calculate revenue
    const revenue = calculateDailyRevenue({
      ...membership,
      plan: membership.plan,
      freeze_periods: membership.freeze_periods || []
    });

    res.json(revenue);
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
