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

function mapMembership(row) {
  if (!row) return row;
  return {
    ...row,
    customer_name: row.client_name || '—',
    counterparty_id: row.counterparty_id || null,
    amount: Number(row.payment_amount || 0),
  };
}

const membershipService = {
  async getAll(params = {}) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    let query = supabase
      .from('memberships')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (params?.status) query = query.eq('status', params.status);
    if (params?.plan_id) query = query.eq('plan_id', params.plan_id);

    const { data, error } = await query;
    if (error) throw normError(error, 'Не вдалося завантажити членства');

    return (data || []).map((row) => mapMembership(row));
  },

  async getById(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw normError(error, 'Членство не знайдено');
    return mapMembership(data);
  },

  async getRevenue(id) {
    // temporary simple revenue payload
    const m = await this.getById(id);
    return {
      membership_id: m.id,
      daily_rate: m.end_date && m.start_date
        ? Number(m.amount || 0) / Math.max(1, Math.ceil((new Date(m.end_date) - new Date(m.start_date)) / 86400000))
        : 0,
      recognized_revenue: 0,
      deferred_revenue: Number(m.amount || 0),
    };
  },

  async create(payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const start = new Date(payload.start_date);
    let endDate = null;

    if (payload.plan_id) {
      const { data: plan } = await supabase
        .from('membership_plans')
        .select('type,duration_days,daily_rate')
        .eq('id', payload.plan_id)
        .eq('tenant_id', tenantId)
        .single();

      if (plan && plan.type !== 'lifetime' && plan.duration_days) {
        endDate = new Date(start);
        endDate.setDate(endDate.getDate() + Number(plan.duration_days));
      }
    }

    const row = {
      tenant_id: tenantId,
      plan_id: payload.plan_id,
      counterparty_id: payload.counterparty_id || null,
      client_name: payload.customer_name || null,
      start_date: payload.start_date,
      end_date: endDate ? endDate.toISOString().slice(0, 10) : null,
      payment_amount: Number(payload.amount || 0),
      payment_currency: 'EUR',
      status: 'active',
    };

    const { data, error } = await supabase
      .from('memberships')
      .insert(row)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка створення членства');
    return { data: { membership: mapMembership(data) } };
  },

  async update(id, payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const updateData = {
      counterparty_id: payload.counterparty_id || null,
      client_name: payload.customer_name || null,
      start_date: payload.start_date,
      payment_amount: Number(payload.amount || 0),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('memberships')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка оновлення членства');
    return { data: { membership: mapMembership(data) } };
  },

  async cancel(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('memberships')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка скасування');
    return { data: { membership: mapMembership(data) } };
  },

  async createFreeze(membershipId, payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const start = new Date(payload.start_date);
    const end = new Date(payload.end_date);
    const days = Math.max(1, Math.ceil((end - start) / 86400000));

    const { data, error } = await supabase
      .from('membership_freeze')
      .insert({
        tenant_id: tenantId,
        membership_id: membershipId,
        start_date: payload.start_date,
        end_date: payload.end_date,
        reason: payload.reason || null,
      })
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка створення заморозки');

    // extend membership end_date and set frozen status
    const { data: m } = await supabase
      .from('memberships')
      .select('end_date')
      .eq('id', membershipId)
      .eq('tenant_id', tenantId)
      .single();

    if (m?.end_date) {
      const cur = new Date(m.end_date);
      cur.setDate(cur.getDate() + days);
      await supabase
        .from('memberships')
        .update({ end_date: cur.toISOString().slice(0, 10), status: 'frozen', updated_at: new Date().toISOString() })
        .eq('id', membershipId)
        .eq('tenant_id', tenantId);
    }

    return { data: { freeze: { ...data, duration_days: days } } };
  },

  async getFreezes(membershipId) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('membership_freeze')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('membership_id', membershipId)
      .order('start_date', { ascending: false });

    if (error) throw normError(error, 'Помилка завантаження заморозок');

    return (data || []).map((f) => {
      const days = Math.max(1, Math.ceil((new Date(f.end_date) - new Date(f.start_date)) / 86400000));
      return { ...f, duration_days: days };
    });
  },

  async removeFreeze(membershipId, freezeId) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { error } = await supabase
      .from('membership_freeze')
      .delete()
      .eq('id', freezeId)
      .eq('membership_id', membershipId)
      .eq('tenant_id', tenantId);

    if (error) throw normError(error, 'Помилка видалення заморозки');
    return { data: { success: true } };
  },
};

export default membershipService;
