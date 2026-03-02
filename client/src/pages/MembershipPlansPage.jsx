import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { usePageTitle } from '../context/PageTitleContext';
import membershipPlanService from '../services/membershipPlanService';
import DashboardLayout from '../components/layout/DashboardLayout';
import PlanModal from '../components/memberships/PlanModal';
import '../styles/MembershipPlans.css';

export default function MembershipPlansPage() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const { setPageTitle } = usePageTitle();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const isOwner = user?.role === 'Owner';

  useEffect(() => {
    setPageTitle('Тарифні плани');
  }, []);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await membershipPlanService.getAll();
      setPlans(response.data.plans);
      setError(null);
    } catch (err) {
      console.error('Failed to load plans:', err);
      setError('Не вдалося завантажити тарифні плани');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setShowModal(true);
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Видалити цей тарифний план?')) return;
    
    try {
      await membershipPlanService.delete(id);
      loadPlans();
    } catch (err) {
      alert(err.response?.data?.error || 'Помилка видалення');
    }
  };

  const handleModalClose = (saved) => {
    setShowModal(false);
    setEditingPlan(null);
    if (saved) loadPlans();
  };

  const getPlanTypeName = (type) => {
    const types = {
      monthly: 'Місячний',
      quarterly: 'Квартальний',
      annual: 'Річний',
      lifetime: 'Довічний',
      custom: 'Індивідуальний'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="membership-plans">
          <div className="loading">Завантаження...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="membership-plans">
        <div className="page-header">
          {isOwner && (
            <button onClick={handleCreate} className="btn-primary">
              + Створити план
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="plans-grid">
          {plans.map(plan => (
            <div key={plan.id} className={`plan-card glass-card ${plan.status}`}>
              <div className="plan-header">
                <h3>{plan.name}</h3>
                <span className="plan-type">
                  {getPlanTypeName(plan.type)}
                </span>
              </div>

              <div className="plan-details">
                <div className="plan-price">
                  <span className="price-value">{plan.daily_rate}</span>
                  <span className="price-unit">EUR/день</span>
                </div>

                {plan.duration_days && (
                  <div className="plan-duration">
                    Тривалість: {plan.duration_days} днів
                  </div>
                )}

                {plan.type === 'lifetime' && (
                  <div className="plan-duration lifetime">
                    Довічний доступ
                  </div>
                )}

                <div className={`plan-status ${plan.status}`}>
                  {plan.status === 'active' ? 'Активний' : 'Неактивний'}
                </div>
              </div>

              {isOwner && (
                <div className="plan-actions">
                  <button onClick={() => handleEdit(plan)} className="btn-edit">
                    Редагувати
                  </button>
                  <button onClick={() => handleDelete(plan.id)} className="btn-delete">
                    Видалити
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {plans.length === 0 && !loading && (
          <div className="empty-state glass-card">
            <p>Тарифні плани відсутні</p>
            {isOwner && (
              <button onClick={handleCreate} className="btn-primary">
                Створити перший план
              </button>
            )}
          </div>
        )}

        {showModal && (
          <PlanModal
            plan={editingPlan}
            onClose={handleModalClose}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
