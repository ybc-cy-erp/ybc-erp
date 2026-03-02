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

const accountService = {
  async getAll(params = {}) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    let query = supabase
      .from('accounts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('account_type', { ascending: true })
      .order('account_name', { ascending: true });

    if (params?.account_type) {
      query = query.eq('account_type', params.account_type);
    }

    const { data, error } = await query;
    if (error) throw normError(error, 'Не вдалося завантажити рахунки');

    return data || [];
  },

  async getById(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw normError(error, 'Рахунок не знайдено');
    return data;
  },

  async create(payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const row = {
      tenant_id: tenantId,
      account_type: payload.account_type,
      account_name: payload.account_name,
      currency: payload.currency || 'EUR',
      balance: Number(payload.balance || 0),
      bank_name: payload.bank_name || null,
      bank_account_number: payload.bank_account_number || null,
      network: payload.network || null,
      wallet_address: payload.wallet_address || null,
      status: 'active',
    };

    const { data, error } = await supabase
      .from('accounts')
      .insert(row)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка створення рахунку');
    return data;
  },

  async update(id, payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const updateData = {
      account_name: payload.account_name,
      currency: payload.currency,
      bank_name: payload.bank_name || null,
      bank_account_number: payload.bank_account_number || null,
      network: payload.network || null,
      wallet_address: payload.wallet_address || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('accounts')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка оновлення рахунку');
    return data;
  },

  async delete(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    // Soft delete
    const { error } = await supabase
      .from('accounts')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw normError(error, 'Помилка видалення рахунку');
    return { success: true };
  },

  async updateBalance(id, amount, operation = 'add') {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const account = await this.getById(id);
    const currentBalance = Number(account.balance || 0);
    const newBalance = operation === 'add' 
      ? currentBalance + Number(amount)
      : currentBalance - Number(amount);

    const { data, error } = await supabase
      .from('accounts')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка оновлення балансу');
    return data;
  },

  // Get accounts grouped by type
  async getGrouped() {
    const accounts = await this.getAll();
    
    return {
      cash: accounts.filter(a => a.account_type === 'cash'),
      bank: accounts.filter(a => a.account_type === 'bank'),
      crypto: accounts.filter(a => a.account_type === 'crypto'),
    };
  },
};

export default accountService;
