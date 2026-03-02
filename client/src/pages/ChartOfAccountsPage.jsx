import React, { useState, useEffect } from 'react';
import { usePageTitle } from '../context/PageTitleContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import { supabase } from '../services/supabase';

function ChartOfAccountsPage() {
  const { setPageTitle } = usePageTitle();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setPageTitle('План рахунків');
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .order('account_code', { ascending: true });

      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      console.error('Failed to load chart of accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAccountType = (code) => {
    if (code >= 100 && code < 200) return 'Активи';
    if (code >= 200 && code < 300) return 'Зобов\'язання';
    if (code >= 300 && code < 400) return 'Капітал';
    if (code >= 400 && code < 500) return 'Доходи';
    if (code >= 500 && code < 600) return 'Витрати';
    return 'Інше';
  };

  const filteredAccounts = filter === 'all'
    ? accounts
    : accounts.filter(acc => {
        const type = getAccountType(parseInt(acc.account_code));
        return type === filter;
      });

  const groupByType = () => {
    const groups = {};
    filteredAccounts.forEach(acc => {
      const type = getAccountType(parseInt(acc.account_code));
      if (!groups[type]) groups[type] = [];
      groups[type].push(acc);
    });
    return groups;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading">Завантаження...</div>
      </DashboardLayout>
    );
  }

  const groups = groupByType();

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '7px', fontSize: '13px' }}
          >
            <option value="all">Всі рахунки</option>
            <option value="Активи">Активи (100-199)</option>
            <option value="Зобов'язання">Зобов'язання (200-299)</option>
            <option value="Капітал">Капітал (300-399)</option>
            <option value="Доходи">Доходи (400-499)</option>
            <option value="Витрати">Витрати (500-599)</option>
          </select>
        </div>

        {Object.keys(groups).map((type) => (
          <div key={type} style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
              {type}
            </h2>
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-light)' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Код
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Назва рахунку
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Опис
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groups[type].map((account) => (
                    <tr key={account.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontFamily: 'monospace', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {account.account_code}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--text-primary)' }}>
                        {account.account_name}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {account.description || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {filteredAccounts.length === 0 && (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Рахунки не знайдено
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ChartOfAccountsPage;
