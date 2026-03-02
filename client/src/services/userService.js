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

const userService = {
  async getAll() {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw normError(error, 'Не вдалося завантажити користувачів');
    return data || [];
  },

  async getById(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw normError(error, 'Користувача не знайдено');
    return data;
  },

  async update(id, payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const updateData = {
      name: payload.name,
      role: payload.role,
      status: payload.status,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка оновлення користувача');
    return { data: { user: data } };
  },

  async invite(email, name, role) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    // Call Supabase Auth to invite user
    const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        name,
        tenant_id: tenantId,
        role,
      },
    });

    if (authError) throw normError(authError, 'Помилка запрошення користувача');

    return { data: { user: authData.user } };
  },
};

export default userService;
