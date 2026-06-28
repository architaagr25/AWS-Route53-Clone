# Route 53 Clone

A functional clone of the **AWS Route 53** console for managing **hosted zones** and **DNS records**, built to recreate the Route 53 user experience and core workflows with a real backend API and persistent storage.

**Live demo:** https://aws-route53-clone-rosy.vercel.app
**API docs:** https://aws-route53-clone-0d94.onrender.com/docs
**Login:** `admin` / `admin`

> The backend is hosted on a free tier that sleeps when idle — the **first request after a period of inactivity may take 30–60 seconds** to wake up, then it's fast.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) · TypeScript · Tailwind CSS |
| Backend | FastAPI · SQLAlchemy · Pydantic |
| Database | SQLite |
| Hosting | Vercel (frontend) · Render (backend) |

---

## Features

### Core
- **Authentication** — mocked login / logout with session persistence.
- **Hosted Zones** — full CRUD with search, pagination, and an authentic Route 53 touch: each new zone is created with its starter **SOA + NS** records. Deleting a zone cascades to its records.
- **DNS Records** — full CRUD within a zone for all common types: **A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA**. Includes search, a record-type filter, per-type value validation, and protection of the system SOA record.
- **Route 53 experience** — AWS-styled navigation, data tables, forms, modals, search, filters, pagination, and toast notifications.
- **Mocked sections** — Dashboard, Health checks, Traffic policies, Resolver, and Profiles are present as "Coming soon" placeholders.

### Bonus
- **Bulk operations** — select and delete multiple records in a single request.
- **BIND import** — import records from a BIND zone file (paste or upload), with a preview before committing.
- **Export** — download a hosted zone as **JSON** or a **BIND** zone file.
- **Dark mode** — persisted light/dark theme toggle.
- **Keyboard shortcuts** — `/` to focus search, `?` for a shortcuts overlay, `Esc` to close dialogs.
- **Responsive** — collapsible sidebar (drawer on mobile) and layouts that adapt to small screens.

---

## Architecture overview

```
┌─────────────────────┐        HTTPS / JSON        ┌──────────────────────┐
│  Next.js frontend   │  ───────────────────────▶  │   FastAPI backend    │
│  (App Router, TS)   │  ◀───────────────────────  │   (REST API)         │
│                     │                            │                      │
│  • typed API client │      Bearer token auth     │  • routers           │
│  • auth/theme/toast │                            │  • Pydantic schemas  │
│    React context    │                            │  • validation layer  │
└─────────────────────┘                            └──────────┬───────────┘
                                                              │ SQLAlchemy ORM
                                                   ┌──────────▼───────────┐
                                                   │   SQLite database    │
                                                   └──────────────────────┘
```

**Backend** — a FastAPI app organized into routers (`auth`, `zones`, `records`). Pydantic schemas validate every request and shape every response; a dedicated validation module enforces per-record-type DNS rules. SQLAlchemy models map to three SQLite tables. Tables are created and demo data is seeded automatically on startup.

**Frontend** — a Next.js App Router application. A single typed API client wraps all backend calls (attaching the auth token and surfacing backend error messages). App-wide concerns — authentication, theme, toasts, and sidebar state — are handled with React context providers. The console shell (top bar, sidebar, breadcrumbs) is a nested layout shared by every page, with route protection that redirects unauthenticated users to the login screen.

### Project structure

```
.
├── backend/
│   ├── app/
│   │   ├── main.py            # app entry: CORS, startup (tables + seed), routers
│   │   ├── database.py        # SQLAlchemy engine, session, Base
│   │   ├── models.py          # ORM models: User, HostedZone, DnsRecord
│   │   ├── schemas.py         # Pydantic request/response models
│   │   ├── validation.py      # per-record-type DNS value validation
│   │   ├── auth.py            # mocked auth: signed tokens + current-user dependency
│   │   ├── seed.py            # demo user + zones/records seeding
│   │   ├── bind.py            # BIND zone-file parse + serialize
│   │   └── routers/           # auth, zones, records
│   ├── tests/                 # pytest API + validation suite
│   └── requirements.txt
└── frontend/
    └── src/
        ├── app/               # routes (login, /route53/*) + layouts
        ├── components/        # shell, ui primitives, auth, feature modals
        └── lib/               # typed API client + shared types
```

---

## Setup instructions

### Prerequisites
- **Python 3.12+**
- **Node.js 18+**

### 1. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API runs at `http://127.0.0.1:8000` — interactive docs at `http://127.0.0.1:8000/docs`. On first run it creates `route53.db` and seeds a demo user and a few hosted zones.

### 2. Frontend

```bash
cd frontend
npm install

# point the frontend at the backend
cp .env.example .env.local        # contains NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

npm run dev
```

Open `http://localhost:3000` and sign in with `admin` / `admin`.

### Running the tests

```bash
cd backend
pytest
```

The suite covers auth, hosted-zone and record CRUD, validation, cascade delete, SOA protection, bulk delete, and BIND import/export. It runs against an isolated temporary database, so it won't touch your dev data.

### Environment variables

**Frontend**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend (e.g. `http://127.0.0.1:8000`). |

**Backend** (all optional — sensible defaults are used)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | local `route53.db` | SQLAlchemy database URL. |
| `SEED_DEMO` | `1` | Seed demo zones on first run (`0` to disable). |
| `FRONTEND_ORIGINS` | localhost | Extra comma-separated origins allowed by CORS. Any `*.vercel.app` origin is already allowed. |

---

## Database schema

Three tables, with a one-to-many relationship from hosted zones to DNS records (cascade delete).

**`users`**

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | primary key |
| username | TEXT | unique |
| password | TEXT | plaintext (mocked auth, demo only) |
| created_at | DATETIME | |

**`hosted_zones`**

| Column | Type | Notes |
|---|---|---|
| id | TEXT | primary key — AWS-style `Z` + 13 chars |
| name | TEXT | domain, fully-qualified (e.g. `example.com.`) |
| type | TEXT | `Public` or `Private` |
| comment | TEXT | description |
| record_count | INTEGER | cached count, kept in sync on writes |
| created_at | DATETIME | |

**`dns_records`**

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | primary key |
| zone_id | TEXT | foreign key → `hosted_zones.id` (ON DELETE CASCADE) |
| name | TEXT | fully-qualified record name |
| type | TEXT | A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA, SOA |
| value | TEXT | newline-separated for multi-value records |
| ttl | INTEGER | seconds |
| routing_policy | TEXT | `Simple` |
| created_at | DATETIME | |

---

## API overview

All endpoints are prefixed with `/api`. Every route except `auth/login` requires a `Bearer` token in the `Authorization` header. Full interactive documentation is available at `/docs`.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Authenticate; returns a token + user. |
| POST | `/api/auth/logout` | Log out (token discarded client-side). |
| GET | `/api/auth/me` | Current user — used to restore the session. |

### Hosted zones
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/zones` | List zones (`search`, `page`, `page_size`). |
| POST | `/api/zones` | Create a zone (auto-adds SOA + NS). |
| GET | `/api/zones/{id}` | Get a single zone. |
| PUT | `/api/zones/{id}` | Update a zone's description. |
| DELETE | `/api/zones/{id}` | Delete a zone and its records. |
| POST | `/api/zones/{id}/import` | Import from BIND (`?commit=true` to persist). |
| GET | `/api/zones/{id}/export` | Export as `?format=json` or `?format=bind`. |

### DNS records
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/zones/{id}/records` | List records (`search`, `type`, `page`, `page_size`). |
| POST | `/api/zones/{id}/records` | Create a record (validated by type). |
| PUT | `/api/records/{id}` | Update a record's value/TTL. |
| DELETE | `/api/records/{id}` | Delete a record (the SOA cannot be deleted). |
| POST | `/api/zones/{id}/records/bulk-delete` | Delete multiple records in one request. |

---

## Notes

- **Authentication is intentionally mocked** per the assignment scope — credentials are checked against a seeded user and the session token is a simple signed value stored in the browser. It is not production-grade security.
- **Demo data** (the `admin` user and a few sample zones) is seeded automatically on first run so the app is immediately usable.
