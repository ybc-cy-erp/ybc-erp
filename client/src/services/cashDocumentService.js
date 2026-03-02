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

const cashDocumentService = {
  async getAll(params = {}) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    let query = supabase
      .from('cash_documents')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('doc_date', { ascending: false });

    if (params?.doc_type) query = query.eq('doc_type', params.doc_type);

    const { data, error } = await query;
    if (error) throw normError(error, 'Не вдалося завантажити документи');

    return data || [];
  },

  async getById(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('cash_documents')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw normError(error, 'Документ не знайдено');
    return data;
  },

  async create(payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const row = {
      tenant_id: tenantId,
      doc_type: payload.doc_type,
      counterparty_id: payload.counterparty_id || null,
      doc_date: payload.doc_date,
      amount: Number(payload.amount),
      currency: payload.currency || 'EUR',
      purpose: payload.purpose || null,
      status: 'draft',
    };

    const { data, error } = await supabase
      .from('cash_documents')
      .insert(row)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка створення документу');
    return { data };
  },

  async post(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('cash_documents')
      .update({ status: 'posted', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка проведення документу');
    return { data };
  },

  async delete(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { error } = await supabase
      .from('cash_documents')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .eq('status', 'draft');

    if (error) throw normError(error, 'Помилка видалення документу');
    return { success: true };
  },
};

export default cashDocumentService;
