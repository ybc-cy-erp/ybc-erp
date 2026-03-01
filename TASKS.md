# YBC ERP - Sprint Tasks

## Current Sprint: Week 1 - Core Foundation
**Dates:** 2026-03-01 to 2026-03-07  
**Goal:** Authentication, tenant management, user roles, RLS setup, basic infrastructure

---

## 🚧 Blocked Tasks

### Task #1: Supabase Project Setup
- **Assigned to:** DevOps Engineer
- **Status:** ⛔ Blocked (waiting for Supabase access token from user)
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [ ] Supabase project created (name: `ybc-erp`, region: Europe)
  - [ ] Database connected and accessible
  - [ ] Environment variables configured in Railway
  - [ ] RLS enabled globally on database
- **Dependencies:** None
- **Blocker:** User (Олег) must provide Supabase access token
- **Notes:** This blocks all backend development; highest priority to unblock

---

## 📋 Not Started Tasks

### Task #2: Database Schema Migration
- **Assigned to:** Backend Developer
- **Status:** 📝 Not Started
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [ ] All 25 tables created with correct schema
  - [ ] Indexes added for performance (foreign keys, frequently queried columns)
  - [ ] Foreign key constraints and relationships set
  - [ ] Migration files versioned (`001_initial_schema.sql`, etc.)
  - [ ] RLS policies applied to all tables (filter by `tenant_id`)
- **Dependencies:** Task #1 (Supabase setup)
- **Estimated Time:** 4-6 hours
- **Notes:** See `/docs/database-schema.md` for full table definitions

### Task #3: Authentication System
- **Assigned to:** Backend Developer
- **Status:** 📝 Not Started
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [ ] `POST /api/auth/register` - Create user + tenant, return JWT
  - [ ] `POST /api/auth/login` - Validate credentials, return JWT
  - [ ] `POST /api/auth/refresh` - Refresh JWT before expiration
  - [ ] JWT middleware for protected routes
  - [ ] Password hashing with bcrypt (min 10 rounds)
  - [ ] Input validation (email format, password strength)
- **Dependencies:** Task #2 (Database schema)
- **Estimated Time:** 6-8 hours
- **Notes:** JWT expires in 24h, refresh token valid for 7 days

### Task #4: Tenant Management API
- **Assigned to:** Backend Developer
- **Status:** 📝 Not Started
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] `GET /api/tenants` - List all tenants (Owner only)
  - [ ] `GET /api/tenants/:id` - Get single tenant (members only)
  - [ ] `PUT /api/tenants/:id` - Update tenant settings (Owner only)
  - [ ] RLS enforces tenant isolation (users can't see other tenants)
- **Dependencies:** Task #3 (Auth system)
- **Estimated Time:** 3-4 hours

### Task #5: User Management API
- **Assigned to:** Backend Developer
- **Status:** 📝 Not Started
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] `POST /api/users` - Create user, assign role (Owner only)
  - [ ] `GET /api/users` - List users in tenant
  - [ ] `GET /api/users/:id` - Get single user
  - [ ] `PUT /api/users/:id` - Update role, status (Owner only)
  - [ ] `DELETE /api/users/:id` - Soft delete user (Owner only)
  - [ ] Role validation (Owner, Accountant, Manager, Event Manager, Cashier, Analyst)
- **Dependencies:** Task #3 (Auth system)
- **Estimated Time:** 4-5 hours

### Task #6: Frontend Project Setup
- **Assigned to:** Frontend Developer
- **Status:** 📝 Not Started
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] Vite + React project initialized
  - [ ] React Router configured (routes: `/login`, `/dashboard`, etc.)
  - [ ] react-i18next setup with Ukrainian translations (`/public/locales/uk/translation.json`)
  - [ ] Global styles and design system variables (`styles/variables.css`)
  - [ ] Auth context provider (`context/AuthContext.jsx`)
  - [ ] API service setup (`services/api.js` with Axios interceptors)
- **Dependencies:** None
- **Estimated Time:** 3-4 hours

### Task #7: Login UI
- **Assigned to:** Frontend Developer
- **Status:** 📝 Not Started
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] Login page with email/password form (Ukrainian labels)
  - [ ] Form validation with Zod (email format, password min 8 chars)
  - [ ] Submit calls `/api/auth/login`, stores JWT in localStorage
  - [ ] Redirect to `/dashboard` on success
  - [ ] Error handling for invalid credentials (display error in Ukrainian)
  - [ ] Glassmorphism design applied
- **Dependencies:** Task #3 (Backend auth API), Task #6 (Frontend setup)
- **Estimated Time:** 4-5 hours

### Task #8: Dashboard Layout
- **Assigned to:** Frontend Developer
- **Status:** 📝 Not Started
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] Navbar with tenant name, user menu, logout button
  - [ ] Sidebar with navigation links (Головна, Членства, Події, Рахунки, Гаманці, Звіти)
  - [ ] Main content area (glassmorphism card)
  - [ ] Responsive design (mobile, tablet, desktop)
  - [ ] Ukrainian text for all UI elements
- **Dependencies:** Task #7 (Login UI)
- **Estimated Time:** 5-6 hours

### Task #9: Dashboard Metrics Widget
- **Assigned to:** Frontend Developer
- **Status:** 📝 Not Started
- **Priority:** 🟢 Medium
- **Acceptance Criteria:**
  - [ ] Display active memberships count
  - [ ] Display expiring memberships (30/14/7/3 days) with color coding
  - [ ] Display MRR (Monthly Recurring Revenue)
  - [ ] Fetch real-time data from API (placeholder endpoint for now)
  - [ ] Loading state (spinner) while fetching
- **Dependencies:** Task #8 (Dashboard layout)
- **Estimated Time:** 3-4 hours
- **Notes:** API endpoint will be implemented in Week 2, use mock data for now

### Task #10: QA Setup
- **Assigned to:** QA Engineer
- **Status:** 📝 Not Started
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] `TEST_PLAN.md` created with Week 1 test cases
  - [ ] `BUGS.md` template ready for bug tracking
  - [ ] Playwright configured for E2E tests
  - [ ] Postman collection for API testing (auth endpoints)
  - [ ] Test database environment setup (separate from production)
- **Dependencies:** None
- **Estimated Time:** 3-4 hours

### Task #11: Validate Auth System
- **Assigned to:** QA Engineer
- **Status:** 📝 Not Started
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [ ] TC-001 (User Registration) passed
  - [ ] TC-002 (User Login) passed
  - [ ] TC-003 (Protected Endpoint Access) passed
  - [ ] Security tests (SQL injection, XSS) passed
  - [ ] Performance: login endpoint <100ms response time
  - [ ] All edge cases tested (invalid email, weak password, etc.)
- **Dependencies:** Task #3 (Backend auth), Task #7 (Frontend login)
- **Estimated Time:** 4-5 hours
- **Notes:** Must achieve `QA PASS` before sprint completion

### Task #12: Validate Tenant Management
- **Assigned to:** QA Engineer
- **Status:** 📝 Not Started
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] Tenant CRUD operations work correctly
  - [ ] RLS enforced (attempt cross-tenant access, expect 403 or no data)
  - [ ] Only Owner can modify tenant settings
  - [ ] All fields validated (no empty names, etc.)
  - [ ] API response time <200ms
- **Dependencies:** Task #4 (Backend tenant API)
- **Estimated Time:** 3-4 hours

### Task #13: Railway Backend Deployment
- **Assigned to:** DevOps Engineer
- **Status:** 📝 Not Started
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] Backend service deployed on Railway
  - [ ] Environment variables configured (see DevOps agent docs)
  - [ ] Health check endpoint (`GET /health`) returns 200 OK
  - [ ] Auto-deploy on push to `main` configured
  - [ ] Logs visible and readable in Railway dashboard
- **Dependencies:** Task #2 (Database schema)
- **Estimated Time:** 2-3 hours

### Task #14: Railway Frontend Deployment
- **Assigned to:** DevOps Engineer
- **Status:** 📝 Not Started
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] Frontend service deployed on Railway
  - [ ] Environment variables configured (`VITE_API_URL`, `VITE_SUPABASE_URL`)
  - [ ] Custom domain `erp.ybc.com.cy` configured (or Railway subdomain)
  - [ ] HTTPS enabled (SSL certificate auto-provisioned)
  - [ ] Auto-deploy on push to `main`
- **Dependencies:** Task #6 (Frontend setup)
- **Estimated Time:** 2-3 hours

### Task #15: Monitoring Setup
- **Assigned to:** DevOps Engineer
- **Status:** 📝 Not Started
- **Priority:** 🟢 Medium
- **Acceptance Criteria:**
  - [ ] UptimeRobot monitoring configured (backend `/health` endpoint)
  - [ ] Telegram alert bot configured (sends alerts to DevOps channel)
  - [ ] Performance logging middleware added (logs requests >500ms)
  - [ ] Error tracking functional (Winston logs to stdout, Railway captures)
- **Dependencies:** Task #13 (Backend deployment)
- **Estimated Time:** 2-3 hours

---

## ✅ Completed Tasks

(None yet - sprint just starting)

---

## 🐛 Active Bugs

(See `BUGS.md` for detailed bug tracker)

---

## 📊 Sprint Progress

- **Total Tasks:** 15
- **Completed:** 0
- **In Progress:** 0
- **Blocked:** 1 (Task #1)
- **Not Started:** 14

**Critical Path:**  
Task #1 → Task #2 → Task #3 → Task #7 → Task #11 (QA validation)

**Blocker Alert:** 🚨 Task #1 is blocking 6 other tasks. **Urgent:** Need Supabase access token from user.

---

## 🎯 Sprint Goals (Week 1)

By end of Week 1 (March 7, 2026), we should have:

1. ✅ Supabase project and database fully operational
2. ✅ All 25 tables created with RLS policies
3. ✅ Authentication system working (register, login, JWT)
4. ✅ Tenant and user management APIs functional
5. ✅ Login UI and dashboard layout live
6. ✅ Backend and frontend deployed to Railway
7. ✅ All tasks passed QA validation (`QA PASS`)
8. ✅ Zero critical or high bugs open

**Definition of Done for Week 1:**
- All acceptance criteria met for all tasks
- QA Engineer signs off with `QA PASS`
- Deployed to staging environment
- Ready to start Week 2 (Membership module)

---

**Last Updated:** 2026-03-01 11:30 AM  
**Next Review:** 2026-03-03 (mid-sprint checkpoint)
