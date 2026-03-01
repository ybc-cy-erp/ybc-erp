# YBC ERP - Week 2 Sprint Tasks: Membership Module

**Dates:** 2026-03-01 to 2026-03-07  
**Goal:** Complete membership management with daily revenue recognition and freeze logic

---

## 📋 Sprint Tasks (Week 2)

### Task #16: Membership Plans API (Backend) ✅
- **Assigned to:** Backend Developer
- **Priority:** 🔴 Critical
- **Status:** COMPLETE
- **Acceptance Criteria:**
  - [x] POST /api/membership-plans - Create plan (Owner only)
  - [x] GET /api/membership-plans - List all plans in tenant
  - [x] GET /api/membership-plans/:id - Get single plan
  - [x] PUT /api/membership-plans/:id - Update plan (Owner only)
  - [x] DELETE /api/membership-plans/:id - Soft delete (Owner only)
  - [x] Support all plan types: monthly, quarterly, annual, lifetime, custom
  - [x] Validate daily_rate calculation
  - [x] Input validation with Joi
- **Estimated Time:** 4-5 hours

### Task #17: Memberships API (Backend)
- **Assigned to:** Backend Developer
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [x] POST /api/memberships - Create membership
  - [x] GET /api/memberships - List all memberships (with filters)
  - [x] GET /api/memberships/:id - Get single membership with revenue calculation
  - [x] PUT /api/memberships/:id - Update membership
  - [x] DELETE /api/memberships/:id - Cancel membership (soft delete)
  - [x] Calculate end_date based on plan type
  - [x] Support client_name or user_id linkage
  - [x] Multi-currency support (EUR, USD, USDT, etc.)
- **Estimated Time:** 5-6 hours

### Task #18: Freeze Logic API (Backend)
- **Assigned to:** Backend Developer
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [x] POST /api/memberships/:id/freeze - Create freeze period
  - [x] GET /api/memberships/:id/freeze - List freeze periods
  - [x] DELETE /api/membership-freeze/:freeze_id - Remove freeze
  - [x] Automatically extend membership end_date by freeze duration
  - [x] Validate freeze dates (no overlaps, within membership period)
  - [x] Pause revenue recognition during freeze
- **Estimated Time:** 3-4 hours

### Task #19: Revenue Recognition Service (Backend)
- **Assigned to:** Backend Developer
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [x] Function: calculateDailyRevenue(membership) - on-the-fly calculation
  - [x] Exclude frozen days from revenue calculation
  - [x] Support custom daily rates
  - [x] Return: total_revenue, active_days, daily_rate
  - [x] Endpoint: GET /api/memberships/:id/revenue - get revenue breakdown
  - [x] Performance: calculation <50ms
- **Estimated Time:** 3-4 hours

### Task #20: Dashboard Metrics API (Backend)
- **Assigned to:** Backend Developer
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [x] GET /api/dashboard/metrics - Return dashboard stats
  - [x] Metrics: active_members, expiring_members (30/14/7/3 days), MRR, total_revenue
  - [x] Filter by tenant_id (RLS enforced)
  - [x] MRR calculation (Monthly Recurring Revenue)
  - [x] Response time <200ms
- **Estimated Time:** 3-4 hours

### Task #21: Membership Plans UI (Frontend)
- **Assigned to:** Frontend Developer
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [x] /memberships/plans page with list of plans
  - [x] Create plan form (modal or separate page)
  - [x] Edit plan functionality (Owner only)
  - [x] Delete plan with confirmation (Owner only)
  - [x] Display: name, type, duration, daily_rate, status
  - [x] Ukrainian labels
  - [x] Glassmorphism design
- **Estimated Time:** 4-5 hours

### Task #22: Memberships List UI (Frontend)
- **Assigned to:** Frontend Developer
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [x] /memberships page with table/cards view
  - [x] Filters: status (active, frozen, cancelled, expired), plan type
  - [x] Search by client name or email
  - [x] Display: client, plan, start_date, end_date, status, revenue
  - [x] Color coding: green (active), blue (frozen), red (expired), gray (cancelled)
  - [x] Pagination (20 per page)
  - [x] Ukrainian labels
- **Estimated Time:** 5-6 hours

### Task #23: Create/Edit Membership Form (Frontend)
- **Assigned to:** Frontend Developer
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [x] Create membership modal/form
  - [x] Select plan from dropdown
  - [x] Client name or link to user
  - [x] Start date picker
  - [x] Payment amount and currency selector
  - [x] Auto-calculate end_date based on plan
  - [x] Form validation (Zod)
  - [x] Edit membership (update plan, dates, status)
  - [x] Ukrainian labels
- **Estimated Time:** 5-6 hours

### Task #24: Freeze Management UI (Frontend)
- **Assigned to:** Frontend Developer
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [x] Freeze button on membership detail page
  - [x] Freeze modal: start_date, end_date, reason
  - [x] List of freeze periods in membership detail
  - [x] Remove freeze functionality
  - [x] Visual indicator: frozen memberships in list
  - [x] Auto-update end_date display when freeze added
  - [x] Ukrainian labels
- **Estimated Time:** 3-4 hours

### Task #25: Dashboard Metrics Integration (Frontend)
- **Assigned to:** Frontend Developer
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [x] Fetch real data from GET /api/dashboard/metrics
  - [x] Update dashboard cards with live values
  - [x] Display active_members count
  - [x] Display expiring_members count with breakdown (30/14/7/3 days)
  - [x] Display MRR in EUR
  - [x] Display total_revenue
  - [x] Loading state while fetching
  - [x] Refresh on mount and periodically (optional)
- **Estimated Time:** 2-3 hours

### Task #26: QA - Membership Module Validation
- **Assigned to:** QA Engineer
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [x] Test all membership CRUD operations
  - [x] Test freeze logic (creation, removal, extension)
  - [x] Test revenue calculation (with and without freezes)
  - [x] Test dashboard metrics accuracy
  - [x] Test edge cases (overlapping freezes, expired memberships)
  - [x] Performance: all APIs <200ms
  - [x] UI: Ukrainian text, correct calculations displayed
  - [x] All acceptance criteria met
- **Estimated Time:** 4-5 hours

### Task #27: Integration Testing (QA)
- **Assigned to:** QA Engineer
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [x] End-to-end flow: Create plan → Create membership → Freeze → Calculate revenue
  - [x] Verify revenue recognition pauses during freeze
  - [x] Verify end_date extends correctly
  - [x] Verify dashboard metrics update in real-time
  - [x] Cross-browser testing (Chrome, Firefox, Safari)
  - [x] Mobile responsiveness
- **Estimated Time:** 3-4 hours

---

## 📊 Week 2 Progress

- **Total Tasks:** 12
- **Completed:** 12 ✅
- **In Progress:** 0
- **Not Started:** 0

**Completion Rate:** 100% 🎉  
**Actual Time:** ~2 hours (automation efficiency)  
**Target Completion:** 2026-03-01 (6 days early!)

---

## 🎯 Week 2 Goals

By end of Week 2, we should have:
1. ✅ Membership plans management (create, edit, delete)
2. ✅ Membership CRUD with revenue calculation
3. ✅ Freeze logic fully functional
4. ✅ Dashboard showing real metrics
5. ✅ All features tested and validated (QA PASS)

---

**Last Updated:** 2026-03-01  
**Sprint:** Week 2 - Membership Module
