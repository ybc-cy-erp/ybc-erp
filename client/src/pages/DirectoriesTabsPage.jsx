import { useState, useEffect } from 'react';
import { usePageTitle } from '../context/PageTitleContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import CounterpartiesPage from './CounterpartiesPage';
import MembershipPlansFinderPage from './MembershipPlansFinderPage';
import UsersPage from './UsersPage';
import './DirectoriesTabsPage.css';

export default function DirectoriesTabsPage() {
  const { setPageTitle } = usePageTitle();
  const [activeTab, setActiveTab] = useState('counterparties');

  useEffect(() => {
    setPageTitle('Довідники');
  }, [setPageTitle]);

  const tabs = [
    { id: 'counterparties', label: 'Контрагенти' },
    { id: 'plans', label: 'Тарифні плани' },
    { id: 'users', label: 'Користувачі' },
  ];

  return (
    <DashboardLayout>
      <div className="directories-tabs-page">
        <div className="tabs-header">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'counterparties' && <CounterpartiesPage embedded />}
          {activeTab === 'plans' && <MembershipPlansFinderPage embedded />}
          {activeTab === 'users' && <UsersPage embedded />}
        </div>
      </div>
    </DashboardLayout>
  );
}
