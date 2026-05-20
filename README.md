# Sunsave Demo — Solar Subscription Quote Service

A small, focused full-stack application that models the core of a solar
subscription product: a homeowner answers a few questions about their
property and receives an instant, personalised quote — recommended system
size, estimated savings, monthly subscription price, payback period, and
carbon avoided.

The stack used: NestJS, Next.js, PostgreSQL, Prisma

## Live demo

| Surface | URL                                           |
| ------- | --------------------------------------------- |
| Web app | <https://sunsave-web.vercel.app/>             |
| API     | <https://sunsave-api.onrender.com/api/health> |

> The API runs on Render's free tier, so the first request after a period
> of inactivity may take ~30 seconds to wake the instance. Subsequent
> requests are instant.

> **Why this project?** I wanted to get hands-on with NestJS before joining a
> team that uses it, and to make sure I actually understood the problem
> domain — turning a handful of facts about a home into a believable quote.
> I deliberately kept the scope narrow so the code I did write could be clean
> rather than spread thin. The interesting engineering lives in the
> calculation domain and the wizard state model, not in feature count.

---

## What it does

- **Customer signup wizard** mirroring a real solar onboarding flow, with the
  current step encoded in the URL (`/signup?step=region`) so it is
  shareable, refresh-safe, and back-button friendly.
- **A quote engine** that converts property details into a costed solar
  recommendation using documented UK solar figures.
- **Server-rendered, shareable quote pages** (`/quote/:id`) with dynamic
  social-share metadata.

---

## Architecture

Two independently deployable services and a database. The frontend talks to
the backend over a small typed HTTP client; the backend owns all business
logic and persistence.

````
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

## Running locally

### Prerequisites

- Node.js 20+
- Docker + Docker Compose
- pnpm (`npm install -g pnpm`)

### 1. Start PostgreSQL

From the project root (where `docker-compose.yml` lives):

```bash
docker compose up -d
````

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
3. **Containerise for production-grade hosting** — the apps are deployed to
   Render (API) and Vercel (web). The next step is shipping a container image
   so the same artefact can run on ECS/Fargate, which is the documented
   Sunsave approach, with no platform-specific glue.
4. **Money as integer minor units** — remove the `Float` tech debt.
5. **Battery option** — model higher self-consumption and its cost impact.
6. **Split `/health`** into `/live` and `/ready` for orchestration.

---

## Project status

| Area                                 | Status      |
| ------------------------------------ | ----------- |
| Backend API + calculation domain     | ✅ Complete |
| Test suite (domain + service)        | ✅ Complete |
| Customer wizard → quote journey      | ✅ Complete |
| Admin dashboard                      | ⬜ Planned  |
| Deployment (Render API + Vercel web) | ✅ Live     |

---
