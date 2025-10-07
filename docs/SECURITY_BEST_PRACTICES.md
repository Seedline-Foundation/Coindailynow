# 🔒 Security Best Practices Guide
## CoinDaily Platform - Production Security Guidelines

---

## 📋 Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Input Validation](#input-validation)
3. [CSRF Protection](#csrf-protection)
4. [Rate Limiting](#rate-limiting)
5. [Security Headers](#security-headers)
6. [Session Management](#session-management)
7. [Cryptography](#cryptography)
8. [Error Handling](#error-handling)
9. [Logging & Monitoring](#logging--monitoring)
10. [Deployment Security](#deployment-security)

---

## 🔐 Authentication & Authorization

### Password Security

**DO**:
- ✅ Enforce strong password policy (min 8 chars, uppercase, lowercase, number, special char)
- ✅ Use bcrypt with salt rounds ≥ 12
- ✅ Implement password strength meter
- ✅ Require password change on first login
- ✅ Implement password expiry (90 days for admins)

**DON'T**:
- ❌ Store passwords in plain text
- ❌ Send passwords via email
- ❌ Use weak hashing (MD5, SHA1)
- ❌ Allow common passwords ("password123", "admin")

```typescript
// ✅ GOOD: Strong password validation
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/^(?=.*[a-z])/, 'Must contain lowercase letter')
  .regex(/^(?=.*[A-Z])/, 'Must contain uppercase letter')
  .regex(/^(?=.*\d)/, 'Must contain number')
  .regex(/^(?=.*[@$!%*?&])/, 'Must contain special character');

// ✅ GOOD: Secure password hashing
import bcrypt from 'bcryptjs';
const hashedPassword = await bcrypt.hash(password, 12);

// ❌ BAD: Weak validation
const password = req.body.password; // No validation!
```

### JWT Token Security

**DO**:
- ✅ Use short-lived access tokens (15 minutes)
- ✅ Implement refresh token rotation
- ✅ Store tokens in HttpOnly cookies
- ✅ Include token expiry (exp claim)
- ✅ Validate token signature on every request

**DON'T**:
- ❌ Store tokens in localStorage (XSS vulnerable)
- ❌ Use long-lived access tokens
- ❌ Include sensitive data in JWT payload
- ❌ Skip token expiry validation

```typescript
// ✅ GOOD: Secure JWT configuration
const accessToken = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET!,
  { expiresIn: '15m', algorithm: 'HS256' }
);

res.cookie('accessToken', accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000 // 15 minutes
});

// ❌ BAD: Insecure token storage
res.json({ accessToken }); // Exposed to JavaScript!
```

### Role-Based Access Control (RBAC)

**DO**:
- ✅ Implement principle of least privilege
- ✅ Use middleware for authorization checks
- ✅ Centralize permission logic
- ✅ Audit role changes

**DON'T**:
- ❌ Trust client-side role checks
- ❌ Hardcode permissions in routes
- ❌ Skip authorization checks

```typescript
// ✅ GOOD: Centralized authorization
const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

router.delete('/users/:id',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  deleteUserController
);

// ❌ BAD: Client-side check
if (user.role === 'ADMIN') {
  // Show delete button
}
```

---

## 🛡️ Input Validation

### Schema Validation

**DO**:
- ✅ Validate all user inputs
- ✅ Use schema validation (Zod, Joi)
- ✅ Whitelist approach (allow known good)
- ✅ Validate type, format, length, range

**DON'T**:
- ❌ Trust any user input
- ❌ Use blacklist approach (block known bad)
- ❌ Skip validation for "trusted" inputs

```typescript
// ✅ GOOD: Comprehensive validation
import { z } from 'zod';

const createArticleSchema = z.object({
  title: z.string().min(10).max(200).trim(),
  content: z.string().min(100).max(50000),
  categoryId: z.string().uuid(),
  tags: z.array(z.string().max(50)).max(10),
  isPremium: z.boolean().default(false)
});

router.post('/articles',
  validateSchema(createArticleSchema),
  createArticleController
);

// ❌ BAD: No validation
router.post('/articles', (req, res) => {
  const { title, content } = req.body; // Dangerous!
  await prisma.article.create({ data: { title, content } });
});
```

### SQL Injection Prevention

**DO**:
- ✅ Use parameterized queries (Prisma, TypeORM)
- ✅ Validate input types
- ✅ Use ORM instead of raw SQL
- ✅ Escape special characters if using raw SQL

**DON'T**:
- ❌ Concatenate user input in SQL queries
- ❌ Trust input from any source
- ❌ Use dynamic SQL without sanitization

```typescript
// ✅ GOOD: Parameterized queries (Prisma)
const articles = await prisma.article.findMany({
  where: { title: { contains: searchTerm } }
});

// ✅ GOOD: Input validation before query
const searchTerm = z.string().max(100).parse(req.query.search);

// ❌ BAD: SQL injection vulnerability
const articles = await prisma.$queryRaw`
  SELECT * FROM Article WHERE title LIKE '%${req.query.search}%'
`;
```

### XSS Prevention

**DO**:
- ✅ Sanitize HTML input (DOMPurify)
- ✅ Use Content Security Policy (CSP)
- ✅ Escape output in templates
- ✅ Validate URL schemes (http/https only)

**DON'T**:
- ❌ Insert user input directly into HTML
- ❌ Use `dangerouslySetInnerHTML` without sanitization
- ❌ Trust rich text content

```typescript
// ✅ GOOD: HTML sanitization
import DOMPurify from 'isomorphic-dompurify';

const sanitizedContent = DOMPurify.sanitize(userContent, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
  ALLOWED_ATTR: ['href']
});

// ✅ GOOD: React XSS prevention
<div>{userContent}</div> // Automatically escaped

// ❌ BAD: XSS vulnerability
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

---

## 🔒 CSRF Protection

### Double-Submit Cookie Pattern

**DO**:
- ✅ Generate CSRF token on GET requests
- ✅ Validate token on POST/PUT/DELETE/PATCH
- ✅ Use cryptographically secure tokens
- ✅ Implement token expiry

**DON'T**:
- ❌ Skip CSRF protection on "minor" endpoints
- ❌ Use predictable tokens
- ❌ Accept tokens from URL parameters

```typescript
// ✅ GOOD: CSRF middleware
import { csrfProtection } from './middleware/csrf';

app.use(csrfProtection());

// Frontend: Include CSRF token in requests
fetch('/api/articles', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': getCsrfToken() // From cookie
  },
  body: JSON.stringify(articleData)
});

// ❌ BAD: No CSRF protection
app.post('/api/articles', createArticleController);
```

---

## ⏱️ Rate Limiting

### Endpoint-Specific Limits

**DO**:
- ✅ Implement rate limiting on all public endpoints
- ✅ Use stricter limits for sensitive operations
- ✅ Track by IP and user ID
- ✅ Implement auto-blacklisting for abusers

**DON'T**:
- ❌ Use same limit for all endpoints
- ❌ Skip rate limiting on "internal" APIs
- ❌ Trust X-Forwarded-For header without validation

```typescript
// ✅ GOOD: Endpoint-specific rate limiting
router.post('/auth/login',
  rateLimitMiddleware({ maxRequests: 5, windowMs: 900000 }), // 5 per 15 min
  loginController
);

router.get('/articles',
  rateLimitMiddleware({ maxRequests: 60, windowMs: 60000 }), // 60 per min
  listArticlesController
);

// ❌ BAD: No rate limiting
router.post('/auth/login', loginController);
```

### Brute Force Protection

**DO**:
- ✅ Implement progressive delays
- ✅ Lock accounts after X failed attempts
- ✅ Send alerts on suspicious activity
- ✅ Implement CAPTCHA after failures

**DON'T**:
- ❌ Allow unlimited login attempts
- ❌ Reveal whether user exists in error messages
- ❌ Use weak rate limits (100 attempts/minute)

```typescript
// ✅ GOOD: Account lockout
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
  if (Date.now() - user.lastFailedLogin < LOCKOUT_DURATION) {
    return res.status(429).json({
      error: 'Account temporarily locked',
      retryAfter: Math.ceil((LOCKOUT_DURATION - (Date.now() - user.lastFailedLogin)) / 1000)
    });
  }
}

// ❌ BAD: Generic error message revealing user existence
if (!user) {
  return res.status(401).json({ error: 'User not found' });
}
```

---

## 🔐 Security Headers

### Essential Headers

**DO**:
- ✅ Set Content-Security-Policy (CSP)
- ✅ Enable HTTP Strict Transport Security (HSTS)
- ✅ Set X-Frame-Options: SAMEORIGIN
- ✅ Set X-Content-Type-Options: nosniff
- ✅ Set Referrer-Policy

**DON'T**:
- ❌ Skip security headers in development
- ❌ Use overly permissive CSP
- ❌ Expose server information

```typescript
// ✅ GOOD: Comprehensive security headers
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// ❌ BAD: No security headers
app.get('/', (req, res) => {
  res.send('<html>...</html>');
});
```

---

## 🍪 Session Management

### Secure Cookies

**DO**:
- ✅ Set HttpOnly flag (prevents JavaScript access)
- ✅ Set Secure flag (HTTPS only)
- ✅ Set SameSite=Strict or Lax
- ✅ Regenerate session ID after login
- ✅ Implement session expiry

**DON'T**:
- ❌ Store sensitive data in cookies
- ❌ Use predictable session IDs
- ❌ Allow session fixation

```typescript
// ✅ GOOD: Secure session configuration
res.cookie('sessionId', sessionId, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  signed: true
});

// Regenerate session ID after login
req.session.regenerate((err) => {
  if (err) throw err;
  req.session.userId = user.id;
  res.json({ success: true });
});

// ❌ BAD: Insecure cookie
res.cookie('sessionId', sessionId); // No security flags!
```

---

## 🔑 Cryptography

### Encryption Best Practices

**DO**:
- ✅ Use industry-standard algorithms (AES-256, RSA-2048+)
- ✅ Generate cryptographically secure random values
- ✅ Use unique IVs for each encryption
- ✅ Implement key rotation
- ✅ Store secrets in environment variables

**DON'T**:
- ❌ Roll your own crypto
- ❌ Use weak algorithms (DES, RC4, MD5)
- ❌ Hardcode encryption keys
- ❌ Reuse IVs or salts

```typescript
// ✅ GOOD: Secure encryption
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

// ❌ BAD: Weak encryption
const encrypted = Buffer.from(text).toString('base64'); // Not encrypted!
```

---

## 🚨 Error Handling

### Secure Error Messages

**DO**:
- ✅ Return generic error messages to users
- ✅ Log detailed errors server-side
- ✅ Use error codes instead of messages
- ✅ Sanitize error stack traces

**DON'T**:
- ❌ Expose internal implementation details
- ❌ Return database error messages
- ❌ Include file paths or line numbers
- ❌ Reveal whether user/resource exists

```typescript
// ✅ GOOD: Generic error message
try {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password'
    });
  }
} catch (error) {
  logger.error('Login error', { error, email });
  return res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An error occurred. Please try again.'
  });
}

// ❌ BAD: Exposed error details
} catch (error) {
  return res.status(500).json({
    error: error.message, // Exposes internal details!
    stack: error.stack    // NEVER do this!
  });
}
```

---

## 📊 Logging & Monitoring

### Security Event Logging

**DO**:
- ✅ Log authentication attempts (success/failure)
- ✅ Log authorization failures
- ✅ Log suspicious activities
- ✅ Implement log rotation
- ✅ Send alerts for critical events

**DON'T**:
- ❌ Log sensitive data (passwords, tokens, credit cards)
- ❌ Log PII without encryption
- ❌ Ignore log analysis

```typescript
// ✅ GOOD: Security event logging
logger.security('login_attempt', {
  userId: user.id,
  email: user.email, // Safe to log
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  success: true,
  timestamp: new Date()
});

logger.warn('rate_limit_exceeded', {
  ip: req.ip,
  endpoint: req.path,
  attempts: attempts
});

// ❌ BAD: Logging sensitive data
logger.info('Login attempt', {
  email: user.email,
  password: req.body.password, // NEVER log passwords!
  creditCard: user.creditCard   // NEVER log PII!
});
```

---

## 🚀 Deployment Security

### Production Checklist

**Environment**:
- [ ] Set NODE_ENV=production
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS (Let's Encrypt)
- [ ] Configure firewall rules
- [ ] Disable debug mode

**Dependencies**:
- [ ] Run npm audit
- [ ] Remove dev dependencies in production
- [ ] Pin dependency versions
- [ ] Implement automated security updates

**Monitoring**:
- [ ] Set up error tracking (Sentry)
- [ ] Configure log aggregation
- [ ] Enable real-time alerts
- [ ] Implement health checks
- [ ] Set up uptime monitoring

```bash
# ✅ GOOD: Production build
NODE_ENV=production npm run build
NODE_ENV=production npm start

# Security audit
npm audit
npm audit fix

# Remove dev dependencies
npm prune --production

# ❌ BAD: Development in production
npm run dev # Exposes debug info!
```

---

## 📋 Quick Reference

### Security Middleware Stack (Order Matters)

```typescript
import express from 'express';
import helmet from 'helmet';
import { csrfProtection } from './middleware/csrf';
import { rateLimitMiddleware } from './middleware/rate-limiting';
import { sanitizeInput } from './middleware/input-validation';
import { authenticate } from './middleware/auth';

const app = express();

// 1. Security headers (first!)
app.use(helmet());

// 2. Body parsers
app.use(express.json({ limit: '10mb' }));

// 3. CSRF protection
app.use(csrfProtection());

// 4. Rate limiting
app.use(rateLimitMiddleware());

// 5. Input sanitization
app.use(sanitizeInput());

// 6. Authentication (route-specific)
app.use('/api/*', authenticate);

// 7. Your routes
app.use('/api', routes);
```

### Common Security Patterns

```typescript
// Authentication middleware
export const authenticate = async (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = await getUserById(payload.userId);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Authorization middleware
export const requireRole = (roles: string[]) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

// Input validation
import { z } from 'zod';

export const validateBody = (schema: z.ZodSchema) => {
  return async (req, res, next) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
  };
};
```

---

## 🔗 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Last Updated**: October 6, 2025  
**Maintained By**: CoinDaily Security Team
