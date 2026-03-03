import { useState, useEffect } from 'react';
import { usePageTitle } from '../context/PageTitleContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import CounterpartiesPage from './CounterpartiesPage';
import MembershipPlansPage from './MembershipPlansPage';
import UsersPage from './UsersPage';
import './DirectoriesTabsPage.css';

export default function DirectoriesTabsPage() {
  const { setPageTitle } = usePageTitle();
  const [activeTab, setActiveTab] = useState('counterparties');

  useEffect(() => {
    setPageTitle('Довідники');
  }, [setPageTitle]);

  const tabs = [
    { id: 'counterparties', label: 'Контрагенти', icon: '👥' },
    { id: 'plans', label: 'Тарифні плани', icon: '📋' },
    { id: 'users', label: 'Користувачі', icon: '👤' },
  ];

  return (
    <DashboardLayout>
      <div className="directories-tabs-page">
        <div className="tabs-header glass-card">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'counterparties' && <CounterpartiesPage embedded />}
          {activeTab === 'plans' && <MembershipPlansPage embedded />}
          {activeTab === 'users' && <UsersPage embedded />}
        </div>
      </div>
    </DashboardLayout>
  );
}
