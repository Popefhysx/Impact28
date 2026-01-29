# PRD: Staff Management

> **Module Status:** Phase 4 (Queued)  
> **Dependency:** Phases 1-3 Complete

---

## Core Philosophy

**3 Categories, Not Role Explosion**

| Category | Power |
|----------|-------|
| **ADMIN** | Can change the system |
| **STAFF** | Can execute assigned work |
| **OBSERVER** | Can only view/report |

Everything else = **feature access + task assignments**, not new roles.

---

## Category Definitions

### ADMIN
Owns program operations + system configuration.
- Calendar, cohorts, staff invites
- Budgets, disbursements, comms
- Full dashboard access

**Super Admin:** Flag `ADMIN_SUPER = true` for security/billing/global overrides.

### STAFF
Executes assigned work within scope.
- Mentoring, verification, support processing
- Acts only on assigned cohorts/queues/participants
- No system-wide power

### OBSERVER
Read-only access.
- Impact reporting, partner views
- Audit/compliance access
- Scoped to specific data (e.g., partner sees only their funded participants)

---

## Role Mapping

| Real-World Role | Category | Capabilities Enabled |
|-----------------|----------|---------------------|
| Program Manager | ADMIN | Full |
| Ops Assistant | STAFF | Ops features |
| Mentor | STAFF | Mentor features |
| Volunteer | STAFF | Task-only |
| Finance Support | STAFF | Finance features |
| Impact/M&E | OBSERVER | Reports |
| Partners/Funders | OBSERVER | Scoped to funding |

---

## Capability Groups

### Program
- `calendar.manage` — Manage calendar
- `cohort.manage` — Manage cohorts
- `admissions.manage` — Manage admissions

### People
- `staff.invite` — Invite staff
- `staff.assign` — Assign to cohorts
- `participants.view` — View participants

### Support
- `support.approve` — Approve/deny requests
- `wallet.view` — View budgets (admin-only)
- `vouchers.issue` — Issue vouchers/data/cash

### Income
- `income.review` — Review income proof
- `income.approve` — Approve/reject verification

### Comms
- `comms.broadcast` — Send broadcasts
- `comms.direct` — Send 1:1 messages
- `comms.templates` — Use templates only

### Reports
- `reports.view` — View reports
- `reports.export` — Export reports
- `audit.view` — View audit logs

### System
- `settings.global` — Global settings
- `emergency.override` — Emergency override (super only)

---

## Task Assignment (Scope)

Each staff user has:
- **Assigned cohort(s)** — Can only see/act on these cohorts
- **Assigned queues** — Support, Income, Mentor queues
- **Assigned participants** — Optional, for 1:1 mentors

This keeps privacy tight and operations clean.

---

## Staff Profile Templates

Pre-configured capability sets for easy onboarding:

| Template | Pre-selected Capabilities |
|----------|---------------------------|
| Mentor | participants.view, comms.direct, comms.templates |
| Ops | admissions.manage, support.approve, comms.broadcast |
| Finance | support.approve, wallet.view, vouchers.issue |
| Volunteer | Task-only (no features) |
| Impact | reports.view, reports.export |
| Partner | reports.view (scoped to funding) |

Admin can always customize after selection.

---

## Admin UI Requirements

### Staff Management Page
1. **Invite Staff** — Email-only invite
2. **Choose Category** — ADMIN / STAFF / OBSERVER
3. **Select Template** — Pre-configures capabilities
4. **Toggle Capabilities** — Fine-tune access
5. **Assign Scope** — Cohorts/queues/participants
6. **Save** → Audit log entry

### Access Control Enforcement
- **UI:** Hides features user doesn't have
- **Backend:** Always enforces (never trust UI)

---

## Data Model

```prisma
model Staff {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  
  category      StaffCategory  // ADMIN, STAFF, OBSERVER
  isSuperAdmin  Boolean  @default(false)
  
  capabilities  String[] // Array of capability keys
  
  cohortIds     String[] // Assigned cohorts
  queueIds      String[] // Assigned queues
  participantIds String[] // Assigned participants (optional)
  
  invitedBy     String
  invitedAt     DateTime @default(now())
  
  @@index([category])
}

enum StaffCategory {
  ADMIN
  STAFF
  OBSERVER
}
```

---

## Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-01 | Staff invite creates pending record with capabilities |
| AC-02 | Login resolves category and capabilities |
| AC-03 | UI hides inaccessible features dynamically |
| AC-04 | Backend rejects unauthorized API calls |
| AC-05 | Staff can only act within assigned scope |
| AC-06 | All permission changes logged to audit trail |
| AC-07 | Super Admin flag grants emergency override |
