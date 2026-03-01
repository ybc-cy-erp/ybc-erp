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

function normalizeError(error, fallback = 'Помилка запиту') {
  const msg = error?.message || fallback;
  return { response: { data: { error: msg } }, message: msg };
}

const membershipPlanService = {
  async getAll(status) {
    const tenantId = getTenantId();
    if (!tenantId) throw normalizeError(null, 'Tenant не визначено');

    let query = supabase
      .from('membership_plans')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw normalizeError(error, 'Не вдалося завантажити плани');

    return { data: { plans: data || [] } };
  },

  async getById(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normalizeError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw normalizeError(error, 'План не знайдено');
    return data;
  },

  async create(payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normalizeError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('membership_plans')
      .insert({ ...payload, tenant_id: tenantId })
      .select('*')
      .single();

    if (error) throw normalizeError(error, 'Помилка збереження');
    return { data: { plan: data } };
  },

  async update(id, payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normalizeError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('membership_plans')
      .update(payload)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normalizeError(error, 'Помилка оновлення');
    return { data: { plan: data } };
  },

  async delete(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normalizeError(null, 'Tenant не визначено');

    // soft delete
    const { error } = await supabase
      .from('membership_plans')
      .update({ status: 'inactive' })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw normalizeError(error, 'Помилка видалення');
    return { data: { success: true } };
  },
};

export default membershipPlanService;
