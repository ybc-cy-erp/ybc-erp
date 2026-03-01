import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Sidebar.css';

export default function Sidebar() {
  const { t } = useTranslation();

  const menuItems = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: '01' },
    { path: '/membership-plans', label: 'Тарифні плани', icon: '02' },
    { path: '/memberships', label: t('nav.memberships'), icon: '03' },
    { path: '/events', label: t('nav.events'), icon: '04' },
    { path: '/bills', label: t('nav.bills'), icon: '05' },
    { path: '/wallets', label: t('nav.wallets'), icon: '06' },
    { path: '/reports', label: t('nav.reports'), icon: '07' },
  ];

  return (
    <aside className="sidebar solid-card">
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `sidebar-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
