import React, { useState, useEffect } from 'react';
import transferService from '../services/transferService';
import DashboardLayout from '../components/layout/DashboardLayout';
import { usePageTitle } from '../context/PageTitleContext';

function TransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const { setPageTitle } = usePageTitle();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    from_account: '',
    to_account: '',
    amount: '',
    currency: 'EUR',
    transfer_date: new Date().toISOString().slice(0, 16),
    reference: '',
    notes: ''
  });

  useEffect(() => {
    setPageTitle('Перекази коштів');
    loadTransfers();
  }, []);

  const loadTransfers = async () => {
    try {
      setLoading(true);
      const data = await transferService.getAll();
      setTransfers(data);
    } catch (err) {
      console.error('Failed to load transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await transferService.create(form);
      setShowModal(false);
      loadTransfers();
      resetForm();
    } catch (err) {
      alert(`Помилка: ${err.message}`);
    }
  };

  const resetForm = () => {
    setForm({
      from_account: '',
      to_account: '',
      amount: '',
      currency: 'EUR',
      transfer_date: new Date().toISOString().slice(0, 16),
      reference: '',
      notes: ''
    });
  };

  if (loading) {
    return <DashboardLayout><div className="loading">Завантаження...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
    <div className="transfers-page" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1>Перекази коштів</h1>
        <button onClick={() => setShowModal(true)} className="btn-create">
          + Новий переказ
        </button>
      </div>

      <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Дата</th>
            <th>З рахунку</th>
            <th>На рахунок</th>
            <th>Сума</th>
            <th>Валюта</th>
            <th>Референс</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map((t) => (
            <tr key={t.id}>
              <td>{new Date(t.transfer_date).toLocaleString('uk-UA')}</td>
              <td>{t.from_account}</td>
              <td>{t.to_account}</td>
              <td>{t.amount}</td>
              <td>{t.currency}</td>
              <td>{t.reference || '—'}</td>
              <td>{t.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-solid" onClick={(e) => e.stopPropagation()}>
            <h2>Новий переказ</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>З рахунку</label>
                <input type="text" value={form.from_account} onChange={(e) => setForm({ ...form, from_account: e.target.value })} placeholder="Назва або номер рахунку" required />
              </div>

              <div className="form-group">
                <label>На рахунок</label>
                <input type="text" value={form.to_account} onChange={(e) => setForm({ ...form, to_account: e.target.value })} placeholder="Назва або номер рахунку" required />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Сума</label>
                  <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label>Валюта</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Дата і час</label>
                <input type="datetime-local" value={form.transfer_date} onChange={(e) => setForm({ ...form, transfer_date: e.target.value })} required />
              </div>

              <div className="form-group">
                <label>Референс (опціонально)</label>
                <input type="text" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Номер транзакції або референс" />
              </div>

              <div className="form-group">
                <label>Примітки</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Скасувати</button>
                <button type="submit" className="btn-primary">Створити</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}

export default TransfersPage;
