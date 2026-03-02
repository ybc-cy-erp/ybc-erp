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

const reportService = {
  async getProfitLoss(startDate, endDate) {
    const tenantId = getTenantId();
    if (!tenantId) return { revenue: 0, expenses: 0, profit: 0 };

    // Revenue from memberships
    const { data: memberships } = await supabase
      .from('memberships')
      .select('payment_amount')
      .eq('tenant_id', tenantId)
      .gte('start_date', startDate)
      .lte('start_date', endDate);

    const revenue = (memberships || []).reduce((sum, m) => sum + Number(m.payment_amount || 0), 0);

    // Expenses from bills
    const { data: bills } = await supabase
      .from('bills')
      .select('amount')
      .eq('tenant_id', tenantId)
      .gte('bill_date', startDate)
      .lte('bill_date', endDate);

    const expenses = (bills || []).reduce((sum, b) => sum + Number(b.amount || 0), 0);

    return {
      revenue: Number(revenue.toFixed(2)),
      expenses: Number(expenses.toFixed(2)),
      profit: Number((revenue - expenses).toFixed(2)),
    };
  },

  async getBalanceSheet() {
    const tenantId = getTenantId();
    if (!tenantId) return { assets: 0, liabilities: 0, equity: 0 };

    // Simple balance: total revenue - total expenses
    const { data: memberships } = await supabase
      .from('memberships')
      .select('payment_amount')
      .eq('tenant_id', tenantId);

    const totalRevenue = (memberships || []).reduce((sum, m) => sum + Number(m.payment_amount || 0), 0);

    const { data: bills } = await supabase
      .from('bills')
      .select('amount')
      .eq('tenant_id', tenantId);

    const totalExpenses = (bills || []).reduce((sum, b) => sum + Number(b.amount || 0), 0);

    const equity = totalRevenue - totalExpenses;

    return {
      assets: Number(totalRevenue.toFixed(2)),
      liabilities: Number(totalExpenses.toFixed(2)),
      equity: Number(equity.toFixed(2)),
    };
  },

  async getCashFlow(startDate, endDate) {
    const tenantId = getTenantId();
    if (!tenantId) return { operating: 0, investing: 0, financing: 0, netChange: 0 };

    // Operating: memberships revenue
    const { data: memberships } = await supabase
      .from('memberships')
      .select('payment_amount')
      .eq('tenant_id', tenantId)
      .gte('start_date', startDate)
      .lte('start_date', endDate);

    const operating = (memberships || []).reduce((sum, m) => sum + Number(m.payment_amount || 0), 0);

    // Expenses
    const { data: bills } = await supabase
      .from('bills')
      .select('amount')
      .eq('tenant_id', tenantId)
      .gte('bill_date', startDate)
      .lte('bill_date', endDate);

    const expenses = (bills || []).reduce((sum, b) => sum + Number(b.amount || 0), 0);

    const netOperating = operating - expenses;

    return {
      operating: Number(netOperating.toFixed(2)),
      investing: 0,
      financing: 0,
      netChange: Number(netOperating.toFixed(2)),
    };
  },
};

export default reportService;
