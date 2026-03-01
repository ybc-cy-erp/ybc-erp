# YBC ERP - Quick Start Guide

## 🚀 Швидкий запуск у production (Railway)

### Варіант 1: Automatic Deployment (Рекомендовано)

#### 1. Railway Backend (5 хвилин)
```bash
# 1. Зайдіть на Railway
https://railway.app

# 2. New Project → Deploy from GitHub → ybc-cy-erp/ybc-erp

# 3. Додайте Environment Variables (Settings → Variables):
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://iklibzcyfxcahbquuurv.supabase.co
SUPABASE_ANON_KEY=<ваш-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<ваш-service-role-key>
JWT_SECRET=<згенеруйте-новий-секрет>
JWT_EXPIRES_IN=24h
CORS_ORIGIN=*

# 4. Deploy → чекайте 2-3 хвилини
# 5. Отримайте URL: https://ybc-erp-XXXXX.up.railway.app
# 6. Тест: curl https://ybc-erp-XXXXX.up.railway.app/health
```

#### 2. Railway Frontend (5 хвилин)
```bash
# 1. У тому ж Railway проекті → Add New Service
# 2. GitHub Repo → ybc-cy-erp/ybc-erp (знову)
# 3. Додайте змінну:
VITE_API_URL=https://ybc-erp-backend-XXXXX.up.railway.app/api

# 4. Deploy
# 5. Отримайте frontend URL
# 6. ВАЖЛИВО: Оновіть backend CORS_ORIGIN на frontend URL
```

#### 3. Фінальні кроки
```bash
# 1. Відкрийте frontend URL у браузері
# 2. Зареєструйтеся (перший користувач = Owner)
# 3. Перевірте що все працює
# 4. (Опціонально) Налаштуйте custom domain erp.ybc.com.cy
```

---

## 💻 Локальна розробка

### Prerequisites
- Node.js 18+
- npm або yarn
- Supabase account

### Backend
```bash
cd server
npm install

# Створіть .env (скопіюйте з .env.example)
cp .env.example .env

# Відредагуйте .env з вашими Supabase credentials

# Запустіть
npm run dev

# Сервер: http://localhost:3000
# Health check: http://localhost:3000/health
```

### Frontend
```bash
cd client
npm install

# Створіть .env
echo "VITE_API_URL=http://localhost:3000/api" > .env

# Запустіть
npm run dev

# App: http://localhost:5173
```

### Database (Supabase)
```bash
# 1. Зайдіть у Supabase Dashboard
# 2. SQL Editor → New Query
# 3. Скопіюйте вміст migrations/001_initial_schema.sql
# 4. Execute
# 5. Перевірте: 25 таблиць створено
```

---

## 🔑 Згенерувати JWT Secret

### Для production (обов'язково змініть!)
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Або OpenSSL
openssl rand -hex 32

# Або онлайн
https://generate-secret.vercel.app/32
```

---

## ✅ Швидка перевірка після deployment

### Backend Health
```bash
curl https://your-backend-url.up.railway.app/health
# Очікується: {"status":"ok","timestamp":"..."}
```

### Frontend
1. Відкрийте `https://your-frontend-url.up.railway.app`
2. Повинна з'явитися сторінка "Вхід до YBC ERP"
3. Українська мова ✅
4. Glassmorphism дизайн ✅

### Full Flow
1. Зареєструйтесь:
   - Назва організації: "YBC Cyprus"
   - Email: your@email.com
   - Пароль: (мінімум 8 символів)
   - Ім'я: Ваше ім'я
2. Після реєстрації → автоматичний вхід
3. Dashboard відкрився ✅
4. Метрики відображаються (поки 0) ✅

### Test CRUD
1. Тарифні плани → Створити план
2. Членства → Створити членство
3. Деталі членства → Заморозка → Додати
4. Dashboard → Перевірити оновлені метрики

---

## 🆘 Проблеми?

### Помилка 502 Bad Gateway
- Backend не запустився → перевірте Railway logs
- Перевірте чи всі env vars додані

### CORS Error
- Оновіть `CORS_ORIGIN` на backend точним URL frontend
- Формат: `https://exact-url.up.railway.app` (без слешу в кінці)

### База даних не підключається
- Перевірте Supabase credentials
- Переконайтесь що project active
- Перевірте RLS policies в Supabase Dashboard

### Білий екран на frontend
- Перевірте console у браузері (F12)
- Перевірте VITE_API_URL
- Перевірте чи backend відповідає на /health

---

## 📚 Повна документація

- **Deployment:** `DEPLOYMENT.md` (детальний гайд)
- **Deployment Checklist:** `DEPLOYMENT_CHECKLIST.md` (покроковий чеклист)
- **Vision:** `VISION.md` (продуктове бачення)
- **Tasks Week 1:** `TASKS.md` (15 задач)
- **Tasks Week 2:** `TASKS_WEEK2.md` (12 задач)
- **Test Plan Week 1:** `TEST_PLAN.md` (15 тестів)
- **Test Plan Week 2:** `TEST_PLAN_WEEK2.md` (24 тести)

---

## 🎉 Готово!

Якщо всі кроки пройдено успішно:
- ✅ Backend працює на Railway
- ✅ Frontend працює на Railway
- ✅ Можна зареєструватися та увійти
- ✅ Dashboard відображає метрики
- ✅ Можна створювати плани та членства

**Ваша YBC ERP система готова до використання!** 🚀

---

**Потрібна допомога?**
- GitHub Issues: https://github.com/ybc-cy-erp/ybc-erp/issues
- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs
