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

const itemService = {
  // Folders
  async getFolders() {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('item_folders')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true });

    if (error) throw normError(error, 'Не вдалося завантажити папки');
    return data || [];
  },

  async createFolder(payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const row = {
      tenant_id: tenantId,
      parent_id: payload.parent_id || null,
      name: payload.name,
      color: payload.color || null,
      icon: payload.icon || null,
    };

    const { data, error } = await supabase
      .from('item_folders')
      .insert(row)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка створення папки');
    return data;
  },

  async deleteFolder(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { error } = await supabase
      .from('item_folders')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw normError(error, 'Помилка видалення папки');
    return { success: true };
  },

  // Items
  async getAll(params = {}) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    let query = supabase
      .from('items')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true });

    if (params?.folder_id) {
      query = query.eq('folder_id', params.folder_id);
    }

    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,code.ilike.%${params.search}%`);
    }

    if (params?.item_type) {
      query = query.eq('item_type', params.item_type);
    }

    const { data, error } = await query;
    if (error) throw normError(error, 'Не вдалося завантажити товари/послуги');

    return data || [];
  },

  async getById(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw normError(error, 'Товар/послугу не знайдено');
    return data;
  },

  async create(payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null;

    const row = {
      tenant_id: tenantId,
      folder_id: payload.folder_id || null,
      code: payload.code || null,
      name: payload.name,
      description: payload.description || null,
      unit: payload.unit || 'шт',
      price_default: payload.price_default ? Number(payload.price_default) : null,
      currency: payload.currency || 'EUR',
      item_type: payload.item_type || 'product',
      tags: payload.tags || [],
      custom_fields: payload.custom_fields || {},
      created_by: userId,
    };

    const { data, error } = await supabase
      .from('items')
      .insert(row)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка створення товару/послуги');
    return data;
  },

  async update(id, payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const updateData = {
      folder_id: payload.folder_id || null,
      code: payload.code || null,
      name: payload.name,
      description: payload.description || null,
      unit: payload.unit || 'шт',
      price_default: payload.price_default ? Number(payload.price_default) : null,
      currency: payload.currency || 'EUR',
      item_type: payload.item_type || 'product',
      tags: payload.tags || [],
      custom_fields: payload.custom_fields || {},
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('items')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка оновлення товару/послуги');
    return data;
  },

  async delete(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw normError(error, 'Помилка видалення товару/послуги');
    return { success: true };
  },
};

export default itemService;
