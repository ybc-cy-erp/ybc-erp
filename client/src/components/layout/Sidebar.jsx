import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Sidebar.css';

function Icon({ children }) {
  return (
    <span className="sidebar-icon" aria-hidden="true">
      {children}
    </span>
  );
}

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  ),
  plans: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 4h14a1 1 0 0 1 1 1v14l-4-2-4 2-4-2-4 2V5a1 1 0 0 1 1-1Z" />
      <path d="M8 8h8M8 11h8" />
    </svg>
  ),
  memberships: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M14 19a4 4 0 0 1 7 0" />
    </svg>
  ),
  events: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  ),
  bills: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v4h4" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  ),
  wallets: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v2H3z" />
      <rect x="3" y="9" width="18" height="10" rx="2" />
      <circle cx="16.5" cy="14" r="1.2" />
    </svg>
  ),
  counterparties: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  items: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 7h-9M20 12h-9M20 17h-9" />
      <circle cx="6" cy="7" r="1.5" />
      <circle cx="6" cy="12" r="1.5" />
      <circle cx="6" cy="17" r="1.5" />
    </svg>
  ),
  documents: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="15" x2="15" y2="15" />
      <line x1="9" y1="11" x2="15" y2="11" />
    </svg>
  ),
  chartOfAccounts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  ),
};

export default function Sidebar() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const menuItems = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: icons.dashboard },
    { path: '/membership-plans', label: 'Тарифні плани', icon: icons.plans },
    { path: '/memberships', label: t('nav.memberships'), icon: icons.memberships },
    { path: '/counterparties', label: 'Контрагенти', icon: icons.counterparties },
    { path: '/items', label: 'Товари та послуги', icon: icons.items },
    { path: '/documents', label: 'Журнал документів', icon: icons.documents },
    { path: '/events', label: t('nav.events'), icon: icons.events },
    { path: '/bills', label: t('nav.bills'), icon: icons.bills },
    { path: '/wallets', label: t('nav.wallets'), icon: icons.wallets },
    { path: '/chart-of-accounts', label: 'План рахунків', icon: icons.chartOfAccounts },
    { path: '/reports', label: t('nav.reports'), icon: icons.reports },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img 
          src="/logo-ybc-full.png" 
          alt="YBC" 
          className={`sidebar-logo-img ${theme === 'light' ? 'logo-inverted' : ''}`}
        />
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <Icon>{item.icon}</Icon>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
