# Support Wallet & Disbursement System

**Module:** Participant Support, Budget, Verification & Audit Framework  
**Applies to:** Cycle28 × Project 3:10 / Impact OS  
**Status:** Canonical Operational Documentation  
**Related:** [Core Governance](./IMPACT_OS_GOVERNANCE.md) Section 14

---

## 1. Purpose & Design Philosophy

The Support Wallet system exists to **remove survival blockers** without creating dependency, fraud, or entitlement.

### Core Principles

* Participants **do not see budgets**
* Support follows **action**, not need statements
* All funds are **traceable, auditable, and mission-linked**
* Unused support is treated as **evidence of resilience**, not failure

The system prioritizes:
* **Dignity** — No begging, no humiliation
* **Enforcement** — Rules apply equally
* **Transparency** — For operators, not participants

---

## 2. Budget Model

### 2.1 Maximum Support Allocation (MSA)

Each participant is assigned a fixed **Maximum Support Allocation** at cohort start.

```
MSA = $100 per participant (all-in cap)
```

This allocation may cover:
* Survival support (data, transport, tools)
* Cash transfers (last resort)
* Per-participant operational overhead

### 2.2 Budget Visibility Rules

| Role                 | Budget Visibility   |
|----------------------|---------------------|
| Participant          | ❌ No amounts shown |
| Mentor               | ❌ No budget access |
| Admin / Operator     | ✅ Full visibility  |
| Impact Officer (M&E) | ✅ Read-only        |
| System (AI/Rules)    | ✅ Enforcement      |

> **System Law:** Participants see **eligibility status**, not money.

---

## 3. Support Types (Ranked, Enforced)

Support is delivered in **non-cash formats first**.

### 3.1 Priority Order

1. **Data / Airtime Transfer** — Default support type
2. **Transport Voucher / Fixed Allowance** — For in-person requirements
3. **Tool Access** — Shared licenses, credits, subscriptions
4. **Cash Transfer** — Exception only, requires escalation

> **System Law:** Cash is **never the default**.

---

## 4. Participant Support Request Flow

### 4.1 Eligibility Conditions

Support can be requested when:
* Participant is **active** (not paused)
* Participant has logged **recent mission attempts**
* Support directly enables a **required mission**

Inactivity auto-pauses eligibility.

### 4.2 Request Interface (Participant View)

Participants submit a **structured request**, not free text.

#### Form Fields

| Field | Description |
|-------|-------------|
| **Support Type** | Data / Transport / Tools / Cash |
| **Mission Enabled** | Dropdown: system-defined missions only |
| **Justification** | "This enables me to complete Mission X" (capped) |
| **Evidence** | Optional: screenshot, schedule, tool requirement |

#### What the Participant Does NOT See

* Monetary value of support
* Remaining budget
* Approval thresholds
* Other participants' requests

---

## 5. Approval Logic (Tiered)

### 5.1 Tier 1 — Auto-Approval (System)

Auto-approved if:
* Within onboarding "Starter Pack"
* Tied to mandatory mission
* Participant has active momentum (≥50)
* Wallet balance allows

Decision logged automatically with `approver = SYSTEM`.

### 5.2 Tier 2 — Operator Approval

Required if:
* Repeated requests (>2 in same category)
* Mid-level support value
* Non-standard timing

Operator options:
* **Approve** — Proceeds to disbursement
* **Deny** — Reason code required
* **Request Clarification** — Returns to participant

### 5.3 Tier 3 — Admin Escalation

Required if:
* Cash requested
* Wallet nearing exhaustion (>80% MSA used)
* Fraud/risk flag present

Admin must:
* Select justification category
* Acknowledge audit visibility
* Confirm disbursement channel

---

## 6. Account Details & Verification

### 6.1 When Collected

Account details are collected when:
* Participant becomes **eligible for cash support**
* OR at cohort start (optional, for efficiency)

### 6.2 Account Form Fields

| Field | Format |
|-------|--------|
| Bank Name | Dropdown (Nigerian banks) |
| Account Number | 10-digit NUBAN |
| Confirmation | Checkbox: "I confirm this is my account" |

> **No NIN requested.**

### 6.3 Paystack Verification Flow

```
1. System calls Paystack "Resolve Account Number"
2. Returned account name is shown (masked)
3. Participant confirms name match
4. System stores:
   - bank_code
   - account_number
   - resolved_account_name
   - verification_reference
   - verification_timestamp
```

No raw identity documents stored.

---

## 7. Fund Disbursement Flow

### 7.1 Non-Cash Disbursement

#### Data / Airtime
* Direct top-up to registered phone number
* Logged as `DATA_DISBURSEMENT`
* Provider: Telco API or aggregator

#### Transport / Tools
* Voucher issued OR access granted
* Logged as `VOUCHER_DISBURSEMENT` or `TOOL_ACCESS`

### 7.2 Cash Disbursement (Last Resort)

```
1. Create Transfer Recipient (Paystack)
2. Initiate Transfer
3. Webhook confirms success/failure
4. Status updated: PENDING → COMPLETED / FAILED
```

Cash events are **explicitly flagged** in audit logs.

---

## 8. Audit Trail (Non-Negotiable)

Every support event generates an immutable log.

### 8.1 Audit Record Fields

| Field | Description |
|-------|-------------|
| `participant_id` | Who received support |
| `cohort_id` | Which cohort |
| `support_type` | DATA / TRANSPORT / TOOLS / CASH |
| `mission_id` | Which mission enabled (if any) |
| `approval_tier` | AUTO / OPERATOR / ADMIN |
| `approver_id` | Who approved (or SYSTEM) |
| `amount` | Internal value (never shown to participant) |
| `provider_reference` | Paystack, telco, etc. |
| `timestamp` | When processed |
| `status` | PENDING / COMPLETED / FAILED |

> **System Law:** No deletion. Only superseding records allowed.

---

## 9. Budget Tracking & Balance

### 9.1 Internal Wallet Ledger

For each participant:

```
allocated_budget    = MSA (set at cohort start)
total_spent         = sum of all disbursements
remaining_balance   = allocated_budget - total_spent
```

### 9.2 Admin Views

| View | Scope |
|------|-------|
| Per participant | Individual wallet status |
| Per cohort | Aggregate spending |
| Per category | Data / Transport / Tools / Cash breakdown |

> Participants do **NOT** see balances.

---

## 10. End-of-Cohort Budget Handling

### 10.1 Unused Budget

Unused budget:
* Is **not paid out** to participant
* Is **not rolled over** to next cohort
* Is recorded as a **conversion efficiency signal**

This becomes part of the participant's impact record.

### 10.2 Interpretation

| Unused % | Interpretation |
|----------|----------------|
| >80% unused | High self-sufficiency signal |
| 50-80% unused | Normal support usage |
| <50% unused | Higher support dependency |

---

## 11. Participant Impact Report

At cohort end, Impact OS generates a **Participant Impact Summary**.

### 11.1 Included Sections

**A. Transformation Overview**
* Identity progression (L0 → Lx)
* Skill triad balance
* Time-to-first-income (if achieved)

**B. Support Utilization Summary**
* Support types accessed (no amounts)
* Consistency of eligibility
* Unused support indicator (qualitative only)

**C. Behavioral Signals**
* Action streaks
* Arena exposure
* Iteration loops

### 11.2 Report Distribution

| Version | Recipient |
|---------|-----------|
| Abridged Summary | Participant |
| Full Report | Admin / Impact Officer |
| Archive Copy | Participant profile (Admin view) |

Participant version uses **neutral language**:
* "Support accessed" (not "$X received")
* "Support not required" (not "budget unused")
* "Eligibility maintained" (not "qualified for $X")

---

## 12. Integration with Three Impact Layers

This module feeds directly into the Three-Layer Impact System:

### Layer 1 — Personal (Private)
* Journals, reflections on support use
* Confidence and agency notes

### Layer 2 — Structured (Internal)
* Budget utilization metrics
* Support-to-action correlation
* Enforcement signals

### Layer 3 — Storytelling (Optional)
* Narrative without financial disclosure
* Focus on transformation, not aid

---

## 13. Compliance & Ethics

* ❌ No public budget disclosure
* ❌ No NIN storage required
* ✅ PII encrypted at rest
* ✅ All disbursements auditable
* ✅ No favoritism via manual overrides
* ✅ Random sampling verification

---

## 14. System Laws

> Support follows effort.  
> Budgets are invisible to participants.  
> Every disbursement must enable action.  
> Every action must be traceable.  
> Cash is never the default.

---

## 15. Technical Reference

### Related API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/support/request` | POST | Submit support request |
| `/support/requests` | GET | List user's requests |
| `/admin/support/queue` | GET | Pending approvals |
| `/admin/support/:id/approve` | POST | Approve request |
| `/admin/support/:id/deny` | POST | Deny with reason |
| `/admin/wallets` | GET | All participant wallets |
| `/admin/wallets/:id` | GET | Individual wallet detail |

### Related Prisma Models

See [schema.prisma](../impact-os-backend/prisma/schema.prisma):
* `SupportWallet`
* `SupportRequest`
* `DisbursementLog`

---

*This documentation supports API design, database schemas, admin dashboards, audits, and funder reporting.*
