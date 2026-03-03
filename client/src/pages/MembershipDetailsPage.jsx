import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import membershipService from '../services/membershipService';
import membershipPlanService from '../services/membershipPlanService';
import FreezeModal from '../components/FreezeModal';
import DashboardLayout from '../components/layout/DashboardLayout';
import './MembershipDetails.css';

function MembershipDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [membership, setMembership] = useState(null);
  const [plan, setPlan] = useState(null);
  const [freezes, setFreezes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFreezeModal, setShowFreezeModal] = useState(false);

  useEffect(() => {
    loadMembershipData();
  }, [id]);

  const loadMembershipData = async () => {
    try {
      setLoading(true);
      const [membershipData, freezesData] = await Promise.all([
        membershipService.getById(id),
        membershipService.getFreezes(id)
      ]);

      setMembership(membershipData);
      setFreezes(freezesData);

      // Load plan details
      if (membershipData.plan_id) {
        const planData = await membershipPlanService.getById(membershipData.plan_id);
        setPlan(planData);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to load membership:', err);
      setError(err.message || 'Помилка завантаження даних');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFreeze = async (freezeData) => {
    try {
      await membershipService.createFreeze(id, freezeData);
      await loadMembershipData(); // Reload to get updated data
      setShowFreezeModal(false);
    } catch (err) {
      alert(`Помилка створення заморозки: ${err.message}`);
    }
  };

  const handleRemoveFreeze = async (freezeId) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цю заморозку?')) {
      return;
    }

    try {
      await membershipService.removeFreeze(id, freezeId);
      await loadMembershipData();
    } catch (err) {
      alert(`Помилка видалення заморозки: ${err.message}`);
    }
  };

  const handleCancelMembership = async () => {
    if (!window.confirm('Ви впевнені, що хочете скасувати це членство?')) {
      return;
    }

    try {
      await membershipService.cancel(id);
      navigate('/memberships');
    } catch (err) {
      alert(`Помилка скасування: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('uk-UA');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Активне', className: 'status-active' },
      frozen: { label: 'Заморожено', className: 'status-frozen' },
      expired: { label: 'Закінчилось', className: 'status-expired' },
      cancelled: { label: 'Скасовано', className: 'status-cancelled' }
    };

    const config = statusConfig[status] || { label: status, className: '' };
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  if (loading) {
    return (
      <DashboardLayout>
      <div className="membership-details-page">
        <div className="loading">Завантаження...</div>
      </div>
      </DashboardLayout>
    );
  }

  if (error || !membership) {
    return (
      <DashboardLayout>
      <div className="membership-details-page">
        <div className="error-message">
          <p>❌ {error || 'Членство не знайдено'}</p>
          <button onClick={() => navigate('/memberships')} className="btn-back">
            Назад до списку
          </button>
        </div>
      </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="membership-details-page">
      <div className="page-header">
        <div className="header-left">
          <button onClick={() => navigate('/memberships')} className="btn-back-arrow">
            ← Назад
          </button>
          <h1>Деталі членства</h1>
        </div>
        <div className="header-actions">
          {membership.status === 'active' && (
            <>
              <button
                onClick={() => navigate(`/memberships/${id}/edit`)}
                className="btn-edit"
              >
                ✏️ Редагувати
              </button>
              <button
                onClick={handleCancelMembership}
                className="btn-cancel"
              >
                ❌ Скасувати
              </button>
            </>
          )}
        </div>
      </div>

      <div className="details-grid">
        {/* Main Info Card */}
        <div className="details-card glass-card">
          <h2>Основна інформація</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Клієнт:</span>
              <span className="info-value">{membership.customer_name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Статус:</span>
              <span className="info-value">{getStatusBadge(membership.status)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Тарифний план:</span>
              <span className="info-value">{plan?.name || '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Дата початку:</span>
              <span className="info-value">{formatDate(membership.start_date)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Дата закінчення:</span>
              <span className="info-value">{formatDate(membership.end_date)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Сума:</span>
              <span className="info-value amount">€{membership.amount?.toFixed(2) || '0.00'}</span>
            </div>
            {plan && (
              <>
                <div className="info-item">
                  <span className="info-label">Денна ставка:</span>
                  <span className="info-value">€{plan.daily_rate}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Тип плану:</span>
                  <span className="info-value">{plan.type}</span>
                </div>
              </>
            )}
          </div>
          {membership.notes && (
            <div className="notes-section">
              <h3>Примітки</h3>
              <p>{membership.notes}</p>
            </div>
          )}
        </div>

        {/* Freezes Card */}
        <div className="freezes-card glass-card">
          <div className="card-header">
            <h2>Заморозки членства</h2>
            {membership.status === 'active' && (
              <button
                onClick={() => setShowFreezeModal(true)}
                className="btn-add-freeze"
              >
                + Додати заморозку
              </button>
            )}
          </div>

          {freezes.length === 0 ? (
            <div className="empty-state">
              <p> Заморозок немає</p>
              {membership.status === 'active' && (
                <p className="hint">Натисніть "Додати заморозку" щоб створити</p>
              )}
            </div>
          ) : (
            <div className="freezes-list">
              {freezes.map((freeze) => (
                <div key={freeze.id} className="freeze-item">
                  <div className="freeze-dates">
                    <div className="freeze-date">
                      <span className="date-label">Початок:</span>
                      <span className="date-value">{formatDate(freeze.start_date)}</span>
                    </div>
                    <div className="freeze-separator">→</div>
                    <div className="freeze-date">
                      <span className="date-label">Кінець:</span>
                      <span className="date-value">{formatDate(freeze.end_date)}</span>
                    </div>
                  </div>
                  <div className="freeze-duration">
                    <span className="duration-badge">
                      {freeze.duration_days} {freeze.duration_days === 1 ? 'день' : 'днів'}
                    </span>
                  </div>
                  {membership.status === 'active' && (
                    <button
                      onClick={() => handleRemoveFreeze(freeze.id)}
                      className="btn-remove-freeze"
                      title="Видалити заморозку"
                    >
                      
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {freezes.length > 0 && (
            <div className="freezes-summary">
              <strong>Загальна тривалість заморозок:</strong>{' '}
              {freezes.reduce((sum, f) => sum + f.duration_days, 0)} днів
            </div>
          )}
        </div>
      </div>

      {showFreezeModal && (
        <FreezeModal
          membershipId={id}
          onSave={handleCreateFreeze}
          onClose={() => setShowFreezeModal(false)}
        />
      )}
    </div>
    </DashboardLayout>
  );
}

export default MembershipDetailsPage;
