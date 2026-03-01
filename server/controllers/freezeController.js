const Joi = require('joi');
const supabase = require('../config/database');
const logger = require('../utils/logger');

// Validation schema
const createFreezeSchema = Joi.object({
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
  reason: Joi.string().max(500).allow(null, '')
});

/**
 * Create freeze period for membership
 * POST /api/memberships/:membership_id/freeze
 */
exports.createFreeze = async (req, res, next) => {
  try {
    const { membership_id } = req.params;
    const { tenant_id } = req.user;

    // Validate input
    const { error, value } = createFreezeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Get membership
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('id, start_date, end_date, status')
      .eq('id', membership_id)
      .eq('tenant_id', tenant_id)
      .single();

    if (membershipError || !membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    // Check membership is active or frozen
    if (!['active', 'frozen'].includes(membership.status)) {
      return res.status(400).json({ 
        error: 'Can only freeze active or already frozen memberships' 
      });
    }

    // Validate freeze dates are within membership period
    const freezeStart = new Date(value.start_date);
    const freezeEnd = new Date(value.end_date);
    const membershipStart = new Date(membership.start_date);
    const membershipEnd = membership.end_date ? new Date(membership.end_date) : null;

    if (freezeStart < membershipStart) {
      return res.status(400).json({ 
        error: 'Freeze period cannot start before membership start date' 
      });
    }

    if (membershipEnd && freezeEnd > membershipEnd) {
      return res.status(400).json({ 
        error: 'Freeze period cannot end after membership end date' 
      });
    }

    // Check for overlapping freeze periods
    const { data: existingFreezes, error: freezeCheckError } = await supabase
      .from('membership_freeze')
      .select('start_date, end_date')
      .eq('membership_id', membership_id);

    if (freezeCheckError) throw freezeCheckError;

    const hasOverlap = existingFreezes.some(freeze => {
      const existingStart = new Date(freeze.start_date);
      const existingEnd = new Date(freeze.end_date);
      
      // Check if new freeze overlaps with existing
      return (
        (freezeStart >= existingStart && freezeStart <= existingEnd) ||
        (freezeEnd >= existingStart && freezeEnd <= existingEnd) ||
        (freezeStart <= existingStart && freezeEnd >= existingEnd)
      );
    });

    if (hasOverlap) {
      return res.status(400).json({ 
        error: 'Freeze period overlaps with existing freeze' 
      });
    }

    // Create freeze period
    const { data: freeze, error: createError } = await supabase
      .from('membership_freeze')
      .insert({
        tenant_id,
        membership_id,
        start_date: value.start_date,
        end_date: value.end_date,
        reason: value.reason
      })
      .select()
      .single();

    if (createError) throw createError;

    // Calculate freeze duration in days
    const freezeDays = Math.ceil((freezeEnd - freezeStart) / (1000 * 60 * 60 * 24));

    // Extend membership end_date by freeze duration (if not lifetime)
    if (membershipEnd) {
      const newEndDate = new Date(membershipEnd);
      newEndDate.setDate(newEndDate.getDate() + freezeDays);

      await supabase
        .from('memberships')
        .update({
          end_date: newEndDate.toISOString().split('T')[0],
          status: 'frozen',
          updated_at: new Date().toISOString()
        })
        .eq('id', membership_id);
    } else {
      // Just update status for lifetime memberships
      await supabase
        .from('memberships')
        .update({
          status: 'frozen',
          updated_at: new Date().toISOString()
        })
        .eq('id', membership_id);
    }

    logger.info('Freeze period created', { 
      freeze_id: freeze.id, 
      membership_id,
      duration_days: freezeDays,
      created_by: req.user.id 
    });

    res.status(201).json({
      message: 'Freeze period created successfully',
      freeze,
      membership_extended_by_days: membershipEnd ? freezeDays : 0
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all freeze periods for membership
 * GET /api/memberships/:membership_id/freeze
 */
exports.getFreezes = async (req, res, next) => {
  try {
    const { membership_id } = req.params;
    const { tenant_id } = req.user;

    // Verify membership exists and belongs to tenant
    const { data: membership } = await supabase
      .from('memberships')
      .select('id')
      .eq('id', membership_id)
      .eq('tenant_id', tenant_id)
      .single();

    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    // Get freeze periods
    const { data: freezes, error } = await supabase
      .from('membership_freeze')
      .select('*')
      .eq('membership_id', membership_id)
      .order('start_date', { ascending: false });

    if (error) throw error;

    res.json({
      count: freezes.length,
      freezes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove freeze period
 * DELETE /api/membership-freeze/:freeze_id
 */
exports.removeFreeze = async (req, res, next) => {
  try {
    const { freeze_id } = req.params;
    const { tenant_id } = req.user;

    // Get freeze period
    const { data: freeze, error: freezeError } = await supabase
      .from('membership_freeze')
      .select('*, memberships!inner(id, end_date, tenant_id)')
      .eq('id', freeze_id)
      .single();

    if (freezeError || !freeze) {
      return res.status(404).json({ error: 'Freeze period not found' });
    }

    // Verify tenant ownership
    if (freeze.memberships.tenant_id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate freeze duration
    const freezeStart = new Date(freeze.start_date);
    const freezeEnd = new Date(freeze.end_date);
    const freezeDays = Math.ceil((freezeEnd - freezeStart) / (1000 * 60 * 60 * 24));

    // Remove freeze period
    const { error: deleteError } = await supabase
      .from('membership_freeze')
      .delete()
      .eq('id', freeze_id);

    if (deleteError) throw deleteError;

    // Reduce membership end_date by freeze duration (if not lifetime)
    const membershipEndDate = freeze.memberships.end_date;
    if (membershipEndDate) {
      const newEndDate = new Date(membershipEndDate);
      newEndDate.setDate(newEndDate.getDate() - freezeDays);

      await supabase
        .from('memberships')
        .update({
          end_date: newEndDate.toISOString().split('T')[0],
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', freeze.membership_id);
    } else {
      // Just update status for lifetime memberships
      await supabase
        .from('memberships')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', freeze.membership_id);
    }

    logger.info('Freeze period removed', { 
      freeze_id, 
      membership_id: freeze.membership_id,
      removed_by: req.user.id 
    });

    res.json({
      message: 'Freeze period removed successfully',
      membership_reduced_by_days: membershipEndDate ? freezeDays : 0
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
