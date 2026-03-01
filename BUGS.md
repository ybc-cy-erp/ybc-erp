# YBC ERP - Bug Tracker

## Open Bugs

(No bugs reported yet - sprint just starting)

---

## In Progress Bugs

(Bugs currently being fixed by developers)

---

## Fixed Bugs

(Bugs fixed and awaiting QA verification)

---

## Verified Bugs

(Bugs fixed and verified by QA, ready to close)

---

## Closed Bugs

(Bugs verified as resolved or won't fix)

---

## Bug Report Template

```markdown
### BUG-XXX: [Short Description]
- **Severity:** Critical | High | Medium | Low
- **Module:** [e.g., Authentication, Memberships, etc.]
- **Reported By:** [Agent name]
- **Assigned To:** [Developer name]
- **Status:** Open | In Progress | Fixed | Verified | Closed
- **Date Reported:** YYYY-MM-DD
- **Date Fixed:** YYYY-MM-DD (if applicable)
- **Description:** [Detailed description of the bug]
- **Steps to Reproduce:**
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
- **Expected Result:** [What should happen]
- **Actual Result:** [What actually happens]
- **Impact:** [How this affects users/system]
- **Notes:** [Additional context, screenshots, logs]
- **Fix Details:** [How it was fixed, if applicable]
```

---

## Severity Definitions

### 🔴 Critical
- System crash, data loss, or corruption
- Security vulnerability (SQL injection, XSS, data breach)
- Core functionality completely broken (can't login, can't create records)
- Production downtime or major service disruption
- **Action:** Block deployment, fix immediately (highest priority)

### 🟠 High
- Major feature not working as expected
- Data integrity issue (incorrect calculations, missing data)
- Performance degradation (API >500ms, page load >5s)
- Workflow blocked for specific user role
- **Action:** Fix before sprint end, cannot ship to production

### 🟡 Medium
- Minor feature bug (functionality degraded but usable)
- UI inconsistency or styling issue
- Non-critical validation missing
- Error messages unclear or in wrong language
- **Action:** Fix in next sprint or before major release

### 🟢 Low
- Cosmetic issues (minor alignment, color off by a shade)
- Minor UX improvements (nice-to-have)
- Edge case that rarely occurs
- Documentation typos
- **Action:** Backlog, fix when time permits

---

## Bug Lifecycle

```
┌──────┐
│ Open │
└───┬──┘
    │
    ▼
┌────────────┐
│ In Progress│ ◄──── Developer assigned, working on fix
└───┬────────┘
    │
    ▼
┌───────┐
│ Fixed │ ◄──── Developer claims fix complete
└───┬───┘
    │
    ▼
┌──────────┐
│ Verified │ ◄──── QA Engineer confirms fix works
└───┬──────┘
    │
    ▼
┌────────┐
│ Closed │ ◄──── Bug resolved, archived
└────────┘
```

---

## QA Validation Process

When a bug is marked as "Fixed":
1. **QA Engineer** reviews the fix in the codebase
2. Follows the original "Steps to Reproduce"
3. Verifies the "Expected Result" now occurs
4. Checks for regression (related features still work)
5. **Decision:**
   - ✅ **Verified** → Move to "Verified" section, update task to `QA PASS`
   - ❌ **Still Broken** → Move back to "Open", add more details, notify developer

---

## Notes

- All bugs must be logged here before being worked on
- Critical bugs block deployment (no exceptions)
- QA Engineer has final say on bug severity
- Developers can appeal severity to Orchestrator
- Track fix time for retrospectives (improve estimates)

---

**Last Updated:** 2026-03-01  
**Active Bugs:** 0  
**Total Bugs Closed:** 0
