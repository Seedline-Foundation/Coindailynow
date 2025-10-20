# 📖 Feature Documentation
## CoinDaily Platform - Core Features Guide

**Version**: 1.0.0  
**Last Updated**: October 6, 2025

---

## 📋 Table of Contents

1. [Security Dashboard](#security-dashboard)
2. [Audit System](#audit-system)
3. [Accessibility Scanner](#accessibility-scanner)
4. [Advanced Rate Limiting](#advanced-rate-limiting)
5. [Content Management System](#content-management-system)
6. [Marquee System](#marquee-system)
7. [Super Admin Dashboard](#super-admin-dashboard)

---

## 🔒 Security Dashboard

### Overview

The Security Dashboard provides real-time monitoring and management of platform security with comprehensive threat detection, event tracking, and response capabilities.

### Key Features

#### 1. Real-Time Security Metrics

**Purpose**: Monitor security health at a glance

**Metrics Displayed**:
- **Total Security Events**: Count of all security events in selected time period
- **Events by Severity**: Breakdown by Critical, High, Medium, Low
- **Active Threats**: Currently ongoing security issues
- **Blocked IPs**: Number of IPs on blacklist
- **Failed Login Attempts**: Authentication failure tracking
- **Rate Limit Violations**: Users hitting rate limits
- **Suspicious Activities**: Anomaly detection alerts

**Visual Indicators**:
```
🟢 Green (Normal):      0-10 events/hour
🟡 Yellow (Elevated):   11-50 events/hour
🔴 Red (Critical):      51+ events/hour
```

**Usage**:
```typescript
// Access metrics
GET /api/admin/security/metrics?period=24h

// Response
{
  "totalEvents": 1543,
  "criticalEvents": 5,
  "highSeverityEvents": 23,
  "activeThreats": 2,
  "blockedIPs": 12
}
```

#### 2. Security Event Timeline

**Purpose**: Visualize security events over time to identify patterns

**Features**:
- Time-based visualization (line chart)
- Event type filtering
- Severity color coding
- Clickable data points for details
- Export to CSV/JSON

**Time Ranges**:
- Last 1 hour
- Last 24 hours
- Last 7 days
- Last 30 days
- Custom range

**Example Pattern Detection**:
```
Spike at 2 AM → Bot attack detected
Gradual increase → DDoS attempt
Periodic spikes → Automated scraper
```

#### 3. Top Threats Panel

**Purpose**: Identify most common attack vectors

**Information Shown**:
- Threat type (SQL Injection, XSS, Brute Force, etc.)
- Occurrence count
- Severity level
- Target endpoints
- Source IP patterns
- Time distribution

**Common Threats**:

| Threat Type | Description | Typical Response |
|-------------|-------------|------------------|
| Brute Force Login | Multiple password attempts | IP block after 5 attempts |
| SQL Injection | Database attack attempts | Block IP, log event |
| XSS Attempts | Cross-site scripting | Sanitize input, block IP |
| Path Traversal | File system access attempts | Block IP immediately |
| DDoS Pattern | Distributed denial of service | Rate limit + IP block |

#### 4. Security Event Details

**Event Fields**:
```typescript
interface SecurityEvent {
  id: string;
  eventType: 'FAILED_LOGIN_ATTEMPT' | 'SQL_INJECTION' | 'XSS_ATTEMPT' | ...;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ipAddress: string;
  userId?: string;
  userAgent: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requestBody?: object;
  details: {
    attemptCount?: number;
    payload?: string;
    detectionMethod?: string;
  };
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'FALSE_POSITIVE';
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: Date;
}
```

**Actions Available**:
1. **Mark as Reviewed**: Indicate you've examined the event
2. **Mark as False Positive**: Improves detection accuracy
3. **Block IP**: Immediately blacklist source
4. **Escalate**: Flag for urgent attention
5. **Add to Whitelist**: Exempt from future detection

### Technical Implementation

#### Backend Components

**1. Security Event Logger** (`backend/src/services/security/event-logger.ts`):
```typescript
class SecurityEventLogger {
  async logEvent(event: SecurityEventInput): Promise<void> {
    // Store in database
    await prisma.securityEvent.create({ data: event });
    
    // Cache recent events in Redis
    await redis.zadd(
      'security:events',
      Date.now(),
      JSON.stringify(event)
    );
    
    // Send real-time notification if critical
    if (event.severity === 'CRITICAL') {
      await this.notifyAdmins(event);
    }
  }
}
```

**2. Threat Detection** (`backend/src/middleware/threat-detection.ts`):
```typescript
// Detects common attack patterns
const threatDetection = (req, res, next) => {
  const threats = [];
  
  // Check for SQL injection
  if (detectSQLInjection(req.body)) {
    threats.push('SQL_INJECTION');
  }
  
  // Check for XSS
  if (detectXSS(req.body)) {
    threats.push('XSS_ATTEMPT');
  }
  
  if (threats.length > 0) {
    logSecurityEvent({
      eventType: threats[0],
      severity: 'HIGH',
      ipAddress: req.ip,
      details: { threats }
    });
  }
  
  next();
};
```

**3. Metrics Aggregator** (`backend/src/services/security/metrics-aggregator.ts`):
```typescript
class MetricsAggregator {
  async getMetrics(period: '24h' | '7d' | '30d') {
    const timeWindow = this.getTimeWindow(period);
    
    return {
      totalEvents: await this.countEvents(timeWindow),
      criticalEvents: await this.countBySeverity('CRITICAL', timeWindow),
      timeline: await this.getTimeline(timeWindow),
      topThreats: await this.getTopThreats(timeWindow)
    };
  }
}
```

### Best Practices

**1. Regular Monitoring**:
- Check dashboard daily
- Review critical events within 1 hour
- Investigate high-severity events within 24 hours

**2. Pattern Recognition**:
- Look for recurring IP addresses
- Identify attack time patterns
- Recognize attack signatures

**3. Response Protocol**:
```
Critical Event:
  1. Block IP immediately
  2. Review recent activity
  3. Check for data breach
  4. Notify security team
  5. Document incident

High Severity:
  1. Review event details
  2. Check user account
  3. Block if malicious
  4. Monitor for recurrence
```

---

## 📋 Audit System

### Overview

The Audit System provides comprehensive logging and tracking of all administrative actions, user activities, and system changes for compliance, security, and troubleshooting.

### Key Features

#### 1. Comprehensive Activity Logging

**Categories Tracked**:
- **USER_MANAGEMENT**: Account changes, role modifications
- **CONTENT**: Article creation, edits, deletions
- **SECURITY**: Security setting changes, IP blocks
- **SYSTEM**: Configuration changes, feature toggles
- **AUTHENTICATION**: Login, logout, password changes
- **AUTHORIZATION**: Permission changes, access denials

**Audit Log Entry**:
```typescript
interface AuditLog {
  id: string;
  action: string;              // e.g., "USER_ROLE_CHANGED"
  category: AuditCategory;
  userId: string;              // Who performed the action
  targetUserId?: string;       // Who was affected
  targetResourceId?: string;   // What was affected
  details: object;             // Action-specific data
  ipAddress: string;
  userAgent: string;
  result: 'SUCCESS' | 'FAILURE';
  errorMessage?: string;
  timestamp: Date;
}
```

#### 2. Audit Log Viewer

**Access**: Dashboard → Audit Logs

**Features**:
- Filterable table view
- Search functionality
- Date range selection
- Export capabilities (CSV, JSON, PDF)
- Real-time updates

**Filters**:
```typescript
interface AuditFilters {
  category?: AuditCategory;
  userId?: string;
  action?: string;
  result?: 'SUCCESS' | 'FAILURE';
  startDate?: Date;
  endDate?: Date;
  search?: string;
}
```

**Example Query**:
```
GET /api/admin/audit/logs?category=USER_MANAGEMENT&result=SUCCESS&startDate=2025-10-01

Returns: All successful user management actions since Oct 1
```

#### 3. Audit Trail

**Purpose**: Track complete history of a resource or user

**Use Cases**:
1. **User History**: "Show me all actions by user@example.com"
2. **Resource History**: "Show me all changes to article X"
3. **Compliance**: "Generate report of all admin actions in Q4"
4. **Forensics**: "What happened before the incident?"

**Example Trail**:
```
Article ID: art_abc123
Timeline:
  2025-10-01 09:00 - Created by john@coindaily.com
  2025-10-01 10:30 - Edited by john@coindaily.com
  2025-10-02 14:15 - Published by editor@coindaily.com
  2025-10-05 08:45 - Edited by admin@coindaily.com
  2025-10-05 09:00 - Featured by admin@coindaily.com
```

### Technical Implementation

#### 1. Audit Logger Middleware

```typescript
// backend/src/middleware/audit-logger.ts
const auditLogger = (action: string, category: AuditCategory) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Capture request details
    const startTime = Date.now();
    
    // Continue with request
    next();
    
    // Log after response
    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      
      await prisma.auditLog.create({
        data: {
          action,
          category,
          userId: req.user?.id,
          targetUserId: req.body.userId || req.params.userId,
          targetResourceId: req.params.id,
          details: {
            method: req.method,
            path: req.path,
            body: sanitizeForAudit(req.body),
            duration
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          result: res.statusCode < 400 ? 'SUCCESS' : 'FAILURE',
          errorMessage: res.locals.error?.message
        }
      });
    });
  };
};
```

**Usage in Routes**:
```typescript
// User management route
router.put(
  '/users/:id/role',
  authenticate,
  authorize(['SUPER_ADMIN']),
  auditLogger('USER_ROLE_CHANGED', 'USER_MANAGEMENT'),
  changeUserRole
);
```

#### 2. Audit Service

```typescript
// backend/src/services/audit.service.ts
class AuditService {
  async getLogs(filters: AuditFilters, pagination: Pagination) {
    return prisma.auditLog.findMany({
      where: this.buildWhereClause(filters),
      ...pagination,
      orderBy: { timestamp: 'desc' }
    });
  }
  
  async getResourceHistory(resourceType: string, resourceId: string) {
    return prisma.auditLog.findMany({
      where: {
        OR: [
          { targetResourceId: resourceId },
          { details: { path: { contains: resourceId } } }
        ]
      },
      orderBy: { timestamp: 'asc' }
    });
  }
  
  async exportLogs(filters: AuditFilters, format: 'csv' | 'json' | 'pdf') {
    const logs = await this.getLogs(filters, { limit: 10000 });
    
    switch (format) {
      case 'csv':
        return this.generateCSV(logs);
      case 'json':
        return JSON.stringify(logs, null, 2);
      case 'pdf':
        return this.generatePDF(logs);
    }
  }
}
```

#### 3. Retention Policy

**Configuration**:
```typescript
const AUDIT_RETENTION_POLICY = {
  CRITICAL_ACTIONS: 7 * 365,    // 7 years
  SECURITY_EVENTS: 3 * 365,     // 3 years
  USER_MANAGEMENT: 2 * 365,     // 2 years
  CONTENT_CHANGES: 365,         // 1 year
  GENERAL_LOGS: 90              // 90 days
};
```

**Cleanup Job** (runs daily):
```typescript
cron.schedule('0 2 * * *', async () => {
  for (const [category, days] of Object.entries(AUDIT_RETENTION_POLICY)) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    await prisma.auditLog.deleteMany({
      where: {
        category,
        timestamp: { lt: cutoffDate }
      }
    });
  }
});
```

### Compliance Features

#### GDPR Compliance

**User Data Export**:
```typescript
async function exportUserAuditData(userId: string) {
  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { userId },
        { targetUserId: userId }
      ]
    }
  });
  
  return {
    user_actions: logs.filter(l => l.userId === userId),
    actions_on_user: logs.filter(l => l.targetUserId === userId),
    export_date: new Date(),
    format_version: '1.0'
  };
}
```

**Right to Erasure**:
```typescript
async function anonymizeUserAuditLogs(userId: string) {
  // Replace user IDs with anonymous identifier
  await prisma.auditLog.updateMany({
    where: { userId },
    data: {
      userId: `DELETED_USER_${crypto.randomUUID()}`,
      details: { user_deleted: true }
    }
  });
}
```

### Best Practices

**1. What to Log**:
✅ DO log:
- Authentication attempts (success/failure)
- Authorization decisions
- Data modifications (create, update, delete)
- Configuration changes
- Security events
- Access to sensitive data

❌ DON'T log:
- Passwords or tokens
- Credit card numbers
- Personal identification numbers
- Full request bodies with sensitive data

**2. Log Sanitization**:
```typescript
function sanitizeForAudit(data: any): any {
  const sensitive = ['password', 'token', 'secret', 'apiKey', 'ssn', 'creditCard'];
  
  return Object.keys(data).reduce((acc, key) => {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      acc[key] = '[REDACTED]';
    } else {
      acc[key] = data[key];
    }
    return acc;
  }, {});
}
```

**3. Performance Considerations**:
- Use async logging (don't block requests)
- Batch inserts for high-volume logging
- Index frequently queried fields
- Archive old logs to cold storage
- Use Redis for recent log cache

---

## ♿ Accessibility Scanner

### Overview

The Accessibility Scanner is an automated tool that audits the platform for WCAG 2.1 Level AA compliance, identifies accessibility issues, and provides actionable recommendations.

### Key Features

#### 1. Automated Accessibility Audits

**Scan Types**:
- **Full Site Scan**: All pages
- **Page-Specific Scan**: Single page
- **Component Scan**: Specific component
- **Scheduled Scan**: Automatic daily scans

**WCAG Principles Checked**:
1. **Perceivable**: Information must be presentable to users
2. **Operable**: UI components must be operable
3. **Understandable**: Information and UI must be understandable
4. **Robust**: Content must be robust enough for assistive technologies

**Audit Results**:
```typescript
interface AccessibilityAuditResult {
  id: string;
  url: string;
  timestamp: Date;
  score: number;              // 0-100
  passedChecks: number;
  failedChecks: number;
  warnings: number;
  issues: AccessibilityIssue[];
  recommendations: string[];
}

interface AccessibilityIssue {
  id: string;
  severity: 'CRITICAL' | 'SERIOUS' | 'MODERATE' | 'MINOR';
  wcagLevel: 'A' | 'AA' | 'AAA';
  principle: 'Perceivable' | 'Operable' | 'Understandable' | 'Robust';
  guideline: string;          // e.g., "1.1.1 Non-text Content"
  description: string;
  element: string;            // HTML selector
  fix: string;                // How to fix
  impact: string;             // User impact
}
```

#### 2. Common Issues Detected

**Visual Issues**:
- Missing alt text on images
- Insufficient color contrast (< 4.5:1)
- Text too small (< 16px base)
- Non-scalable text (absolute units)

**Structural Issues**:
- Missing heading hierarchy
- Skip navigation links missing
- Landmark regions not defined
- Form labels missing

**Interactive Issues**:
- Keyboard navigation not supported
- Focus indicators missing
- ARIA attributes incorrect
- Tab order illogical

**Content Issues**:
- Link text not descriptive ("click here")
- Language attribute missing
- Page title missing or generic
- iframes without titles

#### 3. Accessibility Report

**Report Sections**:
1. **Executive Summary**
   - Overall score
   - Critical issues count
   - Compliance level (A, AA, AAA)
   - Comparison to previous scan

2. **Issues by Severity**
   - Critical: Must fix immediately
   - Serious: Fix within 1 week
   - Moderate: Fix within 1 month
   - Minor: Enhancement opportunity

3. **Issues by Principle**
   - Grouped by WCAG principle
   - Shows distribution of issues

4. **Detailed Issue List**
   - Each issue with fix instructions
   - Code examples
   - Screenshots (when applicable)

5. **Recommendations**
   - Prioritized action items
   - Best practices
   - Resources for learning

**Sample Report**:
```
Accessibility Audit Report
Date: October 6, 2025
URL: https://coindaily.com

Overall Score: 87/100 (WCAG AA Compliant)

Summary:
✅ 45 checks passed
⚠️ 3 warnings
❌ 5 critical issues

Critical Issues:
1. [1.1.1] Missing alt text on 3 images
   Location: /articles/bitcoin-surge
   Fix: Add descriptive alt text to <img> tags
   
2. [2.1.1] Keyboard trap in modal dialog
   Location: Login modal
   Fix: Implement proper focus management

3. [1.4.3] Color contrast ratio 3.8:1 (required: 4.5:1)
   Location: Button text on .primary-button
   Fix: Darken text color to #1a1a1a
```

### Technical Implementation

#### 1. Scanner Service

```typescript
// backend/src/services/accessibility-scanner.ts
import { AxePuppeteer } from '@axe-core/puppeteer';
import puppeteer from 'puppeteer';

class AccessibilityScanner {
  async scanPage(url: string): Promise<AccessibilityAuditResult> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Run axe-core accessibility tests
    const results = await new AxePuppeteer(page)
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    await browser.close();
    
    // Process results
    return {
      id: crypto.randomUUID(),
      url,
      timestamp: new Date(),
      score: this.calculateScore(results),
      passedChecks: results.passes.length,
      failedChecks: results.violations.length,
      warnings: results.incomplete.length,
      issues: this.formatIssues(results.violations),
      recommendations: this.generateRecommendations(results)
    };
  }
  
  private calculateScore(results: any): number {
    const total = results.passes.length + results.violations.length;
    return Math.round((results.passes.length / total) * 100);
  }
  
  private formatIssues(violations: any[]): AccessibilityIssue[] {
    return violations.map(v => ({
      id: v.id,
      severity: this.mapSeverity(v.impact),
      wcagLevel: this.getWCAGLevel(v.tags),
      principle: this.getPrinciple(v.tags),
      guideline: v.help,
      description: v.description,
      element: v.nodes[0]?.target[0] || 'Unknown',
      fix: v.nodes[0]?.failureSummary || v.help,
      impact: v.impact
    }));
  }
}
```

#### 2. Scheduled Scanning

```typescript
// Run daily accessibility scan
cron.schedule('0 3 * * *', async () => {
  const scanner = new AccessibilityScanner();
  const urls = await getPagesToScan();
  
  for (const url of urls) {
    const result = await scanner.scanPage(url);
    
    // Store result
    await prisma.accessibilityScan.create({
      data: result
    });
    
    // Alert if score drops below threshold
    if (result.score < 85) {
      await notifyAccessibilityTeam(result);
    }
  }
});
```

#### 3. Fix Verification

```typescript
async function verifyFix(issueId: string): Promise<boolean> {
  const issue = await prisma.accessibilityIssue.findUnique({
    where: { id: issueId },
    include: { scan: true }
  });
  
  // Re-scan the page
  const newScan = await scanner.scanPage(issue.scan.url);
  
  // Check if issue still exists
  const issueResolved = !newScan.issues.some(
    i => i.guideline === issue.guideline && i.element === issue.element
  );
  
  if (issueResolved) {
    await prisma.accessibilityIssue.update({
      where: { id: issueId },
      data: { status: 'RESOLVED', resolvedAt: new Date() }
    });
  }
  
  return issueResolved;
}
```

### Usage Guide

#### Running Manual Scan

**Dashboard**:
1. Navigate to **Settings** → **Accessibility**
2. Click "Run Audit"
3. Select scope (Full Site / Single Page)
4. Click "Start Scan"
5. Wait 1-2 minutes
6. View results

**API**:
```bash
POST /api/admin/accessibility/scan
{
  "url": "https://coindaily.com/articles",
  "options": {
    "wcagLevel": "AA",
    "includeBestPractices": true
  }
}
```

#### Fixing Issues

**Priority Order**:
1. Critical issues (WCAG violations affecting many users)
2. Serious issues (Major accessibility barriers)
3. Moderate issues (Usability problems)
4. Minor issues (Enhancements)

**Fix Workflow**:
```
1. Identify issue from report
2. Locate affected code
3. Apply fix
4. Test with assistive technology
5. Mark as fixed in dashboard
6. Verify with rescan
```

### Best Practices

**1. Regular Scanning**:
- Run automated scans daily
- Manual review weekly
- Full audit monthly
- Test with real users quarterly

**2. Fix Verification**:
- Always test fixes with keyboard
- Test with screen reader
- Check color contrast with tools
- Validate HTML with W3C validator

**3. Prevention**:
- Use semantic HTML
- Include accessibility in code reviews
- Train developers on WCAG
- Use accessible component libraries

---

## 🚦 Advanced Rate Limiting

### Overview

Advanced Rate Limiting protects the platform from abuse by controlling request frequency with sophisticated algorithms, multi-tier limits, and automatic threat response.

### Key Features

#### 1. Sliding Window Algorithm

**How it works**:
```
Time: ──────────────────────────────────────────────────►
      |←─────── 60 seconds ────────→|
Requests: ▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪ (27 requests)

Check: Current time - 60s = window start
Count: Requests in window
Allow: If count < limit
```

**Benefits**:
- More accurate than fixed windows
- Prevents burst abuse at window boundaries
- Distributed across multiple servers (Redis)

**Implementation**:
```typescript
async function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
  const key = `ratelimit:${identifier}:${endpoint}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Remove old entries
  await redis.zremrangebyscore(key, 0, windowStart);
  
  // Count requests in window
  const count = await redis.zcard(key);
  
  if (count < maxRequests) {
    // Add new request
    await redis.zadd(key, now, `${now}-${Math.random()}`);
    await redis.expire(key, Math.ceil(windowMs / 1000));
    return true;
  }
  
  return false;
}
```

#### 2. Multi-Tier Rate Limits

**User Tiers**:

| Tier | Requests/Min | Burst Allowance | Use Case |
|------|--------------|-----------------|----------|
| Anonymous | 10 | 15 | Unauthenticated users |
| User | 60 | 100 | Registered users |
| Premium | 300 | 500 | Premium subscribers |
| Admin | 1,000 | 2,000 | Platform administrators |
| Super Admin | 10,000 | 20,000 | System administrators |

**Endpoint-Specific Limits**:

| Endpoint | Limit | Window | Reason |
|----------|-------|--------|--------|
| /api/auth/login | 5 | 15 min | Prevent brute force |
| /api/auth/register | 3 | 1 hour | Prevent spam accounts |
| /api/auth/forgot-password | 3 | 1 hour | Prevent email flooding |
| /api/search | 20 | 1 min | Expensive operation |
| /api/comments | 10 | 1 min | Prevent spam |
| /api/market-data | 60 | 1 min | High-frequency data |

#### 3. Auto-Blacklisting

**Trigger Conditions**:
- 10+ rate limit violations in 1 hour
- Detected attack pattern
- Multiple failed login attempts (5+)
- Suspicious request patterns

**Blacklist Duration**:
- First offense: 1 hour
- Second offense: 24 hours
- Third offense: 7 days
- Persistent abuse: Permanent

**Blacklist Record**:
```typescript
interface BlacklistEntry {
  id: string;
  ipAddress: string;
  reason: string;
  violationCount: number;
  firstViolation: Date;
  lastViolation: Date;
  blacklistedAt: Date;
  expiresAt: Date;
  notes?: string;
  addedBy: 'SYSTEM' | string;  // User ID or 'SYSTEM'
}
```

**Auto-blacklist Implementation**:
```typescript
async function checkForAutoBlacklist(
  ipAddress: string
): Promise<void> {
  const violations = await prisma.rateLimitViolation.count({
    where: {
      ipAddress,
      createdAt: {
        gte: new Date(Date.now() - 3600000) // Last hour
      }
    }
  });
  
  if (violations >= 10) {
    await prisma.blacklistedIP.create({
      data: {
        ipAddress,
        reason: 'Automatic: Excessive rate limit violations',
        violationCount: violations,
        expiresAt: new Date(Date.now() + 86400000), // 24 hours
        addedBy: 'SYSTEM'
      }
    });
    
    // Log security event
    await logSecurityEvent({
      eventType: 'AUTO_BLACKLIST',
      severity: 'HIGH',
      ipAddress,
      details: { violations }
    });
  }
}
```

#### 4. IP Whitelist

**Purpose**: Exempt trusted IPs from rate limiting

**Whitelist Uses**:
- Internal monitoring systems
- API partners
- Load balancers
- CI/CD systems
- Admin IPs

**Configuration**:
```bash
# Environment variable
WHITELISTED_IPS=10.0.0.1,10.0.0.2,192.168.1.100

# Or database
INSERT INTO whitelisted_ips (ip_address, reason, added_by)
VALUES ('10.0.0.1', 'Internal monitoring', 'admin@coindaily.com');
```

### Technical Implementation

#### 1. Rate Limiter Class

Complete implementation in `backend/src/middleware/advanced-rate-limiting.ts` (410 lines).

**Key Methods**:
```typescript
class RateLimiter {
  // Check if request should be allowed
  async checkLimit(
    identifier: string,
    endpoint: string
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }>;
  
  // Get user's rate limit tier
  getUserTier(user: User | null): RateLimitTier;
  
  // Check if IP is blacklisted
  async isBlacklisted(ipAddress: string): Promise<boolean>;
  
  // Check if IP is whitelisted
  async isWhitelisted(ipAddress: string): Promise<boolean>;
  
  // Auto-blacklist after violations
  async autoBlacklist(ipAddress: string): Promise<void>;
}
```

#### 2. Rate Limit Headers

**Response Headers**:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 2025-10-06T12:01:00Z
```

**When Rate Limited**:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-10-06T12:01:00Z

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 45 seconds.",
    "retryAfter": 45
  }
}
```

#### 3. Monitoring Dashboard

**Path**: Dashboard → Security → Rate Limits

**Metrics Shown**:
- Total requests by tier
- Rate limit violations
- Most rate-limited endpoints
- Top violating IPs
- Blacklist size
- Average requests per user

**Real-time Updates**:
```typescript
// WebSocket updates for rate limit events
io.on('connection', (socket) => {
  socket.on('subscribe_rate_limits', () => {
    socket.join('rate-limit-monitor');
  });
});

// Emit on rate limit violation
rateLimiter.on('violation', (event) => {
  io.to('rate-limit-monitor').emit('rate_limit_violation', event);
});
```

### Configuration

#### Creating Custom Rate Limit

**Dashboard**:
1. Navigate to **Security** → **Rate Limits** → **Rules**
2. Click "Create New Rule"
3. Fill in details:
   ```
   Endpoint: /api/custom-endpoint
   Method: POST
   Max Requests: 100
   Time Window: 60000ms (1 minute)
   Status: Active
   ```
4. Save rule

**Programmatically**:
```typescript
await prisma.rateLimitRule.create({
  data: {
    endpoint: '/api/custom-endpoint',
    method: 'POST',
    maxRequests: 100,
    windowMs: 60000,
    status: 'ACTIVE',
    description: 'Custom rate limit for API endpoint'
  }
});
```

### Best Practices

**1. Setting Limits**:
- Start conservative, adjust based on usage
- Different limits for different user types
- Stricter limits for expensive operations
- Consider burst allowance for spiky traffic

**2. Monitoring**:
- Track violation patterns
- Identify legitimate high-volume users
- Adjust limits for false positives
- Regular whitelist review

**3. User Experience**:
- Clear error messages
- Show `Retry-After` header
- Display remaining quota in UI
- Provide upgrade path for premium

---

## 📝 Content Management System

### Overview

Custom-built headless CMS with AI integration for content creation, translation, moderation, and workflow management.

### Key Features

#### 1. AI-Powered Content Generation

**Workflow**:
```
Research → AI Draft → Review → Edit → Translate → Publish
```

**AI Content Agent**:
```typescript
interface ContentGenerationRequest {
  topic: string;
  targetLength: number;       // Words
  tone: 'professional' | 'casual' | 'technical';
  audience: 'beginner' | 'intermediate' | 'expert';
  keywords: string[];
  includeStats: boolean;
  includeSources: boolean;
}

interface GeneratedContent {
  title: string;
  excerpt: string;
  content: string;             // HTML
  metadata: {
    wordCount: number;
    readTime: number;
    keywords: string[];
    sources: string[];
  };
  confidence: number;          // 0-1
  needsReview: boolean;
}
```

**Usage**:
```typescript
const generated = await contentAgent.generate({
  topic: 'Bitcoin price surge in Nigeria',
  targetLength: 800,
  tone: 'professional',
  audience: 'intermediate',
  keywords: ['Bitcoin', 'Nigeria', 'Trading'],
  includeStats: true,
  includeSources: true
});

// Creates draft article
const article = await prisma.article.create({
  data: {
    ...generated,
    status: 'AI_REVIEW',
    authorId: 'system'
  }
});
```

#### 2. Multi-Language Support

**Supported Languages**: 15 African languages
- English (base)
- Swahili
- Yoruba
- Hausa
- Igbo
- Zulu
- Amharic
- Somali
- French (African)
- Portuguese (African)
- Arabic (North African)
- Afrikaans
- Shona
- Oromo
- Kinyarwanda

**Translation Workflow**:
```
1. Create article in English (base language)
2. AI translates to selected languages
3. Human translator reviews
4. Approve and publish translations
```

**Implementation**:
```typescript
// Translate article
const translations = await translationAgent.translateArticle(
  article.id,
  ['sw', 'yo', 'ha', 'ig']  // Swahili, Yoruba, Hausa, Igbo
);

// Store translations
for (const translation of translations) {
  await prisma.articleTranslation.create({
    data: {
      articleId: article.id,
      language: translation.language,
      title: translation.title,
      content: translation.content,
      status: 'PENDING_REVIEW'
    }
  });
}
```

#### 3. Content Moderation

**Moderation Checks**:
- Prohibited content detection
- Spam detection
- Plagiarism check
- Token mention restrictions (unlisted tokens)
- Image content verification

**Penalty System**:
```typescript
interface PenaltyLevel {
  level: 1 | 2 | 3 | 4 | 5;
  action: string;
  duration?: number;
}

const PENALTIES = {
  SPAM: { level: 2, action: 'SUSPEND', duration: 86400000 },      // 24h
  PROHIBITED_CONTENT: { level: 4, action: 'BAN', duration: null }, // Permanent
  UNLISTED_TOKEN: { level: 1, action: 'WARNING', duration: null },
  PLAGIARISM: { level: 3, action: 'SUSPEND', duration: 604800000 } // 7 days
};
```

#### 4. Workflow Management

**Article Statuses**:
- `DRAFT` - Initial creation
- `AI_REVIEW` - Awaiting AI quality check
- `PENDING_REVIEW` - Awaiting human review
- `CHANGES_REQUESTED` - Needs author revisions
- `APPROVED` - Ready to publish
- `PUBLISHED` - Live on platform
- `ARCHIVED` - Removed from public view

**Workflow Transitions**:
```
DRAFT → AI_REVIEW → PENDING_REVIEW → APPROVED → PUBLISHED
                                    ↓
                            CHANGES_REQUESTED → DRAFT
```

**Implementation**:
```typescript
class WorkflowManager {
  async transitionStatus(
    articleId: string,
    newStatus: ArticleStatus,
    userId: string,
    notes?: string
  ) {
    // Validate transition
    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });
    
    if (!this.isValidTransition(article.status, newStatus)) {
      throw new Error('Invalid status transition');
    }
    
    // Update article
    await prisma.article.update({
      where: { id: articleId },
      data: { status: newStatus }
    });
    
    // Log transition
    await prisma.workflowLog.create({
      data: {
        articleId,
        fromStatus: article.status,
        toStatus: newStatus,
        userId,
        notes
      }
    });
    
    // Notify relevant parties
    await this.notifyStatusChange(article, newStatus);
  }
}
```

### Usage Guide

#### Creating Article (Manual)

**Dashboard**:
1. Navigate to **Content** → **Articles**
2. Click "New Article"
3. Fill in details:
   - Title
   - Content (rich text editor)
   - Category
   - Tags
   - Cover image
   - SEO metadata
4. Click "Save Draft"

#### Creating Article (AI-Assisted)

**Dashboard**:
1. Navigate to **Content** → **AI Generator**
2. Enter topic and parameters
3. Click "Generate"
4. Review AI-generated content
5. Edit as needed
6. Save as draft

#### Publishing Workflow

**For Authors**:
1. Create/edit article
2. Submit for review
3. Address feedback if requested
4. Wait for approval

**For Editors**:
1. Review submitted articles
2. Check quality, accuracy, policy compliance
3. Request changes or approve
4. Schedule publication

**For Admins**:
1. Override any status
2. Feature articles
3. Set premium status
4. Manage translations

---

## 📢 Marquee System

### Overview

Modular marquee notification system for displaying important announcements, alerts, and promotional messages to users.

### Key Features

#### 1. Message Management

**Message Properties**:
```typescript
interface MarqueeMessage {
  id: string;
  text: string;
  priority: number;           // 1-10 (higher = more important)
  backgroundColor: string;    // Hex color
  textColor: string;
  duration: number;           // Seconds to display
  visibility: 'ALL' | 'PREMIUM' | 'ANONYMOUS' | 'REGISTERED';
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'PAUSED';
  viewCount: number;
  clickCount: number;
}
```

**Creating Message**:
```typescript
await prisma.marqueeMessage.create({
  data: {
    text: '🎉 New feature: AI-powered market analysis!',
    priority: 8,
    backgroundColor: '#2563eb',
    textColor: '#ffffff',
    duration: 5,
    visibility: 'ALL',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 86400000), // 7 days
    status: 'ACTIVE'
  }
});
```

#### 2. Priority System

**How Priority Works**:
- Messages displayed in priority order (10 → 1)
- Higher priority messages show first
- Equal priority: sort by creation date
- Active messages only

**Priority Guidelines**:
```
10: Critical system alerts (security, downtime)
8-9: Important announcements (new features, policy changes)
5-7: Regular updates (market trends, news)
3-4: Promotional content (premium features)
1-2: Minor notifications (tips, reminders)
```

#### 3. Visibility Control

**Audience Targeting**:
- `ALL`: Everyone (default)
- `PREMIUM`: Premium subscribers only
- `ANONYMOUS`: Unauthenticated users
- `REGISTERED`: Authenticated users

**Use Cases**:
```
PREMIUM: "New exclusive analysis available"
ANONYMOUS: "Sign up for premium features"
REGISTERED: "Complete your profile"
```

#### 4. Analytics

**Tracked Metrics**:
- View count (impressions)
- Click count (engagement)
- Click-through rate (CTR)
- View duration
- Dismissal rate

**Dashboard View**:
```
Message: "New AI feature launch"
Views: 12,543
Clicks: 1,876
CTR: 14.9%
Avg Duration: 4.2s
Dismissals: 3,245 (25.9%)
```

### Technical Implementation

#### 1. Message Selector

```typescript
// backend/src/services/marquee/selector.ts
class MarqueeSelector {
  async getActiveMessages(
    userId?: string,
    userTier?: UserTier
  ): Promise<MarqueeMessage[]> {
    const now = new Date();
    
    // Base query
    let where: any = {
      status: 'ACTIVE',
      startDate: { lte: now },
      endDate: { gte: now }
    };
    
    // Filter by visibility
    if (!userId) {
      where.visibility = { in: ['ALL', 'ANONYMOUS'] };
    } else if (userTier === 'PREMIUM') {
      where.visibility = { in: ['ALL', 'PREMIUM', 'REGISTERED'] };
    } else {
      where.visibility = { in: ['ALL', 'REGISTERED'] };
    }
    
    // Get messages
    return prisma.marqueeMessage.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 5  // Max 5 messages
    });
  }
}
```

#### 2. View Tracking

```typescript
// Track message view
async function trackMarqueeView(messageId: string, userId?: string) {
  // Increment view count
  await prisma.marqueeMessage.update({
    where: { id: messageId },
    data: { viewCount: { increment: 1 } }
  });
  
  // Store individual view (for analytics)
  await prisma.marqueeView.create({
    data: {
      messageId,
      userId,
      viewedAt: new Date()
    }
  });
}

// Track message click
async function trackMarqueeClick(messageId: string, userId?: string) {
  await prisma.marqueeMessage.update({
    where: { id: messageId },
    data: { clickCount: { increment: 1 } }
  });
  
  await prisma.marqueeClick.create({
    data: {
      messageId,
      userId,
      clickedAt: new Date()
    }
  });
}
```

#### 3. Frontend Component

```tsx
// frontend/src/components/Marquee.tsx
export function Marquee() {
  const [messages, setMessages] = useState<MarqueeMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    // Fetch messages
    fetchMessages().then(setMessages);
  }, []);
  
  useEffect(() => {
    if (messages.length === 0) return;
    
    const current = messages[currentIndex];
    
    // Track view
    trackView(current.id);
    
    // Auto-advance after duration
    const timer = setTimeout(() => {
      setCurrentIndex((currentIndex + 1) % messages.length);
    }, current.duration * 1000);
    
    return () => clearTimeout(timer);
  }, [currentIndex, messages]);
  
  if (messages.length === 0) return null;
  
  const current = messages[currentIndex];
  
  return (
    <div
      className="marquee"
      style={{
        backgroundColor: current.backgroundColor,
        color: current.textColor
      }}
      onClick={() => trackClick(current.id)}
    >
      <span>{current.text}</span>
      <button onClick={() => dismissMarquee(current.id)}>
        ×
      </button>
    </div>
  );
}
```

### Usage Guide

#### Creating Marquee Message

**Dashboard**: Settings → Marquee Settings → Create New Message

**API**:
```bash
POST /api/admin/marquee/messages
{
  "text": "🚀 Premium subscriptions now 20% off!",
  "priority": 7,
  "backgroundColor": "#10b981",
  "textColor": "#ffffff",
  "duration": 6,
  "visibility": "ALL",
  "startDate": "2025-10-06T00:00:00Z",
  "endDate": "2025-10-13T23:59:59Z"
}
```

#### Scheduling Messages

**For future campaigns**:
```typescript
await prisma.marqueeMessage.create({
  data: {
    text: 'Black Friday Sale - 50% off Premium!',
    priority: 10,
    backgroundColor: '#000000',
    textColor: '#ffffff',
    duration: 10,
    visibility: 'ALL',
    startDate: new Date('2025-11-29T00:00:00Z'),  // Black Friday
    endDate: new Date('2025-11-30T23:59:59Z'),
    status: 'SCHEDULED'
  }
});
```

Auto-activates on startDate, auto-expires on endDate.

---

## 👑 Super Admin Dashboard

### Overview

Centralized control panel for platform super administrators with real-time monitoring, management tools, and analytics.

### Key Components

#### 1. Overview Stats

**Real-time metrics**:
- Total Users
- Active Sessions
- Today's Registrations
- Security Events (24h)
- Articles Published (24h)
- Revenue (Premium)
- System Health

#### 2. Quick Actions

**One-click access**:
- Block IP Address
- Review Security Event
- Approve Pending Article
- Create Announcement
- Export Audit Logs
- Run System Backup
- Clear Cache

#### 3. Activity Feed

**Recent platform activities**:
- User registrations
- Article publications
- Security events
- Admin actions
- System alerts

#### 4. System Health

**Monitored services**:
- API Status
- Database Connection
- Redis Cache
- Email Service
- AI Services
- Storage (Backblaze)

### Technical Stack

**Frontend**: Next.js + React + TypeScript  
**UI**: Tailwind CSS + Headless UI  
**Charts**: Recharts  
**Real-time**: WebSocket  
**State**: Zustand  

### Features

See [Super Admin User Manual](#) for complete feature documentation.

---

**End of Feature Documentation**

**Version**: 1.0.0  
**Last Updated**: October 6, 2025
