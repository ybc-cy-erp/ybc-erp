import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { usePageTitle } from '../../context/PageTitleContext';
import './Navbar.css';

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const { pageTitle } = usePageTitle();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {pageTitle && <h1 className="page-title">{pageTitle}</h1>}
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
