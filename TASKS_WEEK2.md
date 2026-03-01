# YBC ERP - Week 2 Sprint Tasks: Membership Module

**Dates:** 2026-03-01 to 2026-03-07  
**Goal:** Complete membership management with daily revenue recognition and freeze logic

---

## 📋 Sprint Tasks (Week 2)

### Task #16: Membership Plans API (Backend)
- **Assigned to:** Backend Developer
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [ ] POST /api/membership-plans - Create plan (Owner only)
  - [ ] GET /api/membership-plans - List all plans in tenant
  - [ ] GET /api/membership-plans/:id - Get single plan
  - [ ] PUT /api/membership-plans/:id - Update plan (Owner only)
  - [ ] DELETE /api/membership-plans/:id - Soft delete (Owner only)
  - [ ] Support all plan types: monthly, quarterly, annual, lifetime, custom
  - [ ] Validate daily_rate calculation
  - [ ] Input validation with Joi
- **Estimated Time:** 4-5 hours

### Task #17: Memberships API (Backend)
- **Assigned to:** Backend Developer
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [ ] POST /api/memberships - Create membership
  - [ ] GET /api/memberships - List all memberships (with filters)
  - [ ] GET /api/memberships/:id - Get single membership with revenue calculation
  - [ ] PUT /api/memberships/:id - Update membership
  - [ ] DELETE /api/memberships/:id - Cancel membership (soft delete)
  - [ ] Calculate end_date based on plan type
  - [ ] Support client_name or user_id linkage
  - [ ] Multi-currency support (EUR, USD, USDT, etc.)
- **Estimated Time:** 5-6 hours

### Task #18: Freeze Logic API (Backend)
- **Assigned to:** Backend Developer
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] POST /api/memberships/:id/freeze - Create freeze period
  - [ ] GET /api/memberships/:id/freeze - List freeze periods
  - [ ] DELETE /api/membership-freeze/:freeze_id - Remove freeze
  - [ ] Automatically extend membership end_date by freeze duration
  - [ ] Validate freeze dates (no overlaps, within membership period)
  - [ ] Pause revenue recognition during freeze
- **Estimated Time:** 3-4 hours

### Task #19: Revenue Recognition Service (Backend)
- **Assigned to:** Backend Developer
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [ ] Function: calculateDailyRevenue(membership) - on-the-fly calculation
  - [ ] Exclude frozen days from revenue calculation
  - [ ] Support custom daily rates
  - [ ] Return: total_revenue, active_days, daily_rate
  - [ ] Endpoint: GET /api/memberships/:id/revenue - get revenue breakdown
  - [ ] Performance: calculation <50ms
- **Estimated Time:** 3-4 hours

### Task #20: Dashboard Metrics API (Backend)
- **Assigned to:** Backend Developer
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] GET /api/dashboard/metrics - Return dashboard stats
  - [ ] Metrics: active_members, expiring_members (30/14/7/3 days), MRR, total_revenue
  - [ ] Filter by tenant_id (RLS enforced)
  - [ ] MRR calculation (Monthly Recurring Revenue)
  - [ ] Response time <200ms
- **Estimated Time:** 3-4 hours

### Task #21: Membership Plans UI (Frontend)
- **Assigned to:** Frontend Developer
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] /memberships/plans page with list of plans
  - [ ] Create plan form (modal or separate page)
  - [ ] Edit plan functionality (Owner only)
  - [ ] Delete plan with confirmation (Owner only)
  - [ ] Display: name, type, duration, daily_rate, status
  - [ ] Ukrainian labels
  - [ ] Glassmorphism design
- **Estimated Time:** 4-5 hours

### Task #22: Memberships List UI (Frontend)
- **Assigned to:** Frontend Developer
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [ ] /memberships page with table/cards view
  - [ ] Filters: status (active, frozen, cancelled, expired), plan type
  - [ ] Search by client name or email
  - [ ] Display: client, plan, start_date, end_date, status, revenue
  - [ ] Color coding: green (active), blue (frozen), red (expired), gray (cancelled)
  - [ ] Pagination (20 per page)
  - [ ] Ukrainian labels
- **Estimated Time:** 5-6 hours

### Task #23: Create/Edit Membership Form (Frontend)
- **Assigned to:** Frontend Developer
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [ ] Create membership modal/form
  - [ ] Select plan from dropdown
  - [ ] Client name or link to user
  - [ ] Start date picker
  - [ ] Payment amount and currency selector
  - [ ] Auto-calculate end_date based on plan
  - [ ] Form validation (Zod)
  - [ ] Edit membership (update plan, dates, status)
  - [ ] Ukrainian labels
- **Estimated Time:** 5-6 hours

### Task #24: Freeze Management UI (Frontend)
- **Assigned to:** Frontend Developer
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] Freeze button on membership detail page
  - [ ] Freeze modal: start_date, end_date, reason
  - [ ] List of freeze periods in membership detail
  - [ ] Remove freeze functionality
  - [ ] Visual indicator: frozen memberships in list
  - [ ] Auto-update end_date display when freeze added
  - [ ] Ukrainian labels
- **Estimated Time:** 3-4 hours

### Task #25: Dashboard Metrics Integration (Frontend)
- **Assigned to:** Frontend Developer
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] Fetch real data from GET /api/dashboard/metrics
  - [ ] Update dashboard cards with live values
  - [ ] Display active_members count
  - [ ] Display expiring_members count with breakdown (30/14/7/3 days)
  - [ ] Display MRR in EUR
  - [ ] Display total_revenue
  - [ ] Loading state while fetching
  - [ ] Refresh on mount and periodically (optional)
- **Estimated Time:** 2-3 hours

### Task #26: QA - Membership Module Validation
- **Assigned to:** QA Engineer
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [ ] Test all membership CRUD operations
  - [ ] Test freeze logic (creation, removal, extension)
  - [ ] Test revenue calculation (with and without freezes)
  - [ ] Test dashboard metrics accuracy
  - [ ] Test edge cases (overlapping freezes, expired memberships)
  - [ ] Performance: all APIs <200ms
  - [ ] UI: Ukrainian text, correct calculations displayed
  - [ ] All acceptance criteria met
- **Estimated Time:** 4-5 hours

### Task #27: Integration Testing (QA)
- **Assigned to:** QA Engineer
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] End-to-end flow: Create plan → Create membership → Freeze → Calculate revenue
  - [ ] Verify revenue recognition pauses during freeze
  - [ ] Verify end_date extends correctly
  - [ ] Verify dashboard metrics update in real-time
  - [ ] Cross-browser testing (Chrome, Firefox, Safari)
  - [ ] Mobile responsiveness
- **Estimated Time:** 3-4 hours

---

## 📊 Week 2 Progress

- **Total Tasks:** 12
- **Completed:** 0
- **In Progress:** 0
- **Not Started:** 12

**Estimated Total Time:** 45-55 hours  
**Target Completion:** 2026-03-07

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
