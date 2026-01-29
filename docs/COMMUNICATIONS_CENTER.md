# PRD: Communications Center

> **Module Status:** Queued (Phase 5)  
> **Dependency:** Staff Management (Phase 4)

## Problem

Untracked communication (WhatsApp, personal email) creates accountability gaps, disputes, and audit failures. **All official communication must originate from Impact OS and be permanently logged.**

---

## Core Principles

1. No official communication occurs outside Impact OS
2. Every message is logged **before** delivery
3. Channel selection is explicit (email, in-app, or both)
4. Delivery outcomes are recorded
5. Communication correlates to action or inaction

---

## Supported Channels (v1)

| Channel | Use Cases |
|---------|-----------|
| **In-App** | Enforcement, reminders, mission actions (persist until acknowledged) |
| **Email** | Invites, critical notices, reports, partner comms |

---

## Permissions

| Role | Scope |
|------|-------|
| Admin | Full access |
| Operator | Limited scope |
| Impact Officer | Reports only |
| Mentor | Assigned participants (template-only) |
| Participants/Volunteers | Cannot send |

---

## Functional Requirements

### Compose Message
- Select recipients: individual / cohort / segment (rule-based)
- Select channel: in-app / email / both
- Select category: announcement / action_required / reminder / escalation
- Subject (email only), body, optional CTA link
- Preview before send

### Message Dispatch
1. Create communication record **before** sending
2. Queue via worker
3. Dispatch to selected channels
4. Record delivery outcome per channel

### Templates
- Reusable with variables: `{first_name}`, `{mission_title}`, `{cohort_name}`, `{due_date}`
- Role-restricted access

### Communication Ledger
Every message logged with:
- sender, recipients, channel(s), category
- content snapshot, timestamps
- delivery status, failure reasons

**Records are immutable.**

### Delivery Status
Per channel: `queued → sent → delivered → failed/bounced → opened`

Failures appear in dedicated **Failures Queue**.

---

## Admin UI

### Tabs
1. **Compose** — new message
2. **Sent Messages** — history with filters
3. **Failures** — delivery issues
4. **Templates** — manage reusable templates

### Filters
Date range, sender, cohort, channel, category, delivery status

### Message Detail
Full content, recipient list, delivery timeline, linked entity

---

## Data Model

```
communications
├── id, sender_id, category, channel
├── subject, body, cta_url
├── linked_entity_type, linked_entity_id
├── created_at, sent_at

communication_recipients
├── id, communication_id, recipient_id
├── status, sent_at, delivered_at, opened_at, failed_at
├── failure_reason

communication_templates
├── id, name, category, channel
├── subject, body
├── allowed_roles[], created_by
```

---

## Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-01 | Communication record created before any delivery |
| AC-02 | `action_required` messages must use in-app channel |
| AC-03 | Delivery status updates from provider webhooks |
| AC-04 | Audit records immutable (no edit/delete) |
| AC-05 | Failures visible in dedicated queue with reasons |
| AC-06 | Mentors blocked from broadcast messages |
| AC-07 | Participants see content, timestamp, action link |

---

## Final Law

> **If it is not sent through Impact OS, it does not exist.**  
> Communication is enforcement, visibility, and accountability.
