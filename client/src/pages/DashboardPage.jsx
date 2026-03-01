import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import '../styles/Dashboard.css';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);

  return (
    <DashboardLayout>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>{t('dashboard.welcome')}, {user?.name}!</h1>
          <p className="dashboard-subtitle">Роль: {user?.role}</p>
        </div>

        <div className="dashboard-metrics">
          <div className="metric-card glass-card">
            <div className="metric-icon">👥</div>
            <h3>{t('dashboard.activeMembers')}</h3>
            <div className="metric-value">0</div>
            <div className="metric-change positive">+0 цього місяця</div>
          </div>

          <div className="metric-card glass-card">
            <div className="metric-icon">⏰</div>
            <h3>{t('dashboard.expiringMembers')}</h3>
            <div className="metric-value">0</div>
            <div className="metric-change neutral">Протягом 30 днів</div>
          </div>

          <div className="metric-card glass-card">
            <div className="metric-icon">💰</div>
            <h3>{t('dashboard.monthlyRevenue')}</h3>
            <div className="metric-value">0 EUR</div>
            <div className="metric-change positive">+0% порівняно з минулим</div>
          </div>

          <div className="metric-card glass-card">
            <div className="metric-icon">📊</div>
            <h3>{t('dashboard.totalRevenue')}</h3>
            <div className="metric-value">0 EUR</div>
            <div className="metric-change neutral">За весь час</div>
          </div>
        </div>

        <div className="dashboard-content glass-card">
          <h2>Швидкий старт</h2>
          <p>Модулі членства, подій та рахунків будуть додані в наступних тижнях розробки.</p>
          <p>Наразі доступні: Аутентифікація, Управління користувачами (для Owner).</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
