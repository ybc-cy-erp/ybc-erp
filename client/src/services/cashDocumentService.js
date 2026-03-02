import { supabase } from './supabase';
import documentService from './documentService';

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

const cashDocumentService = {
  async getAll(params = {}) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не определен');

    let query = supabase
      .from('cash_documents')
      .select('*, counterparties(name), wallets(name, currency)')
      .eq('tenant_id', tenantId)
      .order('doc_date', { ascending: false });

    if (params?.doc_type) query = query.eq('doc_type', params.doc_type);
    if (params?.status) query = query.eq('status', params.status);

    const { data, error } = await query;
    if (error) throw normError(error, 'Не удалось загрузить кассовые документы');

    return data || [];
  },

  async create(payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не определен');

    const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null;

    // Создаем запись в document_journal
    const docJournal = await documentService.create({
      doc_type: payload.doc_type,
      doc_date: payload.doc_date,
      counterparty_id: payload.counterparty_id,
      amount: payload.amount,
      currency: payload.currency,
      notes: payload.purpose,
    });

    // Создаем кассовый документ
    const row = {
      tenant_id: tenantId,
      doc_type: payload.doc_type,
      doc_number: docJournal.doc_number,
      doc_date: payload.doc_date,
      wallet_id: payload.wallet_id,
      counterparty_id: payload.counterparty_id || null,
      amount: Number(payload.amount),
      currency: payload.currency || 'EUR',
      purpose: payload.purpose || null,
      status: 'draft',
      document_id: docJournal.id,
      created_by: userId,
    };

    const { data, error } = await supabase
      .from('cash_documents')
      .insert(row)
      .select('*')
      .single();

    if (error) throw normError(error, 'Ошибка создания кассового документа');
    return data;
  },

  async post(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не определен');

    // Получаем кассовый документ
    const { data: cashDoc } = await supabase
      .from('cash_documents')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (!cashDoc) throw normError(null, 'Документ не найден');

    // TODO: Создать проводки GL (требуется план счетов с ID счетов для cash/income/expense)
    // Пока просто меняем статус

    // Обновляем статус в cash_documents
    await supabase
      .from('cash_documents')
      .update({ status: 'posted' })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    // Обновляем статус в document_journal
    if (cashDoc.document_id) {
      await documentService.post(cashDoc.document_id);
    }

    return { success: true };
  },

  async delete(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не определен');

    const { error } = await supabase
      .from('cash_documents')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw normError(error, 'Ошибка удаления');
    return { success: true };
  },
};

export default cashDocumentService;
