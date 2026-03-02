import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../context/PageTitleContext';
import DashboardLayout from '../components/layout/DashboardLayout';

function DirectoriesPage() {
  const { setPageTitle } = usePageTitle();
  const [activeTab, setActiveTab] = useState('counterparties');
  const navigate = useNavigate();

  useEffect(() => {
    setPageTitle('Довідники');
  }, [setPageTitle]);

  useEffect(() => {
    // Redirect to actual page
    if (activeTab === 'counterparties') {
      navigate('/counterparties', { replace: true });
    } else if (activeTab === 'items') {
      navigate('/items', { replace: true });
    }
  }, [activeTab, navigate]);

  const tabs = [
    { id: 'counterparties', label: 'Контрагенти', icon: '🏢' },
    { id: 'items', label: 'Товари та послуги', icon: '📦' },
  ];

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="glass-card"
            style={{
              flex: '1',
              minWidth: '200px',
              padding: '24px',
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
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>{tab.icon}</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {tab.label}
            </div>
          </button>
        ))}
      </div>
    </DashboardLayout>
  );
}

export default DirectoriesPage;
