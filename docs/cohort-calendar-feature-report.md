# Impact OS: Complete System Overview

**For:** Program Manager & Stakeholders  
**Date:** February 2026  
**Version:** 1.0

---

## What is Impact OS?

**Impact OS** is a Behavioral Operating System designed for economic transformation. It manages the complete lifecycle of program participants—from application through graduation—using a gamified, action-gated model that rewards consistent effort over time.

**Core Philosophy:**
- **Action-Gated Progression** — Advancement depends on what you DO, not time elapsed
- **Momentum-Based Rewards** — Daily engagement earns currency that unlocks benefits
- **AI-Powered Assessment** — Claude AI evaluates applicant readiness
- **Automated Operations** — Reminders, scoring, and scheduling run without manual intervention

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              IMPACT OS                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   INTAKE    │→ │  SCORING    │→ │  ADMISSION  │→ │   MISSION   │        │
│  │   ENGINE    │  │   ENGINE    │  │   ENGINE    │  │   ENGINE    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│         ↓               ↓               ↓               ↓                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        CURRENCY SYSTEM                               │   │
│  │   Momentum • Skill XP • Arena Points • Income Proof                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         ↓               ↓               ↓               ↓                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   STIPEND   │  │   SUPPORT   │  │  PROGRESS   │  │    STAFF    │        │
│  │    ENGINE   │  │   SYSTEM    │  │   TRACKER   │  │   MANAGER   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Intake Engine (Application Flow)

### How It Works
Applicants complete a multi-step application form that collects:
- Basic demographics (name, email, location)
- Current status & income situation
- Technical & commercial self-assessment
- **Four Diagnostic Probes** (see Scoring Engine below)

### Application Reminders (Automated)
If someone starts but doesn't finish their application:

| Reminder | When Sent | Message |
|----------|-----------|---------|
| **First** | 24 hours after start | "Your application is waiting" |
| **Second** | 72 hours after start | "Don't miss out" |
| **Final** | 48 hours before close | "Last chance!" |

**Maximum 3 reminders per applicant.** Stops immediately upon submission.

---

## 2. Scoring Engine (AI-Powered Assessment)

### The Skill Triad Model
Every applicant is scored on three dimensions:

```
                    TECHNICAL
                       ▲
                      /|\
                     / | \
                    /  |  \
                   /   |   \
                  /    |    \
                 /     |     \
                /      |      \
               /       |       \
              ─────────┼─────────
           SOFT        │        COMMERCIAL
         (SOFT)        │        (MARKET)
```

### Four Diagnostic Probes
Each probe tests a specific readiness dimension:

| Probe | Tests | Question Theme |
|-------|-------|----------------|
| **Technical Probe** | Action Orientation | "Describe a project you built or fixed" |
| **Commercial Probe** | Market Awareness | "How would you find your first client?" |
| **Exposure Probe** | Rejection Resilience | "Describe a time you faced rejection" |
| **Commitment Probe** | Commitment Signal | "What would you sacrifice for this?" |

### AI Scoring Process
1. **Primary:** Claude AI (claude-3-5-sonnet) analyzes responses
2. **Fallback:** Rule-based scoring if AI unavailable
3. **Output:** Readiness Score (0.0 – 1.0) + Recommendation

### Recommendations
| Score Range | Recommendation | Action |
|-------------|----------------|--------|
| ≥ 0.70 + No Flags | **ADMIT** | Full acceptance |
| 0.55 – 0.69 | **CONDITIONAL** | Must complete a task first |
| 0.40 – 0.54 | **WAITLIST** | Review if capacity allows |
| < 0.40 | **REJECT** | Kindly declined |

---

## 3. Admission Engine (Post-Scoring)

### Offer Types
Based on income data and skill assessment:

| Offer Type | Who Gets It | Includes |
|------------|-------------|----------|
| **SKILLS_TRACK** | Low income, needs training | Weekly stipend + missions |
| **CATALYST_TRACK** | Higher skill, faster path | Minimal stipend, more autonomy |

### Conditional Tasks
If recommendation is CONDITIONAL, the system assigns a task based on risk flags:

| Risk Flag | Assigned Task | Days to Complete |
|-----------|---------------|------------------|
| LOW_ACTION_ORIENTATION | Write a "Why" statement | 5 days |
| LOW_MARKET_AWARENESS | Complete a market research quiz | 7 days |
| LOW_COMMITMENT_SIGNAL | Complete an intro quiz | 7 days |

**Task completion → Automatic admission.**

---

## 4. Mission Engine (Core Engagement)

### What Are Missions?
Daily and weekly challenges that drive participant engagement. Each mission rewards currency.

### Mission Lifecycle
```
AVAILABLE → ASSIGNED → STARTED → SUBMITTED → REVIEWING → COMPLETED/FAILED
```

### Mission Rewards
| Currency | What It Represents |
|----------|-------------------|
| **Momentum** | Daily action engagement (decays 5%/day if inactive) |
| **Skill XP** | Permanent skill progression |
| **Arena Points** | Commercial exposure / rejection handling |

### Daily Mission Assignment
**Cron job at 6 AM:** Assigns fresh daily missions to all active participants based on their skill track.

### Mission Types by Skill Domain
| Domain | Examples |
|--------|----------|
| TECHNICAL | Build a landing page, fix a bug, automate a task |
| SOFT | Record a pitch video, write a client proposal |
| COMMERCIAL | Book a discovery call, send 3 cold outreaches |

---

## 5. Currency System (Gamification)

### Four Currencies

| Currency | Behavior | Earned By |
|----------|----------|-----------|
| **MOMENTUM** | Decays 5%/day if inactive | Completing missions |
| **SKILL_XP** | Permanent, never decreases | Skill-building missions |
| **ARENA_POINTS** | Market exposure score | Commercial missions |
| **INCOME_PROOF** | Verified external income | Logging real payouts |

### Why Momentum Matters
- **Threshold:** Must maintain 50+ Momentum for stipend
- **Standard:** 100+ Momentum for full stipend
- **Bonus:** 200+ Momentum unlocks bonus tier

---

## 6. Stipend Engine (Action-Gated Payments)

### The Golden Rule
> **Stipend is earned, not given.** No momentum = no stipend.

### Stipend Tiers (NGN)
| Identity Level | Base | Standard | Bonus |
|----------------|------|----------|-------|
| L1 Activated | ₦2,500 | ₦5,000 | ₦7,500 |
| L2 Skilled | ₦5,000 | ₦10,000 | ₦15,000 |
| L3 Exposed | ₦7,500 | ₦15,000 | ₦22,500 |
| L4+ Earner | ₦10,000 | ₦20,000 | ₦30,000 |

### Automatic Pause
- **7 days inactive + low momentum** → Account paused
- **Paused users** → Must complete reactivation task
- **Reactivation** → Grants 25 Momentum bonus

---

## 7. Support Request System (Participant Safety Net)

### Available Support Types
| Support Type | When Available |
|--------------|----------------|
| DATA | All phases |
| TOOLS | Skill Building + later |
| TRANSPORT | Market Exposure + later |
| COUNSELLING | Income Generation |

### Eligibility Rules
1. Must have 50+ Momentum
2. Must have an active mission
3. Must be in the correct phase
4. 24-hour cooldown between requests

---

## 8. Identity Levels (Progression System)

Participants progress through stages:

| Level | Name | Meaning |
|-------|------|---------|
| **L0** | Applicant | Pre-admission |
| **L1** | Activated | Onboarded, starting missions |
| **L2** | Skilled | Demonstrated technical competence |
| **L3** | Exposed | Engaging with market |
| **L4** | Earner | Verified independent income |
| **L5** | Catalyst | Graduated, helping others |

---

## 9. Cohort Calendar (Automated Scheduling)

### One Date Drives Everything
Enter **one date** (Program Start) and the system calculates:

| Milestone | Formula | Example (May 1 Start) |
|-----------|---------|----------------------|
| Applications Open | Start - 28 days | April 3 |
| Applications Close | Start - 14 days | April 17 |
| Orientation | Start - 7 days | April 24 |
| **Day 1** | Start date | **May 1** |
| Technical Training End | Start + 42 days | June 12 |
| **Day 90 (Graduation)** | Start + 90 days | **July 30** |

### 16-Week Cohort Cycle
```
    ◄─── APPLICATION ───►◄───────── 90-DAY PROGRAM ─────────►

Week  -4    -3    -2    -1    1-6        7-9       10-12
      │     │     │     │     │          │         │
      ▼     ▼     ▼     ▼     ▼          ▼         ▼
   Apps   Screen  Apps  Orient.  Technical  Market   Income &
   Open   & Sort  Close + Day 1  Training   Sprint   Graduation
```

---

## 10. Staff & Permissions

### Staff Categories
| Category | Can Do |
|----------|--------|
| **ADMIN** | Everything, change system settings |
| **STAFF** | Execute assigned work (admissions, support) |
| **OBSERVER** | Read-only access (partners, funders) |

### Invite Flow
1. Admin sends email invite
2. Recipient clicks link → Setup page
3. Creates username + PIN
4. Assigned capabilities and cohort scope

---

## Summary: How It All Fits Together

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICANT JOURNEY                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   APPLY       →      SCORE     →     ADMIT      →     ENGAGE        │
│  (Intake)          (AI/Rules)       (Offer)         (Missions)      │
│                                                                      │
│    ↓                   ↓               ↓               ↓             │
│                                                                      │
│  Reminders        Skill Triad     Tasks if        Daily/Weekly      │
│  for incomplete   Readiness       conditional     challenges        │
│  apps             Score                                              │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   EARN          →      GROW     →    SUPPORT    →    GRADUATE       │
│  (Currency)          (Progress)      (Requests)      (Day 90)       │
│                                                                      │
│    ↓                   ↓               ↓               ↓             │
│                                                                      │
│  Momentum          Identity        Action-gated     L5 Catalyst     │
│  XP, Arena         Level-ups       Transport/Data   status          │
│  Income Proof                                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Takeaways

1. **Action-Gated Everything** — Momentum determines stipend, support access, and progression
2. **AI-First Assessment** — Claude scores applicants; rules as fallback
3. **Automated Operations** — Reminders, daily missions, and decay run on schedule
4. **Clear Identity Ladder** — L0 → L5 progression tied to real outcomes
5. **One Date = Full Calendar** — Cohort dates derive from a single start date

---

**Result:** A self-regulating system where:
- Active participants thrive (missions → currency → stipend)
- Inactive participants are paused (not punished, just held accountable)
- Admins focus on exceptions, not routine operations
