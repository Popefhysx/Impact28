# Impact OS — Feature Development Roadmap

**Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Living Document — Updated as features are completed

---

## Legend

| Status | Meaning |
|--------|---------|
| ✅ | Complete — Implemented and functional |
| 🔄 | In Progress — Actively being developed |
| ⏳ | Pending — Planned, not started |
| 🔜 | Upcoming — Next priority |
| ❌ | Blocked — Waiting on dependencies |
| 🚫 | Deferred — Moved to future version |

---

## Phase 1: Foundation & Intake ✅

### 1.1 Application Flow
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Multi-section intake form | ✅ `intake.service.ts` | ✅ `/apply` | ✅ |
| Resume flow (email link) | ✅ Resume tokens | ✅ | ✅ |
| Progress saving per section | ✅ `completedSections` | ✅ LocalStorage | ✅ |
| Skill track selection | ✅ | ✅ | ✅ |
| Diagnostic probes (5 sections) | ✅ | ✅ | ✅ |
| Consent collection | ✅ 4 consent fields | ✅ | ✅ |
| Success modal with founder message | ✅ `CohortConfig` model | ✅ | ✅ |
| Preview before submit | ✅ | ✅ Section 7 | ✅ |

### 1.2 Cohort Configuration
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Application open/close dates | ✅ `cohort-config.service.ts` | ✅ | ✅ |
| Countdown timer | — | ✅ | ✅ |
| Waitlist signup | ⏳ | ⏳ | ⏳ |
| Disabled skill tracks | ✅ `disabledTracks[]` | ✅ | ✅ |
| Founder message customization | ✅ | ✅ | ✅ |

### 1.3 AI Scoring & Assessment
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Readiness scoring | ✅ `assessment.service.ts` | — | ✅ |
| Skill Triad calculation | ✅ `triadTechnical/Soft/Commercial` | — | ✅ |
| Offer type determination | ✅ `scoring.service.ts` | — | ✅ |
| Risk flag detection | ✅ `riskFlags[]` | — | ✅ |
| AI recommendation | ✅ `aiRecommendation` | — | ✅ |

---

## Phase 2: Admin Dashboard ✅

### 2.1 Core Admin UI
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Admin layout with sidebar | — | ✅ `/admin/layout.tsx` | ✅ |
| Collapsible navigation | — | ✅ | ✅ |
| Mobile hamburger menu | — | ✅ | ✅ |
| Dashboard overview | ✅ `admin.service.ts` | ✅ `/admin` | ✅ |
| Stats cards | ✅ Mock | ✅ | ✅ |
| Recent activity feed | ⏳ | ✅ Mock | 🔄 |
| Quick actions | ⏳ | ✅ | ✅ |

### 2.2 Applicant Management
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Applicant list view | ✅ `admission.service.ts` | ✅ `/admin/applicants` | ✅ |
| Grid/List toggle | — | ✅ | ✅ |
| Status filtering | ✅ | ✅ | ✅ |
| Skill track filtering | ✅ | ✅ | ✅ |
| Search by name/email | ✅ | ✅ | ✅ |
| Applicant detail page | ✅ | ✅ `/admin/applicants/[id]` | ✅ |
| Accept/Reject actions | ✅ | ✅ | ✅ |
| Conditional admission | ✅ `ConditionalTask` model | ✅ | ✅ |
| Conditional task tracking | ✅ | ✅ `/apply/conditional/[id]` | ✅ |
| Accept/Decline offer links | ✅ `offerToken` | ✅ | ✅ |
| Mobile responsive tables | — | ✅ Card view | ✅ |

### 2.3 Participant Management
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Participant list view | ✅ | ✅ `/admin/participants` | ✅ |
| Participant detail page | ✅ | ✅ `/admin/participants/[id]` | ✅ |
| Identity level display | ✅ | ✅ | ✅ |
| Skill triad visualization | ⏳ | ⏳ | ⏳ |
| Currency balances (admin view) | ⏳ | ⏳ | ⏳ |
| Activity timeline | ⏳ | ⏳ | ⏳ |
| Mobile card view | — | ✅ | ✅ |

### 2.4 Resource Management
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Resource CRUD | ✅ `resource.service.ts` | ✅ `/admin/resources` | ✅ |
| URL auto-fetch (OpenGraph) | ✅ | ✅ | ✅ |
| Status workflow (Pending/Approved/Rejected) | ✅ | ✅ | ✅ |
| Skill track tagging | ✅ | ✅ | ✅ |
| Grid/List view toggle | — | ✅ | ✅ |
| Mobile card view | — | ✅ | ✅ |
| Filtering by type/status/track | ✅ | ✅ | ✅ |

### 2.5 Staff Management
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Staff data model | ✅ Prisma `Staff` | — | ✅ |
| Staff CRUD | ✅ `staff.service.ts` | ✅ `/admin/staff` | ✅ |
| Staff detail page | ✅ | ✅ `/admin/staff/[id]` | ✅ |
| Category system (Admin/Staff/Observer) | ✅ | ✅ | ✅ |
| Capability groups | ✅ `capabilities[]` | ⏳ | 🔄 |
| Scope assignments (cohorts/queues) | ✅ Schema | ⏳ | ⏳ |
| Invite flow | ⏳ | ⏳ | ⏳ |
| Role-based UI hiding | ⏳ | ⏳ | ⏳ |

### 2.6 Income Management
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Income record model | ✅ Prisma `IncomeRecord` | — | ✅ |
| Income CRUD | ✅ `income.service.ts` | ✅ `/admin/income` | ✅ |
| Verification workflow | ✅ | ✅ | ✅ |
| Evidence attachment | ⏳ Cloudflare R2 | ⏳ | ⏳ |
| Deduplication | ⏳ | ⏳ | ⏳ |

---

## Phase 3: Participant Dashboard ✅

### 3.1 Core Dashboard
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Dashboard layout with sidebar | — | ✅ `/dashboard/layout.tsx` | ✅ |
| Collapsible navigation | — | ✅ | ✅ |
| Mobile hamburger menu | — | ✅ | ✅ |
| Progress API integration | ✅ `progress.service.ts` | ✅ | ✅ |
| Currency display (Momentum, XP, Arena) | ✅ | ✅ | ✅ |
| Identity level badge | ✅ | ✅ | ✅ |
| Days in program | ✅ | ✅ | ✅ |
| Active missions preview | ⏳ | ✅ Mock | 🔄 |

### 3.2 Support System
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Support request model | ✅ `SupportRequest` | — | ✅ |
| Support request submission | ✅ `support-request.service.ts` | ✅ SupportRequestCard | ✅ |
| Mission-linked justification | ✅ | ✅ | ✅ |
| Request types (Data/Transport/Tools/Cash) | ✅ | ✅ | ✅ |
| Admin approval queue | ⏳ | ⏳ | ⏳ |
| Disbursement tracking | ⏳ | ⏳ | ⏳ |

### 3.3 Sub-Pages
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Missions page | ✅ `mission.service.ts` | ✅ `/dashboard/missions` | 🔄 |
| Resources page | ✅ | ✅ `/dashboard/resources` | ✅ |
| Income page | ✅ | ✅ `/dashboard/income` | ✅ |
| Currency page | ✅ `currency.service.ts` | ✅ `/dashboard/currency` | ✅ |
| Stipend page | ✅ `stipend.service.ts` | ✅ `/dashboard/stipend` | ✅ |
| Profile page | ⏳ | ✅ `/dashboard/profile` | 🔄 |
| Help page | — | ✅ `/dashboard/help` | ✅ |

---

## Phase 4: PSN (Predicted Support Need) ✅

### 4.1 PSN Forecasting
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| PSN data model | ✅ Prisma fields | — | ✅ |
| PSN calculation service | ✅ `psn.service.ts` | — | ✅ |
| Cohort-level forecast | ✅ `CohortPsnForecast` | — | ✅ |
| PSN calculation log (audit) | ✅ `PsnCalculationLog` | — | ✅ |
| Admin PSN forecast widget | ✅ | ✅ `PsnForecastWidget` | ✅ |
| PSN level badges on applicants | ✅ | ⏳ | ⏳ |

### 4.2 PSN Participant View
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| "Need Help?" card (conditional) | — | ✅ SupportRequestCard | ✅ |
| Neutral language enforcement | — | ✅ | ✅ |
| Mission-linked requests | ⏳ | ⏳ | ⏳ |

---

## Phase 5: Partner & Funding System ⏳

### 5.1 Partner Management
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Partner data model | ✅ Prisma `Partner` | — | ✅ |
| Partner CRUD | ✅ `partners.service.ts` | ⏳ | ⏳ |
| Partner pipeline (Lead→Active) | ⏳ | ⏳ | ⏳ |
| Partner portal | ⏳ | ⏳ `/partner` | ⏳ |

### 5.2 Funding Commitments
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Commitment model | ✅ `FundingCommitment` | — | ✅ |
| Commitment types | ✅ | ⏳ | ⏳ |
| Allocation engine | ⏳ | ⏳ | ⏳ |
| Funding ledger | ✅ `FundingLedger` | ⏳ | ⏳ |

### 5.3 Partner Dashboard
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Overview stats | ⏳ | ⏳ | ⏳ |
| Commitment list | ⏳ | ⏳ | ⏳ |
| Reports access | ⏳ | ⏳ | ⏳ |
| Funding history | ⏳ | ⏳ | ⏳ |

---

## Phase 6: Communications Center 🚫

> **Status:** Deferred to v2

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Message composition | ⏳ | ⏳ | 🚫 |
| Multi-channel delivery (Email/In-App) | ⏳ | ⏳ | 🚫 |
| Template system | ⏳ | ⏳ | 🚫 |
| Communication ledger | ⏳ | ⏳ | 🚫 |
| Delivery status tracking | ⏳ | ⏳ | 🚫 |

---

## Phase 7: Mission Engine 🔄

### 7.1 Core Mission System
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Mission data model | ✅ Prisma models | — | ✅ |
| Mission CRUD | ✅ `mission.service.ts` | ⏳ | 🔄 |
| Mission assignment | ✅ `MissionAssignment` | ⏳ | ⏳ |
| Difficulty system | ✅ | ⏳ | ⏳ |
| Reward configuration | ✅ | ⏳ | ⏳ |

### 7.2 Mission Completion
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Evidence submission | ⏳ | ⏳ | ⏳ |
| XP/Arena rewards | ⏳ | ⏳ | ⏳ |
| Daily check-ins | ⏳ | ⏳ | ⏳ |
| Streak tracking | ⏳ | ⏳ | ⏳ |

---

## Phase 8: Currency & Gamification ⏳

### 8.1 Currency System
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Currency ledger | ✅ `CurrencyLedger` | — | ✅ |
| Currency service | ✅ `currency.service.ts` | — | ✅ |
| Momentum (consistency) | ⏳ | ⏳ | ⏳ |
| Skill XP (track-specific) | ⏳ | ⏳ | ⏳ |
| Arena Points (courage) | ⏳ | ⏳ | ⏳ |
| Income Proof (truth) | ⏳ | ⏳ | ⏳ |

### 8.2 Decay & Rules
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Momentum decay | ⏳ | — | ⏳ |
| Inactivity pause | ⏳ | — | ⏳ |
| Stipend gating by activity | ⏳ | — | ⏳ |

---

## Phase 9: Support Wallet & Disbursement ⏳

### 9.1 Budget System
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Support wallet model | ✅ `SupportWallet` | — | ✅ |
| Maximum Support Allocation | ⏳ | — | ⏳ |
| Category spend tracking | ⏳ | — | ⏳ |

### 9.2 Disbursement
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Paystack integration | ⏳ | — | ⏳ |
| Account verification | ⏳ | — | ⏳ |
| Data/Airtime top-up | ⏳ | — | ⏳ |
| Cash transfer (last resort) | ⏳ | — | ⏳ |
| Audit logging | ⏳ | — | ⏳ |

### 9.3 Approval-to-Disbursement Safeguards 🔜
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Aging alert (APPROVED > 24hrs) | ⏳ Cron job | ⏳ Dashboard alert | 🔜 |
| Disbursement reminder banner | — | ⏳ Queue UI | 🔜 |
| Auto-escalation to supervisor | ⏳ | ⏳ | 🔜 |
| "Approved awaiting disburse" status | ⏳ Enum update | ⏳ | 🔜 |

> **Recommendation:** Add intermediate status `APPROVED_PENDING_DISBURSE` to separate approval from completion. System alerts admin within 24hrs if approved but not disbursed, and auto-escalates to supervisor at 48hrs.

---

## Phase 10: Graduation & Analytics ⏳

### 10.1 Graduation System
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Graduation requirements check | ⏳ | ⏳ | ⏳ |
| Triad completion validation | ⏳ | ⏳ | ⏳ |
| Catalyst status unlock | ⏳ | ⏳ | ⏳ |

### 10.2 Analytics
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Conversion metrics | ⏳ | ⏳ | ⏳ |
| Time-to-first-income | ⏳ | ⏳ | ⏳ |
| Cohort reports | ⏳ | ⏳ | ⏳ |
| Partner impact reports | ⏳ | ⏳ | ⏳ |

---

## Infrastructure Status

### Backend Services (Implemented)
1. ✅ `admin.service.ts`
2. ✅ `admission.service.ts`
3. ✅ `assessment.service.ts`
4. ✅ `auth.service.ts`
5. ✅ `cohort-config.service.ts`
6. ✅ `currency.service.ts`
7. ✅ `email.service.ts` (Resend)
8. ✅ `income.service.ts`
9. ✅ `intake.service.ts`
10. ✅ `mission.service.ts`
11. ✅ `partners.service.ts`
12. ✅ `progress.service.ts`
13. ✅ `psn.service.ts`
14. ✅ `resource.service.ts`
15. ✅ `scoring.service.ts`
16. ✅ `staff.service.ts`
17. ✅ `stipend.service.ts`
18. ✅ `support-request.service.ts`
19. ✅ `testimonials.service.ts`

### Frontend Pages (Implemented)
| Route | Status | Description |
|-------|--------|-------------|
| `/` | ✅ | Homepage redirect |
| `/login` | ✅ | Authentication |
| `/onboarding` | ✅ | New user onboarding |
| `/apply` | ✅ | Multi-section intake form |
| `/apply/accept/[token]` | ✅ | Offer acceptance |
| `/apply/decline/[token]` | ✅ | Offer decline |
| `/apply/conditional/[id]` | ✅ | Conditional task completion |
| `/admin` | ✅ | Admin dashboard |
| `/admin/applicants` | ✅ | Applicant management |
| `/admin/applicants/[id]` | ✅ | Applicant detail |
| `/admin/participants` | ✅ | Participant management |
| `/admin/participants/[id]` | ✅ | Participant detail |
| `/admin/resources` | ✅ | Resource management |
| `/admin/staff` | ✅ | Staff management |
| `/admin/staff/[id]` | ✅ | Staff detail |
| `/admin/income` | ✅ | Income verification |
| `/dashboard` | ✅ | Participant dashboard |
| `/dashboard/missions` | ✅ | Missions |
| `/dashboard/resources` | ✅ | Resources |
| `/dashboard/income` | ✅ | Income tracking |
| `/dashboard/currency` | ✅ | Currency balances |
| `/dashboard/stipend` | ✅ | Stipend status |
| `/dashboard/profile` | 🔄 | Profile management |
| `/dashboard/help` | ✅ | Help center |

### Integrations
| Service | Status | Purpose |
|---------|--------|---------|
| Neon (Postgres) | ✅ | Database |
| Resend | ✅ | Email delivery |
| Paystack | ⏳ | Disbursements |
| Cloudflare R2 | ⏳ | Evidence storage |
| OpenGraph scraper | ✅ | Resource metadata |

---

## Priority Queue (Next Actions)

### 🔜 Immediate (This Sprint)
1. Mission engine completion — Connect backend to frontend
2. Profile page finalization
3. Capability-based UI hiding for staff
4. **Approval-to-Disbursement Safeguards** — Prevent approved requests from going unprocessed

### 📅 Near-term (Next 2 Sprints)
1. Paystack integration for disbursements
2. Evidence upload flow (Cloudflare R2)
3. Partner management UI
4. Cohort reports

### 📆 Medium-term (v1.1)
1. Communications Center
2. Advanced analytics
3. Partner portal
4. Mobile native app consideration

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2026 | Initial roadmap from codebase audit |
| 1.1 | 30 Jan 2026 | Added Section 9.3: Approval-to-Disbursement Safeguards |

---

*This is a living document. Update as features are completed.*
