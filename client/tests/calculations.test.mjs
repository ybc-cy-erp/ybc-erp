import assert from 'node:assert/strict';
import reportService from '../src/services/reportService.js';
import { supabase } from '../src/services/supabase.js';

function installLocalStorage(tenantId = 'tenant-qa') {
  const store = {
    user: JSON.stringify({ tenant_id: tenantId }),
  };
  global.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    },
    removeItem: (k) => {
      delete store[k];
    },
  };
}

class QueryBuilder {
  constructor(rows) {
    this.rows = [...rows];
  }

  select() {
    return this;
  }

  eq(field, value) {
    this.rows = this.rows.filter((r) => r[field] === value);
    return this;
  }

  gte(field, value) {
    this.rows = this.rows.filter((r) => (r[field] ?? '') >= value);
    return this;
  }

  lte(field, value) {
    this.rows = this.rows.filter((r) => (r[field] ?? '') <= value);
    return this;
  }

  lt(field, value) {
    this.rows = this.rows.filter((r) => (r[field] ?? '') < value);
    return this;
  }

  order(field, { ascending = true } = {}) {
    this.rows.sort((a, b) => {
      if (a[field] === b[field]) return 0;
      return a[field] > b[field] ? 1 : -1;
    });
    if (!ascending) this.rows.reverse();
    return this;
  }

  single() {
    return Promise.resolve({
      data: this.rows[0] ?? null,
      error: this.rows.length ? null : { message: 'Not found' },
    });
  }

  then(resolve, reject) {
    return Promise.resolve({ data: this.rows, error: null }).then(resolve, reject);
  }
}

function installSupabaseMock(fixtures) {
  const originalFrom = supabase.from;
  supabase.from = (tableName) => new QueryBuilder(fixtures[tableName] || []);
  return () => {
    supabase.from = originalFrom;
  };
}

export async function runCalculationTests() {
  installLocalStorage('tenant-qa');

  const fixtures = {
    memberships: [
      { tenant_id: 'tenant-qa', payment_amount: 1000, start_date: '2026-01-05' },
      { tenant_id: 'tenant-qa', payment_amount: 500, start_date: '2026-01-15' },
      { tenant_id: 'tenant-qa', payment_amount: 300, start_date: '2025-12-28' },
      { tenant_id: 'other-tenant', payment_amount: 9999, start_date: '2026-01-10' },
    ],
    bills: [
      { tenant_id: 'tenant-qa', amount: 200, bill_date: '2026-01-10', status: 'paid' },
      { tenant_id: 'tenant-qa', amount: 150, bill_date: '2026-01-20', status: 'unpaid' },
      { tenant_id: 'tenant-qa', amount: 50, bill_date: '2025-12-15', status: 'paid' },
      { tenant_id: 'other-tenant', amount: 999, bill_date: '2026-01-11', status: 'paid' },
    ],
  };

  const restore = installSupabaseMock(fixtures);

  const output = [];

  try {
    const pl = await reportService.getProfitLoss('2026-01-01', '2026-01-31');
    output.push({
      case: 'P&L totals (Jan 2026)',
      expected: { total_revenue: 1500, total_expenses: 350, net_profit: 1150 },
      actual: {
        total_revenue: pl.total_revenue,
        total_expenses: pl.total_expenses,
        net_profit: pl.net_profit,
      },
      pass:
        pl.total_revenue === 1500 &&
        pl.total_expenses === 350 &&
        pl.net_profit === 1150,
    });

    assert.equal(pl.total_revenue, 1500);
    assert.equal(pl.total_expenses, 350);
    assert.equal(pl.net_profit, 1150);

    const bs = await reportService.getBalanceSheet('2026-01-31');
    output.push({
      case: 'Balance Sheet equation (as of Jan 31, 2026)',
      expected: { total_assets: 1550, total_liabilities: 150, total_equity: 1400 },
      actual: {
        total_assets: bs.total_assets,
        total_liabilities: bs.total_liabilities,
        total_equity: bs.total_equity,
      },
      pass:
        bs.total_assets === 1550 &&
        bs.total_liabilities === 150 &&
        bs.total_equity === 1400,
    });

    assert.equal(bs.total_assets, 1550);
    assert.equal(bs.total_liabilities, 150);
    assert.equal(bs.total_equity, 1400);

    const cf = await reportService.getCashFlow('2026-01-01', '2026-01-31');
    output.push({
      case: 'Cash Flow (Jan 2026)',
      expected: { cash_beginning: 250, net_change: 1300, cash_ending: 1550 },
      actual: {
        cash_beginning: cf.cash_beginning,
        net_change: cf.net_change,
        cash_ending: cf.cash_ending,
      },
      pass:
        cf.cash_beginning === 250 &&
        cf.net_change === 1300 &&
        cf.cash_ending === 1550,
    });

    assert.equal(cf.cash_beginning, 250);
    assert.equal(cf.net_change, 1300);
    assert.equal(cf.cash_ending, 1550);
  } finally {
    restore();
  }

  return output;
}
