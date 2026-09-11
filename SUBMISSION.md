# Project Submission — Mini ERP + CRM Operations Portal

> A full-stack Operations Portal for wholesale/distribution companies to manage
> **Customers (CRM), Products & Inventory, and Sales Challans** with role-based access.

---

## 1. GitHub Repository

| Item | Link |
|---|---|
| Repository | https://github.com/jayalakshmiyerragunta/erp-crm-portal |
| Default branch | `main` |

## 2. Live URLs

| Resource | URL |
|---|---|
| **Frontend Portal** | https://erp-crm-portal-idok.vercel.app |
| **Backend API** (base `/api/v1`) | https://erp-crm-backend-u5a0.onrender.com |
| **API Health Check** | https://erp-crm-backend-u5a0.onrender.com/health |
| **README** (in repo) | https://github.com/jayalakshmiyerragunta/erp-crm-portal/blob/main/README.md |

The backend root (`/`) returns an API info banner for browsers and a JSON payload
for API clients; `/health` reports service status. Both are hosted on free tiers
(Frontend: Vercel, Backend: Render, DB: Neon).

## 3. Test Login Credentials (seeded by default)

| Role | Access | Email | Password |
|---|---|---|---|
| **Admin** | Full access (users, customers, products, stock, challans) | `admin@erp.com` | `Admin@123` |
| **Sales** | Customers + Challans (create/edit) | `sales@erp.com` | `Sales@123` |
| **Warehouse** | Products + Stock IN (create/edit) | `warehouse@erp.com` | `Ware@123` |
| **Accounts** | Read-only across all modules | `accounts@erp.com` | `Acct@123` |

> The login page includes one-click "quick fill" buttons pre-loaded with these credentials.

## 4. Postman Collection / API Documentation

- **File:** `postman_collection.json` in the repository root. Import it into Postman (`Import` → file).
- **Variables:** `base_url` defaults to the **live Render backend**
  (`https://erp-crm-backend-u5a0.onrender.com/api/v1`); set it to
  `http://localhost:5001/api/v1` for local development.
  `token` is stored automatically after each role login.
- **Auth:** A login request per role is included. Every login saves its JWT to
  `{{token}}`, so all other requests automatically send
  `Authorization: Bearer {{token}}`.
- **Folders:** Auth, Users, Customers, Products & Stock, Sales Challans, Dashboard, Health.

### API Endpoints (all under `/api/v1`)

**Auth**
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/auth/login` | — | Returns `data.token` + `data.user` |
| GET | `/auth/me` | all | Current user profile |

**Users**
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/users` | ADMIN | List users |
| GET | `/users/:id` | ADMIN | Get one user |
| POST | `/users` | ADMIN | Create user |
| PATCH | `/users/:id` | ADMIN | Update user |

**Customers**
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/customers` | all | List (search, status, customerType, pagination) |
| GET | `/customers/:id` | all | Customer detail |
| POST | `/customers` | ADMIN, SALES | Create customer |
| PATCH | `/customers/:id` | ADMIN, SALES | Update customer |
| GET | `/customers/:id/followups` | all | Follow-up timeline |
| POST | `/customers/:id/followups` | ADMIN, SALES | Add follow-up note |

**Products & Stock**
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/products` | all | List (search, category, lowStock, pagination) |
| GET | `/products/categories` | all | Distinct categories |
| GET | `/products/:id` | all | Product detail |
| POST | `/products` | ADMIN, WAREHOUSE | Create product |
| PATCH | `/products/:id` | ADMIN, WAREHOUSE | Update product |
| POST | `/products/:id/stock` | ADMIN, WAREHOUSE | Stock IN (ledger-logged) |
| GET | `/products/:id/movements` | all | Stock movement ledger |

**Sales Challans**
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/challans` | all | List (search, status, pagination) |
| GET | `/challans/:id` | all | Challan detail (with snapshots) |
| POST | `/challans` | ADMIN, SALES | Create (DRAFT or CONFIRMED) |
| PATCH | `/challans/:id/confirm` | ADMIN, SALES | Confirm → atomic stock deduction |
| PATCH | `/challans/:id/cancel` | ADMIN, SALES | Cancel → restore stock if confirmed |

**Dashboard & Health** (health/root have no `/api/v1` prefix)
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/dashboard/stats` | all | KPIs, recent challans, low-stock items |
| GET | `/health` | — | Service health |
| GET | `/` | — | API info banner (HTML for browsers, JSON for clients) |

**Standard response shapes**
```json
// Success
{ "success": true, "message": "Customer created successfully", "data": { ... } }

// Paginated list
{ "success": true, "message": "Success",
  "data": { "customers": [...], "pagination": { "page": 1, "limit": 15, "total": 42,
            "totalPages": 3, "hasNextPage": true, "hasPrevPage": false } } }

// Validation error (400)
{ "success": false, "message": "Validation error",
  "errors": [{ "field": "mobile", "message": "Invalid Indian mobile number" }] }

// Business error
{ "success": false, "message": "Insufficient stock for: \"Toor Dal (50kg)\" (available: 8, requested: 10)" }
```

## 5. Setup Instructions

### Prerequisites
- Node.js v20+, PostgreSQL (or Docker), npm.

### Local setup
```bash
# 1. Database (uses included docker-compose)
docker-compose up -d postgres

# 2. Backend
cd backend
npm install
cp .env.example .env          # DATABASE_URL + JWT_SECRET
npm run db:push               # create schema
npm run db:seed               # seed roles + demo data
npm run dev                   # http://localhost:5001

# 3. Frontend (second terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173 (proxies /api to backend)
```

## 6. Deployment Instructions (free tier — this is how the live site runs)

| Layer | Provider | Configuration |
|---|---|---|
| **Frontend** | Vercel | Framework preset `Vite`, Root Directory `frontend`, build `npm run build`, output `dist` |
| **Backend API** | Render | Blueprint `render.yaml` → web service; build: `npm install --include=dev && npx prisma generate && npm run build`; start: `npx prisma db push && npm start` |
| **Database** | Neon | Managed PostgreSQL; set as `DATABASE_URL` |

**Backend env vars** (set in provider dashboard, never commit):

| Variable | Example | Required |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` | Yes |
| `JWT_SECRET` | long random string | Yes |
| `PORT` | `5000` | No |
| `NODE_ENV` | `production` | No |
| `JWT_EXPIRES_IN` | `7d` | No |
| `CORS_ORIGIN` | `https://<frontend-domain>` | Recommended |

**One-time seed** after deploy: `npm run db:seed` against the deployed `DATABASE_URL`
(schema is auto-created on start via `prisma db push`).

**Frontend:** `VITE_API_URL` is optional — the app defaults to the deployed Render
backend. `vercel.json` (SPA fallback) lives inside `frontend/` and must stay within
the Root Directory. Full step-by-step detail is in `README.md` (section "Deployment").

## 7. Architecture (short)

Layered full-stack monorepo:

```
React (Vite SPA)  →  Express API  →  Prisma ORM  →  PostgreSQL
   (Axios, Router)   (JWT, RBAC, Zod) (transactions)
```

- **`backend/`** — Node.js + Express + TypeScript. Each domain (`auth`, `users`,
  `customers`, `products`, `challans`) follows a consistent
  `router → controller → service → Prisma` layout, with Zod input validation,
  JWT auth middleware and role-based (RBAC) guards. Env vars are validated at
  startup (fail-fast).
- **`frontend/`** — React 18 + Vite SPA. Role-aware routing, Axios client with
  auth interceptor, and a custom enterprise CSS design system (no UI framework).
  Challan PDFs are generated client-side.
- **`docker-compose.yml`** — one-command local stack: Postgres + API + Nginx-served SPA.

**Data-integrity highlights**
- Stock IN and Challan **CONFIRM** run inside Prisma `$transaction` (atomic): stock is
  validated → decremented → an `OUT` movement is logged. If any product is short,
  the whole operation throws `422` and nothing is written.
- Challan **CANCEL** restores stock only if the challan was previously `CONFIRMED`.
- Challan items store **JSON snapshots** of customer/product data at creation time,
  so historical invoices are unaffected by later price changes.
- Passwords hashed with `bcryptjs`; sensitive fields stripped from API responses.

## 8. Known Limitations / Incomplete Parts

1. **No image uploads** — product photos / S3 integration not implemented.
2. **No refresh tokens** — single long-lived JWT (default 7d); users re-login after expiry.
3. **No email/SMS notifications** — follow-up dates are in-app reminders only.
4. **No real-time updates** — stock changes require refresh/requery (no WebSockets).
5. **Challan PDF is client-side** (`html2canvas` + `jsPDF`), not server-rendered.
6. **No advanced analytics/reports** — dashboard shows KPIs, low-stock and recent challans only.
7. **No API rate limiting.**
8. **No full audit trail** — stock movements are audited; customer/challan edits are not versioned.
9. **Concurrent confirms** — a rare race between simultaneous confirms is possible (Prisma
   `decrement` never goes below 0, so the worst case is one request errors out).

**Assumptions made:** single-company tenant; INR pricing; Indian mobile + GST format
validation; challan numbers `CH-YYYYMMDD-XXXX` (daily sequence).