import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../context/PageTitleContext';
import DashboardLayout from '../components/layout/DashboardLayout';

function FinancePage() {
  const { setPageTitle } = usePageTitle();
  const navigate = useNavigate();

  useEffect(() => {
    setPageTitle('Фінанси');
  }, [setPageTitle]);

  const sections = [
    { id: 'accounts', label: 'Рахунки', icon: '', path: '/accounts', description: 'Каси, банки, крипто' },
    { id: 'bills', label: 'Витрати', icon: '', path: '/bills', description: 'Витрати та зобов\'язання' },
    { id: 'wallets', label: 'Гаманці', icon: '', path: '/wallets', description: '6 криптовалютних мереж' },
    { id: 'exchange', label: 'Обмін валют', icon: '', path: '/currency-exchange', description: 'Конвертація валют' },
    { id: 'transfers', label: 'Перекази', icon: '', path: '/transfers', description: 'Переміщення коштів' },
    { id: 'chart', label: 'План рахунків', icon: '', path: '/chart-of-accounts', description: 'IFRS класифікація' },
  ];

  return (
    <DashboardLayout>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => navigate(section.path)}
            className="glass-card"
            style={{
              padding: '20px',
              cursor: 'pointer',
              border: '1px solid var(--border-light)',
              background: 'var(--glass-bg)',
              textAlign: 'left',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>{section.icon}</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {section.label}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {section.description}
            </div>
          </button>
        ))}
      </div>
    </DashboardLayout>
  );
}

export default FinancePage;
