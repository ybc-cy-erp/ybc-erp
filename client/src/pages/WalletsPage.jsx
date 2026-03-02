import React, { useState, useEffect } from 'react';
import { usePageTitle } from '../context/PageTitleContext';
import DashboardLayout from '../components/layout/DashboardLayout';

const NETWORKS = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: '⟠' },
  { id: 'bsc', name: 'Binance Smart Chain', symbol: 'BNB', icon: '🔸' },
  { id: 'tron', name: 'Tron', symbol: 'TRX', icon: '◈' },
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', icon: '₿' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH', icon: '◎' },
  { id: 'optimism', name: 'Optimism', symbol: 'ETH', icon: '🔴' },
];

function WalletsPage() {
  const { setPageTitle } = usePageTitle();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPageTitle('Гаманці');
    loadWallets();
  }, []);

  const loadWallets = async () => {
    setLoading(true);
    // Mock data - replace with real API when integrated
    setTimeout(() => {
      setWallets([
        { network: 'ethereum', address: '0x742d...3a4f', balance: '2.5 ETH', usd: '$4,500' },
        { network: 'bsc', address: '0x8c9b...2d1e', balance: '15.3 BNB', usd: '$4,590' },
        { network: 'bitcoin', address: 'bc1q...7x9y', balance: '0.12 BTC', usd: '$5,040' },
        { network: 'tron', address: 'TRX9...4k2m', balance: '5000 TRX', usd: '$750' },
      ]);
      setLoading(false);
    }, 500);
  };

  const getNetworkInfo = (networkId) => {
    return NETWORKS.find(n => n.id === networkId) || {};
  };

  const getTotalUSD = () => {
    return wallets.reduce((sum, w) => {
      const usd = parseFloat(w.usd.replace(/[$,]/g, '')) || 0;
      return sum + usd;
    }, 0);
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
        <div className="glass-card" style={{ marginBottom: '24px', padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Загальний баланс
          </div>
          <div style={{ fontSize: '42px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            ${getTotalUSD().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
            Еквівалент у USD
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {NETWORKS.map((network) => {
            const wallet = wallets.find(w => w.network === network.id);
            
            return (
              <div key={network.id} className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '32px' }}>{network.icon}</div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{network.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{network.symbol}</div>
                  </div>
                </div>

                {wallet ? (
                  <>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Адреса</div>
                      <div style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{wallet.address}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Баланс</div>
                        <div style={{ fontSize: '16px', fontWeight: '600' }}>{wallet.balance}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>USD</div>
                        <div style={{ fontSize: '16px', fontWeight: '600' }}>{wallet.usd}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                    Гаманець не підключений
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
          Функціонал підключення гаманців буде доданий в наступних версіях
        </div>
      </div>
    </DashboardLayout>
  );
}

export default WalletsPage;
