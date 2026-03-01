import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import billService from '../services/billService';
import './Bills.css';

function BillsPage() {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadBills();
  }, [statusFilter]);

  const loadBills = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const data = await billService.getAll(params);
      setBills(data);
    } catch (err) {
      console.error('Failed to load bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await billService.approve(id);
      await loadBills();
    } catch (err) {
      alert(`Помилка: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uk-UA');
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { label: 'Чернетка', className: 'status-draft' },
      approved: { label: 'Затверджено', className: 'status-approved' },
      paid: { label: 'Сплачено', className: 'status-paid' }
    };
    const { label, className } = config[status] || {};
    return <span className={`status-badge ${className}`}>{label}</span>;
  };

  if (loading) {
    return <div className="bills-page"><div className="loading">Завантаження...</div></div>;
  };

  return (
    <div className="bills-page">
      <div className="page-header">
        <h1>Рахунки</h1>
        <button onClick={() => navigate('/bills/create')} className="btn-create">
          + Створити рахунок
        </button>
      </div>

      <div className="filters-panel glass-card">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Всі статуси</option>
          <option value="draft">Чернетки</option>
          <option value="approved">Затверджено</option>
          <option value="paid">Сплачено</option>
        </select>
      </div>

      <div className="bills-table-wrapper glass-card">
        <table className="bills-table">
          <thead>
            <tr>
              <th>№ Рахунку</th>
              <th>Постачальник</th>
              <th>Дата рахунку</th>
              <th>Термін оплати</th>
              <th>Сума</th>
              <th>Статус</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {bills.map(bill => (
              <tr key={bill.id}>
                <td className="bill-number">{bill.bill_number}</td>
                <td>{bill.vendor_name}</td>
                <td>{formatDate(bill.bill_date)}</td>
                <td>{formatDate(bill.due_date)}</td>
                <td className="amount">€{parseFloat(bill.amount).toFixed(2)}</td>
                <td>{getStatusBadge(bill.status)}</td>
                <td className="actions">
                  <button onClick={() => navigate(`/bills/${bill.id}`)} className="btn-action">
                    Деталі
                  </button>
                  {bill.status === 'draft' && (
                    <button onClick={() => handleApprove(bill.id)} className="btn-approve">
                      Затвердити
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {bills.length === 0 && (
        <div className="empty-state glass-card">
          <p>📋 Рахунків не знайдено</p>
        </div>
      )}
    </div>
  );
}

export default BillsPage;
