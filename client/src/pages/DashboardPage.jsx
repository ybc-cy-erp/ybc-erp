import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';
import DashboardLayout from '../components/layout/DashboardLayout';
import '../styles/Dashboard.css';

export default function DashboardPage() {
  const navigate = useNavigate();
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

  const CircleChart = ({ value, max, label, color }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="circle-chart">
        <svg width="120" height="120" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="var(--border-light)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color || 'var(--text-primary)'}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dy="7"
            fontSize="20"
            fontWeight="700"
            fill="var(--text-primary)"
          >
            {value}
          </text>
        </svg>
        <div className="chart-label">{label}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="dashboard">
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

  const activeMembers = metrics?.active_members || 0;
  const expiringMembers = metrics?.expiring_members?.within_30_days || 0;
  const totalMembers = activeMembers + expiringMembers;
  
  return (
    <DashboardLayout>
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>Головна</h1>
            <p className="dashboard-subtitle">Роль: {user?.role}</p>
          </div>
        </div>

        {/* Main metrics with circular charts */}
        <div className="dashboard-charts">
          <div className="chart-card glass-card">
            <CircleChart
              value={activeMembers}
              max={totalMembers || 100}
              label="Активних членств"
              color="var(--text-primary)"
            />
          </div>

          <div className="chart-card glass-card">
            <CircleChart
              value={expiringMembers}
              max={totalMembers || 100}
              label="Закінчуються (30 дн)"
              color="var(--text-secondary)"
            />
          </div>

          <div className="chart-card glass-card">
            <div className="metric-number">
              <div className="metric-value-large">{metrics?.mrr || 0}</div>
              <div className="metric-unit">EUR</div>
            </div>
            <div className="chart-label">MRR (місячний дохід)</div>
          </div>

          <div className="chart-card glass-card">
            <div className="metric-number">
              <div className="metric-value-large">{metrics?.total_revenue || 0}</div>
              <div className="metric-unit">EUR</div>
            </div>
            <div className="chart-label">Загальний дохід</div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="quick-actions">
          <button className="action-card glass-card" onClick={() => navigate('/memberships/create')}>
            <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="8" r="3" />
              <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
            </svg>
            <div className="action-title">Нове членство</div>
            <div className="action-desc">Додати клієнта</div>
          </button>

          <button className="action-card glass-card" onClick={() => navigate('/events/create')}>
            <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M8 3v4M16 3v4M3 10h18" />
            </svg>
            <div className="action-title">Нова подія</div>
            <div className="action-desc">Створити івент</div>
          </button>

          <button className="action-card glass-card" onClick={() => navigate('/bills/create')}>
            <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 3h9l4 4v14H6z" />
              <path d="M15 3v4h4M9 12h6M9 16h6" />
            </svg>
            <div className="action-title">Новий рахунок</div>
            <div className="action-desc">Додати витрати</div>
          </button>

          <button className="action-card glass-card" onClick={() => navigate('/directories')}>
            <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <div className="action-title">Довідники</div>
            <div className="action-desc">Контрагенти, тарифи</div>
          </button>
        </div>

        {/* System status */}
        <div className="system-status glass-card">
          <h2>Статус системи</h2>
          <div className="status-grid">
            <div className="status-item">
              <svg className="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Членства та тарифи</span>
            </div>
            <div className="status-item">
              <svg className="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Події та квитки</span>
            </div>
            <div className="status-item">
              <svg className="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Рахунки та платежі</span>
            </div>
            <div className="status-item">
              <svg className="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Контрагенти</span>
            </div>
            <div className="status-item">
              <svg className="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Товари та послуги</span>
            </div>
            <div className="status-item">
              <svg className="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Документи</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
