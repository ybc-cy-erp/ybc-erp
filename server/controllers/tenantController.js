const Joi = require('joi');
const supabase = require('../config/database');
const logger = require('../utils/logger');

// Validation schemas
const updateTenantSchema = Joi.object({
  name: Joi.string().min(3).max(255),
  status: Joi.string().valid('active', 'suspended', 'inactive'),
  settings: Joi.object()
}).min(1);

/**
 * Get all tenants (Owner only)
 * GET /api/tenants
 */
exports.getAllTenants = async (req, res, next) => {
  try {
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      count: tenants.length,
      tenants
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single tenant
 * GET /api/tenants/:id
 */
exports.getTenant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenant_id, role } = req.user;

    // Users can only view their own tenant (unless Owner viewing all)
    if (role !== 'Owner' && id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(tenant);
  } catch (error) {
    next(error);
  }
};

/**
 * Update tenant
 * PUT /api/tenants/:id
 */
exports.updateTenant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenant_id, role } = req.user;

    // Only Owner can update tenant
    if (role !== 'Owner') {
      return res.status(403).json({ error: 'Only Owner can update tenant' });
    }

    // Owner can only update their own tenant
    if (id !== tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate input
    const { error, value } = updateTenantSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Update tenant
    const { data: tenant, error: updateError } = await supabase
      .from('tenants')
      .update({
        ...value,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    logger.info('Tenant updated', { tenant_id: id, user_id: req.user.id });

    res.json({
      message: 'Tenant updated successfully',
      tenant
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's tenant
 * GET /api/tenants/me
 */
exports.getMyTenant = async (req, res, next) => {
  try {
    const { tenant_id } = req.user;

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenant_id)
      .single();

    if (error || !tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(tenant);
  } catch (error) {
    next(error);
  }
};
