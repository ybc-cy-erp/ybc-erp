# YBC ERP — ТЗ v2.0 (Clean Rebuild)

**Дата:** 2026-03-02  
**Статус:** Approved for clean rebuild  
**Цель:** Построить production-ready ERP с нуля на правильной архитектуре

---

## 1. Философия проекта

### Принципы
- **Clean architecture с первого дня** — без технического долга
- **Mobile-first** — основное использование с телефона
- **macOS/Finder UX** — строгий Apple-подобный интерфейс
- **Прозрачность данных** — единые справочники без искусственного деления
- **Accrual accounting** — все операции через GL (двойная запись)

### Что НЕ делаем
- ❌ Railway или другие legacy сервисы
- ❌ Разделение контрагентов на "типы" (клиент/поставщик/участник)
- ❌ Игрушечный UI или "Office 97" стиль
- ❌ Desktop-only интерфейсы

---

## 2. Технический стек (финальный)

### Backend & Data
- **Supabase** (Postgres + Auth + RLS + Storage)
- EU Frankfurt region: `iklibzcyfxcahbquuurv.supabase.co`
- Multi-tenant через `tenant_id` + RLS policies

### Frontend
- **React 18+ с Vite**
- Прямой доступ к Supabase (без промежуточного API)
- CSS Modules или Tailwind (выбрать на старте)
- React Query для кэширования

### Hosting
- **Cloudflare Pages** (`erp.ybc.com.cy`)
- CDN + edge caching
- Zero downtime deploys

### Mobile
- **Responsive-first** (не адаптация desktop, а изначально для телефона)
- PWA capabilities (optional, но желательно)

---

## 3. Справочники (ключевое требование)

### 3.1 Общие принципы справочников

Все справочники работают одинаково:

#### Организация данных
- **Папки** (как в Finder) — пользователь создаёт свою структуру
- **Теги/метки** (опционально) — для гибкой фильтрации
- **Без жёсткой типизации** — система не навязывает "клиент vs поставщик"

#### Виды отображения (как macOS Finder)
1. **Icon view** (сетка с превью/иконками)
2. **List view** (таблица, колонки, сортировка)
3. **Column view** (колоночный браузер для иерархии)
4. **Gallery view** (карточки с превью)

Пользователь переключается кнопками в тулбаре (как в Finder).

#### UI/UX паттерны
- Поиск Spotlight-style (глобальный + внутри справочника)
- Drag & drop для перемещения в папки
- Контекстное меню (ПКМ или long-press на mobile)
- Bulk actions (выделение + действие над группой)
- Quick Look (предпросмотр по пробелу или tap)

---

### 3.2 Справочник: Контрагенты

**Таблица:** `counterparties`

#### Поля
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
tenant_id UUID NOT NULL REFERENCES tenants(id)
folder_id UUID REFERENCES counterparty_folders(id) -- NULL = root
name TEXT NOT NULL
full_name TEXT
tax_id TEXT -- ИНН/EDRPOU/VAT
contact_person TEXT
email TEXT
phone TEXT
address TEXT
notes TEXT
tags TEXT[] -- массив тегов
custom_fields JSONB -- гибкие доп.поля
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
created_by UUID REFERENCES users(id)
```

#### Folder structure
```sql
counterparty_folders:
  id UUID PRIMARY KEY
  tenant_id UUID NOT NULL
  parent_id UUID REFERENCES counterparty_folders(id) -- NULL = root level
  name TEXT NOT NULL
  color TEXT -- опциональный цвет папки
  icon TEXT -- опциональная иконка
```

#### Логика
- Контрагент может быть и клиентом, и поставщиком одновременно
- Система просто показывает связанные документы (bills IN, bills OUT, memberships, events)
- Пользователь сам решает, как организовать папки: "Клиенты", "Поставщики", "YBC Branches", etc.

---

### 3.3 Справочник: Товары и услуги

**Таблица:** `items`

#### Поля
```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
folder_id UUID REFERENCES item_folders(id)
code TEXT -- артикул/SKU
name TEXT NOT NULL
description TEXT
unit TEXT DEFAULT 'шт' -- од.виміру
price_default DECIMAL(12,2)
currency TEXT DEFAULT 'EUR'
item_type TEXT CHECK (item_type IN ('product', 'service', 'membership')) -- hint, не жёсткое правило
gl_account_income UUID REFERENCES chart_of_accounts(id)
gl_account_expense UUID REFERENCES chart_of_accounts(id)
tags TEXT[]
custom_fields JSONB
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

---

### 3.4 Справочник: Счета GL (Chart of Accounts)

Уже есть, но нужен Finder-like UI:

- List view: дерево счетов (101, 102, 103...)
- Column view: иерархия счетов (Assets > Current Assets > Cash)
- Возможность создавать папки/группы для удобства

---

### 3.5 Справочник: Документы (Document Journal)

**Таблица:** `document_journal`

Все документы (ПКО, РКО, счета, акты, контракты) в одном журнале:

```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
doc_type TEXT NOT NULL -- 'PKO', 'RKO', 'invoice', 'contract', 'act', etc.
doc_number TEXT NOT NULL -- автонумерация
doc_date DATE NOT NULL
counterparty_id UUID REFERENCES counterparties(id)
amount DECIMAL(12,2)
currency TEXT
status TEXT DEFAULT 'draft' -- draft, posted, cancelled
notes TEXT
file_url TEXT -- Supabase Storage
linked_journal_entries UUID[] -- массив ID проводок GL
tags TEXT[]
folder_id UUID -- для организации в папки
created_at TIMESTAMPTZ DEFAULT NOW()
created_by UUID REFERENCES users(id)
```

Finder-like UI:
- Папки: "Входящие счета", "Исходящие", "Акты", "Контракты"
- Drag & drop перемещение между папками
- Quick Look для PDF/файлов

---

## 4. Модули (функционал)

### 4.1 Членства (Memberships)

**Существующие таблицы:** `membership_plans`, `memberships`, `membership_freeze`

#### Изменения для v2
- Добавить связь с контрагентами: `counterparty_id` (опционально)
- UI: карточки членств в Finder-style (можно группировать по папкам/тегам)
- Mobile-first формы создания/редактирования

---

### 4.2 События и билеты (Events & Tickets)

**Существующие таблицы:** `events`, `event_tickets`, `ticket_sales`

#### Изменения для v2
- Связь события с контрагентом (если event для конкретного клиента)
- Finder UI для списка событий
- Mobile: быстрая продажа билетов (scan QR → select ticket type → pay)

---

### 4.3 Счета и платежи (Bills & Payments)

**Существующие таблицы:** `bills`, `bill_payments`

#### Изменения для v2
- Связь с контрагентами: `counterparty_id` обязательно
- Привязка к документам: `document_id` (ссылка на document_journal)
- Статусы: draft, sent, approved, paid, cancelled
- Finder UI для журнала счетов

---

### 4.4 GL и проводки (Journal Entries)

**Новые таблицы:**
```sql
journal_entries:
  id UUID PRIMARY KEY
  tenant_id UUID NOT NULL
  document_id UUID REFERENCES document_journal(id) -- откуда проводка
  entry_date DATE NOT NULL
  description TEXT
  debit_account UUID REFERENCES chart_of_accounts(id)
  credit_account UUID REFERENCES chart_of_accounts(id)
  amount DECIMAL(12,2) NOT NULL
  currency TEXT DEFAULT 'EUR'
  created_at TIMESTAMPTZ DEFAULT NOW()
  created_by UUID REFERENCES users(id)

CONSTRAINT balanced_entry CHECK (debit_account IS NOT NULL AND credit_account IS NOT NULL)
```

#### Логика
- Любой финансовый документ (ПКО, РКО, счёт, обмен, перемещение) → автопроводки
- Контроль баланса: Dt = Kt в каждой проводке
- UI: журнал проводок в List view, фильтры по счетам/датам

---

### 4.5 Кассовые документы (ПКО/РКО)

**Таблица:** `cash_documents`

```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
doc_type TEXT CHECK (doc_type IN ('PKO', 'RKO')) -- приход/расход
doc_number TEXT NOT NULL -- автонумерация PKO-001, RKO-001
doc_date DATE NOT NULL
wallet_id UUID REFERENCES wallets(id) -- касса/кошелёк
counterparty_id UUID REFERENCES counterparties(id)
amount DECIMAL(12,2) NOT NULL
currency TEXT DEFAULT 'EUR'
purpose TEXT -- назначение платежа
status TEXT DEFAULT 'draft' -- draft, posted, cancelled
document_id UUID REFERENCES document_journal(id) -- связь с журналом документов
created_at TIMESTAMPTZ DEFAULT NOW()
created_by UUID REFERENCES users(id)
```

#### Логика
- ПКО → Dt: Касса, Kt: Счёт доходов/дебиторка
- РКО → Dt: Счёт расходов/кредиторка, Kt: Касса
- Mobile: быстрое создание ПКО/РКО (камера для фото чека, голосовой ввод суммы)

---

### 4.6 Обмен валют (Currency Exchange)

**Таблица:** `currency_exchanges`

```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
exchange_date DATE NOT NULL
from_wallet_id UUID REFERENCES wallets(id)
to_wallet_id UUID REFERENCES wallets(id)
from_amount DECIMAL(12,2) NOT NULL
from_currency TEXT NOT NULL
to_amount DECIMAL(12,2) NOT NULL
to_currency TEXT NOT NULL
exchange_rate DECIMAL(12,6) NOT NULL
fee_amount DECIMAL(12,2) DEFAULT 0
fee_currency TEXT
notes TEXT
document_id UUID REFERENCES document_journal(id)
created_at TIMESTAMPTZ DEFAULT NOW()
created_by UUID REFERENCES users(id)
```

#### Логика
- Курс фиксируется на момент операции
- Комиссия опциональна
- Проводки: Dt: Касса (to_currency), Kt: Касса (from_currency) + расходы на комиссию

---

### 4.7 Перемещения между кассами (Transfers)

**Таблица:** `wallet_transfers`

```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
transfer_date DATE NOT NULL
from_wallet_id UUID REFERENCES wallets(id)
to_wallet_id UUID REFERENCES wallets(id)
amount DECIMAL(12,2) NOT NULL
currency TEXT NOT NULL
notes TEXT
document_id UUID REFERENCES document_journal(id)
created_at TIMESTAMPTZ DEFAULT NOW()
created_by UUID REFERENCES users(id)
```

#### Логика
- Контроль: нельзя перевести больше, чем есть на балансе
- Проводки: Dt: Касса 2, Kt: Касса 1

---

### 4.8 Кошельки/Кассы (Wallets)

**Существующая таблица:** `wallets`

#### Расширение
- Поддержка фиатных и криптовалютных кошельков
- Каждая валюта = отдельный кошелёк (как отдельный счёт GL)
- Real-time баланс (вычисляется из проводок)

---

### 4.9 Бюджеты (Budgets)

**Существующая таблица:** `budgets`

#### Логика
- Бюджеты по категориям GL
- Оповещения при превышении (email/Telegram)
- Finder UI: список бюджетов, карточка с прогресс-барами

---

### 4.10 Аудит и история (Audit Log)

**Существующая таблица:** `audit_log`

#### Расширение
- Все изменения критичных сущностей
- Finder UI: Timeline view (как в Git)

---

## 5. UI/UX Детали (строгий стиль)

### 5.1 Общие принципы

#### Цвета
- **Background light:** `#FFFFFF`, `#F2F1F7` (secondary)
- **Background dark:** `#1C1C1E`, `#2C2C2E` (secondary)
- **Text primary light:** `#000000`
- **Text primary dark:** `#FFFFFF`
- **Text secondary light/dark:** `#6B7280` / `#9CA3AF`
- **Accent red:** `#FA5255` (только для критичных действий/ошибок)
- **Borders light:** `rgba(0,0,0,0.12)`
- **Borders dark:** `rgba(255,255,255,0.12)`

#### Типографика
- **Шрифт:** SF Pro / Inter / System UI
- **Размеры:**
  - H1: 24px, bold
  - H2: 20px, semibold
  - H3: 17px, semibold
  - Body: 15px, regular
  - Caption: 13px, regular

#### Отступы и spacing
- **Базовая сетка:** 4px
- **Стандартные отступы:** 8px, 12px, 16px, 24px, 32px
- **Минимальный tap-target:** 44x44px (mobile)

#### Компоненты
- **Кнопки:** rounded 8px, высота 40px (desktop) / 44px (mobile)
- **Поля ввода:** rounded 8px, высота 40px (desktop) / 44px (mobile)
- **Модалки:** строго белые (не glassmorphism), padding 24px, rounded 14px
- **Карточки:** border 1px solid, rounded 10px, padding 16px
- **Таблицы:** zebra-striping опционально, hover states, sticky headers

---

### 5.2 Навигация

#### Desktop
- **Sidebar:** фиксированный слева, 240px, сворачивается в иконки (60px)
- **Navbar:** фиксированный сверху, логотип + глобальный поиск + профиль

#### Mobile
- **Bottom tab bar:** 5 главных разделов (Dashboard, Counterparties, Documents, Wallets, More)
- **Hamburger menu:** для остальных разделов
- **Sticky action button:** для создания нового документа (floating action button)

---

### 5.3 Finder-like UI детали

#### Toolbar (как в Finder)
- View switcher: icon/list/column/gallery (иконки)
- Search bar (всегда видим)
- Sort dropdown
- Filter button
- New item button (+)

#### List view
- Колонки: Name, Date, Amount, Status, Tags
- Сортировка по любой колонке
- Inline edit (double-click)
- Checkboxes для bulk actions

#### Icon view
- Сетка карточек с иконками/превью
- Название под карточкой
- Drag & drop перемещение

#### Column view
- Три колонки: папки → подпапки → элемент
- Навигация по клику
- Preview panel справа

#### Gallery view
- Большие карточки с превью
- Название + метаданные
- Hover для Quick Look

---

### 5.4 Mobile-specific UX

#### Формы
- Один вопрос на экран (wizard-style для сложных форм)
- Sticky footer с кнопками "Назад" и "Далі/Зберегти"
- Автофокус на первое поле
- Нативные пикеры (дата, валюта, контрагент)

#### Списки
- Pull-to-refresh
- Infinite scroll
- Swipe actions (удалить, редактировать, архивировать)
- Long-press для контекстного меню

#### Поиск
- Sticky search bar вверху
- Recent searches
- Suggestions (как Spotlight)

---

## 6. Roadmap v2 (6 шагов заново)

### Шаг 1: Фундамент (1 неделя)
- [ ] Чистый React проект с Vite
- [ ] Supabase клиент + auth
- [ ] Layout (sidebar, navbar, mobile tabs)
- [ ] Роутинг (react-router)
- [ ] Базовый UI kit (кнопки, поля, модалки)
- [ ] Справочник контрагентов (CRUD + Finder UI: list/icon views)

### Шаг 2: Справочники (1 неделя)
- [ ] Товары и услуги (CRUD + Finder UI)
- [ ] Папки для справочников
- [ ] Drag & drop перемещение
- [ ] Теги и фильтры
- [ ] Глобальный поиск (Spotlight-style)

### Шаг 3: Документы и GL (1 неделя)
- [ ] Журнал документов (document_journal)
- [ ] Журнал проводок (journal_entries)
- [ ] ПКО/РКО (формы + автопроводки)
- [ ] Связь документов с контрагентами
- [ ] Finder UI для документов

### Шаг 4: Членства и События (1 неделя)
- [ ] Memberships (интеграция с контрагентами)
- [ ] Events (интеграция с контрагентами)
- [ ] Билеты и продажи
- [ ] Mobile-формы для быстрого создания

### Шаг 5: Счета, Платежи, Обмены (1 неделя)
- [ ] Bills (привязка к контрагентам + документам)
- [ ] Payments (привязка к bills)
- [ ] Currency exchange (форма + проводки)
- [ ] Wallet transfers (форма + проводки)
- [ ] Контроль остатков

### Шаг 6: Финализация (1 неделя)
- [ ] Dashboard с реальными метриками
- [ ] Бюджеты и оповещения
- [ ] Audit log UI
- [ ] Demo data + sandbox reset
- [ ] Mobile QA (iOS Safari, Android Chrome)
- [ ] Production checklist

**Итого:** 6 недель на полную систему с нуля.

---

## 7. Миграция данных

### Что сохраняем из v1
- ✅ Все таблицы Supabase (tenants, users, membership_plans, memberships, events, bills, etc.)
- ✅ Учётные записи и RLS policies
- ✅ Файлы (если есть в Storage)

### Что добавляем
- Новые таблицы: counterparties, items, document_journal, journal_entries, cash_documents, currency_exchanges, wallet_transfers
- Folder tables для каждого справочника
- Расширение существующих таблиц (добавление counterparty_id, document_id, tags)

### План миграции
1. Создать новые таблицы (migration 003_v2_refactoring.sql)
2. Добавить недостающие поля в существующие таблицы
3. Перенести существующие bills → document_journal (один раз)
4. RLS policies для новых таблиц

---

## 8. Definition of Done (v2)

Система считается готовой, когда:

- [ ] Все 6 шагов закрыты
- [ ] Нет битых ссылок и пустых экранов
- [ ] Все финоперации идут через GL (проводки)
- [ ] Finder-like UI работает на всех справочниках
- [ ] Mobile-first: все ключевые операции с телефона
- [ ] Tap targets >= 44px
- [ ] Загрузка ключевых экранов <= 3 сек (mobile)
- [ ] QA pass: desktop + iOS Safari + Android Chrome
- [ ] Demo data заполнены
- [ ] Sandbox reset работает
- [ ] Документация для пользователя

---

## 9. Технические детали

### 9.1 Supabase RLS шаблон

Для всех таблиц:

```sql
CREATE POLICY "tenant_isolation_select"
ON table_name FOR SELECT
USING (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "tenant_isolation_insert"
ON table_name FOR INSERT
WITH CHECK (
  tenant_id::text = COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'tenant_id',
    auth.jwt() ->> 'tenant_id'
  )
);

-- аналогично для UPDATE, DELETE
```

### 9.2 Автонумерация документов

Функция Postgres:

```sql
CREATE OR REPLACE FUNCTION generate_doc_number(
  p_tenant_id UUID,
  p_doc_type TEXT,
  p_doc_date DATE
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix TEXT;
  v_seq INT;
  v_year TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM p_doc_date)::TEXT;
  v_prefix := p_doc_type || '-' || v_year || '-';
  
  SELECT COALESCE(MAX(SUBSTRING(doc_number FROM '\d+$')::INT), 0) + 1
  INTO v_seq
  FROM document_journal
  WHERE tenant_id = p_tenant_id
    AND doc_type = p_doc_type
    AND EXTRACT(YEAR FROM doc_date) = EXTRACT(YEAR FROM p_doc_date);
  
  RETURN v_prefix || LPAD(v_seq::TEXT, 4, '0');
END;
$$;
```

Использование:
```sql
INSERT INTO document_journal (tenant_id, doc_type, doc_date, doc_number, ...)
VALUES (
  'tenant-uuid',
  'PKO',
  '2026-03-02',
  generate_doc_number('tenant-uuid', 'PKO', '2026-03-02'),
  ...
);
-- result: PKO-2026-0001
```

### 9.3 Проводки: автоматизация

Триггер на document_journal:

```sql
CREATE OR REPLACE FUNCTION auto_post_journal_entries()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'posted' AND OLD.status = 'draft' THEN
    -- генерация проводок в зависимости от doc_type
    CASE NEW.doc_type
      WHEN 'PKO' THEN
        -- Dt: Cash, Kt: Income
        INSERT INTO journal_entries (tenant_id, document_id, entry_date, debit_account, credit_account, amount, currency)
        VALUES (NEW.tenant_id, NEW.id, NEW.doc_date, 'cash-account-id', 'income-account-id', NEW.amount, NEW.currency);
      WHEN 'RKO' THEN
        -- Dt: Expense, Kt: Cash
        INSERT INTO journal_entries (tenant_id, document_id, entry_date, debit_account, credit_account, amount, currency)
        VALUES (NEW.tenant_id, NEW.id, NEW.doc_date, 'expense-account-id', 'cash-account-id', NEW.amount, NEW.currency);
      -- добавить остальные типы
    END CASE;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_post
AFTER UPDATE ON document_journal
FOR EACH ROW
EXECUTE FUNCTION auto_post_journal_entries();
```

---

## 10. Следующие шаги (execution plan)

1. **Утверждение ТЗ v2** (сейчас) ✅
2. **Создать новый репозиторий** или ветку `v2-clean`
3. **Migration 003**: новые таблицы (counterparties, items, document_journal, journal_entries, ...)
4. **Scaffold новый frontend** (Vite + React + Supabase client)
5. **Шаг 1**: Layout + Auth + Справочник контрагентов (Finder UI)
6. **Последовательно шаги 2-6** без остановок
7. **QA + Demo data**
8. **Production release**

---

**Этот документ — source of truth для v2. Все решения фиксируем здесь.**

---

## 11. Credentials (Production)

**⚠️ СЕКРЕТНЫЕ ДАННЫЕ - НЕ ПУБЛИКОВАТЬ**

### Supabase

- **Project ID:** `iklibzcyfxcahbquuurv`
- **Project URL:** https://iklibzcyfxcahbquuurv.supabase.co
- **Database Host:** `db.iklibzcyfxcahbquuurv.supabase.co`
- **Database Name:** `postgres`
- **Database User:** `postgres`
- **Database Password:** `YbcErp2026_271347bf79c7581d`
- **Region:** EU Frankfurt (eu-central-1)

#### API Keys

**Anon Key (public):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrbGliemN5ZnhjYWhicXV1dXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNTg1NjEsImV4cCI6MjA4NzkzNDU2MX0.ezhQTWc_aWufFFAw3g55-LmRDRW14EUeLlEKv7ePCi4
```

**Service Role Key (секретный):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrbGliemN5ZnhjYWhicXV1dXJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM1ODU2MSwiZXhwIjoyMDg3OTM0NTYxfQ.DmLzLw9fQVb0huaI7EHq8qelGd6OTXKaEuir7bpgpPw
```

**Dashboard:** https://supabase.com/dashboard/project/iklibzcyfxcahbquuurv

---

### Cloudflare

- **Account ID:** `7ad4e6b4f3733aa39a4df60b14f3750e`
- **Zone ID (ybc.com.cy):** `f8c4ad0a630f84a1d205809d86259151`
- **API Token:** `ILVlj_w3A3iLKTeuu87cDQNXvZzJsz-d4OvgfSGE`
- **Production Domain:** https://erp.ybc.com.cy
- **Pages Project:** `ybc-erp`

**Dashboard:** https://dash.cloudflare.com/7ad4e6b4f3733aa39a4df60b14f3750e

---

### Admin Account

- **Tenant ID:** `e5a61f2f-5a98-4ff3-bd16-a53a6720dd00`
- **Tenant Name:** YBC Cyprus
- **Admin Email:** `Oleg.Polchyn@gmail.com`
- **Admin Role:** Owner
- **Password:** Временный (first login требует смены)

---

### GitHub Repository

- **Organization:** ybc-cy-erp
- **Repository:** ybc-erp
- **URL:** https://github.com/ybc-cy-erp/ybc-erp
- **Local Path:** `/tmp/ybc-erp/`

---

### Connection Strings

**PostgreSQL (Direct):**
```
postgresql://postgres:YbcErp2026_271347bf79c7581d@db.iklibzcyfxcahbquuurv.supabase.co:5432/postgres
```

**PostgreSQL (Pooler):**
```
postgresql://postgres.iklibzcyfxcahbquuurv:YbcErp2026_271347bf79c7581d@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

---

**Примечание:** Все креды действительны на 2026-03-02. При ротации ключей обновить этот раздел.
