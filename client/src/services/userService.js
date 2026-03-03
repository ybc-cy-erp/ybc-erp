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

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';

    // Create auth user
    const { data: authUser, error: signUpError } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: {
          name,
          tenant_id: tenantId,
          role,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (signUpError) throw normError(signUpError, 'Помилка створення користувача');

    // Create user record in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        tenant_id: tenantId,
        email,
        name,
        role,
        status: 'active',
      })
      .select('*')
      .single();

    if (userError) {
      // Rollback: delete auth user if users table insert fails
      console.error('Failed to create user record, rollback needed:', userError);
      throw normError(userError, 'Помилка створення запису користувача');
    }

    return { 
      data: { 
        user: userData,
        tempPassword,
      } 
    };
  },
};

export default userService;
