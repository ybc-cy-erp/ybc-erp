import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar glass-card">
      <div className="navbar-left">
        <h2>YBC ERP</h2>
      </div>
      
      <div className="navbar-right">
        <span className="user-name">{user?.name}</span>
        <button onClick={logout} className="btn-logout">
          {t('common.logout')}
        </button>
      </div>
    </nav>
  );
}
