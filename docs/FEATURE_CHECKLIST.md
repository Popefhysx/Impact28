# Impact OS Feature Checklist

> **Legend**: ✅ Built | 🟡 Partial | ❌ Not Built | 🔌 API Only (no UI)

---

## Admin Panel

### Dashboard
| Feature | Status | Notes |
|---------|--------|-------|
| Overview stats (participants, missions, income) | ✅ | |
| Quick action cards | ✅ | |

---

### People

#### Applicants (`/admin/applicants`)
| Feature | Status | Notes |
|---------|--------|-------|
| List applicants with search/filter | ✅ | |
| View applicant detail | ✅ | |
| Approve/Reject applicants | ✅ | |
| Send admission offers | ✅ | |
| Mobile card view toggle | ✅ | |

#### Participants (`/admin/participants`)
| Feature | Status | Notes |
|---------|--------|-------|
| List participants with search/filter | ✅ | |
| View participant detail | ✅ | |
| View curriculum status | 🟡 | Basic info, needs full curriculum view |
| Phase progression tracking | 🟡 | Backend ready, UI partial |
| Mobile card view toggle | ✅ | |

#### Staff (`/admin/staff`)
| Feature | Status | Notes |
|---------|--------|-------|
| List staff members | ✅ | |
| Add/Edit/Remove staff | ✅ | |
| Role assignment (ADMIN, STAFF) | ✅ | |

---

### Program

#### Missions (`/admin/missions`)
| Feature | Status | Notes |
|---------|--------|-------|
| List all missions | ✅ | |
| Create new mission | ✅ | |
| Edit mission details | ✅ | |
| Delete mission | ✅ | |
| View pending submissions | ✅ | |
| Verify/Reject submissions | ✅ | |

#### Income Verification (`/admin/income`)
| Feature | Status | Notes |
|---------|--------|-------|
| List income submissions | ✅ | |
| Approve/Reject income proof | ✅ | |
| View income analytics | 🟡 | Basic stats only |

#### Support Requests (`/admin/support`)
| Feature | Status | Notes |
|---------|--------|-------|
| List all support requests | ✅ | |
| Approve/Reject requests | ✅ | |
| Set expiration date | ✅ | |
| Auto-expiration cron | ✅ | Backend scheduled task |

#### Resources (`/admin/resources`)
| Feature | Status | Notes |
|---------|--------|-------|
| List resources | ✅ | |
| Create/Edit/Delete resources | ✅ | |
| Upload resource files | ✅ | |

---

### Engagement

#### Communications (`/admin/communications`)
| Feature | Status | Notes |
|---------|--------|-------|
| View email log | ✅ | |
| Compose new email | ✅ | Rich text editor |
| Template selection | ✅ | Handlebars variables |
| Cohort/segment targeting | 🟡 | Needs full segment builder |
| SMS/WhatsApp channels | ❌ | |

#### Email Templates (`/admin/email-templates`)
| Feature | Status | Notes |
|---------|--------|-------|
| List email templates | ✅ | |
| Create/Edit templates | ✅ | Rich text editor |
| Preview template | ✅ | |
| Delete template | ✅ | |

---

### Content

#### Partners (`/admin/partners`)
| Feature | Status | Notes |
|---------|--------|-------|
| List partners | ✅ | |
| Add/Edit/Delete partners | ✅ | |
| Partner logo upload | ✅ | |

#### Testimonials (`/admin/testimonials`)
| Feature | Status | Notes |
|---------|--------|-------|
| List submitted testimonials | ✅ | |
| Approve/Reject testimonials | ✅ | |
| Edit testimonial content | ✅ | |

---

### Settings

#### Cohorts (`/admin/settings/cohorts`)
| Feature | Status | Notes |
|---------|--------|-------|
| List cohorts | ✅ | |
| Create/Edit/Delete cohorts | ✅ | |
| Enrollment count display | ✅ | |

#### Phases (`/admin/settings/phases`)
| Feature | Status | Notes |
|---------|--------|-------|
| List phases | ✅ | |
| Create/Edit/Delete phases | ✅ | |
| Drag-to-reorder phases | ✅ | |
| Set phase duration | ✅ | |

#### Calendar (`/admin/settings/calendar`)
| Feature | Status | Notes |
|---------|--------|-------|
| List calendar events | ✅ | |
| Create/Edit/Delete events | ✅ | |
| Event type badges | ✅ | |
| Cohort-specific events | ✅ | |

#### Program Config (`/admin/settings/config`)
| Feature | Status | Notes |
|---------|--------|-------|
| Program identity settings | ✅ | |
| OTP expiry configuration | ✅ | |
| Self-signup toggle | ✅ | |
| Support request TTL | ✅ | |

---

## Participant Dashboard

### Home (`/dashboard`)
| Feature | Status | Notes |
|---------|--------|-------|
| Welcome header with streak | ✅ | |
| Currency cards (Momentum, XP, Arena, Income) | ✅ | |
| Phase tracker widget | ✅ | Shows current phase & progress |
| Upcoming events widget | ✅ | Next 3 calendar events |
| Active missions list | ✅ | |
| Journey timeline (identity history) | ✅ | |
| Quick stats footer | ✅ | |

---

### Missions (`/dashboard/missions`)
| Feature | Status | Notes |
|---------|--------|-------|
| List assigned missions | ✅ | |
| Start mission | 🟡 | UI exists, needs validation |
| Submit mission | ✅ | |
| View mission details | ✅ | |
| Mission progress tracking | ✅ | |

---

### Income (`/dashboard/income`)
| Feature | Status | Notes |
|---------|--------|-------|
| Submit income proof | ✅ | |
| View submission history | ✅ | |
| Total verified income display | ✅ | |

---

### Support (`/dashboard/support`)
| Feature | Status | Notes |
|---------|--------|-------|
| Request support | ✅ | |
| View request status | ✅ | |
| Request history | ✅ | |

---

### Currency (`/dashboard/currency`)
| Feature | Status | Notes |
|---------|--------|-------|
| View all currency balances | ✅ | |
| Transaction history | ✅ | |
| Currency breakdown | ✅ | |

---

### Profile (`/dashboard/profile`)
| Feature | Status | Notes |
|---------|--------|-------|
| View profile info | ✅ | |
| Edit profile | 🟡 | Limited fields |
| Avatar upload | ❌ | |

---

### Resources (`/dashboard/resources`)
| Feature | Status | Notes |
|---------|--------|-------|
| Browse resources | ✅ | |
| Download resources | ✅ | |
| Search/filter resources | 🟡 | Basic only |

---

### Help (`/dashboard/help`)
| Feature | Status | Notes |
|---------|--------|-------|
| FAQ section | 🟡 | Static content |
| Contact support link | ✅ | |

---

## Backend Modules

| Module | Status | Notes |
|--------|--------|-------|
| Auth (OTP, JWT) | ✅ | |
| Intake (Applications) | ✅ | |
| Admission (Offers) | ✅ | |
| Scoring (Auto-assessment) | ✅ | |
| Assessment (Identity levels) | ✅ | |
| Currency (Ledger, balances) | ✅ | |
| Mission (Assignments, engine) | ✅ | |
| Stipend (Eligibility) | ✅ | Legacy, consider removal |
| Income (Proof verification) | ✅ | |
| Progress (Dashboard aggregator) | ✅ | |
| Support Request | ✅ | With auto-expiry |
| Settings (Phases, Calendar, Config) | ✅ | NEW |
| Communications | ✅ | Email composition |
| Email Templates | ✅ | |
| Email (Resend integration) | ✅ | |
| Partners | ✅ | |
| Testimonials | ✅ | |
| Resources | ✅ | |
| Staff | ✅ | |
| Wall (Social feed) | 🟡 | Basic scaffold |
| PSN (Participant network) | 🟡 | Partial |
| Scheduled Tasks | ✅ | Support expiry cron |

---

## Remaining Work

### High Priority
- [ ] Segment builder for communications (target by cohort/phase/level)
- [ ] Full profile edit with avatar upload
- [ ] Mission start button validation fix
- [ ] Stipend module deprecation or repurpose

### Medium Priority  
- [ ] SMS/WhatsApp communication channels
- [ ] Advanced resource search/filter
- [ ] Wall social feed full implementation
- [ ] PSN participant network features
- [ ] Full curriculum view for participants

### Low Priority
- [ ] Analytics dashboard for admins
- [ ] Export data to CSV/Excel
- [ ] Notification preferences
- [ ] Dark mode toggle
