import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../context/PageTitleContext';
import DashboardLayout from '../components/layout/DashboardLayout';

function DocumentsHubPage() {
  const { setPageTitle } = usePageTitle();
  const navigate = useNavigate();

  useEffect(() => {
    setPageTitle('Документи');
  }, [setPageTitle]);

  const sections = [
    { id: 'journal', label: 'Журнал документів', icon: '📋', path: '/document-journal', description: 'Всі документи' },
    { id: 'cash', label: 'ПКО / РКО', icon: '💵', path: '/cash-documents', description: 'Касові документи' },
  ];

  return (
    <DashboardLayout>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => navigate(section.path)}
            className="glass-card"
            style={{
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
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>{section.icon}</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
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

export default DocumentsHubPage;
