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

const telegramService = {
  async getSettings() {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('telegram_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) {
      throw normError(error, 'Помилка завантаження налаштувань');
    }

    return data || null;
  },

  async updateSettings(payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    // Check if settings exist
    const existing = await this.getSettings();

    const row = {
      tenant_id: tenantId,
      bot_token: payload.bot_token || null,
      chat_id: payload.chat_id || null,
      notify_new_membership: payload.notify_new_membership ?? true,
      notify_expiring_membership: payload.notify_expiring_membership ?? true,
      notify_overdue_bill: payload.notify_overdue_bill ?? true,
      notify_new_event: payload.notify_new_event ?? true,
      is_active: payload.is_active ?? false,
      updated_at: new Date().toISOString(),
    };

    let data, error;

    if (existing) {
      // Update
      const result = await supabase
        .from('telegram_settings')
        .update(row)
        .eq('tenant_id', tenantId)
        .select('*')
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Insert
      const result = await supabase
        .from('telegram_settings')
        .insert(row)
        .select('*')
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) throw normError(error, 'Помилка збереження налаштувань');
    return data;
  },

  async testConnection(botToken, chatId) {
    // Simple test - try to send a test message via Telegram API
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '✅ YBC ERP Telegram підключення працює!',
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.description || 'Telegram API error');
      }

      return { success: true };
    } catch (err) {
      throw normError(err, 'Не вдалося підключитися до Telegram');
    }
  },

  async getNotifications(limit = 50) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('telegram_notifications')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw normError(error, 'Помилка завантаження сповіщень');
    return data || [];
  },
};

export default telegramService;
