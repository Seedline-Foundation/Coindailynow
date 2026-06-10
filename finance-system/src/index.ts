// ─────────────────────────────────────────────────────────────────────
// CFIS — CoinDaily Financial Intelligence System
// All cash emanates from CFIS. All receivables sent to CFIS.
// Super Admin is UPDATED — CFIS executes ALL payments.
// AI Agent ARIA verifies every outbound transaction.
// ─────────────────────────────────────────────────────────────────────
// N11: CFIS currently connects to Supabase (managed Postgres). A migration
// to the self-hosted Contabo Postgres instance is planned so the entire
// platform shares a single database host. See DATABASE_MIGRATION.md for
// the full migration plan, env-var changes, and backup procedures.
// ─────────────────────────────────────────────────────────────────────

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
// Load environment variables before any local module imports
dotenv.config();

// Bypass self-signed SSL certificate issues with Supabase in development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { requireSuperAdmin, loginSuperAdmin, verifyTOTP, setupTOTP, verifyInternalHMAC, ipWhitelist } from './middleware/auth';

// Route modules
import dashboardRoutes from './routes/dashboard';
import walletRoutes from './routes/wallets';
import transactionRoutes from './routes/transactions';
import paymentRoutes from './routes/payments';
import pressRoutes from './routes/press';
import pressPublicRoutes from './routes/pressPublic';
import subscriptionsWebhookRoutes from './routes/subscriptionsWebhook';
import internalEventsRoutes from './routes/internalEvents';
import taxReportsRoutes from './routes/taxReports';
import pointsBridgeRoutes from './routes/pointsBridge';
import { blockchainListener } from './services/BlockchainListenerService';
import { aiPolicyAgentService } from './services/AIPolicyAgentService';
import payrollRoutes from './routes/payroll';
import partnershipRoutes from './routes/partnerships';
import airdropRoutes from './routes/airdrops';
import notificationRoutes from './routes/notifications';

const app = express();
const port = process.env.PORT || 3005;

// ─── Middleware ───────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],  // dashboard needs inline scripts
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,  // allow dashboard assets
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply IP Whitelist protection globally (W4)
app.use(ipWhitelist);

// ─── Rate Limiting ──────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts per window
  message: { error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again in 15 minutes.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 30,                    // 30 requests per minute
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests. Slow down.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const pressOrderLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 10,                    // 10 press orders per minute
  message: { error: { code: 'RATE_LIMITED', message: 'Press order rate limit exceeded.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS — LOCKED to known origins only (financial system must not be open)
const ALLOWED_ORIGINS = new Set(
  (process.env.CFIS_CORS_ORIGINS || 'https://jet.coindaily.online,https://app.coindaily.online,https://press.coindaily.online').split(',').map(o => o.trim())
);
if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.add('http://localhost:3000');
  ALLOWED_ORIGINS.add('http://localhost:3001');
  ALLOWED_ORIGINS.add('http://localhost:3005');
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  // If origin is not allowed, no Access-Control-Allow-Origin header is set → browser blocks the request
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-HMAC-Signature, X-HMAC-Timestamp, X-Request-Id, X-CFIS-Signature, X-CFIS-Timestamp, X-Press-Signature, X-Press-Timestamp');
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

// ─── Static Dashboard (auth-gated — Super Admin only) ────────────────
// The dashboard HTML is a client-side SPA that calls CFIS APIs with a JWT.
// We gate access so the UI structure and endpoints aren't exposed to unauthorized users.
app.use('/login', express.static(path.join(__dirname, '..', 'public', 'dashboard')));
app.use('/dashboard', requireSuperAdmin, express.static(path.join(__dirname, '..', 'public', 'dashboard')));
app.get('/', (req, res) => res.redirect('/dashboard'));

// ─── Public Routes ───────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    system: 'CFIS',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    blockchainListener: blockchainListener.getHealth(),
  });
});

// Super Admin login — two-step: password → TOTP
// Step 1: POST /api/auth/login        { email, password }           → { step, tempToken }
// Step 2: POST /api/auth/verify-totp  { tempToken, code }           → { token } (enrolled admins)
//         POST /api/auth/setup-totp   { tempToken, code }           → { token } (first-time enrollment)
app.post('/api/auth/login', loginLimiter, loginSuperAdmin);
app.post('/api/auth/verify-totp', loginLimiter, verifyTOTP);
app.post('/api/auth/setup-totp', loginLimiter, setupTOTP);

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
app.use('/api/press-orders', pressOrderLimiter, pressPublicRoutes);
app.use('/api/subscriptions', pressOrderLimiter, subscriptionsWebhookRoutes);
app.use('/api/internal', pressOrderLimiter, internalEventsRoutes);
app.use('/api/tax', apiLimiter, taxReportsRoutes);
app.use('/api/points-bridge', pressOrderLimiter, pointsBridgeRoutes);

// ─── Authenticated API Routes (rate-limited: 30 req/min) ────────────
app.use('/api/dashboard', requireSuperAdmin, apiLimiter, dashboardRoutes);
app.use('/api/wallets', requireSuperAdmin, apiLimiter, walletRoutes);
app.use('/api/transactions', requireSuperAdmin, apiLimiter, transactionRoutes);
app.use('/api/payments', requireSuperAdmin, apiLimiter, paymentRoutes);
app.use('/api/press', requireSuperAdmin, apiLimiter, pressRoutes);
app.use('/api/payroll', requireSuperAdmin, apiLimiter, payrollRoutes);
app.use('/api/partnerships', requireSuperAdmin, apiLimiter, partnershipRoutes);
app.use('/api/airdrops', requireSuperAdmin, apiLimiter, airdropRoutes);
app.use('/api/notifications', requireSuperAdmin, apiLimiter, notificationRoutes);

// ─── 404 / Error Handling ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[CFIS ERROR]', err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An internal error occurred' } });
});

// ─── AI Policy Agent dashboard route ─────────────────────────────────
app.get('/api/ai-policy/analyses', requireSuperAdmin, apiLimiter, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 24, 100);
    const analyses = await aiPolicyAgentService.getLatestAnalyses(limit);
    res.json({ success: true, data: analyses });
  } catch (e: any) {
    res.status(500).json({ error: { code: 'ANALYSIS_FETCH_ERROR', message: e.message } });
  }
});

app.post('/api/ai-policy/run', requireSuperAdmin, apiLimiter, async (_req, res) => {
  try {
    const result = await aiPolicyAgentService.runHourlyAnalysis();
    res.json({ success: true, data: result });
  } catch (e: any) {
    res.status(500).json({ error: { code: 'ANALYSIS_RUN_ERROR', message: e.message } });
  }
});

// ─── AI Policy Agent scheduled task (hourly, opt-in) ─────────────────
if (process.env.ENABLE_AI_POLICY_AGENT === 'true') {
  const AI_POLICY_INTERVAL_MS = parseInt(process.env.AI_POLICY_INTERVAL_MS || '3600000', 10);
  console.log(`[AIPolicyAgent] Enabled — running every ${AI_POLICY_INTERVAL_MS / 1000}s`);

  aiPolicyAgentService.runHourlyAnalysis().catch(err =>
    console.error('[AIPolicyAgent] Initial run failed:', err.message),
  );

  setInterval(() => {
    aiPolicyAgentService.runHourlyAnalysis().catch(err =>
      console.error('[AIPolicyAgent] Scheduled run failed:', err.message),
    );
  }, AI_POLICY_INTERVAL_MS);
} else {
  console.log('[AIPolicyAgent] Disabled — set ENABLE_AI_POLICY_AGENT=true to enable');
}

// ─── Start Server ────────────────────────────────────────────────────
blockchainListener.start();

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
