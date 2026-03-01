# TEST PLAN - YBC ERP

**Last Updated:** 2026-03-01

---

## Testing Strategy

### Levels
1. **Unit Tests** - Individual functions/methods
2. **Integration Tests** - API endpoints
3. **E2E Tests** - Full user flows
4. **Manual Tests** - UI/UX, edge cases

### Tools
- **Backend:** Jest + Supertest
- **Frontend:** Jest + React Testing Library
- **E2E:** Playwright (optional)
- **Manual:** Browser + Postman

---

## Week 1: Core Foundation

### Test Cases
- [ ] TC-001: Health endpoint returns 200
- [ ] TC-002: Database connection works
- [ ] TC-003: Frontend loads without errors
- [ ] TC-004: Theme switcher (Light/Dark)
- [ ] TC-005: Ukrainian language displayed

### Critical Scenarios
- Application starts without crashes
- Database migrations run successfully
- Basic UI renders

---

## Future Weeks

_(Test plans will be added as features are developed)_

---

## QA PASS Criteria

- All critical test cases pass
- No critical bugs
- UI matches Design System
- Responsive design works
- No console errors
