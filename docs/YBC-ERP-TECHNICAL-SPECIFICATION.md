# YBC ERP - Техническое задание
**Версия:** 1.0  
**Дата:** 2026-03-01  
**Проект:** Управленческая учетная система для YBC Business Club

---

## 🎯 Цели проекта

Создать управленческую ERP-систему для бизнес-клуба YBC с:
- Подневным признанием revenue для membership
- Поддержкой криптовалют с автопроверкой балансов
- Multi-tenant архитектурой (материнская компания + филиалы)
- Real-time интеграцией с Telegram и Google Sheets
- Двойной проводкой и IFRS-совместимым планом счетов

---

## 📐 Архитектура системы

### High-level diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    YBC ERP ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐          ┌──────────────┐         ┌──────────────┐
│   React SPA  │◄────────►│  Node.js API │◄───────►│  Supabase    │
│  (Frontend)  │   HTTP   │   (Backend)  │  SQL    │ (PostgreSQL) │
└──────────────┘          └──────────────┘         └──────────────┘
                                 │                         │
                                 │                         │ RLS
                                 ▼                         ▼
┌──────────────┐          ┌──────────────┐         ┌──────────────┐
│  Telegram    │          │  Google      │         │  Multi-tenant│
│  Bot API     │          │  Sheets API  │         │  by tenant_id│
└──────────────┘          └──────────────┘         └──────────────┘
       │                         │
       │ Notifications           │ Real-time sync
       ▼                         ▼
┌──────────────┐          ┌──────────────┐
│  Crypto APIs │          │  Currency    │
│  (Moralis,   │          │  APIs        │
│  TronGrid,   │          │  (CoinGecko) │
│  Blockchain) │          │              │
└──────────────┘          └──────────────┘
       │
       │ Balance checks
       ▼
┌──────────────┐
│  Blockchain  │
│  Networks    │
│  (ETH, BSC,  │
│   Tron, BTC) │
└──────────────┘
```

---

## 🗄️ Database Schema (Supabase / PostgreSQL)

### Core tables

#### **tenants** (Организации/филиалы)
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  parent_tenant_id UUID REFERENCES tenants(id), -- для филиалов
  settings JSONB, -- настройки tenant
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **users** (Пользователи)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL, -- owner, accountant, manager, event_manager, cashier, analyst
  full_name VARCHAR(255),
  telegram_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS policy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

#### **chart_of_accounts** (План счетов)
```sql
CREATE TABLE chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  code VARCHAR(10) NOT NULL, -- 101, 102, 401, 501...
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- assets, liabilities, equity, revenue, expenses
  parent_account_id UUID REFERENCES chart_of_accounts(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);
```

#### **currencies** (Валюты)
```sql
CREATE TABLE currencies (
  code VARCHAR(10) PRIMARY KEY, -- EUR, USD, UAH, BTC, ETH, USDT...
  name VARCHAR(100),
  type VARCHAR(20), -- fiat, crypto
  is_base BOOLEAN DEFAULT FALSE -- TRUE for EUR
);
```

#### **exchange_rates** (Курсы валют)
```sql
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_currency VARCHAR(10) REFERENCES currencies(code),
  to_currency VARCHAR(10) REFERENCES currencies(code),
  rate DECIMAL(20, 8) NOT NULL,
  rate_date TIMESTAMP NOT NULL,
  source VARCHAR(50), -- manual, coingecko, ecb
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(from_currency, to_currency, rate_date)
);
```

#### **counterparties** (Контрагенты)
```sql
CREATE TABLE counterparties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  type VARCHAR(50) NOT NULL, -- client, supplier, partner, employee
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  telegram VARCHAR(100),
  tax_id VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **membership_plans** (Тарифные планы)
```sql
CREATE TABLE membership_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  tier VARCHAR(50), -- basic, premium, vip
  duration_type VARCHAR(50) NOT NULL, -- monthly, quarterly, annual, lifetime, custom_daily
  duration_days INT, -- NULL для lifetime
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) REFERENCES currencies(code) DEFAULT 'EUR',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **memberships** (Активные участия)
```sql
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  counterparty_id UUID REFERENCES counterparties(id) NOT NULL,
  plan_id UUID REFERENCES membership_plans(id) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_paid DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) REFERENCES currencies(code),
  daily_rate DECIMAL(10, 2), -- для revenue recognition (total_paid / duration_days)
  status VARCHAR(50) DEFAULT 'active', -- active, frozen, expired, cancelled
  freeze_history JSONB, -- массив периодов заморозки
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **events** (События)
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_type VARCHAR(50), -- single_day, multi_day, recurring, online, hybrid
  capacity INT,
  tickets_sold INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'upcoming', -- upcoming, completed, cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **ticket_types** (Категории билетов)
```sql
CREATE TABLE ticket_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) NOT NULL,
  name VARCHAR(100), -- vip, standard, early_bird
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) REFERENCES currencies(code) DEFAULT 'EUR',
  quantity INT,
  sold INT DEFAULT 0
);
```

#### **tickets** (Проданные билеты)
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  event_id UUID REFERENCES events(id) NOT NULL,
  ticket_type_id UUID REFERENCES ticket_types(id) NOT NULL,
  counterparty_id UUID REFERENCES counterparties(id) NOT NULL,
  purchase_date TIMESTAMP NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) REFERENCES currencies(code),
  status VARCHAR(50) DEFAULT 'active', -- active, refunded, cancelled
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **bills** (Документы витрат - от бухгалтера)
```sql
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  bill_number VARCHAR(50) UNIQUE NOT NULL,
  counterparty_id UUID REFERENCES counterparties(id) NOT NULL,
  event_id UUID REFERENCES events(id), -- NULL для не-событийных расходов
  bill_date DATE NOT NULL, -- дата признания расхода (для событий = дата события)
  due_date DATE,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) REFERENCES currencies(code) DEFAULT 'EUR',
  status VARCHAR(50) DEFAULT 'draft', -- draft, approved, partially_paid, paid
  description TEXT,
  category VARCHAR(100), -- photographer, venue, catering, marketing, etc.
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bills_event ON bills(event_id);
CREATE INDEX idx_bills_date ON bills(tenant_id, bill_date);
CREATE INDEX idx_bills_status ON bills(status);
```

#### **bill_payments** (Привязка оплат к биллам)
```sql
CREATE TABLE bill_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_type VARCHAR(50), -- prepayment, payment, postpayment
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(bill_id, transaction_id)
);

CREATE INDEX idx_bill_payments_bill ON bill_payments(bill_id);
CREATE INDEX idx_bill_payments_date ON bill_payments(payment_date);
```

#### **transactions** (Транзакции / Journal entries)
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  transaction_date TIMESTAMP NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  related_entity_type VARCHAR(50), -- membership, event, manual
  related_entity_id UUID,
  metadata JSONB, -- дополнительные данные (IP, location, blockchain link...)
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **transaction_lines** (Строки проводок - двойная запись)
```sql
CREATE TABLE transaction_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) NOT NULL,
  account_id UUID REFERENCES chart_of_accounts(id) NOT NULL,
  debit DECIMAL(15, 2) DEFAULT 0,
  credit DECIMAL(15, 2) DEFAULT 0,
  amount_original DECIMAL(15, 2), -- в оригинальной валюте
  currency VARCHAR(10) REFERENCES currencies(code),
  exchange_rate DECIMAL(20, 8),
  counterparty_id UUID REFERENCES counterparties(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT debit_or_credit CHECK (
    (debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)
  )
);
```

#### **crypto_wallets** (Крипто-кошельки)
```sql
CREATE TABLE crypto_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID REFERENCES users(id), -- владелец кошелька
  network VARCHAR(50) NOT NULL, -- ethereum, bsc, tron, bitcoin, arbitrum, optimism
  address VARCHAR(255) NOT NULL,
  token VARCHAR(20), -- USDT, USDC, ETH, BTC, NULL для native
  label VARCHAR(255),
  last_balance_check TIMESTAMP,
  last_known_balance DECIMAL(20, 8),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(network, address, token)
);
```

#### **crypto_transactions** (Крипто-транзакции из блокчейна)
```sql
CREATE TABLE crypto_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES crypto_wallets(id) NOT NULL,
  tx_hash VARCHAR(255) UNIQUE NOT NULL,
  block_number BIGINT,
  timestamp TIMESTAMP NOT NULL,
  from_address VARCHAR(255),
  to_address VARCHAR(255),
  amount DECIMAL(20, 8) NOT NULL,
  token VARCHAR(20),
  status VARCHAR(50), -- confirmed, pending, failed
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **royalty_payments** (Роялти)
```sql
CREATE TABLE royalty_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL, -- филиал
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gross_revenue DECIMAL(15, 2) NOT NULL,
  royalty_rate DECIMAL(5, 4) DEFAULT 0.10, -- 10%
  royalty_amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(10) REFERENCES currencies(code) DEFAULT 'EUR',
  status VARCHAR(50) DEFAULT 'pending', -- pending, paid
  payment_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **telegram_notifications** (Лог уведомлений)
```sql
CREATE TABLE telegram_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  chat_id VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  transaction_id UUID REFERENCES transactions(id),
  sent_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) -- sent, failed
);
```

#### **google_sheets_sync** (Синхронизация с Google Sheets)
```sql
CREATE TABLE google_sheets_sync (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  sheet_id VARCHAR(255) NOT NULL,
  transaction_id UUID REFERENCES transactions(id),
  synced_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) -- success, failed
);
```

#### **period_closings** (Закрытие периодов)
```sql
CREATE TABLE period_closings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  period_year INT NOT NULL,
  period_month INT NOT NULL, -- 1-12
  closed_at TIMESTAMP NOT NULL,
  closed_by UUID REFERENCES users(id) NOT NULL,
  is_closed BOOLEAN DEFAULT TRUE,
  reopened_at TIMESTAMP,
  reopened_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, period_year, period_month)
);

CREATE INDEX idx_period_closings_lookup 
  ON period_closings(tenant_id, period_year, period_month, is_closed);
```

#### **wallets** (Многовалютные кассы)
```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID REFERENCES users(id), -- владелец кассы/кошелька (NULL для общей кассы)
  wallet_type VARCHAR(50) NOT NULL, -- cash, bank, crypto
  currency VARCHAR(10) REFERENCES currencies(code) NOT NULL,
  network VARCHAR(50), -- для крипто: ethereum, bsc, tron, bitcoin...
  address VARCHAR(255), -- для крипто: адрес кошелька
  name VARCHAR(255) NOT NULL, -- "Касса EUR", "Кошелек USDT (Ethereum)", "Revolut Business USD"
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wallets_tenant ON wallets(tenant_id);
CREATE INDEX idx_wallets_currency ON wallets(currency);
CREATE INDEX idx_wallets_type ON wallets(wallet_type);
```

#### **budgets** (Бюджеты)
```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  budget_type VARCHAR(50) NOT NULL, -- monthly, quarterly, annual, custom
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  currency VARCHAR(10) REFERENCES currencies(code) DEFAULT 'EUR',
  status VARCHAR(50) DEFAULT 'draft', -- draft, approved, active, closed
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **budget_lines** (Строки бюджета)
```sql
CREATE TABLE budget_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES chart_of_accounts(id), -- счет из плана счетов
  category VARCHAR(100), -- revenue, expenses (по категориям)
  planned_amount DECIMAL(15, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_budget_lines_budget ON budget_lines(budget_id);
```

#### **audit_log** (Журнал изменений)
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  action VARCHAR(50) NOT NULL, -- create, update, delete, approve, close, reopen, etc.
  entity_type VARCHAR(50) NOT NULL, -- transaction, bill, membership, period_closing, etc.
  entity_id UUID NOT NULL,
  old_values JSONB, -- предыдущие значения
  new_values JSONB, -- новые значения
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_date ON audit_log(created_at);
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Tenants (Филиалы)
```
GET    /api/tenants
POST   /api/tenants
GET    /api/tenants/:id
PATCH  /api/tenants/:id
```

### Users
```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PATCH  /api/users/:id
DELETE /api/users/:id
```

### Chart of Accounts
```
GET    /api/accounts
POST   /api/accounts
PATCH  /api/accounts/:id
DELETE /api/accounts/:id
```

### Counterparties
```
GET    /api/counterparties
POST   /api/counterparties
GET    /api/counterparties/:id
PATCH  /api/counterparties/:id
DELETE /api/counterparties/:id
GET    /api/counterparties/:id/balance
```

### Membership Plans
```
GET    /api/membership-plans
POST   /api/membership-plans
PATCH  /api/membership-plans/:id
DELETE /api/membership-plans/:id
```

### Memberships
```
GET    /api/memberships
POST   /api/memberships (создание нового membership)
GET    /api/memberships/:id
PATCH  /api/memberships/:id
POST   /api/memberships/:id/freeze (заморозка)
POST   /api/memberships/:id/unfreeze (разморозка)
GET    /api/memberships/expiring (получить список заканчивающихся)
```

### Events
```
GET    /api/events
POST   /api/events
GET    /api/events/:id
PATCH  /api/events/:id
DELETE /api/events/:id
GET    /api/events/:id/tickets (проданные билеты)
POST   /api/events/:id/cancel
```

### Tickets
```
GET    /api/tickets
POST   /api/tickets (продажа билета)
GET    /api/tickets/:id
POST   /api/tickets/:id/refund
```

### Bills (Документы витрат)
```
GET    /api/bills
POST   /api/bills (создание bill)
GET    /api/bills/:id
PATCH  /api/bills/:id
DELETE /api/bills/:id
POST   /api/bills/:id/approve (утверждение bill)
POST   /api/bills/:id/match-payment (привязка оплаты к bill)
DELETE /api/bills/:id/payments/:payment_id (отвязка оплаты)
GET    /api/bills/:id/payments (список оплат по bill)
GET    /api/bills/unpaid (неоплаченные bills)
GET    /api/bills/by-event/:event_id (все bills для события)
```

### Transactions (Проводки)
```
GET    /api/transactions
POST   /api/transactions (создание проводки)
GET    /api/transactions/:id
DELETE /api/transactions/:id (сторно)
```

### Reports
```
GET    /api/reports/pnl?from=YYYY-MM-DD&to=YYYY-MM-DD
GET    /api/reports/balance?date=YYYY-MM-DD
GET    /api/reports/cashflow?from=YYYY-MM-DD&to=YYYY-MM-DD
GET    /api/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
GET    /api/reports/revenue-recognition?date=YYYY-MM-DD
POST   /api/reports/export (экспорт в PDF/Excel/CSV)
```

### Crypto Wallets
```
GET    /api/crypto/wallets
POST   /api/crypto/wallets
GET    /api/crypto/wallets/:id
DELETE /api/crypto/wallets/:id
POST   /api/crypto/wallets/:id/check-balance (проверка баланса)
GET    /api/crypto/wallets/:id/transactions (история из блокчейна)
```

### Royalty
```
GET    /api/royalty/calculate?period_start=YYYY-MM-DD&period_end=YYYY-MM-DD
POST   /api/royalty/payments (создание платежа роялти)
GET    /api/royalty/payments
PATCH  /api/royalty/payments/:id/mark-paid
```

### Currency Rates
```
GET    /api/rates?from=USD&to=EUR&date=YYYY-MM-DD
POST   /api/rates/manual (ручное обновление)
POST   /api/rates/update-crypto (обновление крипто-курсов из CoinGecko)
```

### Dashboard
```
GET    /api/dashboard/metrics (основные метрики)
GET    /api/dashboard/membership-status (expiring, MRR, churn rate)
GET    /api/dashboard/alerts (алерты)
```

### Wallets (Многовалютные кассы)
```
GET    /api/wallets
POST   /api/wallets (создание кассы/кошелька)
GET    /api/wallets/:id
PATCH  /api/wallets/:id
DELETE /api/wallets/:id
GET    /api/wallets/:id/balance (текущий баланс)
GET    /api/wallets/:id/transactions (история по кассе)
GET    /api/wallets/by-currency/:currency (все кассы определенной валюты)
```

### Budgets (Бюджетирование)
```
GET    /api/budgets
POST   /api/budgets (создание бюджета)
GET    /api/budgets/:id
PATCH  /api/budgets/:id
DELETE /api/budgets/:id
POST   /api/budgets/:id/approve (утверждение бюджета)
GET    /api/budgets/:id/actual-vs-plan (сравнение факт vs план)
GET    /api/budgets/:id/alerts (алерты по превышениям)
POST   /api/budgets/:id/scenario (создание сценария)
GET    /api/budgets/active (активный бюджет на текущий период)
```

### Audit Log
```
GET    /api/audit-log (полный лог с фильтрами)
GET    /api/audit-log/entity/:type/:id (лог для конкретной сущности)
GET    /api/audit-log/user/:user_id (действия конкретного пользователя)
GET    /api/audit-log/export (экспорт audit log)
```

### Period Closing
```
GET    /api/period-closings
POST   /api/period-closings/close (закрытие месяца)
POST   /api/period-closings/:id/reopen (повторное открытие, только owner)
GET    /api/period-closings/status?year=YYYY&month=MM
```

### Integrations
```
POST   /api/integrations/telegram/send-notification
POST   /api/integrations/google-sheets/sync
GET    /api/integrations/zoho/contacts
POST   /api/integrations/zoho/sync-contact
```

---

## 🔐 Authentication & Authorization

### Supabase Auth
- Email/password authentication
- JWT tokens
- Session management

### Row Level Security (RLS)
```sql
-- Изоляция по tenant_id
CREATE POLICY tenant_isolation ON {table_name}
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Права по ролям
CREATE POLICY role_based_access ON transactions
  USING (
    CASE current_setting('app.current_role')
      WHEN 'owner' THEN TRUE
      WHEN 'accountant' THEN TRUE -- read-only (enforced in app layer)
      WHEN 'manager' THEN created_by = current_setting('app.current_user')::uuid
      WHEN 'cashier' THEN created_by = current_setting('app.current_user')::uuid
      ELSE FALSE
    END
  );
```

---

## 🎨 Design System

### Стиль
- **Inspiration:** macOS, Apple ecosystem
- **Visual style:** Glassmorphism (frosted glass effect)
- **Language:** Украинский (вся система)
- **Themes:** Светлая + Темная

### Цветовая палитра

#### **Light Theme (основная)**
```css
/* Backgrounds */
--bg-primary: #F2F1F7;        /* Основной фон (серый) */
--bg-card: rgba(255, 255, 255, 0.7);  /* Glassmorphism карточки */
--bg-overlay: rgba(255, 255, 255, 0.9);

/* Buttons */
--btn-primary: #000000;        /* Черная кнопка */
--btn-secondary: #FFFFFF;      /* Белая кнопка */
--btn-accent: #FA5255;         /* Красный акцент (очень редко!) */

/* Text */
--text-primary: #000000;
--text-secondary: #6E6E73;     /* Светло-серый текст */
--text-tertiary: #A1A1A6;

/* Borders */
--border-light: rgba(0, 0, 0, 0.1);
--border-medium: rgba(0, 0, 0, 0.2);

/* Shadows */
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.12);

/* Glassmorphism */
--glass-blur: blur(20px);
--glass-border: 1px solid rgba(255, 255, 255, 0.3);
```

#### **Dark Theme**
```css
/* Backgrounds */
--bg-primary: #1C1C1E;        /* Темный фон */
--bg-card: rgba(44, 44, 46, 0.7);  /* Glassmorphism карточки */
--bg-overlay: rgba(28, 28, 30, 0.9);

/* Buttons */
--btn-primary: #FFFFFF;        /* Белая кнопка */
--btn-secondary: #2C2C2E;      /* Темно-серая */
--btn-accent: #FA5255;         /* Красный акцент */

/* Text */
--text-primary: #FFFFFF;
--text-secondary: #98989D;
--text-tertiary: #636366;

/* Borders */
--border-light: rgba(255, 255, 255, 0.1);
--border-medium: rgba(255, 255, 255, 0.2);

/* Shadows */
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);

/* Glassmorphism */
--glass-blur: blur(20px);
--glass-border: 1px solid rgba(255, 255, 255, 0.1);
```

### Типографика

```css
/* Font Family */
--font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;

/* Font Sizes */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;
--text-4xl: 36px;

/* Font Weights */
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Spacing (Apple-style)

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### Border Radius

```css
--radius-sm: 8px;   /* Inputs, small cards */
--radius-md: 12px;  /* Cards */
--radius-lg: 16px;  /* Modals, large cards */
--radius-xl: 20px;  /* Hero sections */
--radius-full: 9999px;  /* Pills, avatars */
```

### Компоненты (примеры)

#### **Glassmorphism Card**
```css
.glass-card {
  background: var(--bg-card);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}
```

#### **Primary Button (Black/White)**
```css
.btn-primary {
  background: var(--btn-primary);
  color: var(--bg-primary);
  border: none;
  border-radius: var(--radius-sm);
  padding: 12px 24px;
  font-weight: var(--font-semibold);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}
```

#### **Accent Button (Red - редко!)**
```css
.btn-accent {
  background: var(--btn-accent);
  color: #FFFFFF;
  /* Использовать только для критичных действий: Delete, Cancel subscription, etc. */
}
```

#### **Input Field**
```css
.input {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  font-size: var(--text-base);
  transition: all 0.2s ease;
}

.input:focus {
  border-color: var(--border-medium);
  box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.05);
}
```

### Иконки

- **Library:** SF Symbols style (react-icons или Heroicons)
- **Size:** 16px (small), 20px (medium), 24px (large)
- **Weight:** Regular (400) или Medium (500)

### Анимации

```css
/* Transitions */
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;

/* Micro-interactions (Apple-style) */
.interactive {
  transition: transform var(--transition-fast);
}

.interactive:active {
  transform: scale(0.98);
}
```

### Локализация (украинский язык)

**Все тексты в системе на украинском:**

```javascript
// Примеры текстов интерфейса
const UI_TEXTS = {
  // Dashboard
  dashboard: "Панель управління",
  summary: "Загальна інформація",
  
  // Membership
  membership: "Участь",
  members: "Учасники",
  expiring_soon: "Закінчується скоро",
  
  // Events
  events: "Події",
  tickets: "Квитки",
  sold_out: "Розпродано",
  
  // Transactions
  transactions: "Транзакції",
  debit: "Дебет",
  credit: "Кредит",
  
  // Reports
  reports: "Звіти",
  profit_loss: "Прибутки та збитки",
  balance_sheet: "Баланс",
  cash_flow: "Рух коштів",
  
  // Buttons
  save: "Зберегти",
  cancel: "Скасувати",
  delete: "Видалити",
  edit: "Редагувати",
  add: "Додати",
  
  // Common
  search: "Пошук",
  filter: "Фільтр",
  export: "Експорт",
  settings: "Налаштування",
  logout: "Вийти"
};
```

### Responsive Design

- **Mobile first** approach
- **Breakpoints:**
  ```css
  --mobile: 0-640px
  --tablet: 641px-1024px
  --desktop: 1025px+
  ```

### Accessibility

- ✅ WCAG 2.1 AA compliance
- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ ARIA labels (українською)
- ✅ Color contrast ratio ≥ 4.5:1

### UI Components Examples (React)

#### **GlassCard Component**
```jsx
// components/common/GlassCard.jsx
export const GlassCard = ({ children, className, ...props }) => {
  return (
    <div className={`glass-card ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

// CSS
.glass-card {
  background: var(--bg-card);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
}
```

#### **Button Component**
```jsx
// components/common/Button.jsx
export const Button = ({ 
  variant = 'primary', // primary | secondary | accent
  children, 
  ...props 
}) => {
  return (
    <button className={`btn btn-${variant}`} {...props}>
      {children}
    </button>
  );
};

// Використання:
<Button variant="primary">Зберегти</Button>
<Button variant="secondary">Скасувати</Button>
<Button variant="accent">Видалити</Button> {/* Рідко! */}
```

#### **Metric Card (Dashboard)**
```jsx
// components/Dashboard/MetricCard.jsx
export const MetricCard = ({ title, value, trend, icon }) => {
  return (
    <GlassCard className="metric-card">
      <div className="metric-header">
        <span className="metric-icon">{icon}</span>
        <h3 className="metric-title">{title}</h3>
      </div>
      <div className="metric-value">{value}</div>
      {trend && (
        <div className={`metric-trend ${trend > 0 ? 'positive' : 'negative'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </GlassCard>
  );
};

// Використання:
<MetricCard 
  title="Активних учасників" 
  value="142" 
  trend={8.2}
  icon={<UsersIcon />}
/>
```

#### **Table Component (macOS-style)**
```jsx
// components/common/Table.jsx
export const Table = ({ columns, data }) => {
  return (
    <GlassCard className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              {columns.map(col => (
                <td key={col.key}>{row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
};

// CSS
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 var(--space-1);
}

.table thead th {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table tbody tr {
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.table tbody tr:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.table tbody td {
  padding: var(--space-4);
  border-top: 1px solid var(--border-light);
}
```

#### **Theme Switcher**
```jsx
// components/common/ThemeToggle.jsx
export const ThemeToggle = () => {
  const [theme, setTheme] = useState('light');
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };
  
  return (
    <button className="theme-toggle" onClick={toggleTheme}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};
```

---

## 🎨 Frontend Structure (React)

```
src/
├── components/
│   ├── Dashboard/
│   │   ├── DashboardSummary.jsx
│   │   ├── MembershipStatus.jsx
│   │   ├── FinancialMetrics.jsx
│   │   └── Alerts.jsx
│   ├── Membership/
│   │   ├── MembershipList.jsx
│   │   ├── MembershipForm.jsx
│   │   └── MembershipCard.jsx
│   ├── Events/
│   │   ├── EventList.jsx
│   │   ├── EventForm.jsx
│   │   ├── TicketSales.jsx
│   │   └── EventExpenses.jsx
│   ├── Bills/
│   │   ├── BillList.jsx
│   │   ├── BillForm.jsx
│   │   ├── BillCard.jsx
│   │   └── PaymentMatcher.jsx
│   ├── Budgets/
│   │   ├── BudgetList.jsx
│   │   ├── BudgetForm.jsx
│   │   ├── BudgetPerformance.jsx (факт vs план)
│   │   ├── BudgetAlerts.jsx
│   │   └── ScenarioPlanner.jsx
│   ├── Wallets/
│   │   ├── WalletList.jsx
│   │   ├── WalletCard.jsx
│   │   └── WalletBalance.jsx
│   ├── Transactions/
│   │   ├── TransactionList.jsx
│   │   ├── TransactionForm.jsx
│   │   └── JournalEntry.jsx
│   ├── Reports/
│   │   ├── PnL.jsx
│   │   ├── BalanceSheet.jsx
│   │   ├── CashFlow.jsx
│   │   └── ReportsSummary.jsx
│   ├── Crypto/
│   │   ├── WalletList.jsx
│   │   ├── WalletCard.jsx
│   │   └── TransactionHistory.jsx
│   ├── Settings/
│   │   ├── ChartOfAccounts.jsx
│   │   ├── Users.jsx
│   │   ├── Tenants.jsx
│   │   ├── PeriodClosing.jsx
│   │   └── Integrations.jsx
│   └── common/
│       ├── Navbar.jsx
│       ├── Sidebar.jsx
│       └── Modal.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useTenant.js
│   ├── useTransactions.js
│   └── useCryptoWallets.js
├── services/
│   ├── api.js
│   ├── supabase.js
│   └── telegram.js
├── utils/
│   ├── currency.js
│   ├── dateFormat.js
│   └── validation.js
├── styles/
│   ├── theme.css (Design System variables)
│   ├── glassmorphism.css
│   └── components.css
├── i18n/
│   └── uk.json (українська локалізація)
└── App.jsx
```

---

## 🔄 Key Business Logic

### 1. Revenue Recognition (Membership)

**При продаже membership:**
```javascript
// 1. Создаем membership
const membership = await createMembership({
  counterparty_id,
  plan_id,
  start_date,
  end_date,
  total_paid,
  daily_rate: total_paid / duration_days
});

// 2. Создаем проводку:
//    Debit: 101 Касса EUR
//    Credit: 220 Deferred Revenue (обязательство)
await createTransaction({
  lines: [
    { account: '101', debit: total_paid },
    { account: '220', credit: total_paid }
  ]
});
```

**При генерации P&L отчета:**
```javascript
// Считаем accumulated revenue на дату отчета
const recognizedRevenue = memberships
  .filter(m => m.start_date <= report_date && m.end_date >= report_date)
  .reduce((sum, m) => {
    const days_elapsed = daysBetween(m.start_date, report_date);
    return sum + (m.daily_rate * days_elapsed);
  }, 0);

// Проводка (виртуальная, для отчета):
//    Debit: 220 Deferred Revenue
//    Credit: 401 Revenue from Membership
```

### 2. Revenue Recognition (Events)

**При продаже билета:**
```javascript
// 1. Создаем ticket
const ticket = await createTicket({
  event_id,
  counterparty_id,
  price
});

// 2. Проводка:
//    Debit: 101 Касса
//    Credit: 220 Deferred Revenue
await createTransaction({
  date: purchase_date,
  lines: [
    { account: '101', debit: price },
    { account: '220', credit: price }
  ]
});
```

**В дату проведения события:**
```javascript
// Cron job или manual trigger
// Проводка признания дохода:
//    Debit: 220 Deferred Revenue
//    Credit: 402 Revenue from Events
await recognizeEventRevenue(event_id);
```

### 2.5. Expense Recognition (Bills) - От бухгалтера материнской компании

**Ключевой принцип: Accrual Accounting**
> Расходы признаются датой получения услуг, а не датой оплаты

**При получении услуги (например, фотограф на событии):**
```javascript
// 1. Создаем Bill на полную сумму
const bill = await createBill({
  counterparty_id, // фотограф
  event_id, // если это событийный расход
  bill_date: event_date, // ДАТА СОБЫТИЯ, не дата оплаты!
  total_amount: 1000,
  currency: 'USD',
  category: 'photographer',
  status: 'approved'
});

// 2. Проводка признания расхода (в P&L):
//    Debit: 501 Expenses (photographer)
//    Credit: 210 Accounts Payable (кредиторская задолженность)
await createTransaction({
  date: event_date, // ВАЖНО: дата события
  related_entity_type: 'bill',
  related_entity_id: bill.id,
  lines: [
    { account: '501', debit: 1000 },
    { account: '210', credit: 1000, counterparty_id }
  ]
});
```

**При предоплате (до события):**
```javascript
// Предоплата 200 дол (5 января, событие 15 января)
const prepayment = await createTransaction({
  date: '2026-01-05', // фактическая дата платежа
  description: 'Предоплата фотографу',
  lines: [
    { account: '210', debit: 200, counterparty_id }, // уменьшаем долг
    { account: '101', credit: 200 } // списываем с кассы
  ]
});

// Привязываем к Bill
await matchPaymentToBill({
  bill_id: bill.id,
  transaction_id: prepayment.id,
  amount: 200,
  payment_date: '2026-01-05',
  payment_type: 'prepayment'
});

// P&L: расход 0 (событие еще не было)
// Cash Flow: -200 дол (5 января)
```

**При доплате (после события):**
```javascript
// Доплата 800 дол (20 января, событие было 15 января)
const postpayment = await createTransaction({
  date: '2026-01-20',
  description: 'Доплата фотографу',
  lines: [
    { account: '210', debit: 800, counterparty_id },
    { account: '101', credit: 800 }
  ]
});

await matchPaymentToBill({
  bill_id: bill.id,
  transaction_id: postpayment.id,
  amount: 800,
  payment_date: '2026-01-20',
  payment_type: 'postpayment'
});

// P&L: расход уже признан 15 января (1000 дол)
// Cash Flow: -800 дол (20 января)
```

**Итого по фотографу:**
```
P&L (15 января - дата события):
  Expenses: -1000 дол

Cash Flow:
  5 января:  -200 дол (предоплата)
  20 января: -800 дол (доплата)
  Итого:     -1000 дол (но в разные даты!)
```

**Генерация P&L отчета:**
```javascript
async function generatePnL(tenant_id, from_date, to_date) {
  // Расходы признаются по bill_date (не по payment_date!)
  const expenses = await db.bills.findAll({
    where: {
      tenant_id,
      bill_date: { between: [from_date, to_date] },
      status: { in: ['approved', 'partially_paid', 'paid'] } // draft не включаем
    }
  });
  
  const expensesByCategory = groupBy(expenses, 'category');
  
  return {
    revenue: await calculateRevenue(tenant_id, from_date, to_date),
    expenses: expensesByCategory,
    total_expenses: sum(expenses, 'total_amount'),
    net_profit: revenue - total_expenses
  };
}
```

**Генерация Cash Flow отчета:**
```javascript
async function generateCashFlow(tenant_id, from_date, to_date) {
  // Оплаты учитываются по payment_date (фактическое движение денег)
  const payments = await db.bill_payments.findAll({
    where: {
      payment_date: { between: [from_date, to_date] }
    },
    include: [{ 
      model: db.bills, 
      where: { tenant_id },
      include: [{ model: db.transactions }]
    }]
  });
  
  const cash_out = payments.reduce((sum, p) => sum + p.amount, 0);
  
  return {
    cash_in: await calculateCashIn(tenant_id, from_date, to_date),
    cash_out,
    net_cash_flow: cash_in - cash_out
  };
}
```

### 3. Crypto Balance Check

**Cron job (каждые 15 минут или on-demand):**
```javascript
async function checkCryptoBalances() {
  const wallets = await getCryptoWallets();
  
  for (const wallet of wallets) {
    const blockchainBalance = await getBalanceFromBlockchain(wallet);
    const systemBalance = await getSystemBalance(wallet);
    
    if (Math.abs(blockchainBalance - systemBalance) > TOLERANCE) {
      // Алерт
      await sendTelegramNotification({
        tenant_id: wallet.tenant_id,
        type: 'balance_mismatch',
        wallet,
        blockchain: blockchainBalance,
        system: systemBalance
      });
      
      // Подсветка в UI
      await updateWalletStatus(wallet.id, 'mismatch');
    }
    
    // Обновляем last_known_balance
    await updateWallet(wallet.id, {
      last_balance_check: new Date(),
      last_known_balance: blockchainBalance
    });
  }
}
```

### 4. Royalty Calculation

**Cron job (каждый четверг вечером):**
```javascript
async function calculateWeeklyRoyalty() {
  const tenants = await getChildTenants(); // все филиалы
  
  for (const tenant of tenants) {
    const period_start = lastFriday();
    const period_end = thisThursday();
    
    // Считаем gross revenue за период
    const gross_revenue = await getGrossRevenue(tenant.id, period_start, period_end);
    
    const royalty_amount = gross_revenue * 0.10; // 10%
    
    // Создаем запись
    await createRoyaltyPayment({
      tenant_id: tenant.id,
      period_start,
      period_end,
      gross_revenue,
      royalty_amount,
      status: 'pending'
    });
    
    // Telegram напоминание
    await sendTelegramNotification({
      tenant_id: tenant.id,
      type: 'royalty_due',
      amount: royalty_amount,
      due_date: nextFriday()
    });
  }
}
```

### 5. Telegram Notifications

**При каждой транзакции:**
```javascript
async function onTransactionCreated(transaction) {
  const tenant = await getTenant(transaction.tenant_id);
  const telegramChatId = tenant.settings.telegram_chat_id;
  
  if (!telegramChatId) return;
  
  const message = formatTransactionForTelegram(transaction, 'detailed');
  
  await sendTelegramMessage({
    chat_id: telegramChatId,
    text: message,
    parse_mode: 'Markdown'
  });
  
  // Логируем
  await logTelegramNotification({
    tenant_id: transaction.tenant_id,
    chat_id: telegramChatId,
    message,
    transaction_id: transaction.id,
    status: 'sent'
  });
}
```

### 6. Period Closing (Закрытие месяца)

**При попытке создать/изменить транзакцию:**
```javascript
async function validatePeriodOpen(tenant_id, transaction_date) {
  const year = transaction_date.getFullYear();
  const month = transaction_date.getMonth() + 1;
  
  const closing = await db.period_closings.findOne({
    where: {
      tenant_id,
      period_year: year,
      period_month: month,
      is_closed: true
    }
  });
  
  if (closing) {
    throw new Error(`Период ${year}-${month} закрыт. Создание/изменение транзакций запрещено.`);
  }
}

// В middleware транзакций:
app.post('/api/transactions', async (req, res) => {
  const { transaction_date } = req.body;
  
  // Проверка закрытия периода
  await validatePeriodOpen(req.tenant_id, new Date(transaction_date));
  
  // Создание транзакции...
});
```

**Закрытие месяца (только Owner):**
```javascript
async function closePeriod(tenant_id, year, month, user_id) {
  // Проверка роли
  const user = await getUser(user_id);
  if (user.role !== 'owner') {
    throw new Error('Только Owner может закрыть период');
  }
  
  // Проверка что период еще не закрыт
  const existing = await db.period_closings.findOne({
    where: { tenant_id, period_year: year, period_month: month }
  });
  
  if (existing && existing.is_closed) {
    throw new Error('Период уже закрыт');
  }
  
  // Закрываем
  await db.period_closings.upsert({
    tenant_id,
    period_year: year,
    period_month: month,
    closed_at: new Date(),
    closed_by: user_id,
    is_closed: true
  });
  
  // Telegram уведомление
  await sendTelegramNotification({
    tenant_id,
    type: 'period_closed',
    year,
    month
  });
  
  return { success: true };
}
```

**Повторное открытие (только Owner):**
```javascript
async function reopenPeriod(closing_id, user_id) {
  const user = await getUser(user_id);
  if (user.role !== 'owner') {
    throw new Error('Только Owner может открыть период');
  }
  
  await db.period_closings.update({
    where: { id: closing_id },
    data: {
      is_closed: false,
      reopened_at: new Date(),
      reopened_by: user_id
    }
  });
  
  return { success: true };
}
```

### 7. Membership Refunds (Пропорциональные возвраты)

**При отмене membership:**
```javascript
async function refundMembership(membership_id, cancellation_date) {
  const membership = await getMembership(membership_id);
  
  // Считаем использованные дни
  const days_used = daysBetween(membership.start_date, cancellation_date);
  const total_days = daysBetween(membership.start_date, membership.end_date);
  
  // Пропорциональный расчет
  const used_amount = membership.total_paid * (days_used / total_days);
  const refund_amount = membership.total_paid - used_amount;
  
  if (refund_amount <= 0) {
    throw new Error('Нет средств для возврата (период уже использован)');
  }
  
  // Создаем reversal транзакцию
  await createTransaction({
    date: cancellation_date,
    description: `Возврат за отмену membership #${membership.id}`,
    related_entity_type: 'membership',
    related_entity_id: membership.id,
    lines: [
      { account: '220', debit: used_amount }, // Признаем использованную часть
      { account: '401', credit: used_amount }, // Revenue
      { account: '401', debit: refund_amount }, // Возврат неиспользованной части
      { account: '101', credit: refund_amount } // Возврат из кассы
    ]
  });
  
  // Обновляем membership
  await updateMembership(membership_id, {
    status: 'cancelled',
    end_date: cancellation_date,
    refund_amount,
    refunded_at: new Date()
  });
  
  // Audit log
  await logAuditEvent({
    action: 'refund',
    entity_type: 'membership',
    entity_id: membership_id,
    details: { days_used, refund_amount }
  });
  
  return { refund_amount, days_used };
}
```

### 8. Event Refunds (Сторно при отмене)

**При отмене события:**
```javascript
async function refundEvent(event_id) {
  // Получаем все билеты
  const tickets = await getTicketsByEvent(event_id);
  
  for (const ticket of tickets) {
    // Находим оригинальную транзакцию продажи
    const original_tx = await getTransaction(ticket.transaction_id);
    
    // Создаем reversal (сторно)
    await createReversalTransaction({
      original_transaction_id: original_tx.id,
      date: new Date(),
      description: `Возврат за отмену события "${event.name}"`,
      lines: original_tx.lines.map(line => ({
        account: line.account,
        debit: line.credit, // меняем местами
        credit: line.debit,
        counterparty_id: line.counterparty_id
      }))
    });
    
    // Обновляем статус билета
    await updateTicket(ticket.id, { 
      status: 'refunded',
      refunded_at: new Date()
    });
    
    // Audit log
    await logAuditEvent({
      action: 'refund',
      entity_type: 'ticket',
      entity_id: ticket.id
    });
  }
  
  // Обновляем событие
  await updateEvent(event_id, { 
    status: 'cancelled',
    cancelled_at: new Date()
  });
}
```

### 9. Budget Tracking (Сравнение факт vs план)

**При генерации отчета Budget Performance:**
```javascript
async function getBudgetPerformance(budget_id, as_of_date) {
  const budget = await getBudget(budget_id);
  const budget_lines = await getBudgetLines(budget_id);
  
  const performance = [];
  
  for (const line of budget_lines) {
    // Получаем фактические данные за период
    const actual = await getActualAmount({
      account_id: line.account_id,
      from_date: budget.start_date,
      to_date: as_of_date
    });
    
    const variance = actual - line.planned_amount;
    const variance_pct = (variance / line.planned_amount) * 100;
    
    // Алерт если превышение > 10%
    const alert = variance_pct > 10 ? 'warning' : null;
    
    performance.push({
      account: await getAccount(line.account_id),
      planned: line.planned_amount,
      actual,
      variance,
      variance_pct,
      alert
    });
  }
  
  return {
    budget,
    performance,
    total_planned: sum(budget_lines, 'planned_amount'),
    total_actual: sum(performance, 'actual'),
    alerts: performance.filter(p => p.alert)
  };
}
```

### 10. Audit Logging (Автоматическое логирование)

**Middleware для всех изменений:**
```javascript
// В Express middleware
app.use(async (req, res, next) => {
  const originalJson = res.json;
  
  res.json = async function(data) {
    // Если это изменяющий запрос (POST, PATCH, DELETE)
    if (['POST', 'PATCH', 'DELETE'].includes(req.method)) {
      await logAuditEvent({
        tenant_id: req.tenant_id,
        user_id: req.user_id,
        action: req.method.toLowerCase(),
        entity_type: req.params.entity || extractEntityType(req.path),
        entity_id: req.params.id || data.id,
        old_values: req.old_values, // сохраненные до изменения
        new_values: data,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      });
    }
    
    return originalJson.call(this, data);
  };
  
  next();
});
```

### 11. Google Sheets Sync

**Real-time при каждой транзакции:**
```javascript
async function syncTransactionToSheets(transaction) {
  const tenant = await getTenant(transaction.tenant_id);
  const sheetId = tenant.settings.google_sheet_id;
  
  if (!sheetId) return;
  
  const sheetName = `Tenant_${tenant.id}`;
  
  // Формируем строку
  const row = [
    transaction.transaction_date,
    transaction.transaction_time,
    transaction.amount,
    transaction.currency,
    transaction.eur_equivalent,
    transaction.type,
    transaction.counterparty,
    transaction.account,
    transaction.created_by,
    transaction.description,
    transaction.blockchain_link || '',
    transaction.ip || '',
    transaction.location || '',
    transaction.invoice_id || '',
    transaction.status
  ];
  
  // Append к Google Sheet
  await appendToGoogleSheet(sheetId, sheetName, row);
  
  // Логируем
  await logSheetsSync({
    tenant_id: transaction.tenant_id,
    sheet_id: sheetId,
    transaction_id: transaction.id,
    status: 'success'
  });
}
```

---

## 🚀 Development Roadmap

### **Phase 1: Core Foundation (Weeks 1-2)**
- [x] Requirements gathering ✅
- [ ] Database schema setup (Supabase) - все 22 таблицы
- [ ] Basic Node.js API structure
- [ ] Authentication & RLS policies
- [ ] Audit logging middleware
- [ ] React app scaffold with routing
- [ ] Design System implementation (theme.css, glassmorphism, українська локалізація)
- [ ] Multi-currency wallets structure

### **Phase 2: MVP Features (Weeks 3-6)**

#### Week 3: Membership Management & Wallets
- [ ] Membership plans CRUD
- [ ] Membership purchase flow
- [ ] Revenue recognition logic (on-the-fly calculation)
- [ ] Membership refunds (пропорциональные возвраты)
- [ ] Dashboard: expiring memberships table
- [ ] Multi-currency wallets CRUD
- [ ] Wallet balance tracking

#### Week 4: Crypto Wallets & Integration
- [ ] Crypto wallets specific logic
- [ ] Integration with Moralis, TronGrid, Blockchain.info
- [ ] Balance check automation (cron)
- [ ] Mismatch detection & alerts
- [ ] Crypto transaction history import

#### Week 5: Events, Tickets & Bills
- [ ] Events CRUD
- [ ] Ticket types & sales
- [ ] Deferred revenue for events
- [ ] Event refunds (reversal/сторно)
- [ ] Capacity control
- [ ] Bills CRUD (accrual accounting)
- [ ] Payment matching to bills
- [ ] Bill status workflow (draft → approved → paid)

#### Week 6: Transactions, Chart of Accounts & Period Closing
- [ ] Chart of accounts setup (IFRS structure)
- [ ] Manual transaction entry (double-entry)
- [ ] Transaction list & filters
- [ ] Basic P&L report
- [ ] Period closing mechanism
- [ ] Audit log UI (просмотр истории изменений)

### **Phase 3: Integrations (Weeks 7-8)**

#### Week 7: Telegram
- [ ] Telegram bot setup
- [ ] Notifications on every transaction
- [ ] Telegram bot for clients (invite, status check)
- [ ] Alerts (balance mismatch, expiring memberships, etc.)

#### Week 8: Google Sheets & Reports
- [ ] Google Sheets API integration
- [ ] Real-time sync on transaction create
- [ ] P&L, Balance Sheet, Cash Flow reports
- [ ] Export to PDF/Excel

### **Phase 4: Advanced Features (Weeks 9-11)**

#### Week 9: Budgeting Module
- [ ] Budgets CRUD (планы на месяц/год)
- [ ] Budget lines (по счетам и категориям)
- [ ] Actual vs Plan comparison (сравнение факт vs план)
- [ ] Budget alerts (алерты при превышении)
- [ ] Scenario planning (сценарное планирование)
- [ ] Budget performance dashboard

#### Week 10: Royalty & Multi-tenant
- [ ] Royalty calculation automation (10% каждую пятницу)
- [ ] Multi-tenant support (parent + children tenants)
- [ ] Consolidated reporting for parent tenant
- [ ] Branch visibility settings
- [ ] Revolut Business CSV import (опционально)

#### Week 11: Polish & Launch
- [ ] ZOHO CRM integration
- [ ] Calendar sync (Google, Apple)
- [ ] User roles & permissions refinement
- [ ] Audit log полировка
- [ ] Final testing & bug fixes
- [ ] Custom domain setup (erp.ybc.com.cy)
- [ ] Deployment to Railway
- [ ] Documentation (українською)

---

## 📊 Success Metrics

### Technical
- API response time < 200ms
- Database queries optimized (no N+1)
- Real-time sync latency < 2s
- 99.9% uptime on Railway

### Business
- Подневное признание revenue работает корректно
- Крипто-балансы проверяются автоматически без ошибок
- Роялти рассчитывается точно и вовремя
- Telegram уведомления приходят real-time
- Google Sheets всегда синхронизированы

---

## 🔧 Tools & Services

### Development
- **IDE:** Claude Code (AI-assisted development)
- **Version Control:** Git + GitHub
- **Testing:** Jest, Supertest
- **Linting:** ESLint, Prettier

### Infrastructure
- **Hosting:** Railway
- **Database:** Supabase (PostgreSQL)
- **Frontend Hosting:** Railway (static)
- **Domain:** erp.ybc.com.cy (custom domain, настроим после деплоя)
- **SSL:** Auto (Railway + Let's Encrypt)

### APIs & Integrations
- **Telegram:** Bot API
- **Google Sheets:** Google Sheets API v4
- **ZOHO:** ZOHO CRM API
- **Crypto:** Moralis, TronGrid, Blockchain.info
- **Currency Rates:** CoinGecko API
- **Calendar:** Google Calendar API, Apple Calendar

### Monitoring
- **Logs:** Railway logs
- **Errors:** Sentry (optional)
- **Uptime:** UptimeRobot (optional)

---

## 🌐 Custom Domain Setup (erp.ybc.com.cy)

### Когда настраивать:
После успешного деплоя на Railway (Phase 4, Week 10)

### Шаги:
1. **В Railway:**
   - Settings → Domains → Add Custom Domain
   - Ввести: `erp.ybc.com.cy`
   - Railway предоставит CNAME target

2. **В DNS (у регистратора домена ybc.com.cy):**
   - Добавить CNAME запись:
     ```
     Type:  CNAME
     Name:  erp
     Value: <railway-provided-target>.railway.app
     TTL:   3600
     ```

3. **SSL:**
   - Railway автоматически выпустит Let's Encrypt сертификат
   - ~5-10 минут после DNS propagation

4. **Supabase Auth:**
   - Обновить Redirect URLs в Supabase:
     - Add `https://erp.ybc.com.cy/auth/callback`
   
5. **Тестирование:**
   - Открыть `https://erp.ybc.com.cy`
   - Проверить SSL (зеленый замок)
   - Проверить авторизацию

### Примерное время:
- DNS propagation: 5-30 минут
- SSL issue: 5-10 минут
- **Итого:** ~15-40 минут

---

## 📝 Next Steps

1. **Создать Supabase project**
2. **Настроить GitHub repo**
3. **Запустить базовую Node.js API** на Railway
4. **Создать database schema** (выполнить SQL миграции)
5. **Начать Phase 1** (Core Foundation)

---

**Готов начинать?** Скажи слово, и я создам:
- GitHub repo
- Supabase project setup script
- Initial database migrations
- Node.js API boilerplate
- React app scaffold

Начинаем прямо сейчас! 🚀
