const bcrypt = require('bcrypt');
const Joi = require('joi');
const supabase = require('../config/database');
const logger = require('../utils/logger');

// Validation schemas
const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(255).required(),
  role: Joi.string().valid('Owner', 'Accountant', 'Manager', 'Event Manager', 'Cashier', 'Analyst').required()
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  role: Joi.string().valid('Owner', 'Accountant', 'Manager', 'Event Manager', 'Cashier', 'Analyst'),
  status: Joi.string().valid('active', 'inactive'),
  password: Joi.string().min(8)
}).min(1);

/**
 * Create new user in tenant (Owner only)
 * POST /api/users
 */
exports.createUser = async (req, res, next) => {
  try {
    const { tenant_id } = req.user;

    // Validate input
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, name, role } = value;

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error: createError } = await supabase
      .from('users')
      .insert({
        tenant_id,
        email,
        password_hash,
        name,
        role,
        status: 'active'
      })
      .select('id, tenant_id, email, name, role, status, created_at')
      .single();

    if (createError) throw createError;

    logger.info('User created', { user_id: user.id, created_by: req.user.id });

    res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users in tenant
 * GET /api/users
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { tenant_id } = req.user;

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role, status, created_at, updated_at')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single user
 * GET /api/users/:id
 */
exports.getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.user;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, tenant_id, email, name, role, status, created_at, updated_at')
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * PUT /api/users/:id
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenant_id, role: currentUserRole } = req.user;

    // Only Owner can update users
    if (currentUserRole !== 'Owner') {
      return res.status(403).json({ error: 'Only Owner can update users' });
    }

    // Validate input
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check user exists in same tenant
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .single();

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If password is being updated, hash it
    const updateData = { ...value };
    if (value.password) {
      updateData.password_hash = await bcrypt.hash(value.password, 10);
      delete updateData.password;
    }

    // Update user
    const { data: user, error: updateError } = await supabase
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, email, name, role, status, updated_at')
      .single();

    if (updateError) throw updateError;

    logger.info('User updated', { user_id: id, updated_by: req.user.id });

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (soft delete - set status to inactive)
 * DELETE /api/users/:id
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenant_id, role: currentUserRole, id: currentUserId } = req.user;

    // Only Owner can delete users
    if (currentUserRole !== 'Owner') {
      return res.status(403).json({ error: 'Only Owner can delete users' });
    }

    // Can't delete yourself
    if (id === currentUserId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check user exists in same tenant
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .single();

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Soft delete (set status to inactive)
    const { error: deleteError } = await supabase
      .from('users')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (deleteError) throw deleteError;

    logger.info('User deleted', { user_id: id, deleted_by: currentUserId });

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
