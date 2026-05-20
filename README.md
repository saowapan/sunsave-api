# Sunsave Demo — Solar Subscription Quote Service

A small, focused full-stack application that models the core of a solar
subscription product: a homeowner answers a few questions about their
property and receives an instant, personalised quote — recommended system
size, estimated savings, monthly subscription price, payback period, and
carbon avoided.

Built as a portfolio project to explore the stack used at
[Sunsave](https://www.sunsave.energy/) (NestJS, Next.js, PostgreSQL, Prisma).
It is **not affiliated with Sunsave** and uses only public, illustrative data.

> **Why this project?** I wanted to get hands-on with NestJS before joining a
> team that uses it, and to make sure I actually understood the problem
> domain — turning a handful of facts about a home into a believable quote.
> I deliberately kept the scope narrow so the code I did write could be clean
> rather than spread thin. The interesting engineering lives in the
> calculation domain and the wizard state model, not in feature count.

---

## What it does

```
Landing page  →  Multi-step wizard  →  Instant quote  →  Shareable link
                  (property, region,     (system size,
                   roof, bill)            savings, price…)
```

- **Customer signup wizard** mirroring a real solar onboarding flow, with the
  current step encoded in the URL (`/signup?step=region`) so it is
  shareable, refresh-safe, and back-button friendly.
- **A quote engine** that converts property details into a costed solar
  recommendation using documented UK solar figures.
- **Server-rendered, shareable quote pages** (`/quote/:id`) with dynamic
  social-share metadata.

---

## Tech stack

| Layer      | Choice                               | Notes                                      |
| ---------- | ------------------------------------ | ------------------------------------------ |
| Backend    | NestJS + TypeScript (strict)         | Modular architecture, dependency injection |
| Database   | PostgreSQL 16                        | Run locally via Docker                     |
| ORM        | Prisma 7 (with `@prisma/adapter-pg`) | Type-safe queries, versioned migrations    |
| Validation | Zod                                  | One schema reused on client and server     |
| Frontend   | Next.js (App Router) + TypeScript    | Server components, server-rendered quotes  |
| Styling    | Tailwind CSS                         | Custom solar/leaf theme tokens             |
| Forms      | React Hook Form + Zod resolver       | Per-step validation                        |
| Tests      | Jest                                 | Domain logic + service orchestration       |
| Tooling    | ESLint, Prettier, Docker Compose     |                                            |

---

## Architecture

Two independently deployable services and a database. The frontend talks to
the backend over a small typed HTTP client; the backend owns all business
logic and persistence.

```
┌──────────────────┐        REST/JSON        ┌──────────────────┐
│   Next.js web    │ ──────────────────────▶ │    NestJS API    │
│  (App Router)    │                         │                  │
│  • landing       │                         │  • /quotes       │
│  • /signup       │                         │  • /health       │
│  • /quote/:id    │                         │                  │
└──────────────────┘                         └────────┬─────────┘
                                                       │ Prisma
                                                       ▼
                                              ┌──────────────────┐
                                              │   PostgreSQL     │
                                              └──────────────────┘
```

### Backend module structure

The most important architectural decision is the separation of the **pure
calculation domain** from the framework. The quote maths has no knowledge of
NestJS, Prisma, or HTTP — it is plain functions over plain types.

```
src/
├── config/            # Zod-validated environment variables (fail-fast at boot)
├── prisma/            # PrismaService (lifecycle-managed) + @Global module
├── health/            # DB-aware health check (returns 503 if Postgres is down)
├── calculations/
│   ├── calculations.service.ts   # Thin Nest adapter
│   └── domain/                    # ← framework-free core
│       ├── types.ts               #   inputs/outputs + Zod schemas
│       ├── constants.ts           #   UK solar data, each value sourced
│       ├── formulas.ts            #   pure calculation functions
│       └── formulas.spec.ts       #   unit tests, zero mocks
└── quotes/
    ├── quotes.controller.ts       # REST endpoints (201 on create, 404 on miss)
    ├── quotes.service.ts          # orchestrates: calculate → persist → map
    ├── dto/                       # request/response contracts
    └── pipes/zod-validation.pipe.ts  # generic Zod ⇄ Nest bridge
```

Because the domain is pure, its tests run in milliseconds with no database and
no mocks, and the logic could be lifted into a serverless function or CLI
unchanged. The `CalculationsService` exists as a thin seam where cross-cutting
concerns (logging, metrics, feature-flagged pricing) could be added later
without touching the maths.

---

## Key decisions & trade-offs

This section is the point of the project — the reasoning behind the code.

**Pure domain, isolated from the framework.**
The calculation logic lives in `calculations/domain/` as pure functions with
no Nest/Prisma imports. Business rules are the longest-lived code in any app;
keeping them framework-free makes them trivially testable and portable. The
Nest service is a five-line adapter over them.

**One Zod schema, shared across the boundary.**
`QuoteInputsSchema` defines the validation rules once. The backend uses it in
a validation pipe; the frontend uses the _same_ rules to validate the wizard
(the bill step even extracts the single field via `schema.shape.monthlyBillGbp`).
Currently the schema is duplicated in the web repo with a sync note —
**the obvious next step is a shared workspace package** so there is a single
source of truth. I chose duplication over spending half the timeline on
monorepo setup, and flagged it rather than hiding it.

**Quote outputs are frozen on the row.**
A `Quote` stores both the inputs and the calculated outputs. The outputs could
be recomputed on read, but persisting them means a shared link shows the same
numbers forever, even if the pricing model changes tomorrow. A quote is an
immutable snapshot, not a live recalculation.

**Wizard state: URL + sessionStorage, not Context.**
The current step lives in the URL (shareable, restorable); the collected
answers live in `sessionStorage` (survives refresh, cleared after submit).
React Context would lose everything on refresh and has no natural parent to
host it across separate step routes.

**CUID primary keys, not auto-increment integers.**
Sequential integer IDs leak volume and let anyone enumerate `/quote/1`,
`/quote/2`. CUIDs are non-sequential and URL-safe — appropriate for an ID that
appears in a shareable link.

**Health check that tells the truth.**
`/health` runs `SELECT 1` against Postgres and returns **503** if it fails. A
health endpoint that always returns 200 is theatre — load balancers and
readiness probes rely on it to route traffic away from broken instances.

**Money as `Float` — known tech debt.**
Monetary values use `Float` for speed of development. Production code should
use integer minor units (pence) or a decimal type to avoid floating-point
rounding. This is deliberately flagged, not overlooked.

---

## Running locally

### Prerequisites

- Node.js 20+
- Docker + Docker Compose
- pnpm (`npm install -g pnpm`)

### 1. Start PostgreSQL

From the project root (where `docker-compose.yml` lives):

```bash
docker compose up -d
```

### 2. Backend (`sunsave-api`)

```bash
cd sunsave-api
pnpm install
cp .env.example .env          # adjust DATABASE_URL if needed
pnpm prisma migrate dev       # create the schema
pnpm prisma db seed           # optional: 30 sample quotes
pnpm run start:dev            # http://localhost:3000
```

### 3. Frontend (`sunsave-web`)

```bash
cd sunsave-web
pnpm install
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:3000/api
pnpm run dev                  # http://localhost:3001
```

### 4. Verify

```bash
curl http://localhost:3000/api/health      # → {"status":"ok", ...}
```

Then open <http://localhost:3001> and walk through a quote.

---

## API

| Method | Path              | Description                          | Success     |
| ------ | ----------------- | ------------------------------------ | ----------- |
| `POST` | `/api/quotes`     | Create a quote from property details | `201`       |
| `GET`  | `/api/quotes/:id` | Fetch a quote by ID                  | `200`       |
| `GET`  | `/api/quotes`     | List recent quotes (`?limit=`)       | `200`       |
| `GET`  | `/api/health`     | Liveness + database check            | `200`/`503` |

Invalid input returns `400` with field-level errors from the Zod pipe.

<details>
<summary>Example: create a quote</summary>

```bash
curl -X POST http://localhost:3000/api/quotes \
  -H "Content-Type: application/json" \
  -d '{
    "propertyType": "SEMI_DETACHED",
    "region": "SOUTH_EAST",
    "roofOrientation": "SOUTH",
    "monthlyBillGbp": 120
  }'
```

</details>

---

## Testing

```bash
cd sunsave-api
pnpm run test          # unit + service tests
```

- **`formulas.spec.ts`** — the calculation domain: linearity, regional and
  orientation effects, caps, divide-by-zero, determinism, plausibility bounds.
  No mocks, no database.
- **`quotes.service.spec.ts`** — orchestration with a mocked Prisma client:
  verifies calculate-then-persist ordering, the not-found path, and the
  recent-quotes limit cap.

---

## The quote model

Estimates use documented UK figures, each sourced in
[`constants.ts`](src/calculations/domain/constants.ts)

- **Regional solar yield** (kWh per kWp/year) — MCS irradiance zones / PVGIS
- **Orientation derating** — south = 1.0, east/west ≈ 0.85, north ≈ 0.55
- **Electricity unit price** — Ofgem price cap
- **Self-consumption rate** — ~40% without a battery
- **Install cost** — ~£1,500/kW (MCS installer averages)
- **Grid carbon intensity** — National Grid ESO annual average

The figures are simplified and intended to be _plausible_, not survey-accurate.

---

## What I would do next

In rough priority order:

1. **Shared contracts package** — extract the Zod schemas into a workspace
   package consumed by both apps, removing the current duplication.
2. **Admin dashboard** — an authenticated internal view of quotes (KPIs,
   filtering, a quotes-per-day chart), using GraphQL for the aggregate reads
   where REST is a poorer fit.
3. **Deploy** — containerise both apps; the README's local Docker setup maps
   naturally onto ECS/Fargate, which is the documented Sunsave approach.
4. **Money as integer minor units** — remove the `Float` tech debt.
5. **Battery option** — model higher self-consumption and its cost impact.
6. **Split `/health`** into `/live` and `/ready` for orchestration.

---

## Project status

| Area                             | Status      |
| -------------------------------- | ----------- |
| Backend API + calculation domain | ✅ Complete |
| Test suite (domain + service)    | ✅ Complete |
| Customer wizard → quote journey  | ✅ Complete |
| Admin dashboard                  | ⬜ Planned  |
| Deployment                       | ⬜ Planned  |

---

_A portfolio demo by May Kongpia. Not affiliated with Sunsave._
