# PROTOCOL - Agent Communication Protocol

**Purpose:** Стандартизировать взаимодействие между агентами

---

## Workflow

```
Oleg → Orchestrator → Architect → Backend/Frontend Devs → QA → (Pass/Fail Loop) → GitHub
```

---

## Communication Format

### From Orchestrator to Sub-agents

**Template:**
```
**Task:** <Short description>
**Context:** <Link to relevant docs/files>
**Deliverables:** <What to produce>
**Deadline:** <When needed>
**Quality Criteria:** <How to know it's done>
```

**Example:**
```
**Task:** Implement POST /api/memberships endpoint
**Context:** See docs/YBC-ERP-TECHNICAL-SPECIFICATION.md section "Memberships API"
**Deliverables:** 
  - Working endpoint in server/routes/memberships.js
  - Input validation
  - Error handling
  - Manual test with Postman
**Deadline:** End of Week 3
**Quality Criteria:**
  - Returns 201 on success
  - Returns 400 on invalid data
  - Saves to database correctly
```

---

### From Sub-agents to Orchestrator

**Template:**
```
**Status:** DONE | IN_PROGRESS | BLOCKED
**Deliverables:** <List of files/changes>
**Notes:** <Any issues or decisions>
**Next:** <What needs to happen next>
```

**Example:**
```
**Status:** DONE
**Deliverables:**
  - server/routes/memberships.js (new)
  - server/controllers/membershipController.js (new)
  - Tested with Postman (screenshot attached)
**Notes:** Added extra validation for end_date must be after start_date
**Next:** Ready for QA testing
```

---

### From QA to Orchestrator

**QA PASS:**
```
**QA PASS**
**Tested:** <List of test cases>
**No bugs found**
**Ready for commit**
```

**QA FAIL:**
```
**QA FAIL**
**Bugs found:** 3 (see BUGS.md #12, #13, #14)
**Blockers:** Bug #12 is critical (incorrect refund calculation)
**Recommendation:** Assign #12 to Backend Dev for immediate fix
```

---

## File Artifacts

### Mandatory for each feature:
- Update `TASKS.md` (mark checkboxes)
- Update `TEST_PLAN.md` (add test cases)
- Update `BUGS.md` (if bugs found)
- Update `docs/decisions/ADR-*.md` (if architectural decision)

---

## Context Management Rules

### Orchestrator
- Use `/clear` between unrelated tasks
- Use `/compact` when approaching context limit
- Spawn subagents for heavy research/implementation

### Sub-agents
- Focus on assigned task only
- Don't drift into other areas
- Report back concisely
- Link to files, don't paste entire code

---

## Quality Gates

### Before handoff to QA:
- [ ] Code compiles/runs
- [ ] Basic manual testing done
- [ ] No obvious bugs
- [ ] Files properly named and organized

### Before GitHub commit:
- [ ] QA PASS received
- [ ] All bugs from QA fixed
- [ ] Commit message meaningful
- [ ] Documentation updated

---

## Emergency Protocol

If agent is **BLOCKED**:
1. Report to Orchestrator immediately
2. Explain blocker clearly
3. Suggest possible solutions
4. Wait for direction (don't guess)

Example:
```
**Status:** BLOCKED
**Issue:** Supabase connection failing with error "Invalid JWT"
**What I tried:** 
  - Checked SUPABASE_URL in .env
  - Regenerated API key
  - Still failing
**Need:** Help from DevOps or check Supabase dashboard
```

---

## Best Practices

- **Be specific** - "It doesn't work" → "Returns 500 with error: X"
- **Link to evidence** - Screenshots, logs, error messages
- **Update files** - Don't just report verbally, write to TASKS/BUGS
- **Ask questions** - If unclear, ask Orchestrator before guessing
- **Stay in role** - Backend dev doesn't write frontend code

---

## Escalation Path

```
Bug found → QA logs to BUGS.md
            ↓
QA reports to Orchestrator
            ↓
Orchestrator assigns to Developer
            ↓
Developer fixes and reports back
            ↓
QA retests
            ↓
(Pass) → Commit to GitHub
(Fail) → Loop back to Developer
```

---

## Temperature Settings Summary

| Agent | Temperature | Why |
|-------|-------------|-----|
| Orchestrator | 0.1 | Stable decisions |
| Architect | 0.1 | No "shaking" in plans |
| Backend Dev | 0.2 | Precise code |
| Frontend Dev | 0.3 | Some creativity for UI |
| QA Engineer | 0.1 | Strict, critical |

---

## Success = "QA PASS on every feature"

No shortcuts. No "good enough". Only **QA PASS**.
