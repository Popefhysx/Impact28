# Impact OS Documentation

This directory contains the canonical documentation for Impact OS.

---

## 📚 Document Index

| Document | Sections | Purpose |
|----------|----------|---------|
| [IMPACT_OS_GOVERNANCE.md](./IMPACT_OS_GOVERNANCE.md) | 27 | Core rules, philosophy, identity system |
| [SUPPORT_WALLET.md](./SUPPORT_WALLET.md) | 15 | Budget, disbursement, audit |
| [PREDICTED_SUPPORT_NEED.md](./PREDICTED_SUPPORT_NEED.md) | 17 | PSN forecasting, proactive detection, participant request UI |
| [PARTNER_FUNDING.md](./PARTNER_FUNDING.md) | 12 | Partner management, commitments |
| [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) | 10 | Stack, deployment, operations |
| [STAFF_MANAGEMENT.md](./STAFF_MANAGEMENT.md) | — | Staff roles, capabilities, assignments |
| [COMMUNICATIONS_CENTER.md](./COMMUNICATIONS_CENTER.md) | — | Messaging, notifications, audit |
| [FEATURE_CHECKLIST.md](./FEATURE_CHECKLIST.md) | — | Feature build status (Admin & Participant) |
| [TEST_CHECKLIST.md](./TEST_CHECKLIST.md) | — | Manual QA test cases |
| [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md) | — | Planned features and timeline |

---

## 🗂 Document Relationships

```
IMPACT_OS_GOVERNANCE.md (Core)
        │
        ├── Section 14 ──→ SUPPORT_WALLET.md
        │                        │
        │                        └── PREDICTED_SUPPORT_NEED.md
        │                             (Forecasting & Detection)
        │
        ├── Section 24 ──→ PARTNER_FUNDING.md
        │
        ├── Section 25 ──→ INFRASTRUCTURE.md
        │
        └── STAFF_MANAGEMENT.md
             └── COMMUNICATIONS_CENTER.md
```

---

## 📖 Reading Order

### For Product Understanding
1. **Governance** — Start here for philosophy and rules
2. **Support Wallet** — How participant support works
3. **Partner Funding** — How funding flows

### For Technical Implementation
1. **Infrastructure** — Stack and service design
2. **Governance** (Sections 7-13) — Currencies, missions, levels
3. **Support Wallet** (Section 15) — API reference

---

## 📝 Document Standards

Each document follows this structure:
- **Purpose statement** at the top
- **Numbered sections** for navigation
- **Tables** for structured data
- **Diagrams** for flows
- **System Laws** for non-negotiable rules
- **Technical Reference** at the end

---

## 🔗 Cross-References

Documents link to each other. Look for:
> **📖 See [Module Name](./MODULE.md) for details.**

---

## ⚠️ Important Notes

- These are **living documents** — they evolve with the system
- All rules are **programmatically enforced** — not just documented
- No **silent changes** — all updates go through version control

---

*Last updated: February 2026*
