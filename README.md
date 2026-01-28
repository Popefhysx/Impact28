# Impact OS

**Behavioral infrastructure for economic transformation.**

Impact OS is the engine that powers Cycle28's participant programs — a system designed to convert potential into income through skills, action, and accountability.

---

## 🎯 What is Impact OS?

Impact OS is not a learning management system. It's a **behavioral operating system** that:

- Tracks **action**, not attendance
- Rewards **exposure to failure**, not comfort
- Measures **income as the outcome**, not completion certificates
- Enforces rules **programmatically**, not manually

> **"The system runs whether or not anyone is watching."**

---

## 📂 Project Structure

```
impact-os/
├── docs/                          # Governance & operational documentation
│   ├── IMPACT_OS_GOVERNANCE.md    # Core rules & philosophy
│   ├── SUPPORT_WALLET.md          # Budget & disbursement system
│   ├── PARTNER_FUNDING.md         # Partner commitments & allocation
│   └── INFRASTRUCTURE.md          # Deployment architecture
│
├── impact-os-backend/             # NestJS API
│   ├── src/                       # Source code
│   ├── prisma/                    # Database schema & migrations
│   └── package.json
│
└── impact-os-frontend/            # Next.js Dashboard
    ├── src/app/                   # App router pages
    └── package.json
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router) |
| **Backend** | NestJS + Prisma |
| **Database** | PostgreSQL (Neon) |
| **Storage** | Cloudflare R2 |
| **Hosting** | Vercel (FE) + Render (BE) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (or Neon account)
- pnpm or npm

### Backend Setup

```bash
cd impact-os-backend
npm install
cp .env.example .env  # Configure your database URL
npx prisma migrate dev
npm run start:dev
```

### Frontend Setup

```bash
cd impact-os-frontend
npm install
npm run dev
```

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [Governance](./docs/IMPACT_OS_GOVERNANCE.md) | Core rules, identity levels, currencies, missions |
| [Support Wallet](./docs/SUPPORT_WALLET.md) | Participant support, budget, disbursement |
| [Partner Funding](./docs/PARTNER_FUNDING.md) | Partner management, commitments, allocation |
| [Infrastructure](./docs/INFRASTRUCTURE.md) | Deployment architecture, service design |

---

## 🧠 Core Concepts

### Identity Levels
Participants progress through 6 levels based on **verified action**:

| Level | Name | Requirement |
|-------|------|-------------|
| L0 | Applicant | Applied |
| L1 | Activated | Onboarded |
| L2 | Skilled | Technical competency |
| L3 | Exposed | Market attempts |
| L4 | Earner | First income |
| L5 | Catalyst | Sustained income |

### Three Currencies
- **Momentum** — Daily activity fuel
- **Skill XP** — Technical proficiency
- **Arena Points** — Market exposure credits

### The One Rule
> Earn income before Day 90 — or exit.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        VERCEL                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Next.js Frontend                        │   │
│  │  Participant | Mentor | Admin | Partner Dashboards   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        RENDER                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              NestJS Backend                          │   │
│  │  API Endpoints | Background Queue | Cron Jobs        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │   NEON   │   │    R2    │   │ PAYSTACK │
        │ Postgres │   │ Storage  │   │ Payments │
        └──────────┘   └──────────┘   └──────────┘
```

---

## 📊 Database Schema Highlights

### Participant Systems
- `User` — Identity, levels, cohort
- `Mission` — Skill tracks, requirements
- `CurrencyLedger` — All currency transactions
- `IncomeRecord` — Verified earnings

### Support Systems
- `SupportWallet` — Budget per participant
- `SupportRequest` — Tiered approval flow
- `DisbursementLog` — Immutable audit trail

### Partner Systems
- `Partner` — Organizations
- `FundingCommitment` — Recurring, one-off, cohort sponsor
- `CommitmentAllocation` — Links to cohorts
- `FundingLedger` — All funding events

---

## 🔐 Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# API Keys
RESEND_API_KEY=re_...
ANTHROPIC_API_KEY=sk-ant-...
PAYSTACK_SECRET_KEY=sk_live_...

# Storage (Cloudflare R2)
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_ENDPOINT=...

# Auth
JWT_SECRET=...
```

---

## 🤝 Contributing

Impact OS is purpose-built for Cycle28's mission. If you're interested in replicating or adapting this system:

1. Read the [Governance documentation](./docs/IMPACT_OS_GOVERNANCE.md)
2. Understand the [Infrastructure requirements](./docs/INFRASTRUCTURE.md)
3. Reach out to discuss partnership

---

## 📜 License

This project is proprietary to Cycle28 / Project 3:10.

---

**Built with conviction.** 🚀
