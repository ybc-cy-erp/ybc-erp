const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const supabase = require('../config/supabase');
const Joi = require('joi');

// Validation schemas
const billSchema = Joi.object({
  vendor_name: Joi.string().min(2).max(200).required(),
  bill_date: Joi.date().iso().required(), // Service date (accrual)
  due_date: Joi.date().iso().required(),
  amount: Joi.number().min(0.01).required(),
  description: Joi.string().allow('', null),
  category: Joi.string().max(100).allow('', null)
});

const billUpdateSchema = Joi.object({
  vendor_name: Joi.string().min(2).max(200),
  bill_date: Joi.date().iso(),
  due_date: Joi.date().iso(),
  amount: Joi.number().min(0.01),
  description: Joi.string().allow('', null),
  category: Joi.string().max(100).allow('', null)
});

/**
 * Generate unique bill number
 */
async function generateBillNumber(tenantId) {
  const year = new Date().getFullYear();
  const prefix = `BILL-${year}-`;
  
  // Get last bill number for this year
  const { data } = await supabase
    .from('bills')
    .select('bill_number')
    .eq('tenant_id', tenantId)
    .like('bill_number', `${prefix}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (data && data.bill_number) {
    const lastNumber = parseInt(data.bill_number.split('-')[2]);
    return `${prefix}${String(lastNumber + 1).padStart(4, '0')}`;
  }

  return `${prefix}0001`;
}

/**
 * POST /api/bills
 * Create bill
 */
router.post('/', authenticate, authorize(['owner', 'manager']), async (req, res) => {
  try {
    const { error: validationError, value } = billSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    // Validate dates
    if (new Date(value.due_date) < new Date(value.bill_date)) {
      return res.status(400).json({ 
        error: 'Дата оплати не може бути раніше дати рахунку' 
      });
    }

    // Generate bill number
    const billNumber = await generateBillNumber(req.user.tenant_id);

    const billData = {
      ...value,
      tenant_id: req.user.tenant_id,
      bill_number: billNumber,
      status: 'draft',
      created_by: req.user.id
    };

    const { data, error } = await supabase
      .from('bills')
      .insert(billData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Рахунок створено успішно',
      bill: data
    });

  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({ error: 'Помилка створення рахунку' });
  }
});

/**
 * GET /api/bills
 * List bills with filters
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, vendor, from_date, to_date } = req.query;

    let query = supabase
      .from('bills')
      .select('*')
      .eq('tenant_id', req.user.tenant_id)
      .order('bill_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (vendor) {
      query = query.ilike('vendor_name', `%${vendor}%`);
    }

    if (from_date) {
      query = query.gte('bill_date', from_date);
    }

    if (to_date) {
      query = query.lte('bill_date', to_date);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);

  } catch (error) {
    console.error('List bills error:', error);
    res.status(500).json({ error: 'Помилка завантаження рахунків' });
  }
});

/**
 * GET /api/bills/:id
 * Get bill details with payments
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', req.user.tenant_id)
      .single();

    if (billError || !bill) {
      return res.status(404).json({ error: 'Рахунок не знайдено' });
    }

    // Get payments for this bill
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('bill_id', id)
      .eq('tenant_id', req.user.tenant_id)
      .order('payment_date', { ascending: false });

    const totalPaid = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    res.json({
      ...bill,
      payments: payments || [],
      total_paid: totalPaid,
      remaining: parseFloat(bill.amount) - totalPaid
    });

  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({ error: 'Помилка завантаження рахунку' });
  }
});

/**
 * PUT /api/bills/:id
 * Update bill (draft only)
 */
router.put('/:id', authenticate, authorize(['owner', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;

    const { error: validationError, value } = billUpdateSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    // Check existing bill
    const { data: existingBill } = await supabase
      .from('bills')
      .select('status')
      .eq('id', id)
      .eq('tenant_id', req.user.tenant_id)
      .single();

    if (!existingBill) {
      return res.status(404).json({ error: 'Рахунок не знайдено' });
    }

    // Can only edit draft bills
    if (existingBill.status !== 'draft') {
      return res.status(400).json({ 
        error: 'Можна редагувати тільки чернетки рахунків' 
      });
    }

    const { data, error } = await supabase
      .from('bills')
      .update(value)
      .eq('id', id)
      .eq('tenant_id', req.user.tenant_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Рахунок оновлено успішно',
      bill: data
    });

  } catch (error) {
    console.error('Update bill error:', error);
    res.status(500).json({ error: 'Помилка оновлення рахунку' });
  }
});

/**
 * PUT /api/bills/:id/approve
 * Approve bill (draft → approved)
 */
router.put('/:id/approve', authenticate, authorize(['owner', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existingBill } = await supabase
      .from('bills')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', req.user.tenant_id)
      .single();

    if (!existingBill) {
      return res.status(404).json({ error: 'Рахунок не знайдено' });
    }

    if (existingBill.status !== 'draft') {
      return res.status(400).json({ error: 'Можна затвердити тільки чернетки' });
    }

    if (parseFloat(existingBill.amount) <= 0) {
      return res.status(400).json({ error: 'Сума рахунку має бути більше 0' });
    }

    const { data, error } = await supabase
      .from('bills')
      .update({ status: 'approved' })
      .eq('id', id)
      .eq('tenant_id', req.user.tenant_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Рахунок затверджено успішно',
      bill: data
    });

  } catch (error) {
    console.error('Approve bill error:', error);
    res.status(500).json({ error: 'Помилка затвердження рахунку' });
  }
});

/**
 * DELETE /api/bills/:id
 * Delete bill (draft only)
 */
router.delete('/:id', authenticate, authorize(['owner']), async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existingBill } = await supabase
      .from('bills')
      .select('status')
      .eq('id', id)
      .eq('tenant_id', req.user.tenant_id)
      .single();

    if (!existingBill) {
      return res.status(404).json({ error: 'Рахунок не знайдено' });
    }

    // Can only delete draft bills
    if (existingBill.status !== 'draft') {
      return res.status(400).json({ 
        error: 'Можна видалити тільки чернетки рахунків' 
      });
    }

    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', id)
      .eq('tenant_id', req.user.tenant_id);

    if (error) throw error;

    res.json({ message: 'Рахунок видалено успішно' });

  } catch (error) {
    console.error('Delete bill error:', error);
    res.status(500).json({ error: 'Помилка видалення рахунку' });
  }
});

module.exports = router;
