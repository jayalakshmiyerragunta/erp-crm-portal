import 'express-async-errors';
import express from 'express';
import cors from 'cors';

import authRouter from './modules/auth/auth.router';
import usersRouter from './modules/users/users.router';
import customersRouter from './modules/customers/customers.router';
import productsRouter from './modules/products/products.router';
import challansRouter from './modules/challans/challans.router';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

// ── Middleware ────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Root / API info ───────────────────────────
function apiHome(
  req: express.Request,
  res: express.Response,
  mode: 'json' | 'html'
): void {
  const body = {
    success: true,
    name: 'ERP + CRM Operations Portal API',
    version: '1.0.0',
    status: 'running',
    apiBase: '/api/v1',
    endpoints: [
      'GET  /health',
      'POST /api/v1/auth/login',
      'GET  /api/v1/auth/me',
      'GET  /api/v1/users',
      'GET  /api/v1/customers',
      'GET  /api/v1/products',
      'GET  /api/v1/challans',
      'GET  /api/v1/dashboard/stats',
    ],
    docs: 'See the README / Postman collection for the full endpoint reference.',
    timestamp: new Date().toISOString(),
  };

  if (mode !== 'html') {
    res.status(200).json(body);
    return;
  }

  const ts = body.timestamp;
  const endpointList = body.endpoints
    .map((e) => {
      const [method, path] = e.split(/\s+/);
      return `<li><span class="method">${method}</span><code>${path}</code></li>`;
    })
    .join('');

  res.status(200).type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ERP + CRM Operations Portal API</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9; color: #0f172a; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 32px 16px;
    }
    .card {
      background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 640px; width: 100%;
      box-shadow: 0 12px 32px -8px rgba(16,24,40,.18); overflow: hidden;
    }
    .head { padding: 24px 28px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 14px; }
    .logo { width: 42px; height: 42px; border-radius: 8px; background: linear-gradient(135deg,#6366f1,#4338ca); display: flex; align-items: center; justify-content: center; color:#fff; font-weight: 800; font-size: 16px; flex-shrink: 0; }
    .head .name { font-size: 16px; font-weight: 700; }
    .head .sub { font-size: 12px; color: #64748b; margin-top: 2px; }
    .badge { margin-left: auto; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 999px; white-space: nowrap; }
    .body { padding: 24px 28px; }
    .status-row { display: flex; align-items: center; gap: 10px; font-size: 14px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: #10b981; }
    .status-row .label { color: #475569; }
    .status-row .val { font-weight: 600; }
    .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
    h2 { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; color: #64748b; margin: 22px 0 10px; }
    ul { list-style: none; }
    li { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid #eef2f6; font-size: 13px; }
    li:last-child { border-bottom: none; }
    .method { font-size: 10px; font-weight: 700; color: #4338ca; background: #eef2ff; padding: 2px 7px; border-radius: 4px; width: 48px; text-align: center; flex-shrink: 0; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #0f172a; font-size: 12px; }
    .links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 22px; }
    .links a { font-size: 12px; font-weight: 600; color: #4f46e5; text-decoration: none; border: 1px solid #c7d2fe; background: #eef2ff; padding: 7px 12px; border-radius: 6px; }
    .links a:hover { background: #e0e7ff; }
    .foot { padding: 14px 28px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="head">
      <div class="logo">ERP</div>
      <div>
        <div class="name">${body.name}</div>
        <div class="sub">REST API · base path <code>${body.apiBase}</code></div>
      </div>
      <span class="badge">● Running</span>
    </div>
    <div class="body">
      <div class="status-row">
        <span class="dot"></span><span class="label">Status:</span><span class="val">${body.status}</span>
      </div>
      <div class="meta">Version ${body.version} · Last updated ${ts.replace('T', ' ').slice(0, 19)} UTC · Host ${req.get('host') ?? ''}</div>

      <h2>Main Endpoints</h2>
      <ul>${endpointList}</ul>

      <div class="links">
        <a href="/health">Health Check</a>
        <a href="https://erp-crm-portal-idok.vercel.app">Open Frontend Portal →</a>
        <a href="https://github.com/jayalakshmiyerragunta/erp-crm-portal">GitHub →</a>
      </div>
    </div>
    <div class="foot">
      <span>ERP + CRM Operations Portal</span>
      <span>Full API reference: project README / Postman collection</span>
    </div>
  </div>
</body>
</html>`);
}

app.get('/', (req, res) => {
  const prefersHtml =
    (req.headers.accept ?? '').toLowerCase().includes('text/html');
  apiHome(req, res, prefersHtml ? 'html' : 'json');
});

// ── API Routes ────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`, authRouter);
app.use(`${API}/users`, usersRouter);
app.use(`${API}/customers`, customersRouter);
app.use(`${API}/products`, productsRouter);
app.use(`${API}/challans`, challansRouter);

// Dashboard stats endpoint
app.get(`${API}/dashboard/stats`, async (req, res) => {
  // lazy import to avoid circular deps
  const { prisma } = await import('./config/db');
  const { authenticate } = await import('./middleware/auth');

  // inline auth check
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  const jwt = await import('jsonwebtoken');
  const { config } = await import('./config/env');
  try {
    jwt.default.verify(authHeader.slice(7), config.jwt.secret);
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }

  const [totalCustomers, activeCustomers, totalProducts, lowStockProducts, totalChallans, confirmedChallans, draftChallans] =
    await prisma.$transaction([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({
        where: { isActive: true, currentStock: { lte: prisma.product.fields.minStockQty } },
      }),
      prisma.challan.count(),
      prisma.challan.count({ where: { status: 'CONFIRMED' } }),
      prisma.challan.count({ where: { status: 'DRAFT' } }),
    ]);

  const recentChallans = await prisma.challan.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { customer: { select: { name: true } }, creator: { select: { name: true } } },
  });

  const lowStockItems = await prisma.product.findMany({
    where: { isActive: true, currentStock: { lte: prisma.product.fields.minStockQty } },
    orderBy: { currentStock: 'asc' },
    take: 5,
  });

  res.json({
    success: true,
    data: {
      customers: { total: totalCustomers, active: activeCustomers },
      products: { total: totalProducts, lowStock: lowStockProducts },
      challans: { total: totalChallans, confirmed: confirmedChallans, draft: draftChallans },
      recentChallans,
      lowStockItems,
    },
  });
});

// ── 404 handler ───────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Error handler ─────────────────────────────
app.use(errorHandler);

export default app;
