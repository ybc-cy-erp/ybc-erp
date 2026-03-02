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

const counterpartyService = {
  // Folders
  async getFolders() {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('counterparty_folders')
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
      .from('counterparty_folders')
      .insert(row)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка створення папки');
    return data;
  },

  async updateFolder(id, payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('counterparty_folders')
      .update({
        name: payload.name,
        color: payload.color || null,
        icon: payload.icon || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка оновлення папки');
    return data;
  },

  async deleteFolder(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { error } = await supabase
      .from('counterparty_folders')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw normError(error, 'Помилка видалення папки');
    return { success: true };
  },

  // Counterparties
  async getAll(params = {}) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    let query = supabase
      .from('counterparties')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true });

    if (params?.folder_id) {
      query = query.eq('folder_id', params.folder_id);
    }

    if (params?.search) {
      query = query.ilike('name', `%${params.search}%`);
    }

    if (params?.tags && params.tags.length > 0) {
      query = query.contains('tags', params.tags);
    }

    const { data, error } = await query;
    if (error) throw normError(error, 'Не вдалося завантажити контрагентів');

    return data || [];
  },

  async getById(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('counterparties')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw normError(error, 'Контрагента не знайдено');
    return data;
  },

  async create(payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null;

    const row = {
      tenant_id: tenantId,
      folder_id: payload.folder_id || null,
      name: payload.name,
      full_name: payload.full_name || null,
      tax_id: payload.tax_id || null,
      contact_person: payload.contact_person || null,
      email: payload.email || null,
      phone: payload.phone || null,
      address: payload.address || null,
      notes: payload.notes || null,
      tags: payload.tags || [],
      custom_fields: payload.custom_fields || {},
      created_by: userId,
    };

    const { data, error } = await supabase
      .from('counterparties')
      .insert(row)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка створення контрагента');
    return data;
  },

  async update(id, payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const updateData = {
      folder_id: payload.folder_id || null,
      name: payload.name,
      full_name: payload.full_name || null,
      tax_id: payload.tax_id || null,
      contact_person: payload.contact_person || null,
      email: payload.email || null,
      phone: payload.phone || null,
      address: payload.address || null,
      notes: payload.notes || null,
      tags: payload.tags || [],
      custom_fields: payload.custom_fields || {},
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('counterparties')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка оновлення контрагента');
    return data;
  },

  async delete(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { error } = await supabase
      .from('counterparties')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw normError(error, 'Помилка видалення контрагента');
    return { success: true };
  },

  async moveToFolder(counterpartyId, folderId) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('counterparties')
      .update({ folder_id: folderId, updated_at: new Date().toISOString() })
      .eq('id', counterpartyId)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка переміщення');
    return data;
  },
};

export default counterpartyService;
