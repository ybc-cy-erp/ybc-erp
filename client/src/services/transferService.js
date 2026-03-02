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

const transferService = {
  async getAll(params = {}) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    let query = supabase
      .from('cash_transfers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('transfer_date', { ascending: false });

    if (params?.status) query = query.eq('status', params.status);

    const { data, error } = await query;
    if (error) throw normError(error, 'Не вдалося завантажити перекази');

    return data || [];
  },

  async getById(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('cash_transfers')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw normError(error, 'Переказ не знайдено');
    return data;
  },

  async create(payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const row = {
      tenant_id: tenantId,
      from_account: payload.from_account,
      to_account: payload.to_account,
      amount: Number(payload.amount),
      currency: payload.currency || 'EUR',
      transfer_date: payload.transfer_date || new Date().toISOString(),
      reference: payload.reference || null,
      notes: payload.notes || null,
      status: 'completed',
    };

    const { data, error } = await supabase
      .from('cash_transfers')
      .insert(row)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка створення переказу');
    return { data: { transfer: data } };
  },

  async cancel(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('cash_transfers')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка скасування переказу');
    return { data: { transfer: data } };
  },
};

export default transferService;
