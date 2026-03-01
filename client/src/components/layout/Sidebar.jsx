import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Sidebar.css';

export default function Sidebar() {
  const { t } = useTranslation();

  const menuItems = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: '🏠' },
    { path: '/memberships', label: t('nav.memberships'), icon: '👥' },
    { path: '/events', label: t('nav.events'), icon: '📅' },
    { path: '/bills', label: t('nav.bills'), icon: '🧾' },
    { path: '/wallets', label: t('nav.wallets'), icon: '💰' },
    { path: '/reports', label: t('nav.reports'), icon: '📊' },
  ];

  return (
    <aside className="sidebar glass-card">
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
