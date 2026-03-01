# VISION - YBC ERP

**Project:** YBC Business Club - Management Accounting ERP  
**Owner:** Oleg Polchyn (YBC Cyprus)  
**Timeline:** 11 weeks (2026-03-01 → 2026-05-16)

---

## What We're Building

Полноценная система управленческого учета для бизнес-клуба YBC с поддержкой:

- 💰 **Membership** - управление участием (monthly, quarterly, annual, lifetime, custom daily)
- 🎫 **Events** - организация событий и продажа билетов
- 💸 **Bills & Payments** - accrual accounting (расходы по методу начисления)
- 🪙 **Crypto** - 6 блокчейн-сетей, автопроверка балансов
- 📊 **Budgeting** - планирование, факт vs план, алерты
- 📈 **Reports** - P&L, Balance Sheet, Cash Flow
- 🔔 **Telegram** - real-time уведомления
- 📄 **Google Sheets** - автосинхронизация
- 🔐 **Audit Log** - полная история изменений

---

## Success Metrics

### Technical
- ✅ API response time < 200ms
- ✅ 99.9% uptime on Railway
- ✅ Database queries optimized (no N+1)
- ✅ Real-time sync latency < 2s
- ✅ Audit log coverage: 100%
- ✅ Budget alerts работают real-time

### Business
- ✅ Подневное признание revenue работает корректно
- ✅ Accrual accounting (Bills) соответствует требованиям бухгалтера
- ✅ Крипто-балансы проверяются автоматически без ошибок
- ✅ Роялти 10% рассчитывается точно каждую пятницу
- ✅ Telegram уведомления приходят real-time
- ✅ Google Sheets всегда синхронизированы
- ✅ Бюджеты контролируются (факт vs план)
- ✅ Вся история изменений сохраняется (audit log)

### User Experience
- ✅ macOS/Apple дизайн (glassmorphism)
- ✅ Светлая + тёмная темы
- ✅ Українська мова по всій системі
- ✅ Responsive (mobile + desktop)
- ✅ Интуитивный интерфейс

---

## Boundaries (What We're NOT Building)

- ❌ Не делаем инвентаризацию товаров (100% services business)
- ❌ Не делаем автоматическую банковскую выверку (пока manual)
- ❌ Не делаем валютную переоценку активов
- ❌ Не делаем XML для налоговой (достаточно CSV)
- ❌ Не делаем импорт старых данных (начинаем с нуля)

---

## Key Business Rules

### Revenue Recognition
- **Membership:** Подневное (годовой 3650 EUR → 10 EUR/день)
- **Events:** Дата проведения события (не дата продажи)

### Expense Recognition (от бухгалтера)
- **Accrual accounting:** Расходы по дате получения услуг
- **Bills:** Полная сумма, дата = дата события
- **Payments:** Привязываются к Bill (предоплаты + постоплаты)
- **P&L:** По bill_date
- **Cash Flow:** По payment_date

### Refunds
- **Membership:** Пропорциональные (за неиспользованные дни)
- **Events:** Reversal (сторно)

### Royalty
- 10% от gross revenue
- Каждую пятницу (за четверг)
- По каждому филиалу отдельно

---

## Non-Negotiable Requirements

1. **Security:** RLS, audit log, period closing
2. **Quality:** QA PASS обязателен перед коммитом
3. **Language:** Українська по всій системі
4. **Design:** macOS style, glassmorphism
5. **Accrual accounting:** Bills + Payments как требует бухгалтер
6. **Multi-currency:** Отдельные кассы для каждой валюты

---

## Target Users

- **Owner:** Oleg - полный контроль, dashboards, бюджеты
- **Accountant:** Бухгалтер материнской компании - отчёты, Bills
- **Manager:** Менеджеры продаж - membership, events
- **Cashier:** Операции по своей кассе

---

## Success = "QA PASS on every feature"

Проект считается успешным когда:
- Все 11 недель roadmap выполнены
- Каждая фича прошла QA PASS
- Система работает в production на erp.ybc.com.cy
- Олег использует её для реального учёта YBC Cyprus
