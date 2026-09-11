# Mini ERP + CRM Operations Portal

A full-stack Operations Portal built for wholesale/distribution companies to manage Customers, Products, Inventory, and Sales Challans.

## 🔗 Live Links

| Resource | URL |
|---|---|
| **Frontend Portal** | https://erp-crm-portal-idok.vercel.app |
| **Backend API** (base: `/api/v1`) | https://erp-crm-backend-u5a0.onrender.com |
| **API Health Check** | https://erp-crm-backend-u5a0.onrender.com/health |
| **GitHub Repository** | https://github.com/jayalakshmiyerragunta/erp-crm-portal |
| **Submission Document** | https://github.com/jayalakshmiyerragunta/erp-crm-portal/blob/main/SUBMISSION.md |

> Click any live URL to open it. The backend root (`/`) shows a status page in the browser
> and returns an API info JSON for API clients; `/health` reports service status.
> `SUBMISSION.md` consolidates links, credentials, API reference, setup, architecture and limitations.

## Features Built

1. **Authentication & Roles:** JWT-based auth with `ADMIN`, `SALES`, `WAREHOUSE`, and `ACCOUNTS` roles. Role guards on API endpoints and Frontend routes.
2. **Customer CRM:** Full customer lifecycle management. Add notes, track follow-up dates, view engagement history.
3. **Products & Inventory:** Live stock tracking. Low-stock visual alerts. Strict stock IN/OUT movement ledger logging.
4. **Sales Challan:** Draft/Confirm workflows. Auto-numbering. Dynamic line items. **Atomic stock deductions** (SQL transactions) only trigger when a challan is Confirmed. Restored on Cancellation.
5. **PDF Export (Bonus):** Client-side PDF generation for Sales Challans.

## Tech Stack
- **Backend:** Node.js, Express, TypeScript, Zod (validation), Prisma ORM, PostgreSQL.
- **Frontend:** React 18, Vite, TypeScript, Axios, React Router v6, custom enterprise UI (CSS design system).

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
*(Server starts on http://localhost:5001 — port 5000 is commonly occupied by other services; change `PORT` in `.env` if needed)*

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
| `frontend/` | React 18 + Vite SPA (React Router v6, Axios, enterprise CSS UI) |
| `docker-compose.yml` | One-command local/prod stack: Postgres + API + Nginx-served SPA |
| `postman_collection.json` | Complete Postman collection against the live API |
| `SUBMISSION.md` | Single submission-ready document with links, credentials, API and limitations |

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
## 🌐 Deployment (Free Tier — Current Live Stack)

This repo is currently **deployed and running** on free tiers. PostgreSQL — **Neon**, Backend API — **Render**, Frontend — **Vercel**.

| Layer | Provider | Notes |
|---|---|---|
| **Frontend** | Vercel | Builds the Vite SPA from `frontend/`; static hosting |
| **Backend API** | Render | Blueprint (`render.yaml`) → web service, TypeScript build + start |
| **Database** | Neon | Managed PostgreSQL (serverless, auto-scales to zero) |

### 1. Database (Neon)

1. Create a free Neon project (or any Postgres provider).
2. Copy the connection string — looks like `postgresql://user:pass@ep-xxx.aws.neon.tech/dbname?sslmode=require`.
3. Keep it out of git — set it as the `DATABASE_URL` env var on the backend host.

### 2. Backend env vars

Set these in your hosting provider's dashboard (never commit real secrets):

| Variable | Example | Required |
|---|---|---|
| `PORT` | `5000` | No (Render sets its own) |
| `NODE_ENV` | `production` | No |
| `DATABASE_URL` | `postgresql://...` | **Yes** |
| `JWT_SECRET` | long random string | **Yes** |
| `JWT_EXPIRES_IN` | `7d` | No |
| `CORS_ORIGIN` | `https://<your-frontend-domain>` | Recommended |

**Deploy steps (Render):**
1. Push the repo to GitHub.
2. *New* → *Blueprint* → select the repo → Render reads the included `render.yaml`, which runs `npm install --include=dev && npx prisma generate && npm run build`, then starts with `npx prisma db push && npm start`.
3. Add the env vars above.
4. Deploy → service gets a `*.onrender.com` URL. Verify: open `/` (API banner) and `/health`.
5. **Seed the DB once** (schema is auto-created on start via `prisma db push`): run `npm run db:seed` locally against the deployed `DATABASE_URL`, or use the Render *Shell* tab.

### 3. Frontend (Vercel)

In Vercel project settings (not `vercel.json`) set:

- **Framework Preset:** `Vite`
- **Root Directory:** `frontend`
- **Build Command:** `npm run build` (auto-detected)
- **Output Directory:** `dist` (auto-detected)

`VITE_API_URL` is **optional** — the frontend defaults to the deployed Render backend (`https://erp-crm-backend-u5a0.onrender.com/api/v1`). Set it only if you deploy the backend to a different URL. During local development you can point it at `http://localhost:5001/api/v1`.

The SPA fallback (`vercel.json` → `frontend/vercel.json`) rewrites all unknown paths to `/index.html` so routes like `/login`, `/customers`, `/challans` work on refresh. Note: `vercel.json` must live **inside** the Root Directory (`frontend/`), and `rootDirectory` is a dashboard setting, not a valid `vercel.json` property.

### 4. Verify after deploy

```
GET  https://<backend>/health              → { "status": "ok" }
GET  https://<backend>/                    → status page (browser) / API info JSON (API client)
POST https://<backend>/api/v1/auth/login   → { success, data: { token, user } }
GET  https://<frontend>/login              → login page, then portal
```

---
## 💻 Environment Variable Management

- **Backend** — `src/config/env.ts` validates every required variable at startup and **crashes with a clear message** if one is missing (fail-fast). `backend/.env.example` documents all variables; `.env` is git-ignored.
- **Frontend** — Vite exposes only `import.meta.env.VITE_*` variables (adopted at build time). `frontend/.env.example` documents `VITE_API_URL`.
- **Docker** — `docker-compose.yml` wires the same vars (`DATABASE_URL`, `JWT_SECRET`, `PORT`) for the one-command local stack.

---
## 📦 Postman Collection

Import `postman_collection.json` into Postman.

- The collection ships with two variables: `base_url` (points at the **live Render backend** by default, or set it to `http://localhost:5001/api/v1` for local dev) and `token` (auto-filled after login).
- A **Login** request per role is included; each login saves its JWT so every other request sends `Authorization: Bearer {{token}}` automatically.
- Sorted into folders: Auth, Users, Customers, Products & Stock, Sales Challans, Dashboard, Health.

## 🧩 API Endpoints

All routes are under `/api/v1`. Prefix applies to the references below.

### Auth (`/auth`)

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| POST | `/auth/login` | — | — | Returns `data.token` + `data.user` |
| GET | `/auth/me` | JWT | all | Current user profile |

### Users (`/users`)

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/users` | JWT | ADMIN | List all users |
| GET | `/users/:id` | JWT | ADMIN | Get one user |
| POST | `/users` | JWT | ADMIN | Create a user |
| PATCH | `/users/:id` | JWT | ADMIN | Update a user |

### Customers (`/customers`)

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/customers` | JWT | all | List (search, `status`, `customerType`, pagination) |
| GET | `/customers/:id` | JWT | all | Customer detail |
| POST | `/customers` | JWT | ADMIN, SALES | Create customer |
| PATCH | `/customers/:id` | JWT | ADMIN, SALES | Update customer |
| GET | `/customers/:id/followups` | JWT | all | Follow-up timeline |
| POST | `/customers/:id/followups` | JWT | ADMIN, SALES | Add follow-up note |

### Products & Stock (`/products`)

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/products` | JWT | all | List (search, `category`, `lowStock`, pagination) |
| GET | `/products/categories` | JWT | all | Distinct categories |
| GET | `/products/:id` | JWT | all | Product detail |
| POST | `/products` | JWT | ADMIN, WAREHOUSE | Create product |
| PATCH | `/products/:id` | JWT | ADMIN, WAREHOUSE | Update product |
| POST | `/products/:id/stock` | JWT | ADMIN, WAREHOUSE | Stock IN (ledger-logged) |
| GET | `/products/:id/movements` | JWT | all | Stock movement ledger |

### Sales Challans (`/challans`)

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/challans` | JWT | all | List (search, `status`, pagination) |
| GET | `/challans/:id` | JWT | all | Challan detail (with snapshots) |
| POST | `/challans` | JWT | ADMIN, SALES | Create (DRAFT or CONFIRMED) |
| PATCH | `/challans/:id/confirm` | JWT | ADMIN, SALES | Confirm → atomic stock deduction |
| PATCH | `/challans/:id/cancel` | JWT | ADMIN, SALES | Cancel → restore stock if confirmed |

### Dashboard & Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/dashboard/stats` | JWT | KPIs, recent challans, low-stock items |
| GET | `/health` | — | Service health (no `/api/v1` prefix) |
| GET | `/` | — | Status page (browser) / API info JSON (no `/api/v1` prefix) |

**Standard response shape**

```json
// Success
{ "success": true, "message": "...", "data": { ... } }

// Paginated list
{ "success": true, "data": { "customers": [...], "pagination": { "page": 1, "limit": 15, "total": 42, "totalPages": 3, "hasNextPage": true, "hasPrevPage": false } } }

// Error
{ "success": false, "message": "Insufficient stock for: \"Toor Dal (50kg)\" (available: 8, requested: 10)" }
```

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
