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
