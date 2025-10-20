# Authentication & Security Guide

## CoinDaily AI System Authentication & Security

Comprehensive guide for authentication, authorization, and security best practices.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication Methods](#authentication-methods)
3. [JWT Token Management](#jwt-token-management)
4. [API Key Authentication](#api-key-authentication)
5. [Authorization & Permissions](#authorization--permissions)
6. [Security Best Practices](#security-best-practices)
7. [Rate Limiting](#rate-limiting)
8. [CORS Configuration](#cors-configuration)
9. [Encryption & Data Protection](#encryption--data-protection)
10. [Security Monitoring](#security-monitoring)

---

## Overview

The CoinDaily AI System implements multiple layers of security:

- **JWT-based Authentication**: Stateless token-based auth for user sessions
- **API Key Authentication**: For programmatic access and integrations
- **Role-Based Access Control (RBAC)**: Granular permission system
- **Rate Limiting**: Prevent abuse and ensure fair usage
- **Encryption**: Data protection at rest and in transit
- **Audit Logging**: Track all security-sensitive operations
- **IP Whitelisting**: Additional security for sensitive endpoints

---

## Authentication Methods

### 1. JWT Authentication (Primary)

Used for web applications and mobile apps.

#### Login Process

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "token_type": "Bearer",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "role": "premium_user"
  }
}
```

#### Making Authenticated Requests

```http
GET /api/ai/agents
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```javascript
const response = await fetch('https://api.coindaily.com/api/ai/agents', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

### 2. API Key Authentication

Used for server-to-server communication and automated scripts.

#### Generating API Keys

```http
POST /api/auth/api-keys
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "name": "Production Server",
  "permissions": ["read:agents", "write:tasks"],
  "expires_at": "2026-01-01T00:00:00Z"
}
```

**Response:**
```json
{
  "api_key": "ck_live_a1b2c3d4e5f6g7h8i9j0",
  "api_secret": "sk_live_z9y8x7w6v5u4t3s2r1q0p",
  "name": "Production Server",
  "created_at": "2025-10-20T10:00:00Z",
  "expires_at": "2026-01-01T00:00:00Z"
}
```

**⚠️ Security Warning**: Store the `api_secret` securely. It will only be shown once.

#### Using API Keys

```http
GET /api/ai/agents
X-API-Key: ck_live_a1b2c3d4e5f6g7h8i9j0
X-API-Secret: sk_live_z9y8x7w6v5u4t3s2r1q0p
```

```javascript
const response = await fetch('https://api.coindaily.com/api/ai/agents', {
  headers: {
    'X-API-Key': 'ck_live_a1b2c3d4e5f6g7h8i9j0',
    'X-API-Secret': 'sk_live_z9y8x7w6v5u4t3s2r1q0p'
  }
});
```

---

## JWT Token Management

### Token Structure

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.     # Header
eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoi...   # Payload
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV...      # Signature
```

### Decoded Payload

```json
{
  "sub": "user-123",
  "email": "user@example.com",
  "role": "premium_user",
  "permissions": ["read:content", "write:content"],
  "iat": 1729425600,
  "exp": 1729429200
}
```

### Token Expiration

| Token Type | Expiration | Renewal |
|------------|------------|---------|
| Access Token | 1 hour | Via refresh token |
| Refresh Token | 7 days | Via re-authentication |
| API Key | Custom (max 1 year) | Generate new key |

### Refreshing Access Tokens

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

### Token Validation

```typescript
import jwt from 'jsonwebtoken';

function validateToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      console.error('Invalid token');
    }
    return false;
  }
}
```

### Client-Side Token Management

```typescript
class AuthManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  
  async login(email: string, password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    this.setTokens(data.access_token, data.refresh_token);
  }
  
  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }
  
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: this.refreshToken })
    });
    
    if (response.ok) {
      const data = await response.json();
      this.setTokens(data.access_token, this.refreshToken);
    } else {
      // Refresh token expired, need to re-login
      this.logout();
      throw new Error('Session expired');
    }
  }
  
  async makeAuthenticatedRequest(url: string, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (response.status === 401) {
        // Token expired, try refreshing
        await this.refreshAccessToken();
        
        // Retry original request
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${this.accessToken}`
          }
        });
      }
      
      return response;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }
  
  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}
```

---

## API Key Authentication

### API Key Types

1. **Public Key** (`ck_live_...`): Can be used in client-side code
2. **Secret Key** (`sk_live_...`): Must be kept server-side only

### Key Permissions

```typescript
type Permission = 
  | 'read:agents'
  | 'write:agents'
  | 'read:tasks'
  | 'write:tasks'
  | 'read:costs'
  | 'write:costs'
  | 'admin:all';

interface APIKey {
  id: string;
  key: string;
  secret: string;
  name: string;
  permissions: Permission[];
  rate_limit: number;
  last_used_at: string;
  expires_at: string;
}
```

### Managing API Keys

#### List API Keys

```http
GET /api/auth/api-keys
Authorization: Bearer <jwt-token>
```

#### Revoke API Key

```http
DELETE /api/auth/api-keys/{keyId}
Authorization: Bearer <jwt-token>
```

#### Rotate API Key

```http
POST /api/auth/api-keys/{keyId}/rotate
Authorization: Bearer <jwt-token>
```

---

## Authorization & Permissions

### Role-Based Access Control (RBAC)

```typescript
enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  PREMIUM_USER = 'premium_user',
  FREE_USER = 'free_user',
  API_CLIENT = 'api_client'
}

interface Permission {
  resource: string;
  action: 'read' | 'write' | 'delete' | 'admin';
}

const RolePermissions: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    { resource: '*', action: 'admin' }
  ],
  [Role.ADMIN]: [
    { resource: 'agents', action: 'write' },
    { resource: 'tasks', action: 'write' },
    { resource: 'moderation', action: 'admin' },
    { resource: 'audit', action: 'read' }
  ],
  [Role.PREMIUM_USER]: [
    { resource: 'content', action: 'read' },
    { resource: 'tasks', action: 'write' },
    { resource: 'search', action: 'read' }
  ],
  [Role.FREE_USER]: [
    { resource: 'content', action: 'read' },
    { resource: 'search', action: 'read' }
  ],
  [Role.API_CLIENT]: [
    { resource: 'tasks', action: 'write' },
    { resource: 'agents', action: 'read' }
  ]
};
```

### Permission Checking Middleware

```typescript
import { Request, Response, NextFunction } from 'express';

function requirePermission(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // Set by authentication middleware
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const hasPermission = checkPermission(user.role, resource, action);
    
    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: `${action}:${resource}`
      });
    }
    
    next();
  };
}

function checkPermission(role: Role, resource: string, action: string): boolean {
  const permissions = RolePermissions[role];
  
  return permissions.some(p => 
    (p.resource === '*' || p.resource === resource) &&
    (p.action === 'admin' || p.action === action)
  );
}

// Usage
app.get('/api/ai/agents', 
  authenticateUser,
  requirePermission('agents', 'read'),
  getAgents
);

app.post('/api/ai/agents',
  authenticateUser,
  requirePermission('agents', 'write'),
  createAgent
);
```

### Resource-Level Permissions

```typescript
// Check if user can access specific resource
async function canAccessResource(
  userId: string, 
  resourceType: string, 
  resourceId: string
): Promise<boolean> {
  // Check ownership
  const resource = await db[resourceType].findUnique({
    where: { id: resourceId }
  });
  
  if (!resource) return false;
  
  // User owns the resource
  if (resource.userId === userId) return true;
  
  // Check team/organization access
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { organization: true }
  });
  
  if (resource.organizationId === user.organizationId) return true;
  
  // Check shared access
  const sharedAccess = await db.sharedAccess.findFirst({
    where: {
      resourceType,
      resourceId,
      userId
    }
  });
  
  return !!sharedAccess;
}
```

---

## Security Best Practices

### 1. Never Expose Sensitive Data

```typescript
// ❌ Bad: Exposing sensitive fields
app.get('/api/users/:id', async (req, res) => {
  const user = await db.user.findUnique({
    where: { id: req.params.id }
  });
  res.json(user); // Contains password hash, API keys, etc.
});

// ✅ Good: Select only safe fields
app.get('/api/users/:id', async (req, res) => {
  const user = await db.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    }
  });
  res.json(user);
});
```

### 2. Hash Passwords Properly

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 3. Validate All Input

```typescript
import { z } from 'zod';

const CreateAgentSchema = z.object({
  name: z.string().min(3).max(100),
  type: z.enum(['content_generation', 'translation', 'image_generation']),
  model: z.string(),
  config: z.object({}).passthrough()
});

app.post('/api/ai/agents', async (req, res) => {
  try {
    const validated = CreateAgentSchema.parse(req.body);
    // Proceed with validated data
  } catch (error) {
    return res.status(400).json({ error: 'Invalid input', details: error });
  }
});
```

### 4. Prevent SQL Injection

```typescript
// ❌ Bad: String concatenation
const result = await db.$queryRaw`
  SELECT * FROM users WHERE email = '${userInput}'
`;

// ✅ Good: Parameterized queries
const result = await db.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput}
`;
```

### 5. Use HTTPS Everywhere

```typescript
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

### 6. Set Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.coindaily.com"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 7. Implement CSRF Protection

```typescript
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

app.use(cookieParser());
app.use(csrf({ cookie: true }));

app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

---

## Rate Limiting

### Implementation

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

const limiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate-limit:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many requests',
    retryAfter: '60 seconds'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  // Custom handler
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});

app.use('/api/', limiter);
```

### Tier-Based Rate Limiting

```typescript
const rateLimitByTier = (req: Request, res: Response, next: NextFunction) => {
  const tier = req.user?.subscriptionTier || 'free';
  
  const limits = {
    free: 100,
    premium: 500,
    enterprise: 2000
  };
  
  const userLimit = limits[tier];
  
  const userLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: userLimit,
    keyGenerator: (req) => req.user.id
  });
  
  return userLimiter(req, res, next);
};
```

---

## CORS Configuration

```typescript
import cors from 'cors';

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://coindaily.com',
      'https://www.coindaily.com',
      'https://admin.coindaily.com'
    ];
    
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000');
    }
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-API-Secret'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

---

## Encryption & Data Protection

### Encrypting Sensitive Data

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

function decrypt(encrypted: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Usage
const apiKey = 'sk_live_secret_key_123';
const encrypted = encrypt(apiKey);

// Store in database
await db.apiKey.create({
  data: {
    userId: user.id,
    encryptedKey: encrypted.encrypted,
    iv: encrypted.iv,
    tag: encrypted.tag
  }
});

// Retrieve and decrypt
const stored = await db.apiKey.findUnique({ where: { id } });
const decryptedKey = decrypt(stored.encryptedKey, stored.iv, stored.tag);
```

---

## Security Monitoring

### Audit Logging

```typescript
async function logSecurityEvent(event: {
  type: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  resource?: string;
  action?: string;
  success: boolean;
  details?: any;
}) {
  await db.securityLog.create({
    data: {
      ...event,
      timestamp: new Date()
    }
  });
  
  // Alert on suspicious activity
  if (event.type === 'multiple_failed_logins') {
    await sendSecurityAlert(event);
  }
}

// Middleware to log all requests
app.use((req, res, next) => {
  res.on('finish', () => {
    logSecurityEvent({
      type: 'api_request',
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      resource: req.path,
      action: req.method,
      success: res.statusCode < 400
    });
  });
  next();
});
```

### Detecting Suspicious Activity

```typescript
async function detectSuspiciousActivity(userId: string): Promise<boolean> {
  const recentLogs = await db.securityLog.findMany({
    where: {
      userId,
      timestamp: {
        gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
      }
    }
  });
  
  // Multiple failed login attempts
  const failedLogins = recentLogs.filter(
    log => log.type === 'login' && !log.success
  ).length;
  
  if (failedLogins >= 5) return true;
  
  // Requests from multiple IPs
  const uniqueIPs = new Set(recentLogs.map(log => log.ipAddress));
  if (uniqueIPs.size >= 5) return true;
  
  // High request rate
  if (recentLogs.length > 500) return true;
  
  return false;
}
```

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [CoinDaily Security Policy](https://coindaily.com/security)

---

**Last Updated**: October 20, 2025  
**Version**: 1.0.0  
**Status**: Production Ready
