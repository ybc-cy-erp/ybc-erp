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
      .from('document_journal')
      .select(`
        *,
        counterparty:counterparties(name),
        account:accounts(account_name, account_type, currency)
      `)
      .eq('tenant_id', tenantId)
      .in('doc_type', ['PKO', 'RKO'])
      .order('doc_date', { ascending: false });

    if (params?.doc_type) query = query.eq('doc_type', params.doc_type);

    const { data, error } = await query;
    if (error) throw normError(error, 'Не вдалося завантажити документи');

    return (data || []).map(d => ({
      ...d,
      counterparty_name: d.counterparty?.name || null,
      account_name: d.account?.account_name || null,
    }));
  },

  async getById(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('document_journal')
      .select(`
        *,
        counterparty:counterparties(name),
        account:accounts(account_name, account_type, currency)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw normError(error, 'Документ не знайдено');
    return {
      ...data,
      counterparty_name: data.counterparty?.name || null,
      account_name: data.account?.account_name || null,
    };
  },

  async create(payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    // Generate doc_number
    const prefix = payload.doc_type;
    const { data: existing } = await supabase
      .from('document_journal')
      .select('doc_number')
      .eq('tenant_id', tenantId)
      .eq('doc_type', payload.doc_type)
      .order('created_at', { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (existing && existing.length > 0) {
      const match = existing[0].doc_number.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const doc_number = `${prefix}-${String(nextNum).padStart(6, '0')}`;

    const row = {
      tenant_id: tenantId,
      doc_type: payload.doc_type,
      doc_number,
      counterparty_id: payload.counterparty_id || null,
      account_id: payload.account_id || null,
      doc_date: payload.doc_date,
      amount: Number(payload.amount),
      currency: payload.currency || 'EUR',
      notes: payload.purpose || null,
      status: 'draft',
    };

    const { data, error } = await supabase
      .from('document_journal')
      .insert(row)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка створення документу');
    return { data };
  },

  async post(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    // Posting will trigger auto_post_gl_entry() function
    const { data, error } = await supabase
      .from('document_journal')
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
      .from('document_journal')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .eq('status', 'draft');

    if (error) throw normError(error, 'Помилка видалення документу');
    return { success: true };
  },
};

export default cashDocumentService;
