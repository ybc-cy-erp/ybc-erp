const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const supabase = require('../config/supabase');
const Joi = require('joi');

// Validation schemas
const paymentSchema = Joi.object({
  bill_id: Joi.string().uuid().allow(null), // Nullable for unmatched payments
  payment_date: Joi.date().iso().required(),
  amount: Joi.number().min(0.01).required(),
  payment_method: Joi.string().valid('cash', 'bank_transfer', 'crypto').required(),
  wallet_id: Joi.string().uuid().allow(null),
  notes: Joi.string().max(500).allow('', null)
});

/**
 * POST /api/payments
 * Record payment
 */
router.post('/', authenticate, authorize(['owner', 'manager', 'cashier']), async (req, res) => {
  try {
    const { error: validationError, value } = paymentSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    // If bill_id provided, verify it exists and validate amount
    if (value.bill_id) {
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .select('id, amount, status')
        .eq('id', value.bill_id)
        .eq('tenant_id', req.user.tenant_id)
        .single();

      if (billError || !bill) {
        return res.status(404).json({ error: 'Рахунок не знайдено' });
      }

      if (bill.status === 'draft') {
        return res.status(400).json({ 
          error: 'Неможливо оплатити чернетку рахунку. Спочатку затвердіть його.' 
        });
      }

      // Get existing payments
      const { data: existingPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('bill_id', value.bill_id)
        .eq('tenant_id', req.user.tenant_id);

      const totalPaid = existingPayments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
      const remaining = parseFloat(bill.amount) - totalPaid;

      if (value.amount > remaining) {
        return res.status(400).json({ 
          error: `Сума платежу перевищує залишок. Залишок: €${remaining.toFixed(2)}` 
        });
      }
    }

    // If wallet_id provided, verify it exists
    if (value.wallet_id) {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('id', value.wallet_id)
        .eq('tenant_id', req.user.tenant_id)
        .single();

      if (!wallet) {
        return res.status(404).json({ error: 'Гаманець не знайдено' });
      }
    }

    const paymentData = {
      ...value,
      tenant_id: req.user.tenant_id
    };

    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) throw error;

    // Note: Bill status will be auto-updated to 'paid' by database trigger if fully paid

    res.status(201).json({
      message: 'Платіж записано успішно',
      payment: data
    });

  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Помилка запису платежу' });
  }
});

/**
 * GET /api/payments
 * List payments
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { bill_id, from_date, to_date, payment_method } = req.query;

    let query = supabase
      .from('payments')
      .select(`
        *,
        bills(bill_number, vendor_name, amount),
        wallets(name, currency)
      `)
      .eq('tenant_id', req.user.tenant_id)
      .order('payment_date', { ascending: false });

    if (bill_id) {
      query = query.eq('bill_id', bill_id);
    }

    if (from_date) {
      query = query.gte('payment_date', from_date);
    }

    if (to_date) {
      query = query.lte('payment_date', to_date);
    }

    if (payment_method) {
      query = query.eq('payment_method', payment_method);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);

  } catch (error) {
    console.error('List payments error:', error);
    res.status(500).json({ error: 'Помилка завантаження платежів' });
  }
});

/**
 * GET /api/payments/:id
 * Get payment details
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        bills(bill_number, vendor_name, amount, status),
        wallets(name, currency)
      `)
      .eq('id', id)
      .eq('tenant_id', req.user.tenant_id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Платіж не знайдено' });
    }

    res.json(data);

  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Помилка завантаження платежу' });
  }
});

/**
 * POST /api/bills/:billId/pay
 * Convenient endpoint to pay a bill directly
 */
router.post('/bills/:billId/pay', authenticate, authorize(['owner', 'manager', 'cashier']), async (req, res) => {
  try {
    const { billId } = req.params;
    const { error: validationError, value } = paymentSchema.validate({
      ...req.body,
      bill_id: billId
    });
    
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    // Get bill details
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select('*')
      .eq('id', billId)
      .eq('tenant_id', req.user.tenant_id)
      .single();

    if (billError || !bill) {
      return res.status(404).json({ error: 'Рахунок не знайдено' });
    }

    if (bill.status === 'draft') {
      return res.status(400).json({ 
        error: 'Спочатку затвердіть рахунок' 
      });
    }

    // Get existing payments
    const { data: existingPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('bill_id', billId)
      .eq('tenant_id', req.user.tenant_id);

    const totalPaid = existingPayments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
    const remaining = parseFloat(bill.amount) - totalPaid;

    if (remaining <= 0) {
      return res.status(400).json({ error: 'Рахунок вже сплачено повністю' });
    }

    if (value.amount > remaining) {
      return res.status(400).json({ 
        error: `Сума платежу перевищує залишок. Залишок: €${remaining.toFixed(2)}` 
      });
    }

    const paymentData = {
      ...value,
      bill_id: billId,
      tenant_id: req.user.tenant_id
    };

    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Платіж записано успішно',
      payment: data,
      remaining: remaining - parseFloat(value.amount)
    });

  } catch (error) {
    console.error('Pay bill error:', error);
    res.status(500).json({ error: 'Помилка оплати рахунку' });
  }
});

/**
 * DELETE /api/payments/:id
 * Delete payment (Owner only, careful!)
 */
router.delete('/:id', authenticate, authorize(['owner']), async (req, res) => {
  try {
    const { id } = req.params;

    const { data: payment } = await supabase
      .from('payments')
      .select('id, bill_id')
      .eq('id', id)
      .eq('tenant_id', req.user.tenant_id)
      .single();

    if (!payment) {
      return res.status(404).json({ error: 'Платіж не знайдено' });
    }

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)
      .eq('tenant_id', req.user.tenant_id);

    if (error) throw error;

    // Note: Bill status might revert from 'paid' to 'approved' if total payments < bill amount

    res.json({ message: 'Платіж видалено успішно' });

  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ error: 'Помилка видалення платежу' });
  }
});

module.exports = router;
