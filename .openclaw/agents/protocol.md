# YBC ERP - Agent Orchestration Protocol

## Overview

This project uses a multi-agent architecture where specialized agents collaborate to build the YBC ERP system. Each agent has a specific role, expertise, and temperature setting optimized for their tasks.

## Agent Roles

| Agent | Temperature | Expertise | Primary Artifacts |
|-------|------------|-----------|-------------------|
| **Orchestrator** | 0.1-0.2 | Task planning, coordination, decision-making | TASKS.md, DECISIONS.md |
| **Backend Developer** | 0-0.3 | Node.js, Express, Supabase, API design | Backend code, migrations, API docs |
| **Frontend Developer** | 0.3-0.5 | React, Vite, UI components, Ukrainian i18n | Frontend code, components |
| **QA Engineer** | 0.1-0.3 | Testing, validation, bug tracking | TEST_PLAN.md, BUGS.md, test reports |
| **DevOps Engineer** | 0-0.2 | Railway, CI/CD, monitoring, deployment | Deployment configs, monitoring setup |

## Workflow Pipeline

```
┌─────────────┐
│ Orchestrator│
│   (Plan)    │
└─────┬───────┘
      │
      ▼
┌─────────────┐     ┌─────────────┐
│  Backend    │────▶│  Frontend   │
│    Dev      │     │     Dev     │
└─────┬───────┘     └─────┬───────┘
      │                   │
      └───────┬───────────┘
              ▼
        ┌─────────────┐
        │     QA      │
        │  Engineer   │
        └─────┬───────┘
              │
              ├─── QA PASS ──▶ Next task
              │
              └─── QA FAIL ──▶ Fix loop (back to Dev)
```

## Communication Rules

### 1. Task Assignment
- **Orchestrator** creates tasks in `TASKS.md` with clear acceptance criteria
- Each task assigned to specific agent(s)
- Format:
  ```markdown
  ## Task #N: [Title]
  - **Assigned to:** Backend Developer
  - **Status:** In Progress
  - **Acceptance Criteria:**
    - [ ] Criterion 1
    - [ ] Criterion 2
  - **Dependencies:** Task #M
  ```

### 2. Development Flow
- **Developers** implement features and mark task as "Ready for QA"
- Code pushed to feature branch
- Update task status in `TASKS.md`

### 3. QA Validation
- **QA Engineer** tests against acceptance criteria
- Two possible outcomes:
  - **`QA PASS`** → Task complete, merge approved, move to next
  - **`QA FAIL`** → Log bugs in `BUGS.md`, task returns to developer

### 4. Bug Tracking
- All bugs logged in `BUGS.md` with:
  - Severity (Critical, High, Medium, Low)
  - Steps to reproduce
  - Expected vs actual behavior
  - Assigned developer
- Critical bugs block progress
- High bugs must be fixed in current sprint

### 5. Deployment
- **DevOps Engineer** handles:
  - Environment setup
  - Railway configuration
  - CI/CD pipelines
  - Monitoring and alerts
- Deployment happens after `QA PASS` for milestone

## Artifact Files

### Required Artifacts
1. **VISION.md** - Product vision, goals, success metrics
2. **SPEC.md** - Technical specification (already exists as `YBC-ERP-TECHNICAL-SPECIFICATION.md`)
3. **TASKS.md** - Current sprint tasks with status
4. **BUGS.md** - Active bug tracker
5. **TEST_PLAN.md** - Testing strategy and test cases
6. **SECURITY.md** - Security considerations and audit log
7. **DECISIONS.md** - Architecture decision records (ADR)

### Artifact Ownership
- **Orchestrator:** TASKS.md, DECISIONS.md, VISION.md
- **QA Engineer:** TEST_PLAN.md, BUGS.md
- **DevOps Engineer:** SECURITY.md (infrastructure security)
- **All Developers:** Update respective artifacts during work

## Decision Making

### Architecture Decisions
- **Format:** ADR (Architecture Decision Record)
- **Location:** `DECISIONS.md`
- **Template:**
  ```markdown
  ## ADR-N: [Decision Title]
  - **Date:** YYYY-MM-DD
  - **Status:** Proposed / Accepted / Rejected / Superseded
  - **Context:** Why this decision is needed
  - **Decision:** What was decided
  - **Consequences:** Expected impact
  - **Alternatives Considered:** Other options
  ```

### Conflict Resolution
- If agents disagree on approach:
  1. Document both perspectives
  2. **Orchestrator** makes final call
  3. Record decision in `DECISIONS.md`

## Quality Standards

### Code Quality
- **Backend:**
  - TypeScript or JSDoc types
  - Error handling for all async operations
  - Input validation on all endpoints
  - Database transactions for multi-step operations
  
- **Frontend:**
  - Component reusability
  - Responsive design (mobile-first)
  - Ukrainian i18n for all text
  - Accessibility (ARIA labels)

### Testing Requirements
- **Unit Tests:** Critical business logic
- **Integration Tests:** API endpoints
- **E2E Tests:** Key user flows
- **Minimum Coverage:** 70% for backend, 60% for frontend

### Performance
- API response time: < 200ms (p95)
- Page load time: < 2s (p95)
- Database queries: Indexed, optimized

## Security Rules

### Sensitive Data
- No secrets in code (use env vars)
- No PII in logs
- All passwords hashed (bcrypt)
- JWTs for authentication

### Database
- RLS enabled for all tables
- Input sanitization (prevent SQL injection)
- Prepared statements only

### API
- CORS configured properly
- Rate limiting on all endpoints
- HTTPS only in production

## Sprint Rhythm

### Weekly Cadence
- **Monday:** Sprint planning (Orchestrator assigns tasks)
- **Wed/Thu:** Mid-sprint QA checkpoint
- **Friday:** Sprint review, deploy if `QA PASS`

### Roadmap Alignment
- 11-week roadmap divided into sprints
- Each sprint = 1 week = 1 major module or feature set
- Current sprint tasks always visible in `TASKS.md`

## Context Management

### Session Hygiene
- Use `/compact` when context gets large
- Keep project memory in `memory/ybc-erp-project.md`
- Reference existing docs instead of repeating info

### File Organization
```
ybc-erp/
├── .openclaw/agents/          # Agent definitions
├── docs/                      # Technical documentation
├── server/                    # Backend code
├── client/                    # Frontend code
├── migrations/                # Database migrations
├── tests/                     # Test suites
├── VISION.md                  # Product vision
├── TASKS.md                   # Current sprint
├── BUGS.md                    # Bug tracker
├── TEST_PLAN.md              # Testing strategy
├── SECURITY.md               # Security notes
└── DECISIONS.md              # ADRs
```

## Emergency Procedures

### Production Issues
1. **DevOps** immediately investigates
2. If critical: rollback to last stable version
3. **QA** validates rollback
4. **Backend/Frontend** fix in hotfix branch
5. Expedited QA validation
6. Deploy fix

### Blocked Tasks
- If task blocked > 24 hours: escalate to **Orchestrator**
- Document blocker in `TASKS.md`
- Orchestrator assigns to unblock or reprioritizes

## Success Criteria

### Per Task
- All acceptance criteria met
- `QA PASS` received
- Code merged to main
- Deployed to staging/production

### Per Sprint
- All sprint tasks completed
- No critical bugs open
- Documentation updated
- Deployed and stable

### Per Milestone (Module)
- Full module functional
- Integration tests passing
- User-facing features in Ukrainian
- Performance benchmarks met

---

**Protocol Version:** 1.0  
**Last Updated:** 2026-03-01  
**Next Review:** After Week 1 completion
