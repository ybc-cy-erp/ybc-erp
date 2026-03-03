import { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import './ERPManualPage.css';

const tabs = [
  'Огляд системи',
  'Модулі та функції',
  'Бізнес-логіка',
  'Онбординг ролей',
  'FAQ',
];

const modules = [
  ['Головна', 'KPI, швидкі дії, статус системи', 'Реалізовано'],
  ['Тарифні плани', 'CRUD тарифів, період, денна ставка', 'Реалізовано'],
  ['Членства', 'Створення/редагування, автосума, деталі, заморозка', 'Реалізовано'],
  ['Події', 'CRUD подій, квитки, продажі', 'Реалізовано'],
  ['Довідники', 'Контрагенти, товари/послуги, папки', 'Реалізовано'],
  ['Фінанси', 'Bills, Wallets, Exchange, Transfers, COA', 'Реалізовано'],
  ['Документи', 'Журнал документів, ПКО/РКО, автопроводки', 'Реалізовано'],
  ['Користувачі', 'Інвайт, активація, ролі, reset', 'Реалізовано'],
  ['Звіти', 'P&L, Balance Sheet, Cash Flow', 'Реалізовано'],
  ['Налаштування', 'Telegram, sandbox reset', 'Реалізовано'],
];

export default function ERPManualPage() {
  const [active, setActive] = useState(tabs[0]);

  return (
    <DashboardLayout>
      <div className="manual-page">
        <div className="manual-header">
          <h1>Довідка по ERP</h1>
          <p>Повний опис функцій, процесів та правил роботи системи YBC ERP.</p>
        </div>

        <div className="manual-tabs" role="tablist" aria-label="ERP Manual Tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`manual-tab ${active === tab ? 'active' : ''}`}
              onClick={() => setActive(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {active === 'Огляд системи' && (
          <section className="manual-card">
            <h2>Що це за система</h2>
            <ul>
              <li>YBC ERP — система управлінського обліку для YBC Cyprus.</li>
              <li>Метод обліку: accrual (нарахування).</li>
              <li>Архітектура: React + Supabase + Cloudflare Pages.</li>
              <li>Аутентифікація: login/signup + magic link для reset/інвайтів.</li>
              <li>Мова інтерфейсу: українська.</li>
            </ul>
          </section>
        )}

        {active === 'Модулі та функції' && (
          <section className="manual-card">
            <h2>Статус модулів</h2>
            <table className="manual-table">
              <thead>
                <tr>
                  <th>Модуль</th>
                  <th>Що робить</th>
                  <th>Стан</th>
                </tr>
              </thead>
              <tbody>
                {modules.map(([name, func, status]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{func}</td>
                    <td>{status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {active === 'Бізнес-логіка' && (
          <section className="manual-card">
            <h2>Ключова логіка</h2>
            <h3>1) ПКО/РКО і автопроводки</h3>
            <p>При posted документі в document_journal тригер auto_post_gl_entry() створює подвійний запис в journal_entries і оновлює баланс рахунку.</p>
            <h3>2) Bills за методом нарахування</h3>
            <p>Витрата визнається на дату послуги (bill_accrual), оплата окремим документом (bill_payment).</p>
            <h3>3) Криптогаманці</h3>
            <p>Підтримка EVM + Tron + Bitcoin. Порівняння DB балансу і on-chain балансу, перегляд транзакцій.</p>
            <h3>4) Користувачі</h3>
            <p>Публічна реєстрація створює inactive користувача. Адмін активує доступ у модулі Користувачі.</p>
          </section>
        )}

        {active === 'Онбординг ролей' && (
          <section className="manual-card">
            <h2>Онбординг по ролях</h2>
            <h3>Owner</h3>
            <ul>
              <li>Перевірити Налаштування, Telegram, курси валют.</li>
              <li>Підтвердити користувачів у Користувачі.</li>
              <li>Щотижня переглядати P&L, Cash Flow, Balance Sheet.</li>
            </ul>
            <h3>Admin/Manager</h3>
            <ul>
              <li>Вести довідники: контрагенти, товари/послуги, плани.</li>
              <li>Створювати членства, події, рахунки, документи.</li>
            </ul>
            <h3>Staff</h3>
            <ul>
              <li>Операційний ввід документів за регламентом.</li>
              <li>Перевірка даних перед posted.</li>
            </ul>
          </section>
        )}

        {active === 'FAQ' && (
          <section className="manual-card">
            <h2>Поширені питання</h2>
            <p><strong>Чому сума/звіт не збігається?</strong> Перевірте статус документів, дату визнання витрати та рахунок обліку.</p>
            <p><strong>Чому не видно користувача після signup?</strong> Перевірте активацію в модулі Користувачі та запис у таблиці users.</p>
            <p><strong>Чому блокчейн баланс відрізняється?</strong> Різниця можлива через комісії, pending tx, або курс/мережу.</p>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
