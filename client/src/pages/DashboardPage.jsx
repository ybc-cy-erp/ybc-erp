import { useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';
import DashboardLayout from '../components/layout/DashboardLayout';
import '../styles/Dashboard.css';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getMetrics();
      setMetrics(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      setError('Не вдалося завантажити метрики');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="dashboard">
          <div className="dashboard-header">
            <h1>{t('dashboard.welcome')}, {user?.name}!</h1>
          </div>
          <div className="loading">Завантаження...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="dashboard">
          <div className="error-message">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

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
            <div className="metric-value">{metrics?.active_members || 0}</div>
            <div className="metric-change positive">Активних членств</div>
          </div>

          <div className="metric-card glass-card">
            <div className="metric-icon">⏰</div>
            <h3>{t('dashboard.expiringMembers')}</h3>
            <div className="metric-value">{metrics?.expiring_members?.within_30_days || 0}</div>
            <div className="metric-change neutral">
              Протягом 30 днів
              {metrics?.expiring_members?.within_7_days > 0 && (
                <span className="expiring-urgent"> ({metrics.expiring_members.within_7_days} за 7 днів)</span>
              )}
            </div>
          </div>

          <div className="metric-card glass-card">
            <div className="metric-icon">💰</div>
            <h3>{t('dashboard.monthlyRevenue')}</h3>
            <div className="metric-value">
              {metrics?.mrr ? `${metrics.mrr.toLocaleString()} ${metrics.currency}` : '0 EUR'}
            </div>
            <div className="metric-change positive">MRR (місячний дохід)</div>
          </div>

          <div className="metric-card glass-card">
            <div className="metric-icon">📊</div>
            <h3>{t('dashboard.totalRevenue')}</h3>
            <div className="metric-value">
              {metrics?.total_revenue ? `${metrics.total_revenue.toLocaleString()} ${metrics.currency}` : '0 EUR'}
            </div>
            <div className="metric-change neutral">За весь час</div>
          </div>
        </div>

        <div className="dashboard-content glass-card">
          <h2>Швидкий старт</h2>
          <p><strong>Week 2 виконано:</strong> Модуль членства повністю функціональний!</p>
          <ul>
            <li>✅ Управління тарифними планами</li>
            <li>✅ Створення та управління членствами</li>
            <li>✅ Логіка заморозки членств</li>
            <li>✅ Розрахунок щоденного доходу</li>
            <li>✅ Реальні метрики на дашборді</li>
          </ul>
          <p>Наступні модулі (Події, Рахунки, Гаманці) будуть додані в наступних тижнях.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
