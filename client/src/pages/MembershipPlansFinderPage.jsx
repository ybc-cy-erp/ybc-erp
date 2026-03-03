import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { usePageTitle } from '../context/PageTitleContext';
import membershipPlanService from '../services/membershipPlanService';
import DashboardLayout from '../components/layout/DashboardLayout';
import PlanModal from '../components/memberships/PlanModal';
import './MembershipPlansFinder.css';

export default function MembershipPlansFinderPage({ embedded = false }) {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const { setPageTitle } = usePageTitle();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [viewMode, setViewMode] = useState('icon');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(null);

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
      setPlans(response?.data?.plans || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load plans:', err);
      setError('Помилка завантаження тарифних планів');
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

  const planTypes = [
    { id: null, name: 'Всі плани' },
    { id: 'monthly', name: 'Місячні' },
    { id: 'quarterly', name: 'Квартальні' },
    { id: 'annual', name: 'Річні' },
    { id: 'lifetime', name: 'Довічні' },
  ];

  const filteredPlans = plans.filter((plan) => {
    if (searchQuery && !plan.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedType && plan.type !== selectedType) {
      return false;
    }
    return true;
  });

  const pageContent = (
    <div className="plans-finder-page">
      {/* Toolbar */}
      <div className="pf-toolbar">
        <div className="pf-toolbar-left">
          <h1>Тарифні плани</h1>
        </div>
        <div className="pf-toolbar-center">
          <input
            type="text"
            placeholder="Пошук..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pf-search"
          />
        </div>
        <div className="pf-toolbar-right">
          <div className="pf-view-switcher">
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
              title="Список"
            >
              ☰
            </button>
            <button
              className={viewMode === 'icon' ? 'active' : ''}
              onClick={() => setViewMode('icon')}
              title="Сітка"
            >
              ⊞
            </button>
          </div>
          {isOwner && (
            <button className="btn-primary" onClick={handleCreate}>
              + Новий
            </button>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="pf-main">
        {/* Sidebar with type filters */}
        <div className="pf-sidebar">
          <div className="pf-sidebar-header">
            <h3>Типи</h3>
          </div>
          <ul className="pf-type-list">
            {planTypes.map((type) => (
              <li
                key={type.id || 'all'}
                className={selectedType === type.id ? 'active' : ''}
                onClick={() => setSelectedType(type.id)}
              >
                {type.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Content area */}
        <div className="pf-content">
          {loading ? (
            <div>Завантаження...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : viewMode === 'list' ? (
            <table className="pf-table">
              <thead>
                <tr>
                  <th>Назва</th>
                  <th>Тип</th>
                  <th>Ставка/день</th>
                  <th>Тривалість</th>
                  <th>Статус</th>
                  <th>Дії</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Тарифні плани відсутні
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map((plan) => (
                    <tr key={plan.id}>
                      <td><strong>{plan.name}</strong></td>
                      <td>{getPlanTypeName(plan.type)}</td>
                      <td>{plan.daily_rate} EUR</td>
                      <td>{plan.duration_days ? `${plan.duration_days} днів` : '—'}</td>
                      <td>
                        <span className={`plan-status ${plan.status}`}>
                          {plan.status === 'active' ? 'Активний' : 'Неактивний'}
                        </span>
                      </td>
                      <td>
                        {isOwner && (
                          <div className="pf-actions">
                            <button onClick={() => handleEdit(plan)} className="btn-edit">
                              Редагувати
                            </button>
                            <button onClick={() => handleDelete(plan.id)} className="btn-delete">
                              Видалити
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <div className="pf-grid">
              {filteredPlans.length === 0 ? (
                <div className="empty-state">
                  <p>Тарифні плани відсутні</p>
                  {isOwner && (
                    <button onClick={handleCreate} className="btn-primary">
                      Створити перший план
                    </button>
                  )}
                </div>
              ) : (
                filteredPlans.map((plan) => (
                  <div key={plan.id} className={`plan-card ${plan.status}`}>
                    <div className="plan-card-header">
                      <h3>{plan.name}</h3>
                      <span className="plan-type-badge">
                        {getPlanTypeName(plan.type)}
                      </span>
                    </div>
                    
                    <div className="plan-card-body">
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
                      <div className="plan-card-footer">
                        <button onClick={() => handleEdit(plan)} className="btn-edit">
                          Редагувати
                        </button>
                        <button onClick={() => handleDelete(plan.id)} className="btn-delete">
                          Видалити
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

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
