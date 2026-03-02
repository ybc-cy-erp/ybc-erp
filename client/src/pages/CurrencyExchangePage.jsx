import React, { useState, useEffect } from 'react';
import currencyExchangeService from '../services/currencyExchangeService';
import DashboardLayout from '../components/layout/DashboardLayout';

function CurrencyExchangePage() {
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    from_currency: 'EUR',
    to_currency: 'USD',
    from_amount: '',
    to_amount: '',
    exchange_rate: '',
    exchange_date: new Date().toISOString().slice(0, 16),
    notes: ''
  });

  useEffect(() => {
    loadExchanges();
  }, []);

  const loadExchanges = async () => {
    try {
      setLoading(true);
      const data = await currencyExchangeService.getAll();
      setExchanges(data);
    } catch (err) {
      console.error('Failed to load exchanges:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await currencyExchangeService.create(form);
      setShowModal(false);
      loadExchanges();
      resetForm();
    } catch (err) {
      alert(`Помилка: ${err.message}`);
    }
  };

  const resetForm = () => {
    setForm({
      from_currency: 'EUR',
      to_currency: 'USD',
      from_amount: '',
      to_amount: '',
      exchange_rate: '',
      exchange_date: new Date().toISOString().slice(0, 16),
      notes: ''
    });
  };

  const handleRateChange = () => {
    if (form.from_amount && form.exchange_rate) {
      setForm({ ...form, to_amount: (parseFloat(form.from_amount) * parseFloat(form.exchange_rate)).toFixed(2) });
    }
  };

  if (loading) {
    return <DashboardLayout><div className="loading">Завантаження...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
    <div className="currency-exchange-page" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1>Обмін валют</h1>
        <button onClick={() => setShowModal(true)} className="btn-create">
          + Новий обмін
        </button>
      </div>

      <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Дата</th>
            <th>З валюти</th>
            <th>В валюту</th>
            <th>Сума</th>
            <th>Курс</th>
            <th>Отримано</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {exchanges.map((ex) => (
            <tr key={ex.id}>
              <td>{new Date(ex.exchange_date).toLocaleString('uk-UA')}</td>
              <td>{ex.from_currency}</td>
              <td>{ex.to_currency}</td>
              <td>{ex.from_amount}</td>
              <td>{ex.exchange_rate}</td>
              <td>{ex.to_amount}</td>
              <td>{ex.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-solid" onClick={(e) => e.stopPropagation()}>
            <h2>Новий обмін валют</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>З валюти</label>
                  <select value={form.from_currency} onChange={(e) => setForm({ ...form, from_currency: e.target.value })}>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
                    <option value="USDT">USDT</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>В валюту</label>
                  <select value={form.to_currency} onChange={(e) => setForm({ ...form, to_currency: e.target.value })}>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
                    <option value="USDT">USDT</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Сума ({form.from_currency})</label>
                <input type="number" step="0.01" value={form.from_amount} onChange={(e) => { setForm({ ...form, from_amount: e.target.value }); handleRateChange(); }} required />
              </div>

              <div className="form-group">
                <label>Курс обміну</label>
                <input type="number" step="0.000001" value={form.exchange_rate} onChange={(e) => { setForm({ ...form, exchange_rate: e.target.value }); handleRateChange(); }} required />
              </div>

              <div className="form-group">
                <label>Отримано ({form.to_currency})</label>
                <input type="number" step="0.01" value={form.to_amount} onChange={(e) => setForm({ ...form, to_amount: e.target.value })} required />
              </div>

              <div className="form-group">
                <label>Дата і час</label>
                <input type="datetime-local" value={form.exchange_date} onChange={(e) => setForm({ ...form, exchange_date: e.target.value })} required />
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

export default CurrencyExchangePage;
