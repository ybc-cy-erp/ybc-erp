import { useState, useEffect } from 'react';
import { usePageTitle } from '../context/PageTitleContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import accountService from '../services/accountService';
import './AccountsPage.css';

export default function AccountsPage() {
  const { setPageTitle } = usePageTitle();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    account_type: 'cash',
    account_name: '',
    currency: 'EUR',
    balance: '0',
    bank_name: '',
    bank_account_number: '',
    network: 'ethereum',
    wallet_address: '',
  });

  useEffect(() => {
    setPageTitle('Рахунки');
    loadAccounts();
  }, [setPageTitle]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountService.getAll();
      setAccounts(data);
    } catch (err) {
      console.error(err);
      alert(`Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await accountService.update(editingId, form);
      } else {
        await accountService.create(form);
      }
      setShowModal(false);
      setEditingId(null);
      resetForm();
      loadAccounts();
    } catch (err) {
      alert(`Помилка: ${err.message}`);
    }
  };

  const handleEdit = (account) => {
    setEditingId(account.id);
    setForm({
      account_type: account.account_type,
      account_name: account.account_name,
      currency: account.currency || 'EUR',
      balance: String(account.balance || 0),
      bank_name: account.bank_name || '',
      bank_account_number: account.bank_account_number || '',
      network: account.network || 'ethereum',
      wallet_address: account.wallet_address || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Ви впевнені, що хочете видалити цей рахунок?')) return;
    try {
      await accountService.delete(id);
      loadAccounts();
    } catch (err) {
      alert(`Помилка: ${err.message}`);
    }
  };

  const resetForm = () => {
    setForm({
      account_type: 'cash',
      account_name: '',
      currency: 'EUR',
      balance: '0',
      bank_name: '',
      bank_account_number: '',
      network: 'ethereum',
      wallet_address: '',
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'cash': return '';
      case 'bank': return '';
      case 'crypto': return '';
      default: return '';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'cash': return 'Готівка';
      case 'bank': return 'Банк';
      case 'crypto': return 'Крипто';
      default: return type;
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
      <div className="accounts-page">
        <div className="page-header">
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-create">
            + Створити рахунок
          </button>
        </div>

        <div className="accounts-grid">
          {accounts.length === 0 ? (
            <div className="empty-state glass-card">
              <p> Рахунки не знайдені</p>
              <p className="hint">Створіть перший рахунок для обліку грошей</p>
            </div>
          ) : (
            accounts.map((account) => (
              <div key={account.id} className="account-card glass-card">
                <div className="account-header">
                  <div className="account-icon">{getTypeIcon(account.account_type)}</div>
                  <div className="account-info">
                    <h3>{account.account_name}</h3>
                    <span className="badge">{getTypeLabel(account.account_type)}</span>
                  </div>
                </div>

                <div className="account-balance">
                  <div className="balance-label">Баланс</div>
                  <div className="balance-amount">
                    {Number(account.balance || 0).toFixed(2)} {account.currency}
                  </div>
                </div>

                {account.account_type === 'bank' && (
                  <div className="account-details">
                    <div className="detail-row">
                      <span className="detail-label">Банк:</span>
                      <span className="detail-value">{account.bank_name || '—'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Рахунок:</span>
                      <span className="detail-value">{account.bank_account_number || '—'}</span>
                    </div>
                  </div>
                )}

                {account.account_type === 'crypto' && (
                  <div className="account-details">
                    <div className="detail-row">
                      <span className="detail-label">Мережа:</span>
                      <span className="detail-value">{account.network || '—'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Адреса:</span>
                      <span className="detail-value" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                        {account.wallet_address ? `${account.wallet_address.slice(0, 8)}...${account.wallet_address.slice(-6)}` : '—'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="account-actions">
                  <button onClick={() => handleEdit(account)} className="btn-action btn-edit">
                    Редагувати
                  </button>
                  <button onClick={() => handleDelete(account.id)} className="btn-action btn-delete">
                    Видалити
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingId(null); }}>
            <div className="modal-content modal-solid" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <h2>{editingId ? 'Редагувати рахунок' : 'Новий рахунок'}</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Тип рахунку</label>
                  <select 
                    value={form.account_type} 
                    onChange={(e) => setForm({ ...form, account_type: e.target.value })}
                    disabled={!!editingId}
                  >
                    <option value="cash"> Готівка</option>
                    <option value="bank"> Банківський рахунок</option>
                    <option value="crypto"> Криптогаманець</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Назва рахунку *</label>
                  <input
                    type="text"
                    value={form.account_name}
                    onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                    placeholder="Основна каса"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Валюта</label>
                    <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                      <option value="BTC">BTC</option>
                      <option value="ETH">ETH</option>
                      <option value="USDT">USDT</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Початковий баланс</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.balance}
                      onChange={(e) => setForm({ ...form, balance: e.target.value })}
                      disabled={!!editingId}
                    />
                  </div>
                </div>

                {form.account_type === 'bank' && (
                  <>
                    <div className="form-group">
                      <label>Назва банку</label>
                      <input
                        type="text"
                        value={form.bank_name}
                        onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                        placeholder="Приватбанк"
                      />
                    </div>
                    <div className="form-group">
                      <label>Номер рахунку</label>
                      <input
                        type="text"
                        value={form.bank_account_number}
                        onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
                        placeholder="UA000000000000000000000000000"
                      />
                    </div>
                  </>
                )}

                {form.account_type === 'crypto' && (
                  <>
                    <div className="form-group">
                      <label>Мережа</label>
                      <select value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })}>
                        <option value="ethereum">Ethereum</option>
                        <option value="bsc">Binance Smart Chain (BSC)</option>
                        <option value="tron">Tron</option>
                        <option value="bitcoin">Bitcoin</option>
                        <option value="arbitrum">Arbitrum</option>
                        <option value="optimism">Optimism</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Адреса гаманця</label>
                      <input
                        type="text"
                        value={form.wallet_address}
                        onChange={(e) => setForm({ ...form, wallet_address: e.target.value })}
                        placeholder="0x..."
                      />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button type="submit" className="btn-primary">
                    {editingId ? 'Зберегти' : 'Створити'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setShowModal(false); setEditingId(null); resetForm(); }} 
                    className="btn-secondary"
                  >
                    Скасувати
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
