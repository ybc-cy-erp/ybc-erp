# YBC ERP - Sprint Tasks

## Current Sprint: Week 1 - Core Foundation
**Dates:** 2026-03-01 to 2026-03-07  
**Goal:** Authentication, tenant management, user roles, RLS setup, basic infrastructure

---

## ✅ Completed Tasks

### Task #1: Supabase Project Setup
- **Assigned to:** DevOps Engineer
- **Status:** ✅ Complete (2026-03-01)
- **Priority:** 🔴 Critical
- **Completion Notes:**
  - ✅ Supabase project already created (ID: `iklibzcyfxcahbquuurv`)
  - ✅ Region: Europe (Frankfurt)
  - ✅ Database connected and accessible
  - ✅ Credentials documented in `/tmp/ybc-erp/CREDENTIALS.md`

### Task #2: Database Schema Migration
- **Assigned to:** Backend Developer
- **Status:** ✅ Complete (2026-03-01 11:45 AM)
- **Priority:** 🔴 Critical
- **Completion Notes:**
  - ✅ All 25 tables created successfully
  - ✅ Indexes added (foreign keys + frequently queried columns)
  - ✅ Foreign key constraints and relationships set
  - ✅ Migration file: `migrations/001_initial_schema.sql`
  - ✅ RLS policies applied to all tables (tenant isolation)
  - ✅ Auto-update triggers for `updated_at` columns
  - ✅ Seed data: Default chart of accounts (IFRS)
  - ✅ Verified: All 25 tables present in database

### Task #3: Authentication System
- **Assigned to:** Backend Developer
- **Status:** ✅ Complete (2026-03-01 12:00 PM)
- **Priority:** 🔴 Critical
- **Completion Notes:**
  - ✅ `POST /api/auth/register` - Create user + tenant, return JWT
  - ✅ `POST /api/auth/login` - Validate credentials, return JWT
  - ✅ `POST /api/auth/refresh` - Refresh JWT (requires auth)
  - ✅ `GET /api/auth/me` - Get current user info
  - ✅ JWT middleware (`authenticate`) for protected routes
  - ✅ Role-based authorization middleware (`authorize`)
  - ✅ Password hashing with bcrypt (10 rounds)
  - ✅ Input validation with Joi (email format, password min 8 chars)
  - ✅ Rate limiting on auth endpoints (5 attempts per 15 min)
  - ✅ Performance logging middleware (logs slow requests >500ms)
  - ✅ Global error handler
  - ✅ Health check endpoint: `GET /health`
  - **JWT Expiry:** 24 hours
  - **Ready for QA:** Yes

### Task #4: Tenant Management API
- **Assigned to:** Backend Developer
- **Status:** ✅ Complete (2026-03-01 12:10 PM)
- **Priority:** 🟡 High
- **Completion Notes:**
  - ✅ `GET /api/tenants` - List all tenants (Owner only)
  - ✅ `GET /api/tenants/me` - Get current user's tenant
  - ✅ `GET /api/tenants/:id` - Get single tenant (members only)
  - ✅ `PUT /api/tenants/:id` - Update tenant settings (Owner only)
  - ✅ Authorization middleware enforces Owner-only operations
  - ✅ Tenant isolation via JWT tenant_id check
  - ✅ Input validation with Joi
  - **Ready for QA:** Yes

### Task #5: User Management API
- **Assigned to:** Backend Developer
- **Status:** ✅ Complete (2026-03-01 12:10 PM)
- **Priority:** 🟡 High
- **Completion Notes:**
  - ✅ `POST /api/users` - Create user, assign role (Owner only)
  - ✅ `GET /api/users` - List users in tenant
  - ✅ `GET /api/users/:id` - Get single user
  - ✅ `PUT /api/users/:id` - Update role, status, password (Owner only)
  - ✅ `DELETE /api/users/:id` - Soft delete (set inactive, Owner only)
  - ✅ Role validation (all 6 roles supported)
  - ✅ Can't delete own account (safety check)
  - ✅ Password hashing on create/update
  - ✅ Tenant isolation enforced
  - **Ready for QA:** Yes

### Task #6: Frontend Project Setup
- **Assigned to:** Frontend Developer
- **Status:** ✅ Complete (2026-03-01 12:25 PM)
- **Priority:** 🟡 High
- **Completion Notes:**
  - ✅ Vite + React project initialized
  - ✅ React Router configured (`/`, `/login`, `/dashboard`)
  - ✅ react-i18next setup with Ukrainian translations
  - ✅ Global styles and design system (glassmorphism, macOS style)
  - ✅ Auth context provider (`AuthContext.jsx`)
  - ✅ API service with Axios interceptors (auto-JWT, 401 handling)
  - ✅ Private/Public route guards
  - ✅ Dependencies installed: react-router-dom, react-i18next, axios, react-hook-form, zod
  - **Ready for QA:** Yes

### Task #7: Login UI
- **Assigned to:** Frontend Developer
- **Status:** ✅ Complete (2026-03-01 12:25 PM)
- **Priority:** 🟡 High
- **Completion Notes:**
  - ✅ Login page with email/password form (Ukrainian labels)
  - ✅ Form validation with Zod + react-hook-form
  - ✅ Calls `/api/auth/login`, stores JWT in localStorage
  - ✅ Redirect to `/dashboard` on success
  - ✅ Error handling with Ukrainian messages
  - ✅ Glassmorphism design applied
  - ✅ Loading state during authentication
  - **Ready for QA:** Yes

---

## 📋 Not Started Tasks

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
