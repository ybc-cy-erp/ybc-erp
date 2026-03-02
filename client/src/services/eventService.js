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

const eventService = {
  async getAll(params = {}) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    let query = supabase
      .from('events')
      .select(`
        *,
        counterparty:counterparties(name)
      `)
      .eq('tenant_id', tenantId)
      .order('event_date', { ascending: false });

    if (params?.status) query = query.eq('status', params.status);

    const { data, error } = await query;
    if (error) throw normError(error, 'Не вдалося завантажити події');

    return (data || []).map((row) => ({
      ...row,
      counterparty_name: row.counterparty?.name || null,
    }));
  },

  async getById(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        counterparty:counterparties(name)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw normError(error, 'Подію не знайдено');
    return {
      ...data,
      counterparty_name: data.counterparty?.name || null,
    };
  },

  async create(payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const row = {
      tenant_id: tenantId,
      counterparty_id: payload.counterparty_id || null,
      name: payload.name,
      description: payload.description || null,
      event_date: payload.event_date,
      location: payload.location || null,
      status: 'draft',
    };

    const { data, error } = await supabase
      .from('events')
      .insert(row)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка створення події');
    return { data: { event: data } };
  },

  async update(id, payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const updateData = {
      counterparty_id: payload.counterparty_id || null,
      name: payload.name,
      description: payload.description || null,
      event_date: payload.event_date,
      location: payload.location || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка оновлення події');
    return { data: { event: data } };
  },

  async publish(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('events')
      .update({ status: 'published', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка публікації події');
    return { data: { event: data } };
  },

  async cancel(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('events')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка скасування події');
    return { data: { event: data } };
  },

  async getTicketTypes(eventId) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { data, error } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('event_id', eventId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true });

    if (error) throw normError(error, 'Помилка завантаження типів квитків');
    return data || [];
  },

  async createTicketType(eventId, payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const row = {
      tenant_id: tenantId,
      event_id: eventId,
      ticket_type: payload.ticket_type,
      price: Number(payload.price || 0),
      currency: payload.currency || 'EUR',
      quantity_total: Number(payload.quantity_total || 0),
      quantity_sold: 0,
    };

    const { data, error } = await supabase
      .from('event_tickets')
      .insert(row)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка створення типу квитка');
    return { data: { ticketType: data } };
  },

  async updateTicketType(id, payload) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const updateData = {
      ticket_type: payload.ticket_type,
      price: Number(payload.price || 0),
      currency: payload.currency || 'EUR',
      quantity_total: Number(payload.quantity_total || 0),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('event_tickets')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw normError(error, 'Помилка оновлення типу квитка');
    return { data: { ticketType: data } };
  },

  async deleteTicketType(id) {
    const tenantId = getTenantId();
    if (!tenantId) throw normError(null, 'Tenant не визначено');

    const { error } = await supabase
      .from('event_tickets')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw normError(error, 'Помилка видалення типу квитка');
    return { data: { success: true } };
  },
};

export default eventService;
