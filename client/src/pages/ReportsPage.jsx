import React, { useState, useEffect } from 'react';
import { usePageTitle } from '../context/PageTitleContext';
import DashboardLayout from '../components/layout/DashboardLayout';

const REPORTS = [
  {
    id: 'profit-loss',
    name: 'Звіт про прибутки та збитки (P&L)',
    description: 'Доходи та витрати за період',
    icon: '📊',
    category: 'Фінансові',
  },
  {
    id: 'balance-sheet',
    name: 'Баланс',
    description: 'Активи, зобов\'язання та капітал',
    icon: '⚖️',
    category: 'Фінансові',
  },
  {
    id: 'cash-flow',
    name: 'Рух коштів',
    description: 'Операційна, інвестиційна, фінансова діяльність',
    icon: '💰',
    category: 'Фінансові',
  },
  {
    id: 'revenue-recognition',
    name: 'Визнання доходів',
    description: 'Деталізація розподілу доходів членств',
    icon: '📈',
    category: 'Операційні',
  },
  {
    id: 'memberships-aging',
    name: 'Аналіз членств',
    description: 'Активні, заморожені, що закінчуються',
    icon: '👥',
    category: 'Операційні',
  },
  {
    id: 'bills-aging',
    name: 'Аналіз рахунків',
    description: 'Непрострочені та прострочені зобов\'язання',
    icon: '📄',
    category: 'Операційні',
  },
  {
    id: 'tax-summary',
    name: 'Податковий звіт',
    description: 'ПДВ та інші податки',
    icon: '🧾',
    category: 'Податкові',
  },
  {
    id: 'audit-log',
    name: 'Аудит-лог',
    description: 'Всі зміни в системі',
    icon: '🔍',
    category: 'Безпека',
  },
];

function ReportsPage() {
  const { setPageTitle } = usePageTitle();
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    setPageTitle('Звіти');
  }, []);

  const categories = ['all', ...new Set(REPORTS.map(r => r.category))];

  const filteredReports = selectedCategory === 'all'
    ? REPORTS
    : REPORTS.filter(r => r.category === selectedCategory);

  const handleGenerate = (reportId) => {
    alert(`Генерація звіту: ${reportId}\n\nФункціонал буде доданий в наступних версіях.`);
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px' }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '7px', fontSize: '13px' }}
          >
            <option value="all">Всі категорії</option>
            {categories.filter(c => c !== 'all').map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredReports.map((report) => (
            <div key={report.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '32px' }}>{report.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
                    {report.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {report.description}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <div className="badge" style={{ fontSize: '11px', marginBottom: '12px' }}>
                  {report.category}
                </div>
                <button
                  onClick={() => handleGenerate(report.id)}
                  className="btn-primary"
                  style={{ width: '100%', padding: '10px', fontSize: '13px' }}
                >
                  Згенерувати звіт
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredReports.length === 0 && (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Звіти не знайдено
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ReportsPage;
