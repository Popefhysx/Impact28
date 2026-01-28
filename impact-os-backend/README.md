# Impact OS Backend

Behavioral Operating System for Economic Transformation - Project 3:10

**Tagline**: *From potential to paycheck.*

## Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL (Docker for dev, Neon for prod)
- **ORM**: Prisma 7
- **Validation**: class-validator
- **Email**: Resend

## Quick Start

### Prerequisites

- Node.js 18+
- Docker Desktop (for local PostgreSQL)

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start PostgreSQL**
   ```bash
   docker compose up -d
   ```

3. **Run migrations**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Start development server**
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:4000/api`

## API Endpoints

### Intake (Onboarding Form)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/intake/start` | Start application (Section 1) |
| PUT | `/api/intake/:id/section/2` | Update Section 2 |
| PUT | `/api/intake/:id/section/3` | Update Section 3 |
| PUT | `/api/intake/:id/section/4` | Update Section 4 |
| PUT | `/api/intake/:id/section/5` | Update Section 5 |
| POST | `/api/intake/:id/submit` | Submit application (Section 6) |
| GET | `/api/intake/:id/status` | Get application status |
| GET | `/api/intake/resume?token=xxx` | Resume with token |
| GET | `/api/intake/find?email=xxx` | Find by email |

### Testimonials

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/testimonials` | Get approved testimonials (public) |
| POST | `/api/testimonials` | Submit new testimonial (pending approval) |
| GET | `/api/testimonials/admin/all` | Admin: Get all testimonials |
| PUT | `/api/testimonials/admin/:id/approve` | Admin: Approve testimonial |
| PUT | `/api/testimonials/admin/:id/reject` | Admin: Reject testimonial |

### Partners (Sponsors + Partners Unified)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/partners/inquiry` | Submit sponsor or partner inquiry |
| GET | `/api/partners/admin/all` | Admin: Get all inquiries |
| PUT | `/api/partners/admin/sponsor/:id/status` | Admin: Update sponsor status |
| PUT | `/api/partners/admin/partner/:id/status` | Admin: Update partner status |

### Cohort Config (Application Status & Settings)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cohort-config` | Get active cohort config (public - for frontend) |
| GET | `/api/cohort-config/admin/cohorts` | Admin: List all cohorts |
| GET | `/api/cohort-config/admin/:cohortId` | Admin: Get specific cohort config |
| PUT | `/api/cohort-config/admin/:cohortId` | Admin: Update cohort config |
| POST | `/api/cohort-config/admin/cohorts` | Admin: Create new cohort |

## Environment Variables

See `.env.example` for all available options.

```bash
# Required
DATABASE_URL="postgresql://impactos:impactos_dev_password@localhost:5432/impactos?schema=public"

# Optional (for production features)
REDIS_URL=           # Upstash Redis for queues
OPENAI_API_KEY=      # AI scoring
RESEND_API_KEY=      # Email notifications
```

## Project Structure

```
src/
├── main.ts              # Entry point, CORS config
├── app.module.ts        # Root module
├── prisma/              # Database service
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── email/               # Email service (Resend)
│   ├── email.module.ts
│   └── email.service.ts
├── intake/              # Onboarding module
│   ├── intake.module.ts
│   ├── intake.controller.ts
│   ├── intake.service.ts
│   └── dto/
├── testimonials/        # Testimonials module
│   ├── testimonials.module.ts
│   ├── testimonials.controller.ts
│   ├── testimonials.service.ts
│   └── dto/
└── partners/            # Partners/Sponsors module
    ├── partners.module.ts
    ├── partners.controller.ts
    ├── partners.service.ts
    └── dto/
```

## CORS Configuration

Allowed origins are configured via the `ALLOWED_ORIGINS` environment variable (comma-separated):

```bash
ALLOWED_ORIGINS=https://cycle28.org,https://www.cycle28.org,http://localhost:3000
```

## Integration with Cycle28 Frontend

The Cycle28 website (`/apply`, testimonial form, sponsor form) connects to this backend via:

```bash
# In Cycle28 .env.local
NEXT_PUBLIC_IMPACT_OS_API=http://localhost:4000/api
```

API client is at `lib/impactos-api.ts` in the Cycle28 project.
