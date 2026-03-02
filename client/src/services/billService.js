import { supabase } from './supabase';

function getTenantId() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.tenant_id || null;
  } catch {
    return null;
  }
}

function normError(error, fallback = 'Помилка запиту') {
  const msg = error?.message || fallback;
  return { response: { data: { error: msg } }, message: msg };
}

const billService = {
  async getAll(params = {}) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    let query = supabase
      .from('bills')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('bill_date', { ascending: false });

    if (params?.status) query = query.eq('status', params.status);
    if (params?.bill_type) query = query.eq('bill_type', params.bill_type);

    const { data, error } = await query;
    if (error) throw normError(error, 'Не вдалося завантажити рахунки');

    return data || [];
  },

  async getById(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw normError(error, 'Рахунок не знайдено');
    return data;
  },

  async create(payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const row = {
      tenant_id: tenantId,
      bill_number: payload.bill_number || null,
      bill_date: payload.bill_date,
      due_date: payload.due_date || null,
      bill_type: payload.bill_type || 'expense',
      vendor: payload.vendor || null,
      description: payload.description || null,
      amount: Number(payload.amount || 0),
      currency: payload.currency || 'EUR',
      status: 'draft',
    };

    const { data, error } = await supabase
      .from('bills')
      .insert(row)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка створення рахунку');
    return { data: { bill: data } };
  },

  async update(id, payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    // check current status
    const { data: current } = await supabase
      .from('bills')
      .select('status')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (current?.status !== 'draft') {
      throw normError(null, 'Можна редагувати тільки чернетки');
    }

    const updateData = {
      bill_number: payload.bill_number || null,
      bill_date: payload.bill_date,
      due_date: payload.due_date || null,
      bill_type: payload.bill_type || 'expense',
      vendor: payload.vendor || null,
      description: payload.description || null,
      amount: Number(payload.amount || 0),
      currency: payload.currency || 'EUR',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('bills')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка оновлення рахунку');
    return { data: { bill: data } };
  },

  async approve(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('bills')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка затвердження рахунку');
    return { data: { bill: data } };
  },

  async delete(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    // check draft status
    const { data: current } = await supabase
      .from('bills')
      .select('status')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (current?.status !== 'draft') {
      throw normError(null, 'Можна видалити тільки чернетки');
    }

    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw normError(error, 'Помилка видалення рахунку');
    return { data: { success: true } };
  },

  async pay(billId, paymentData) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const row = {
      tenant_id: tenantId,
      bill_id: billId,
      payment_date: paymentData.payment_date,
      amount: Number(paymentData.amount || 0),
      currency: paymentData.currency || 'EUR',
      payment_method: paymentData.payment_method || 'bank_transfer',
      notes: paymentData.notes || null,
    };

    const { data, error } = await supabase
      .from('payments')
      .insert(row)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка створення платежу');

    // check if bill fully paid
    const { data: allPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('bill_id', billId)
      .eq('tenant_id', tenantId);

    const { data: bill } = await supabase
      .from('bills')
      .select('amount')
      .eq('id', billId)
      .eq('tenant_id', tenantId)
      .single();

    if (bill && allPayments) {
      const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      if (totalPaid >= Number(bill.amount)) {
        await supabase
          .from('bills')
          .update({ status: 'paid', updated_at: new Date().toISOString() })
          .eq('id', billId)
          .eq('tenant_id', tenantId);
      }
    }

    return { data: { payment: data } };
  },

  async getPayments(billId) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('bill_id', billId)
      .eq('tenant_id', tenantId)
      .order('payment_date', { ascending: false });

    if (error) throw normError(error, 'Помилка завантаження платежів');
    return data || [];
  },
};

export default billService;
