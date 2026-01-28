# Impact OS Backend

NestJS API for the Impact OS behavioral engine.

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL and API keys

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start development server
npm run start:dev
```

## Environment Variables

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/impactos

# Email (Resend)
RESEND_API_KEY=re_...

# AI Scoring (Anthropic)
ANTHROPIC_API_KEY=sk-ant-...

# Payments (Paystack)
PAYSTACK_SECRET_KEY=sk_live_...

# Auth
JWT_SECRET=your-secret-key

# CORS
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## Project Structure

```
src/
├── admin/          # Admin dashboard endpoints
├── admission/      # Admission flow + emails
├── assessment/     # Skill Triad scoring
├── cohort-config/  # Cohort settings
├── currency/       # Momentum, XP, Arena Points
├── email/          # Resend integration
├── income/         # Income verification
├── intake/         # Application intake
├── mission/        # Mission assignment
├── partners/       # Partner inquiries
├── prisma/         # Database service
├── scoring/        # AI diagnostic scoring
├── stipend/        # Stipend eligibility
└── testimonials/   # Testimonial submissions
```

## Key Commands

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Database
npx prisma studio      # Visual DB editor
npx prisma migrate dev # Run migrations
npx prisma generate    # Regenerate client

# Testing
npm run test
npm run test:e2e
```

## API Endpoints

### Public
- `POST /intake/start` — Start application
- `POST /intake/section/:num` — Submit intake section
- `POST /testimonials` — Submit testimonial
- `POST /partners/inquiry` — Partner inquiry

### Authenticated
- `GET /missions` — Get user missions
- `POST /missions/:id/submit` — Submit mission
- `GET /currency/balance` — Get currency balances
- `GET /stipend/eligibility` — Check stipend status

### Admin
- `GET /admin/applicants` — List applicants
- `GET /admin/applicants/:id` — Applicant detail
- `POST /admin/applicants/:id/decision` — Make decision

## Database Schema

See `prisma/schema.prisma` for full schema.

Key models:
- `User`, `Applicant`, `Cohort`
- `Mission`, `MissionAssignment`
- `CurrencyLedger`, `IncomeRecord`
- `SupportWallet`, `SupportRequest`
- `Partner`, `FundingCommitment`
