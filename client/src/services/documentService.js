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

function normError(error, fallback = 'Ошибка запроса') {
  const msg = error?.message || fallback;
  return { response: { data: { error: msg } }, message: msg };
}

const documentService = {
  async getAll(params = {}) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не определен');

    let query = supabase
      .from('document_journal')
      .select('*, counterparties(name)')
      .eq('tenant_id', tenantId)
      .order('doc_date', { ascending: false });

    if (params?.doc_type) query = query.eq('doc_type', params.doc_type);
    if (params?.status) query = query.eq('status', params.status);
    if (params?.search) {
      query = query.or(`doc_number.ilike.%${params.search}%,notes.ilike.%${params.search}%`);
    }

    const { data, error } = await query;
    if (error) throw normError(error, 'Не удалось загрузить документы');

    return data || [];
  },

  async getById(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не определен');

    const { data, error } = await supabase
      .from('document_journal')
      .select('*, counterparties(name)')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw normError(error, 'Документ не найден');
    return data;
  },

  async create(payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не определен');

    const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null;

    // Генерация номера документа
    const { data: numberData } = await supabase.rpc('generate_doc_number', {
      p_tenant_id: tenantId,
      p_doc_type: payload.doc_type,
      p_doc_date: payload.doc_date,
    });

    const row = {
      tenant_id: tenantId,
      doc_type: payload.doc_type,
      doc_number: numberData || `${payload.doc_type}-TEMP-${Date.now()}`,
      doc_date: payload.doc_date,
      counterparty_id: payload.counterparty_id || null,
      amount: Number(payload.amount || 0),
      currency: payload.currency || 'EUR',
      status: 'draft',
      notes: payload.notes || null,
      tags: payload.tags || [],
      created_by: userId,
    };

    const { data, error } = await supabase
      .from('document_journal')
      .insert(row)
      .select('*')
      .single();

    if (error) throw normError(error, 'Ошибка создания документа');
    return data;
  },

  async update(id, payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не определен');

    const updateData = {
      counterparty_id: payload.counterparty_id || null,
      amount: Number(payload.amount || 0),
      currency: payload.currency || 'EUR',
      notes: payload.notes || null,
      tags: payload.tags || [],
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('document_journal')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normError(error, 'Ошибка обновления документа');
    return data;
  },

  async post(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не определен');

    const { data, error } = await supabase
      .from('document_journal')
      .update({ status: 'posted', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normError(error, 'Ошибка проведения документа');
    return data;
  },

  async cancel(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не определен');

    const { data, error } = await supabase
      .from('document_journal')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normError(error, 'Ошибка отмены документа');
    return data;
  },

  async delete(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не определен');

    const { error } = await supabase
      .from('document_journal')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw normError(error, 'Ошибка удаления документа');
    return { success: true };
  },

  async getEntries(documentId) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не определен');

    const { data, error } = await supabase
      .from('journal_entries')
      .select(`
        *,
        debit_acc:debit_account(code, name),
        credit_acc:credit_account(code, name)
      `)
      .eq('document_id', documentId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true });

    if (error) throw normError(error, 'Ошибка загрузки проводок');
    return data || [];
  },
};

export default documentService;
