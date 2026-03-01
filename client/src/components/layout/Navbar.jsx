import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <nav className="navbar solid-card">
      <div className="navbar-left">
        <img src="/logo-ybc-white.png" alt="YBC" className="navbar-logo" />
        <h2>YBC ERP</h2>
      </div>

      <div className="navbar-right">
        <button onClick={toggleTheme} className="btn-theme" title="Тема">
          {theme === 'light' ? 'Темна' : 'Світла'}
        </button>
        <span className="user-name">{user?.name}</span>
        <button onClick={logout} className="btn-logout">
          {t('common.logout')}
        </button>
      </div>
    </nav>
  );
}
