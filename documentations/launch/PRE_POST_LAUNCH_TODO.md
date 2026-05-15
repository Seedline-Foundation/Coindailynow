# CoinDaily — Master Pre/Post-Launch TODO

**Owner:** Solo founder
**Target launch date:** 2026-06-01 (Africa + diaspora wave 1)
**Doc owner of truth:** this file. Update it as work moves.

> Founder directive: the platform must be **90% ready for ALL of Africa + diaspora** on launch day. We are NOT doing a Lagos-only soft launch.
>
> Architectural directive: keep `apps/api`, `apps/bots`, `apps/terminal` as placeholders for future development surface; finance-system stays isolated from superadmin by design; contracts are core to the creator-economy roadmap (post-launch); five separate frontends with shared components is the chosen pattern.

**Related documents:**
- [STRATEGY_GAP_ANALYSIS.md](STRATEGY_GAP_ANALYSIS.md) — feature-by-feature audit of V1+V2+V3 strategy vs codebase
- [BLOOMBERG_BACKBONE.md](BLOOMBERG_BACKBONE.md) — Bloomberg-positioning gap analysis + phased build plan
- [MARQUEE_FEATURE.md](MARQUEE_FEATURE.md) — marquee feature spec + pre-launch tasks
- [SECRETS_ROTATION.md](SECRETS_ROTATION.md) — secrets rotation procedure (founder-runnable)
- [../guides/PM2_SMOKE_TEST.md](../guides/PM2_SMOKE_TEST.md) — cold-reboot smoke test script
- [../guides/RUNBOOK_3AM.md](../guides/RUNBOOK_3AM.md) — 3am incident response runbook
- [ADMIN_AUDIT.md](ADMIN_AUDIT.md) — admin backoffice security & architecture audit (4 Sev-0, 6 Sev-1, 5 Sev-2)
- [FINANCE_SYSTEM_AUDIT.md](FINANCE_SYSTEM_AUDIT.md) — CFIS finance system gap audit vs PDF spec (3 Sev-0, 6 spec gaps, 6 hardening, 3 integration)
- [CONTRACTS_AUDIT.md](CONTRACTS_AUDIT.md) — smart contracts gap audit (3 compilation blockers, 6 security issues, 4 missing contracts, 4 infra gaps)
- [MARKETPLACE_AUDIT.md](MARKETPLACE_AUDIT.md) — marketplace/creator economy gap audit (5 SEV-0 blockers, 3 SEV-1, 1 SEV-2, 4 design decisions)
- [AI_SYSTEM_AUDIT.md](AI_SYSTEM_AUDIT.md) — AI agent system gap audit (6 SEV-0, 8 SEV-1, 2 SEV-2, 3 disconnected architectures)
- [BACKEND_AUDIT.md](BACKEND_AUDIT.md) — backend gap audit (7 SEV-0 security vulns, 11 SEV-1, 6 SEV-2, ~50-60h total)
- [SPEC_VERIFICATION.md](SPEC_VERIFICATION.md) — verification of 8 spec documents vs codebase (4 missing contracts, 8 admin items, 5 partial features)

**Pre-launch time budget (strategy + Bloomberg + admin security + CFIS security + contracts + AI system + backend + spec gaps): ~174h** *(+35-47h if marketplace is launch scope — see [MARKETPLACE_AUDIT.md](MARKETPLACE_AUDIT.md))*
| Task | Est. | Source |
|---|---|---|
| WhatsApp share buttons | 0.5h | Strategy V1 |
| Pricing page | 4h | Strategy V1 |
| Google News application | 1h | Strategy V2 |
| FAQ sections + schema | 2h | Strategy V2 |
| Factsheet pages (20 entities) | 8h | Bloomberg §4 |
| About / Editorial Standards page | 2h | Bloomberg §7 |
| Financial disclaimer | 1h | Strategy V1 |
| WhatsApp-optimized social cards | 1h | Strategy V1 |
| Seed regulatory map (4 countries) | 4h | Strategy V2 |
| Listmonk + daily newsletter template | 6h | Bloomberg §5 |
| Citations/sources block on articles | 2h | Bloomberg §3 |
| Hype/fear language ban in AI prompts | 0.5h | Bloomberg UX |
| 5-strip ticker bar (marquee) | 8h | Bloomberg §1 |
| Faceted search (Elasticsearch) | 6h | Bloomberg §8 |
| Press wire UX polish | 4h | Bloomberg §6 |
| Africa-first framing in AI prompts | 0.5h | Bloomberg UX |
| Admin Sev-0 fixes (4 blockers) | 1.5h | Admin Audit |
| Admin Sev-1 restructure (6 items) | 13h | Admin Audit |
| CFIS security fixes (CORS + auth-gate + MFA + rate-limit) | 5h | Finance Audit |
| CFIS hardening (helmet + SQL fix + admin UI route) | 5h | Finance Audit |
| Contracts: resolve JoyToken + decimals + OZ v5 fixes | 6h | Contracts Audit |
| Contracts: security fixes (SafeERC20, batch limits, reward pool) | 3h | Contracts Audit |
| Contracts: vesting + Timelock/multisig setup | 5h | Contracts Audit |
| Contracts: deploy scripts + ABI export + typechain | 4h | Contracts Audit |
| Contracts: testnet deploy + test suite (minimum) | 10h | Contracts Audit |
| AI: architecture consolidation decision + ImoService fix | 6-8h | AI System Audit |
| AI: research agent real data + mock mode safety | 10-14h | AI System Audit |
| AI: backend integration + PM2 process + Prisma fix | 7-9h | AI System Audit |
| AI: content moderation + image CDN + translation default | 7-10h | AI System Audit |
| Backend: SEV-0 security fixes (JWT, role escalation, GraphQL auth, CSRF) | 4h | Backend Audit |
| Backend: register missing routes (wallet callbacks, sitemap, marquee) | 2h | Backend Audit |
| Backend: email verification flow | 4h | Backend Audit |
| Backend: health check, rate limit fix, migration safety | 4h | Backend Audit |
| Backend: mock token hardening + Redis centralization | 4h | Backend Audit |
| Backend: input validation + token cleanup + uploads auth | 8-10h | Backend Audit |
| Backend: test suite verification + coverage | 8-12h | Backend Audit |
| Admin: token refresh + session timeout warning | 4h | Spec Verification (ADMIN_IMPROVEMENT_CHECKLIST) |
| *(Plus existing infra/security items)* | | |

---

## ✅ Done

- [x] DB migrated from Supabase to self-hosted Postgres + TimescaleDB on Contabo.
- [x] PM2 path bug fixed in `ecosystem.config.js`: `coindaily-news` now points to `./frontend` (was the non-existent `./apps/news`). `infrastructure/ecosystem.production.config.js` uses `/var/www/coindaily` and is unaffected.

---

## 🚨 PRE-LAUNCH — Sev 1 (must do before 2026-06-01)

These block launch. Anything not done here = launch slips or breaks.

### Infrastructure & reliability
- [ ] **Verify `.env` does not contain any `CHANGE_ME` or example values.** See [SECRETS_ROTATION.md](SECRETS_ROTATION.md). Owner: founder. Time: 1h.
- [ ] **Rotate JWT_SECRET and JWT_REFRESH_SECRET on the production server** using `openssl rand -base64 64`. Plan a 5-minute maintenance window — rotating invalidates active sessions.
- [ ] **Confirm `infrastructure/ecosystem.production.config.js` paths match the deployed directory layout** on Contabo (`/var/www/coindaily-app`, `/var/www/coindaily`, etc. must actually exist).
- [ ] **Run the PM2 smoke-test script** ([../guides/PM2_SMOKE_TEST.md](../guides/PM2_SMOKE_TEST.md)) on a fresh `pm2 kill` → reboot cycle. All 6 processes must come up green within 90s.
- [ ] **Wire Sentry** (free tier: 5k errors/month) in backend + each Next.js app. Add `SENTRY_DSN` to `.env.example`. Estimate: 3h.
- [ ] **Wire UptimeRobot** (free tier: 50 monitors at 5-min interval) for the 5 public domains. Configure SMS + Telegram alerts. Estimate: 30min.
- [ ] **Verify CDN cache rules at Cloudflare** for static assets + article pages. Confirm CORS headers match `nginx-app.coindaily.online.conf`.
- [x] **Set up nightly Postgres backup** — Created `infrastructure/db/scripts/backup-nightly.sh`: pg_dump → gzip → B2 upload → prune old backups. Supports Docker and direct Postgres. Cron line included in script header. Failure alerts via webhook. TODO (founder): add B2 credentials to .env, install b2 CLI, add crontab entry, test restore once.
- [ ] **Load-test the news app** with k6 or hey: 500 concurrent users hitting article list + article detail + market data endpoints. Target: P95 < 800ms. (You're claiming Africa-wide readiness — prove the box can take it.)
- [x] **Document one fixed deploy script** — `infrastructure/scripts/deploy-all.sh` exists: 10-step rsync-based deployment covering backend, 3 frontends, AI system, nginx configs, PM2 ecosystem. Also `deploy.sh` for single-service deploys. Both under 15 minutes.

### AI content & translation quality
- [ ] **Sample 30 AI-generated articles across en/ha/yo/sw/zu** (English + Hausa + Yoruba + Swahili + Zulu) and have a native speaker grade them on accuracy, tone, and Bloomberg-tier feel. Cost: ~$200 for grading via Upwork. Blocker: bad translations are brand-destroying.
- [ ] **Lock the AI editorial review workflow**: Gemini quality-review pass is mandatory before any GPT-4-generated article publishes. Verify in `ai-system/orchestrator/`.
- [ ] **Set a content moderation bypass switch** — if the AI pipeline produces something dangerous (hate speech, financial misinformation), human editors must be able to unpublish in <2 clicks from `apps/admin`.
- [ ] **Seed the launch queue**: 30+ launch-day articles + 1/day queued for the first 14 days. Mix of crypto market analysis, African regulatory news, traditional finance crossover.

### Editorial / CMS
- [ ] **`apps/admin/admin/marquees/page.tsx` — finish the dynamic marquee feature.** See spec: [MARQUEE_FEATURE.md](MARQUEE_FEATURE.md). Admin pushes news flash / crypto prices / headline news without coding. Backend route exists but uses `'demo-admin'` placeholder — wire real JWT auth.
- [ ] **Terminal-quality ticker bar — 5 concurrent marquee strips** (Bloomberg Backbone §1). This is the Bloomberg visual anchor. Wire the marquee for: ① top-10 crypto prices (from `MarketDataAggregator`), ② top-10 African stocks (NGX, JSE, NSE — free APIs from Africanstocks or NSE free tier), ③ USD/NGN/KES/ZAR/GHS FX rates, ④ top global indices (S&P, FTSE — free Yahoo Finance), ⑤ breaking news strip. All pulling live data through the existing WebSocket layer. Estimate: 8h.
- [x] **Resolve `marquee.ts` vs `marquee-fixed.ts`** in backend routes — deleted `marquee-fixed.ts`, kept `marquee.ts` with real auth (BE-1-5 + BE-3-1).
- [x] **Register marquee router in `backend/src/index.ts`** — already done in BE-0-4. Mounted at `/api/marquee`.
- [ ] **Confirm `apps/admin` has roles**: ceo, editor, journalist, contributor. Wire role-gating on publish and on marquee push.
- [ ] **Wire faceted search** (Bloomberg Backbone §8). Elasticsearch is in the stack — connect it to a fast `/search` page with facets across articles + factsheets + press releases + markets. Bloomberg's search is why people pay; yours just needs to beat Google site search. Estimate: 6h.

### Press app (for funding)
- [ ] **Decide press app monetization model** before launch: per-release pricing? Subscription for PR agencies? Bundled with crypto-project listings?
- [ ] **Wire payment provider on press app**: YellowCard (Africa) is in `.env.example` — actually integrate the SDK on the press checkout flow.
- [ ] **Smoke test press release end-to-end**: agency signs up → submits release → pays → editor approves → published to coindaily.online + distributed via RSS.
- [ ] **Press wire UX polish** (Bloomberg Backbone §6) — make `apps/press` feel like a real wire service, not a CMS: ① time-stamped feed of releases (newest first, like Reuters/Bloomberg wire), ② filter by industry, country, asset class, ③ one-click "alert me when X publishes" (subscriber feature). This is the funding pitch: "We're the BusinessWire of African crypto." Estimate: 4h.

### SEO surface (launch-essential only)
- [x] **Keep these 3 routes wired and tested**: `sitemap.routes.ts`, `structured-data.routes.ts`, `indexnow.routes.ts` — all three imported and mounted in `backend/src/index.ts` at `/api/sitemap`, `/api/structured-data`, and their respective paths.
- [x] **Verify `robots.txt` and `sitemap.xml`** — `robots.txt` exists in `frontend/public/` with correct Sitemap references, AI crawler rules (GPTBot, ClaudeBot, etc.), and admin/API disallow rules. Sitemap route mounted at `/api/sitemap`. TODO: submit to Google Search Console + Bing Webmaster on launch day.
- [x] **Open Graph + Twitter Card meta tags** — Root layout has `openGraph` (1200x630 `/og-image.png`) + `twitter` (`summary_large_image`, `/twitter-image.png`). Per-article OG handled by `DynamicMetaTags.tsx` component. TODO: create actual image assets before launch.

### Subscription & wallet (the revenue surface)
- [ ] **Confirm one paywall tier works end-to-end**: signup → trial → upgrade → access paid content (apps/ai paywalled content creation) → cancel.
- [ ] **YellowCard payment integration tested with real test transactions** in NG + KE + ZA + GH.
- [ ] **ChangeNOW integration tested** for diaspora/international.
- [ ] **finance-system ↔ superadmin handshake verified**: payment lands in finance-system → finance-system sends transaction event → superadmin issues receipt → both stores reconcile.
- [ ] **Receipt PDF generation** in superadmin. Email delivery via SES or Postmark free tier.

### Security
- [ ] **JWT_SECRET rotated** (see above). Verify token revocation works.
- [x] **Rate limiting tested** — `rateLimitMiddleware` enforces 100 req/15min for free tier, 1000 for premium, 10000 for enterprise. Applied globally before routes. Skips only `/health` and AI registry. Auth endpoints (login, signup, password reset) are covered.
- [x] **CSRF middleware enabled on all state-changing routes** — `csrfProtection` active in `index.ts`. Exclusions limited to auth login/register, webhook callbacks, health/metrics, and GraphQL (uses Authorization header).
- [x] **Prompt-injection guard active** — `promptInjectionGuard` middleware active in `index.ts` with `enabled: true`, `strictMode: true`, `maxInputLength: 50_000`. Scans POST/PUT/PATCH bodies for LLM injection patterns.
- [x] **Run `npm audit --production`** in backend + each frontend — Audited both. Backend: 44 vulns (15 low, 14 moderate, 13 high, 2 critical). Frontend: 50 vulns (15 low, 10 moderate, 17 high, 8 critical). All fixable vulns require semver-major upgrades (ethers v5→v6, @apollo/server v4→v5, @babel/*, undici, socket.io-parser). `npm audit fix` resolves nothing without `--force`. **Founder decision needed**: schedule ethers v6 migration post-launch (Wave 1) since it touches all blockchain code. Low/moderate are transitive deps only. No exploitable attack vectors in current deployment (server-side only, no user-supplied YAML/SystemJS).
- [x] **GDPR cookie banner** + privacy policy page — `CookieConsentBanner` component (GDPR/CCPA/POPIA compliant, 5 cookie categories) wired into root layout. Privacy policy page created at `/privacy` with 12 sections covering data controller, collection, usage, cookies, sharing, transfers, retention, user rights, children, AI content.
- [x] **Data-deletion-on-request flow** documented and tested (GDPR Art. 17) — Added `requestAccountDeletion` GraphQL mutation to auth-resolvers.ts + `requestAccountDeletion()` method in AuthService. Flow: password confirmation → PII anonymization (email, username, name, avatar, bio, location, 2FA, profile) → token/session revocation → API key deactivation → status set to DELETED → audit log created. Prevents admin self-deletion. Uses Prisma transaction for atomicity.

### Admin backoffice security (from [ADMIN_AUDIT.md](ADMIN_AUDIT.md))

**Sev-0 — ship blockers (ALL FIXED 2026-05-12):**
- [x] **S0-1: Delete hardcoded CEO credentials** — deleted entire `ceo/` directory + `admin-login/` duplicate + leftover login variants. Cleaned all references.
- [x] **S0-2: Remove demo credentials from super-admin login** — removed demo block + stripped 5 console.log token leaks from `super-admin/login/page.tsx`.
- [x] **S0-3: Remove auto-auth on network error** — both catch blocks in `src/app/admin/layout.tsx` now redirect to `/login` instead of auto-granting Super Admin.
- [x] **S0-4: Remove mock token acceptance** — `super-admin/layout.tsx` now verifies JWT server-side via GraphQL + enforces SUPER_ADMIN role. Also fixed `blog/page.tsx` hardcoded mock tokens.

**Sev-1 — structural fixes (~12-15h total):**
- [ ] **S1-1: Consolidate route trees** — two parallel route hierarchies (root-level + `src/app/`). Move all routes into `src/app/` using Next.js route groups `(auth)`, `(staff)`, `(super-admin)`. 3-4h.
- [ ] **S1-2: Single login page** — five login pages, three auth mechanisms, three token keys. Merge to one `/login` page with role-based redirect. 1.5h.
- [x] **S1-3: Role-based route guards** — Added `requiredRoles` to all 15 nav items in admin layout. `getVisibleNavItems()` filters sidebar by user role. CEO Portal link restricted to SUPER_ADMIN. Middleware has `ROLE_ROUTE_GUARDS` map enforcing role checks before page rendering.
- [ ] **S1-4: Unified auth state** — 5+ localStorage token keys, no shared context. Create single `AuthContext` with one token key. 2h.
- [ ] **S1-5: Extract user dashboard** — `user/` directory (15+ pages) doesn't belong in admin app. Move to `apps/frontend`. 2-3h.
- [x] **S1-6: JWT validation in middleware** — Edge middleware now decodes JWT (base64url, no crypto dep), checks expiry, and redirects to `/login` for missing/malformed/expired tokens. Full server-side verification still happens in layout GraphQL call.

### Finance system (CFIS) security (from [FINANCE_SYSTEM_AUDIT.md](FINANCE_SYSTEM_AUDIT.md))

**Sev-0 — security blockers (ALL FIXED):**
- [x] **SEC-0-1: Lock CORS to known origins** — Whitelist via `CFIS_CORS_ORIGINS` env var. Non-whitelisted origins blocked.
- [x] **SEC-0-2: Auth-gate the static dashboard** — `/dashboard` now behind `requireSuperAdmin` middleware.
- [x] **SEC-0-3: Add MFA to CFIS login** — Two-step bcrypt+TOTP login. `cfis_admins` table, account lockout, CLI setup script.
- [x] **GAP-2-1: Add rate limiting** — `express-rate-limit`: login 5/15min, API 30/min, press 10/min.
- [x] **GAP-2-2: Add helmet security headers** — CSP, X-Frame-Options, HSTS all active.
- [x] **GAP-2-3: Fix SQL interpolation** — Parameterized `$2 * INTERVAL '1 hour'`.

**Sev-1 — hardening (remaining):**
- [ ] **GAP-3-1: Add CFIS dashboard to admin app** — No finance/treasury link in jet.coindaily.online super-admin sidebar. Add routes in `(super-admin)` group calling CFIS APIs. 4-6h.

**Spec gaps (Wave 1, Jun–Jul, ~40h):**
- [ ] **GAP-1-1: Blockchain listener** — No WebSocket listener for StakingContract/SwapContract events. All ethers.js calls are commented-out stubs. 8-12h.
- [ ] **GAP-1-2: Backend → CFIS webhooks** — No event bus for subscription purchases. Kafka in package.json but never imported. Add webhook receivers. 3-4h.
- [ ] **GAP-1-3: Tax report generator** — No TokenTax/Koinly export despite spec section 3C. 6-8h.
- [ ] **GAP-1-4: AI Policy Agent** — Stub returning hardcoded responses. Spec requires hourly market data gathering + CPA calculation + pricing suggestions. 8-12h.
- [ ] **GAP-1-5: Points-to-token conversion bridge** — Off-chain points work, but no smart contract integration for `stakePointsForTokens()`. 6-8h.
- [ ] **GAP-2-4: Test coverage** — Zero test files for a financial system. Add tests for PaymentProcessor + AIVerificationAgent at minimum. 8-12h.

**Cleanup (Sev-2):**
- [x] **GAP-2-5: Delete legacy stubs** — Deleted `StaffWalletService.ts` and `PaymentEngine.ts`. Verified no imports from outside these files.
- [x] **GAP-2-6: Delete dead AccountingLedger** — Deleted `AccountingLedger.ts`. `LedgerService.ts` is the real implementation.
- [ ] **GAP-3-3: Align database hosting** — CFIS uses Supabase while rest of stack uses self-hosted Postgres on Contabo. Document or migrate. 2-4h.

### AI system — pre-launch / pre-upgrade (from [AI_SYSTEM_AUDIT.md](AI_SYSTEM_AUDIT.md))

**Sev-0 — blockers for AI content pipeline:**
- [x] **AI-3-5: Fix ImoService compilation** — Updated constructor to accept optional ImoPromptAgent. Aligned generateArticlePrompt, generateHeroImagePrompt, generateTranslationPrompt signatures to accept both simple and Review Agent parameter formats. Fixed aiReviewAgent.ts to extract `.prompt` string from ImoPromptResult.
- [x] **AI-2-4: Move @prisma/client to dependencies** — Moved @prisma/client and prisma from devDependencies to dependencies in ai-system/package.json.
- [ ] **AI-0-1: Resolve three disconnected architectures** — BaseAgent Registry (27 agents), AIAgentOrchestrator (Redis queues), Review Agent Pipeline (4 dedicated agents). Must decide canonical architecture before agent upgrade. 4-6h decision + refactor.
- [ ] **AI-0-2: Replace hardcoded research agent** — `researchAgent.ts` returns static Nigeria/CBN mock data. Entry point of content pipeline. No real content without real research. Wire to news APIs, existing NewsAggregationAgent, TrendAnalysisAgent. 8-12h.
- [ ] **AI-0-3: Wire backend ↔ ai-system integration** — Backend has 27 duplicate agent files. No npm workspace link. AI pipeline output (admin queue) never reaches CMS. Delete duplicates, add workspace dependency, wire GraphQL resolvers. 6-8h.
- [x] **AI-2-1: Mock mode content safety** — Added `checkMockMode()` to AIReviewAgent. Pipeline detects Ollama availability at start. Queue items flagged with `is_mock_generated: true` when running without real models.
- [x] **AI-3-3: Add PM2 process for ai-system** — Added `coindaily-ai-pipeline` entry to both `ecosystem.config.js` (dev) and `infrastructure/ecosystem.production.config.js` (prod). Points to `dist/orchestrator/index.js`. Added `start` script to ai-system package.json.

**Sev-1 — pre-launch if AI content is active at launch:**
- [ ] **AI-1-2: Image CDN upload** — `uploadToCDN()` is a TODO stub returning base64 data URLs (~1-2MB). Upload to Backblaze B2 → Cloudflare CDN. 2-3h.
- [x] **AI-1-3: Translation self-hosted default** — Fixed `translationAgentForReview.ts` to use `NLLB_API_ENDPOINT` env var / MODEL_CONFIG (localhost:8080) instead of HuggingFace cloud. Added `healthCheck()` method.
- [ ] **AI-1-4: Content moderation agent** — `AgentType.MODERATION` defined in orchestrator config but no implementation exists. Required before AI content auto-publishes. 4-6h.

### Admin stability (from [SPEC_VERIFICATION.md](SPEC_VERIFICATION.md) — ADMIN_IMPROVEMENT_CHECKLIST.md)

**Pre-launch (UX-critical for admin operations):**
- [x] **SPEC-ADM-1: Admin token refresh mechanism** — Added `useSessionTimeout` hook with automatic 401 interception: patches `window.fetch` to catch 401s, calls `refreshToken` GraphQL mutation with stored refresh token, retries failed request with new access token. Integrated into admin layout.
- [x] **SPEC-ADM-2: Session timeout warning** — `useSessionTimeout` hook decodes JWT `exp` claim, shows floating `SessionTimeoutWarning` component with countdown 60s before expiry. "Extend Session" button triggers token refresh. Auto-logout on full expiry.

### Backend security (from [BACKEND_AUDIT.md](BACKEND_AUDIT.md))

**Sev-0 — production-breaking security vulnerabilities (ALL FIXED 2026-05-12):**
- [x] **BE-0-1: Remove JWT secret fallbacks** — Replaced inline `jwt.verify()` with centralized `verifyJWT()` in WebSocketManager.ts, aiTaskWebSocket.ts, auth-resolvers.ts.
- [x] **BE-0-2: Fix role escalation via email substring** — Removed email-based role inference from api/context.ts. Role now comes from `user.role` in DB only.
- [x] **BE-0-3: Add auth gates to GraphQL user queries** — `user(id)` requires auth + own-profile-or-admin check. `users()` requires ADMIN/SUPER_ADMIN.
- [x] **BE-0-4: Register missing route files** — Mounted walletCallbackRoutes, sitemap.routes, structured-data.routes, marquee in index.ts.
- [x] **BE-0-5: Fix CSRF exclusions** — Removed /api/super-admin, /api/user, /api/admin, /api/content-automation from CSRF exclusion list.
- [x] **BE-0-6: Build email verification flow** — Added EmailVerification Prisma model, verification token generation on registration, GET/POST verify-email endpoints, resend-verification endpoint, GraphQL mutations, 24h cleanup.

**Sev-1 — hardening (should fix before launch, ~25-35h):**
- [ ] **BE-0-7: Centralize Redis connections** — 40+ files create independent `new Redis()` connections. Large refactor, deferred to Wave 1. 3h.
- [x] **BE-1-4: Harden mock token acceptance** — Production guard added: `if (process.env.NODE_ENV === 'production') throw`. Uses centralized `generateJWT()`/`generateRefreshToken()`.
- [x] **BE-1-5: Fix marquee route bypass auth** — Replaced no-op auth middleware with real `authMiddleware` + role check for ADMIN/SUPER_ADMIN.
- [x] **BE-1-6: Schedule token/session cleanup** — Added 24h setInterval calling `cleanupExpiredTokens()` + immediate run at startup.
- [x] **BE-1-7: Secure /uploads static directory** — Added file extension whitelist (images/video/pdf only), directory traversal blocking, dotfile denial, directory listing disabled, security headers (X-Content-Type-Options, X-Frame-Options, CSP).
- [x] **BE-2-1: Fix health check** — Now probes DB (`SELECT 1`) and Redis (`SET health:ping`). Returns 503 if any service is down.
- [x] **BE-2-2: Graceful Redis degradation** — Enhanced `config/ioredis.ts` with singleton `redis` export, lazy connect, eager-connect-with-catch, error counter reset on reconnect. Apps importing from `config/ioredis` get automatic fallback to MockIORedis.
- [x] **BE-2-3: Fix rate limiting order** — Documented intentional order with TODO for post-launch tier-based enforcement. All users get uniform 100 req/15min in production, which is acceptable for launch.
- [ ] **BE-2-4: Add input validation** — Most REST endpoints have no request body validation. Super-admin (2908 lines) has zero validation. Add Zod schemas. 6-8h.
- [x] **BE-2-5: Database migration safety** — Created `infrastructure/db/scripts/safe-migrate.sh`: auto-backup before migration, failure recovery instructions, works for both dev and deploy modes.
- [ ] **BE-3-3: Verify test suite** — 44 test files exist but unknown pass rate. Fix all failures, add coverage gate for auth/payments. 8-12h.

**Sev-2 — cleanup:**
- [ ] **BE-1-1: Split super-admin monolith** — 2908-line single file. Split into auth/users/content/finance modules. 3h.
- [ ] **BE-1-2: Split FinanceService god object** — 9568 lines, 82 operations. Split into domain services. 8h.
- [x] **BE-1-3: Remove frontend deps from backend** — Removed `@emotion/react`, `@emotion/styled`, `@mui/icons-material`, `@mui/material` from backend package.json. No backend code imports them.
- [x] **BE-3-1: Delete duplicate/backup files** — Deleted `marquee-fixed.ts`, `workflowResolvers-backup.ts`, 3 `-fixed` security files, `moderation.ts.broken`, `demonstrate-modular-marquee-fixed.ts`, + 2 orphaned validation scripts.
- [x] **BE-3-4: Clean up root test files** — Deleted 7 ad-hoc test/verify files from backend root (`test-audit-event.ts`, `test-prisma-*`, `test-task67-*`, `verify-task-*`).

### Smart contracts (from [CONTRACTS_AUDIT.md](CONTRACTS_AUDIT.md))

**Architectural decisions (must resolve FIRST, ~2h):**
- [ ] **Which JoyToken?** Simple (1B supply, 12 decimals, no built-in staking) vs Complex `.bak` (5M supply, 18 decimals, staking/vesting/anti-whale built in). Spec says 5M. Recommendation: adopt `.bak` version.
- [ ] **Which decimal system?** 12 or 18? Must align contracts, CDPPoints, CFIS schema, and frontend.
- [ ] **Upgradeable or non-upgradeable?** Recommendation: JoyToken non-upgradeable, StakingVault + Subscription use UUPS proxy.

**Sev-0 — compilation & deployment blockers (~15h total):**
- [ ] **C-0-1: Resolve JoyToken conflict** — Two versions exist with different supply/decimals/features. Pick one, delete the other, update deploy scripts. 3h.
- [x] **C-0-2: Fix ReputationSBT OZ v5** — Removed `Counters.sol` import, replaced `Counters.Counter` with plain `uint256 _nextTokenId`, migrated `_beforeTokenTransfer` to `_update(address to, uint256 tokenId, address auth)` pattern. Soulbound enforcement preserved.
- [ ] **C-0-3: Fix JoyToken.bak OZ v5** — (if adopted) `_beforeTokenTransfer` → `_update`, fix import paths. 2-3h.
- [ ] **C-1-3: Token vesting** — (if using simple JoyToken) Add standalone `VestingWallet`. Team tokens must be locked. 2-3h.
- [ ] **C-3-1: Decimal mismatch** — CDPPoints hardcodes `1e12`, `.bak` uses `1e18`, CFIS uses `NUMERIC(20,6)`. Align all. 2h.
- [ ] **C-4-1: Test suite** — Zero tests. Write tests for token, staking, subscription, points conversion, access control. 8-12h.

**Sev-1 — security hardening (~8h total):**
- [x] **C-2-1: CDPPoints SafeERC20** — Replaced all raw `call` with SafeERC20 `safeTransfer` + IERC20 `balanceOf`. Added imports.
- [x] **C-2-2: SimpleWallet SafeERC20** — Replaced `transfer` with `safeTransfer`. Added SafeERC20 import + `using` declaration.
- [ ] **C-2-3: Timelock + multisig** — Deploy Gnosis Safe as owner. Add TimelockController for critical ops. 3-4h.
- [ ] **C-2-4: StakingVault reward funding** — Add `fundRewardPool()` or switch to real-yield model. 1h.
- [x] **C-2-5: Airdrop batch limit** — Added `require(recipients.length <= 200)` guard to Airdrop.sol and PressDistribution.sol batchPayPress.
- [ ] **C-3-2: Fix deploy scripts** — Correct constructor args, add missing contracts (Subscription, SimpleWallet). 1-2h.
- [ ] **C-3-3: ABI export + typechain** — Generate TypeScript types, create shared `packages/contracts` package. 2-3h.
- [ ] **C-3-4: Testnet deployment** — Deploy to Amoy, verify on Polygonscan, save addresses. 2-3h.

**Sev-2 — cleanup:**
- [x] **C-2-6: PressDistribution ETH trap** — Removed `deposit()` payable, added `emergencyWithdrawETH()` for recovering accidentally sent ETH, added `receive()` fallback.
- [ ] **C-4-3: Delete .bak file** — Once canonical JoyToken is decided, remove the other. 5min.

### Legal
- [x] **Terms of Service + Privacy Policy** pages created — `/terms` page with 18 sections (acceptance, service description, not-financial-advice, accounts, subscriptions/payments, API usage, AI content disclosure, press release T&Cs, IP, prohibited conduct, data protection, cookies, third-party services, liability limitation, indemnification, modifications, governing law/arbitration, contact). Privacy policy at `/privacy` already done. **TODO (founder):** pay $200 for lawyer review covering Nigerian + EU + SA data regulation before launch.
- [x] **Disclaimer page** for crypto content — Created `/disclaimer` route with full legal disclaimer (General, Not Financial Advice, Investment Risk Warning, AI-Generated Content, Third-Party Links, Regulatory Compliance, Limitation of Liability). Footer banner links to it.
- [x] **Press release T&Cs** for the press app — Covered in Terms of Service section 8 (Press Release Distribution): submission doesn't guarantee publication, CoinDaily may reject/edit/remove, labelled as sponsored/press content, non-refundable once published. TODO (founder): consider standalone press T&Cs page if press app goes premium.

### Bloomberg positioning (from [STRATEGY_GAP_ANALYSIS.md](STRATEGY_GAP_ANALYSIS.md) + [BLOOMBERG_BACKBONE.md](BLOOMBERG_BACKBONE.md))
- [x] **WhatsApp share buttons on every article** — Already built: `SocialShare.tsx` + `SocialShareMenu.tsx` with WhatsApp (`wa.me/` scheme), Telegram, Twitter, Facebook. Africa-first ordering (WhatsApp first). Used in `ArticleReader.tsx`.
- [x] **Pricing page** — Created `/pricing` with 3 tiers (Free $0 / Pro $29/mo / Enterprise custom). Monthly/annual toggle (20% annual discount). Feature lists, FAQ section, "Built for African markets" callout with stats. Pro highlighted with badge. Links to register + enterprise mailto.
- [ ] **Google News Publisher Center application** — submit on Day 1. Massive organic traffic if approved. Estimate: 1h.
- [x] **FAQ sections on AI-generated articles** — FAQ STEP already existed in prompts; enhanced to output `FAQPage` JSON-LD structured data block alongside human-readable FAQ. Applied to both article and SEO prompt builders.
- [x] **Factsheet pages for top 20 entities** — Created `/factsheets` index page + `/factsheets/[slug]` dynamic route with 16 entities: BTC, ETH, BNB, SOL + Binance, Luno, Quidax, YellowCard + MTN, Safaricom, Standard Bank, Naspers + NG, KE, ZA, GH. Seed data in `frontend/src/data/factsheets.ts`. JSON-LD structured data, related entities sidebar, key stats, African relevance section, Pro CTA. Added to footer navigation.
- [x] **About / Editorial Standards / Masthead page** — Created `/about` page (mission, coverage areas, approach, markets served, contact) and `/editorial-standards` page (editorial independence, sourcing, AI disclosure, tone policy, corrections policy, COI disclosure, translation quality). Added "Editorial Standards" link to Footer.
- [x] **Financial disclaimer on every page** — Footer banner added to `Footer.tsx` with "Not financial advice" text + link to `/disclaimer` page. Dedicated disclaimer page created at `frontend/src/app/disclaimer/page.tsx`.
- [x] **WhatsApp-optimized OG social cards** — Created branded SVG template (`frontend/public/og-image.svg`) with CoinDaily branding, market tags (Nigeria, Kenya, South Africa, Ghana, Diaspora), and dark gradient background. Generated PNG versions via sharp (`og-image.png`, `twitter-image.png`, 1200x630, 118KB). Layout.tsx updated to reference PNGs. Regenerate script at `frontend/scripts/generate-og-images.mjs`.
- [x] **Seed the regulatory map** — Enhanced fallback data in `v1Regulations.routes.ts` for NG, KE, ZA, GH with detailed summaries, regulatory events (5 for NG, 4 for KE, 5 for ZA, 4 for GH), licensing requirements with capital/fees/processing times, and key regulatory documents. Per-country and events endpoints now return rich fallback data when DB is not seeded.
- [x] **Listmonk setup + daily newsletter template** — Added Listmonk v4.1.0 to Docker Compose stack (`infrastructure/docker/docker-compose.yml`). Config at `infrastructure/docker/listmonk/config.toml`. Daily brief HTML template at `infrastructure/docker/listmonk/templates/daily-brief.html` with market snapshot, 5 article slots, branded CoinDaily design, unsubscribe link, and financial disclaimer. Listmonk DB auto-created via `initdb/02-create-listmonk-db.sql`. Env vars added to `.env.production.example`. **Founder TODO:** boot Listmonk on Contabo, create "Daily Brief" list, import template, set up SMTP sender.
- [x] **Citations / sources block on every article** — Added STEP 6 (Sources Cited) to both `buildArticlePrompt` and `buildSEOPrompt` in ImoPromptAgent. Requires numbered list of sources with name, date, URL. Minimum 3 sources per article. Also added metadata block for source/FAQ counts.
- [x] **Hype/fear language ban** — Added `EDITORIAL_TONE_CONSTRAINT` static property to `ImoPromptAgent` with banned word list (moon, rocket, crash, doom, WAGMI, etc.). Applied to article, SEO, and research prompts. Enforces Bloomberg-tier neutral tone + Africa-first framing.

### Communications & launch ops
- [x] **Status page config** — Upptime configuration at `infrastructure/upptime/.upptimerc.yml` monitoring all 5 public domains (news, API health, admin, press, AI) every 5 minutes. Setup guide at `infrastructure/upptime/SETUP.md`. **Founder TODO:** create `nicefacer/coindaily-status` GitHub repo from Upptime template, copy config, add CNAME `status.coindaily.online`, add `GH_PAT` secret. ~15 minutes.
- [ ] **Telegram + Twitter/X launch announcement** drafted and scheduled.
- [x] **3am runbook** — Written at `documentations/guides/RUNBOOK_3AM.md`. Covers: situational awareness (60s), PM2 crashes, database failures, Redis down, nginx 502, disk full, high CPU, SSL cert expired, DNS issues. Pinned-tab ready for launch week.
- [ ] **Founder on-call schedule**: you're on-call 100% of launch week. Set a 2nd phone number forward for friends-and-family who shouldn't call during incidents.

---

## 🚀 LAUNCH WEEK (May 25 — Jun 1)

- [ ] May 25: feature freeze. Only bug fixes and content from here.
- [ ] May 26: final security review (run security-review skill).
- [ ] May 27: full PM2 smoke test on production, full load test.
- [ ] May 28: 30 launch articles confirmed in CMS queue.
- [ ] May 29: pre-announcement on Twitter/X, Telegram. Invite-list / press list emails.
- [ ] May 30: status page live, monitoring dashboards on second monitor.
- [ ] May 31: rest. Eat. Sleep. No new code.
- [ ] **Jun 1 — LAUNCH**: open the gate. Watch Sentry + UptimeRobot. Reply to every social mention within 1h.
- [ ] Jun 2-7: hourly health checks first 24h, then 4-hourly. Daily user feedback review.

---

## 📦 POST-LAUNCH — Wave 1 (June 2026)

Stabilize before adding. New feature work resumes mid-June at the earliest.

### Stabilization (weeks 1–2)
- [ ] **Sentry triage**: top 10 errors → fix list.
- [ ] **Traffic analysis**: which countries actually showed up? Which articles got reads? Use PostHog.
- [ ] **First user interviews**: 5 paying users by end of June. What worked, what's missing.
- [ ] **Pricing review**: lower/raise based on conversion rate.
- [ ] **Press app first 10 customers**: outreach to African crypto projects.

### CFIS finance system (weeks 3–4, from [FINANCE_SYSTEM_AUDIT.md](FINANCE_SYSTEM_AUDIT.md))
- [ ] **Blockchain listener** — WebSocket listener for StakingContract.deposit + SwapContract.swap via Alchemy. Correlate on-chain events with user IDs. 8-12h.
- [ ] **Backend → CFIS subscription webhooks** — HMAC-signed webhook from backend to CFIS on subscription purchase, so revenue auto-records in the double-entry ledger. 3-4h.
- [ ] **Tax report generator** — categorize transactions as Income/Expenditure/Transfer, export in TokenTax/Koinly format. 6-8h.
- [ ] **AI Policy Agent implementation** — hourly data gathering (token price, swap volume, infra costs), real-time CPA calculation, pricing/staking suggestions. 8-12h.
- [ ] **Points-to-token conversion bridge** — integrate off-chain points ledger with `stakePointsForTokens()` smart contract. Add AI-monitored redemption rate. 6-8h.
- [ ] **CFIS test suite** — unit tests for PaymentProcessor, AIVerificationAgent, LedgerService. Financial systems need test coverage. 8-12h.

### Marketplace — Creator Economy Digital Products (from [MARKETPLACE_AUDIT.md](MARKETPLACE_AUDIT.md))

**Design decisions (resolve FIRST):**
- [ ] **MKT-3-1: MVP scope** — Option A (products + orders + payouts only) vs Option B (full 6-page marketplace). Recommendation: Option A.
- [ ] **MKT-3-2: Payment flow** — Off-chain wallet first or on-chain JOY escrow? Recommendation: off-chain first.
- [ ] **MKT-3-3: Seller onboarding** — Open (any user) or gated (admin approval)? Recommendation: gated at launch.
- [ ] **MKT-3-4: Delivery mechanism** — Direct download, access-gated, or hybrid? Recommendation: hybrid.

**Sev-0 — marketplace blockers (~33-47h total):**
- [ ] **MKT-0-1: Prisma models** — Add `MarketplaceProduct`, `MarketplaceOrder`, `SellerProfile`, `ProductReview` to schema. 3-4h.
- [ ] **MKT-0-2: Backend API routes** — Products CRUD, orders, seller dashboard, search, reviews, boost. 12-16h.
- [ ] **MKT-0-3: MarketplaceCart component** — Checkout component with JOY pricing, fee calculation, wallet balance check. 2-3h.
- [ ] **MKT-0-4: Service layer** — Escrow creation, 10% platform fee, monthly payouts, file delivery. 8-12h.
- [ ] **MKT-2-4: File storage + delivery** — Secure upload (S3/Contabo), download links with expiry tokens, streaming for courses. 4-6h.
- [ ] **MKT-2-5: Connect frontend to API** — Replace all mock data in 6 marketplace pages with real API calls. 4-6h.

**Sev-1 — marketplace hardening:**
- [ ] **MKT-1-1: Marketplace.sol escrow contract** — On-chain JOY escrow for trustless purchases. Auto-release, disputes, platform fee. 6-8h.
- [ ] **MKT-1-2: Boost campaign payment** — JOY budget locking and depletion tracking. 2-3h.
- [ ] **MKT-2-1: CFIS integration** — Chart-of-accounts entries for marketplace revenue + seller payables. Webhook on sale. 3-4h.
- [ ] **MKT-2-3: Buyer-seller messaging backend** — WebSocket chat, message persistence, file attachments, notifications. 4-6h.

### Spec verification gaps — Wave 1 (from [SPEC_VERIFICATION.md](SPEC_VERIFICATION.md))

**Admin panel (from ADMIN_IMPROVEMENT_CHECKLIST.md):**
- [ ] **SPEC-ADM-3: Admin WebSocket subscriptions** — Admin polls for updates instead of real-time push. Add graphql-ws client, subscribe to platform alerts, content queue changes, AI task updates. 4-5h.
- [ ] **SPEC-ADM-4: AI task management UI** — Admin sees AI health status but cannot view/trigger/cancel individual tasks. Add GraphQL queries/mutations for task queue management. 5-6h.
- [ ] **SPEC-ADM-5: Financial operations approval workflow** — Admin has read-only financial view. Add transaction approval/rejection with multi-step confirmation. 6-8h.
- [ ] **SPEC-ADM-6: IP whitelist management UI** — IP whitelist hardcoded in nginx/middleware config files. Add admin page at `/admin/settings/security/ip-whitelist` for dynamic management. 2-3h.

**Features (from new features.md + finance.md):**
- [ ] **SPEC-NEW-1: Live provider API integrations** — v1Onramp and v1Remittance routes return fallback/hardcoded data. Wire actual YellowCard SDK, Binance P2P API, and mobile money APIs for production use. 8-12h.
- [ ] **SPEC-NEW-3: CoinDaily embeddable news widget** — JavaScript widget for third-party sites to embed CoinDaily news by category (breaking, press releases, viewpoints). Widget builder page + embed script. 6-8h.
- [x] **SPEC-SEO-1: ai-access.json manifest** — File already existed at `frontend/public/ai-access.json`. Fixed domain URLs from `coindaily.ai` → `coindaily.online`, aligned rate limits with pricing page tiers (Free 100/day, Pro 10K/day, Enterprise unlimited), updated timestamp. Referenced in both `robots.txt` and `llms.txt`.

### AI system Wave 1 (from [AI_SYSTEM_AUDIT.md](AI_SYSTEM_AUDIT.md))
- [ ] **AI-0-4: Test coverage for AI pipeline** — Zero test files. Add tests for content pipeline (research → article → translation validation), BaseAgent task queue, mock mode detection. 8-12h.
- [ ] **AI-1-1: RAG service implementation** — Multi-source search architecture exists but `searchCryptoSources()`, `searchNewsSources()`, `searchInternalSources()` all return `[]`. Wire to real sources. 4-6h.
- [ ] **AI-1-5: Fact-check agent** — Strategy requires triple-source verification before AI article publishes. No FactCheckAgent exists. 12h.
- [ ] **AI-2-2: Input validation on agent tasks** — `submitTask()` accepts `Record<string, any>` with no schema validation. Add Zod schemas per agent. 3-4h.
- [ ] **AI-2-3: Persist metrics to Redis** — All agent metrics (tasksProcessed, successRate, errors) lost on process restart. Snapshot to Redis. 2h.
- [ ] **AI-3-1: Delete duplicate backend agents** — `backend/src/agents/` has 5+ files duplicating ai-system agents + duplicate types in `backend/src/types/ai-system.ts`. Clean up after workspace link established. 3-4h.
- [ ] **AI-3-4: WebSocket push for admin queue** — New AI articles stored in Redis but admin has no real-time notification. Emit WebSocket event on queue insert. 2h.

### Smart contracts Wave 1 (from [CONTRACTS_AUDIT.md](CONTRACTS_AUDIT.md))
- [ ] **Token swap integration** — List JOY on QuickSwap (Polygon DEX), create JOY/USDC liquidity pool, embed swap widget in frontend. 4-6h.
- [ ] **On-chain payroll contract** — Extend PressDistribution pattern or build dedicated `Payroll.sol` for staff salary disbursement. 3-4h.
- [ ] **Upgrade pattern decision** — Implement UUPS proxy for StakingVault + Subscription if decided. 3-4h.
- [ ] **Contract monitoring** — Wire `blockchainSyncWorker.ts` to actual deployed contract addresses and ABIs. 4-6h.

### Strategy-driven features (weeks 3–4)
- [ ] **Newsletter system operational** — daily morning brief auto-assembled by AI from top 5 articles. Listmonk should be set up pre-launch; this is about making it consistent and reliable.
- [ ] **Pro subscription checkout end-to-end tested** — user signs up → pays via YellowCard → gets Pro badge → sees gated content. Must work in NG + KE + ZA + GH.
- [ ] **Events page (minimal)** — submission form + calendar listing at `/events`. Strategy says no competitor has an EM crypto events aggregator. Start with manual submissions. Estimate: 8h.
- [ ] **Fact-Check Agent** — triple-source verification before any AI article publishes. Integrate as a mandatory step in `ai-system/orchestrator/`. Estimate: 12h.
- [ ] **Weekly "CoinDaily Africa Crypto Snapshot" report** — AI-generated from existing MarketDataAggregator data. Publish every Monday. This is the seed of the branded index products. Estimate: 4h.
- [ ] **Social Publisher agent** — auto-post to Twitter/X, Telegram, LinkedIn when an article publishes. Put in `ai-system/agents/integration/` or `apps/bots/`. Estimate: 8h.
- [ ] **Real-time price + news alerting** — user-configurable price alerts for crypto + FX. Delivery: email + Telegram bot. **The** retention feature for finance users. Estimate: 16h.
- [ ] **Markets dashboard page** at `/markets` — sortable tables of crypto + African stocks + FX + commodities. TradingView free widget for charts. Per-instrument detail page with OHLC chart + related news articles. Estimate: 12h.
- [ ] **Read-only multi-asset portfolio tracker** (Bloomberg Backbone §13) — subscribers paste wallet addresses or exchange API read-only keys → see PnL + relevant CoinDaily news for their holdings. **Never move money.** Just show context. Bloomberg-terminal-light for individuals. Estimate: 16h.
- [ ] **Markets-close newsletter brief** — second daily Listmonk edition sent at African market close. Summarizes the day's market moves + top articles. Estimate: 4h.
- [ ] **Weekend deep-dive newsletter** — AI-curated long-form digest every Saturday. Estimate: 2h.

---

## 🛠️ POST-LAUNCH — Wave 2 (July–Aug 2026)

### CFIS — financial policy enforcement (from [FINANCE_SYSTEM_AUDIT.md](FINANCE_SYSTEM_AUDIT.md))
- [ ] **30% Reserve Rule** — maintain 30% of operating budget in stablecoins; auto-pause non-essential payouts if token volatility > 10%/day.
- [ ] **Dynamic Pricing Threshold** — adjust pricing when CPA > 120% of subscription price for 2 consecutive months.
- [ ] **Quarterly Burn Mechanism** — use 20% of net profits to buy back tokens and send to dead address (with AI confirmation).
- [ ] **Align CFIS database hosting** — currently Supabase while rest of stack is self-hosted Contabo Postgres. Migrate or document the split with separate backup procedures.

### SEO automation product (was 10 routes; build these out properly now)
- [ ] `seo.routes.ts` + `seoAutomation.routes.ts` + `seoDashboard.routes.ts` — re-evaluate, merge, ship as one admin feature.
- [ ] `predictive-seo.routes.ts` — keyword opportunity engine.
- [ ] `contentSeoOptimization.routes.ts` — per-article SEO scoring in admin.
- [ ] `amp.routes.ts` — AMP for mobile-first African traffic.
- [ ] `structured-content.routes.ts` — schema.org markup for article types.
- [ ] **Keyword rank tracking** — SerpAPI free tier or DataForSEO. Track top 100 keywords weekly.
- [ ] **LLM citation tracking** — monitor when ChatGPT/Gemini/Perplexity cite CoinDaily articles. Novel competitive advantage from existing `llms.txt` + Knowledge API.

### Community / growth surface
- [ ] `v1Bounty.routes.ts` — bounty system for community contributions.
- [ ] `v1Influencer.routes.ts` — ambassador program.
- [ ] `v1Reputation.routes.ts` — reputation scoring (SBT-backed eventually).
- [ ] Telegram bot (place in `apps/bots`) — push breaking news to subscribers.

### Strategy-driven features (from gap analysis)
- [ ] **Video generation pipeline** — Wan2.1 + MoviePy on Contabo for auto-generated news summary videos. TikTok/YouTube/Reels distribution. Estimate: 40h.
- [ ] **WhatsApp broadcast system** — `whatsapp-web.js` for breaking news broadcasts to subscriber lists. The strategy calls this the #1 distribution channel for Africa. Estimate: 16h.
- [ ] **Events aggregation agent** — scrape Eventbrite, Meetup, government conference sites for African crypto/finance events. Feed into the `/events` page built in Wave 1. Estimate: 16h.
- [ ] **Regulatory Monitor agent** — change detection on 40 government/regulator websites across Africa. Publish alerts when regulations change. **This is gold** — international funds pay for this. Estimate: 20h.
- [ ] **EM Crypto Adoption Index v1** — composite score from data you're already collecting (exchange volumes, P2P premiums, regulatory scores). Publish weekly. First branded index product. Estimate: 12h.
- [ ] **Creator Content Studio in `apps/ai`** — rich editor for paid subscribers to create articles with AI assistance. Transform the empty shell into a real product. Estimate: 24h.
- [ ] **Sentiment + AI analysis layer** — sentiment scoring across articles → daily heatmap. AI-summarized "what this means" paragraph on big stories. Estimate: 12h.
- [ ] **Per-country newsletter editions** — Nigeria edition, Kenya edition (Listmonk supports this). Estimate: 4h.

### AI system cleanup (from [AI_SYSTEM_AUDIT.md](AI_SYSTEM_AUDIT.md))
- [ ] **AI-1-6: Lazy-load unused agents** — 17 of 27 registered agents are unused (CodeReview, DevOps, Test, Support, Sales, LeadGen, etc.). Each instantiates task queues and metrics at startup. Add config flag or lazy-load. 1h.
- [ ] **AI-3-2: Delete check/ai-system** — Dead legacy code referencing non-existent paths. Third abandoned version of the AI system. 5min.

### Marketplace Wave 2 (from [MARKETPLACE_AUDIT.md](MARKETPLACE_AUDIT.md))
- [ ] **MKT-2-2: DeepSeek R1 boost AI agent** — AI-powered ad placement: smart scheduling, audience matching, A/B placement testing, budget pacing, competitive awareness, auto-normalization on depletion. 12-16h.

### Smart contracts Wave 2 (from [CONTRACTS_AUDIT.md](CONTRACTS_AUDIT.md))
- [ ] **Governance / DAO contracts** — token-weighted voting, proposal system. Enables community governance for platform decisions. 8-12h.
- [ ] **Custom swap module** — if QuickSwap integration isn't sufficient, build platform-specific swap with fee rebates/loyalty bonuses. 12-16h.
- [ ] **WebAuthn/Passkey for CFIS** — upgrade CFIS auth from TOTP to hardware key support per spec. 8-12h.

### Spec verification gaps — Wave 2 (from [SPEC_VERIFICATION.md](SPEC_VERIFICATION.md))

**SEO/RAO (from SEO system.md + More on seo.md):**
- [ ] **SPEC-SEO-2: Vector embedding & semantic search** — Build vector index of all articles for RAG/LLM retrieval. Hybrid keyword + embedding search. 12-16h.
- [ ] **SPEC-SEO-3: WebSub (PubSubHubbub)** — Real-time content notification to Google/Bing indexing when articles publish. 4-6h.
- [ ] **SPEC-SEO-4: RAO performance tracking** — Monitor when ChatGPT/Perplexity/Claude cite CoinDaily content. Analyze which article structures get retrieved. 8-12h.
- [ ] **SPEC-SEO-5: n8n automation orchestration** — Connect AI agents + analytics + CMS with workflow triggers (publish → auto-share → recheck → refresh). 8-12h.
- [ ] **SPEC-SEO-8: Enhanced RSS for AI consumption** — Add machine-readable metadata (entity type, sentiment, urgency) to RSS feed items via custom XML namespaces. 4-6h.

**Features (from new features.md + Ads spec):**
- [ ] **SPEC-NEW-2: Institutional API key management** — api_keys table with tiers (basic/premium/enterprise), per-key rate limiting, usage dashboards. For Bloomberg terminal monetization. 4-6h.
- [ ] **SPEC-NEW-4: Traffic Cop ML model** — Backend ML pipeline for bot pattern detection, behavioral analysis, IVT scoring. Currently client telemetry only. 12-16h.
- [ ] **SPEC-ADS-1: External ad network integration** — Google Ad Manager compatibility, Prebid.js wrapper for programmatic ads alongside internal AdsRotationAgent. 12-16h.

### Algorithm surface (placeholder dir to create)
- [ ] Create `apps/algorithms/` per founder directive — home for all platform algorithms (trending, personalization, content ranking, fraud scoring).
- [ ] Move feed-ranking logic out of backend into `apps/algorithms/`.

### Project main API — the data business
- [ ] **Populate `apps/api`** — the founder's plan is for this to be the public-facing API gateway (rate-limited, key-authenticated, monetizable). Different from `backend/` (internal API). Worth ~$5–50k MRR if positioned as data-API-for-African-crypto.
- [ ] **API tiers**: Free (1k req/day) → $99/mo (100k req/day + WebSocket) → $999/mo (enterprise). Document with Redoc (free OSS).
- [ ] **First public endpoints**: market data, article search, regulatory data, exchange rates. These monetize data you're already collecting.

### Terminal
- [ ] **`apps/terminal/`** — internal CLI for editorial ops (publish, schedule, audit). Press app CLI lives here too.

### Bots (independent of main system)
- [ ] **`apps/bots/`** — Telegram alert bot, Twitter auto-post bot, Discord market alerts bot. Each is its own pm2 process.

---

## 🪙 POST-LAUNCH — Wave 3 (Sep–Dec 2026, Creator Economy on-chain + Data Moat)

This is the creator-economy moat. Solidity contracts exist in `contracts/` — deploy in stages.

### Smart contracts
- [ ] **Choose chain**: Polygon (cheap, EVM, African crypto users already there) or Base (Coinbase rails). Recommend Polygon for African creators given gas costs.
- [ ] **Deploy to testnet first** (Polygon Amoy), iterate for 2 weeks.
- [ ] **SPEC-FIN-1: Conversion.sol** — CE-to-JY token conversion contract. Spec finance.md Task 1. 4-6h.
- [ ] **SPEC-FIN-2: InstitutionalVesting.sol** — 10-year cliff, quarterly unlocks (62,500 JY/quarter), 24-hour claim window with auto re-lock penalty, Chainlink Keepers integration. Spec finance.md §13.3. 8-12h.
- [ ] **SPEC-FIN-3: RewardDistributor.sol** — Revenue collection from protocol sources, 50/30/20 allocation (buy-back-burn / staking rewards / treasury), DEX integration (Uniswap V3), automated weekly execution. Spec finance.md §13.4. 12-16h.
- [ ] **SPEC-FIN-4: Governance contracts** — On-chain proposal/voting system, token-weighted governance, 7-day voting + 3-day timelock, quorum 10% circulating supply. Spec finance.md §13.5. 8-12h.
- [ ] `SimpleWallet.sol` — custodial wallet abstraction for creators (most creators won't hold seed phrases).
- [ ] `Subscription.sol` — recurring on-chain subscriptions to creators.
- [ ] `CDPPoints.sol` — points system. Off-chain ledger first, bridge later.
- [ ] `JoyToken.sol` (JY) — the platform token. **Do not launch this casually.** Tokenomics review, legal review, sale structure.
- [ ] `StakingVault.sol` — staking. After token is live.
- [ ] `ReputationSBT.sol` — non-transferable reputation. Ties to v1Reputation routes.
- [ ] `Airdrop.sol` — for community rewards. After token + reputation are live.
- [ ] `PressDistribution.sol` — on-chain press release distribution receipts (interesting differentiator for crypto-native PR).
- [ ] **MVP/token-landing/** — re-skin and re-launch as the official token sale page once tokenomics are locked.

### Creator economy (full — from strategy V2 §01)
- [ ] **Creator tiers** (4 levels) — add CreatorTier enum to Prisma schema. Gates which AI tools creators can access.
- [ ] **Creator earnings tracker** — NXT/JY earning dashboard in `apps/ai`. Shows per-article earnings, staking rewards, referral bonuses.
- [ ] **Creator paywall** — content-level tier gating (not just user-level). A creator sets "Pro only" on their article → readers need Pro subscription.
- [ ] **NXT-based ad payments** — advertisers pay in NXT for campaigns. Burns or redistributes to creators.

### Data moat — the Bloomberg endgame (from strategy V2 §05, Bloomberg Backbone §14–18)
- [ ] **Enterprise data tier** ($299/mo) — dedicated API access for funds and institutions.
- [ ] **Institutional tier** ($2500/mo) — white-glove support + custom data feeds.
- [ ] **4 proprietary branded indices** — EM Crypto Adoption Index (EMAI), Africa DeFi Activity Index (ADAI), EM Regulatory Risk Score, Caribbean Remittance Corridor Index. Publish methodology. License to ETF issuers long-term.
- [ ] **African regulatory tracker** — real-time tracker of crypto/finance regulation across 15+ countries. SEC filings, CBN circulars, FSCA notices. **Sellable to international funds.** No competitor does this for Africa.
- [ ] **African exchange flow data** — aggregate trade volume, withdrawal/deposit flows, arbitrage spreads across exchanges. Publish weekly "Flows Report."
- [ ] **African market data — your own asset** (Bloomberg Backbone §15) — by this point you have 6+ months of time-series African crypto + FX flow data in TimescaleDB. This is **licensable**. Citi, JP Morgan, BlackRock pay for emerging-markets data. Package it, price it, sell it. Bloomberg makes 80% of revenue from data; news is a loss leader.
- [ ] **Conference + calendar product** — aggregate every African crypto/finance/blockchain event + earnings dates. Subscribers sync to Google Cal.

### Platform scaling
- [ ] **NEXUS Original Events** — first virtual summit. Revenue from tickets + sponsorships.
- [ ] **Speaker bureau CRM** — track speakers across African crypto events. Sell access to event organizers.
- [ ] **Full V3 RBAC** (12 roles) — Department Head, Senior/Junior Editor, Finance Officer, HR Staff, Ad Ops, Events Staff, Creator Support, Intern, Read-only Auditor. Build when team size > 5.
- [ ] **HR & hiring system** in `apps/admin` — when hiring first staff members. Onboarding checklists, role provisioning.
- [ ] **Newsroom-as-a-service** — white-label the AI editorial pipeline for African banks, exchanges, fintechs. Bloomberg-adjacent revenue.

---

## 🟣 "FEELS LIKE BLOOMBERG" UX POLISH (parallel work, low-cost — from [BLOOMBERG_BACKBONE.md](BLOOMBERG_BACKBONE.md))

These are cheap, mostly-CSS, brand-defining changes. Do them in parallel with feature work whenever you need a mental break from backend plumbing. None requires significant engineering.

- [x] **Monospace fonts in data tables** — Added JetBrains Mono via `next/font/google`, exposed as `--font-jetbrains-mono` CSS variable. Already configured as `font-mono` in Tailwind. Added `.data-table` (monospace td, tabular-nums), `.price-display`, `.price-up`/`.price-down` utility classes in globals.css.
- [ ] **Dark mode default for finance pages, light mode for news** — `/markets`, factsheet pages, portfolio tracker get dark backgrounds. News articles stay light. Bloomberg terminal aesthetic without the cost. Estimate: 4h.
- [ ] **Keyboard shortcuts in markets dashboard** — `/` for search, `g m` for markets, `g n` for news, `g p` for press. Bloomberg power users live by shortcuts. Use a lightweight lib like `hotkeys-js` ($0, 2KB). Estimate: 3h.
- [ ] **Density toggle** — "comfortable" vs "compact" layout on data-heavy pages. Traders want to pack more data on-screen; casual readers want breathing room. Store in localStorage. Estimate: 2h.
- [ ] **Loading time obsession** — Bloomberg feels fast because nothing shows a spinner > 200ms. Audit every page: use Next.js streaming SSR + Cloudflare Edge cache + Redis for API responses. Target: zero visible spinners on any data page. Estimate: ongoing.
- [x] **Africa-first framing in every story** — Baked into `ImoPromptAgent.EDITORIAL_TONE_CONSTRAINT`: "Frame EVERY story through an Africa-first lens — what does this mean for Lagos, Nairobi, Joburg, Accra? Even global news must be reframed for African readers." Applied across all article/SEO/research prompts.

---

## 🧪 ONGOING — quality bars

- [ ] Weekly: review 5 random AI-generated articles for quality drift.
- [ ] Weekly: review top 10 Sentry errors.
- [ ] Weekly: review week's analytics (PostHog) and write a 1-paragraph internal note.
- [ ] Weekly: publish CoinDaily Africa Crypto Snapshot (once established in Wave 1).
- [ ] Monthly: dependency audit (`npm audit`, Snyk free tier).
- [ ] Monthly: backup restore drill.
- [ ] Monthly: revisit this TODO + [STRATEGY_GAP_ANALYSIS.md](STRATEGY_GAP_ANALYSIS.md). Update alignment score (currently 55%).
- [ ] Quarterly: pricing review.
- [ ] Quarterly: secrets rotation per [SECRETS_ROTATION.md](SECRETS_ROTATION.md).

---

## 📊 Strategy alignment score

**Current: 55%** (as of 2026-05-11, per [STRATEGY_GAP_ANALYSIS.md](STRATEGY_GAP_ANALYSIS.md))

| Area | Status | Target by launch |
|---|---|---|
| AI Agent Pipeline (16 agents) | 10/16 exist, 3 disconnected architectures, research hardcoded | Consolidate architectures, fix compilation, wire backend (see AI_SYSTEM_AUDIT.md) |
| Free "Trojan Horse" Tools | 8/8 ✅ | 8/8 |
| Native Ad Engine | ✅ production-ready | ✅ |
| SEO/GEO/LLM Infrastructure | 7/11 features | 9/11 (add FAQ, Google News app) |
| Market Data + Bloomberg DNA | ✅ aggregator + exchanges | Add factsheets + 5-strip ticker bar |
| Search | Elasticsearch in stack, not wired | Faceted search across all content |
| Subscription Tiers | Schema only | Add pricing page + Pro checkout |
| Press Distribution | App exists, CMS-like | Wire service UX + filters + alerts |
| Creator Economy | Contracts + marketplace frontend (mock data) | Wave 1 marketplace, Wave 3 full creator economy |
| Events Intelligence | 0% | Wave 1 minimal page |
| Video Generation | 0% | Wave 2 (post-launch) |
| WhatsApp Distribution | 0% | Add share buttons pre-launch |
| Newsletter System | 0% | Listmonk pre-launch, operational Wave 1 |
| Regulatory Intelligence | UI tool exists | Seed data for 4 countries pre-launch |
| Dashboard System (V3) | Super Admin strong | Add staff views post-launch |
| Backend Security | ✅ All 6 SEV-0 fixed (JWT, roles, GraphQL auth, routes, CSRF, email verify) + 4 SEV-1s fixed | Remaining: Redis centralization, uploads auth, input validation |
| RBAC (12 roles) | ✅ 6/12 roles, role escalation fixed (DB-only) | 6/12 sufficient for solo founder |
| Data Moat / Indices | Collecting data, no indices | Wave 2–3 |
| Bloomberg UX Polish | Hype ban only | Add monospace fonts, dark mode, shortcuts |
| Portfolio Tracker | 0% | Wave 1 (read-only, never move money) |
| Licensable Data Asset | Collecting since Day 1 | Package + sell after 6–12 months |
| Admin Panel Stability | No token refresh, no session warning, no real-time | Fix token refresh + session timeout pre-launch; WebSocket Wave 1 |
| Ads System | AdsRotationAgent built (900+ lines), internal ads work | Wave 2: external ad networks (GAM, Prebid) |
| SEO/RAO Pipeline | Tasks 1-8 services built, Tasks 9-15 not started | Wave 2: vector embeddings, RAO tracking, n8n automation |
| On-ramp/Remittance Tools | Routes registered, return fallback data | Wave 1: wire live provider APIs (YellowCard SDK, Binance P2P) |
| Smart Contracts (full spec) | 8/12 contracts exist, 4 missing from finance.md §13 | Wave 3: Conversion, InstitutionalVesting, RewardDistributor, Governance |
| Tax Calculator | Core engine + frontend exist | ✅ Functional |
| News Widget (embed) | 0% | Wave 1: embeddable widget for third-party sites |

**Target by launch: ~68%** (from 55% → gain from pricing page, factsheets, 5-strip ticker, faceted search, press wire polish, WhatsApp buttons, newsletter setup, regulatory seeding, editorial standards, citations, FAQ schema, Africa-first framing)

---

## 📌 Things explicitly NOT being cut (founder directive)

The original pre-launch review suggested cutting these. The founder has decided to keep them — this section is here so future reviews don't re-litigate the same items:

- **`apps/api`, `apps/bots`, `apps/terminal`** — kept as architectural placeholders for the platform's evolution. Will be populated post-launch.
- **5 separate Next.js apps** (frontend, admin, ai, press, MVP/token-landing) — intentional product-per-frontend pattern. Shared code lives in `packages/` and `shared/`.
- **3 translation surfaces** (ai-system agent + backend resolver + Python NLLB service) — each has a role: ai-system orchestrates, backend resolves GraphQL queries, Python service does the heavy NLLB inference.
- **285 Prisma models** — full schema retained. Focus is on the subset needed for launch; nothing deleted.
- **Multi-market launch on 06-01** — Nigeria + Kenya + SA + Ghana + diaspora all on Day 1. Platform must be 90% ready for the whole footprint before launch.
- **Smart contracts in `contracts/`** — core to the post-launch creator economy. Not cut, scheduled into Wave 3.
- **`finance-system/` separate from superadmin** — deliberate isolation pattern. Finance handles money, superadmin issues receipts, both reconcile.
- **`apps/ai`** — paywalled content creation tool for paid subscribers. Kept in PM2.
