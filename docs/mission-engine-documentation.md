# Mission Engine: Complete Technical Documentation

**For:** Program Manager & Technical Team  
**Date:** February 2026  
**Version:** 1.0

---

## Executive Summary

The **Mission Engine** is the core engagement and progression system within Impact OS. It drives participant behavior through daily challenges, reward distribution, and behavioral intervention. Think of it as a gamified accountability system that keeps participants active.

**Core Philosophy:** *Action creates momentum. Momentum unlocks rewards. Inaction triggers decay.*

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MISSION ENGINE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐     ┌─────────────────────┐                        │
│  │   MISSION SERVICE   │     │ MISSION ENGINE SVC  │                        │
│  │   (Templates &      │     │ (Enforcement &      │                        │
│  │    Assignments)     │     │  Interventions)     │                        │
│  └──────────┬──────────┘     └──────────┬──────────┘                        │
│             │                           │                                    │
│             └───────────┬───────────────┘                                    │
│                         │                                                    │
│                         ▼                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      CURRENCY SERVICE                                │    │
│  │   Momentum • Skill XP • Arena Points • Income Proof                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Two Core Services

| Service | Responsibility |
|---------|----------------|
| **MissionService** | CRUD for mission templates, assignment logic, completion workflow |
| **MissionEngineService** | Enforcement rules: decay, streaks, alerts, wall ranking |

---

## 1. Mission Templates

A **mission template** is the definition of a repeatable task participants can be assigned.

### Template Properties

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Display name (e.g., "Build a Landing Page") |
| `description` | string | Detailed instructions |
| `skillDomain` | enum | `TECHNICAL`, `SOFT`, or `COMMERCIAL` |
| `difficulty` | enum | `EASY`, `MEDIUM`, or `HARD` |
| `momentum` | number | Momentum reward (default: 10) |
| `skillXp` | number | XP reward (default: 5) |
| `arenaPoints` | number | Arena Points reward (default: 0) |
| `requiredLevel` | enum | Minimum identity level to access (L1–L5) |
| `isDaily` | boolean | Auto-assigned daily if true |
| `isWeekly` | boolean | Auto-assigned weekly if true |
| `isActive` | boolean | Whether currently available |

### Difficulty Weights (for Triad Score)

| Difficulty | Score Weight |
|------------|-------------|
| EASY | +5 points |
| MEDIUM | +10 points |
| HARD | +20 points |

### Skill Domains

| Domain | What It Builds | Example Missions |
|--------|----------------|------------------|
| **TECHNICAL** | Hard skills, tools, building | "Deploy a Vercel project", "Build a simple API" |
| **SOFT** | Communication, presentation | "Record a 1-min pitch", "Write a client proposal" |
| **COMMERCIAL** | Market exposure, selling | "Book a discovery call", "Send 3 cold DMs" |

---

## 2. Mission Lifecycle

Every mission follows this state machine:

```
                     User accepts
    AVAILABLE ───────────────────► ASSIGNED
                                       │
                                       │ User clicks "Start"
                                       ▼
                                  IN_PROGRESS
                                       │
                         ┌─────────────┼──────────────┐
                         │             │              │
                   Deadline       Submit with     Auto-complete
                   passes          proof           (EASY only)
                         │             │              │
                         ▼             ▼              │
                      EXPIRED     SUBMITTED           │
                                       │              │
                                       │ Admin review │
                               ┌───────┴───────┐      │
                               │               │      │
                            Approved        Rejected  │
                               │               │      │
                               ▼               ▼      │
                           VERIFIED         FAILED ◄──┘
                               │
                               │ Rewards distributed
                               ▼
                           COMPLETE
```

### Status Definitions

| Status | Meaning |
|--------|---------|
| `ASSIGNED` | Waiting for user to start |
| `IN_PROGRESS` | User actively working on it |
| `SUBMITTED` | User submitted; awaiting review (MEDIUM/HARD only) |
| `VERIFIED` | Admin approved; rewards distributed |
| `EXPIRED` | Deadline passed without completion |
| `FAILED` | Admin rejected submission |

---

## 3. Assignment Logic

### How Missions Get Assigned

**Method 1: Manual Assignment** (by user or admin)
```
POST /missions/:userId/assign/:missionId
Body: { deadlineDays: 7 }
```

**Method 2: Daily Auto-Assignment** (cron job at 6 AM)
- Finds all `isDaily: true` missions
- Assigns one random eligible mission per active user
- Deadline: 1 day

### Level Gating

Missions are gated by `requiredLevel`. A user at L2_SKILLED can only see missions requiring L0, L1, or L2.

```
Level Hierarchy:
L0_APPLICANT → L1_ACTIVATED → L2_SKILLED → L3_EXPOSED → L4_EARNER → L5_CATALYST
```

### Duplicate Prevention

The system prevents assigning the same mission twice if it's already in `ASSIGNED` or `IN_PROGRESS` status.

---

## 4. Completion Workflow

### For EASY Missions (Auto-Complete)

1. User clicks "Submit"
2. System immediately marks as `VERIFIED`
3. Rewards distributed
4. No admin review needed

### For MEDIUM/HARD Missions (Review Required)

1. User clicks "Submit" with proof (URL or text)
2. Status → `SUBMITTED`
3. Appears in admin review queue
4. Admin approves → `VERIFIED` + rewards
5. Admin rejects → `FAILED`

### Proof Submission

```typescript
interface CompleteMissionDto {
  proofUrl?: string;   // Link to screenshot, video, etc.
  proofText?: string;  // Description of what was done
}
```

---

## 5. Reward Distribution

When a mission is verified, the Currency Service distributes rewards:

```typescript
await this.currencyService.rewardMission(userId, missionId, {
  momentum: assignment.mission.momentum,    // e.g., 10
  skillXp: assignment.mission.skillXp,      // e.g., 5
  arenaPoints: assignment.mission.arenaPoints, // e.g., 0
});
```

### Triad Score Update

On completion, the MissionEngineService also updates the participant's **Skill Triad Score**:

```
Domain: TECHNICAL, Difficulty: HARD → +20 to Technical score
Domain: SOFT, Difficulty: MEDIUM → +10 to Soft score
```

---

## 6. Momentum Decay System

**The Golden Rule:** Without action, momentum dies.

### How Decay Works

| Trigger | Decay Amount | When |
|---------|--------------|------|
| No check-in today | -5 Momentum | Daily cron at midnight |
| Low momentum detected | Alert created | If < 30 Momentum |

### Decay Cron Logic

```typescript
// Daily at midnight
async applyMomentumDecay() {
  // Find users who haven't checked in
  const inactiveUsers = await this.prisma.user.findMany({
    where: {
      isActive: true,
      lastCheckIn: { lt: yesterday }
    }
  });

  for (const user of inactiveUsers) {
    // Debit 5 momentum
    await this.currencyService.debit(user.id, 'MOMENTUM', 5, 'DECAY_INACTIVE');

    // If momentum drops below 30, create alert
    if (balance.momentum < 30) {
      await this.createInterventionAlert(user.id, 'LOW_MOMENTUM');
    }
  }
}
```

---

## 7. Streak Tracking

Consecutive daily check-ins earn streak bonuses:

| Streak | Bonus |
|--------|-------|
| 7 days | +50 Momentum |
| 14 days | +100 Momentum |
| 30 days | +200 Momentum |

### Check-In Logic

```typescript
async processCheckIn(userId: string) {
  const isConsecutive = isConsecutiveDay(user.lastCheckIn, today);
  const newStreak = isConsecutive ? user.currentStreak + 1 : 1;

  // Apply streak bonus
  if (newStreak === 7) bonus = 50;
  else if (newStreak === 14) bonus = 100;
  else if (newStreak === 30) bonus = 200;

  if (bonus > 0) {
    await this.currencyService.credit(userId, 'MOMENTUM', bonus, `STREAK_BONUS_${newStreak}`);
  }
}
```

---

## 8. Intervention Alerts

When participants show concerning patterns, the system creates alerts for admin attention.

### Alert Types

| Alert Type | Trigger | Severity |
|------------|---------|----------|
| `LOW_MOMENTUM` | Momentum < 30 | HIGH |
| `MISSED_MISSIONS` | 3+ expired/failed in 7 days | HIGH |
| `TRIAD_IMBALANCE` | One domain < 20 while another > 50 | MEDIUM |

### Alert Lifecycle

```
TRIGGERED → (Admin reviews) → RESOLVED
```

Alerts remain active until an admin resolves them with optional notes.

---

## 9. Mission Expiry

Missions that aren't completed before their deadline automatically expire.

### Expiry Cron (Every 6 Hours)

```typescript
async expireMissions() {
  // Mark overdue missions as expired
  await this.prisma.missionAssignment.updateMany({
    where: {
      status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
      expiresAt: { lte: now }
    },
    data: { status: 'EXPIRED' }
  });

  // Check if any user has too many expired missions
  await this.checkMissedMissions();
}
```

---

## 10. Wall Post Ranking

The public "Wall" displays participant achievements, ranked by engagement.

### Rank Score Formula

```
rankScore = triadBalance + momentum + streakBonus + arenaBonus + hashtagBonus + recencyBonus
```

| Component | Calculation |
|-----------|-------------|
| **Triad Balance** | (technical + soft + commercial) / 3 |
| **Momentum** | Current momentum value |
| **Streak Bonus** | min(streak × 2, 30) |
| **Arena Bonus** | arenaPoints / 10 |
| **Hashtag Bonus** | +10 if post used #Cycle28 |
| **Recency Bonus** | max(0, 30 – (daysSincePost × 2)) |

### Recalculation (Hourly Cron)

All published wall posts are re-ranked hourly to keep the feed fresh.

---

## 11. API Endpoints

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/missions/:userId/available` | Get missions user can accept |
| GET | `/missions/:userId` | Get user's mission history |
| GET | `/missions/:userId/active` | Get in-progress missions |
| GET | `/missions/:userId/stats` | Get completion statistics |
| POST | `/missions/:userId/assign/:missionId` | Accept a mission |
| POST | `/missions/:userId/start/:assignmentId` | Begin working on it |
| POST | `/missions/:userId/submit/:assignmentId` | Submit with proof |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/missions/admin/create` | Create new mission template |
| GET | `/missions/admin/pending` | Get submissions awaiting review |
| POST | `/missions/admin/:assignmentId/approve` | Approve submission |
| POST | `/missions/admin/:assignmentId/fail` | Reject submission |
| POST | `/missions/admin/assign-daily` | Trigger daily mission assignment |
| GET | `/missions/all` | List all mission templates |
| GET | `/missions/admin/stats` | Get aggregate statistics |
| PATCH | `/missions/admin/:missionId` | Update mission template |
| PATCH | `/missions/admin/:missionId/status` | Toggle active/inactive |

---

## 12. Cron Jobs (Scheduled Tasks)

| Job | Frequency | What It Does |
|-----|-----------|--------------|
| Daily Mission Assignment | 6:00 AM | Assigns one daily mission to each active user |
| Momentum Decay | Midnight | Applies -5 decay to inactive users |
| Mission Expiry | Every 6 hours | Expires overdue missions |
| Wall Rank Recalculation | Hourly | Recalculates rank scores for wall posts |
| Inactive User Pause | Daily | Pauses users with 7+ days inactivity + low momentum |

---

## 13. Integration Points

### Currency System

The Mission Engine is deeply integrated with the Currency Service:
- **Credit on completion** → Momentum, XP, Arena Points
- **Debit on decay** → Momentum
- **Balance checks** → For support eligibility, stipend tiers

### Skill Triad

Every completed mission updates the participant's Skill Triad Score based on:
- Mission's skill domain (TECHNICAL, SOFT, COMMERCIAL)
- Mission's difficulty (weight: 5, 10, or 20)

### Progress Dashboard

The Progress Service pulls from Mission Engine to display:
- Active missions
- Completion stats
- Current streak
- Triad visualization

---

## 14. Example: Complete User Flow

```
Day 1:
1. User logs in → Check-in recorded, streak = 1
2. Daily mission assigned: "Record a 30-second intro video" (SOFT, EASY)
3. User starts mission → Status: IN_PROGRESS
4. User submits video link → Status: VERIFIED (auto-complete for EASY)
5. Rewards: +10 Momentum, +5 Skill XP
6. Soft skill triad: +5 points

Day 2:
1. User logs in → Streak = 2
2. New daily mission: "Send 2 cold outreach messages" (COMMERCIAL, MEDIUM)
3. User submits with screenshot proof → Status: SUBMITTED
4. Admin reviews and approves → Status: VERIFIED
5. Rewards: +10 Momentum, +5 Skill XP, +5 Arena Points
6. Commercial triad: +10 points

Day 3: (No login)
1. Midnight cron: -5 Momentum decay applied
2. Streak resets (would be 0 if they log in tomorrow)

Day 4:
1. User logs in → Streak = 1 (reset)
2. Behavior logged, no decay applied for today
```

---

## Summary

The Mission Engine is the **behavioral backbone** of Impact OS:

| Feature | Purpose |
|---------|---------|
| **Missions** | Daily/weekly challenges drive engagement |
| **Rewards** | Currency earned incentivizes completion |
| **Decay** | Inactivity penalty keeps people accountable |
| **Streaks** | Bonus rewards for consistency |
| **Alerts** | Admin visibility into struggling participants |
| **Ranking** | Wall posts reward most engaged users |

**Result:** A self-reinforcing loop where *action → reward → more action*, and *inaction → decay → urgency to act*.
