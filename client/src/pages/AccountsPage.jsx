import { useState, useEffect } from 'react';
import { usePageTitle } from '../context/PageTitleContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import accountService from '../services/accountService';
import blockchainService from '../services/blockchainService';
import './AccountsPage.css';

export default function AccountsPage() {
  const { setPageTitle } = usePageTitle();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [blockchainData, setBlockchainData] = useState({});
  const [loadingBlockchain, setLoadingBlockchain] = useState({});
  const [showTransactions, setShowTransactions] = useState(null);
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
      
      // Auto-load blockchain balances for crypto accounts
      data.forEach(account => {
        if (account.account_type === 'crypto' && account.wallet_address) {
          loadBlockchainBalance(account.id, account.network, account.wallet_address, account.currency);
        }
      });
    } catch (err) {
      console.error(err);
      alert(`Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadBlockchainBalance = async (accountId, network, address, currency) => {
    try {
      setLoadingBlockchain(prev => ({ ...prev, [accountId]: true }));
      
      const balanceData = await blockchainService.getBalance(network, address, currency);
      
      setBlockchainData(prev => ({
        ...prev,
        [accountId]: {
          balance: balanceData.balance,
          currency: balanceData.currency,
          error: balanceData.error,
        },
      }));
    } catch (err) {
      console.error(`Failed to load blockchain balance for ${accountId}:`, err);
      setBlockchainData(prev => ({
        ...prev,
        [accountId]: {
          balance: null,
          error: err.message,
        },
      }));
    } finally {
      setLoadingBlockchain(prev => ({ ...prev, [accountId]: false }));
    }
  };

  const loadBlockchainTransactions = async (account) => {
    try {
      const txData = await blockchainService.getTransactions(
        account.network,
        account.wallet_address,
        20, // last 20 transactions
        account.currency // pass currency for token filtering
      );
      
      setShowTransactions({
        account,
        transactions: txData.transactions,
        error: txData.error,
      });
    } catch (err) {
      alert(`Помилка завантаження транзакцій: ${err.message}`);
    }
  };

  const getExplorerUrl = (network, txHash) => {
    const explorers = {
      ethereum: `https://etherscan.io/tx/${txHash}`,
      arbitrum: `https://arbiscan.io/tx/${txHash}`,
      optimism: `https://optimistic.etherscan.io/tx/${txHash}`,
      base: `https://basescan.org/tx/${txHash}`,
      polygon: `https://polygonscan.com/tx/${txHash}`,
      bsc: `https://bscscan.com/tx/${txHash}`,
      avalanche: `https://snowtrace.io/tx/${txHash}`,
      tron: `https://tronscan.org/#/transaction/${txHash}`,
      bitcoin: `https://blockchain.info/tx/${txHash}`,
    };
    return explorers[network] || `#`;
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
                  <div className="account-info">
                    <h3>{account.account_name}</h3>
                    <span className="badge">{getTypeLabel(account.account_type)}</span>
                  </div>
                </div>

                <div className="account-balance">
                  <div className="balance-label">Баланс в БД</div>
                  <div className="balance-amount">
                    {Number(account.balance || 0).toFixed(8)} {account.currency}
                  </div>
                </div>

                {account.account_type === 'crypto' && account.wallet_address && (
                  <div className="blockchain-balance">
                    {loadingBlockchain[account.id] ? (
                      <div style={{ textAlign: 'center', padding: '12px', color: 'var(--text-secondary)' }}>
                        ⏳ Завантаження з блокчейну...
                      </div>
                    ) : blockchainData[account.id] ? (
                      <>
                        <div className="balance-label">Баланс в блокчейні</div>
                        <div className="balance-amount" style={{ 
                          color: blockchainData[account.id].error ? '#FA5255' : 'var(--text-primary)' 
                        }}>
                          {blockchainData[account.id].error ? (
                            `❌ ${blockchainData[account.id].error}`
                          ) : (
                            <>
                              {blockchainData[account.id].balance?.toFixed(8)} {blockchainData[account.id].currency}
                            </>
                          )}
                        </div>
                        {!blockchainData[account.id].error && (
                          <>
                            {(() => {
                              const comparison = blockchainService.compareBalances(
                                blockchainData[account.id].balance,
                                Number(account.balance || 0)
                              );
                              return (
                                <div style={{ 
                                  marginTop: '8px', 
                                  fontSize: '12px',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  background: comparison.match ? 'rgba(34, 197, 94, 0.1)' : 'rgba(250, 82, 85, 0.1)',
                                  color: comparison.match ? '#16a34a' : '#FA5255',
                                  textAlign: 'center',
                                }}>
                                  {comparison.message}
                                  {!comparison.match && comparison.difference !== null && (
                                    <div style={{ marginTop: '4px', fontSize: '11px' }}>
                                      Різниця: {comparison.difference > 0 ? '+' : ''}{comparison.difference.toFixed(8)}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </>
                        )}
                        <button
                          onClick={() => loadBlockchainTransactions(account)}
                          className="btn-secondary"
                          style={{ width: '100%', marginTop: '12px', padding: '8px', fontSize: '12px' }}
                        >
                          📜 Показати транзакції з блокчейну
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => loadBlockchainBalance(account.id, account.network, account.wallet_address, account.currency)}
                        className="btn-secondary"
                        style={{ width: '100%', marginTop: '12px', padding: '8px', fontSize: '12px' }}
                      >
                        🔄 Завантажити з блокчейну
                      </button>
                    )}
                  </div>
                )}

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
                        <option value="arbitrum">Arbitrum (L2)</option>
                        <option value="optimism">Optimism (L2)</option>
                        <option value="base">Base (L2)</option>
                        <option value="polygon">Polygon</option>
                        <option value="bsc">Binance Smart Chain</option>
                        <option value="avalanche">Avalanche C-Chain</option>
                        <option value="tron">Tron</option>
                        <option value="bitcoin">Bitcoin</option>
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

        {showTransactions && (
          <div className="modal-overlay" onClick={() => setShowTransactions(null)}>
            <div className="modal-content modal-solid" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
              <h2>Транзакції з блокчейну</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Рахунок: <strong>{showTransactions.account.account_name}</strong>
                <br />
                Мережа: <strong>{showTransactions.account.network}</strong>
                <br />
                Адреса: <code style={{ fontSize: '11px', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                  {showTransactions.account.wallet_address}
                </code>
              </p>

              {showTransactions.error ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#FA5255' }}>
                  ❌ Помилка: {showTransactions.error}
                </div>
              ) : showTransactions.transactions.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Транзакції не знайдено
                </div>
              ) : (
                <div style={{ overflow: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-medium)' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Хеш</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Дата/час</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Сума</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {showTransactions.transactions.map((tx, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '11px' }}>
                            <a 
                              href={getExplorerUrl(showTransactions.account.network, tx.hash)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
                            >
                              {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                            </a>
                          </td>
                          <td style={{ padding: '10px' }}>
                            {new Date(tx.timestamp).toLocaleString('uk-UA')}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace' }}>
                            {tx.value !== undefined ? Number(tx.value).toFixed(6) : '—'} {tx.currency || ''}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            {tx.isError ? (
                              <span style={{ color: '#FA5255' }}>❌ Помилка</span>
                            ) : (
                              <span style={{ color: '#16a34a' }}>✅ OK</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button onClick={() => setShowTransactions(null)} className="btn-secondary">
                  Закрити
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
