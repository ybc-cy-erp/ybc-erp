import { useState, useEffect } from 'react';
import { usePageTitle } from '../context/PageTitleContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import { supabase } from '../services/supabase';
import telegramService from '../services/telegramService';
import './SettingsPage.css';

export default function SettingsPage() {
  const { setPageTitle } = usePageTitle();
  const [loading, setLoading] = useState(false);
  const [resetConfirm, setResetConfirm] = useState('');
  const [telegramForm, setTelegramForm] = useState({
    bot_token: '',
    chat_id: '',
    notify_new_membership: true,
    notify_expiring_membership: true,
    notify_overdue_bill: true,
    notify_new_event: true,
    is_active: false,
  });

  useEffect(() => {
    setPageTitle('Налаштування');
    loadTelegramSettings();
  }, [setPageTitle]);

  const loadTelegramSettings = async () => {
    try {
      const settings = await telegramService.getSettings();
      if (settings) {
        setTelegramForm({
          bot_token: settings.bot_token || '',
          chat_id: settings.chat_id || '',
          notify_new_membership: settings.notify_new_membership ?? true,
          notify_expiring_membership: settings.notify_expiring_membership ?? true,
          notify_overdue_bill: settings.notify_overdue_bill ?? true,
          notify_new_event: settings.notify_new_event ?? true,
          is_active: settings.is_active ?? false,
        });
      }
    } catch (err) {
      console.error('Failed to load telegram settings:', err);
    }
  };

  const handleSaveTelegram = async () => {
    try {
      setLoading(true);
      await telegramService.updateSettings(telegramForm);
      alert(' Налаштування Telegram збережено!');
      loadTelegramSettings();
    } catch (err) {
      alert(`Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!telegramForm.bot_token || !telegramForm.chat_id) {
      alert('Введіть Bot Token та Chat ID');
      return;
    }

    try {
      setLoading(true);
      await telegramService.testConnection(telegramForm.bot_token, telegramForm.chat_id);
      alert(' Тестове повідомлення надіслано!');
    } catch (err) {
      alert(`Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxReset = async () => {
    if (resetConfirm !== 'RESET') {
      alert('Введіть RESET для підтвердження');
      return;
    }

    if (!confirm('⚠️ УВАГА! Це видалить ВСІ дані та завантажить демо-дані. Продовжити?')) {
      return;
    }

    try {
      setLoading(true);

      // Get tenant_id
      const raw = localStorage.getItem('user');
      if (!raw) throw new Error('Користувач не авторизований');
      const user = JSON.parse(raw);
      const tenantId = user?.tenant_id;

      if (!tenantId) throw new Error('Tenant ID не знайдено');

      // Delete all data for this tenant
      const tables = [
        'journal_entries',
        'bill_payments',
        'bills',
        'ticket_sales',
        'event_tickets',
        'events',
        'membership_freeze',
        'memberships',
        'membership_plans',
        'document_journal',
        'currency_exchange_rates',
        'cash_transfers',
        'items',
        'item_folders',
        'counterparties',
        'counterparty_folders',
        'accounts',
      ];

      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('tenant_id', tenantId);

        if (error && error.code !== 'PGRST116') { // Ignore "no rows deleted" error
          console.warn(`Warning deleting ${table}:`, error);
        }
      }

      // Reload page to trigger demo data migration
      alert(' Sandbox скинуто! Сторінка перезавантажиться.');
      window.location.reload();
    } catch (err) {
      console.error('Reset error:', err);
      alert(`Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="settings-page">
        <div className="settings-section glass-card">
          <h2> Telegram Сповіщення</h2>
          <p className="section-description">
            Підключіть Telegram бот для отримання сповіщень про важливі події в системі.
          </p>

          <div className="form-group">
            <label>Bot Token</label>
            <input
              type="text"
              value={telegramForm.bot_token}
              onChange={(e) => setTelegramForm({ ...telegramForm, bot_token: e.target.value })}
              placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
            <small style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Отримайте токен від @BotFather
            </small>
          </div>

          <div className="form-group">
            <label>Chat ID</label>
            <input
              type="text"
              value={telegramForm.chat_id}
              onChange={(e) => setTelegramForm({ ...telegramForm, chat_id: e.target.value })}
              placeholder="-1001234567890"
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
            <small style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              ID користувача або групи (отримайте через @userinfobot)
            </small>
          </div>

          <div className="notifications-toggles">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={telegramForm.notify_new_membership}
                onChange={(e) => setTelegramForm({ ...telegramForm, notify_new_membership: e.target.checked })}
              />
              <span>Нові членства</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={telegramForm.notify_expiring_membership}
                onChange={(e) => setTelegramForm({ ...telegramForm, notify_expiring_membership: e.target.checked })}
              />
              <span>Закінчуються членства (за 7 днів)</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={telegramForm.notify_overdue_bill}
                onChange={(e) => setTelegramForm({ ...telegramForm, notify_overdue_bill: e.target.checked })}
              />
              <span>Прострочені рахунки</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={telegramForm.notify_new_event}
                onChange={(e) => setTelegramForm({ ...telegramForm, notify_new_event: e.target.checked })}
              />
              <span>Нові події</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={telegramForm.is_active}
                onChange={(e) => setTelegramForm({ ...telegramForm, is_active: e.target.checked })}
              />
              <span><strong>Увімкнути сповіщення</strong></span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button onClick={handleSaveTelegram} disabled={loading} className="btn-primary">
              {loading ? 'Збереження...' : '💾 Зберегти'}
            </button>
            <button onClick={handleTestTelegram} disabled={loading} className="btn-secondary">
              Тест підключення
            </button>
          </div>
        </div>

        <div className="settings-section glass-card">
          <h2> Sandbox Reset</h2>
          <p className="section-description">
            Видалити всі дані поточного tenant та завантажити демо-дані для тестування.
          </p>

          <div className="warning-box">
            <div className="warning-icon">⚠️</div>
            <div>
              <strong>УВАГА:</strong> Ця дія видалить всі ваші дані безповоротно:
              <ul>
                <li>Тарифні плани та членства</li>
                <li>Події та квитки</li>
                <li>Рахунки та платежі</li>
                <li>Контрагентів та товари</li>
                <li>Документи та проводки</li>
                <li>Обміни валют та перекази</li>
                <li>Всі рахунки (банк, каса, крипто)</li>
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label>Введіть <strong>RESET</strong> для підтвердження:</label>
            <input
              type="text"
              value={resetConfirm}
              onChange={(e) => setResetConfirm(e.target.value)}
              placeholder="RESET"
              style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}
            />
          </div>

          <button
            onClick={handleSandboxReset}
            disabled={loading || resetConfirm !== 'RESET'}
            className="btn-danger"
          >
            {loading ? 'Видалення...' : ' Скинути Sandbox'}
          </button>
        </div>

        <div className="settings-section glass-card">
          <h2> Інформація про систему</h2>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Версія:</div>
              <div className="info-value">v1.0.0</div>
            </div>
            <div className="info-item">
              <div className="info-label">Backend:</div>
              <div className="info-value">Supabase (EU Frankfurt)</div>
            </div>
            <div className="info-item">
              <div className="info-label">Deploy:</div>
              <div className="info-value">Cloudflare Pages</div>
            </div>
            <div className="info-item">
              <div className="info-label">Облікова політика:</div>
              <div className="info-value">Accrual (Метод нарахування)</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
