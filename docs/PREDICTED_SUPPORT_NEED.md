# Predicted Support Need (PSN) — Internal Forecasting & Operational Planning System

**Module:** Cohort Budget Forecasting, Staff Planning & Proactive Intervention  
**Applies to:** Cycle28 × Project 3:10 / Impact OS  
**Status:** Canonical Operational Documentation  
**Related:** [Support Wallet](./SUPPORT_WALLET.md) (Delivery), [Partner Funding](./PARTNER_FUNDING.md) (Funding)

---

## 1. Purpose

Impact OS uses **Participation Support Infrastructure** (data/transport/tools/cash-last-resort) to remove temporary blockers that prevent qualified participants from acting.

The system must achieve two competing goals:

1. **Do not communicate stipend/support promises to participants at admission** (to avoid entitlement framing and preserve behavioral integrity)
2. **Give operations an upfront forecast** of likely support demand so cohorts can be funded, staffed, and scheduled responsibly

The solution is a dedicated internal planning mechanism:

> **Predicted Support Need (PSN)** — a non-binding internal estimate of who is likely to require support during the cohort, based on intake constraints and readiness signals.

PSN is **not** eligibility.  
PSN is **not** approval.  
PSN is a **forecasting and workload planning tool**.

---

## 2. System Laws (Non-Negotiable)

> **Admission decisions are independent of funding.**  
> Support decisions are conditional on behavior.  
> PSN exists only to improve operational planning and prevent cohort failure due to underfunding.

If PSN conflicts with observed behavior, **behavior wins**.

---

## 3. PSN vs Support Request — The Critical Distinction

| Aspect | PSN | Support Request |
|--------|-----|-----------------|
| **Timing** | Generated at intake before cohort starts | Submitted by participant during cohort |
| **Visibility** | Admin-only; never shown to participant | Participant initiates and sees status |
| **Purpose** | Forecasting & planning | Actual delivery of support |
| **Binding?** | ❌ Non-binding estimate | ✅ Actionable request |
| **Approval Power** | Cannot approve or deny anything | Decision triggers disbursement |

---

## 4. How PSN is Calculated

### 4.1 Input Categories

PSN is derived from **intake signals** collected during the application process.

#### Constraint Signals (Primary Driver)

Indicates survival pressure or access barriers:

| Signal | Source Field | Weight |
|--------|--------------|--------|
| Data affordability risk | `hasInternet`, `incomeRange` | High |
| Transport requirement risk | `state`, `country` | Medium |
| Device/tool access risk | `primaryDevice` | High |
| Income instability | `incomeRange`, `intakeIncomeSource` | High |
| Dependents burden | `currentStatus` | Medium |
| Time fragmentation | `weeklyHours` | Medium |

#### Readiness Signals (Moderating Driver)

Predicts whether support, if needed, will convert to action:

| Signal | Source Field | Weight |
|--------|--------------|--------|
| Accountability consent strength | `consentDailyAction`, `consentFailure` | High |
| Instruction following | `actionOrientation` (from AI scoring) | High |
| Prior action evidence | `triedOnlineEarning`, `onlineEarningOutcome` | Medium |
| Willingness to outreach | `commercialProbe` analysis | Medium |
| Tolerance for rejection | `rejectionResilience` (from AI scoring) | Medium |

### 4.2 Interpretation Matrix

| Constraints | Readiness | PSN Level | Interpretation |
|-------------|-----------|-----------|----------------|
| High | High | **HIGH** | Likely to need support and use it well |
| High | Low | **MEDIUM** | Likely to request but may misuse → stricter gating |
| Low | High | **LOW** | Unlikely to need support |
| Low | Low | **LOW** | Low conversion risk, may drop for other reasons |

### 4.3 PSN Output (Participant-Level)

```
psn_level:           LOW | MEDIUM | HIGH
psn_score:           0–100 (internal numeric)
psn_confidence:      0.0–1.0
primary_constraint:  DATA | TRANSPORT | TOOLS | OTHER
generated_at:        timestamp
```

### 4.4 PSN Output (Cohort-Level Forecast)

```
predicted_support_demand_expected:   Float
predicted_support_demand_upper_bound: Float
predicted_support_demand_lower_bound: Float
psn_distribution:                    { high: Int, medium: Int, low: Int }
risk_badge:                          GREEN | AMBER | RED
```

---

## 5. Where PSN Lives in the Product

### 5.1 Admin Dashboard — Cohort Summary

The cohort overview includes a PSN forecast widget:

| Metric | Display |
|--------|---------|
| Total Admitted | Count |
| PSN Distribution | High: X, Medium: Y, Low: Z |
| Expected Demand | ₦XXX,XXX (range) |
| Risk Badge | 🟢 Green / 🟡 Amber / 🔴 Red |
| Suggested Actions | Fund shortfall risk, Add verification staff, etc. |

**Required Label in UI:**

> "PSN is a forecast estimate only. Support is still request-based and behavior-gated."

### 5.2 Participant Profile (Admin View Only)

Admin profile shows:

| Field | Display |
|-------|---------|
| PSN Level | LOW / MEDIUM / HIGH badge |
| Confidence | 0.0–1.0 |
| Primary Constraint | DATA / TRANSPORT / TOOLS |
| Intake Summary | Non-sensitive constraint indicators |

**Participants never see this.**

### 5.3 Support Request Queue

PSN appears as a **secondary cue** in the support request queue:

- Request card shows PSN level badge
- But decision controls remain driven by **behavior + evidence**
- UI must include disclaimer: "PSN is non-binding"

### 5.4 Partner Reporting (Aggregate Only)

Partners can see:

| Metric | Visibility |
|--------|------------|
| Cohort-level PSN distribution | ✅ Allowed |
| Forecast vs actual spend | ✅ Allowed |
| Conversion outcomes by support utilization | ✅ Allowed |
| Participant-level PSN | ❌ Never shared |

---

## 6. What PSN Must Never Do

PSN must **never**:

- ❌ Change admission outcomes
- ❌ Be visible to participants
- ❌ Auto-approve support requests
- ❌ Be used as a "poor list"
- ❌ Become a stigmatizing label in staff culture
- ❌ Justify denial ("you were predicted LOW so no support")

### Enforcement Mechanisms

- PSN is stored in admin-only database fields
- UI warnings appear where PSN is shown
- Audit logs track any PSN-driven overrides
- Annual staff training required on PSN ethics

---

## 7. Participant Dashboard — Support Request UI

> **📖 Related:** [Support Wallet](./SUPPORT_WALLET.md) Section 4

### 7.1 Entry Point

The participant dashboard shows a **"Need Help?"** card when:

- Participant is **active** (not paused)
- Participant has **≥1 mission attempt** logged
- Participant is in a **support-eligible phase** (onboarding, market sprint, tool phase)

The card uses neutral language:

> "Access is blocking you? Request support for your current mission."

### 7.2 Request Form (Participant View)

| Field | Type | Constraints |
|-------|------|-------------|
| **Support Type** | Dropdown | Data / Transport / Tools / Speak to a Mentor (COUNSELLING internally, Cash hidden unless admin-enabled) |
| **Mission Enabled** | Dropdown | Active missions only (system-populated) |
| **What's Blocking You** | Textarea | Max 200 characters |
| **Evidence** | File upload | Optional: screenshot, schedule, error message |

#### What Participant Does NOT See

- Monetary value of support
- Remaining budget or MSA
- Approval thresholds or tiers
- Other participants' requests
- Their PSN level

### 7.3 Request Status Tracking

After submission, participant sees a status card:

| Status | Display Message |
|--------|-----------------|
| `PENDING` | "Your request is being reviewed" |
| `APPROVED` | "Support is on the way" (no amount shown) |
| `DENIED` | "We can't fulfill this request now. Keep completing missions!" |
| `COMPLETED` | "Support delivered" |

**Denial Handling:**

- Generic message only — no reason code exposed
- Soft prompt to continue missions
- Re-request allowed after behavioral improvement (e.g., +10 momentum)

### 7.4 Request History

Participant can view their past requests showing:

- Date submitted
- Support type
- Status (no amounts)
- Mission linked

No deletion allowed; history is immutable.

---

## 8. Proactive Blocker Detection Engine

PSN enables **proactive** identification of likely blockers, even when a participant hasn't explicitly requested support.

### 8.1 Detection Signals

| Signal | Source | Interpretation |
|--------|--------|----------------|
| 3+ mission attempts failed in data-heavy phase | Mission logs | Likely data blocker |
| Momentum drop >30 in 48hrs (High PSN user) | Currency ledger | Potential crisis |
| Tool-required mission stalled >5 days | Mission assignments | Tool access blocker |
| Transport-dependent mission skipped repeatedly | Mission history | Location barrier |
| No login for 5+ days (High PSN, active phase) | Activity logs | Possible access barrier |

### 8.2 System Actions

When detection triggers fire, the system:

1. **Queues for Operator Review** — Never auto-approves
2. **Generates Soft Prompt** — Contextual message to participant
3. **Creates Admin Alert** — For high-severity cases

| Trigger Severity | System Action |
|------------------|---------------|
| Low | Soft prompt only: "Need help staying active?" |
| Medium | Operator queue + prompt |
| High | Admin alert + immediate operator queue |

### 8.3 Prompt Examples

Prompts are phase-based and neutral:

| Phase | Prompt Text |
|-------|-------------|
| Onboarding (Week 1-2) | "Getting started can be tough. If access is blocking you, request support." |
| Skill Building | "Stuck on a mission? Data or tools might help — request support if needed." |
| Market Sprint | "Ready to reach out but hitting barriers? We can help you stay on track." |

### 8.4 Important Constraints

> **Dignity Principle:** System can *invite* the request, but participant must *submit* it.

- Detection never auto-approves — only surfaces to queue
- Participant still controls whether to request
- No amounts or budgets revealed in prompts
- Prompts are capped: max 1 per 72 hours per participant

---

## 9. Queue Prioritization Logic

### 9.1 Primary Ordering (Behavior-First)

1. **Active users with urgent blockers** — Phase-critical missions stalled
2. **High behavioral momentum** — Users with ≥100 momentum
3. **Recent mission activity** — Logged action in last 48hrs

### 9.2 Secondary Ordering (PSN Tie-Breaker)

When behavior scores are equal:

1. **High PSN** with valid behavior
2. **Medium PSN** with valid behavior
3. **Low PSN** with valid behavior
4. Defer/deny candidates (no behavior)

**Audit Requirement:**

When PSN affects queue position, log: `prioritization_reason: 'PSN_TIE_BREAK'`

### 9.3 Decision Safeguards

- System forces admins to select a reason code for all decisions
- Admins must explain when contradicting system recommendation
- Repeated overrides flagged for supervisor review

---

## 10. Staff Workload Planning

PSN informs operational capacity planning:

### 10.1 Weekly Forecast Metrics

| Metric | Calculation |
|--------|-------------|
| Expected support requests | Σ(PSN score × phase multiplier) |
| Expected evidence uploads | Based on past verification rates |
| Review queue size | Requests pending × avg review time |

### 10.2 Staff Allocation

| PSN Risk Level | Recommended Staffing |
|----------------|----------------------|
| 🟢 Green | Standard coverage |
| 🟡 Amber | +1 verification staff |
| 🔴 Red | +2 verification staff, admin on standby |

### 10.3 Pre-Scheduling

Based on PSN forecast, admins can:

- Pre-schedule automated prompts for critical phases
- Assign specific staff to high-density support windows
- Set queue limits to prevent burnout

---

## 11. Communications Integration

PSN shapes communication timing and targeting, without revealing PSN to participants.

### 11.1 Targeted Messaging

| Segment | Trigger | Message Type |
|---------|---------|--------------|
| High PSN + Low Activity | No login 3 days | Gentle check-in |
| High PSN + Active | Approaching tool phase | Proactive support reminder |
| Medium PSN + Stalled Mission | 5+ days no progress | Phase-specific prompt |

### 11.2 Communication Rules

- Messages **never mention** PSN
- Messages **never mention** budgets or amounts
- Frequency capped: max 2 support-related messages per week
- Opt-out respected for non-critical messages

---

## 12. End-of-Cohort Reporting

### 12.1 Forecast vs Reality Analysis

At cohort end, generate:

| Metric | Purpose |
|--------|---------|
| PSN predicted counts vs actual requests | Calibrate forecasting |
| Approval rates by PSN band | Validate prediction accuracy |
| Conversion outcomes by support utilization | Measure impact |
| Unused support budget by PSN band | Identify efficiency patterns |

### 12.2 Learning Loop

- Cohort data feeds into PSN model improvement
- Version tag each PSN algorithm iteration
- A/B test new models on cohort subsets

---

## 13. Integration Map

### 13.1 Upstream (Data Sources)

```
Intake Application
    │
    ├── incomeRange, hasInternet, weeklyHours
    ├── currentStatus, primaryDevice
    └── AI Scoring (actionOrientation, rejectionResilience)
            │
            ▼
      PSN Calculation Engine
```

### 13.2 Downstream (Consumers)

```
      PSN Output
          │
          ├── Admin Dashboard (Cohort Forecast Widget)
          ├── Support Queue (Priority Signal)
          ├── Communications (Targeting)
          ├── Budget Planning (Allocation Inputs)
          └── Partner Reports (Aggregate Only)
```

---

## 14. Audit & Compliance

### 14.1 Required Audit Trail

| Event | Logged Data |
|-------|-------------|
| PSN Generation | `applicant_id`, `version`, `input_hash`, `output`, `timestamp` |
| Manual Override | `admin_id`, `original_priority`, `new_priority`, `reason` |
| Prompt Sent | `participant_id`, `trigger_type`, `message_template` |
| Detection Trigger | `participant_id`, `signal_type`, `action_taken` |

### 14.2 Compliance Rules

- ✅ PSN algorithm version tracked in all outputs
- ✅ All overrides require explanation
- ✅ No PSN data shared externally at participant level
- ✅ Annual model fairness review required
- ❌ No automated decisions based solely on PSN

---

## 15. Acceptance Criteria

**AC-PSN-01**  
Given intake is completed, system must compute PSN and store as admin-only metadata.

**AC-PSN-02**  
PSN must appear in cohort admin dashboard as aggregated forecast distribution.

**AC-PSN-03**  
PSN must not appear in participant UI, emails, or notifications.

**AC-PSN-04**  
Support approval decisions must require behavior evidence; PSN alone cannot trigger approval.

**AC-PSN-05**  
Support request queue must show PSN as secondary signal with "non-binding" disclaimer.

**AC-PSN-06**  
End-of-cohort report must include forecast vs actual metrics for PSN and support utilization.

**AC-PSN-07**  
Participant dashboard must show "Need Help?" card with neutral messaging when eligible.

**AC-PSN-08**  
Proactive detection engine must queue for operator review, never auto-approve.

**AC-PSN-09**  
All prompts triggered by detection must be capped at 1 per 72 hours per participant.

---

## 16. Technical Reference

### 16.1 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/cohorts/:id/psn/generate` | POST | Generate PSN for all admitted applicants |
| `/admin/cohorts/:id/psn/forecast` | GET | Get cohort-level PSN forecast |
| `/admin/applicants/:id/psn` | GET | Get individual PSN (admin only) |
| `/admin/support/queue` | GET | Get prioritized support queue |
| `/admin/detection/triggers` | GET | View active detection triggers |
| `/participant/support/request` | POST | Submit support request |
| `/participant/support/requests` | GET | Get request history (no amounts) |
| `/participant/support/requests/:id` | GET | Get request status |

### 16.2 Prisma Models

```prisma
enum PsnLevel {
  LOW
  MEDIUM
  HIGH
}

enum PsnConstraint {
  DATA
  TRANSPORT
  TOOLS
  OTHER
}

enum RiskBadge {
  GREEN
  AMBER
  RED
}

// Added to Applicant model
// psnLevel            PsnLevel?
// psnScore            Float?         // 0-100
// psnConfidence       Float?         // 0.0-1.0
// psnPrimaryConstraint PsnConstraint?
// psnGeneratedAt      DateTime?

model CohortPsnForecast {
  id                          String    @id @default(cuid())
  cohortId                    String    @unique
  cohort                      Cohort    @relation(fields: [cohortId], references: [id])
  
  countHigh                   Int
  countMedium                 Int
  countLow                    Int
  
  predictedDemandExpected     Float
  predictedDemandUpper        Float
  predictedDemandLower        Float
  
  riskBadge                   RiskBadge
  generatedAt                 DateTime  @default(now())
}

model PsnCalculationLog {
  id              String   @id @default(cuid())
  applicantId     String
  version         String   // e.g., "v1.0-deterministic"
  inputHash       String   // For reproducibility
  output          Json
  createdAt       DateTime @default(now())
}

model DetectionTrigger {
  id              String   @id @default(cuid())
  participantId   String
  signalType      String   // e.g., "MISSION_STALL", "MOMENTUM_DROP"
  severity        String   // "LOW", "MEDIUM", "HIGH"
  actionTaken     String   // "PROMPT", "QUEUE", "ALERT"
  resolvedAt      DateTime?
  createdAt       DateTime @default(now())
  
  @@index([participantId, createdAt])
}
```

---

## 17. System Laws (Summary)

> **PSN is a planning forecast, not a promise.**  
> **Support remains request-based and behavior-gated.**  
> **Admission remains independent of resources.**  
> **Behavior always overrides prediction.**  
> **Detection invites requests; it never approves them.**

---

*This documentation supports budget forecasting, staff planning, API design, database schemas, admin dashboards, and funder reporting.*
