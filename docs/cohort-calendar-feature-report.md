# Impact OS: Cohort Calendar & Application Reminders

**For:** Program Manager  
**Date:** February 2026

---

## What This Feature Does

This feature automates the operational calendar for each cohort and ensures applicants who start but don't finish their applications receive reminder emails at the right time.

**In simple terms:** You enter one date — when the program starts — and the system figures out everything else.

---

## How the Quarter Works

Each cohort follows a fixed 16-week cycle:

```
        ◄─── APPLICATION PHASE ───►◄───────── 90-DAY PROGRAM ─────────►
        
Week    -4      -3        -2       -1       1-6          7-9       10-12
        │       │         │        │        │            │         │
        ▼       ▼         ▼        ▼        ▼            ▼         ▼
     Apps    Screen    Apps    Orient.   Technical    Market    Income &
     Open    & Sort    Close   + Day 1   Training     Sprint    Graduation
```

---

## The Magic of "One Date"

When you create a new cohort, you only enter:
- **Cohort Name** (e.g., "Q2 2026")
- **Program Start Date** (Day 1 of the 90-day countdown)

The system automatically calculates:

| What | When | Example for May 1 Start |
|------|------|------------------------|
| Applications Open | 4 weeks before Day 1 | April 3 |
| Applications Close | 2 weeks before Day 1 | April 17 |
| Orientation | 1 week before Day 1 | April 24 |
| **Day 1** (Program Starts) | Your chosen date | **May 1** |
| Technical Training Ends | 6 weeks after Day 1 | June 12 |
| Day 30 Check | 30 days after Day 1 | May 31 |
| Day 60 Check | 60 days after Day 1 | June 30 |
| **Day 90** (Graduation) | 90 days after Day 1 | **July 30** |

**You don't have to calculate anything.** Change the start date, and everything adjusts.

---

## Application Reminders

If someone starts an application but doesn't finish it, the system automatically sends up to 3 reminder emails:

| Reminder | When It's Sent | Message Theme |
|----------|---------------|---------------|
| **First** | 24 hours after they started | "Your application is waiting" |
| **Second** | 3 days after they started | "Don't miss out" |
| **Final** | 2 days before applications close | "Last chance — we close soon!" |

**No manual follow-up needed.** The system handles it.

### What Triggers a Reminder?
- The person started an application
- They haven't submitted it yet
- An appropriate amount of time has passed
- They haven't already received that reminder

### What Stops Reminders?
- They submit their application → No more reminders
- Applications close → All reminders stop
- They've already received all 3 → No duplicates

---

## How Everything Connects

```
┌──────────────────────────────────────────────────────────────┐
│                     YOU CREATE A COHORT                       │
│                     "Q2 2026" starting May 1                  │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│              SYSTEM CALCULATES ALL DATES                      │
│  • Applications: Apr 3 - Apr 17                               │
│  • Orientation: Apr 24                                        │
│  • Program: May 1 - Jul 30                                    │
└──────────────────────────┬───────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│   CALENDAR EVENTS       │   │   APPLICATION REMINDERS │
│   Auto-created          │   │   Auto-sent             │
│   for key milestones    │   │   during open window    │
└─────────────────────────┘   └─────────────────────────┘
              │                         │
              └────────────┬────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    YOUR DASHBOARD                             │
│  • See current phase at a glance                              │
│  • Track 90-day countdown                                     │
│  • Monitor application completion rates                       │
│  • View Day 30/60/90 milestones                               │
└──────────────────────────────────────────────────────────────┘
```

---

## What You'll See in the System

### When Creating a Cohort

You'll see a preview of all derived dates before you confirm:

```
┌─────────────────────────────────────────┐
│  Create New Cohort                      │
├─────────────────────────────────────────┤
│  Name: Q2 2026                          │
│  Program Start: May 1, 2026             │
│  Capacity: 50                           │
│                                         │
│  ─── Your Timeline ───                  │
│  📅 Apr 3  — Applications Open          │
│  📅 Apr 17 — Applications Close         │
│  📅 Apr 24 — Orientation                │
│  📅 May 1  — Day 1 (90-Day Countdown)   │
│  📅 Jun 12 — End Technical Training     │
│  📅 Jul 30 — Day 90 / Graduation        │
│                                         │
│         [ Create Cohort ]               │
└─────────────────────────────────────────┘
```

### In the Calendar

Key dates appear automatically:
- Application window opening
- Application deadline
- Orientation session
- Day 30 Readiness Check
- Day 60 Market Check
- Graduation Day

### Email Templates

All reminder emails can be edited in **Admin → Communications → Email Templates**. You control the wording — the system just handles the timing.

---

## Why This Matters

| Before | After |
|--------|-------|
| Manual calendar calculation | Automatic from one date |
| Manually tracking who didn't finish | System sends reminders |
| Risk of missed follow-ups | 3-stage automated nudging |
| Multiple spreadsheets for dates | Everything in one place |
| "When does this cohort's apps close?" | Visible derived timeline |

---

## FAQs

**Q: What if I need to change the program start date?**  
A: Just edit the cohort. All dates recalculate automatically.

**Q: Can I customize the reminder emails?**  
A: Yes. All templates are editable in the admin panel.

**Q: Will applicants get too many emails?**  
A: No. Maximum 3 reminders per applicant, ever.

**Q: What happens if someone applies on the last day?**  
A: They won't get reminders since they're submitting right away. Reminders are only for incomplete applications.

**Q: Does this work for multiple cohorts?**  
A: Yes. Each cohort has its own independent calendar and reminder tracking.

---

## Summary

1. **One date drives everything** — Enter the program start date, get a full 16-week timeline.
2. **Reminders are automatic** — 24h, 72h, and final nudges for incomplete applications.
3. **Calendar is auto-generated** — Key milestones appear without manual entry.
4. **Everything connects** — Cohort dates, reminders, and calendar work together.

**Result:** Less admin work, fewer missed applicants, and a consistent operational rhythm across every cohort.
