import { supabase } from './supabase';

function getTenantId() {
  try {
    const raw = localStorage.getItem('user');
    const user = raw ? JSON.parse(raw) : null;
    return user?.tenant_id || null;
  } catch {
    return null;
  }
}

export const dashboardService = {
  async getMetrics() {
    const tenantId = getTenantId();
    if (!tenantId) return { data: { active_members: 0, mrr: 0, total_revenue: 0, expiring_members: [] } };

    const { data: memberships, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) {
      return { data: { active_members: 0, mrr: 0, total_revenue: 0, expiring_members: [] } };
    }

    const rows = memberships || [];
    const active = rows.filter((m) => m.status === 'active' || m.status === 'frozen');
    const activeMembers = active.length;
    const totalRevenue = rows.reduce((s, m) => s + Number(m.payment_amount || 0), 0);

    const mrr = active.reduce((sum, m) => {
      if (!m.start_date || !m.end_date) return sum;
      const days = Math.max(1, Math.ceil((new Date(m.end_date) - new Date(m.start_date)) / 86400000));
      const daily = Number(m.payment_amount || 0) / days;
      return sum + daily * 30;
    }, 0);

    const now = new Date();
    const expiring = active
      .map((m) => {
        if (!m.end_date) return null;
        const end = new Date(m.end_date);
        const daysRemaining = Math.ceil((end - now) / 86400000);
        return {
          id: m.id,
          client_name: m.client_name,
          end_date: m.end_date,
          days_remaining: daysRemaining,
        };
      })
      .filter(Boolean)
      .filter((m) => m.days_remaining >= 0 && m.days_remaining <= 30)
      .sort((a, b) => a.days_remaining - b.days_remaining)
      .slice(0, 10);

    return {
      data: {
        active_members: activeMembers,
        mrr: Number(mrr.toFixed(2)),
        total_revenue: Number(totalRevenue.toFixed(2)),
        churn_rate: 0,
        expiring_members: expiring,
      },
    };
  },
};
