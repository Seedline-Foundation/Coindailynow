// ─────────────────────────────────────────────────────────────────────
// CFIS — CoinDaily Financial Intelligence System
// All cash emanates from CFIS. All receivables sent to CFIS.
// Super Admin is UPDATED — CFIS executes ALL payments.
// AI Agent ARIA verifies every outbound transaction.
// ─────────────────────────────────────────────────────────────────────

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { requireSuperAdmin, loginSuperAdmin, verifyInternalHMAC } from './middleware/auth';

// Route modules
import dashboardRoutes from './routes/dashboard';
import walletRoutes from './routes/wallets';
import transactionRoutes from './routes/transactions';
import paymentRoutes from './routes/payments';
import pressRoutes from './routes/press';
import pressPublicRoutes from './routes/pressPublic';
import payrollRoutes from './routes/payroll';
import partnershipRoutes from './routes/partnerships';
import airdropRoutes from './routes/airdrops';
import notificationRoutes from './routes/notifications';

dotenv.config();

const app = express();
const port = process.env.PORT || 3005;

// ─── Middleware ───────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-HMAC-Signature, X-HMAC-Timestamp, X-Request-Id');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});

// Request timing
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const elapsed = Date.now() - start;
    if (elapsed > 500) {
      console.warn(`[SLOW] ${req.method} ${req.path} took ${elapsed}ms`);
    }
  });
  next();
});

// ─── Static Dashboard (served before auth) ───────────────────────────
app.use('/dashboard', express.static(path.join(__dirname, '..', 'public', 'dashboard')));
app.get('/', (req, res) => res.redirect('/dashboard'));

// ─── Public Routes ───────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    system: 'CFIS',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Super Admin login — returns JWT
app.post('/api/auth/login', loginSuperAdmin);

// Internal service auth (HMAC)
app.post('/api/internal/receive', verifyInternalHMAC, async (req, res) => {
  try {
    const { paymentProcessor } = require('./services/PaymentProcessor');
    const tx = await paymentProcessor.receiveFunds(req.body);
    res.json({ data: tx });
  } catch (error: any) {
    res.status(400).json({ error: { code: 'RECEIVE_ERROR', message: error.message } });
  }
});

// ─── Public Press Order Routes (HMAC-signed by SENDPRESS) ────
// Users place PR orders via press.coindaily.online → SENDPRESS calls these endpoints
// → CFIS creates escrow → Super Admin sees it in dashboard immediately
app.use('/api/press-orders', pressPublicRoutes);

// ─── Authenticated API Routes ────────────────────────────────────────
app.use('/api/dashboard', requireSuperAdmin, dashboardRoutes);
app.use('/api/wallets', requireSuperAdmin, walletRoutes);
app.use('/api/transactions', requireSuperAdmin, transactionRoutes);
app.use('/api/payments', requireSuperAdmin, paymentRoutes);
app.use('/api/press', requireSuperAdmin, pressRoutes);
app.use('/api/payroll', requireSuperAdmin, payrollRoutes);
app.use('/api/partnerships', requireSuperAdmin, partnershipRoutes);
app.use('/api/airdrops', requireSuperAdmin, airdropRoutes);
app.use('/api/notifications', requireSuperAdmin, notificationRoutes);

// ─── 404 / Error Handling ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[CFIS ERROR]', err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An internal error occurred' } });
});

// ─── Start Server ────────────────────────────────────────────────────
app.listen(port, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     CFIS — CoinDaily Financial Intelligence System          ║');
  console.log('║     All payments flow through CFIS. AI Agent ARIA active.   ║');
  console.log(`║     Running on port ${String(port).padEnd(41)}║`);
  console.log('║     Dashboard: http://localhost:' + port + '/dashboard               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
});

export default app;
