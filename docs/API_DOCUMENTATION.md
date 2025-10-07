# 📚 CoinDaily Platform - API Documentation

**Version**: 1.0.0  
**Last Updated**: October 6, 2025  
**Base URL**: `https://api.coindaily.com/v1`  
**Environment**: Production

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Core Endpoints](#core-endpoints)
4. [Super Admin Endpoints](#super-admin-endpoints)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Webhooks](#webhooks)

---

## 🚀 Getting Started

### API Overview

The CoinDaily API is organized around REST principles. It uses predictable resource-oriented URLs, accepts JSON-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes, authentication, and verbs.

### Base URLs

- **Production**: `https://api.coindaily.com/v1`
- **Staging**: `https://staging-api.coindaily.com/v1`
- **Development**: `http://localhost:4000/api`

### Request Format

All API requests must:
- Use HTTPS (production)
- Include `Content-Type: application/json` header
- Include authentication token (except public endpoints)
- Include CSRF token for state-changing operations

### Response Format

All API responses return JSON in the following format:

**Success Response**:
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2025-10-06T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**Error Response**:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2025-10-06T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

---

## 🔐 Authentication

### Overview

CoinDaily API uses JWT (JSON Web Tokens) for authentication. Tokens are issued upon successful login and must be included in subsequent requests.

### Authentication Flow

```mermaid
sequenceDiagram
    Client->>API: POST /auth/login
    API->>Client: Access Token + Refresh Token
    Client->>API: GET /users/me (with Access Token)
    API->>Client: User Data
    Note: Access Token expires in 15 minutes
    Client->>API: POST /auth/refresh (with Refresh Token)
    API->>Client: New Access Token
```

### Endpoints

#### 1. Register

**POST** `/auth/register`

Register a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Validation Rules**:
- Email: Valid email format, unique
- Password: Min 8 chars, must include uppercase, lowercase, number, special char
- Username: 3-30 chars, alphanumeric + underscores/hyphens

**Response** `201 Created`:
```json
{
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "USER",
      "createdAt": "2025-10-06T12:00:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    }
  }
}
```

**Errors**:
- `400 VALIDATION_ERROR` - Invalid input data
- `409 EMAIL_EXISTS` - Email already registered
- `429 RATE_LIMIT_EXCEEDED` - Too many registration attempts

#### 2. Login

**POST** `/auth/login`

Authenticate and receive access tokens.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** `200 OK`:
```json
{
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "USER",
      "isPremium": false
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    }
  }
}
```

**Rate Limit**: 5 attempts per 15 minutes per IP

**Errors**:
- `401 INVALID_CREDENTIALS` - Invalid email or password
- `423 ACCOUNT_LOCKED` - Account temporarily locked (too many failed attempts)
- `429 RATE_LIMIT_EXCEEDED` - Too many login attempts

#### 3. Refresh Token

**POST** `/auth/refresh`

Get a new access token using refresh token.

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response** `200 OK`:
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

**Errors**:
- `401 INVALID_TOKEN` - Invalid or expired refresh token
- `401 TOKEN_REVOKED` - Token has been revoked

#### 4. Logout

**POST** `/auth/logout`

Invalidate current tokens and end session.

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response** `200 OK`:
```json
{
  "data": {
    "message": "Successfully logged out"
  }
}
```

### Using Access Tokens

Include the access token in the `Authorization` header:

```http
GET /api/users/me HTTP/1.1
Host: api.coindaily.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Token Expiry**:
- Access Token: 15 minutes
- Refresh Token: 7 days

---

## 📰 Core Endpoints

### Articles

#### 1. List Articles

**GET** `/articles`

Retrieve a paginated list of articles.

**Query Parameters**:
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page
- `category` (string) - Filter by category ID
- `status` (string) - Filter by status (DRAFT, PUBLISHED, ARCHIVED)
- `isPremium` (boolean) - Filter by premium status
- `search` (string) - Search by title or content
- `sort` (string) - Sort field (createdAt, publishedAt, viewCount)
- `order` (string) - Sort order (asc, desc)

**Response** `200 OK`:
```json
{
  "data": {
    "articles": [
      {
        "id": "art_abc123",
        "title": "Bitcoin Surges to New High in Africa",
        "slug": "bitcoin-surges-africa",
        "excerpt": "Bitcoin reaches record levels...",
        "coverImage": "https://cdn.coindaily.com/images/...",
        "author": {
          "id": "usr_xyz789",
          "username": "cryptowriter",
          "avatar": "https://cdn.coindaily.com/avatars/..."
        },
        "category": {
          "id": "cat_123",
          "name": "Market Analysis",
          "slug": "market-analysis"
        },
        "tags": ["Bitcoin", "Africa", "Trading"],
        "viewCount": 1543,
        "commentCount": 28,
        "isPremium": false,
        "publishedAt": "2025-10-05T14:30:00Z",
        "createdAt": "2025-10-05T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 245,
      "totalPages": 13,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**Cache**: 5 minutes

#### 2. Get Article by ID

**GET** `/articles/:id`

Retrieve a single article by ID or slug.

**Response** `200 OK`:
```json
{
  "data": {
    "article": {
      "id": "art_abc123",
      "title": "Bitcoin Surges to New High in Africa",
      "slug": "bitcoin-surges-africa",
      "content": "<p>Full article content...</p>",
      "excerpt": "Bitcoin reaches record levels...",
      "coverImage": "https://cdn.coindaily.com/images/...",
      "author": {
        "id": "usr_xyz789",
        "username": "cryptowriter",
        "firstName": "John",
        "lastName": "Doe",
        "avatar": "https://cdn.coindaily.com/avatars/...",
        "bio": "Crypto journalist since 2020"
      },
      "category": {
        "id": "cat_123",
        "name": "Market Analysis",
        "slug": "market-analysis"
      },
      "tags": ["Bitcoin", "Africa", "Trading"],
      "viewCount": 1543,
      "commentCount": 28,
      "readTime": 5,
      "isPremium": false,
      "metadata": {
        "metaTitle": "Bitcoin Surges...",
        "metaDescription": "...",
        "ogImage": "https://..."
      },
      "publishedAt": "2025-10-05T14:30:00Z",
      "createdAt": "2025-10-05T12:00:00Z",
      "updatedAt": "2025-10-05T14:30:00Z"
    },
    "related": [
      {
        "id": "art_def456",
        "title": "Ethereum Updates in Kenya",
        "slug": "ethereum-kenya",
        "excerpt": "...",
        "coverImage": "..."
      }
    ]
  }
}
```

**Errors**:
- `404 NOT_FOUND` - Article not found
- `403 PREMIUM_REQUIRED` - Premium subscription required

#### 3. Create Article

**POST** `/articles`

Create a new article (authenticated, author role required).

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
X-CSRF-Token: abc123...
```

**Request Body**:
```json
{
  "title": "New Article Title",
  "content": "<p>Full article content in HTML</p>",
  "excerpt": "Short description...",
  "coverImage": "https://cdn.coindaily.com/images/...",
  "categoryId": "cat_123",
  "tags": ["Bitcoin", "News"],
  "isPremium": false,
  "status": "DRAFT",
  "metadata": {
    "metaTitle": "SEO title",
    "metaDescription": "SEO description"
  }
}
```

**Response** `201 Created`:
```json
{
  "data": {
    "article": {
      "id": "art_new123",
      "title": "New Article Title",
      "slug": "new-article-title",
      "status": "DRAFT",
      "createdAt": "2025-10-06T12:00:00Z"
    }
  }
}
```

**Rate Limit**: 10 requests per minute

**Errors**:
- `400 VALIDATION_ERROR` - Invalid input
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Insufficient permissions
- `429 RATE_LIMIT_EXCEEDED`

---

## 👑 Super Admin Endpoints

### Security Dashboard

#### 1. Get Security Metrics

**GET** `/admin/security/metrics`

Retrieve security metrics and statistics.

**Auth**: Super Admin only

**Query Parameters**:
- `period` (string) - Time period: `24h`, `7d`, `30d` (default: `24h`)
- `timezone` (string) - Timezone (default: `UTC`)

**Response** `200 OK`:
```json
{
  "data": {
    "metrics": {
      "totalEvents": 1543,
      "criticalEvents": 5,
      "highSeverityEvents": 23,
      "activeThreats": 2,
      "blockedIPs": 12,
      "failedLoginAttempts": 87,
      "rateLimitViolations": 234,
      "suspiciousActivities": 15
    },
    "timeline": [
      {
        "timestamp": "2025-10-06T12:00:00Z",
        "events": 45,
        "threats": 1
      }
    ],
    "topThreats": [
      {
        "type": "BRUTE_FORCE_LOGIN",
        "count": 34,
        "severity": "HIGH"
      },
      {
        "type": "SQL_INJECTION_ATTEMPT",
        "count": 12,
        "severity": "CRITICAL"
      }
    ]
  }
}
```

**Cache**: 60 seconds

#### 2. Get Recent Security Events

**GET** `/admin/security/events`

List recent security events with filtering.

**Query Parameters**:
- `page` (integer)
- `limit` (integer, max: 100)
- `severity` (string) - Filter: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `eventType` (string) - Event type
- `status` (string) - `PENDING`, `REVIEWED`, `RESOLVED`
- `startDate` (ISO date)
- `endDate` (ISO date)

**Response** `200 OK`:
```json
{
  "data": {
    "events": [
      {
        "id": "evt_abc123",
        "eventType": "FAILED_LOGIN_ATTEMPT",
        "severity": "MEDIUM",
        "ipAddress": "192.168.1.100",
        "userId": "usr_xyz789",
        "userAgent": "Mozilla/5.0...",
        "details": {
          "email": "user@example.com",
          "attemptCount": 3
        },
        "status": "PENDING",
        "createdAt": "2025-10-06T11:45:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

#### 3. Block IP Address

**POST** `/admin/security/blacklist`

Add an IP address to the blacklist.

**Request Body**:
```json
{
  "ipAddress": "192.168.1.100",
  "reason": "Multiple brute force attempts",
  "duration": 86400000,
  "notes": "Blocked after 10 failed login attempts"
}
```

**Response** `201 Created`:
```json
{
  "data": {
    "blacklist": {
      "id": "blk_abc123",
      "ipAddress": "192.168.1.100",
      "reason": "Multiple brute force attempts",
      "expiresAt": "2025-10-07T12:00:00Z",
      "createdAt": "2025-10-06T12:00:00Z"
    }
  }
}
```

### Audit Logs

#### 1. Get Audit Logs

**GET** `/admin/audit/logs`

Retrieve system audit logs.

**Query Parameters**:
- `page`, `limit`
- `action` (string) - Filter by action type
- `userId` (string) - Filter by user
- `category` (string) - `USER_MANAGEMENT`, `CONTENT`, `SECURITY`, `SYSTEM`
- `result` (string) - `SUCCESS`, `FAILURE`
- `startDate`, `endDate`

**Response** `200 OK`:
```json
{
  "data": {
    "logs": [
      {
        "id": "log_abc123",
        "action": "USER_ROLE_CHANGED",
        "category": "USER_MANAGEMENT",
        "userId": "usr_admin1",
        "targetUserId": "usr_xyz789",
        "details": {
          "oldRole": "USER",
          "newRole": "AUTHOR"
        },
        "ipAddress": "10.0.0.1",
        "result": "SUCCESS",
        "timestamp": "2025-10-06T11:30:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

### Rate Limiting Management

#### 1. Get Rate Limit Rules

**GET** `/admin/rate-limits/rules`

List all rate limit rules.

**Response** `200 OK`:
```json
{
  "data": {
    "rules": [
      {
        "id": "rl_abc123",
        "endpoint": "/api/auth/login",
        "maxRequests": 5,
        "windowMs": 900000,
        "status": "ACTIVE",
        "createdAt": "2025-10-01T00:00:00Z"
      }
    ]
  }
}
```

#### 2. Create Rate Limit Rule

**POST** `/admin/rate-limits/rules`

Create a new rate limiting rule.

**Request Body**:
```json
{
  "endpoint": "/api/custom-endpoint",
  "maxRequests": 100,
  "windowMs": 60000,
  "description": "Custom rate limit for API endpoint"
}
```

---

## ⚠️ Error Handling

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request |
| 201 | Created | Resource created |
| 204 | No Content | Successful, no content returned |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Temporary unavailability |

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-10-06T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `INVALID_CREDENTIALS` - Wrong email/password
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error
- `CSRF_TOKEN_INVALID` - Invalid CSRF token
- `TOKEN_EXPIRED` - Access token expired

---

## 🚦 Rate Limiting

### Rate Limit Headers

Every API response includes rate limit information:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 2025-10-06T12:01:00Z
```

### Rate Limits by Endpoint

| Endpoint | Anonymous | User | Premium | Admin |
|----------|-----------|------|---------|-------|
| `/auth/login` | 5/15min | - | - | - |
| `/auth/register` | 3/hour | - | - | - |
| `/articles` | 60/min | 60/min | 300/min | 1000/min |
| `/articles/:id` | 60/min | 60/min | 300/min | 1000/min |
| `/comments` | 10/min | 10/min | 30/min | 100/min |
| `/search` | 20/min | 20/min | 60/min | 200/min |

### Handling Rate Limits

When rate limited (429 status), check the `Retry-After` header:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-10-06T12:01:00Z
```

---

## 🔔 Webhooks

### Overview

Webhooks allow you to receive real-time notifications about events in your CoinDaily account.

### Event Types

- `article.published` - New article published
- `comment.created` - New comment added
- `user.registered` - New user registered
- `security.threat_detected` - Security threat detected

### Webhook Payload

```json
{
  "id": "evt_abc123",
  "type": "article.published",
  "data": {
    "article": {
      "id": "art_abc123",
      "title": "New Article",
      "publishedAt": "2025-10-06T12:00:00Z"
    }
  },
  "timestamp": "2025-10-06T12:00:00Z",
  "signature": "sha256=abc123..."
}
```

### Verifying Webhooks

Verify webhook signatures using your webhook secret:

```typescript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

---

## 📚 Additional Resources

- [API Status Page](https://status.coindaily.com)
- [API Changelog](https://docs.coindaily.com/changelog)
- [Support](https://support.coindaily.com)
- [Community Forum](https://community.coindaily.com)

---

**Need Help?**  
Contact our support team at api@coindaily.com or visit our [Help Center](https://help.coindaily.com).

---

**Last Updated**: October 6, 2025  
**API Version**: 1.0.0
