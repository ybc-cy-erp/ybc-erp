import React, { useState, useEffect } from 'react';
import { usePageTitle } from '../context/PageTitleContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import reportService from '../services/reportService';

function ReportsPage() {
  const { setPageTitle } = usePageTitle();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [profitLoss, setProfitLoss] = useState(null);
  const [balance, setBalance] = useState(null);
  const [cashFlow, setCashFlow] = useState(null);

  useEffect(() => {
    setPageTitle('Звіти');
    loadReports();
  }, [period, setPageTitle]);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();

    if (period === 'month') {
      start.setDate(1); // first day of month
    } else if (period === 'quarter') {
      const quarter = Math.floor(end.getMonth() / 3);
      start.setMonth(quarter * 3, 1);
    } else if (period === 'year') {
      start.setMonth(0, 1); // Jan 1
    }

    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();

      const [pl, bs, cf] = await Promise.all([
        reportService.getProfitLoss(startDate, endDate),
        reportService.getBalanceSheet(),
        reportService.getCashFlow(startDate, endDate),
      ]);

      setProfitLoss(pl);
      setBalance(bs);
      setCashFlow(cf);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading">Завантаження...</div>
      </DashboardLayout>
    );
  }

  const periodLabels = {
    month: 'Поточний місяць',
    quarter: 'Поточний квартал',
    year: 'Поточний рік',
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>Період:</div>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ padding: '8px 12px', borderRadius: '7px', fontSize: '13px' }}>
            <option value="month">Місяць</option>
            <option value="quarter">Квартал</option>
            <option value="year">Рік</option>
          </select>
          <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
            {periodLabels[period]}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {/* P&L Statement */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ fontSize: '32px' }}>📊</div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>Прибутки та збитки (P&L)</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Доходи та витрати</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Доходи</span>
                <span style={{ fontSize: '16px', fontWeight: '600', fontFamily: 'monospace' }}>
                  €{profitLoss?.revenue?.toLocaleString() || '0'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Витрати</span>
                <span style={{ fontSize: '16px', fontWeight: '600', fontFamily: 'monospace' }}>
                  €{profitLoss?.expenses?.toLocaleString() || '0'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '600' }}>Чистий прибуток</span>
                <span style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'monospace', color: profitLoss?.profit >= 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  €{profitLoss?.profit?.toLocaleString() || '0'}
                </span>
              </div>
            </div>
          </div>

          {/* Balance Sheet */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ fontSize: '32px' }}>⚖️</div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>Баланс</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Активи та капітал</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Активи</span>
                <span style={{ fontSize: '16px', fontWeight: '600', fontFamily: 'monospace' }}>
                  €{balance?.assets?.toLocaleString() || '0'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Зобов'язання</span>
                <span style={{ fontSize: '16px', fontWeight: '600', fontFamily: 'monospace' }}>
                  €{balance?.liabilities?.toLocaleString() || '0'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '600' }}>Капітал</span>
                <span style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'monospace' }}>
                  €{balance?.equity?.toLocaleString() || '0'}
                </span>
              </div>
            </div>
          </div>

          {/* Cash Flow */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ fontSize: '32px' }}>💰</div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>Рух коштів</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Cash Flow</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Операційна діяльність</span>
                <span style={{ fontSize: '16px', fontWeight: '600', fontFamily: 'monospace' }}>
                  €{cashFlow?.operating?.toLocaleString() || '0'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Інвестиційна</span>
                <span style={{ fontSize: '16px', fontWeight: '600', fontFamily: 'monospace' }}>
                  €{cashFlow?.investing?.toLocaleString() || '0'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Фінансова</span>
                <span style={{ fontSize: '16px', fontWeight: '600', fontFamily: 'monospace' }}>
                  €{cashFlow?.financing?.toLocaleString() || '0'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '600' }}>Чиста зміна</span>
                <span style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'monospace', color: cashFlow?.netChange >= 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  €{cashFlow?.netChange?.toLocaleString() || '0'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
          Дані оновлюються в реальному часі на основі членств та рахунків
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ReportsPage;
