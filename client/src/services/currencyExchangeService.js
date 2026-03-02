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

const currencyExchangeService = {
  async getAll(params = {}) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    let query = supabase
      .from('currency_exchanges')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('exchange_date', { ascending: false });

    if (params?.status) query = query.eq('status', params.status);

    const { data, error } = await query;
    if (error) throw normError(error, 'Не вдалося завантажити обміни');

    return data || [];
  },

  async getById(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('currency_exchanges')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw normError(error, 'Обмін не знайдено');
    return data;
  },

  async create(payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const row = {
      tenant_id: tenantId,
      from_currency: payload.from_currency,
      to_currency: payload.to_currency,
      from_amount: Number(payload.from_amount),
      to_amount: Number(payload.to_amount),
      exchange_rate: Number(payload.exchange_rate),
      exchange_date: payload.exchange_date || new Date().toISOString(),
      notes: payload.notes || null,
      status: 'completed',
    };

    const { data, error } = await supabase
      .from('currency_exchanges')
      .insert(row)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка створення обміну');
    return { data: { exchange: data } };
  },

  async cancel(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('currency_exchanges')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка скасування обміну');
    return { data: { exchange: data } };
  },
};

export default currencyExchangeService;
