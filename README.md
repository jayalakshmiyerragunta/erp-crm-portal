# Mini ERP + CRM Operations Portal

A full-stack Operations Portal built for wholesale/distribution companies to manage Customers, Products, Inventory, and Sales Challans.

## Features Built

1. **Authentication & Roles:** JWT-based auth with `ADMIN`, `SALES`, `WAREHOUSE`, and `ACCOUNTS` roles. Role guards on API endpoints and Frontend routes.
2. **Customer CRM:** Full customer lifecycle management. Add notes, track follow-up dates, view engagement history.
3. **Products & Inventory:** Live stock tracking. Low-stock visual alerts. Strict stock IN/OUT movement ledger logging.
4. **Sales Challan:** Draft/Confirm workflows. Auto-numbering. Dynamic line items. **Atomic stock deductions** (SQL transactions) only trigger when a challan is Confirmed. Restored on Cancellation.
5. **PDF Export (Bonus):** Client-side PDF generation for Sales Challans.

## Tech Stack
- **Backend:** Node.js, Express, TypeScript, Zod (validation), Prisma ORM, PostgreSQL.
- **Frontend:** React 18, Vite, TypeScript, Axios, React Router v6, custom Glassmorphism UI (CSS).

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- Node.js v20+
- PostgreSQL (or Docker to run Postgres)

### 1. Database Setup
Ensure you have a PostgreSQL database running. You can easily start one using the included Docker Compose file:
```bash
docker-compose up -d postgres
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file based on the example:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` in `.env` points to your Postgres instance. If using the docker command above, the default `.env.example` will work perfectly.

Run migrations and seed the database with test data:
```bash
npm run db:push
npm run db:seed
```
Start the backend dev server:
```bash
npm run dev
```
*(Server will start on http://localhost:5001 — the default `.env` uses port 5000 may be occupied by other services)*

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
*(Frontend will start on http://localhost:5173 and proxy `/api` calls to the backend automatically)*

---

## 🔑 Test Credentials (Seeded by default)

| Role | Email | Password |
|---|---|---|
| **Admin** (All access) | `admin@erp.com` | `Admin@123` |
| **Sales** (Customers, Challans) | `sales@erp.com` | `Sales@123` |
| **Warehouse** (Products, Stock) | `warehouse@erp.com` | `Ware@123` |
| **Accounts** (Read Only) | `accounts@erp.com` | `Acct@123` |

---

## 🐳 Docker Deployment (Bonus)
The entire application can be spun up using Docker Compose for production/deployment scenarios.

```bash
docker-compose up --build -d
```
This will start:
1. Postgres Database (port 5432)
2. Node Backend API (port 5000)
3. Nginx + React Frontend (port 80) -> Access the portal at `http://localhost`

---
## 🧱 Architecture Overview

```
┌──────────────┐      ┌──────────────────┐      ┌────────────────┐      ┌────────────┐
│     React    │  →   │   Express API    │  →   │  Prisma ORM    │  →   │ PostgreSQL │
│  (Vite / SPA)│ HTTP │ (JWT, RBAC, Zod) │ SQL  │ (Transactions) │ SQL  │            │
└──────────────┘      └──────────────────┘      └────────────────┘      └────────────┘
```

**Monorepo layout**

| Folder | Purpose |
|---|---|
| `backend/` | Node.js + Express + TypeScript REST API (Prisma, Zod, JWT, bcryptjs) |
| `frontend/` | React 18 + Vite SPA (React Router v6, Axios, glassmorphism UI) |
| `docker-compose.yml` | One-command local/prod stack: Postgres + API + Nginx-served SPA |

**Module structure (backend)**

Each business domain (`auth`, `users`, `customers`, `products`, `challans`) follows a consistent
controller → service → validation (Zod) → router layout:

```
src/modules/<domain>/
  ├── <domain>.router.ts     # Route wiring + role middleware
  ├── <domain>.controller.ts # HTTP layer (parse → call service → respond)
  ├── <domain>.service.ts    # Business logic + Prisma data access
  └── <domain>.schema.ts     # Zod input validation + inferred TS types
```

Shared pieces live in `src/middleware/` (JWT auth, RBAC roles, global error handler)
and `src/config/` (env validation, Prisma client).

**Standard API response shape**

```json
// Success
{ "success": true, "message": "Customer created successfully", "data": { ... } }

// Paginated list
{ "success": true, "message": "Success",
  "data": { "customers": [...], "pagination": { "page": 1, "limit": 15, "total": 42, "totalPages": 3, "hasNextPage": true, "hasPrevPage": false } } }

// Zod validation error (400)
{ "success": false, "message": "Validation error",
  "errors": [{ "field": "mobile", "message": "Invalid Indian mobile number (10 digits starting with 6-9)" }] }

// Business/HTTP error
{ "success": false, "message": "Insufficient stock for: \"Toor Dal (50kg)\" (available: 8, requested: 10)" }
```

**Stock integrity design**

- Manual inbound stock → `POST /api/v1/products/:id/stock` runs a Prisma `$transaction`
  that increments `currentStock` **and** writes an `IN` row to `stock_movements` atomically.
- Challan creation as `DRAFT` does **not** touch stock.
- Challan `CONFIRM` (create-with-status or `PATCH /challans/:id/confirm`) runs inside a
  `$transaction`: stock is validated first, then decremented and an `OUT` movement is logged.
  If any product is short, the whole transaction throws `422` and nothing is written.
- Challan `CANCEL` restores stock (with an `IN` movement) **only if** the challan was previously `CONFIRMED`.

---
## 🌐 Deployment (Free Tier)

The app is designed to deploy to free hosting tiers. No AWS account or paid infrastructure required.

| Layer | Provider | Notes |
|---|---|---|
| **Frontend** | Vercel (or Netlify) | Builds the Vite SPA; static hosting |
| **Backend API** | Railway (or Render / Fly.io) | Runs `npm run build && npm start` |
| **Database** | Neon (or Supabase / Railway Postgres) | Managed PostgreSQL |

### 1. Database (Neon / Supabase)

1. Create a free PostgreSQL instance.
2. Copy the connection string — it looks like `postgresql://user:pass@host/db?sslmode=require`.
3. Use the provider's SSL-enabled connection string — Railway-hosted apps require it.

### 2. Backend env vars

Set these in your hosting provider's dashboard (never commit real secrets):

| Variable | Example | Required |
|---|---|---|
| `PORT` | `5000` | No (defaults to 5000) |
| `NODE_ENV` | `production` | No |
| `DATABASE_URL` | `postgresql://...` | **Yes** |
| `JWT_SECRET` | long random string | **Yes** |
| `JWT_EXPIRES_IN` | `7d` | No |
| `CORS_ORIGIN` | `https://<your-frontend-domain>` | Recommended |

**Deploy steps (Railway):**
1. Push the repo to GitHub.
2. New Project → *Deploy from GitHub* → select the repo.
3. Add a **Domain** (backend gets a `*.up.railway.app` URL automatically; call `GET /health` to verify).
4. Set the env vars above → the app auto-deploys.
5. **Seed the DB once** (schema is auto-created on start via `db push`): open the Railway *Shell* tab and run `npm run db:seed`, or run it locally against the deployed `DATABASE_URL`.

**Deploy steps (Render — alternative):**
1. Push the repo to GitHub.
2. *New* → *Blueprint* → select the repo → Render reads the included `render.yaml` (API web service + auto `npm install → prisma generate → build → start`).
3. Add the env vars (or leave empty — Render prompts for `DATABASE_URL` and `JWT_SECRET`).
4. Deploy → service gets a `*.onrender.com` URL.
5. Seed once via the Render *Shell* tab: `npm run db:seed`.

### 3. Frontend env var

On Vercel, set:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://<your-backend-domain>/api/v1` |

> During local development this is left empty — the Vite dev server proxies `/api` → `http://localhost:5000` (see `frontend/vite.config.ts`). The deployed backend URL is only needed for production builds.

**Deploy steps (Vercel):**
1. Import the repo on vercel.com, root dir = `frontend` (or set via the root `vercel.json` → `rootDirectory`).
2. Add the `VITE_API_URL` env var.
3. Build command `npm run build`, output dir `dist` (auto-detected from Vite).

### 4. Verify after deploy

```
GET  https://<backend>/health            → { "status": "ok" }
POST https://<backend>/api/v1/auth/login → { token, user }
GET  https://<frontend>/dashboard        → login, then portal
```

---
## 💻 Environment Variable Management

- **Backend** — `src/config/env.ts` validates every required variable at startup and **crashes with a clear message** if one is missing (fail-fast). `backend/.env.example` documents all variables; `.env` is git-ignored.
- **Frontend** — Vite exposes only `import.meta.env.VITE_*` variables (adopted at build time). `frontend/.env.example` documents `VITE_API_URL`.
- **Docker** — `docker-compose.yml` wires the same vars (`DATABASE_URL`, `JWT_SECRET`, `PORT`) for the one-command local stack.

---
## 📦 Postman Collection

Import `postman_collection.json` into Postman.

- A `base_url` collection variable points at `http://localhost:5000/api/v1`.
- Logging in auto-saves the JWT into the `token` variable (test script) — every other request sends `Authorization: Bearer {{token}}` automatically.
- For a deployed backend, just update `base_url`.

---

## Notes on Architecture & Edge Cases
- **Data Integrity:** Used Prisma `$transaction` API for Challan Confirmations to ensure atomic stock deduction + ledger entry creation.
- **Data Snapshots:** The `Challan` and `ChallanItem` tables store JSON snapshots of customer and product data at the time of creation so historical invoices aren't affected by future product price changes.
- **Security:** Passwords hashed via `bcryptjs`. Sensitive fields are stripped from all API responses.
- **Env Validation:** `env.ts` forces the server to crash on startup if required variables are missing, preventing runtime errors later.
- **RBAC:** API routes and frontend routes both enforce role guards. `ADMIN` = full access; `WAREHOUSE` = create/edit products + stock; `SALES` = create/edit customers + challans; `ACCOUNTS` = read-only.

---
## ⚠️ Known Limitations & Assumptions

**Assumptions made**
- Single-company tenant (one wholesale/distribution business per deployment).
- Pricing in INR (`Decimal(10,2)`), Indian mobile + GST number format validation.
- Challan numbers auto-generate as `CH-YYYYMMDD-XXXX` (daily sequence).
- Cancelling a `CONFIRMED` challan restores stock; cancelling a `DRAFT` does not.
- JWT payload carries `userId`, `email`, `role`; default expiry `7d`.

**Known limitations / not yet implemented**
1. **No image uploads** — product photos / S3 integration not implemented.
2. **No refresh tokens** — single long-lived JWT; users re-login after expiry.
3. **No email/SMS notifications** — follow-up dates are UI reminders only.
4. **No real-time updates** — stock changes require a refresh/requery (no WebSockets).
5. **Challan PDF is client-side** — generated per challan detail page via `html2canvas` + `jsPDF`, not server-rendered.
6. **No advanced analytics/reports** — dashboard shows KPIs + low-stock + recent challans only.
7. **Rate limiting** — not enabled on the API.
8. **Audit trail** — stock movements are fully audited, but customer/challan edits are not versioned.
9. **Concurrent confirms** — stock checks run before the write transaction; a rare race between simultaneous confirms is possible (Prisma `decrement` never goes below 0, so the worst case is one request errors out).
