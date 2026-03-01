# SECURITY - Security Requirements

**Last Updated:** 2026-03-01

---

## Authentication & Authorization

### Supabase Auth
- Email/password authentication
- JWT tokens
- Session management
- Password strength requirements

### Row Level Security (RLS)
- ALL tables must have RLS policies
- Tenant isolation by `tenant_id`
- Role-based access (Owner, Accountant, Manager, Cashier)

---

## Data Protection

### Sensitive Data
- Database passwords in environment variables
- API keys never in code
- Secrets in Railway env vars / Supabase vault

### Period Closing
- Closed periods are immutable
- Only Owner can close/reopen periods
- Prevents data manipulation after month-end

---

## Audit Log

### What We Log
- All transactions (create/update/delete)
- Period closings/reopenings
- User logins
- Settings changes
- All CRUD operations

### Audit Log Fields
- User ID
- Action type
- Entity type & ID
- Old values + New values (JSONB)
- IP address
- User agent
- Timestamp

---

## API Security

### Input Validation
- Validate ALL user inputs
- Sanitize SQL (use parameterized queries)
- Rate limiting (prevent abuse)
- CORS properly configured

### Error Handling
- Never expose stack traces to client
- Log errors server-side
- Generic error messages to user

---

## Crypto Security

### Wallet Addresses
- Validate address format before saving
- Never expose private keys (we only track addresses)
- Read-only blockchain queries

---

## Compliance

### GDPR (if applicable)
- User data export capability
- User data deletion capability
- Privacy policy

### Audit Trail
- Immutable audit log
- Cannot be deleted by users
- Only admins can view

---

## Threats & Mitigations

| Threat | Mitigation |
|--------|------------|
| SQL Injection | Parameterized queries, ORM |
| XSS | React auto-escaping, CSP headers |
| CSRF | SameSite cookies, CSRF tokens |
| Unauthorized access | RLS, JWT verification |
| Data tampering | Audit log, period closing |
| Secret exposure | Environment variables, .gitignore |

---

## Security Checklist (before launch)

- [ ] All RLS policies tested
- [ ] Secrets not in code
- [ ] HTTPS only (Railway enforces this)
- [ ] Audit log working
- [ ] Period closing tested
- [ ] Input validation on all endpoints
- [ ] Error handling doesn't leak info
- [ ] CORS configured correctly
