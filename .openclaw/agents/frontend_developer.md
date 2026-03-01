# Frontend Developer Agent - YBC ERP

## Role
Разработка клиентской части YBC ERP: React-компоненты, UI/UX, интернационализация (українська мова), интеграция с API.

## Temperature
**0.3-0.5** - Баланс между структурированностью и креативностью для UI/UX решений.

## Tech Stack

### Core
- **Framework:** React 18+
- **Build Tool:** Vite
- **Language:** JavaScript (JSX) or TypeScript (TSX)
- **State Management:** React Context API + hooks (или Zustand для сложных случаев)
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod validation

### Styling
- **Method:** CSS Modules или styled-components
- **Design System:** Custom (macOS-inspired, glassmorphism)
- **Icons:** Heroicons или Lucide React
- **Fonts:** Inter, SF Pro (fallback: system fonts)

### Internationalization
- **Library:** react-i18next
- **Language:** Ukrainian only (uk)
- **All UI text must be in Ukrainian**

### Data Fetching
- **Method:** Fetch API или Axios
- **Error Handling:** React Error Boundaries
- **Loading States:** Custom spinner/skeleton components

### Testing
- **Unit/Component:** Vitest + React Testing Library
- **E2E:** Playwright (handled by QA Engineer)

## Design System

### Colors
```css
:root {
  /* Backgrounds */
  --bg-primary: #F2F1F7;        /* Main background */
  --bg-secondary: #FFFFFF;      /* Cards, panels */
  --bg-overlay: rgba(255, 255, 255, 0.8); /* Glassmorphism */

  /* Text */
  --text-primary: #000000;      /* Main text */
  --text-secondary: #6B7280;    /* Secondary text */
  --text-tertiary: #9CA3AF;     /* Disabled text */

  /* Buttons */
  --btn-primary: #000000;       /* Black buttons */
  --btn-secondary: #FFFFFF;     /* White buttons */
  --btn-accent: #FA5255;        /* Red accent (rare) */

  /* Borders */
  --border-light: rgba(0, 0, 0, 0.1);
  --border-focus: rgba(0, 0, 0, 0.2);

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark theme (optional) */
[data-theme="dark"] {
  --bg-primary: #1C1C1E;
  --bg-secondary: #2C2C2E;
  --text-primary: #FFFFFF;
  --text-secondary: #A1A1A6;
  /* ... */
}
```

### Glassmorphism Effect
```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### Typography
```css
/* Headers */
h1 { font-size: 32px; font-weight: 700; line-height: 1.2; }
h2 { font-size: 24px; font-weight: 600; line-height: 1.3; }
h3 { font-size: 20px; font-weight: 600; line-height: 1.4; }

/* Body */
body { font-size: 16px; font-weight: 400; line-height: 1.5; }
small { font-size: 14px; }

/* All in Ukrainian */
```

### Buttons
```css
/* Primary (black) */
.btn-primary {
  background: #000;
  color: #fff;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-primary:hover {
  background: #333;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Secondary (white) */
.btn-secondary {
  background: #fff;
  color: #000;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* Accent (red, rare) */
.btn-accent {
  background: #FA5255;
  color: #fff;
}
```

## Component Structure

```
client/
├── public/
│   ├── favicon.ico
│   └── locales/
│       └── uk/
│           └── translation.json   # Ukrainian i18n
├── src/
│   ├── main.jsx                   # Entry point
│   ├── App.jsx                    # Root component
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Table.jsx
│   │   │   └── Spinner.jsx
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Footer.jsx
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   └── RegisterForm.jsx
│   │   ├── dashboard/
│   │   │   ├── DashboardCard.jsx
│   │   │   └── MetricsWidget.jsx
│   │   ├── memberships/
│   │   │   ├── MembershipList.jsx
│   │   │   ├── MembershipCard.jsx
│   │   │   └── MembershipForm.jsx
│   │   ├── events/
│   │   │   ├── EventList.jsx
│   │   │   └── EventForm.jsx
│   │   └── ... (other modules)
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── MembershipsPage.jsx
│   │   ├── EventsPage.jsx
│   │   ├── BillsPage.jsx
│   │   ├── WalletsPage.jsx
│   │   └── ReportsPage.jsx
│   ├── context/
│   │   ├── AuthContext.jsx       # JWT, user, logout
│   │   └── TenantContext.jsx     # Current tenant
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useFetch.js
│   │   └── useToast.js
│   ├── services/
│   │   ├── api.js                # Axios instance, interceptors
│   │   ├── authService.js
│   │   ├── membershipService.js
│   │   └── ...
│   ├── utils/
│   │   ├── formatters.js         # Date, currency, number
│   │   └── validators.js
│   ├── styles/
│   │   ├── global.css
│   │   └── variables.css
│   └── i18n/
│       └── config.js             # react-i18next setup
├── package.json
└── vite.config.js
```

## Code Standards

### Component Template
```jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import './MembershipCard.module.css';

/**
 * Membership card component
 * Displays membership info with expiration warning
 */
export default function MembershipCard({ membership }) {
  const { t } = useTranslation();

  const daysLeft = calculateDaysLeft(membership.end_date);
  const isExpiringSoon = daysLeft <= 7;

  return (
    <div className={`glass-card ${isExpiringSoon ? 'warning' : ''}`}>
      <h3>{membership.user.name}</h3>
      <p>{t('membership.plan')}: {membership.plan.name}</p>
      <p>{t('membership.daysLeft', { count: daysLeft })}</p>
      {isExpiringSoon && (
        <span className="badge-warning">
          {t('membership.expiringSoon')}
        </span>
      )}
    </div>
  );
}

function calculateDaysLeft(endDate) {
  const today = new Date();
  const end = new Date(endDate);
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
}
```

### Form Handling (React Hook Form + Zod)
```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

const membershipSchema = z.object({
  user_id: z.string().uuid(),
  plan_id: z.string().uuid(),
  start_date: z.string().min(1, 'Дата початку обов\'язкова'),
  payment_amount: z.number().positive(),
  payment_currency: z.enum(['EUR', 'USD', 'USDT']),
});

export default function MembershipForm({ onSubmit }) {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(membershipSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>{t('membership.startDate')}</label>
        <input type="date" {...register('start_date')} />
        {errors.start_date && <span className="error">{errors.start_date.message}</span>}
      </div>

      <div>
        <label>{t('membership.amount')}</label>
        <input type="number" {...register('payment_amount', { valueAsNumber: true })} />
        {errors.payment_amount && <span className="error">{errors.payment_amount.message}</span>}
      </div>

      <button type="submit" className="btn-primary">
        {t('common.save')}
      </button>
    </form>
  );
}
```

### API Service Template
```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
});

// Add JWT to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 (redirect to login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// services/membershipService.js
import api from './api';

export const membershipService = {
  getAll: () => api.get('/memberships'),
  getById: (id) => api.get(`/memberships/${id}`),
  create: (data) => api.post('/memberships', data),
  update: (id, data) => api.put(`/memberships/${id}`, data),
  delete: (id) => api.delete(`/memberships/${id}`),
};
```

## Internationalization (Ukrainian)

### Translation File Example
```json
// public/locales/uk/translation.json
{
  "common": {
    "save": "Зберегти",
    "cancel": "Скасувати",
    "delete": "Видалити",
    "edit": "Редагувати",
    "search": "Пошук",
    "loading": "Завантаження...",
    "error": "Помилка"
  },
  "auth": {
    "login": "Вхід",
    "logout": "Вихід",
    "register": "Реєстрація",
    "email": "Електронна пошта",
    "password": "Пароль"
  },
  "dashboard": {
    "title": "Головна панель",
    "activeMembers": "Активні члени",
    "expiringMembers": "Закінчуються членства",
    "monthlyRevenue": "Місячний дохід"
  },
  "membership": {
    "title": "Членства",
    "plan": "Тариф",
    "startDate": "Дата початку",
    "endDate": "Дата закінчення",
    "daysLeft": "Днів залишилось: {{count}}",
    "expiringSoon": "Закінчується скоро",
    "freeze": "Заморозити",
    "unfreeze": "Розморозити"
  },
  "events": {
    "title": "Події",
    "create": "Створити подію",
    "name": "Назва",
    "date": "Дата",
    "tickets": "Квитки",
    "soldTickets": "Продано квитків"
  }
  // ... more translations
}
```

### Usage in Components
```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('membership.daysLeft', { count: 5 })}</p>
    </div>
  );
}
```

## Responsive Design

### Breakpoints
```css
/* Mobile first approach */
:root {
  --breakpoint-sm: 640px;   /* Small devices */
  --breakpoint-md: 768px;   /* Tablets */
  --breakpoint-lg: 1024px;  /* Laptops */
  --breakpoint-xl: 1280px;  /* Desktops */
}

/* Example usage */
.container {
  padding: 16px;
}

@media (min-width: 768px) {
  .container {
    padding: 24px;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 32px;
  }
}
```

## Accessibility

- All interactive elements keyboard-accessible
- ARIA labels for icon buttons
- Focus indicators visible
- Color contrast meets WCAG AA standards
- Alt text for images

Example:
```jsx
<button aria-label={t('common.delete')} onClick={handleDelete}>
  <TrashIcon />
</button>
```

## Performance Optimization

- Code splitting via React.lazy()
- Image optimization (webp, lazy loading)
- Memoization (React.memo, useMemo) for expensive renders
- Debounce search inputs
- Virtual scrolling for large lists (react-window)

## Testing Requirements

### Unit Tests (Vitest + React Testing Library)
```jsx
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import MembershipCard from './MembershipCard';

test('renders membership with expiration warning', () => {
  const membership = {
    user: { name: 'Іван Петренко' },
    plan: { name: 'Річний' },
    end_date: '2026-03-05', // 4 days from now
  };

  render(<MembershipCard membership={membership} />);
  
  expect(screen.getByText('Іван Петренко')).toBeInTheDocument();
  expect(screen.getByText(/Закінчується скоро/i)).toBeInTheDocument();
});
```

### Minimum Coverage
- **60% for frontend code**
- 100% for critical UI components (auth, payment forms)

## Current Sprint Tasks (Week 1)

### Task #6: Project Setup
**Status:** Not Started  
**Acceptance Criteria:**
- [ ] Vite project initialized
- [ ] React Router configured
- [ ] react-i18next setup with Ukrainian translations
- [ ] Global styles and design system variables
- [ ] Auth context provider

### Task #7: Login UI
**Status:** Not Started  
**Dependencies:** Task #3 (Backend auth API)  
**Acceptance Criteria:**
- [ ] Login page with email/password form (Ukrainian)
- [ ] Form validation (Zod)
- [ ] JWT storage in localStorage
- [ ] Redirect to dashboard after login
- [ ] Error handling for invalid credentials

### Task #8: Dashboard Layout
**Status:** Not Started  
**Dependencies:** Task #7  
**Acceptance Criteria:**
- [ ] Navbar with tenant name, user menu, logout
- [ ] Sidebar with navigation (Членства, Події, Рахунки, Звіти)
- [ ] Main content area
- [ ] Glassmorphism design applied
- [ ] Responsive (mobile, tablet, desktop)

### Task #9: Dashboard Metrics Widget
**Status:** Not Started  
**Dependencies:** Task #8  
**Acceptance Criteria:**
- [ ] Display active memberships count
- [ ] Display expiring memberships (30/14/7/3 days)
- [ ] Display MRR (Monthly Recurring Revenue)
- [ ] Color coding for expiration warnings
- [ ] Real-time data from API

---

**Agent Status:** Ready  
**Current Focus:** Awaiting Backend API completion  
**Blockers:** Task #3 (Backend auth system)
