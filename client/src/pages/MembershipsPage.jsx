import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import membershipService from '../services/membershipService';
import membershipPlanService from '../services/membershipPlanService';
import DashboardLayout from '../components/layout/DashboardLayout';
import { usePageTitle } from '../context/PageTitleContext';
import './Memberships.css';

function MembershipsPage() {
  const navigate = useNavigate();
  const { setPageTitle } = usePageTitle();
  const [memberships, setMemberships] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  useEffect(() => {
    setPageTitle('Членства');
    loadData();
  }, [setPageTitle]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [membershipsData, plansData] = await Promise.all([
        membershipService.getAll(),
        membershipPlanService.getAll()
      ]);
      
      console.log('Memberships loaded:', membershipsData);
      console.log('Plans loaded:', plansData);
      
      setMemberships(Array.isArray(membershipsData) ? membershipsData : []);
      setPlans(Array.isArray(plansData?.data?.plans) ? plansData.data.plans : []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Помилка завантаження даних');
      setMemberships([]);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (membershipId) => {
    if (!window.confirm('Ви впевнені, що хочете скасувати це членство?')) {
      return;
    }

    try {
      await membershipService.cancel(membershipId);
      await loadData();
    } catch (err) {
      alert(`Помилка скасування: ${err.message}`);
    }
  };

  // Filter memberships
  const filteredMemberships = Array.isArray(memberships) ? memberships.filter(membership => {
    if (!membership) return false;
    
    // Search by customer name
    if (searchTerm && !membership.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filter by status
    if (statusFilter !== 'all' && membership.status !== statusFilter) {
      return false;
    }

    // Filter by plan
    if (planFilter !== 'all' && membership.plan_id !== planFilter) {
      return false;
    }

    return true;
  }) : [];

  const getPlanName = (planId) => {
    if (!planId || !Array.isArray(plans)) return '—';
    const plan = plans.find(p => p && p.id === planId);
    return plan?.name || '—';
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
      <div className="memberships-page">
        <div className="loading">Завантаження...</div>
      </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
      <div className="memberships-page">
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={loadData} className="btn-retry">Спробувати знову</button>
        </div>
      </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="memberships-page">
      <div className="page-header">
        
        <button 
          onClick={() => navigate('/memberships/create')}
          className="btn-create"
        >
          + Створити членство
        </button>
      </div>

      <div className="filters-panel glass-card">
        <div className="filter-group">
          <label>🔍 Пошук по клієнту</label>
          <input
            type="text"
            placeholder="Введіть ім'я клієнта..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>Статус</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Всі</option>
            <option value="active">Активні</option>
            <option value="frozen">Заморожені</option>
            <option value="expired">Закінчились</option>
            <option value="cancelled">Скасовані</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Тарифний план</label>
          <select 
            value={planFilter} 
            onChange={(e) => setPlanFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Всі плани</option>
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>
        </div>

        {(searchTerm || statusFilter !== 'all' || planFilter !== 'all') && (
          <button 
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setPlanFilter('all');
            }}
            className="btn-clear-filters"
          >
            Очистити фільтри
          </button>
        )}
      </div>

      <div className="memberships-count">
        Знайдено членств: <strong>{filteredMemberships.length}</strong> з {memberships.length}
      </div>

      {filteredMemberships.length === 0 ? (
        <div className="empty-state glass-card">
          <p> Членства не знайдені</p>
          {(searchTerm || statusFilter !== 'all' || planFilter !== 'all') && (
            <p className="hint">Спробуйте змінити фільтри</p>
          )}
        </div>
      ) : (
        <div className="memberships-table-wrapper glass-card">
          <table className="memberships-table">
            <thead>
              <tr>
                <th>Клієнт</th>
                <th>Тарифний план</th>
                <th>Статус</th>
                <th>Дата початку</th>
                <th>Дата закінчення</th>
                <th>Сума (EUR)</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {filteredMemberships.map(membership => (
                <tr key={membership.id}>
                  <td className="customer-name">{membership.customer_name || '—'}</td>
                  <td>{getPlanName(membership.plan_id)}</td>
                  <td>{getStatusBadge(membership.status)}</td>
                  <td>{formatDate(membership.start_date)}</td>
                  <td>{formatDate(membership.end_date)}</td>
                  <td className="amount">€{membership.amount?.toFixed(2) || '0.00'}</td>
                  <td className="actions">
                    <button 
                      onClick={() => navigate(`/memberships/${membership.id}`)}
                      className="btn-action btn-view"
                      title="Переглянути"
                    >
                      👁️
                    </button>
                    {membership.status === 'active' && (
                      <>
                        <button 
                          onClick={() => navigate(`/memberships/${membership.id}/edit`)}
                          className="btn-action btn-edit"
                          title="Редагувати"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleCancel(membership.id)}
                          className="btn-action btn-cancel"
                          title="Скасувати"
                        >
                          ❌
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}

export default MembershipsPage;
