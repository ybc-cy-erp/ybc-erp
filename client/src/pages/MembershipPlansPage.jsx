import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { usePageTitle } from '../context/PageTitleContext';
import membershipPlanService from '../services/membershipPlanService';
import DashboardLayout from '../components/layout/DashboardLayout';
import PlanModal from '../components/memberships/PlanModal';
import '../styles/MembershipPlans.css';

export default function MembershipPlansPage({ embedded = false }) {
  const { user } = useContext(AuthContext);
  const { setPageTitle } = usePageTitle();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const isOwner = user?.role === 'Owner';

  useEffect(() => {
    if (!embedded) {
      setPageTitle('Тарифні плани');
    }
    loadPlans();
  }, [setPageTitle, embedded]);

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

  const filteredPlans = plans.filter((plan) => {
    if (searchQuery && !plan.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterStatus !== 'all' && plan.status !== filterStatus) {
      return false;
    }
    return true;
  });

  if (loading) {
    const content = (
      <div className="membership-plans">
        <div className="loading">Завантаження...</div>
      </div>
    );
    return embedded ? content : <DashboardLayout>{content}</DashboardLayout>;
  }

  const pageContent = (
    <div className="membership-plans">
      {/* Finder-style toolbar */}
      <div className="finder-toolbar glass-card">
        <div className="toolbar-left">
          <input
            type="text"
            placeholder="🔍 Пошук планів..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="finder-search"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="finder-filter"
          >
            <option value="all">Всі статуси</option>
            <option value="active">Активні</option>
            <option value="inactive">Неактивні</option>
          </select>
        </div>

        <div className="toolbar-right">
          <div className="view-mode-buttons">
            <button
              onClick={() => setViewMode('list')}
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              title="Список"
            >
              ☰
            </button>
            <button
              onClick={() => setViewMode('icon')}
              className={`view-btn ${viewMode === 'icon' ? 'active' : ''}`}
              title="Сітка"
            >
              ⊞
            </button>
          </div>
          {isOwner && (
            <button onClick={handleCreate} className="btn-primary">
              + Новий план
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className={`plans-grid view-${viewMode}`}>
          {filteredPlans.map(plan => (
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
  );

  return embedded ? pageContent : <DashboardLayout>{pageContent}</DashboardLayout>;
}
