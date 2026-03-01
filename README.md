# YBC ERP - Business Club Management System

**Управленческая учетная система для YBC Business Club**

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 🎯 Описание

YBC ERP - полноценная система управленческого учета для бизнес-клуба с поддержкой:

- 💰 **Membership** - управление участием в клубе (месячные, годовые, lifetime тарифы)
- 🎫 **Events** - организация событий и продажа билетов
- 💸 **Bills & Payments** - учет расходов по методу начисления (Accrual Accounting)
- 🪙 **Crypto** - поддержка криптовалют (6 сетей, автопроверка балансов)
- 📊 **Budgeting** - бюджетирование с контролем факт vs план
- 📈 **Reports** - P&L, Balance Sheet, Cash Flow
- 🔔 **Telegram** - real-time уведомления о транзакциях
- 📄 **Google Sheets** - автоматическая синхронизация

---

## 🛠 Технический стек

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma / Supabase Client
- **Auth:** Supabase Auth

### Frontend
- **Framework:** React 18
- **Build:** Vite
- **UI:** Custom Design System (macOS style, Glassmorphism)
- **Language:** Українська мова
- **State:** React Context / Zustand
- **Routing:** React Router v6

### Infrastructure
- **Hosting:** Railway
- **Database:** Supabase (PostgreSQL + Row Level Security)
- **Domain:** erp.ybc.com.cy
- **CI/CD:** GitHub Actions

### Integrations
- **Telegram Bot API** - уведомления и бот для клиентов
- **Google Sheets API** - синхронизация транзакций
- **ZOHO CRM** - интеграция с CRM
- **Crypto APIs:** Moralis, TronGrid, Blockchain.info
- **Currency:** CoinGecko API

---

## 📐 Архитектура

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
```

---

## 🗄️ Database Schema

**25 таблиц:**

### Core
- `tenants` - организации/филиалы
- `users` - пользователи
- `counterparties` - контрагенты

### Finance
- `chart_of_accounts` - план счетов (IFRS)
- `currencies` - валюты
- `exchange_rates` - курсы валют
- `wallets` - многовалютные кассы
- `transactions` - транзакции (journal entries)
- `transaction_lines` - строки проводок (double-entry)

### Products
- `membership_plans` - тарифные планы
- `memberships` - активные участия
- `events` - события
- `ticket_types` - категории билетов
- `tickets` - проданные билеты

### Accounting
- `bills` - документы витрат
- `bill_payments` - привязка оплат к bills

### Crypto
- `crypto_wallets` - крипто-кошельки
- `crypto_transactions` - транзакции из blockchain

### Budget
- `budgets` - бюджеты
- `budget_lines` - строки бюджета

### Audit & Other
- `audit_log` - журнал изменений
- `royalty_payments` - роялти
- `period_closings` - закрытие периодов
- `telegram_notifications` - лог уведомлений
- `google_sheets_sync` - синхронизация

---

## 🚀 Roadmap

### Phase 1: Core Foundation (Weeks 1-2) ⏳
- [ ] Database schema (25 таблиц)
- [ ] Authentication & RLS
- [ ] Audit logging middleware
- [ ] Design System
- [ ] Multi-currency wallets

### Phase 2: MVP Features (Weeks 3-6)
- [ ] Membership management + revenue recognition
- [ ] Crypto wallets + balance checks
- [ ] Events + tickets + bills
- [ ] Transactions + chart of accounts
- [ ] Period closing

### Phase 3: Integrations (Weeks 7-8)
- [ ] Telegram notifications
- [ ] Google Sheets sync
- [ ] Reports (P&L, Balance, Cash Flow)

### Phase 4: Advanced (Weeks 9-11)
- [ ] Budget module
- [ ] Royalty + multi-tenant
- [ ] ZOHO + Calendar
- [ ] Custom domain + launch

---

## 📝 Ключевые бизнес-правила

### Revenue Recognition
- **Membership:** Подневное признание (продали годовой 3650 EUR → 10 EUR/день)
- **Events:** Признание датой проведения события (не датой продажи билета)

### Expense Recognition (от бухгалтера)
- **Accrual Accounting:** Расходы признаются датой получения услуг
- **Bills:** Документ витрат (на полную сумму, дата = дата события)
- **Payments:** Привязываются к Bill (предоплаты + постоплаты)
- **P&L:** Показывает расходы по `bill_date`
- **Cash Flow:** Показывает платежи по `payment_date`

### Refunds
- **Membership:** Пропорциональные возвраты (за неиспользованные дни)
- **Events:** Reversal транзакции (сторно)

### Royalty
- **Ставка:** 10% от gross revenue
- **Выплата:** Каждую пятницу (за закрытый четверг)
- **Расчет:** Автоматически по каждому филиалу

---

## 🎨 Design System

### Стиль
- macOS / Apple ecosystem
- Glassmorphism (frosted glass effect)
- Светлая + Темная темы
- Українська мова по всій системі

### Цвета (Light Theme)
```css
--bg-primary: #F2F1F7;        /* Основной фон */
--btn-primary: #000000;        /* Черная кнопка */
--btn-secondary: #FFFFFF;      /* Белая кнопка */
--btn-accent: #FA5255;         /* Красный акцент (редко!) */
```

### Типографика
```css
--font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display';
```

---

## 📦 Установка и запуск

### Prerequisites
- Node.js >= 18.0.0
- npm или yarn
- Supabase project
- Railway account (для деплоя)

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/ybc-cy-erp/ybc-erp.git
cd ybc-erp

# Установить зависимости
npm install

# Настроить переменные окружения
cp .env.example .env
# Заполнить .env (SUPABASE_URL, SUPABASE_KEY, и т.д.)

# Запустить database migrations
npm run db:migrate

# Запустить dev сервер
npm run dev
```

### Scripts

```bash
npm run dev          # Development mode
npm run build        # Production build
npm run start        # Production mode
npm run test         # Run tests
npm run lint         # Lint code
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database
```

---

## 📚 Документация

Полная документация в папке `/docs`:

- [Technical Specification](./docs/YBC-ERP-TECHNICAL-SPECIFICATION.md)
- [Database Schema](./docs/database-schema.md)
- [API Documentation](./docs/api-docs.md)
- [Design System](./docs/design-system.md)
- [Deployment Guide](./docs/deployment.md)

---

## 🔐 Безопасность

- Row Level Security (RLS) в Supabase
- JWT authentication
- API rate limiting
- Audit log для всех изменений
- Права доступа по ролям (Owner, Accountant, Manager, etc.)
- Период-блокирующее закрытие месяца

---

## 🤝 Contributing

Разработка ведется с помощью Claude Code (AI-assisted development).

---

## 📄 License

MIT

---

## 👥 Team

- **Owner:** Oleg Polchyn (YBC Cyprus)
- **Development:** Claude Code + Oleg
- **Organization:** ybc-cy-erp

---

## 📞 Support

- **Email:** support@ybc.com.cy
- **Website:** https://ybc.com.cy
- **ERP:** https://erp.ybc.com.cy (после запуска)

---

**Status:** 🚧 In Active Development (Phase 1) - Week 1/11
