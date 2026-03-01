import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { membershipService } from '../services/membershipService';
import DashboardLayout from '../components/layout/DashboardLayout';
import MembershipModal from '../components/memberships/MembershipModal';
import '../styles/Memberships.css';

export default function MembershipsPage() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMembership, setEditingMembership] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const canCreateEdit = ['Owner', 'Manager'].includes(user?.role);

  useEffect(() => {
    loadMemberships();
  }, [statusFilter]);

  const loadMemberships = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      
      const response = await membershipService.getAll(params);
      setMemberships(response.data.memberships);
      setError(null);
    } catch (err) {
      console.error('Failed to load memberships:', err);
      setError('Не вдалося завантажити членства');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadMemberships();
  };

  const handleCreate = () => {
    setEditingMembership(null);
    setShowModal(true);
  };

  const handleEdit = (membership) => {
    setEditingMembership(membership);
    setShowModal(true);
  };

  const handleModalClose = (saved) => {
    setShowModal(false);
    setEditingMembership(null);
    if (saved) loadMemberships();
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'green',
      frozen: 'blue',
      cancelled: 'gray',
      expired: 'red'
    };
    return colors[status] || 'gray';
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Активне',
      frozen: 'Заморожене',
      cancelled: 'Скасоване',
      expired: 'Закінчилося'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не встановлено';
    return new Date(dateString).toLocaleDateString('uk-UA');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="memberships">
          <div className="loading">Завантаження...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="memberships">
        <div className="page-header">
          <h1>Членства</h1>
          {canCreateEdit && (
            <button onClick={handleCreate} className="btn-primary">
              + Створити членство
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="filters glass-card">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Пошук по клієнту..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn-search">Шукати</button>
          </form>

          <div className="filter-group">
            <label>Статус:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Всі</option>
              <option value="active">Активні</option>
              <option value="frozen">Заморожені</option>
              <option value="cancelled">Скасовані</option>
              <option value="expired">Закінчилися</option>
            </select>
          </div>
        </div>

        <div className="memberships-table glass-card">
          <table>
            <thead>
              <tr>
                <th>Клієнт</th>
                <th>План</th>
                <th>Початок</th>
                <th>Закінчення</th>
                <th>Статус</th>
                <th>Сума</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {memberships.map(membership => (
                <tr key={membership.id} className={`status-${membership.status}`}>
                  <td>
                    <div className="client-info">
                      <strong>{membership.client_name || membership.user?.name || 'Не вказано'}</strong>
                      {membership.user?.email && (
                        <small>{membership.user.email}</small>
                      )}
                    </div>
                  </td>
                  <td>{membership.plan?.name || 'Без плану'}</td>
                  <td>{formatDate(membership.start_date)}</td>
                  <td>{formatDate(membership.end_date)}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(membership.status)}`}>
                      {getStatusLabel(membership.status)}
                    </span>
                  </td>
                  <td>
                    {membership.payment_amount} {membership.payment_currency}
                  </td>
                  <td>
                    {canCreateEdit && (
                      <button onClick={() => handleEdit(membership)} className="btn-small">
                        Деталі
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {memberships.length === 0 && (
            <div className="empty-table">
              <p>Членства відсутні</p>
              {canCreateEdit && (
                <button onClick={handleCreate} className="btn-primary">
                  Створити перше членство
                </button>
              )}
            </div>
          )}
        </div>

        {showModal && (
          <MembershipModal
            membership={editingMembership}
            onClose={handleModalClose}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
