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
    if (!tenantId) return { revenue: [], expenses: [], total_revenue: 0, total_expenses: 0, net_profit: 0 };

    // Revenue from memberships (simplified - group by account 400)
    const { data: memberships } = await supabase
      .from('memberships')
      .select('payment_amount')
      .eq('tenant_id', tenantId)
      .gte('start_date', startDate)
      .lte('start_date', endDate);

    const totalRevenue = (memberships || []).reduce((sum, m) => sum + Number(m.payment_amount || 0), 0);

    // Expenses from bills (group by account 500)
    const { data: bills } = await supabase
      .from('bills')
      .select('amount')
      .eq('tenant_id', tenantId)
      .gte('bill_date', startDate)
      .lte('bill_date', endDate);

    const totalExpenses = (bills || []).reduce((sum, b) => sum + Number(b.amount || 0), 0);

    return {
      revenue: totalRevenue > 0 ? [{ account_code: '400', account_name: 'Дохід від членства', amount: totalRevenue }] : [],
      expenses: totalExpenses > 0 ? [{ account_code: '500', account_name: 'Операційні витрати', amount: totalExpenses }] : [],
      total_revenue: Number(totalRevenue.toFixed(2)),
      total_expenses: Number(totalExpenses.toFixed(2)),
      net_profit: Number((totalRevenue - totalExpenses).toFixed(2)),
    };
  },

  async getBalanceSheet(asOfDate) {
    const tenantId = getTenantId();
    if (!tenantId) return { assets: [], liabilities: [], equity: [], total_assets: 0, total_liabilities: 0, total_equity: 0 };

    // Assets: Cash from memberships up to date
    const { data: memberships } = await supabase
      .from('memberships')
      .select('payment_amount')
      .eq('tenant_id', tenantId)
      .lte('start_date', asOfDate);

    const cash = (memberships || []).reduce((sum, m) => sum + Number(m.payment_amount || 0), 0);

    // Liabilities: Unpaid bills up to date
    const { data: bills } = await supabase
      .from('bills')
      .select('amount')
      .eq('tenant_id', tenantId)
      .lte('bill_date', asOfDate)
      .eq('status', 'unpaid');

    const unpaid = (bills || []).reduce((sum, b) => sum + Number(b.amount || 0), 0);

    // Paid bills (reduce cash)
    const { data: paidBills } = await supabase
      .from('bills')
      .select('amount')
      .eq('tenant_id', tenantId)
      .lte('bill_date', asOfDate)
      .eq('status', 'paid');

    const paid = (paidBills || []).reduce((sum, b) => sum + Number(b.amount || 0), 0);

    const netCash = cash - paid;
    const equity = netCash - unpaid;

    return {
      assets: netCash > 0 ? [{ account_code: '100', account_name: 'Грошові кошти', balance: netCash }] : [],
      liabilities: unpaid > 0 ? [{ account_code: '200', account_name: 'Кредиторська заборгованість', balance: unpaid }] : [],
      equity: equity !== 0 ? [{ account_code: '300', account_name: 'Власний капітал', balance: equity }] : [],
      total_assets: Number(netCash.toFixed(2)),
      total_liabilities: Number(unpaid.toFixed(2)),
      total_equity: Number(equity.toFixed(2)),
    };
  },

  async getCashFlow(startDate, endDate) {
    const tenantId = getTenantId();
    if (!tenantId) return { 
      operating: [], investing: [], financing: [], 
      net_operating: 0, net_investing: 0, net_financing: 0, 
      net_change: 0, cash_beginning: 0, cash_ending: 0 
    };

    // Operating: memberships revenue
    const { data: memberships } = await supabase
      .from('memberships')
      .select('payment_amount')
      .eq('tenant_id', tenantId)
      .gte('start_date', startDate)
      .lte('start_date', endDate);

    const revenue = (memberships || []).reduce((sum, m) => sum + Number(m.payment_amount || 0), 0);

    // Operating: paid bills (cash outflow)
    const { data: bills } = await supabase
      .from('bills')
      .select('amount')
      .eq('tenant_id', tenantId)
      .gte('bill_date', startDate)
      .lte('bill_date', endDate)
      .eq('status', 'paid');

    const expenses = (bills || []).reduce((sum, b) => sum + Number(b.amount || 0), 0);

    const netOperating = revenue - expenses;

    // Cash at beginning (simplified - memberships before start date)
    const { data: beforeMemberships } = await supabase
      .from('memberships')
      .select('payment_amount')
      .eq('tenant_id', tenantId)
      .lt('start_date', startDate);

    const { data: beforeBills } = await supabase
      .from('bills')
      .select('amount')
      .eq('tenant_id', tenantId)
      .lt('bill_date', startDate)
      .eq('status', 'paid');

    const cashBeginning = (beforeMemberships || []).reduce((sum, m) => sum + Number(m.payment_amount || 0), 0) -
                          (beforeBills || []).reduce((sum, b) => sum + Number(b.amount || 0), 0);

    const operating = [];
    if (revenue > 0) operating.push({ description: 'Надходження від членства', amount: revenue });
    if (expenses > 0) operating.push({ description: 'Оплата витрат', amount: -expenses });

    return {
      operating,
      investing: [],
      financing: [],
      net_operating: Number(netOperating.toFixed(2)),
      net_investing: 0,
      net_financing: 0,
      net_change: Number(netOperating.toFixed(2)),
      cash_beginning: Number(cashBeginning.toFixed(2)),
      cash_ending: Number((cashBeginning + netOperating).toFixed(2)),
    };
  },
};

export default reportService;
