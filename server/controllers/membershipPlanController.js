const Joi = require('joi');
const supabase = require('../config/database');
const logger = require('../utils/logger');

// Validation schemas
const createPlanSchema = Joi.object({
  name: Joi.string().min(3).max(255).required(),
  type: Joi.string().valid('monthly', 'quarterly', 'annual', 'lifetime', 'custom').required(),
  duration_days: Joi.number().integer().min(1).allow(null),
  daily_rate: Joi.number().positive().required(),
  status: Joi.string().valid('active', 'inactive').default('active')
});

const updatePlanSchema = Joi.object({
  name: Joi.string().min(3).max(255),
  type: Joi.string().valid('monthly', 'quarterly', 'annual', 'lifetime', 'custom'),
  duration_days: Joi.number().integer().min(1).allow(null),
  daily_rate: Joi.number().positive(),
  status: Joi.string().valid('active', 'inactive')
}).min(1);

/**
 * Create membership plan (Owner only)
 * POST /api/membership-plans
 */
exports.createPlan = async (req, res, next) => {
  try {
    const { tenant_id } = req.user;

    // Validate input
    const { error, value } = createPlanSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Validate: lifetime plans should not have duration_days
    if (value.type === 'lifetime' && value.duration_days) {
      return res.status(400).json({ 
        error: 'Lifetime plans should not have duration_days' 
      });
    }

    // Validate: non-lifetime plans should have duration_days
    if (value.type !== 'lifetime' && !value.duration_days) {
      return res.status(400).json({ 
        error: `${value.type} plans must have duration_days` 
      });
    }

    // Create plan
    const { data: plan, error: createError } = await supabase
      .from('membership_plans')
      .insert({
        tenant_id,
        ...value
      })
      .select()
      .single();

    if (createError) throw createError;

    logger.info('Membership plan created', { 
      plan_id: plan.id, 
      created_by: req.user.id 
    });

    res.status(201).json({
      message: 'Membership plan created successfully',
      plan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all membership plans in tenant
 * GET /api/membership-plans
 */
exports.getAllPlans = async (req, res, next) => {
  try {
    const { tenant_id } = req.user;
    const { status } = req.query;

    let query = supabase
      .from('membership_plans')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: plans, error } = await query;

    if (error) throw error;

    res.json({
      count: plans.length,
      plans
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single membership plan
 * GET /api/membership-plans/:id
 */
exports.getPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.user;

    const { data: plan, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .single();

    if (error || !plan) {
      return res.status(404).json({ error: 'Membership plan not found' });
    }

    res.json(plan);
  } catch (error) {
    next(error);
  }
};

/**
 * Update membership plan (Owner only)
 * PUT /api/membership-plans/:id
 */
exports.updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.user;

    // Validate input
    const { error, value } = updatePlanSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check plan exists
    const { data: existingPlan } = await supabase
      .from('membership_plans')
      .select('id, type')
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .single();

    if (!existingPlan) {
      return res.status(404).json({ error: 'Membership plan not found' });
    }

    // Validate type + duration_days consistency if updating
    const finalType = value.type || existingPlan.type;
    if (finalType === 'lifetime' && value.duration_days !== undefined && value.duration_days !== null) {
      return res.status(400).json({ 
        error: 'Lifetime plans should not have duration_days' 
      });
    }

    // Update plan
    const { data: plan, error: updateError } = await supabase
      .from('membership_plans')
      .update({
        ...value,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    logger.info('Membership plan updated', { 
      plan_id: id, 
      updated_by: req.user.id 
    });

    res.json({
      message: 'Membership plan updated successfully',
      plan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete membership plan (soft delete, Owner only)
 * DELETE /api/membership-plans/:id
 */
exports.deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.user;

    // Check plan exists
    const { data: existingPlan } = await supabase
      .from('membership_plans')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .single();

    if (!existingPlan) {
      return res.status(404).json({ error: 'Membership plan not found' });
    }

    // Check if plan is in use (has active memberships)
    const { data: memberships, error: checkError } = await supabase
      .from('memberships')
      .select('id')
      .eq('plan_id', id)
      .eq('status', 'active')
      .limit(1);

    if (checkError) throw checkError;

    if (memberships && memberships.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete plan with active memberships. Set status to inactive instead.' 
      });
    }

    // Soft delete (set status to inactive)
    const { error: deleteError } = await supabase
      .from('membership_plans')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (deleteError) throw deleteError;

    logger.info('Membership plan deleted', { 
      plan_id: id, 
      deleted_by: req.user.id 
    });

    res.json({
      message: 'Membership plan deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
