import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import '../styles/Dashboard.css';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{t('dashboard.welcome')}, {user?.name}!</h1>
      </div>

      <div className="dashboard-metrics">
        <div className="metric-card glass-card">
          <h3>{t('dashboard.activeMembers')}</h3>
          <div className="metric-value">0</div>
        </div>

        <div className="metric-card glass-card">
          <h3>{t('dashboard.expiringMembers')}</h3>
          <div className="metric-value">0</div>
        </div>

        <div className="metric-card glass-card">
          <h3>{t('dashboard.monthlyRevenue')}</h3>
          <div className="metric-value">0 EUR</div>
        </div>
      </div>

      <div className="dashboard-content">
        <p>Модулі будуть додані в наступних тижнях</p>
      </div>
    </div>
  );
}
