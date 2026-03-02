import React, { useState, useEffect } from 'react';
import { usePageTitle } from '../context/PageTitleContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import cashDocumentService from '../services/cashDocumentService';
import counterpartyService from '../services/counterpartyService';
import accountService from '../services/accountService';

function CashDocumentsPage() {
  const { setPageTitle } = usePageTitle();
  const [documents, setDocuments] = useState([]);
  const [counterparties, setCounterparties] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    doc_type: 'PKO',
    counterparty_id: '',
    account_id: '',
    doc_date: new Date().toISOString().slice(0, 10),
    amount: '',
    currency: 'EUR',
    purpose: '',
  });

  useEffect(() => {
    setPageTitle('ПКО / РКО');
    loadData();
  }, [filter, setPageTitle]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsData, cpData, accData] = await Promise.all([
        cashDocumentService.getAll(filter !== 'all' ? { doc_type: filter } : {}),
        counterpartyService.getAll(),
        accountService.getAll(),
      ]);
      setDocuments(docsData);
      setCounterparties(cpData || []);
      setAccounts(accData || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await cashDocumentService.create(form);
      setShowModal(false);
      setForm({
        doc_type: 'PKO',
        counterparty_id: '',
        account_id: '',
        doc_date: new Date().toISOString().slice(0, 10),
        amount: '',
        currency: 'EUR',
        purpose: '',
      });
      loadData();
    } catch (err) {
      alert(`Помилка: ${err.message}`);
    }
  };

  const handlePost = async (id) => {
    try {
      await cashDocumentService.post(id);
      loadData();
    } catch (err) {
      alert(`Помилка: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Видалити документ?')) return;
    try {
      await cashDocumentService.delete(id);
      loadData();
    } catch (err) {
      alert(`Помилка: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading">Завантаження...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Новий документ
          </button>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '7px' }}>
            <option value="all">Всі документи</option>
            <option value="PKO">ПКО (Прихід)</option>
            <option value="RKO">РКО (Витрата)</option>
          </select>
        </div>

        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Номер</th>
                <th>Тип</th>
                <th>Дата</th>
                <th>Контрагент</th>
                <th>Рахунок</th>
                <th>Сума</th>
                <th>Призначення</th>
                <th>Статус</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{doc.doc_number}</td>
                  <td><span className="badge">{doc.doc_type}</span></td>
                  <td>{new Date(doc.doc_date).toLocaleDateString('uk-UA')}</td>
                  <td style={{ fontSize: '13px' }}>{doc.counterparty_name || '—'}</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{doc.account_name || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{doc.amount} {doc.currency}</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{doc.notes || '—'}</td>
                  <td><span className="status-badge">{doc.status === 'posted' ? 'Проведено' : 'Чернетка'}</span></td>
                  <td>
                    {doc.status === 'draft' && (
                      <>
                        <button onClick={() => handlePost(doc.id)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', marginRight: '6px' }}>
                          Провести
                        </button>
                        <button onClick={() => handleDelete(doc.id)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                          Видалити
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {documents.length === 0 && (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', marginTop: '20px' }}>
            Документи не знайдено
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content modal-solid" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <h2 style={{ marginBottom: '20px' }}>Новий касовий документ</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Тип документу</label>
                  <select value={form.doc_type} onChange={(e) => setForm({ ...form, doc_type: e.target.value })}>
                    <option value="PKO">ПКО (Прихід готівки)</option>
                    <option value="RKO">РКО (Витрата готівки)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Контрагент</label>
                  <select value={form.counterparty_id} onChange={(e) => setForm({ ...form, counterparty_id: e.target.value })}>
                    <option value="">Не вибрано</option>
                    {counterparties.map((cp) => (
                      <option key={cp.id} value={cp.id}>{cp.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Рахунок</label>
                  <select value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })} required>
                    <option value="">Виберіть рахунок</option>
                    {accounts.filter(a => a.account_type === 'cash').length > 0 && (
                      <optgroup label="💵 Готівка">
                        {accounts.filter(a => a.account_type === 'cash').map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.account_name} ({acc.currency}) - Баланс: {Number(acc.balance || 0).toFixed(2)}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {accounts.filter(a => a.account_type === 'bank').length > 0 && (
                      <optgroup label="🏦 Банк">
                        {accounts.filter(a => a.account_type === 'bank').map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.account_name} ({acc.currency}) - Баланс: {Number(acc.balance || 0).toFixed(2)}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {accounts.filter(a => a.account_type === 'crypto').length > 0 && (
                      <optgroup label="🪙 Крипто">
                        {accounts.filter(a => a.account_type === 'crypto').map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.account_name} ({acc.network}) - Баланс: {Number(acc.balance || 0).toFixed(2)}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Дата</label>
                    <input type="date" value={form.doc_date} onChange={(e) => setForm({ ...form, doc_date: e.target.value })} required />
                  </div>

                  <div className="form-group">
                    <label>Валюта</label>
                    <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Сума</label>
                  <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label>Призначення платежу</label>
                  <textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} rows={3} placeholder="Опис..." />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
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

export default CashDocumentsPage;
