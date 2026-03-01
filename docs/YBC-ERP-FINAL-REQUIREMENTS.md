# YBC ERP - Финальные требования (полная версия)
**Дата:** 2026-03-01  
**Статус:** Готово к разработке ✅

---

## 📊 Дополнительные уточнения (вечер 2026-03-01)

### ❌ Что НЕ нужно (упрощаем):
- Импорт старых данных (начинаем с нуля)
- XML для налоговой (достаточно CSV экспорта)
- Валютная переоценка активов/обязательств
- Инвентаризация товаров/активов
- Автоматическая банковская выверка (пока manual)

### ✅ Обязательные новые модули:

#### 1. **BUDGET (Бюджетирование)** - КРИТИЧНО!
- План доходов/расходов на месяц/квартал/год
- Сравнение факт vs план (actual vs budget)
- Алерты при превышении бюджета (> 10%)
- Сценарное планирование (что если...)
- Budget performance dashboard

**Таблицы:**
- `budgets` - бюджеты
- `budget_lines` - строки бюджета (по счетам)

**API:** 9 endpoints

**UI:**
- BudgetList, BudgetForm
- BudgetPerformance (факт vs план)
- BudgetAlerts
- ScenarioPlanner

**Roadmap:** Week 9 (целая неделя!)

---

#### 2. **AUDIT LOG (Журнал изменений)** - КРИТИЧНО!
- Полный лог ВСЕХ изменений в системе
- Кто, что, когда изменил
- Old values + New values (JSONB)
- IP адрес, User Agent
- Логируем:
  - Транзакции
  - Закрытие/открытие периодов
  - Удаления
  - Изменения настроек
  - ВСЕ действия пользователей

**Таблица:**
- `audit_log` (с индексами по tenant, user, entity, date)

**API:** 4 endpoints

**Middleware:** Автоматическое логирование всех POST/PATCH/DELETE запросов

**Roadmap:** Week 1 (middleware), Week 6 (UI)

---

#### 3. **Multi-Currency Wallets (Многовалютные кассы)**
- Отдельная касса/кошелек для каждой валюты
- Примеры:
  - Касса EUR (наличные)
  - Касса USD (наличные)
  - Банк Revolut EUR
  - Банк Revolut USD
  - Кошелек USDT (Ethereum)
  - Кошелек USDT (Tron)
  - Кошелек BTC
  - и т.д.

**Таблица:**
- `wallets` (заменяет старую концепцию единой кассы)

**Поля:**
- wallet_type: cash, bank, crypto
- currency: EUR, USD, UAH, BTC, ETH, USDT...
- network: ethereum, bsc, tron... (для крипто)
- address: адрес кошелька (для крипто)
- user_id: владелец кассы (NULL для общей)

**API:** 7 endpoints

**Roadmap:** Week 3

---

### 🔧 Другие важные уточнения:

#### **Payroll (Зарплаты)**
- Через **Bills** (как расходы)
- Фрилансеры тоже через Bills
- Категория: "salaries" или "freelancer"

#### **Права на удаление**
- **Только Owner** может удалять
- Все остальные роли: read/create/update only

#### **Membership Refunds**
- **Пропорциональные возвраты** за неиспользованные дни
- Формула: `refund = total_paid * (unused_days / total_days)`
- Проводка: частичное признание revenue + возврат остатка
- Статус: `cancelled`

#### **Event Refunds**
- **Reversal транзакции** (сторно)
- Меняем debit ↔ credit местами
- Статус билетов: `refunded`
- Статус события: `cancelled`

#### **Курсы крипты для отчетности**
- Фиксируем курс **на момент транзакции**
- Сохраняем `exchange_rate` в `transaction_lines`
- При генерации отчетов используем сохраненный курс

#### **Revolut Business**
- CSV/Excel импорт транзакций (manual)
- API интеграция - опционально (Phase 5+)

---

## 🗄️ Финальная Database Schema

### Итого таблиц: **22**

1. tenants
2. users
3. chart_of_accounts
4. currencies
5. exchange_rates
6. counterparties
7. membership_plans
8. memberships
9. events
10. ticket_types
11. tickets
12. bills
13. bill_payments
14. transactions
15. transaction_lines
16. **wallets** (NEW!)
17. crypto_wallets (для blockchain адресов)
18. crypto_transactions
19. royalty_payments
20. telegram_notifications
21. google_sheets_sync
22. period_closings
23. **budgets** (NEW!)
24. **budget_lines** (NEW!)
25. **audit_log** (NEW!)

**ИТОГО: 25 таблиц** (было 17, добавлено 8)

---

## 🚀 Финальный Roadmap (11 недель)

### **Phase 1: Core Foundation (Weeks 1-2)**
- Database schema (25 таблиц)
- Auth & RLS
- **Audit logging middleware**
- Design System (macOS, glassmorphism, українська)
- Multi-currency wallets structure

### **Phase 2: MVP Features (Weeks 3-6)**

**Week 3:** Membership + Wallets + Refunds
**Week 4:** Crypto + API интеграции
**Week 5:** Events + Tickets + Bills
**Week 6:** Transactions + Chart of Accounts + Period Closing + Audit UI

### **Phase 3: Integrations (Weeks 7-8)**

**Week 7:** Telegram (bot + notifications)
**Week 8:** Google Sheets + Reports (P&L, Balance, CF)

### **Phase 4: Advanced (Weeks 9-11)**

**Week 9:** 🎯 **BUDGET MODULE** (целая неделя!)
**Week 10:** Royalty + Multi-tenant
**Week 11:** ZOHO + Calendar + Custom Domain + Polish + Launch

---

## 📈 Ключевые метрики успеха

### Technical
- API response time < 200ms
- Database queries optimized
- Real-time sync latency < 2s
- 99.9% uptime
- **Audit log coverage: 100%**
- **Budget alerts работают real-time**

### Business
- Подневное признание revenue ✅
- Accrual accounting (Bills) ✅
- Крипто-балансы проверяются автоматически ✅
- Роялти рассчитывается точно ✅
- Telegram уведомления real-time ✅
- Google Sheets синхронизированы ✅
- **Бюджеты контролируются** ✅
- **Вся история изменений сохраняется** ✅

---

## ✅ Готовность к разработке

### **Phase 1 может стартовать немедленно:**

1. ✅ Все требования собраны
2. ✅ Database schema спроектирована (25 таблиц)
3. ✅ API endpoints определены (70+ endpoints)
4. ✅ Design System описана (macOS, glassmorphism)
5. ✅ Бизнес-логика описана (revenue recognition, bills, budgets, audit)
6. ✅ Roadmap составлен (11 недель)
7. ✅ Приоритеты расставлены

### **Что нужно для старта:**

1. Создать Supabase project
2. Создать GitHub repo
3. Запустить Node.js API на Railway
4. Выполнить database migrations
5. Начать Week 1

---

## 🎯 Next Steps

**Ждем подтверждения от Олега:** "Поехали!" 🚀

После подтверждения:
1. Создам Supabase project
2. Создам GitHub repo (ybc-erp)
3. Настрою Railway deployment
4. Выполню initial migrations (25 таблиц)
5. Начну Phase 1: Core Foundation

**Оценка:** 11 недель full-time development с Claude Code.

---

**Документы:**
- Полное ТЗ: `YBC-ERP-TECHNICAL-SPECIFICATION.md`
- Требования: `2026-03-01-ybc-erp-requirements.md`
- Этот файл: `YBC-ERP-FINAL-REQUIREMENTS.md`
